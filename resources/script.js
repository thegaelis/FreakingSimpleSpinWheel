const canvas = document.getElementById('wheel');
const ctx = canvas.getContext('2d');
const spinBtn = document.getElementById('spinBtn');
const modal = document.getElementById('modal');
const modalResult = document.getElementById('modalResult');
const closeModal = document.getElementById('closeModal');
const removeResult = document.getElementById('removeResult');
const namesInput = document.getElementById('namesInput');
const resetBtn = document.getElementById('resetBtn');
const shuffleBtn = document.getElementById('shuffleBtn'); // Shuffle button
const sortBtn = document.getElementById('sortBtn'); // Sort button
const startInput = document.getElementById('startInput'); // Start input field
const endInput = document.getElementById('endInput'); // End input field
const prefixInput = document.getElementById('prefixInput'); // Prefix input field
const setBtn = document.getElementById('setBtn'); // Set button
const duplicateBtn = document.getElementById('duplicateBtn'); // Duplicate button

// Load the tick sound
const tickSound = new Audio('./resources/tick.mp3');
const congratulationsSound = new Audio('./resources/congratulations.mp3');

// Variable to track sort state
let isSortedAsc = true;

// Function to shuffle array (Fisher-Yates Shuffle)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]]; // Swap elements
    }
    return array;
}

// Function to sort array
function sortArray(array) {
    if (isSortedAsc) {
        // First time sort A-Z, 1-10
        array.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    } else {
        // Next time sort Z-A, 10-1
        array.sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
    }
    isSortedAsc = !isSortedAsc; // Reverse sort state
    return array;
}

// Function to load names from localStorage or namesInput
function loadNames() {
    const pParam = getParameterByName('p');
    if (pParam !== null) {
        const pValue = parseInt(pParam);
        if (!isNaN(pValue) && pValue > 0) {
            return Array.from({ length: pValue }, (_, i) => (i + 1).toString());
        }
    }

    const storedNames = JSON.parse(localStorage.getItem('namesList'));
    const inputNames = namesInput.value.split('\n').filter(name => name.trim() !== '').map(String);
    if (inputNames.length > 0) {
        return inputNames;
    } else if (storedNames && storedNames.length > 0) {
        return storedNames.map(String);
    } else {
        return Array.from({ length: 20 }, (_, i) => (i + 1).toString());
    }
}

// Initialize names
let names = loadNames();
const segmentAngle = (2 * Math.PI) / names.length;
let currentAngle = 0;
let isSpinning = false;
let spinDuration = 10000; // Spin duration in milliseconds
const segmentColors = [];

// Function to save names to localStorage
function saveNamesToLocalStorage() {
    localStorage.setItem('namesList', JSON.stringify(names));
}

// Function to generate a random distinct color using HSL
function getDistinctColor(index) {
    const hue = (360 / names.length) * index;
    const saturation = 70 + Math.random() * 30;
    const lightness = 40 + Math.random() * 20;
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

// Initialize segment colors ensuring they are distinct
function initializeSegmentColors() {
    segmentColors.length = 0;
    for (let i = 0; i < names.length; i++) {
        segmentColors.push(getDistinctColor(i));
    }
}

// Function to determine if a color is light or dark
function isLightColor(color) {
    const rgb = color.match(/\d+/g).map(Number);
    const r = rgb[0];
    const g = rgb[1];
    const b = rgb[2];
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b);
    return luminance > 186;
}

// Draw the wheel
function drawWheel() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const numSegments = names.length;
    const segmentAngle = (2 * Math.PI) / numSegments;

    for (let i = 0; i < numSegments; i++) {
        ctx.beginPath();
        ctx.moveTo(300, 300);
        ctx.arc(300, 300, 300, i * segmentAngle, (i + 1) * segmentAngle);
        ctx.fillStyle = segmentColors[i];
        ctx.fill();
        ctx.stroke();

        ctx.save();
        ctx.translate(300, 300);
        ctx.rotate((i + 0.5) * segmentAngle);
        ctx.textAlign = 'center';
        ctx.fillStyle = isLightColor(segmentColors[i]) ? '#000' : '#fff';
        ctx.font = 'bold 30px Arial';  // Make text bold and increase size (to 26px)
        ctx.fillText(names[i], 250, 10);
        ctx.restore();
    }
}

// Spin the wheel
function spinWheel() {
    if (names.length < 2) {
        alert("Please enter at least 2 names to spin the wheel.");
        return;
    }
    spinDuration = Math.floor(Math.random() * (13000 - 5000 + 1)) + 10000;
    console.log("Spinning the wheel with duration:", spinDuration);
    if (isSpinning) return;
    isSpinning = true;

    const extraRotation = Math.random() * 360;
    const fullRotations = Math.floor(Math.random() * 3) + 4;
    const randomSpin = (fullRotations * 360) + extraRotation;
    const startTime = performance.now();

    function animateSpin(time) {
        const elapsedTime = time - startTime;
        const rotation = easeOut(elapsedTime, 0, randomSpin, spinDuration);
        currentAngle = rotation % 360;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.translate(300, 300);
        ctx.rotate((currentAngle * Math.PI) / 180);
        ctx.translate(-300, -300);
        drawWheel();
        ctx.restore();

        const angleInDegrees = currentAngle % 360;
        const segmentBorderAngle = 360 / names.length;

        for (let i = 0; i < names.length; i++) {
            if (Math.abs(angleInDegrees - (i * segmentBorderAngle)) < 1) {
                tickSound.currentTime = 0;
                tickSound.play();
            }
        }

        if (elapsedTime < spinDuration) {
            requestAnimationFrame(animateSpin);
        } else {
            isSpinning = false;
            const adjustedAngle = (360 - currentAngle + (segmentAngle / 2)) % 360;
            const winningIndex = Math.floor(adjustedAngle / (360 / names.length)) % names.length;

            modalResult.innerHTML = `The winner is:<br><span style="font-size: 70px; font-weight: bold; color: red;">${names[winningIndex]}</span>`;            
            modal.style.display = 'block';
            congratulationsSound.currentTime = 0;
            congratulationsSound.play();
        }
    }

    requestAnimationFrame(animateSpin);
}

// Easing function for deceleration
function easeOut(t, b, c, d) {
    t /= d;
    t--;
    return c * (t * t * t * t * t + 1) + b;
}

function getParameterByName(name, url = window.location.href) {
    name = name.replace(/[\[\]]/g, '\\$&');
    var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

// Đóng modal
closeModal.addEventListener('click', (event) => {
    event.preventDefault();
    modal.style.display = 'none';
});

removeResult.addEventListener('click', (event) => {
    event.preventDefault();
    const winnerText = modalResult.innerHTML.split('<br>')[1];
    const winner = winnerText.replace(/<\/?[^>]+(>|$)/g, "").trim();
    console.log("Removing one instance of winner:", winner);
    
    const index = names.findIndex(name => {
        if (typeof name !== 'string') {
            name = String(name);
        }
        return name.trim() === winner.trim();
    });
    
    if (index !== -1) {
        names.splice(index, 1);
        console.log("Winner removed. Updated names:", names);
        saveNamesToLocalStorage();
        updateNamesInput();
        initializeSegmentColors();
        drawWheel();
        modal.style.display = 'none';
    } else {
        console.log("Winner not found in the list");
    }
});

removeDuplicateResult.addEventListener('click', (event) => {
    event.preventDefault();
    const winnerText = modalResult.innerHTML.split('<br>')[1];
    const winner = winnerText.replace(/<\/?[^>]+(>|$)/g, "").trim();
    console.log("Removing all instances of winner:", winner);
    
    names = names.filter(name => {
        if (typeof name !== 'string') {
            name = String(name);
        }
        return name.trim() !== winner.trim();
    });
    
    console.log("Updated names after removing all instances:", names);
    saveNamesToLocalStorage();
    updateNamesInput();
    initializeSegmentColors();
    drawWheel();
    modal.style.display = 'none';
});

// Update names from input
function updateNamesFromInput() {
    names = namesInput.value.split('\n').filter(name => name.trim() !== '');
    saveNamesToLocalStorage();
    initializeSegmentColors();
    drawWheel();
}

// Update input from current names
function updateNamesInput() {
    namesInput.value = names.join('\n');
}

// Event listener for input changes
namesInput.addEventListener('input', updateNamesFromInput);

// Shuffle button functionality
shuffleBtn.addEventListener('click', () => {
    names = shuffleArray(names); // Shuffle the names array
    saveNamesToLocalStorage();   // Save shuffled names to localStorage
    updateNamesInput();          // Update the textarea
    initializeSegmentColors();   // Reinitialize segment colors
    drawWheel();                 // Redraw the wheel
});

// Sort button functionality
sortBtn.addEventListener('click', () => {
    names = sortArray(names);    // Sort the names array
    saveNamesToLocalStorage();   // Save sorted names to localStorage
    updateNamesInput();          // Update the textarea
    initializeSegmentColors();   // Reinitialize segment colors
    drawWheel();                 // Redraw the wheel
});

// Reset names
resetBtn.addEventListener('click', (event) => {
    event.preventDefault(); // Prevent form submission
    namesInput.value = '';
    names = [];
    saveNamesToLocalStorage();
    initializeSegmentColors();
    drawWheel();
});

// Spin button event
spinBtn.addEventListener('click', (event) => {
    event.preventDefault(); // Prevent form submission
    spinWheel();
});

duplicateBtn.addEventListener('click', (event) => {
    event.preventDefault(); // Prevent form submission
    
    const start = startInput.value.trim();
    const end = endInput.value.trim();
    const prefix = prefixInput.value.trim();

    if (start === '' && end === '' && prefix === '') {
        // If all fields are empty, duplicate all names in namesInput
        const currentNames = namesInput.value.split('\n').filter(name => name.trim() !== '');
        names = [...names, ...currentNames]; // Add current names to the end of the list
    } else {
        // Original functionality for when fields are not empty
        const startNum = parseInt(start);
        const endNum = parseInt(end);

        if (!isNaN(startNum) && !isNaN(endNum) && startNum <= endNum) {
            const newNames = [];

            // Add names from start to end to the newNames array
            for (let i = startNum; i <= endNum; i++) {
                const name = `${prefix} ${i}`;
                newNames.push(name); // Add name to the list
            }

            newNames.push(...newNames); // Duplicate names

            names = [...names, ...newNames]; // Add new names to the list without removing duplicates
        } else {
            alert("Please enter valid start and end values or leave all fields empty to duplicate existing names.");
            return;
        }
    }

    saveNamesToLocalStorage(); // Save names to localStorage
    updateNamesInput();        // Update textarea
    initializeSegmentColors(); // Reinitialize segment colors
    drawWheel();               // Redraw the wheel
});

setBtn.addEventListener('click', (event) => {
    event.preventDefault(); // Prevent form submission
    const start = parseInt(startInput.value);
    const end = parseInt(endInput.value);
    const prefix = prefixInput.value;

    if (!isNaN(start) && !isNaN(end) && start <= end) {
        const newNames = [];

        // Add names from start to end to the newNames array
        for (let i = start; i <= end; i++) {
            const name = `${prefix} ${i}`;
            newNames.push(name); // Add name to the list
        }

        names = [...names, ...newNames]; // Add new names to the list without removing duplicates
        saveNamesToLocalStorage(); // Save names to localStorage
        updateNamesInput();        // Update textarea
        initializeSegmentColors(); // Reisnitialize segment colors
        drawWheel();               // Redraw the wheel
    } else {
        alert("Please enter valid start and end values.");
    }
});

window.onload = function() {
    names = loadNames();
    updateNamesInput();
    initializeSegmentColors();
    drawWheel();
};


// Initialize
names = loadNames();
updateNamesInput();
initializeSegmentColors();
drawWheel();

const colors = ['#FF5733', '#33FF57', '#3357FF', '#F333FF', '#33FFF6', '#F6FF33', '#FF3333', '#33FFB2', '#FFA533'];

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function generateRandomLevel() {
    const allColors = colors.flatMap(color => Array(4).fill(color));
    const shuffledColors = shuffleArray(allColors.slice());
    const bottles = Array.from({ length: 9 }, (_, i) => shuffledColors.slice(i * 4, (i + 1) * 4));
    bottles.push([], []);
    return bottles;
}

// Generate initial levels on demand
let levels = [];
function ensureLevels(count) {
    while (levels.length < count) {
        levels.push(generateRandomLevel());
    }
}

let currentLevel = 0;
let bottles = structuredClone(levels[currentLevel]);

const colorChosenSound = new Audio('tom-3.mp3');
const bottleFilledSound = new Audio('tom-4.mp3');

function createBottle(index) {
    const bottle = document.createElement('div');
    bottle.classList.add('bottle');
    bottle.dataset.index = index;

    bottles[index].forEach(color => {
        const colorDiv = document.createElement('div');
        colorDiv.classList.add('color');
        colorDiv.style.backgroundColor = color;
        bottle.appendChild(colorDiv);
    });

    bottle.addEventListener('click', () => selectBottle(index));
    return bottle;
}

function render() {
    const gameDiv = document.getElementById('game');
    gameDiv.innerHTML = '';
    bottles.forEach((_, index) => {
        gameDiv.appendChild(createBottle(index));
    });

    document.getElementById('level-display').textContent = `Level ${currentLevel + 1}`;
    document.getElementById('next-level').disabled = !checkWinCondition();
}

let selectedBottle = null;
let isProcessing = false;

function selectBottle(index) {
    if (isProcessing) return;
    if (selectedBottle === null) {
        selectedBottle = index;
        colorChosenSound.play();
    } else {
        isProcessing = true;
        pourLiquid(selectedBottle, index);
        selectedBottle = null;
        setTimeout(() => isProcessing = false, 500); // debounce
    }
}

function pourLiquid(fromIndex, toIndex) {
    if (fromIndex === toIndex) return;

    const fromBottle = bottles[fromIndex];
    const toBottle = bottles[toIndex];

    if (fromBottle.length === 0 || toBottle.length === 4) return;

    const fromColor = fromBottle[fromBottle.length - 1];
    const toColor = toBottle[toBottle.length - 1];

    if (toBottle.length === 0 || toColor === fromColor) {
        toBottle.push(fromBottle.pop());
        render();
        checkWinCondition();
    }
}

function checkWinCondition() {
    const isSolved = bottles.slice(0, 9).every(bottle => bottle.length === 4 && new Set(bottle).size === 1);

    if (isSolved) {
        bottleFilledSound.play();
        alert(`You won Level ${currentLevel + 1}!`);
        saveGameState();
        document.getElementById('next-level').disabled = false;
    }
    return isSolved;
}

function resetLevel() {
    bottles = structuredClone(levels[currentLevel]);
    render();
}

function changeLevel(delta) {
    const newLevel = currentLevel + delta;
    if (newLevel >= 0 && newLevel < levels.length) {
        currentLevel = newLevel;
        resetLevel();
        saveGameState();
    }
}

function saveGameState() {
    localStorage.setItem('currentLevel', currentLevel);
    localStorage.setItem('bottles', JSON.stringify(bottles));
}

function loadGameState() {
    const savedLevel = localStorage.getItem('currentLevel');
    if (savedLevel !== null) {
        currentLevel = parseInt(savedLevel, 10);
        const savedBottles = localStorage.getItem('bottles');
        if (savedBottles) {
            bottles = JSON.parse(savedBottles);
        } else {
            bottles = structuredClone(levels[currentLevel]);
        }
    } else {
        currentLevel = 0;
        bottles = structuredClone(levels[currentLevel]);
    }
}

document.getElementById('reset').addEventListener('click', resetLevel);
document.getElementById('prev-level').addEventListener('click', () => changeLevel(-1));
document.getElementById('next-level').addEventListener('click', () => {
    if (checkWinCondition()) {
        changeLevel(1);
    }
});

// Initialize levels and load the game state
ensureLevels(1500);
loadGameState();
render();

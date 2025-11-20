// Game state
const gameState = {
    currentRound: 1,
    totalRounds: 5,
    score: 0,
    targetColor: { r: 0, g: 0, b: 0 },
    playerColor: { r: 128, g: 128, b: 128 },
    roundCompleted: false
};

// DOM elements
const targetColorElement = document.getElementById('targetColor');
const playerColorElement = document.getElementById('playerColor');
const redSlider = document.getElementById('redSlider');
const greenSlider = document.getElementById('greenSlider');
const blueSlider = document.getElementById('blueSlider');
const redValue = document.getElementById('redValue');
const greenValue = document.getElementById('greenValue');
const blueValue = document.getElementById('blueValue');
const checkBtn = document.getElementById('checkBtn');
const nextBtn = document.getElementById('nextBtn');
const roundElement = document.getElementById('round');
const scoreElement = document.getElementById('score');
const resultElement = document.getElementById('result');

// Initialize the game
function initGame() {
    updateUI();
    generateTargetColor();
    setupEventListeners();
}

// Generate a random target color
function generateTargetColor() {
    // For the first round, make it easier
    if (gameState.currentRound === 1) {
        gameState.targetColor = {
            r: Math.floor(Math.random() * 100) + 50,
            g: Math.floor(Math.random() * 100) + 50,
            b: Math.floor(Math.random() * 100) + 50
        };
    } else {
        // Make it progressively harder
        gameState.targetColor = {
            r: Math.floor(Math.random() * 256),
            g: Math.floor(Math.random() * 256),
            b: Math.floor(Math.random() * 256)
        };
    }
    
    // Update the target color display
    targetColorElement.style.backgroundColor = `rgb(${gameState.targetColor.r}, ${gameState.targetColor.g}, ${gameState.targetColor.b})`;
    
    // Reset player color to middle values
    gameState.playerColor = { r: 128, g: 128, b: 128 };
    redSlider.value = 128;
    greenSlider.value = 128;
    blueSlider.value = 128;
    updatePlayerColor();
    
    // Reset UI for new round
    gameState.roundCompleted = false;
    checkBtn.disabled = false;
    nextBtn.disabled = true;
    resultElement.textContent = '';
}

// Update player color based on slider values
function updatePlayerColor() {
    gameState.playerColor = {
        r: parseInt(redSlider.value),
        g: parseInt(greenSlider.value),
        b: parseInt(blueSlider.value)
    };
    
    playerColorElement.style.backgroundColor = `rgb(${gameState.playerColor.r}, ${gameState.playerColor.g}, ${gameState.playerColor.b})`;
    
    // Update value displays
    redValue.textContent = gameState.playerColor.r;
    greenValue.textContent = gameState.playerColor.g;
    blueValue.textContent = gameState.playerColor.b;
}

// Calculate color difference (Euclidean distance in RGB space)
function calculateColorDifference() {
    const rDiff = gameState.targetColor.r - gameState.playerColor.r;
    const gDiff = gameState.targetColor.g - gameState.playerColor.g;
    const bDiff = gameState.targetColor.b - gameState.playerColor.b;
    
    return Math.sqrt(rDiff * rDiff + gDiff * gDiff + bDiff * bDiff);
}

// Calculate score based on color difference
function calculateScore(difference) {
    // Maximum possible difference is about 441 (sqrt(255^2 + 255^2 + 255^2))
    // We'll give more points for smaller differences
    const maxDifference = 441;
    const baseScore = 1000;
    
    // Score decreases as difference increases
    return Math.max(0, Math.round(baseScore * (1 - difference / maxDifference)));
}

// Check if the player's color matches the target
function checkMatch() {
    if (gameState.roundCompleted) return;
    
    const difference = calculateColorDifference();
    const roundScore = calculateScore(difference);
    
    gameState.score += roundScore;
    gameState.roundCompleted = true;
    
    // Update UI
    checkBtn.disabled = true;
    nextBtn.disabled = false;
    
    // Display result
    if (difference < 10) {
        resultElement.textContent = `Perfect match! +${roundScore} points`;
        resultElement.style.color = '#4caf50';
    } else if (difference < 30) {
        resultElement.textContent = `Very close! +${roundScore} points`;
        resultElement.style.color = '#8bc34a';
    } else if (difference < 60) {
        resultElement.textContent = `Good effort! +${roundScore} points`;
        resultElement.style.color = '#ffc107';
    } else if (difference < 100) {
        resultElement.textContent = `Not bad! +${roundScore} points`;
        resultElement.style.color = '#ff9800';
    } else {
        resultElement.textContent = `Keep trying! +${roundScore} points`;
        resultElement.style.color = '#f44336';
    }
    
    updateUI();
}

// Move to the next round
function nextRound() {
    if (!gameState.roundCompleted) return;
    
    gameState.currentRound++;
    
    if (gameState.currentRound <= gameState.totalRounds) {
        generateTargetColor();
        updateUI();
    } else {
        // Game over
        endGame();
    }
}

// End the game and show final score
function endGame() {
    targetColorElement.style.backgroundColor = 'transparent';
    playerColorElement.style.backgroundColor = 'transparent';
    
    resultElement.textContent = `Game Over! Final Score: ${gameState.score}`;
    resultElement.style.color = '#ffeb3b';
    resultElement.style.fontSize = '1.5rem';
    
    checkBtn.style.display = 'none';
    nextBtn.textContent = 'Play Again';
    nextBtn.onclick = restartGame;
    nextBtn.disabled = false;
}

// Restart the game
function restartGame() {
    gameState.currentRound = 1;
    gameState.score = 0;
    
    checkBtn.style.display = 'inline-block';
    nextBtn.textContent = 'Next Round';
    nextBtn.onclick = nextRound;
    
    resultElement.style.fontSize = '1.2rem';
    
    initGame();
}

// Update the UI with current game state
function updateUI() {
    roundElement.textContent = gameState.currentRound;
    scoreElement.textContent = gameState.score;
}

// Set up event listeners
function setupEventListeners() {
    // Slider events
    redSlider.addEventListener('input', updatePlayerColor);
    greenSlider.addEventListener('input', updatePlayerColor);
    blueSlider.addEventListener('input', updatePlayerColor);
    
    // Button events
    checkBtn.addEventListener('click', checkMatch);
    nextBtn.addEventListener('click', nextRound);
}

// Initialize the game when the page loads
window.addEventListener('DOMContentLoaded', initGame);
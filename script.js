// Game State
const gameState = {
    coins: 100,
    totalScore: 0,
    selectedHorse: null,
    currentBet: 0,
    raceHistory: [],
    isRacing: false
};

// Horse data
const horses = [
    { emoji: '🐴', name: 'Classic' },
    { emoji: '🦄', name: 'Unicorn' },
    { emoji: '🐸', name: 'Pepe' },
    { emoji: '🦖', name: 'Dino' },
    { emoji: '🐉', name: 'Dragon' },
    { emoji: '🦅', name: 'Eagle' }
];

// DOM Elements
const coinsDisplay = document.getElementById('coins');
const totalScoreDisplay = document.getElementById('totalScore');
const horseCards = document.querySelectorAll('.horse-card');
const betButtons = document.querySelectorAll('.bet-btn');
const currentBetDisplay = document.getElementById('currentBet');
const startRaceBtn = document.getElementById('startRaceBtn');
const selectionArea = document.getElementById('selectionArea');
const raceArea = document.getElementById('raceArea');
const resultArea = document.getElementById('resultArea');
const resultTitle = document.getElementById('resultTitle');
const winnerDisplay = document.getElementById('winnerDisplay');
const resultMessage = document.getElementById('resultMessage');
const playAgainBtn = document.getElementById('playAgainBtn');
const leaderboardContent = document.getElementById('leaderboardContent');

// Sound effects (using Web Audio API)
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

function playSound(frequency, duration, type = 'sine') {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = type;
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
}

function playRaceSound() {
    // Racing sounds - quick beeps
    for (let i = 0; i < 3; i++) {
        setTimeout(() => {
            playSound(600 + i * 100, 0.1, 'square');
        }, i * 300);
    }
}

function playWinSound() {
    // Victory sound - ascending notes
    const notes = [523, 659, 784, 1047]; // C, E, G, C
    notes.forEach((note, i) => {
        setTimeout(() => {
            playSound(note, 0.3);
        }, i * 150);
    });
}

function playLoseSound() {
    // Sad sound - descending notes
    const notes = [523, 440, 392, 349]; // C, A, G, F
    notes.forEach((note, i) => {
        setTimeout(() => {
            playSound(note, 0.2);
        }, i * 150);
    });
}

// Initialize
function init() {
    updateDisplay();
    attachEventListeners();
    loadLeaderboard();
}

function updateDisplay() {
    coinsDisplay.textContent = gameState.coins;
    totalScoreDisplay.textContent = gameState.totalScore;
    currentBetDisplay.textContent = gameState.currentBet;
}

function attachEventListeners() {
    // Horse selection
    horseCards.forEach((card, index) => {
        card.addEventListener('click', () => selectHorse(index));
    });
    
    // Betting
    betButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const betAmount = btn.dataset.bet;
            selectBet(betAmount);
        });
    });
    
    // Start race
    startRaceBtn.addEventListener('click', startRace);
    
    // Play again
    playAgainBtn.addEventListener('click', resetGame);
}

function selectHorse(index) {
    if (gameState.isRacing) return;
    
    gameState.selectedHorse = index;
    
    // Update UI
    horseCards.forEach(card => card.classList.remove('selected'));
    horseCards[index].classList.add('selected');
    
    checkCanStartRace();
    playSound(440, 0.1);
}

function selectBet(betAmount) {
    if (gameState.isRacing) return;
    
    let bet;
    if (betAmount === 'all') {
        bet = gameState.coins;
    } else {
        bet = parseInt(betAmount);
    }
    
    if (bet > gameState.coins) {
        alert('Du har inte så många coins! 💸');
        return;
    }
    
    gameState.currentBet = bet;
    updateDisplay();
    
    // Update UI
    betButtons.forEach(btn => btn.classList.remove('selected'));
    event.target.classList.add('selected');
    
    checkCanStartRace();
    playSound(523, 0.1);
}

function checkCanStartRace() {
    if (gameState.selectedHorse !== null && gameState.currentBet > 0) {
        startRaceBtn.disabled = false;
    } else {
        startRaceBtn.disabled = true;
    }
}

function startRace() {
    if (gameState.isRacing) return;
    
    gameState.isRacing = true;
    gameState.coins -= gameState.currentBet;
    updateDisplay();
    
    // Hide selection, show race
    selectionArea.classList.add('hidden');
    raceArea.classList.remove('hidden');
    
    playRaceSound();
    
    // Run the race
    runRace();
}

function runRace() {
    const runners = document.querySelectorAll('.runner');
    const raceDuration = 3000; // 3 seconds
    const updateInterval = 50; // Update every 50ms
    const updates = raceDuration / updateInterval;
    
    // Random speeds for each horse
    const speeds = horses.map(() => Math.random() * 0.5 + 0.5); // 0.5 to 1.0
    const positions = new Array(6).fill(0);
    let updateCount = 0;
    let winner = null;
    
    const raceInterval = setInterval(() => {
        updateCount++;
        
        // Update positions
        positions.forEach((pos, index) => {
            positions[index] += speeds[index] * (100 / updates);
            if (positions[index] > 100) positions[index] = 100;
        });
        
        // Update runner positions on screen
        runners.forEach((runner, index) => {
            const maxPosition = runner.parentElement.offsetWidth - 100;
            const currentPosition = (positions[index] / 100) * maxPosition;
            runner.style.left = currentPosition + 'px';
        });
        
        // Check for winner
        if (updateCount >= updates || positions.some(pos => pos >= 100)) {
            clearInterval(raceInterval);
            
            // Determine winner (highest position)
            winner = positions.indexOf(Math.max(...positions));
            
            setTimeout(() => {
                showResult(winner);
            }, 500);
        }
    }, updateInterval);
}

function showResult(winnerIndex) {
    // Hide race, show result
    raceArea.classList.add('hidden');
    resultArea.classList.remove('hidden');
    
    const didWin = winnerIndex === gameState.selectedHorse;
    const winnings = didWin ? gameState.currentBet * 2 : 0;
    
    if (didWin) {
        gameState.coins += winnings;
        gameState.totalScore += winnings;
        resultTitle.textContent = '🎉 DU VANN! 🎉';
        resultMessage.textContent = `Du vann ${winnings} coins! 💰`;
        resultMessage.className = 'result-message win';
        playWinSound();
    } else {
        resultTitle.textContent = '😢 DU FÖRLORADE! 😢';
        resultMessage.textContent = `Du förlorade ${gameState.currentBet} coins...`;
        resultMessage.className = 'result-message lose';
        playLoseSound();
    }
    
    winnerDisplay.textContent = horses[winnerIndex].emoji;
    
    // Save to history
    gameState.raceHistory.push({
        horse: gameState.selectedHorse,
        bet: gameState.currentBet,
        winner: winnerIndex,
        won: didWin,
        winnings: winnings,
        timestamp: new Date().toLocaleTimeString('sv-SE')
    });
    
    updateDisplay();
    updateLeaderboard();
    
    // Check if out of coins
    if (gameState.coins === 0) {
        setTimeout(() => {
            alert('Game Over! Du har inga coins kvar! 😭\nDu får 50 nya coins för att fortsätta spela! 🎮');
            gameState.coins = 50;
            updateDisplay();
        }, 2000);
    }
}

function resetGame() {
    gameState.isRacing = false;
    gameState.selectedHorse = null;
    gameState.currentBet = 0;
    
    // Reset UI
    horseCards.forEach(card => card.classList.remove('selected'));
    betButtons.forEach(btn => btn.classList.remove('selected'));
    
    // Reset race positions
    const runners = document.querySelectorAll('.runner');
    runners.forEach(runner => {
        runner.style.left = '0px';
    });
    
    // Show selection, hide others
    selectionArea.classList.remove('hidden');
    raceArea.classList.add('hidden');
    resultArea.classList.add('hidden');
    
    updateDisplay();
    checkCanStartRace();
    
    playSound(440, 0.15);
}

function updateLeaderboard() {
    if (gameState.raceHistory.length === 0) {
        leaderboardContent.innerHTML = '<p class="no-races">Inga lopp än! Starta ditt första race! 🚀</p>';
        return;
    }
    
    // Show last 10 races
    const recentRaces = gameState.raceHistory.slice(-10).reverse();
    
    leaderboardContent.innerHTML = recentRaces.map(race => {
        const horseInfo = horses[race.horse];
        const winnerInfo = horses[race.winner];
        const resultClass = race.won ? 'win' : 'lose';
        const resultEmoji = race.won ? '✅' : '❌';
        
        return `
            <div class="race-entry ${resultClass}">
                <div>
                    <strong>${race.timestamp}</strong> - 
                    ${horseInfo.emoji} ${horseInfo.name} 
                    (${race.bet} coins)
                </div>
                <div>
                    ${resultEmoji} Vinnare: ${winnerInfo.emoji}
                    ${race.won ? ` (+${race.winnings} coins)` : ''}
                </div>
            </div>
        `;
    }).join('');
}

function loadLeaderboard() {
    updateLeaderboard();
}

// Start the game
init();

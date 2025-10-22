// Game Configuration
const CONFIG = {
    playerMaxHp: 100,
    playerStartHp: 100,
    enemyBaseHp: 30,
    enemyHpPerWave: 10,
    attackDamage: 20,
    wrongAnswerDamage: 15,
    healCost: 10,
    healAmount: 30,
    enemiesPerWave: 3,
    enemiesIncreasePerWave: 1
};

// Game State
const gameState = {
    isRunning: false,
    playerHp: CONFIG.playerStartHp,
    score: 0,
    wave: 1,
    enemiesDefeated: 0,
    wordsLearned: new Set(),
    currentEnemy: null,
    enemiesInWave: [],
    currentWaveEnemyCount: 0,
    isAttackMode: true,
    currentQuestion: null,
    answeredQuestions: new Set()
};

// Enemy Class
class Enemy {
    constructor(word, wave) {
        this.word = word;
        this.maxHp = CONFIG.enemyBaseHp + (wave - 1) * CONFIG.enemyHpPerWave;
        this.hp = this.maxHp;
        this.name = word.english;
    }

    takeDamage(damage) {
        this.hp = Math.max(0, this.hp - damage);
        return this.hp <= 0;
    }
}

// Question Types
const questionTypes = [
    {
        type: 'char_to_english',
        getQuestion: (word) => `What does "${word.chinese}" mean?`,
        getCorrect: (word) => word.english,
        getOptions: (word, allWords) => {
            const others = allWords.filter(w => w.english !== word.english);
            return shuffleArray([
                word.english,
                ...getRandomElements(others, 3).map(w => w.english)
            ]);
        }
    },
    {
        type: 'char_to_jyutping',
        getQuestion: (word) => `What is the jyutping for "${word.chinese}"?`,
        getCorrect: (word) => word.jyutping,
        getOptions: (word, allWords) => {
            const others = allWords.filter(w => w.jyutping !== word.jyutping);
            return shuffleArray([
                word.jyutping,
                ...getRandomElements(others, 3).map(w => w.jyutping)
            ]);
        }
    },
    {
        type: 'english_to_char',
        getQuestion: (word) => `Which character means "${word.english}"?`,
        getCorrect: (word) => word.chinese,
        getOptions: (word, allWords) => {
            const others = allWords.filter(w => w.chinese !== word.chinese);
            return shuffleArray([
                word.chinese,
                ...getRandomElements(others, 3).map(w => w.chinese)
            ]);
        }
    },
    {
        type: 'jyutping_to_char',
        getQuestion: (word) => `Which character has jyutping "${word.jyutping}"?`,
        getCorrect: (word) => word.chinese,
        getOptions: (word, allWords) => {
            const others = allWords.filter(w => w.chinese !== word.chinese);
            return shuffleArray([
                word.chinese,
                ...getRandomElements(others, 3).map(w => w.chinese)
            ]);
        }
    }
];

// Utility Functions
function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function getRandomElements(array, count) {
    const shuffled = shuffleArray(array);
    return shuffled.slice(0, Math.min(count, shuffled.length));
}

function getRandomQuestionType() {
    return questionTypes[Math.floor(Math.random() * questionTypes.length)];
}

// Start Game
function startGame() {
    gameState.isRunning = true;
    gameState.playerHp = CONFIG.playerStartHp;
    gameState.score = 0;
    gameState.wave = 1;
    gameState.enemiesDefeated = 0;
    gameState.wordsLearned.clear();
    gameState.answeredQuestions.clear();
    gameState.isAttackMode = true;

    document.getElementById('start-button').style.display = 'none';
    document.getElementById('game-over').style.display = 'none';

    updateUI();
    startWave();
}

// Start Wave
function startWave() {
    const enemyCount = CONFIG.enemiesPerWave + Math.floor((gameState.wave - 1) / 2) * CONFIG.enemiesIncreasePerWave;
    gameState.currentWaveEnemyCount = enemyCount;
    gameState.enemiesInWave = [];

    for (let i = 0; i < enemyCount; i++) {
        const word = getRandomWord();
        gameState.enemiesInWave.push(new Enemy(word, gameState.wave));
    }

    nextEnemy();
}

// Next Enemy
function nextEnemy() {
    if (gameState.enemiesInWave.length === 0) {
        // Wave complete
        completeWave();
        return;
    }

    gameState.currentEnemy = gameState.enemiesInWave.shift();
    displayEnemy();
    generateQuestion();
}

// Display Enemy
function displayEnemy() {
    document.getElementById('current-enemy').style.display = 'block';
    document.getElementById('wave-complete').style.display = 'none';
    document.getElementById('enemy-name').textContent = gameState.currentEnemy.name;
    document.getElementById('enemy-character').textContent = gameState.currentEnemy.word.chinese;
    updateEnemyHP();

    document.getElementById('question-panel').style.display = 'block';
    document.getElementById('word-learning').style.display = 'none';
}

// Update Enemy HP
function updateEnemyHP() {
    const enemy = gameState.currentEnemy;
    document.getElementById('enemy-hp-value').textContent = enemy.hp;
    document.getElementById('enemy-max-hp').textContent = enemy.maxHp;

    const hpPercent = (enemy.hp / enemy.maxHp) * 100;
    document.getElementById('enemy-hp-bar').style.width = hpPercent + '%';
}

// Update Player HP
function updatePlayerHP() {
    gameState.playerHp = Math.min(CONFIG.playerMaxHp, Math.max(0, gameState.playerHp));
    document.getElementById('player-hp-value').textContent = gameState.playerHp;

    const hpPercent = (gameState.playerHp / CONFIG.playerMaxHp) * 100;
    document.getElementById('player-hp-bar').style.width = hpPercent + '%';

    // Change HP bar color based on health
    const hpBar = document.getElementById('player-hp-bar');
    if (hpPercent <= 25) {
        hpBar.style.background = 'linear-gradient(90deg, #f44336 0%, #e91e63 100%)';
    } else if (hpPercent <= 50) {
        hpBar.style.background = 'linear-gradient(90deg, #ff9800 0%, #ffc107 100%)';
    } else {
        hpBar.style.background = 'linear-gradient(90deg, #4caf50 0%, #8bc34a 100%)';
    }

    if (gameState.playerHp <= 0) {
        gameOver();
    }
}

// Update UI
function updateUI() {
    document.getElementById('wave-value').textContent = gameState.wave;
    document.getElementById('score-value').textContent = gameState.score;
    document.getElementById('enemies-defeated-value').textContent = gameState.enemiesDefeated;
    updatePlayerHP();
}

// Generate Question
function generateQuestion() {
    // For healing questions, use a different word than the current enemy
    let word;
    if (gameState.isAttackMode) {
        word = gameState.currentEnemy.word;
    } else {
        // Get a different word for healing
        word = getRandomWord();
        // Make sure it's not the same as current enemy
        let attempts = 0;
        while (word.chinese === gameState.currentEnemy.word.chinese && attempts < 10) {
            word = getRandomWord();
            attempts++;
        }
    }

    const questionType = getRandomQuestionType();
    const question = questionType.getQuestion(word);
    const correctAnswer = questionType.getCorrect(word);
    const options = questionType.getOptions(word, cantoneseWords);

    gameState.currentQuestion = {
        word: word,
        type: questionType,
        correctAnswer: correctAnswer,
        options: options
    };

    displayQuestion();
}

// Display Question
function displayQuestion() {
    const modeText = gameState.isAttackMode ? 'Attack' : 'Heal';
    document.getElementById('question-text').textContent = gameState.currentQuestion.type.getQuestion(gameState.currentQuestion.word);

    const optionButtons = document.querySelectorAll('.option-btn');
    gameState.currentQuestion.options.forEach((option, index) => {
        const btn = optionButtons[index];
        btn.textContent = option;
        btn.disabled = false;
        btn.classList.remove('correct', 'incorrect');
        btn.onclick = () => selectAnswer(option, btn);
    });

    document.getElementById('feedback').style.display = 'none';
}

// Select Answer
function selectAnswer(selectedAnswer, button) {
    const isCorrect = selectedAnswer === gameState.currentQuestion.correctAnswer;

    // Disable all buttons
    const optionButtons = document.querySelectorAll('.option-btn');
    optionButtons.forEach(btn => {
        btn.disabled = true;
        // Highlight correct answer
        if (btn.textContent === gameState.currentQuestion.correctAnswer) {
            btn.classList.add('correct');
        }
    });

    // Mark selected answer
    if (!isCorrect) {
        button.classList.add('incorrect');
    }

    // Show feedback
    const feedback = document.getElementById('feedback');
    feedback.style.display = 'block';

    if (gameState.isAttackMode) {
        if (isCorrect) {
            // Attack enemy
            const defeated = gameState.currentEnemy.takeDamage(CONFIG.attackDamage);
            feedback.textContent = `✓ Correct! You dealt ${CONFIG.attackDamage} damage!`;
            feedback.className = 'correct';

            updateEnemyHP();
            gameState.score += 10;

            if (defeated) {
                gameState.enemiesDefeated++;
                gameState.wordsLearned.add(gameState.currentEnemy.word.chinese);

                setTimeout(() => {
                    showWordLearning(gameState.currentEnemy.word);
                }, 1500);
            } else {
                setTimeout(() => {
                    generateQuestion();
                }, 1500);
            }
        } else {
            // Player takes damage
            gameState.playerHp -= CONFIG.wrongAnswerDamage;
            feedback.textContent = `✗ Wrong! You took ${CONFIG.wrongAnswerDamage} damage!`;
            feedback.className = 'incorrect';

            updatePlayerHP();

            if (gameState.playerHp > 0) {
                setTimeout(() => {
                    generateQuestion();
                }, 1500);
            }
        }
    } else {
        // Heal mode
        if (isCorrect) {
            const healedAmount = Math.min(CONFIG.healAmount, CONFIG.playerMaxHp - gameState.playerHp);
            gameState.playerHp += healedAmount;
            feedback.textContent = `✓ Correct! You healed ${healedAmount} HP!`;
            feedback.className = 'correct';

            updatePlayerHP();
            gameState.score += 5;
        } else {
            feedback.textContent = `✗ Wrong! No healing effect.`;
            feedback.className = 'incorrect';
        }

        // Switch back to attack mode
        gameState.isAttackMode = true;
        document.getElementById('attack-mode').classList.add('active');
        document.getElementById('heal-mode').classList.remove('active');

        setTimeout(() => {
            generateQuestion();
        }, 1500);
    }

    updateUI();
}

// Show Word Learning
function showWordLearning(word) {
    document.getElementById('question-panel').style.display = 'none';
    document.getElementById('word-learning').style.display = 'block';

    document.querySelector('.learned-chinese').textContent = word.chinese;
    document.querySelector('.learned-jyutping').textContent = word.jyutping;
    document.querySelector('.learned-english').textContent = word.english;

    // Auto pronounce
    pronounceCantonese(word);

    setTimeout(() => {
        nextEnemy();
    }, 3000);
}

// Complete Wave
function completeWave() {
    document.getElementById('current-enemy').style.display = 'none';
    document.getElementById('wave-complete').style.display = 'block';
    document.getElementById('question-panel').style.display = 'none';

    gameState.wave++;
    gameState.score += gameState.wave * 10;
    updateUI();

    setTimeout(() => {
        startWave();
    }, 2500);
}

// Game Over
function gameOver() {
    gameState.isRunning = false;

    document.getElementById('final-waves').textContent = gameState.wave - 1;
    document.getElementById('final-score').textContent = gameState.score;
    document.getElementById('final-enemies').textContent = gameState.enemiesDefeated;
    document.getElementById('words-learned').textContent = gameState.wordsLearned.size;

    document.getElementById('game-over').style.display = 'block';
}

// Restart Game
function restartGame() {
    startGame();
}

// Toggle Action Mode
function toggleAttackMode() {
    if (!gameState.isAttackMode) {
        gameState.isAttackMode = true;
        document.getElementById('attack-mode').classList.add('active');
        document.getElementById('heal-mode').classList.remove('active');
        generateQuestion();
    }
}

function toggleHealMode() {
    if (gameState.isAttackMode && gameState.playerHp >= CONFIG.healCost) {
        // Check if player has enough HP to attempt healing
        if (gameState.playerHp <= CONFIG.healCost) {
            alert('Not enough HP to attempt healing!');
            return;
        }

        gameState.isAttackMode = false;
        document.getElementById('attack-mode').classList.remove('active');
        document.getElementById('heal-mode').classList.add('active');

        // Deduct heal cost
        gameState.playerHp -= CONFIG.healCost;
        updatePlayerHP();

        generateQuestion();
    }
}

// Event Listeners
document.getElementById('start-button').addEventListener('click', startGame);
document.getElementById('restart-button').addEventListener('click', restartGame);
document.getElementById('attack-mode').addEventListener('click', toggleAttackMode);
document.getElementById('heal-mode').addEventListener('click', toggleHealMode);

document.getElementById('hear-pronunciation').addEventListener('click', () => {
    if (gameState.currentEnemy) {
        pronounceCantonese(gameState.currentEnemy.word);
    }
});

// Initialize UI
updateUI();

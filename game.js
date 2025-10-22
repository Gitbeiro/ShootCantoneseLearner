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
    defeatedWords: [], // Track defeated words with full details
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

        // Track which knowledge aspects have been demonstrated
        this.defeatedAspects = {
            writing: false,      // Can recognize the character
            meaning: false,      // Knows the English meaning
            jyutping: false,     // Knows the jyutping
            pronunciation: false // Can recognize by sound
        };
    }

    takeDamage(damage) {
        this.hp = Math.max(0, this.hp - damage);
        return this.hp <= 0;
    }

    isFullyDefeated() {
        return Object.values(this.defeatedAspects).every(aspect => aspect);
    }

    getRemainingAspects() {
        return Object.entries(this.defeatedAspects)
            .filter(([_, completed]) => !completed)
            .map(([aspect, _]) => aspect);
    }
}

// Question Types
const questionTypes = [
    {
        type: 'char_to_english',
        aspect: 'meaning',
        getQuestion: (word) => `What does "${word.chinese}" mean?`,
        getCorrect: (word) => word.english,
        getOptions: (word, allWords) => {
            const others = allWords.filter(w => w.english !== word.english);
            return shuffleArray([
                word.english,
                ...getRandomElements(others, 3).map(w => w.english)
            ]);
        },
        needsPronunciation: false
    },
    {
        type: 'char_to_jyutping',
        aspect: 'jyutping',
        getQuestion: (word) => `What is the jyutping for "${word.chinese}"?`,
        getCorrect: (word) => word.jyutping,
        getOptions: (word, allWords) => {
            const others = allWords.filter(w => w.jyutping !== word.jyutping);
            return shuffleArray([
                word.jyutping,
                ...getRandomElements(others, 3).map(w => w.jyutping)
            ]);
        },
        needsPronunciation: false
    },
    {
        type: 'english_to_char',
        aspect: 'writing',
        getQuestion: (word) => `Which character means "${word.english}"?`,
        getCorrect: (word) => word.chinese,
        getOptions: (word, allWords) => {
            const others = allWords.filter(w => w.chinese !== word.chinese);
            return shuffleArray([
                word.chinese,
                ...getRandomElements(others, 3).map(w => w.chinese)
            ]);
        },
        needsPronunciation: false
    },
    {
        type: 'pronunciation_to_char',
        aspect: 'pronunciation',
        getQuestion: (word) => `Which character did you hear? 🔊`,
        getCorrect: (word) => word.chinese,
        getOptions: (word, allWords) => {
            const others = allWords.filter(w => w.chinese !== word.chinese);
            return shuffleArray([
                word.chinese,
                ...getRandomElements(others, 3).map(w => w.chinese)
            ]);
        },
        needsPronunciation: true
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

function getRandomQuestionType(enemy = null) {
    if (!enemy || !gameState.isAttackMode) {
        // For healing or no enemy, return any random question type
        return questionTypes[Math.floor(Math.random() * questionTypes.length)];
    }

    // Get question types for aspects not yet defeated
    const remainingAspects = enemy.getRemainingAspects();
    const availableQuestions = questionTypes.filter(qt => remainingAspects.includes(qt.aspect));

    if (availableQuestions.length === 0) {
        // All aspects defeated, return any question
        return questionTypes[Math.floor(Math.random() * questionTypes.length)];
    }

    return availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
}

// Start Game
function startGame() {
    gameState.isRunning = true;
    gameState.playerHp = CONFIG.playerStartHp;
    gameState.score = 0;
    gameState.wave = 1;
    gameState.enemiesDefeated = 0;
    gameState.wordsLearned.clear();
    gameState.defeatedWords = [];
    gameState.answeredQuestions.clear();
    gameState.isAttackMode = true;

    document.getElementById('start-button').style.display = 'none';
    document.getElementById('game-over').style.display = 'none';

    updateUI();
    updateDefeatedWordsList();
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

    const questionType = getRandomQuestionType(gameState.isAttackMode ? gameState.currentEnemy : null);
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

    // Auto-pronounce for listening questions
    if (questionType.needsPronunciation) {
        setTimeout(() => pronounceCantonese(word), 500);
    }
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
            // Mark this aspect as defeated
            const aspect = gameState.currentQuestion.type.aspect;
            gameState.currentEnemy.defeatedAspects[aspect] = true;

            // Attack enemy
            const hpDepleted = gameState.currentEnemy.takeDamage(CONFIG.attackDamage);

            // Make enemy "speak" when hit
            showEnemySpeech(gameState.currentEnemy.word);
            pronounceCantonese(gameState.currentEnemy.word);

            feedback.textContent = `✓ Correct! You dealt ${CONFIG.attackDamage} damage!`;
            feedback.className = 'correct';

            updateEnemyHP();
            gameState.score += 10;

            // Check if enemy is fully defeated (all aspects mastered)
            const fullyDefeated = gameState.currentEnemy.isFullyDefeated();

            if (fullyDefeated) {
                gameState.enemiesDefeated++;
                gameState.wordsLearned.add(gameState.currentEnemy.word.chinese);

                // Add to defeated words list
                gameState.defeatedWords.push({
                    ...gameState.currentEnemy.word,
                    defeatedAt: Date.now()
                });
                updateDefeatedWordsList();

                setTimeout(() => {
                    showWordLearning(gameState.currentEnemy.word);
                }, 2000);
            } else {
                setTimeout(() => {
                    generateQuestion();
                }, 2000);
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

// Show Enemy Speech (enemy speaks when hit)
function showEnemySpeech(word) {
    const enemySpeech = document.getElementById('enemy-speech');
    if (!enemySpeech) return;

    enemySpeech.textContent = `${word.chinese} (${word.jyutping})`;
    enemySpeech.style.display = 'block';
    enemySpeech.classList.add('speech-appear');

    // Hide after animation
    setTimeout(() => {
        enemySpeech.style.display = 'none';
        enemySpeech.classList.remove('speech-appear');
    }, 2000);
}

// Update Defeated Words List
function updateDefeatedWordsList() {
    const defeatedList = document.getElementById('defeated-words-list');
    if (!defeatedList) return;

    if (gameState.defeatedWords.length === 0) {
        defeatedList.innerHTML = '<p class="no-words">No words defeated yet</p>';
        return;
    }

    defeatedList.innerHTML = gameState.defeatedWords.map((word, index) => `
        <div class="defeated-word-item">
            <span class="defeated-word-chinese">${word.chinese}</span>
            <span class="defeated-word-jyutping">${word.jyutping}</span>
            <span class="defeated-word-english">${word.english}</span>
            <button class="replay-pronunciation" onclick="pronounceCantonese(cantoneseWords.find(w => w.chinese === '${word.chinese}'))">🔊</button>
        </div>
    `).join('');
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
updateDefeatedWordsList();

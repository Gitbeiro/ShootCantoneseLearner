// Game Configuration
const CONFIG = {
    playerMaxHp: 100,
    playerStartHp: 100,
    playerMaxMana: 100,
    playerStartMana: 100,
    manaRegenPerKill: 20,
    enemyBaseHp: 30,
    enemyHpPerWave: 10,
    attackDamage: 20,
    wrongAnswerDamage: 15,
    healManaCost: 25,
    healAmount: 30,
    powerAttackManaCost: 40,
    powerAttackDamage: 40,
    enemiesPerWave: 3,
    enemiesIncreasePerWave: 1,
    xpPerEnemy: 20,
    xpPerLevel: 100,
    xpLevelIncrease: 50, // XP needed increases per level
    critChance: 0.15, // 15% crit chance
    critMultiplier: 2
};

// Game State
const gameState = {
    isRunning: false,
    playerHp: CONFIG.playerStartHp,
    playerMana: CONFIG.playerStartMana,
    level: 1,
    xp: 0,
    xpToNextLevel: CONFIG.xpPerLevel,
    score: 0,
    wave: 1,
    enemiesDefeated: 0,
    wordsLearned: new Set(),
    currentEnemy: null,
    enemiesInWave: [],
    currentWaveEnemyCount: 0,
    currentAction: 'attack', // 'attack', 'heal', 'power_attack'
    currentQuestion: null,
    answeredQuestions: new Set(),
    combo: 0,
    maxCombo: 0,
    achievements: {
        firstBlood: false,
        wave5: false,
        wave10: false,
        combo5: false,
        combo10: false,
        level5: false,
        level10: false,
        defeat50: false,
        defeat100: false
    }
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

// XP and Leveling System
function gainXP(amount) {
    gameState.xp += amount;

    while (gameState.xp >= gameState.xpToNextLevel) {
        levelUp();
    }

    updateUI();
}

function levelUp() {
    gameState.xp -= gameState.xpToNextLevel;
    gameState.level++;
    gameState.xpToNextLevel += CONFIG.xpLevelIncrease;

    // Heal player on level up
    gameState.playerHp = Math.min(CONFIG.playerMaxHp, gameState.playerHp + 30);
    gameState.playerMana = CONFIG.playerMaxMana;

    // Show level up notification
    showNotification(`LEVEL UP! You are now level ${gameState.level}!`, 'level-up');

    // Check level achievements
    checkAchievement('level5', gameState.level >= 5);
    checkAchievement('level10', gameState.level >= 10);

    // Update character size
    updateCharacterSize();
}

// Mana Management
function updateMana(amount) {
    gameState.playerMana = Math.min(CONFIG.playerMaxMana, Math.max(0, gameState.playerMana + amount));
    updateManaBar();
}

function updateManaBar() {
    const manaValue = document.getElementById('player-mana-value');
    const manaBar = document.getElementById('player-mana-bar');

    if (manaValue && manaBar) {
        manaValue.textContent = gameState.playerMana;
        const manaPercent = (gameState.playerMana / CONFIG.playerMaxMana) * 100;
        manaBar.style.width = manaPercent + '%';
    }
}

// Critical Hit System
function isCriticalHit() {
    return Math.random() < CONFIG.critChance;
}

// Combo System
function increaseCombo() {
    gameState.combo++;
    if (gameState.combo > gameState.maxCombo) {
        gameState.maxCombo = gameState.combo;
    }

    checkAchievement('combo5', gameState.combo >= 5);
    checkAchievement('combo10', gameState.combo >= 10);

    updateComboDisplay();
}

function resetCombo() {
    gameState.combo = 0;
    updateComboDisplay();
}

function updateComboDisplay() {
    const comboEl = document.getElementById('combo-value');
    if (comboEl) {
        comboEl.textContent = gameState.combo;
        const comboContainer = document.getElementById('combo-container');
        if (comboContainer) {
            if (gameState.combo >= 3) {
                comboContainer.classList.add('active');
                if (gameState.combo >= 5) {
                    comboContainer.classList.add('mega');
                } else {
                    comboContainer.classList.remove('mega');
                }
            } else {
                comboContainer.classList.remove('active', 'mega');
            }
        }
    }
}

// Achievement System
function checkAchievement(achievementId, condition) {
    if (!gameState.achievements[achievementId] && condition) {
        gameState.achievements[achievementId] = true;
        showAchievement(achievementId);
    }
}

function showAchievement(achievementId) {
    const achievements = {
        firstBlood: 'First Blood - Defeated your first enemy!',
        wave5: 'Wave Warrior - Survived 5 waves!',
        wave10: 'Wave Master - Survived 10 waves!',
        combo5: 'Combo Starter - 5 correct answers in a row!',
        combo10: 'Combo Master - 10 correct answers in a row!',
        level5: 'Rising Star - Reached level 5!',
        level10: 'Cantonese Scholar - Reached level 10!',
        defeat50: 'Enemy Slayer - Defeated 50 enemies!',
        defeat100: 'Legendary Warrior - Defeated 100 enemies!'
    };

    if (achievements[achievementId]) {
        showNotification('Achievement Unlocked: ' + achievements[achievementId], 'achievement');
    }
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('show');
    }, 100);

    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Character Size Update
function updateCharacterSize() {
    const character = document.getElementById('player-character');
    if (character) {
        const scale = 1 + (gameState.level - 1) * 0.15; // Grows 15% per level
        character.style.transform = `scale(${scale})`;
    }
}

// Start Game
function startGame() {
    gameState.isRunning = true;
    gameState.playerHp = CONFIG.playerStartHp;
    gameState.playerMana = CONFIG.playerStartMana;
    gameState.level = 1;
    gameState.xp = 0;
    gameState.xpToNextLevel = CONFIG.xpPerLevel;
    gameState.score = 0;
    gameState.wave = 1;
    gameState.enemiesDefeated = 0;
    gameState.combo = 0;
    gameState.maxCombo = 0;
    gameState.wordsLearned.clear();
    gameState.answeredQuestions.clear();
    gameState.currentAction = 'attack';

    // Reset achievements
    for (let key in gameState.achievements) {
        gameState.achievements[key] = false;
    }

    document.getElementById('start-button').style.display = 'none';
    document.getElementById('game-over').style.display = 'none';

    updateUI();
    updateCharacterSize();
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

    // Update level and XP
    const levelEl = document.getElementById('player-level');
    const xpEl = document.getElementById('player-xp');
    const xpBar = document.getElementById('player-xp-bar');

    if (levelEl) levelEl.textContent = gameState.level;
    if (xpEl) xpEl.textContent = `${gameState.xp} / ${gameState.xpToNextLevel}`;
    if (xpBar) {
        const xpPercent = (gameState.xp / gameState.xpToNextLevel) * 100;
        xpBar.style.width = xpPercent + '%';
    }

    updatePlayerHP();
    updateManaBar();
    updateComboDisplay();
}

// Generate Question
function generateQuestion() {
    // For non-attack actions, use a different word than the current enemy
    let word;
    if (gameState.currentAction === 'attack' || gameState.currentAction === 'power_attack') {
        word = gameState.currentEnemy.word;
    } else {
        // Get a different word for healing/other actions
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
    document.getElementById('question-text').textContent = gameState.currentQuestion.type.getQuestion(gameState.currentQuestion.word);

    const optionButtons = document.querySelectorAll('.option-btn');
    gameState.currentQuestion.options.forEach((option, index) => {
        const btn = optionButtons[index];
        btn.textContent = option;
        btn.disabled = false;
        btn.classList.remove('correct', 'incorrect', 'critical');
        btn.onclick = () => selectAnswer(option, btn);
    });

    document.getElementById('feedback').style.display = 'none';
    updateActionButtons();
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

    if (gameState.currentAction === 'attack' || gameState.currentAction === 'power_attack') {
        if (isCorrect) {
            // Increase combo
            increaseCombo();

            // Check for critical hit
            const isCrit = isCriticalHit();
            let damage = gameState.currentAction === 'power_attack' ? CONFIG.powerAttackDamage : CONFIG.attackDamage;

            if (isCrit) {
                damage = Math.floor(damage * CONFIG.critMultiplier);
            }

            // Add combo bonus (5% per combo level, max 50%)
            const comboBonus = Math.min(gameState.combo - 1, 10) * 0.05;
            damage = Math.floor(damage * (1 + comboBonus));

            // Attack enemy
            const defeated = gameState.currentEnemy.takeDamage(damage);

            let feedbackText = `✓ Correct! You dealt ${damage} damage!`;
            if (isCrit) {
                feedbackText += ' CRITICAL HIT!';
            }
            if (gameState.combo > 1) {
                feedbackText += ` (${gameState.combo}x combo!)`;
            }

            feedback.textContent = feedbackText;
            feedback.className = 'correct' + (isCrit ? ' critical' : '');

            updateEnemyHP();
            gameState.score += 10 + (gameState.combo * 2);

            if (defeated) {
                gameState.enemiesDefeated++;
                gameState.wordsLearned.add(gameState.currentEnemy.word.chinese);

                // Gain XP and mana
                gainXP(CONFIG.xpPerEnemy);
                updateMana(CONFIG.manaRegenPerKill);

                // Check achievements
                checkAchievement('firstBlood', gameState.enemiesDefeated >= 1);
                checkAchievement('defeat50', gameState.enemiesDefeated >= 50);
                checkAchievement('defeat100', gameState.enemiesDefeated >= 100);

                setTimeout(() => {
                    showWordLearning(gameState.currentEnemy.word);
                }, 1500);
            } else {
                setTimeout(() => {
                    generateQuestion();
                }, 1500);
            }
        } else {
            // Reset combo on wrong answer
            resetCombo();

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

        // Reset to normal attack mode after power attack
        if (gameState.currentAction === 'power_attack') {
            gameState.currentAction = 'attack';
            updateActionButtons();
        }
    } else if (gameState.currentAction === 'heal') {
        // Heal mode
        if (isCorrect) {
            const healedAmount = Math.min(CONFIG.healAmount, CONFIG.playerMaxHp - gameState.playerHp);
            gameState.playerHp += healedAmount;
            feedback.textContent = `✓ Correct! You healed ${healedAmount} HP!`;
            feedback.className = 'correct';

            updatePlayerHP();
            gameState.score += 5;

            // Increase combo for healing too
            increaseCombo();
        } else {
            feedback.textContent = `✗ Wrong! No healing effect.`;
            feedback.className = 'incorrect';
            resetCombo();
        }

        // Switch back to attack mode
        gameState.currentAction = 'attack';
        updateActionButtons();

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

    // Check wave achievements
    checkAchievement('wave5', gameState.wave > 5);
    checkAchievement('wave10', gameState.wave > 10);

    updateUI();

    setTimeout(() => {
        startWave();
    }, 2500);
}

// Game Over
function gameOver() {
    gameState.isRunning = false;

    document.getElementById('final-waves').textContent = gameState.wave - 1;
    document.getElementById('final-level').textContent = gameState.level;
    document.getElementById('final-score').textContent = gameState.score;
    document.getElementById('final-enemies').textContent = gameState.enemiesDefeated;
    document.getElementById('final-combo').textContent = gameState.maxCombo;
    document.getElementById('words-learned').textContent = gameState.wordsLearned.size;

    document.getElementById('game-over').style.display = 'block';
}

// Restart Game
function restartGame() {
    startGame();
}

// Action Mode Functions
function setActionMode(mode) {
    // Check mana costs
    if (mode === 'heal' && gameState.playerMana < CONFIG.healManaCost) {
        showNotification('Not enough mana to heal!', 'error');
        return;
    }

    if (mode === 'power_attack' && gameState.playerMana < CONFIG.powerAttackManaCost) {
        showNotification('Not enough mana for power attack!', 'error');
        return;
    }

    // Deduct mana for special actions
    if (mode === 'heal') {
        updateMana(-CONFIG.healManaCost);
    } else if (mode === 'power_attack') {
        updateMana(-CONFIG.powerAttackManaCost);
    }

    gameState.currentAction = mode;
    updateActionButtons();
    generateQuestion();
}

function updateActionButtons() {
    // Update button states
    document.getElementById('attack-mode').classList.toggle('active', gameState.currentAction === 'attack');
    document.getElementById('heal-mode').classList.toggle('active', gameState.currentAction === 'heal');

    const powerAttackBtn = document.getElementById('power-attack-mode');
    if (powerAttackBtn) {
        powerAttackBtn.classList.toggle('active', gameState.currentAction === 'power_attack');

        // Show/hide power attack based on level
        if (gameState.level >= 3) {
            powerAttackBtn.style.display = 'block';
        } else {
            powerAttackBtn.style.display = 'none';
        }
    }

    // Disable buttons if not enough mana
    document.getElementById('heal-mode').disabled = gameState.playerMana < CONFIG.healManaCost;
    if (powerAttackBtn) {
        powerAttackBtn.disabled = gameState.playerMana < CONFIG.powerAttackManaCost;
    }
}

// Event Listeners
document.getElementById('start-button').addEventListener('click', startGame);
document.getElementById('restart-button').addEventListener('click', restartGame);
document.getElementById('attack-mode').addEventListener('click', () => {
    if (gameState.currentAction !== 'attack') {
        setActionMode('attack');
    }
});
document.getElementById('heal-mode').addEventListener('click', () => {
    if (gameState.currentAction !== 'heal') {
        setActionMode('heal');
    }
});

// Power attack button (will be added to HTML)
const powerAttackBtn = document.getElementById('power-attack-mode');
if (powerAttackBtn) {
    powerAttackBtn.addEventListener('click', () => {
        if (gameState.currentAction !== 'power_attack') {
            setActionMode('power_attack');
        }
    });
}

document.getElementById('hear-pronunciation').addEventListener('click', () => {
    if (gameState.currentEnemy) {
        pronounceCantonese(gameState.currentEnemy.word);
    }
});

// Initialize UI
updateUI();

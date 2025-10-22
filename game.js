// Game Configuration
const CONFIG = {
    canvasWidth: 800,
    canvasHeight: 500,
    playerSpeed: 5,
    bulletSpeed: 7,
    enemySpeed: 2,
    enemySpawnRate: 0.02, // Probability per frame
    playerSize: 40,
    bulletSize: 5,
    enemySize: 50
};

// Game State
const gameState = {
    isRunning: false,
    isPaused: false,
    score: 0,
    lives: 3,
    level: 1,
    wordsLearned: new Set(),
    currentWord: null,
    player: null,
    bullets: [],
    enemies: [],
    keys: {},
    animationId: null
};

// Canvas Setup
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
canvas.width = CONFIG.canvasWidth;
canvas.height = CONFIG.canvasHeight;

// Player Class
class Player {
    constructor() {
        this.x = CONFIG.canvasWidth / 2;
        this.y = CONFIG.canvasHeight - 60;
        this.width = CONFIG.playerSize;
        this.height = CONFIG.playerSize;
        this.speed = CONFIG.playerSpeed;
    }

    draw() {
        // Draw a spaceship-like triangle
        ctx.fillStyle = '#00ff00';
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x - this.width / 2, this.y + this.height);
        ctx.lineTo(this.x + this.width / 2, this.y + this.height);
        ctx.closePath();
        ctx.fill();

        // Add some detail
        ctx.fillStyle = '#00aa00';
        ctx.fillRect(this.x - 5, this.y + this.height - 15, 10, 10);
    }

    move() {
        if (gameState.keys['ArrowLeft'] && this.x > this.width / 2) {
            this.x -= this.speed;
        }
        if (gameState.keys['ArrowRight'] && this.x < CONFIG.canvasWidth - this.width / 2) {
            this.x += this.speed;
        }
    }
}

// Bullet Class
class Bullet {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = CONFIG.bulletSize;
        this.height = CONFIG.bulletSize * 2;
        this.speed = CONFIG.bulletSpeed;
        this.active = true;
    }

    draw() {
        ctx.fillStyle = '#ffff00';
        ctx.fillRect(this.x - this.width / 2, this.y, this.width, this.height);
    }

    update() {
        this.y -= this.speed;
        if (this.y < 0) {
            this.active = false;
        }
    }
}

// Enemy Class
class Enemy {
    constructor(word) {
        this.word = word;
        this.x = Math.random() * (CONFIG.canvasWidth - CONFIG.enemySize);
        this.y = -CONFIG.enemySize;
        this.width = CONFIG.enemySize;
        this.height = CONFIG.enemySize;
        this.speed = CONFIG.enemySpeed + (gameState.level - 1) * 0.5;
        this.active = true;
        this.color = this.getRandomColor();
    }

    getRandomColor() {
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#6c5ce7', '#fd79a8'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    draw() {
        // Draw enemy body
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Draw border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);

        // Draw Chinese character
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px Microsoft JhengHei, Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.word.chinese, this.x + this.width / 2, this.y + this.height / 2);
    }

    update() {
        this.y += this.speed;
        if (this.y > CONFIG.canvasHeight) {
            this.active = false;
            // Lost a life when enemy passes
            gameState.lives--;
            updateUI();
            if (gameState.lives <= 0) {
                gameOver();
            }
        }
    }
}

// Input Handling
document.addEventListener('keydown', (e) => {
    gameState.keys[e.key] = true;

    if (e.key === ' ' && gameState.isRunning && !gameState.isPaused) {
        e.preventDefault();
        shoot();
    }
});

document.addEventListener('keyup', (e) => {
    gameState.keys[e.key] = false;
});

// Shooting Function
function shoot() {
    if (gameState.player) {
        gameState.bullets.push(new Bullet(gameState.player.x, gameState.player.y));
    }
}

// Collision Detection
function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

// Enemy Spawning
function spawnEnemy() {
    if (Math.random() < CONFIG.enemySpawnRate * gameState.level) {
        const word = getRandomWord();
        gameState.enemies.push(new Enemy(word));
    }
}

// Update Current Word Display
function updateWordDisplay(word) {
    gameState.currentWord = word;
    document.getElementById('word-chinese').textContent = word.chinese;
    document.getElementById('word-jyutping').textContent = word.jyutping;
    document.getElementById('word-english').textContent = word.english;
}

// Update UI
function updateUI() {
    document.getElementById('score-value').textContent = gameState.score;
    document.getElementById('lives-value').textContent = gameState.lives;
    document.getElementById('level-value').textContent = gameState.level;
}

// Game Loop
function gameLoop() {
    if (!gameState.isRunning || gameState.isPaused) {
        return;
    }

    // Clear canvas
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, CONFIG.canvasWidth, CONFIG.canvasHeight);

    // Draw stars background
    drawStars();

    // Update and draw player
    gameState.player.move();
    gameState.player.draw();

    // Update and draw bullets
    gameState.bullets = gameState.bullets.filter(bullet => {
        bullet.update();
        if (bullet.active) {
            bullet.draw();
            return true;
        }
        return false;
    });

    // Spawn enemies
    spawnEnemy();

    // Update and draw enemies
    gameState.enemies = gameState.enemies.filter(enemy => {
        enemy.update();

        // Check collision with bullets
        for (let i = 0; i < gameState.bullets.length; i++) {
            const bullet = gameState.bullets[i];
            if (checkCollision(bullet, enemy)) {
                // Hit!
                bullet.active = false;
                enemy.active = false;
                gameState.score += 10;
                gameState.wordsLearned.add(enemy.word.chinese);
                updateWordDisplay(enemy.word);
                pronounceCantonese(enemy.word);
                updateUI();

                // Level up every 100 points
                if (gameState.score % 100 === 0 && gameState.score > 0) {
                    gameState.level++;
                    updateUI();
                }

                break;
            }
        }

        if (enemy.active) {
            enemy.draw();
            return true;
        }
        return false;
    });

    gameState.animationId = requestAnimationFrame(gameLoop);
}

// Stars for background effect
const stars = [];
for (let i = 0; i < 100; i++) {
    stars.push({
        x: Math.random() * CONFIG.canvasWidth,
        y: Math.random() * CONFIG.canvasHeight,
        size: Math.random() * 2
    });
}

function drawStars() {
    ctx.fillStyle = '#ffffff';
    stars.forEach(star => {
        ctx.fillRect(star.x, star.y, star.size, star.size);
        star.y += 0.5;
        if (star.y > CONFIG.canvasHeight) {
            star.y = 0;
            star.x = Math.random() * CONFIG.canvasWidth;
        }
    });
}

// Start Game
function startGame() {
    gameState.isRunning = true;
    gameState.isPaused = false;
    gameState.score = 0;
    gameState.lives = 3;
    gameState.level = 1;
    gameState.wordsLearned.clear();
    gameState.player = new Player();
    gameState.bullets = [];
    gameState.enemies = [];
    gameState.currentWord = getRandomWord();

    updateWordDisplay(gameState.currentWord);
    updateUI();

    document.getElementById('start-button').style.display = 'none';
    document.getElementById('pause-button').style.display = 'inline-block';
    document.getElementById('game-over').style.display = 'none';

    gameLoop();
}

// Pause Game
function pauseGame() {
    gameState.isPaused = !gameState.isPaused;
    const pauseButton = document.getElementById('pause-button');
    pauseButton.textContent = gameState.isPaused ? 'Resume' : 'Pause';

    if (!gameState.isPaused) {
        gameLoop();
    }
}

// Game Over
function gameOver() {
    gameState.isRunning = false;
    if (gameState.animationId) {
        cancelAnimationFrame(gameState.animationId);
    }

    document.getElementById('final-score').textContent = gameState.score;
    document.getElementById('words-learned').textContent = gameState.wordsLearned.size;
    document.getElementById('game-over').style.display = 'block';
    document.getElementById('pause-button').style.display = 'none';
}

// Restart Game
function restartGame() {
    startGame();
}

// Event Listeners
document.getElementById('start-button').addEventListener('click', startGame);
document.getElementById('pause-button').addEventListener('click', pauseGame);
document.getElementById('restart-button').addEventListener('click', restartGame);

// Click on word display to hear pronunciation
document.getElementById('word-display').addEventListener('click', () => {
    if (gameState.currentWord) {
        pronounceCantonese(gameState.currentWord);
    }
});

// Initialize
updateWordDisplay(getRandomWord());
updateUI();

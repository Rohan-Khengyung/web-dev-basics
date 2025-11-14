// script.js

// Game constants
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 540; // Adjusted for UI panel
const PLAYER_WIDTH = 40;
const PLAYER_HEIGHT = 20;
const BULLET_WIDTH = 4;
const BULLET_HEIGHT = 10;
const ALIEN_WIDTH = 30;
const ALIEN_HEIGHT = 20;
const BOSS_WIDTH = 100;
const BOSS_HEIGHT = 60;
const ALIEN_ROWS = 5;
const ALIEN_COLS = 10;
const ALIEN_SPACING = 50;
const INITIAL_ALIEN_SPEED = 10; // Further reduced initial speed
const SHOOT_COOLDOWN = 300; // ms
const ENEMY_SHOOT_INTERVAL = 1000; // ms average
const BOSS_SHOOT_INTERVAL = 200; // Faster for boss
const POWERUP_DROP_CHANCE = 0.15; // Slightly increased drop chance
const POWERUP_SPEED = 100; // px/s downward
const NUM_SETS_BEFORE_BOSS = 2; // Two sets before boss
const BOTTOM_THRESHOLD = 150; // Increased tolerance for bottom check

// Power-up types - enhanced for more power
const POWERUP_TYPES = {
    EXTRA_LIFE: { color: '#0f0', effect: 'extraLife' },
    RAPID_FIRE: { color: '#ff0', effect: 'rapidFire' },
    SHIELD: { color: '#00f', effect: 'shield' },
    TRIPLE_SHOT: { color: '#f0f', effect: 'tripleShot' },
    MEGA_BOMB: { color: '#f00', effect: 'megaBomb' },
    LASER_BEAM: { color: '#00ffff', effect: 'laserBeam' }
};

// Sound effects using Web Audio API
class AudioManager {
    constructor() {
        this.audioContext = null;
        this.init();
    }
    
    init() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
    }
    
    playTone(frequency, duration, type = 'sine', volume = 0.1) {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = type;
        
        gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }
    
    shootSound() {
        this.playTone(800, 0.1, 'square', 0.05);
    }
    
    explosionSound() {
        this.playTone(200, 0.2, 'sawtooth', 0.1);
        setTimeout(() => this.playTone(300, 0.15, 'sawtooth', 0.08), 50);
    }
    
    powerUpSound() {
        this.playTone(600, 0.3, 'sine', 0.15);
    }
    
    enemyShootSound() {
        this.playTone(400, 0.08, 'square', 0.03);
    }
    
    gameOverSound() {
        this.playTone(100, 1.0, 'sine', 0.2);
    }
    
    winSound() {
        this.playTone(800, 0.5, 'sine', 0.2);
        setTimeout(() => this.playTone(1000, 0.5, 'sine', 0.2), 200);
    }
}

// Game class to manage overall game state and loop
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = CANVAS_WIDTH;
        this.canvas.height = CANVAS_HEIGHT;
        
        this.audio = new AudioManager();
        
        this.state = 'start'; // 'start', 'playing', 'gameOver', 'win'
        this.score = 0;
        this.highScore = localStorage.getItem('spaceInvadersHighScore') || 0;
        this.lives = 3;
        this.level = 1;
        this.wave = 1; // Tracks sets/waves
        this.alienSpeed = INITIAL_ALIEN_SPEED;
        this.alienDirection = 1;
        this.shootCooldown = SHOOT_COOLDOWN;
        this.shieldActive = false;
        this.shieldTimer = 0;
        this.rapidFireTimer = 0;
        this.tripleShotTimer = 0;
        this.laserBeamTimer = 0;
        this.boss = null;
        this.bossHealth = 0;
        
        this.player = new Player(CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2, CANVAS_HEIGHT - 50);
        this.aliens = this.createAliens();
        this.playerBullets = [];
        this.enemyBullets = [];
        this.powerUps = [];
        this.lastShootTime = 0;
        this.lastEnemyShootTime = 0;
        this.lastBossShootTime = 0;
        
        this.keys = {};
        this.setupEventListeners();
        this.updateUI();
        
        // Draw stars for background
        this.stars = [];
        for (let i = 0; i < 100; i++) {
            this.stars.push({
                x: Math.random() * CANVAS_WIDTH,
                y: Math.random() * CANVAS_HEIGHT,
                size: Math.random() * 2 + 1
            });
        }
        
        this.gameLoop();
    }
    
    // Create initial grid of aliens, adjusted for level
    createAliens() {
        const rows = Math.min(8, ALIEN_ROWS + Math.floor((this.level - 1) / 2)); // Slower increase
        const cols = Math.min(15, ALIEN_COLS + Math.floor((this.level - 1) / 3));
        const spacing = Math.max(35, ALIEN_SPACING - this.level * 1.5); // Slower tightening
        const aliens = [];
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const x = col * spacing + 50;
                const y = row * 30 + 50; // Increased vertical spacing
                aliens.push(new Alien(x, y, row));
            }
        }
        return aliens;
    }
    
    // Spawn boss
    spawnBoss() {
        this.boss = new Boss(CANVAS_WIDTH / 2 - BOSS_WIDTH / 2, 50);
        this.bossHealth = 5; // Boss takes 5 hits
        this.aliens = []; // Clear regular aliens
    }
    
    // Update game speed based on remaining enemies and level (slower progression)
    updateAlienSpeed() {
        const remaining = this.aliens.length;
        const base = INITIAL_ALIEN_SPEED + (this.level - 1) * 3; // Even slower increase
        this.alienSpeed = base + (50 - remaining) * 0.2; // Minimal speed increase as aliens die
    }
    
    // Setup keyboard and touch event listeners
    setupEventListeners() {
        // Keyboard
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (e.code === 'Space' && this.state === 'playing') {
                e.preventDefault();
                this.shoot();
            }
        });
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        // Touch controls for mobile/responsive
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (this.state === 'playing') {
                this.shoot();
            }
        }, { passive: false });
        
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (this.state === 'playing' && e.touches.length > 0) {
                const touch = e.touches[0];
                const rect = this.canvas.getBoundingClientRect();
                const scaleX = CANVAS_WIDTH / rect.width;
                const x = (touch.clientX - rect.left) * scaleX;
                this.player.x = Math.max(0, Math.min(CANVAS_WIDTH - PLAYER_WIDTH, x - PLAYER_WIDTH / 2));
            }
        }, { passive: false });
        
        // Mouse for desktop touch simulation
        this.canvas.addEventListener('mousemove', (e) => {
            if (this.state === 'playing') {
                const rect = this.canvas.getBoundingClientRect();
                const scaleX = CANVAS_WIDTH / rect.width;
                const x = (e.clientX - rect.left) * scaleX;
                this.player.x = Math.max(0, Math.min(CANVAS_WIDTH - PLAYER_WIDTH, x - PLAYER_WIDTH / 2));
            }
        });
        
        this.canvas.addEventListener('click', (e) => {
            if (this.state === 'playing') {
                this.shoot();
            }
        });
        
        document.getElementById('startButton').addEventListener('click', () => this.start());
        document.getElementById('restartButton').addEventListener('click', () => this.restart());
    }
    
    // Start the game
    start() {
        this.audio.init(); // Ensure audio context starts
        this.state = 'playing';
        document.getElementById('startButton').style.display = 'none';
        document.getElementById('overlay').style.display = 'none';
    }
    
    // Restart the game
    restart() {
        this.state = 'start';
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.wave = 1;
        this.alienSpeed = INITIAL_ALIEN_SPEED;
        this.alienDirection = 1;
        this.shootCooldown = SHOOT_COOLDOWN;
        this.shieldActive = false;
        this.shieldTimer = 0;
        this.rapidFireTimer = 0;
        this.tripleShotTimer = 0;
        this.laserBeamTimer = 0;
        this.boss = null;
        this.bossHealth = 0;
        this.player = new Player(CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2, CANVAS_HEIGHT - 50);
        this.aliens = this.createAliens();
        this.playerBullets = [];
        this.enemyBullets = [];
        this.powerUps = [];
        document.getElementById('startButton').style.display = 'block';
        document.getElementById('overlay').style.display = 'none';
        this.updateUI();
    }
    
    // Handle player shooting with dynamic cooldown and modes
    shoot() {
        const now = Date.now();
        if (now - this.lastShootTime < this.shootCooldown) return;
        this.lastShootTime = now;
        this.audio.shootSound();
        
        const centerX = this.player.x + PLAYER_WIDTH / 2;
        const bulletX = centerX - BULLET_WIDTH / 2;
        
        if (this.tripleShotTimer > 0) {
            // Triple shot: three bullets in a spread
            this.playerBullets.push(new Bullet(bulletX - 10, this.player.y));
            this.playerBullets.push(new Bullet(bulletX, this.player.y));
            this.playerBullets.push(new Bullet(bulletX + 10, this.player.y));
        } else {
            // Single shot
            this.playerBullets.push(new Bullet(bulletX, this.player.y));
        }
    }
    
    // Random enemy shooting
    randomEnemyShoot() {
        const now = Date.now();
        const interval = ENEMY_SHOOT_INTERVAL - this.level * 50 + Math.random() * 500; // Slower increase
        if (now - this.lastEnemyShootTime < interval) return;
        this.lastEnemyShootTime = now;
        
        if (this.aliens.length > 0) {
            const shooter = this.aliens[Math.floor(Math.random() * this.aliens.length)];
            this.enemyBullets.push(new Bullet(shooter.x + ALIEN_WIDTH / 2 - BULLET_WIDTH / 2, shooter.y + ALIEN_HEIGHT, true));
            this.audio.enemyShootSound();
        }
    }
    
    // Boss shooting - powerful: shoots 3 bullets in spread
    bossShoot() {
        const now = Date.now();
        if (now - this.lastBossShootTime < BOSS_SHOOT_INTERVAL) return;
        this.lastBossShootTime = now;
        
        if (this.boss) {
            const centerX = this.boss.x + BOSS_WIDTH / 2;
            // Three bullets: left, center, right
            this.enemyBullets.push(new Bullet(centerX - 20, this.boss.y + BOSS_HEIGHT, true));
            this.enemyBullets.push(new Bullet(centerX, this.boss.y + BOSS_HEIGHT, true));
            this.enemyBullets.push(new Bullet(centerX + 20, this.boss.y + BOSS_HEIGHT, true));
            this.audio.enemyShootSound();
        }
    }
    
    // Create power-up on enemy destroy
    dropPowerUp(x, y) {
        if (Math.random() < POWERUP_DROP_CHANCE) {
            const type = Object.keys(POWERUP_TYPES)[Math.floor(Math.random() * Object.keys(POWERUP_TYPES).length)];
            this.powerUps.push(new PowerUp(x, y, type));
        }
    }
    
    // Apply power-up effect - enhanced durations and effects
    applyPowerUp(type) {
        this.audio.powerUpSound();
        switch (type) {
            case 'extraLife':
                this.lives += 1; // +1 life
                break;
            case 'rapidFire':
                this.shootCooldown = 50; // Much faster shooting
                this.rapidFireTimer = 10000; // 10 seconds
                break;
            case 'shield':
                this.shieldActive = true;
                this.shieldTimer = 5000; // 5 seconds
                break;
            case 'tripleShot':
                this.tripleShotTimer = 5000; // 5 seconds of triple shot
                break;
            case 'megaBomb':
                // Destroy all aliens/boss immediately
                this.aliens = [];
                if (this.boss) {
                    this.boss = null;
                    this.bossHealth = 0;
                    this.score += 500; // Bonus points
                    this.updateUI();
                    this.win(); // Win if boss destroyed
                } else {
                    this.score += 200; // Bonus for aliens
                    this.updateUI();
                    this.nextWave(); // Proceed to next
                }
                this.audio.explosionSound();
                break;
            case 'laserBeam':
                this.laserBeamTimer = 5000; // 5 seconds of laser beam
                break;
        }
        this.updateUI();
    }
    
    // Update game logic
    update(deltaTime) {
        if (this.state !== 'playing') return;
        
        // Update timers
        if (this.shieldTimer > 0) {
            this.shieldTimer -= deltaTime * 1000;
            if (this.shieldTimer <= 0) {
                this.shieldActive = false;
            }
        }
        if (this.rapidFireTimer > 0) {
            this.rapidFireTimer -= deltaTime * 1000;
            if (this.rapidFireTimer <= 0) {
                this.shootCooldown = SHOOT_COOLDOWN;
            }
        }
        if (this.tripleShotTimer > 0) {
            this.tripleShotTimer -= deltaTime * 1000;
            if (this.tripleShotTimer <= 0) {
                // Reset to single shot
            }
        }
        if (this.laserBeamTimer > 0) {
            this.laserBeamTimer -= deltaTime * 1000;
            if (this.laserBeamTimer <= 0) {
                // Laser deactivates
            }
        }
        
        // Player movement (keyboard)
        if (this.keys['ArrowLeft'] && this.player.x > 0) {
            this.player.x -= 250 * deltaTime; // Slightly faster player movement
        }
        if (this.keys['ArrowRight'] && this.player.x < CANVAS_WIDTH - PLAYER_WIDTH) {
            this.player.x += 250 * deltaTime;
        }
        
        // Update player
        this.player.update(deltaTime);
        
        // Update bullets
        this.playerBullets = this.playerBullets.filter(bullet => {
            bullet.update(deltaTime);
            return bullet.y > -BULLET_HEIGHT;
        });
        
        this.enemyBullets = this.enemyBullets.filter(bullet => {
            bullet.update(deltaTime);
            return bullet.y < CANVAS_HEIGHT;
        });
        
        // Update power-ups
        this.powerUps = this.powerUps.filter(powerUp => {
            powerUp.update(deltaTime);
            return powerUp.y < CANVAS_HEIGHT;
        });
        
        // Shooting
        this.randomEnemyShoot();
        this.bossShoot();
        
        // Update regular aliens - moved check after movement to prevent overshoot issues
        if (this.aliens.length > 0 && !this.boss) {
            const moveX = this.alienSpeed * deltaTime * this.alienDirection;
            this.aliens.forEach(alien => {
                alien.x += moveX;
            });
            
            let edgeHit = false;
            const minX = Math.min(...this.aliens.map(a => a.x));
            const maxX = Math.max(...this.aliens.map(a => a.x + ALIEN_WIDTH));
            if (minX <= 0 || maxX >= CANVAS_WIDTH) {
                edgeHit = true;
            }
            
            if (edgeHit) {
                this.aliens.forEach(alien => {
                    alien.y += 15; // Reduced descent amount
                });
                this.alienDirection *= -1;
            }
            
            // Check if aliens reached bottom
            if (this.aliens.some(alien => alien.y >= CANVAS_HEIGHT - BOTTOM_THRESHOLD)) {
                this.gameOver();
                return;
            }
        }
        
        // Update boss
        if (this.boss) {
            this.boss.update(deltaTime);
            if (this.boss.y >= CANVAS_HEIGHT - BOTTOM_THRESHOLD) {
                this.gameOver();
                return;
            }
        }
        
        // Laser beam collision if active
        if (this.laserBeamTimer > 0) {
            const centerX = this.player.x + PLAYER_WIDTH / 2;
            const laserRect = {
                x: centerX - 20,
                y: 0,
                width: 40,
                height: this.player.y
            };
            
            const laserAliensToRemove = [];
            this.aliens.forEach((alien, aIdx) => {
                if (this.checkCollision(laserRect, alien) && !laserAliensToRemove.includes(aIdx)) {
                    laserAliensToRemove.push(aIdx);
                    this.dropPowerUp(alien.x, alien.y);
                    this.score += 10 * (alien.row + 1) * this.level;
                    this.updateAlienSpeed();
                    this.updateUI();
                    this.audio.explosionSound();
                }
            });
            laserAliensToRemove.sort((a, b) => b - a).forEach(aIdx => {
                this.aliens.splice(aIdx, 1);
            });
            
            // Vs boss
            if (this.boss && this.checkCollision(laserRect, this.boss)) {
                this.bossHealth--;
                this.score += 100;
                this.updateUI();
                this.audio.explosionSound();
                if (this.bossHealth <= 0) {
                    this.boss = null;
                    this.win();
                }
            }
        }
        
        // Collision: player bullets vs aliens
        const bulletsToRemove = [];
        const aliensToRemove = [];
        this.playerBullets.forEach((bullet, bIdx) => {
            // Vs regular aliens
            for (let aIdx = 0; aIdx < this.aliens.length; aIdx++) {
                if (this.checkCollision(bullet, this.aliens[aIdx]) && !aliensToRemove.includes(aIdx)) {
                    bulletsToRemove.push(bIdx);
                    const alien = this.aliens[aIdx];
                    this.dropPowerUp(alien.x, alien.y);
                    aliensToRemove.push(aIdx);
                    this.score += 10 * (alien.row + 1) * this.level;
                    this.updateAlienSpeed();
                    this.updateUI();
                    this.audio.explosionSound();
                    break;
                }
            }
            // Vs boss
            if (this.boss && this.checkCollision(bullet, this.boss)) {
                bulletsToRemove.push(bIdx);
                this.bossHealth--;
                this.score += 100; // High score for boss hit
                this.updateUI();
                this.audio.explosionSound();
                if (this.bossHealth <= 0) {
                    this.boss = null;
                    this.win();
                }
            }
        });
        // Remove in reverse order
        aliensToRemove.sort((a, b) => b - a).forEach(aIdx => {
            this.aliens.splice(aIdx, 1);
        });
        bulletsToRemove.sort((a, b) => b - a).forEach(bIdx => {
            this.playerBullets.splice(bIdx, 1);
        });
        
        if (this.aliens.length === 0 && !this.boss) {
            this.nextWave();
        }
        
        // Collision: enemy bullets vs player
        const enemyBulletsToRemove = [];
        this.enemyBullets.forEach((bullet, bIdx) => {
            if (this.checkCollision(bullet, this.player)) {
                enemyBulletsToRemove.push(bIdx);
                if (!this.shieldActive) {
                    this.lives--;
                    this.updateUI();
                    if (this.lives <= 0) {
                        this.gameOver();
                        return;
                    }
                    this.audio.explosionSound();
                }
            }
        });
        enemyBulletsToRemove.sort((a, b) => b - a).forEach(bIdx => {
            this.enemyBullets.splice(bIdx, 1);
        });
        
        // Collision: player vs power-ups
        const powerUpsToRemove = [];
        this.powerUps.forEach((powerUp, pIdx) => {
            if (this.checkCollision(powerUp, this.player)) {
                powerUpsToRemove.push(pIdx);
                this.applyPowerUp(powerUp.type);
            }
        });
        powerUpsToRemove.sort((a, b) => b - a).forEach(pIdx => {
            this.powerUps.splice(pIdx, 1);
        });
    }
    
    // Next wave/set
    nextWave() {
        this.wave++;
        if (this.wave > NUM_SETS_BEFORE_BOSS) {
            // Spawn boss after two sets
            this.spawnBoss();
            this.wave = 1; // Reset for potential future
            this.updateUI();
        } else {
            // Next set of aliens
            this.aliens = this.createAliens();
            this.playerBullets = [];
            this.enemyBullets = [];
            this.powerUps = [];
            this.alienDirection = 1;
            this.updateAlienSpeed();
            this.updateUI();
        }
    }
    
    // Simple AABB collision detection
    checkCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    
    // Game over state
    gameOver() {
        this.state = 'gameOver';
        this.audio.gameOverSound();
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('spaceInvadersHighScore', this.highScore);
        }
        this.showOverlay('Game Over! Press Restart');
        this.updateUI();
    }
    
    // Win state
    win() {
        this.state = 'win';
        this.audio.winSound();
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('spaceInvadersHighScore', this.highScore);
        }
        this.showOverlay('You Win! Press Restart');
        this.updateUI();
    }
    
    // Show overlay message
    showOverlay(message) {
        document.getElementById('message').textContent = message;
        document.getElementById('overlay').style.display = 'flex';
    }
    
    // Update UI elements
    updateUI() {
        document.getElementById('score').textContent = `Score: ${this.score}`;
        document.getElementById('lives').textContent = `Lives: ${this.lives}`;
        document.getElementById('level').textContent = `Level: ${this.level}`;
        document.getElementById('wave').textContent = `Wave: ${this.wave}`;
        document.getElementById('highScore').textContent = `High Score: ${this.highScore}`;
        if (this.boss) {
            // Add boss health to UI? For simplicity, console or skip
        }
    }
    
    // Draw everything on canvas
    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        
        // Draw stars
        this.ctx.fillStyle = '#fff';
        this.stars.forEach(star => {
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
        
        if (this.state === 'playing' || this.state === 'gameOver' || this.state === 'win') {
            // Draw laser beam if active
            if (this.laserBeamTimer > 0) {
                const centerX = this.player.x + PLAYER_WIDTH / 2;
                this.ctx.fillStyle = 'rgba(0, 255, 255, 0.3)';
                this.ctx.fillRect(centerX - 20, 0, 40, this.player.y);
                // Glowing effect
                this.ctx.strokeStyle = '#00ffff';
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(centerX - 20, 0, 40, this.player.y);
            }
            
            // Draw player
            this.player.draw(this.ctx);
            if (this.shieldActive) {
                // Draw shield
                this.ctx.strokeStyle = '#00f';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.arc(this.player.x + PLAYER_WIDTH / 2, this.player.y + PLAYER_HEIGHT / 2, PLAYER_WIDTH, 0, Math.PI * 2);
                this.ctx.stroke();
            }
            
            // Draw aliens
            this.aliens.forEach(alien => alien.draw(this.ctx));
            
            // Draw boss
            if (this.boss) {
                this.boss.draw(this.ctx);
                // Draw boss health bar
                this.ctx.fillStyle = '#f00';
                this.ctx.fillRect(this.boss.x, this.boss.y - 10, BOSS_WIDTH * (this.bossHealth / 5), 5);
            }
            
            // Draw bullets
            this.playerBullets.forEach(bullet => bullet.draw(this.ctx, false));
            this.enemyBullets.forEach(bullet => bullet.draw(this.ctx, true));
            
            // Draw power-ups
            this.powerUps.forEach(powerUp => powerUp.draw(this.ctx));
        }
    }
    
    // Main game loop using requestAnimationFrame
    gameLoop() {
        const now = performance.now();
        const deltaTime = (now - (this.lastTime || now)) / 1000;
        this.lastTime = now;
        
        this.update(deltaTime);
        this.draw();
        
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Player class
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = PLAYER_WIDTH;
        this.height = PLAYER_HEIGHT;
        this.speed = 600; // px/s
    }
    
    update(deltaTime) {
        // No additional update needed
    }
    
    // Draw simple spaceship (triangle)
    draw(ctx) {
        ctx.fillStyle = '#0f0';
        ctx.beginPath();
        ctx.moveTo(this.x + this.width / 2, this.y);
        ctx.lineTo(this.x, this.y + this.height);
        ctx.lineTo(this.x + this.width, this.y + this.height);
        ctx.closePath();
        ctx.fill();
    }
}

// Alien class
class Alien {
    constructor(x, y, row) {
        this.x = x;
        this.y = y;
        this.width = ALIEN_WIDTH;
        this.height = ALIEN_HEIGHT;
        this.row = row;
    }
    
    // Draw simple alien (rectangle with eyes)
    draw(ctx) {
        ctx.fillStyle = '#00f';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        // Eyes
        ctx.fillStyle = '#fff';
        ctx.fillRect(this.x + 5, this.y + 5, 4, 4);
        ctx.fillRect(this.x + this.width - 9, this.y + 5, 4, 4);
    }
}

// Boss class - powerful: moves side to side, shoots spread
class Boss {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = BOSS_WIDTH;
        this.height = BOSS_HEIGHT;
        this.speed = 50; // Slower but deliberate
        this.direction = 1;
    }
    
    update(deltaTime) {
        this.x += this.speed * deltaTime * this.direction;
        if (this.x <= 0 || this.x >= CANVAS_WIDTH - this.width) {
            this.direction *= -1;
            this.y += 10; // Slowly descend
        }
    }
    
    draw(ctx) {
        ctx.fillStyle = '#f00';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        // Simple boss design: red rectangle with "BOSS" text
        ctx.fillStyle = '#fff';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('BOSS', this.x + this.width / 2, this.y + this.height / 2 + 7);
    }
}

// Bullet class
class Bullet {
    constructor(x, y, isEnemy = false) {
        this.x = x;
        this.y = y;
        this.width = BULLET_WIDTH;
        this.height = BULLET_HEIGHT;
        this.speed = 300; // px/s
        this.isEnemy = isEnemy;
    }
    
    update(deltaTime) {
        this.y += this.isEnemy ? this.speed * deltaTime : -this.speed * deltaTime;
    }
    
    // Draw bullet as small rectangle
    draw(ctx, isEnemy) {
        ctx.fillStyle = isEnemy ? '#f00' : '#ff0';
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}

// PowerUp class
class PowerUp {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.width = 20;
        this.height = 20;
        this.type = type;
        this.speed = POWERUP_SPEED;
        this.color = POWERUP_TYPES[type].color;
    }
    
    update(deltaTime) {
        this.y += this.speed * deltaTime;
    }
    
    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        // Simple icon
        ctx.fillStyle = '#000';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.type.charAt(0).toUpperCase(), this.x + 10, this.y + 15);
    }
}

// Initialize game when page loads
window.addEventListener('load', () => {
    new Game();
});
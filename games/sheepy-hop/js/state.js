// Game State variables and management

class GameState {
    constructor() {
        // Core game state
        this.gameState = 'START'; // START, PLAYING, BONUS, FINISHED
        this.isSheepy = false;

        // Track game phase: 1 = first 10 pink coins, 2 = sheepy gold coins, 3 = second 10 pink coins
        this.currentPhase = 1;
        
        this.currentLevelName = 'MAIN';
        
        // Lives
        this.maxLives = 3;
        this.lives = 3;
        this.isInvincible = false;

        // Scores and collections
        this.pinkCoinsCollected = 0; // Represents primary collectable
        this.goldCoinsCollected = 0; // Represents sheepy-mode collectable
        this.score = 0;

        // Player physics
        this.playerVelY = 0;
        this.lastTime = 0;

        // Bonus level
        this.bonusTimeRemaining = 10;
        this.lastRaspberryTime = 0;

        // Game objects arrays
        this.pinkCoins = [];
        this.goldCoins = [];
        this.raspberries = [];
        this.trees = [];

        // Three.js objects
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.player = null;
        this.ground = null;

        // UI elements
        this.uiElements = {
            titleText: null,
            coinCount: null,
            coinDisplay: null,
            scoreElement: null,
            finalScore: null,
            startScreen: null,
uiLayer: null,
            joystickContainer: null,
            actionButton: null
        };

        // Controls
        this.keys = {};
        this.joyIn = { x: 0, y: 0 };
        this.touchId = null;

        // Audio
        this.audioManager = null;

        // Reference to game engine
        this.gameEngine = null;
    }

    // Initialize game state
    init(audioManager, gameEngine = null, levelName = 'MAIN', resetLives = true) {
        this.audioManager = audioManager;
        this.gameEngine = gameEngine;
        this.reset(levelName, resetLives);
    }

    // Reset game state to initial values
    reset(levelName = 'MAIN', resetLives = true) {
        this.gameState = 'START';
        this.currentLevelName = levelName;
        
        this.pinkCoinsCollected = 0;
        this.goldCoinsCollected = 0;

        this.isInvincible = false;
        this.isSheepy = false;
        this.currentPhase = 1;

        if (resetLives) {
            this.lives = this.maxLives;
            this.score = 0;
        }
        this.playerVelY = 0;
        this.lastTime = 0;
        this.bonusTimeRemaining = 10;
        this.lastRaspberryTime = 0;

        // Clear arrays
        this.pinkCoins = [];
        this.goldCoins = [];
        this.raspberries = [];
        this.trees = [];

        // Reset controls
        this.keys = {};
        this.joyIn = { x: 0, y: 0 };
        this.touchId = null;
    }

    // Update UI elements based on game state
    updateUI() {
        if (!this.uiElements.titleText) return;

        const level = LEVELS[this.currentLevelName];

        switch (this.gameState) {
            case 'START':
                this.uiElements.titleText.innerText = `Collect 10 ${level.primaryCoinName}!`;
                this.uiElements.titleText.style.color = "#ffffff";
                this.uiElements.coinDisplay.innerHTML = `${level.primaryCoinLabel}<span id="coin-count" class="highlight" style="color:${level.primaryCoinColor}">0</span> / 10`;
                this.uiElements.coinCount = document.getElementById('coin-count');
                break;

            case 'PLAYING':
                if (this.isSheepy) {
                    this.uiElements.titleText.innerText = `SHEEPY MODE! Collect 10 ${level.goldCoinName.toUpperCase()}!`;
                    this.uiElements.titleText.style.color = level.goldCoinColor;
                    this.uiElements.coinDisplay.innerHTML = `${level.goldCoinName}: <span id="coin-count" class="highlight" style="color:${level.goldCoinColor}">` +
                        this.goldCoinsCollected + '</span> / 10';
                    this.uiElements.coinCount = document.getElementById('coin-count');
                } else {
                    this.uiElements.titleText.style.color = "#ffffff";
                    if (this.currentPhase === 3) {
                        const coinsInPhase = this.pinkCoinsCollected - 10;
                        this.uiElements.titleText.innerText = `Collect 10 More ${level.primaryCoinName}!`;
                        this.uiElements.coinDisplay.innerHTML = `${level.primaryCoinLabel}<span id="coin-count" class="highlight" style="color:${level.primaryCoinColor}">` +
                            coinsInPhase + '</span> / 10';
                    } else {
                        this.uiElements.titleText.innerText = `Collect 10 ${level.primaryCoinName}!`;
                        this.uiElements.coinDisplay.innerHTML = `${level.primaryCoinLabel}<span id="coin-count" class="highlight" style="color:${level.primaryCoinColor}">` +
                            this.pinkCoinsCollected + '</span> / 10';
                    }
                    this.uiElements.coinCount = document.getElementById('coin-count');
                } break;

            case 'BONUS':
                this.uiElements.titleText.innerText = "BONUS ROUND!";
                this.uiElements.titleText.style.color = "#e30b5d";
                this.uiElements.coinDisplay.innerHTML = 'Time: <span style="color:#e30b5d; font-size: 30px;">' +
                    Math.ceil(this.bonusTimeRemaining) + 's</span>';
                break;

            case 'FINISHED':
                if (this.uiElements.finalScore) {
                    this.uiElements.finalScore.innerText = this.score.toString();
                }
                break;
        }

        // Update score display
        if (this.uiElements.scoreElement) {
            this.uiElements.scoreElement.innerText = this.score.toString();
        }
        
        this.updateLivesUI();
    }
    
    // Update Lives UI
    updateLivesUI() {
        if (!this.uiElements.livesIcons) return;
        let sheepStr = '';
        for (let i = 0; i < this.lives; i++) {
            sheepStr += '🐑';
        }
        for (let i = this.lives; i < this.maxLives; i++) {
            sheepStr += '💀';
        }
        this.uiElements.livesIcons.innerText = sheepStr;
    }
    
    // Lose a life
    loseLife() {
        if (this.lives > 0) {
            this.lives--;
            this.updateLivesUI();
        }
    }

    // Collect a pink coin
    collectPinkCoin() {
        this.pinkCoinsCollected++;
        this.score += 10;
        this.updateUI();

        // Play sound
        if (this.audioManager) {
            this.audioManager.playCoinSound('pink');
        }
    }

    // Collect a gold coin
    collectGoldCoin() {
        this.goldCoinsCollected++;
        this.score += 50;
        this.updateUI();

        // Play sound
        if (this.audioManager) {
            this.audioManager.playCoinSound('gold');
        }
    }

    // Collect a raspberry
    collectRaspberry() {
        this.score += 200;
        this.updateUI();

        // Play sound
        if (this.audioManager) {
            this.audioManager.playCoinSound('gold');
        }
    }

    // Transform to sheepy
    transformToSheepy() {
        this.isSheepy = true;
        this.currentPhase = 2; // Now in sheepy gold coin phase
        this.updateUI();

        // Play sound
        if (this.audioManager) {
            this.audioManager.playBaa(800);
        }
    }

    // Revert to normal
    revertToNormal() {
        this.isSheepy = false;
        this.currentPhase = 3; // Now in second pink coin phase (11-20)
        // Reset gold coins count
        this.goldCoinsCollected = 0;
        this.updateUI();

        // Play sound
        if (this.audioManager) {
            this.audioManager.playBaa(150);
        }
    }

    // Start bonus level
    startBonusLevel() {
        this.gameState = 'BONUS';
        this.bonusTimeRemaining = 10;
        this.updateUI();

        // Play sound
        if (this.audioManager) {
            this.audioManager.playBaa(600);
        }
    }

    // Finish level
    finishLevel() {
        this.gameState = 'FINISHED';
        this.updateUI();

        // Play sound
        if (this.audioManager) {
            this.audioManager.playBaa(440);
            this.audioManager.stopAllMusic();
        }
    }

    // Update bonus level timer
    updateBonusLevel(deltaTime) {
        this.bonusTimeRemaining -= deltaTime;
        if (this.bonusTimeRemaining <= 0) {
            return false;
        }
        this.updateUI();
        return true;
    }

    // Check game progression
    checkProgression() {
        // Phase 1: First 10 pink coins → transform to sheepy
        if (this.currentPhase === 1 && this.pinkCoinsCollected === 10) {
            this.transformToSheepy();
            if (this.gameEngine) {
                this.gameEngine.transformToSheepy();
            } else if (window.gameEngine) {
                window.gameEngine.transformToSheepy();
            }
            return true;
        }

        // Phase 2: Sheepy mode - 10 gold coins → revert to normal
        if (this.currentPhase === 2 && this.isSheepy && this.goldCoinsCollected >= 10) {
            this.revertToNormal();
            if (this.gameEngine) {
                this.gameEngine.revertToNormal();
            } else if (window.gameEngine) {
                window.gameEngine.revertToNormal();
            }
            return true;
        }

        // Phase 3: Second 10 pink coins (total 20) → bonus level
        if (this.currentPhase === 3 && this.pinkCoinsCollected >= 20) {
            this.startBonusLevel();
            if (this.gameEngine) {
                this.gameEngine.startBonusLevel();
            } else if (window.gameEngine) {
                window.gameEngine.startBonusLevel();
            }
            return true;
        }

        return false;
    }

    // Get player speed based on game state
    getPlayerSpeed() {
        if (this.gameState === 'BONUS') return 0.5;
        if (this.isSheepy) return 0.6;
        return 0.3;
    }

    // Get camera height based on game state
    getCameraHeight() {
        if (this.gameState === 'BONUS') return 35;
        if (this.isSheepy) return 40;
        return 25;
    }

    // Get camera distance based on game state
    getCameraDistance() {
        if (this.gameState === 'BONUS') return 25;
        if (this.isSheepy) return 30;
        return 20;
    }
}

// Create global game state instance
const gameState = new GameState();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GameState, gameState };
}

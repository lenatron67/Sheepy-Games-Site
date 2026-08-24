// Main Three.js engine and Game Loop

// Global game engine instance
let gameEngine = null;

// Initialize when page loads
window.addEventListener('DOMContentLoaded', () => {
    gameEngine = new GameEngine();
    window.gameEngine = gameEngine; // Expose globally for state management
});

class GameEngine {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.player = null;
        this.ground = null;
        this.pinkCoins = [];
        this.goldCoins = [];
        this.raspberries = [];
        this.trees = [];
        this.snakes = [];
        this.keys = {};
        this.joyIn = { x: 0, y: 0 };
        this.touchId = null;
        this.uiElements = {};

        this.init();
    }

    init() {
        // Playtesting: change to 'DESERT','SNOW','JUNGLE','VOLCANO' to start on that level. Set back to 'MAIN' for release.
        gameState.init(audioManager, this, 'MAIN');
        this.createScene();
        this.createLighting();
        this.createGround();
        this.createPlayer();
        this.createLevelObjects();
        this.setupUIReferences();
        this.setupEventListeners();
        this.setupControls();
        this.loadLeaderboard();
        this.animate();
    }

    async loadLeaderboard() {
        if (!window.FirebaseManager) return;
        const listEl = document.getElementById('leaderboard-list');
        if (!listEl) return;

        listEl.innerHTML = '<li>Loading...</li>';
        const scores = await window.FirebaseManager.getLeaderboard();

        if (scores.length === 0) {
            listEl.innerHTML = '<li>No scores yet!</li>';
            return;
        }

        listEl.innerHTML = '';
        scores.forEach((s, index) => {
            const li = document.createElement('li');

            const rank = document.createElement('span');
            rank.style.color = '#FF69B4';
            rank.textContent = `#${index + 1}`;

            const scoreSpan = document.createElement('span');
            scoreSpan.style.color = '#4facfe';
            scoreSpan.textContent = String(s.score);

            li.appendChild(rank);
            li.appendChild(document.createTextNode(` ${s.name}: `));
            li.appendChild(scoreSpan);
            listEl.appendChild(li);
        });
    }

    createScene() {
        this.scene = new THREE.Scene();
        const initialSky = LEVELS[gameState.currentLevelName].skyColor;
        this.scene.background = new THREE.Color(initialSky);
        this.scene.fog = new THREE.Fog(initialSky, 20, 60);

        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 25, 20);

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        document.getElementById('canvas-container').appendChild(this.renderer.domElement);

        // Initialize ParticleSystem with scene
        ParticleSystem.init(this.scene);

        gameState.scene = this.scene;
        gameState.camera = this.camera;
        gameState.renderer = this.renderer;
    }

    createLighting() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(20, 40, 20);
        dirLight.castShadow = true;
        dirLight.shadow.camera.right = 30;
        dirLight.shadow.camera.left = -30;
        dirLight.shadow.camera.top = 30;
        dirLight.shadow.camera.bottom = -30;
        this.scene.add(dirLight);
    }

    createGround() {
        const levelName = gameState.currentLevelName;
        const level = LEVELS[levelName];
        const groundGeometry = new THREE.PlaneGeometry(level.GROUND_SIZE, level.GROUND_SIZE);

        const texture = TextureGenerator[level.groundType]();

        const groundMaterial = new THREE.MeshStandardMaterial({
            map: texture,
            roughness: 1,
            metalness: 0
        });

        this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
        this.ground.rotation.x = -Math.PI / 2;
        this.ground.receiveShadow = true;
        this.scene.add(this.ground);
        gameState.ground = this.ground;
    }

    createPlayer() {
        this.player = ModelCreator.createSheep();
        this.scene.add(this.player);
        gameState.player = this.player;
    }

    createLevelObjects() {
        const levelName = gameState.currentLevelName;
        const level = LEVELS[levelName];

        for (let i = 0; i < level.PINK_COINS_COUNT; i++) {
            const coin = ModelCreator[level.primaryCoinModel]();
            const pos = LevelUtils.getRandomPosition(level.SMALL_WORLD_SIZE);
            coin.position.set(pos.x, level.COIN_SPAWN_HEIGHT, pos.z);
            this.scene.add(coin);
            this.pinkCoins.push(coin);
            gameState.pinkCoins.push(coin);
        }

        for (let i = 0; i < level.TREES_COUNT; i++) {
            const tree = ModelCreator[level.obstacleModel]();
            let pos;
            do {
                pos = LevelUtils.getRandomPosition(level.WORLD_SIZE);
            } while (
                LevelUtils.isTooCloseToSpawn(pos.x, pos.z, level.TREE_EXCLUSION_ZONE) ||
                this.pinkCoins.some(c => Math.abs(c.position.x - pos.x) < 3 && Math.abs(c.position.z - pos.z) < 3)
            );

            tree.position.set(pos.x, 0, pos.z);
            this.scene.add(tree);
            this.trees.push(tree);
            gameState.trees.push(tree);
        }

        // Create fence perimeter to keep play area bounded
        const fence = ModelCreator.createFencePerimeter(level.WORLD_SIZE);
        this.scene.add(fence);

        if (level.hasEnemies) {
            this.snakes = [];
            const enemyCount = level.enemyTypes.length;
            for (let i = 0; i < enemyCount; i++) {
                const angle = (i / enemyCount) * Math.PI * 2;
                const home = new THREE.Vector3(Math.cos(angle) * 30, 0, Math.sin(angle) * 30);
                const enemy = ModelCreator[level.enemyModel](level.enemyColors[i]);
                enemy.position.copy(home);
                enemy.userData = {
                    ...enemy.userData,
                    aiType: level.enemyTypes[i],
                    home: home,
                    velocity: new THREE.Vector3((Math.random() - 0.5), 0, (Math.random() - 0.5)).normalize(),
                    speed: level.enemySpeed
                };
                this.scene.add(enemy);
                this.snakes.push(enemy);
            }
        }
    }

    setupUIReferences() {
        gameState.uiElements = {
            titleText: document.getElementById('title-text'),
            coinCount: document.getElementById('coin-count'),
            coinDisplay: document.getElementById('coin-display'),
            scoreElement: document.getElementById('score'),
            startScreen: document.getElementById('start-screen'),
            gameOverScreen: document.getElementById('game-over-screen'),
            uiLayer: document.getElementById('ui-layer'),
            joystickContainer: document.getElementById('joystick-container'),
            actionButton: document.getElementById('action-btn'),
            livesIcons: document.getElementById('lives-icons')
        };
        this.uiElements = gameState.uiElements;
    }

    setupEventListeners() {
        document.getElementById('btn-start').addEventListener('click', () => this.startGame());
        document.getElementById('btn-credits').addEventListener('click', () => {
            document.getElementById('credits-modal').style.display = 'block';
        });
        document.getElementById('btn-leaderboard').addEventListener('click', () => {
            document.getElementById('leaderboard-modal').style.display = 'block';
            this.loadLeaderboard(); // Make sure it grabs latest when clicked
        });

        document.getElementById('btn-go-save-score').addEventListener('click', async () => {
            const nameInput = document.getElementById('go-player-name-input').value.trim();
            const name = nameInput || "Anonymous Sheep";
            localStorage.setItem('sheepy_player_name', name);

            document.getElementById('btn-go-save-score').style.display = 'none';
            document.getElementById('go-save-status-msg').innerText = "Saving...";
            document.getElementById('go-save-status-msg').style.display = 'block';

            if (window.FirebaseManager) {
                await window.FirebaseManager.saveScore(gameState.score, name);
                document.getElementById('go-save-status-msg').innerText = "Score Saved!";
                this.loadLeaderboard();
                document.getElementById('leaderboard-modal').style.display = 'block';
            }
        });

        document.getElementById('btn-try-again').addEventListener('click', () => {
            document.getElementById('game-over-screen').style.display = 'none';
            // Start from Level 1 and reset lives
            this.startNextLevel('MAIN', true);
        });

        document.getElementById('action-btn').addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleAction();
        }, { passive: false });

        window.addEventListener('keydown', (e) => {
            if (gameState.gameState === 'START' && e.key === 'Enter') this.startGame();
            if (gameState.gameState === 'PLAYING' || gameState.gameState === 'BONUS') {
                this.keys[e.key] = true;
                if (e.code === 'Space') this.handleAction();
                if (e.key === 'k' || e.key === 'K') this.playerTakeDamage(); // Debug hotkey
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });

        window.addEventListener('resize', () => this.handleResize());
        window.addEventListener('click', () => {
            audioManager.init();
            if (gameState.gameState === 'START' && !audioManager.isThemePlaying) {
                audioManager.playThemeMusic();
            }
        });
    }

    setupControls() {
        const joyDiv = document.getElementById('joystick-container');
        const joyKnob = document.getElementById('joystick-knob');
        const joyRad = 60;

        joyDiv.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.touchId = e.changedTouches[0].identifier;
            this.updateJoy(e.changedTouches[0], joyDiv, joyKnob, joyRad);
        }, { passive: false });

        joyDiv.addEventListener('touchmove', (e) => {
            e.preventDefault();
            for (let i = 0; i < e.changedTouches.length; i++) {
                if (e.changedTouches[i].identifier === this.touchId) {
                    this.updateJoy(e.changedTouches[i], joyDiv, joyKnob, joyRad);
                }
            }
        }, { passive: false });

        joyDiv.addEventListener('touchend', () => this.resetJoy(joyKnob));
        joyDiv.addEventListener('touchcancel', () => this.resetJoy(joyKnob));
    }

    updateJoy(touch, joyDiv, joyKnob, joyRad) {
        const rect = joyDiv.getBoundingClientRect();
        let dx = touch.clientX - (rect.left + rect.width / 2);
        let dy = touch.clientY - (rect.top + rect.height / 2);
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > joyRad) {
            dx *= joyRad / dist;
            dy *= joyRad / dist;
        }

        joyKnob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
        this.joyIn.x = dx / joyRad;
        this.joyIn.y = dy / joyRad;
        gameState.joyIn = this.joyIn;
    }

    resetJoy(joyKnob) {
        this.touchId = null;
        this.joyIn = { x: 0, y: 0 };
        gameState.joyIn = this.joyIn;
        joyKnob.style.transform = `translate(-50%, -50%)`;
    }

    handleAction() {
        if (gameState.gameState === 'PLAYING' && !gameState.isSheepy && this.player.position.y <= 0.5) {
            gameState.playerVelY = 0.6;
        }
        audioManager.playBaa();
    }

    startGame() {
        if (gameState.gameState === 'PLAYING') return;

        audioManager.stopThemeMusic();
        audioManager.playGameMusic();

        this.uiElements.startScreen.style.display = 'none';
        document.getElementById('leaderboard-modal').style.display = 'none';
        this.uiElements.uiLayer.style.display = 'block';

        // --- Option 1 Splash Screen Trigger ---
        const splash1 = document.getElementById('level-splash-1');
        if (splash1) {
            splash1.innerText = LEVELS[gameState.currentLevelName].displayName;
            splash1.style.display = 'flex';
            setTimeout(() => {
                splash1.style.display = 'none';
            }, 2500);
        }
        // --------------------------------------

        this.uiElements.joystickContainer.style.display = 'block';
        this.uiElements.actionButton.style.display = 'flex';

        gameState.gameState = 'PLAYING';
        gameState.updateUI();

        audioManager.init();
        audioManager.playBaa(220);
    }

    handleResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    updatePlayerMovement(deltaTime) {
        let dx = 0, dz = 0;

        if (this.keys['w'] || this.keys['ArrowUp']) dz = -1;
        if (this.keys['s'] || this.keys['ArrowDown']) dz = 1;
        if (this.keys['a'] || this.keys['ArrowLeft']) dx = -1;
        if (this.keys['d'] || this.keys['ArrowRight']) dx = 1;

        if (dx !== 0 || dz !== 0) {
            const len = Math.sqrt(dx * dx + dz * dz);
            dx /= len;
            dz /= len;
        }

        if (this.joyIn.x !== 0 || this.joyIn.y !== 0) {
            dx = this.joyIn.x;
            dz = this.joyIn.y;
        }

        const speed = gameState.getPlayerSpeed();
        let moveX = dx * speed;
        let moveZ = dz * speed;

        // Predictive collision detection with trees/cacti
        const playerRadius = 1.0;
        const treeRadius = 1.5;

        let newX = this.player.position.x + moveX;
        let newZ = this.player.position.z + moveZ;

        for (let tree of this.trees) {
            const distSq = (newX - tree.position.x) ** 2 + (newZ - tree.position.z) ** 2;
            const minSq = (playerRadius + treeRadius) ** 2;

            if (distSq < minSq) {
                // We have a collision. Push the new position out along the collision normal
                const dist = Math.sqrt(distSq);
                // Prevent division by zero
                if (dist === 0) continue;

                const overlap = (playerRadius + treeRadius) - dist;
                const nx = (newX - tree.position.x) / dist;
                const nz = (newZ - tree.position.z) / dist;

                newX += nx * overlap;
                newZ += nz * overlap;
            }
        }

        this.player.position.x = newX;
        this.player.position.z = newZ;
        // Clamp player position to stay within the fence bounds
        const level = LEVELS[gameState.currentLevelName] || LEVELS.MAIN;
        const limit = (level.WORLD_SIZE / 2) - 1.0;
        this.player.position.x = Math.max(-limit, Math.min(limit, this.player.position.x));
        this.player.position.z = Math.max(-limit, Math.min(limit, this.player.position.z));

        if (dx !== 0 || dz !== 0) {
            this.player.rotation.y = Math.atan2(dx, dz);
        }

        if (gameState.gameState === 'PLAYING' && !gameState.isSheepy) {
            this.player.position.y += gameState.playerVelY;
            gameState.playerVelY -= 0.04;
            if (this.player.position.y < 0) {
                this.player.position.y = 0;
                gameState.playerVelY = 0;
            }
        }

        if (gameState.isSheepy) {
            const targetY = 6 + Math.sin(Date.now() * 0.003) * 0.5;
            this.player.position.y = THREE.MathUtils.lerp(this.player.position.y, targetY, 0.05);

            if (Math.abs(dx) > 0.01 || Math.abs(dz) > 0.01) {
                ParticleSystem.spawnSpark(this.player.position, dx, dz);
                ParticleSystem.spawnSpark(this.player.position, dx, dz);
            }
        }

        if (gameState.gameState === 'BONUS') {
            this.player.position.y = Math.abs(Math.sin(Date.now() * 0.01)) * 0.5;
        }
    }

    updateCoins() {
        // Only check pink coins if player is not sheepy (phases 1 and 3)
        if (!gameState.isSheepy) {
            for (let i = this.pinkCoins.length - 1; i >= 0; i--) {
                const coin = this.pinkCoins[i];
                coin.rotation.y += 0.05;

                if (this.player.position.distanceTo(coin.position) < 2) {
                    this.scene.remove(coin);
                    this.pinkCoins.splice(i, 1);
                    gameState.pinkCoins.splice(i, 1);
                    gameState.collectPinkCoin();
                    gameState.checkProgression();
                }
            }
        }

        // Only check gold coins if player is sheepy (phase 2)
        if (gameState.isSheepy) {
            for (let i = this.goldCoins.length - 1; i >= 0; i--) {
                const coin = this.goldCoins[i];
                coin.rotation.y += 0.05;

                if (this.player.position.distanceTo(coin.position) < 5) {
                    this.scene.remove(coin);
                    this.goldCoins.splice(i, 1);
                    gameState.goldCoins.splice(i, 1);
                    gameState.collectGoldCoin();
                    gameState.checkProgression();
                }
            }
        }
    }

    updateBonusLevel(timestamp, deltaTime) {
        if (timestamp - gameState.lastRaspberryTime > LEVELS.BONUS.RASPBERRY_SPAWN_INTERVAL) {
            const levelName = gameState.currentLevelName;
            const level = LEVELS[levelName] || LEVELS.MAIN;
            const raspberry = ModelCreator[level.bonusItemModel]();
            const spawnSize = level.SMALL_WORLD_SIZE;
            const pos = LevelUtils.getRandomPosition(spawnSize);

            raspberry.position.set(pos.x, LEVELS.BONUS.RASPBERRY_SPAWN_HEIGHT, pos.z);
            raspberry.scale.set(3, 3, 3);
            this.scene.add(raspberry);
            this.raspberries.push(raspberry);
            gameState.raspberries.push(raspberry);
            gameState.lastRaspberryTime = timestamp;
        }

        for (let i = this.raspberries.length - 1; i >= 0; i--) {
            const r = this.raspberries[i];

            if (r.position.y > LEVELS.BONUS.RASPBERRY_FINAL_HEIGHT) {
                r.position.y -= LEVELS.BONUS.RASPBERRY_FALL_SPEED;
                r.rotation.x += 0.05;
                r.rotation.z += 0.05;
            } else {
                r.position.y = LEVELS.BONUS.RASPBERRY_FINAL_HEIGHT;
            }

            if (r.position.distanceTo(this.player.position) < LEVELS.BONUS.RASPBERRY_COLLISION_DISTANCE) {
                this.scene.remove(r);
                this.raspberries.splice(i, 1);
                gameState.raspberries.splice(i, 1);
                gameState.collectRaspberry();
            }
        }

        if (!gameState.updateBonusLevel(deltaTime)) {
            this.finishLevel();
            return;
        }
    }

    updateCamera() {
        const targetPosition = new THREE.Vector3(
            this.player.position.x,
            gameState.getCameraHeight(),
            this.player.position.z + gameState.getCameraDistance()
        );

        this.camera.position.lerp(targetPosition, 0.05);
        this.camera.lookAt(this.player.position);
    }

    transformToSheepy() {
        // Note: gameState.transformToSheepy() is already called by checkProgression()

        let scale = 1;
        const grow = setInterval(() => {
            scale += 0.1;
            this.player.scale.set(scale, scale, scale);
            if (scale >= 3) clearInterval(grow);
        }, 50);

        const levelName = gameState.currentLevelName;
        const level = LEVELS[levelName];
        for (let i = 0; i < level.GOLD_COINS_COUNT; i++) {
            const coin = ModelCreator[level.goldCoinModel]();
            const pos = LevelUtils.getRandomPosition(level.SMALL_WORLD_SIZE);
            coin.scale.set(3, 3, 3);
            coin.position.set(pos.x, level.GOLD_COIN_SPAWN_HEIGHT + Math.random() * 3, pos.z);
            this.scene.add(coin);
            this.goldCoins.push(coin);
            gameState.goldCoins.push(coin);
        }
    }

    revertToNormal() {
        // Remove all gold coins from scene when reverting to normal
        for (let i = this.goldCoins.length - 1; i >= 0; i--) {
            const coin = this.goldCoins[i];
            this.scene.remove(coin);
            this.goldCoins.splice(i, 1);
            if (gameState.goldCoins.length > i) {
                gameState.goldCoins.splice(i, 1);
            }
        }

        let scale = 3;
        const shrink = setInterval(() => {
            scale -= 0.1;
            this.player.scale.set(scale, scale, scale);
            if (this.player.position.y > 0) {
                this.player.position.y = Math.max(0, this.player.position.y - 0.35);
            }
            if (scale <= 1) {
                this.player.scale.set(1, 1, 1);
                this.player.position.y = 0;
                clearInterval(shrink);
            }
        }, 50);
    }

    startBonusLevel() {
        while (this.player.children.length > 0) this.player.remove(this.player.children[0]);
        const chickenVisuals = ModelCreator.createChicken();
        const parts = [...chickenVisuals.children];
        parts.forEach(part => this.player.add(part));

        this.player.scale.set(3, 3, 3);
        this.player.position.y = 0;
        audioManager.playBaa(600);
    }

    finishLevel() {
        gameState.gameState = 'FINISHED';
        audioManager.playBaa(440);
        audioManager.stopAllMusic();
        this.uiElements.uiLayer.style.display = 'none';

        const currentIndex = LEVEL_ORDER.indexOf(gameState.currentLevelName);
        const nextLevel = LEVEL_ORDER[(currentIndex + 1) % LEVEL_ORDER.length];

        const banner = document.getElementById('level-complete-banner');
        const bannerScore = document.getElementById('banner-score-value');
        if (banner) {
            bannerScore.innerText = gameState.score;
            banner.style.display = 'block';
            banner.style.animation = 'none';
            banner.offsetHeight; // force reflow to restart animation
            banner.style.animation = 'bannerPop 3s ease forwards';
        }

        setTimeout(() => {
            if (banner) banner.style.display = 'none';
            this.startNextLevel(nextLevel, false);
        }, 3000);
    }

    startNextLevel(levelName, resetLives = false) {
        while (this.scene.children.length > 0) {
            const obj = this.scene.children[0];
            this.scene.remove(obj);
        }
        ParticleSystem.clearParticles();

        const splash1 = document.getElementById('level-splash-1');
        if (splash1) {
            splash1.innerText = LEVELS[levelName].displayName;
        }

        this.pinkCoins = [];
        this.goldCoins = [];
        this.raspberries = [];
        this.trees = [];
        this.snakes = [];
        this.keys = {};
        this.touchId = null;
        this.joyIn = { x: 0, y: 0 };

        gameState.init(audioManager, this, levelName, resetLives);
        const sky = LEVELS[levelName].skyColor;
        this.scene.background = new THREE.Color(sky);
        this.scene.fog = new THREE.Fog(sky, 20, 60);
        this.createLighting();
        this.createGround();
        this.createPlayer();
        this.createLevelObjects();
        this.setupUIReferences();
        this.startGame();
    }

    playerTakeDamage() {
        if (gameState.isInvincible || gameState.gameState !== 'PLAYING') return;

        gameState.loseLife();
        audioManager.playBaa(80);

        if (gameState.lives > 0) {
            this.player.position.set(0, 0, 0);
            gameState.isInvincible = true;

            let flashCount = 0;
            const flashInterval = setInterval(() => {
                if (this.player) this.player.visible = !this.player.visible;
                flashCount++;
                if (flashCount > 15) {
                    clearInterval(flashInterval);
                    if (this.player) this.player.visible = true;
                    gameState.isInvincible = false;
                }
            }, 200);
        } else {
            this.triggerGameOver();
        }
    }

    async triggerGameOver() {
        gameState.gameState = 'GAME_OVER';
        this.uiElements.uiLayer.style.display = 'none';
        this.uiElements.gameOverScreen.style.display = 'flex';

        audioManager.playBaa(50);
        audioManager.stopAllMusic();

        document.getElementById('go-final-score').innerText = gameState.score.toString();
        const lb = document.getElementById('leaderboard-modal');
        if (lb) lb.style.display = 'none';

        const savedName = localStorage.getItem('sheepy_player_name');
        if (savedName) {
            document.getElementById('go-player-name-input').value = savedName;
        }

        const isTop5 = window.FirebaseManager ? await window.FirebaseManager.isTop5Score(gameState.score) : false;
        const goSaveContainer = document.getElementById('go-score-save-container');

        if (isTop5) {
            if (goSaveContainer) goSaveContainer.style.display = 'block';
            document.getElementById('btn-go-save-score').style.display = 'inline-block';
            document.getElementById('go-save-status-msg').style.display = 'none';
        } else {
            if (goSaveContainer) goSaveContainer.style.display = 'none';
        }
    }

    updateSnakes(deltaTime) {
        if (!this.snakes || this.snakes.length === 0 || gameState.gameState !== 'PLAYING') return;

        // Approximate player's heading
        const playerHeading = new THREE.Vector3(this.joyIn.x, 0, this.joyIn.y).normalize();
        if (playerHeading.lengthSq() < 0.1) playerHeading.set(0, 0, 1);

        for (let snake of this.snakes) {
            if (!snake.visible) continue; // "eaten" and respawning

            // 1. Determine target based on AI type and Sheepy Mode
            const isScared = gameState.isSheepy;
            let targetPos = new THREE.Vector3();

            if (isScared) {
                // Run away from player
                targetPos.copy(snake.position).sub(this.player.position).normalize().multiplyScalar(50).add(snake.position);
            } else {
                switch (snake.userData.aiType) {
                    case 'BLINKY': // Relentless chaser
                        targetPos.copy(this.player.position);
                        break;
                    case 'PINKY': // Ambusher: targets 10 units ahead of player
                        targetPos.copy(this.player.position).addScaledVector(playerHeading, 10);
                        break;
                    case 'INKY': // Flanker: Targets perpendicular to player movement
                        const flankVec = new THREE.Vector3(-playerHeading.z, 0, playerHeading.x); // rotated 90 deg
                        targetPos.copy(this.player.position).addScaledVector(flankVec, 10);
                        break;
                    case 'CLYDE': // Wanderer: Chase if far, retreat home if close (< 15)
                        const distToPlayer = snake.position.distanceTo(this.player.position);
                        if (distToPlayer > 15) {
                            targetPos.copy(this.player.position);
                        } else {
                            targetPos.copy(snake.userData.home);
                        }
                        break;
                }
            }

            // 2. Calculate steering force towards target
            let desiredVelocity = new THREE.Vector3().copy(targetPos).sub(snake.position).normalize();

            // 3. Obstacle Avoidance (Cacti and bounds)
            for (let tree of this.trees) {
                const distToTree = snake.position.distanceTo(tree.position);
                if (distToTree < 4) {
                    // Repel force
                    const repel = new THREE.Vector3().copy(snake.position).sub(tree.position).normalize();
                    desiredVelocity.addScaledVector(repel, 2.0 * (4 - distToTree));
                }
            }

            // Boundary avoidance
            const distFromOrigin = Math.sqrt(snake.position.x ** 2 + snake.position.z ** 2);
            if (distFromOrigin > LEVELS[gameState.currentLevelName].WORLD_SIZE - 2) {
                const centerPull = new THREE.Vector3(0, 0, 0).sub(snake.position).normalize();
                desiredVelocity.add(centerPull);
            }

            desiredVelocity.normalize();

            // Smoothly adjust current velocity to desired velocity
            snake.userData.velocity.lerp(desiredVelocity, deltaTime * 2.0).normalize();

            // Adjust speed based on state
            const currentSpeed = isScared ? (snake.userData.speed * 0.5) : snake.userData.speed;

            // Move snake
            snake.position.addScaledVector(snake.userData.velocity, currentSpeed * deltaTime);

            // Keep grounded
            snake.position.y = 0.5;

            // Look in direction of travel
            const lookAtTarget = new THREE.Vector3().copy(snake.position).add(snake.userData.velocity);
            snake.lookAt(lookAtTarget);

            // Visual Updates (Scared vs Normal)
            if (isScared && !snake.userData.isScared) {
                snake.userData.bodyMesh.material.color.setHex(0xaaaaaa); // turn whitish-blue
                snake.userData.tongueMesh.material.color.setHex(0xffffff);
                snake.userData.isScared = true;
            } else if (!isScared && snake.userData.isScared) {
                snake.userData.bodyMesh.material.color.setHex(snake.userData.originalColor);
                snake.userData.tongueMesh.material.color.setHex(snake.userData.tongueMeshNormalColor ?? 0xff0000);
                snake.userData.isScared = false;
            }

            // 4. Player Collision Detection
            if (this.player.position.distanceTo(snake.position) < 2) {
                if (isScared) {
                    // Eat the snake!
                    gameState.score += 200;
                    audioManager.playBlop();

                    // Temporary hide + respawn mechanism
                    snake.visible = false;
                    setTimeout(() => {
                        snake.position.copy(snake.userData.home);
                        snake.visible = true;
                    }, 5000);
                } else {
                    // Damage player
                    this.playerTakeDamage();
                }
            }
        }
    }

    animate(timestamp = 0) {
        requestAnimationFrame((ts) => this.animate(ts));

        if (!gameState.lastTime) gameState.lastTime = timestamp;
        const deltaTime = (timestamp - gameState.lastTime) / 1000;
        gameState.lastTime = timestamp;

        if (gameState.gameState === 'START' || gameState.gameState === 'FINISHED') {
            this.pinkCoins.forEach(c => c.rotation.y += 0.05);
            this.renderer.render(this.scene, this.camera);
            return;
        }

        this.updatePlayerMovement(deltaTime);
        this.updateCoins();
        ParticleSystem.updateParticles();
        this.updateSnakes(deltaTime);


        if (gameState.gameState === 'BONUS') {
            this.updateBonusLevel(timestamp, deltaTime);
        }

        this.updateCamera();
        this.renderer.render(this.scene, this.camera);
    }
}

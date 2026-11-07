// Main Three.js engine and Game Loop

// Movement and physics values in this file are tuned as "amount per frame at 60fps".
// Each frame they're multiplied by frameScale (deltaTime * TUNING_FPS) so the game plays
// at the same speed on 60, 90 and 120Hz screens.
const TUNING_FPS = 60;

// Longest timestep a single frame may apply. Without this, resuming after the app was
// backgrounded would apply seconds of movement (and bonus-round time) in one frame.
const MAX_DELTA_TIME = 0.1;

// Tablets and phones have 2-3 screen pixels per CSS pixel. Rendering at 1 looks soft once the
// browser stretches it; full 2-3x is sharp but makes the GPU fill 4-9x the pixels. 1.5 is the
// middle ground: raise to 2 if tablets keep a smooth frame rate.
const MAX_PIXEL_RATIO = 1.5;

// How long Sheepy flashes and can't be hurt after losing a life (16 flashes of 0.2s, as before)
const INVINCIBLE_SECONDS = 3.2;

// Frame-rate-independent version of a per-frame lerp factor (e.g. 0.05 = "close 5% of the gap each 60fps frame")
function frameLerpAlpha(alphaPerFrame, frameScale) {
    return 1 - Math.pow(1 - alphaPerFrame, frameScale);
}

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
        this.sparkBudget = 0; // fractional sparks carried between frames (Sheepy-mode trail)
        this.paused = false;     // pause menu open: the level stands still
        this.invincibleTime = 0; // seconds of flashing left after losing a life (game time, so pausing doesn't use it up)

        this.init();
    }

    init() {
        // Playtesting: change to another world's name (see LEVEL_ORDER) to start there. Set back to 'MAIN' for release.
        gameState.init(audioManager, this, 'MAIN');
        this.createScene();
        this.createLighting();
        this.createGround();
        this.createPlayer();
        this.createLevelObjects();
        AmbientEffects.create(this.scene, LEVELS[gameState.currentLevelName].ambientEffect, this.player.position);
        this.sceneFresh = true; // level built but not played yet, so Play can start it without rebuilding
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
        this.applyAtmosphere(LEVELS[gameState.currentLevelName]);

        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 25, 20);

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO));
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        document.getElementById('canvas-container').appendChild(this.renderer.domElement);

        // Initialize ParticleSystem with scene
        ParticleSystem.init(this.scene);

        gameState.scene = this.scene;
        gameState.camera = this.camera;
        gameState.renderer = this.renderer;
    }

    // Sky colour and fog for a level (fog fades to the sky colour)
    applyAtmosphere(level) {
        const a = level.atmosphere;
        this.scene.background = new THREE.Color(level.skyColor);
        this.scene.fog = new THREE.Fog(level.skyColor, a.fogNear, a.fogFar);
    }

    // One ambient light and one sun for the whole game, recoloured for each world. (New lights every
    // level used to leave each old sun's shadow texture behind on the graphics card.)
    createLighting() {
        if (!this.sunLight) {
            this.ambientLight = new THREE.AmbientLight();

            // The sun follows Sheepy (see updateCamera) so its ±30 shadow area is always around the player
            const dirLight = new THREE.DirectionalLight();
            dirLight.castShadow = true;
            dirLight.shadow.camera.right = 30;
            dirLight.shadow.camera.left = -30;
            dirLight.shadow.camera.top = 30;
            dirLight.shadow.camera.bottom = -30;
            this.sunLight = dirLight;
        }
        const a = LEVELS[gameState.currentLevelName].atmosphere;
        this.ambientLight.color.setHex(a.ambientColor);
        this.ambientLight.intensity = a.ambientIntensity;
        this.sunLight.color.setHex(a.sunColor);
        this.sunLight.intensity = a.sunIntensity;
        this.sunLight.position.set(20, 40, 20);
        this.sunLight.target.position.set(0, 0, 0);
        // A level change empties the scene, so they go back in each time
        this.scene.add(this.ambientLight);
        this.scene.add(this.sunLight);
        this.scene.add(this.sunLight.target);
    }

    // The ground is made once per world and kept for later visits: painting its texture again on
    // every level change was slow, and left the old ground on the graphics card. Every world's
    // ground is the same size, so they share one plane.
    createGround() {
        const level = LEVELS[gameState.currentLevelName];
        this.groundMaterials = this.groundMaterials || {};
        let material = this.groundMaterials[level.groundType];
        if (!material) {
            const texture = TextureGenerator[level.groundType]();
            texture.repeat.set(level.GROUND_SIZE / 8, level.GROUND_SIZE / 8); // one tile every 8 units
            material = new THREE.MeshStandardMaterial({ map: texture, roughness: 1, metalness: 0 });
            this.groundMaterials[level.groundType] = material;
        }
        this.groundGeometries = this.groundGeometries || {};
        if (!this.groundGeometries[level.GROUND_SIZE]) {
            this.groundGeometries[level.GROUND_SIZE] = new THREE.PlaneGeometry(level.GROUND_SIZE, level.GROUND_SIZE);
        }

        this.ground = new THREE.Mesh(this.groundGeometries[level.GROUND_SIZE], material);
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

        // Landmarks and ground detail (if this biome has any), before the obstacles so they can keep off it
        Scenery.create(this.scene, level);

        for (let i = 0; i < level.TREES_COUNT; i++) {
            const tree = ModelCreator[level.obstacleModel]();
            let pos;
            do {
                pos = LevelUtils.getRandomPosition(level.WORLD_SIZE);
            } while (
                LevelUtils.isTooCloseToSpawn(pos.x, pos.z, level.TREE_EXCLUSION_ZONE) ||
                Scenery.blocksObstacles(pos.x, pos.z) ||
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

        // Backdrop and animals past the fence, and walk-through detail in the outer arena (after the
        // obstacles, so the detail keeps off them without moving any)
        Outskirts.create(this.scene, level, this.trees);

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
                    speed: level.enemySpeed,
                    phaseOffset: Math.random() * 10, // so enemies' movement rhythms aren't in sync
                    clock: 0
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
        document.getElementById('btn-start').addEventListener('click', () => this.showWorldMap());
        document.getElementById('btn-map-back').addEventListener('click', () => this.hideWorldMap());
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
            // Replay the world you were on, with fresh lives and score
            this.startNextLevel(gameState.currentLevelName, true);
        });

        document.getElementById('btn-go-world-map').addEventListener('click', () => this.showWorldMap());

        document.getElementById('action-btn').addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleAction();
        }, { passive: false });

        window.addEventListener('keydown', (e) => {
            // Keyboard: Enter opens the world map, then Enter again plays the furthest world reached
            if (gameState.gameState === 'START' && e.key === 'Enter') {
                if (this.isWorldMapOpen()) this.playWorld(Progress.furthestUnlocked());
                else this.showWorldMap();
            }
            // Escape or P pauses and resumes
            if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
                if (this.paused) this.resumeGame(); else this.pauseGame();
                return;
            }
            if ((gameState.gameState === 'PLAYING' || gameState.gameState === 'BONUS') && !this.paused) {
                this.keys[e.key] = true;
                if (e.code === 'Space') this.handleAction();
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });

        // Pause menu
        document.getElementById('pause-btn').addEventListener('click', () => this.pauseGame());
        document.getElementById('btn-resume').addEventListener('click', () => this.resumeGame());
        document.getElementById('btn-pause-map').addEventListener('click', () => {
            // Leaves this run (like World Map on the Game Over screen)
            this.closePauseMenu();
            audioManager.stopAllMusic();
            this.showWorldMap();
        });
        document.getElementById('btn-mute').addEventListener('click', () => {
            audioManager.setMuted(!audioManager.muted);
            this.updateMuteButton();
        });
        // Back to the Sheepy Games homepage: only offered when the game is played on the website
        // (not in the Android app, or when testing on this computer)
        if (this.isOnSheepyGamesSite()) {
            const home = document.getElementById('btn-sheepy-games');
            home.style.display = '';
            home.addEventListener('click', () => { window.location.href = '/'; });
        }

        // Pause by itself when the tab or app is hidden, so the music stops and nothing is going on
        // when the player comes back. A level that starts while hidden pauses too (see startGame).
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) return;
            this.pauseGame();
            audioManager.stopThemeMusic(); // the title tune starts again with the next tap
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
        if (this.paused) return;
        if (gameState.gameState === 'PLAYING' && !gameState.isSheepy && this.player.position.y <= 0.5) {
            gameState.playerVelY = 0.6;
        }
        audioManager.playBaa();
    }

    startGame() {
        if (gameState.gameState === 'PLAYING') return;
        this.sceneFresh = false;

        audioManager.stopThemeMusic();
        audioManager.stopGameMusic(); // switch to this world's tune even if another was still playing
        audioManager.playGameMusic(LEVELS[gameState.currentLevelName].music);

        this.uiElements.startScreen.style.display = 'none';
        this.hideWorldMap();
        document.getElementById('leaderboard-modal').style.display = 'none';
        this.uiElements.uiLayer.style.display = 'block';

        this.showLevelSplash(LEVELS[gameState.currentLevelName]);
        this.setTouchControls(true);

        gameState.gameState = 'PLAYING';
        gameState.updateUI();

        audioManager.init();
        audioManager.playBaa(220);

        // The next level can start while the tab or app is hidden (the level-complete banner's timer
        // keeps going): start it paused, so the player comes back to the pause menu
        if (document.hidden) this.pauseGame();
    }

    // Joystick, jump and pause buttons: only on screen while a level is being played
    setTouchControls(visible) {
        this.uiElements.joystickContainer.style.display = visible ? 'block' : 'none';
        this.uiElements.actionButton.style.display = visible ? 'flex' : 'none';
        document.getElementById('pause-btn').style.display = visible ? 'block' : 'none';
        if (!visible) this.resetJoy(document.getElementById('joystick-knob'));
    }

    // ---------- Pause menu ----------

    isOnSheepyGamesSite() {
        return /(^|\.)sheepygames\.io$/i.test(window.location.hostname);
    }

    // Pause during a level or the bonus round: everything stands still and the tune stops where it is
    pauseGame() {
        const playing = gameState.gameState === 'PLAYING' || gameState.gameState === 'BONUS';
        if (!playing || this.paused) return;
        this.paused = true;
        this.keys = {};
        this.resetJoy(document.getElementById('joystick-knob'));
        this.hideLevelSplash();
        audioManager.pauseGameMusic();
        this.updateMuteButton();
        document.getElementById('pause-menu').style.display = 'flex';
    }

    resumeGame() {
        if (!this.paused) return;
        this.closePauseMenu();
        audioManager.resumeGameMusic();
    }

    closePauseMenu() {
        this.paused = false;
        document.getElementById('pause-menu').style.display = 'none';
    }

    updateMuteButton() {
        document.getElementById('btn-mute').textContent = audioManager.muted ? '🔇 Sound: Off' : '🔊 Sound: On';
    }

    // "LEVEL 3" with "❄️ Snowy Peaks" underneath, shown for 2.5s as a level starts
    showLevelSplash(level) {
        const splash = document.getElementById('level-splash-1');
        if (!splash) return;
        document.getElementById('splash-level').textContent = level.displayName;
        // From the second lap on, show the lap so players know why the enemies are faster
        const lapText = gameState.lap > 0 ? ` · Lap ${gameState.lap + 1}` : '';
        document.getElementById('splash-biome').textContent = `${level.icon} ${level.biomeName}${lapText}`;
        splash.style.display = 'flex';
        clearTimeout(this.splashTimer); // a previous level's timer mustn't hide this splash early
        this.splashTimer = setTimeout(() => { splash.style.display = 'none'; }, 2500);
    }

    // Clear the splash early (level complete, Game Over or the map shouldn't appear underneath it)
    hideLevelSplash() {
        clearTimeout(this.splashTimer);
        const splash = document.getElementById('level-splash-1');
        if (splash) splash.style.display = 'none';
    }

    // ---------- World map ----------

    isWorldMapOpen() {
        return document.getElementById('world-map').style.display === 'block';
    }

    // Open the map over the title screen (also used from Game Over)
    showWorldMap() {
        gameState.gameState = 'START'; // freeze the scene behind the map
        this.hideLevelSplash();
        this.uiElements.gameOverScreen.style.display = 'none';
        this.uiElements.uiLayer.style.display = 'none';
        this.setTouchControls(false);
        document.getElementById('leaderboard-modal').style.display = 'none';
        this.uiElements.startScreen.style.display = 'flex'; // behind the map, so Back returns to the title
        this.renderWorldMap();
        document.getElementById('world-map').style.display = 'block';
    }

    hideWorldMap() {
        document.getElementById('world-map').style.display = 'none';
    }

    // Build the adventure path: worlds zigzag up from the first (bottom) to the last (top).
    // Positions are computed from LEVEL_ORDER, so new biomes slot in automatically.
    renderWorldMap() {
        const panel = document.getElementById('world-map-panel');
        const nodes = document.getElementById('world-map-nodes');
        const path = document.getElementById('world-map-path');
        const progress = Progress.load();
        const n = LEVEL_ORDER.length;

        // Background fades through each biome's colour, first world at the bottom
        const stops = LEVEL_ORDER.map((name, i) => `${LEVELS[name].mapColor} ${Math.round(i / (n - 1) * 100)}%`);
        panel.style.background = `linear-gradient(to top, ${stops.join(', ')})`;

        const points = LEVEL_ORDER.map((name, i) => ({
            x: i % 2 === 0 ? 34 : 64,              // percent across
            y: 87 - i * (71 / Math.max(1, n - 1))  // percent down
        }));
        // Past six worlds, the buttons shrink a little so they still fit on a phone (to 82% at nine)
        panel.style.setProperty('--node-scale', Math.min(1, Math.max(0.75, 1 - (n - 6) * 0.06)).toFixed(2));

        // Dotted S-curve linking the worlds
        let d = `M ${points[0].x} ${points[0].y}`;
        for (let i = 1; i < n; i++) {
            const a = points[i - 1], b = points[i], half = (a.y - b.y) / 2;
            d += ` C ${a.x} ${a.y - half}, ${b.x} ${b.y + half}, ${b.x} ${b.y}`;
        }
        path.setAttribute('d', d);

        nodes.textContent = '';
        LEVEL_ORDER.forEach((name, i) => {
            const level = LEVELS[name];
            const unlocked = i < progress.unlocked;
            const best = Progress.bestScore(name);

            const node = document.createElement('button');
            node.className = 'world-node' + (unlocked ? '' : ' locked');
            node.style.left = points[i].x + '%';
            node.style.top = points[i].y + '%';
            node.disabled = !unlocked;
            node.dataset.level = name;

            const icon = document.createElement('span');
            icon.className = 'world-icon';
            icon.textContent = level.icon;

            const text = document.createElement('span');
            text.className = 'world-text';
            const title = document.createElement('span');
            title.className = 'world-name';
            title.textContent = level.biomeName;
            const status = document.createElement('span');
            status.className = 'world-status';
            status.textContent = !unlocked ? '🔒 Locked' : (best !== null ? `★ ${best.toLocaleString()}` : 'NEW!');
            text.appendChild(title);
            text.appendChild(status);

            node.appendChild(icon);
            node.appendChild(text);

            if (i === progress.unlocked - 1) { // Sheepy waits at the furthest world reached
                const sheep = document.createElement('span');
                sheep.className = 'world-sheep';
                sheep.textContent = '🐑';
                node.appendChild(sheep);
            }

            if (unlocked) node.addEventListener('click', () => this.playWorld(name));
            nodes.appendChild(node);
        });
    }

    // Start a fresh run (full lives, score 0) on an unlocked world
    playWorld(levelName) {
        if (!Progress.isUnlocked(levelName)) return;
        this.hideWorldMap();
        if (this.sceneFresh && gameState.currentLevelName === levelName) {
            this.startGame(); // first play on page load: this level is already built
        } else {
            this.startNextLevel(levelName, true);
        }
    }

    handleResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        if (this.paused) this.renderer.render(this.scene, this.camera); // resizing clears the canvas
    }

    updatePlayerMovement(frameScale) {
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

        const speed = gameState.getPlayerSpeed() * frameScale;
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

        // Landmarks push out the same way, so Sheepy slides round them
        const pushed = { x: newX, z: newZ };
        Scenery.pushOut(pushed, playerRadius);
        newX = pushed.x;
        newZ = pushed.z;

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
            this.player.position.y += gameState.playerVelY * frameScale;
            gameState.playerVelY -= 0.04 * frameScale;
            if (this.player.position.y < 0) {
                this.player.position.y = 0;
                gameState.playerVelY = 0;
            }
        }

        if (gameState.isSheepy) {
            const targetY = 6 + Math.sin(Date.now() * 0.003) * 0.5;
            this.player.position.y = THREE.MathUtils.lerp(this.player.position.y, targetY, frameLerpAlpha(0.05, frameScale));

            if (Math.abs(dx) > 0.01 || Math.abs(dz) > 0.01) {
                // 2 sparks per 60fps frame (120/sec), regardless of refresh rate
                this.sparkBudget += 2 * frameScale;
                while (this.sparkBudget >= 1) {
                    ParticleSystem.spawnSpark(this.player.position, dx, dz);
                    this.sparkBudget -= 1;
                }
            }
        }

        if (gameState.gameState === 'BONUS') {
            this.player.position.y = Math.abs(Math.sin(Date.now() * 0.01)) * 0.5;
        }
    }

    updateCoins(frameScale) {
        // Collectables can only be picked up in normal play, never during the bonus round:
        // a pickup there would re-run checkProgression and restart the bonus timer.
        const canCollect = gameState.gameState === 'PLAYING';

        // Only check pink coins if player is not sheepy (phases 1 and 3)
        if (!gameState.isSheepy) {
            for (let i = this.pinkCoins.length - 1; i >= 0; i--) {
                const coin = this.pinkCoins[i];
                coin.rotation.y += 0.05 * frameScale;

                if (canCollect && this.player.position.distanceTo(coin.position) < 2) {
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
                coin.rotation.y += 0.05 * frameScale;

                if (canCollect && this.player.position.distanceTo(coin.position) < 5) {
                    this.scene.remove(coin);
                    this.goldCoins.splice(i, 1);
                    gameState.goldCoins.splice(i, 1);
                    gameState.collectGoldCoin();
                    gameState.checkProgression();
                }
            }
        }
    }

    updateBonusLevel(timestamp, deltaTime, frameScale) {
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
                r.position.y = Math.max(
                    LEVELS.BONUS.RASPBERRY_FINAL_HEIGHT,
                    r.position.y - LEVELS.BONUS.RASPBERRY_FALL_SPEED * frameScale
                );
                if (r.userData.spin) {
                    r.userData.spin(frameScale); // turns its own way as it falls (the shooting star keeps its tail up)
                } else {
                    r.rotation.x += 0.05 * frameScale;
                    r.rotation.z += 0.05 * frameScale;
                }
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

    updateCamera(frameScale) {
        const targetPosition = new THREE.Vector3(
            this.player.position.x,
            gameState.getCameraHeight(),
            this.player.position.z + gameState.getCameraDistance()
        );

        this.camera.position.lerp(targetPosition, frameLerpAlpha(0.05, frameScale));
        this.camera.lookAt(this.player.position);

        // Keep the sun (and its shadow area) centred on Sheepy, at the same angle as before
        if (this.sunLight) {
            this.sunLight.position.set(this.player.position.x + 20, 40, this.player.position.z + 20);
            this.sunLight.target.position.set(this.player.position.x, 0, this.player.position.z);
        }
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
        this.setTouchControls(false); // nothing to steer during the banner
        this.hideLevelSplash();

        const levelName = gameState.currentLevelName;
        const currentIndex = LEVEL_ORDER.indexOf(levelName);
        const nextLevel = LEVEL_ORDER[(currentIndex + 1) % LEVEL_ORDER.length];
        const beatAllWorlds = currentIndex === LEVEL_ORDER.length - 1;
        if (beatAllWorlds) gameState.lap++; // next lap: enemies 10% faster (see enemySpeedMultiplier)

        // Save progress: open the next world, record this world's best score
        const result = Progress.completeLevel(levelName, gameState.score - gameState.levelStartScore);

        // Lives carry over unchanged: 3 lives last the whole run
        const extras = [];
        if (result.unlockedLevel) extras.push(`🔓 ${LEVELS[result.unlockedLevel].biomeName} unlocked!`);
        if (result.newBest) extras.push('★ New best!');

        // The last world gets a longer celebration, then the run carries on from the first world
        const bannerMs = beatAllWorlds ? 4500 : 3000;
        const banner = document.getElementById('level-complete-banner');
        if (banner) {
            document.getElementById('banner-title').textContent = beatAllWorlds
                ? `YOU BEAT\nALL ${LEVEL_ORDER.length} WORLDS!`
                : 'LEVEL\nCOMPLETE!';
            document.getElementById('banner-score-value').textContent = gameState.score;
            const extrasEl = document.getElementById('banner-extras');
            extrasEl.textContent = '';
            extras.forEach(line => {
                const div = document.createElement('div');
                div.textContent = line;
                extrasEl.appendChild(div);
            });
            banner.style.display = 'block';
            banner.style.animation = 'none';
            banner.offsetHeight; // force reflow to restart animation
            banner.style.animation = `bannerPop ${bannerMs / 1000}s ease forwards`;
        }
        if (beatAllWorlds) setTimeout(() => audioManager.playBaa(660), 400);

        setTimeout(() => {
            if (banner) banner.style.display = 'none';
            this.startNextLevel(nextLevel, false);
        }, bannerMs);
    }

    startNextLevel(levelName, resetLives = false) {
        AmbientEffects.dispose();
        Scenery.dispose();
        while (this.scene.children.length > 0) {
            const obj = this.scene.children[0];
            this.scene.remove(obj);
        }
        ParticleSystem.clearParticles();

        this.pinkCoins = [];
        this.goldCoins = [];
        this.raspberries = [];
        this.trees = [];
        this.snakes = [];
        this.keys = {};
        this.touchId = null;
        this.joyIn = { x: 0, y: 0 };
        this.sparkBudget = 0;
        this.invincibleTime = 0;
        this.closePauseMenu();

        gameState.init(audioManager, this, levelName, resetLives);
        this.applyAtmosphere(LEVELS[levelName]);
        this.createLighting();
        this.createGround();
        this.createPlayer();
        this.createLevelObjects();
        AmbientEffects.create(this.scene, LEVELS[levelName].ambientEffect, this.player.position);
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
            this.invincibleTime = INVINCIBLE_SECONDS; // counted down in updateInvincibility
        } else {
            this.triggerGameOver();
        }
    }

    // After losing a life Sheepy flashes (0.2s on, 0.2s off) and can't be hurt for INVINCIBLE_SECONDS
    updateInvincibility(deltaTime) {
        if (this.invincibleTime <= 0) return;
        this.invincibleTime -= deltaTime;
        if (this.invincibleTime <= 0) {
            this.invincibleTime = 0;
            this.player.visible = true;
            gameState.isInvincible = false;
        } else {
            const elapsed = INVINCIBLE_SECONDS - this.invincibleTime;
            this.player.visible = Math.floor(elapsed / 0.2) % 2 === 0;
        }
    }

    async triggerGameOver() {
        gameState.gameState = 'GAME_OVER';
        this.hideLevelSplash();
        this.uiElements.uiLayer.style.display = 'none';
        this.setTouchControls(false);
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

        // The fence is a square at ±WORLD_SIZE/2. Enemies start steering away WALL_STEER_MARGIN
        // units before their limit, and are hard-clamped to it after moving.
        const enemyLimit = (LEVELS[gameState.currentLevelName].WORLD_SIZE / 2) - 2;
        const WALL_STEER_MARGIN = 8;
        const wallSteerStart = enemyLimit - WALL_STEER_MARGIN;

        const speedScale = this.enemySpeedMultiplier();
        const behaviour = LEVELS[gameState.currentLevelName].enemyBehaviour;

        for (let snake of this.snakes) {
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

            // Landmarks: within 4 units of one, an enemy heading into it turns to slide round it
            // instead (a plain repel would leave it stuck when its target is on the far side)
            for (const s of Scenery.solids) {
                const { dist, nx, nz } = Scenery.edge(s, snake.position.x, snake.position.z);
                if (dist > 4) continue;
                const into = -(desiredVelocity.x * nx + desiredVelocity.z * nz); // > 0 = heading into it
                if (into <= 0) continue;
                const closeness = Math.min(1, (4 - dist) / 4); // 0 at 4 units away, 1 at its edge
                // Go round whichever way the enemy is already moving. Choosing by the target alone
                // flips every frame on a flat wall with the target straight behind it (stuck).
                // The target only breaks the tie when the enemy is heading dead into the wall.
                let tx = -nz, tz = nx;
                const vel = snake.userData.velocity;
                if ((tx * vel.x + tz * vel.z) + 0.01 * (tx * desiredVelocity.x + tz * desiredVelocity.z) < 0) { tx = -tx; tz = -tz; }
                desiredVelocity.x += (nx + tx) * into * closeness;
                desiredVelocity.z += (nz + tz) * into * closeness;
            }

            // Boundary avoidance: push away from each fence wall, ramping up to 2x as the enemy
            // reaches its limit. That outweighs the (unit-length) chase/flee direction, so a fleeing
            // enemy slides along the fence instead of pressing into it.
            const overX = Math.abs(snake.position.x) - wallSteerStart;
            if (overX > 0) desiredVelocity.x -= Math.sign(snake.position.x) * 2 * Math.min(overX / WALL_STEER_MARGIN, 1);
            const overZ = Math.abs(snake.position.z) - wallSteerStart;
            if (overZ > 0) desiredVelocity.z -= Math.sign(snake.position.z) * 2 * Math.min(overZ / WALL_STEER_MARGIN, 1);

            // Enemies move along the ground: ignore height differences, otherwise a hovering
            // Sheepy right above an enemy makes it steer "down" (slow to flee, and tilted nose-down)
            desiredVelocity.y = 0;
            desiredVelocity.normalize();

            // Smoothly adjust current velocity to desired velocity
            snake.userData.velocity.lerp(desiredVelocity, deltaTime * 2.0).normalize();

            // Speed: world speed x lap/phase scaling, halved while fleeing
            const baseSpeed = snake.userData.speed * speedScale * (isScared ? 0.5 : 1);

            // Biome movement rhythm (weave / slide / pounce / scuttle / swoop / wobble / storm / moonhop) at about the same average speed
            const motion = this.enemyMotion(snake, behaviour, deltaTime, isScared);
            const vel = snake.userData.velocity;
            const side = new THREE.Vector3(-vel.z, 0, vel.x);
            const step = new THREE.Vector3()
                .addScaledVector(vel, baseSpeed * motion.speedFactor)
                .addScaledVector(side, motion.sideSpeed);

            // Move snake
            snake.position.addScaledVector(step, deltaTime);

            // Never let an enemy through the fence, even if steering loses the argument
            snake.position.x = Math.max(-enemyLimit, Math.min(enemyLimit, snake.position.x));
            snake.position.z = Math.max(-enemyLimit, Math.min(enemyLimit, snake.position.z));

            // ...or into a landmark
            Scenery.pushOut(snake.position, 1);

            // Keep grounded
            snake.position.y = 0.5;

            // Face the way it's actually moving, then apply the biome's pose
            const facing = step.lengthSq() > 1e-6 ? step : vel;
            snake.lookAt(new THREE.Vector3().copy(snake.position).add(facing));
            if (motion.yaw) snake.rotateY(motion.yaw);
            if (motion.pitch) snake.rotateX(motion.pitch);
            if (motion.roll) snake.rotateZ(motion.roll);
            snake.scale.set(1, motion.scaleY, motion.scaleZ);

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

            // 4. Player Collision Detection: hunting enemies hurt the player.
            // Scared enemies (Sheepy mode) just run away; touching them does nothing.
            if (!isScared && this.player.position.distanceTo(snake.position) < 2) {
                this.playerTakeDamage();
            }
        }
    }

    // Enemy speed-up (see ENEMY_SCALING in levels.js): +10% per completed lap of all the worlds,
    // +5% during the second batch of coins
    enemySpeedMultiplier() {
        return 1 + ENEMY_SCALING.PER_LAP * gameState.lap
                 + (gameState.currentPhase === 3 ? ENEMY_SCALING.SECOND_BATCH : 0);
    }

    // Per-biome movement rhythm. speedFactor averages about 1 over time, so each enemy covers
    // the same ground as its plain speed would; sideSpeed and the pose values only change the feel.
    enemyMotion(snake, behaviour, dt, isScared) {
        const ud = snake.userData;
        ud.clock = (ud.clock || 0) + dt;
        const t = ud.clock + (ud.phaseOffset || 0);
        const m = { speedFactor: 1, sideSpeed: 0, yaw: 0, pitch: 0, roll: 0, scaleY: 1, scaleZ: 1 };

        switch (behaviour) {
            case 'weave': // snakes slither side to side around their path (no net drift)
                m.sideSpeed = Math.cos(t * 6) * 0.8 * 6; // swing of ±0.8 units
                break;

            case 'slide': { // penguins waddle 1.6s at 0.7x, then belly-slide 0.8s at 1.6x (averages 1.0x)
                const c = t % 2.4;
                if (c >= 1.6) {
                    m.speedFactor = 1.6;
                    m.pitch = 1.2;                    // lying forward on the belly
                } else {
                    m.speedFactor = 0.7;
                    m.roll = Math.sin(t * 10) * 0.15; // side-to-side waddle
                }
                break;
            }

            case 'pounce': { // tigers stalk crouched at 0.9x; within 9 units, pounce at 2.2x for 0.5s, then rest
                ud.pounceTime = Math.max(0, (ud.pounceTime || 0) - dt);
                ud.pounceCooldown = Math.max(0, (ud.pounceCooldown || 0) - dt);
                if (isScared) ud.pounceTime = 0; // fleeing tigers don't pounce
                const dist = snake.position.distanceTo(this.player.position);
                if (!isScared && ud.pounceTime === 0 && ud.pounceCooldown === 0 && dist < 9) {
                    ud.pounceTime = 0.5;
                    ud.pounceCooldown = 3.0;
                }
                if (ud.pounceTime > 0) {
                    m.speedFactor = 2.2;
                    m.scaleY = 0.85; m.scaleZ = 1.25;   // stretched mid-leap
                } else if (!isScared) {
                    m.speedFactor = 0.9;
                    m.scaleY = 0.85;                    // crouched, stalking
                }
                break;
            }

            case 'scuttle': // crabs walk sideways in quick pulses (0.4x to 1.6x, averages 1.0x)
                m.speedFactor = 1 + 0.6 * Math.sin(t * 9);
                m.yaw = Math.PI / 2;
                break;

            case 'swoop': { // seagulls waddle 2.4s at 0.75x, then spread their wings and swoop 0.6s at 2x (averages 1.0x)
                const c = t % 3.0;
                let spread = 0, lift = 0;
                if (c >= 2.4) {
                    const s = (c - 2.4) / 0.6;           // 0 to 1 through the swoop
                    m.speedFactor = 2.0;
                    m.pitch = 0.15;                      // leaning into it
                    spread = Math.min(1, Math.sin(Math.PI * s) * 2);
                    lift = Math.sin(Math.PI * s) * 0.6;  // skims up off the sand and back down
                } else {
                    m.speedFactor = 0.75;
                    m.roll = Math.sin(t * 9) * 0.12;     // side-to-side waddle
                }
                // The model lifts and opens its wings itself, so the enemy's position (and so its
                // collision with Sheepy) is the same as any other enemy's
                if (ud.bird) ud.bird.position.y = -0.5 + lift;
                if (ud.wings) {
                    ud.wings[0].rotation.z = -spread * 1.4;
                    ud.wings[1].rotation.z = spread * 1.4;
                }
                break;
            }

            case 'wobble': { // jelly blobs hop: 0.4s in the air at 1.375x, then 0.2s squashed on the ground at 0.25x (averages 1.0x)
                const c = t % 0.6;
                let lift = 0, stretch;
                if (c < 0.4) {
                    const s = c / 0.4;                   // 0 to 1 through the hop
                    m.speedFactor = 1.375;
                    lift = Math.sin(Math.PI * s) * 1.0;
                    stretch = 1 + 0.15 * Math.sin(Math.PI * s);  // a little taller in the air
                } else {
                    const u = (c - 0.4) / 0.2;           // 0 to 1 while landed
                    m.speedFactor = 0.25;
                    stretch = 1 - 0.28 * Math.sin(Math.PI * u);  // squashes flat, then springs up again
                }
                // Jelly wobble: the blob leans side to side and its sides ripple, out of step with the hops
                m.roll = Math.sin(t * 7) * 0.1;
                const ripple = Math.sin(t * 17) * 0.05;
                // Like the seagull, only the model inside moves and changes shape, so the enemy's
                // position (and so its collision with Sheepy) is the same as any other enemy's
                if (ud.blob) {
                    const wide = 1 / Math.sqrt(stretch); // keeps its volume as it squashes
                    ud.blob.position.y = -0.5 + lift;
                    ud.blob.scale.set(wide * (1 + ripple), stretch, wide * (1 - ripple));
                }
                break;
            }

            case 'storm': { // storm clouds drift 1.6s at 0.8x, puff up 0.4s at 0.3x (the warning), then dash 0.8s at 1.75x (averages 1.0x)
                const c = t % 2.8;
                let size = 1, stretch = 1, boltOn = false;
                if (c < 1.6) {
                    m.speedFactor = 0.8;
                    m.roll = Math.sin(t * 1.5) * 0.06;            // drifting lazily
                } else if (c < 2.0) {
                    const u = (c - 1.6) / 0.4;                    // 0 to 1 while puffing up
                    m.speedFactor = 0.3;
                    size = 1 + 0.2 * Math.sin(u * Math.PI / 2);   // swells up, grumbling
                    m.roll = Math.sin(t * 40) * 0.06;             // and shakes
                    boltOn = Math.floor(t * 14) % 2 === 0;        // lightning flickers underneath
                } else {
                    const v = (c - 2.0) / 0.8;                    // 0 to 1 through the dash
                    m.speedFactor = 1.75;
                    m.pitch = 0.12;                               // leaning into it
                    size = 1.2 - 0.2 * v;                         // shrinks back as it goes
                    stretch = 1 + 0.25 * Math.sin(Math.PI * v);   // streaming out behind
                    boltOn = true;
                }
                // Like the seagull, only the model inside bobs and changes shape, so the enemy's
                // position (and so its collision with Sheepy) is the same as any other enemy's.
                // Scared clouds keep the rhythm but don't flash lightning.
                if (ud.cloud) {
                    ud.cloud.position.y = ud.cloudBaseY + Math.sin(t * 2.2) * 0.15;
                    ud.cloud.scale.set(size, size * 0.92 + 0.08, size * stretch);
                }
                if (ud.bolt) ud.bolt.visible = boltOn && !isScared;
                break;
            }

            case 'moonhop': { // moon aliens crouch 0.25s at 0.4x, then float through a long low-gravity hop 1.0s at 1.15x (averages 1.0x)
                const c = t % 1.25;
                let lift = 0, stretch, lean = 0;
                if (c < 0.25) {
                    const u = c / 0.25;                                   // 0 to 1 while crouched
                    m.speedFactor = 0.4;
                    stretch = 1 - 0.3 * Math.sin(Math.PI * u);            // squashes down, then springs up
                } else {
                    const s = (c - 0.25) / 1.0;                           // 0 to 1 through the hop
                    m.speedFactor = 1.15;
                    lift = Math.pow(Math.sin(Math.PI * s), 0.6) * 1.4;    // floaty: hangs near the top
                    stretch = 1 + 0.15 * Math.abs(Math.cos(Math.PI * s)); // a little taller taking off and landing
                    lean = 0.25 * (2 * s - 1);                            // nose up going up, down coming down
                }
                // Like the jelly blob, only the model inside moves and changes shape, so the enemy's
                // position (and so its collision with Sheepy) is the same as any other enemy's
                if (ud.alien) {
                    const wide = 1 / Math.sqrt(stretch); // keeps its volume as it squashes
                    ud.alien.position.y = -0.5 + lift;
                    ud.alien.scale.set(wide, stretch, wide);
                    ud.alien.rotation.x = lean;
                }
                break;
            }
        }
        return m;
    }

    animate(timestamp = 0) {
        requestAnimationFrame((ts) => this.animate(ts));

        if (!gameState.lastTime) gameState.lastTime = timestamp;
        const deltaTime = Math.min((timestamp - gameState.lastTime) / 1000, MAX_DELTA_TIME);
        gameState.lastTime = timestamp;
        const frameScale = deltaTime * TUNING_FPS; // 1.0 at 60fps, 0.5 at 120fps

        // Paused: everything stands still. The canvas keeps showing the last frame, so there's
        // nothing to draw (handleResize draws once if the window changes size)
        if (this.paused) return;

        // Background effect keeps going even on the level-complete banner (snow keeps falling)
        AmbientEffects.update(deltaTime, this.player.position);
        Scenery.update(deltaTime, this.camera); // smoke and glowing lava keep going too

        if (gameState.gameState === 'START' || gameState.gameState === 'FINISHED') {
            this.pinkCoins.forEach(c => c.rotation.y += 0.05 * frameScale);
            this.renderer.render(this.scene, this.camera);
            return;
        }

        this.updateInvincibility(deltaTime);
        this.updatePlayerMovement(frameScale);
        this.updateCoins(frameScale);
        ParticleSystem.updateParticles(frameScale);
        this.updateSnakes(deltaTime);

        if (gameState.gameState === 'BONUS') {
            this.updateBonusLevel(timestamp, deltaTime, frameScale);
        }

        this.updateCamera(frameScale);
        this.renderer.render(this.scene, this.camera);
    }
}

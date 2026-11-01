const LEVEL_ORDER = ['MAIN', 'DESERT', 'SNOW', 'JUNGLE', 'VOLCANO'];

// Enemy difficulty scaling on top of each world's enemySpeed:
//   +10% for every lap of all the worlds (lap 2 = +10%, lap 3 = +20%, ...)
//   +5% (half a lap step) during the second batch of coins (phase 3)
const ENEMY_SCALING = {
    PER_LAP: 0.10,
    SECOND_BATCH: 0.05
};

// Level definitions and configurations.
//
// Per-biome look and feel:
//   biomeName / icon / mapColor  - shown on the level splash and the world map
//   atmosphere                   - sky/fog colour comes from skyColor; light colours and strengths, fog distances
//   ambientEffect                - floating particles around Sheepy (snow, embers, sand, fireflies, pollen):
//                                  velocity is units/sec, sway is how far each particle wobbles,
//                                  twinkle + additive make glowing particles that flicker
//   music                        - notes like 'C5' ('-' = rest), 32 steps; bass = one root note per 8 steps;
//                                  tempo = seconds per step; drums = standard | soft | tribal | driving
//   landmarks (optional)         - big solid scenery: [{ model, x, z, radius | halfSize, scale }]. Sheepy and
//                                  enemies go round a circle of `radius`, or a square of `halfSize`, at (x, z)
//                                  (unless the model brings its own colliders, like the stone circle), and no
//                                  obstacles spawn on it. Keep them clear of the middle SMALL_WORLD_SIZE square,
//                                  where collectables and bonus items spawn: about 4 units outside it, at the
//                                  middle of the north edge (seen most, as the camera faces north) and of a side
//                                  edge. Models are in SceneryModels (scenery.js); scale shrinks or grows one.
//   groundDetail (optional)      - SceneryModels function for walk-through ground decoration (no collision)
//
// Enemies: enemyTypes sets how many and which AI each runs; enemySpeed is units/sec before scaling.
//   enemyBehaviour gives each biome its own movement rhythm at about the same average speed:
//     weave   - slithers side to side          slide  - waddles, then belly-slides in fast bursts
//     pounce  - stalks slowly, pounces when close     scuttle - moves sideways in quick pulses
const LEVELS = {
    MAIN: {
        // Theme metadata
        displayName: 'LEVEL 1',
        biomeName: 'Sunny Meadow',
        icon: '🌳',
        mapColor: '#4caf50',
        skyColor: 0x87CEEB,
        groundType: 'generateMeadowTexture',
        primaryCoinModel: 'createPinkCoin',
        primaryCoinName: 'Pink Coins',
        primaryCoinLabel: 'Coins: ',
        primaryCoinColor: '#FF69B4',
        goldCoinModel: 'createGoldCoin',
        goldCoinName: 'Gold Coins',
        goldCoinColor: '#FFD700',
        obstacleModel: 'createTree',
        bonusItemModel: 'createRaspberry',
        hasEnemies: false,
        enemyModel: null,
        enemyTypes: [],
        enemyColors: [],
        enemySpeed: 0,
        enemyBehaviour: null,
        atmosphere: {
            ambientColor: 0xffffff, ambientIntensity: 0.6,
            sunColor: 0xffffff, sunIntensity: 0.8,
            fogNear: 20, fogFar: 60
        },
        ambientEffect: { // drifting pollen
            count: 140, color: 0xfff6c8, size: 0.35, opacity: 0.85,
            heightMin: 0.5, heightMax: 8, velocity: [0.8, 0.1, 0.3], sway: 0.6
        },
        // A windmill on the north edge, with a dirt path from its door towards the middle,
        // and a stone circle on the east edge
        landmarks: [
            { model: 'createWindmill', x: 0, z: -49, radius: 4.8 },
            { model: 'createStoneCircle', x: 54, z: 2 }
        ],
        groundDetail: 'createMeadowPath',
        music: {
            melody: 'G3 D4 B3 G4 D4 B3 G3 B3 C4 E4 G4 C5 G4 E4 C4 E4 G3 D4 B3 G4 D4 B3 G3 B3 D4 F#4 A3 D5 A3 F#4 D4 F#4',
            bass: ['G2', 'C3', 'G2', 'D3'], tempo: 0.13, wave: 'triangle', gain: 0.1, drums: 'standard'
        },
        // World config
        PINK_COINS_COUNT: 20,
        GOLD_COINS_COUNT: 10,
        TREES_COUNT: 60,
        WORLD_SIZE: 160,
        SMALL_WORLD_SIZE: 80,
        GROUND_SIZE: 200,
        COIN_SPAWN_HEIGHT: 1,
        GOLD_COIN_SPAWN_HEIGHT: 6,
        TREE_EXCLUSION_ZONE: 5
    },

    DESERT: {
        // Theme metadata
        displayName: 'LEVEL 2',
        biomeName: 'Dusty Desert',
        icon: '🌵',
        mapColor: '#e8c98a',
        skyColor: 0xf3dcae,
        groundType: 'generateDesertTexture',
        primaryCoinModel: 'createWaterDrop',
        primaryCoinName: 'Water Drops',
        primaryCoinLabel: 'Drops: ',
        primaryCoinColor: '#4facfe',
        goldCoinModel: 'createSunCoin',
        goldCoinName: 'Sun Coins',
        goldCoinColor: '#ffaa00',
        obstacleModel: 'createCactus',
        bonusItemModel: 'createWatermelon',
        hasEnemies: true,
        enemyModel: 'createSnake',
        enemyTypes: ['BLINKY', 'PINKY', 'INKY', 'CLYDE'],
        enemyColors: [0xff0000, 0xffb8ff, 0x00ffff, 0xffb852],
        enemySpeed: 6.0,
        enemyBehaviour: 'weave',
        atmosphere: {
            ambientColor: 0xfff0d8, ambientIntensity: 0.55,
            sunColor: 0xfff0c4, sunIntensity: 0.9,
            fogNear: 25, fogFar: 70
        },
        ambientEffect: { // blowing sand
            count: 450, color: 0xd9b77a, size: 0.25, opacity: 0.7,
            heightMin: 0.1, heightMax: 3, velocity: [9, 0, 2], sway: 0.3
        },
        // A big pyramid on the north edge, a smaller one on the west edge, and wind ripples in the sand
        landmarks: [
            { model: 'createPyramid', x: 0, z: -55, halfSize: 11 },
            { model: 'createPyramid', x: -51, z: 2, halfSize: 7.15, scale: 0.65 }
        ],
        groundDetail: 'createSandRipples',
        music: {
            melody: 'E4 F4 G#4 A4 B4 A4 G#4 F4 E4 - E4 F4 G#4 F4 E4 - B4 C5 B4 A4 G#4 A4 B4 - C5 B4 A4 G#4 F4 G#4 E4 -',
            bass: ['E2', 'E2', 'F2', 'E2'], tempo: 0.15, wave: 'square', gain: 0.05, drums: 'standard'
        },
        // World config
        PINK_COINS_COUNT: 20,
        GOLD_COINS_COUNT: 10,
        TREES_COUNT: 60,
        WORLD_SIZE: 160,
        SMALL_WORLD_SIZE: 80,
        GROUND_SIZE: 200,
        COIN_SPAWN_HEIGHT: 1,
        GOLD_COIN_SPAWN_HEIGHT: 6,
        TREE_EXCLUSION_ZONE: 5
    },

    SNOW: {
        // Theme metadata
        displayName: 'LEVEL 3',
        biomeName: 'Snowy Peaks',
        icon: '❄️',
        mapColor: '#e3f0fb',
        skyColor: 0xc8dff5,
        groundType: 'generateSnowTexture',
        primaryCoinModel: 'createSnowflake',
        primaryCoinName: 'Snowflakes',
        primaryCoinLabel: 'Snowflakes: ',
        primaryCoinColor: '#ddf0ff',
        goldCoinModel: 'createBauble',
        goldCoinName: 'Baubles',
        goldCoinColor: '#FFD700',
        obstacleModel: 'createSnowCapTree',
        bonusItemModel: 'createCoconut',
        hasEnemies: true,
        enemyModel: 'createPenguin',
        enemyTypes: ['BLINKY', 'PINKY', 'INKY', 'CLYDE', 'BLINKY', 'PINKY'],
        enemyColors: [0xff3333, 0xff88ff, 0x00ffff, 0xffaa33, 0xff6666, 0xffbbff],
        enemySpeed: 6.33,
        enemyBehaviour: 'slide',
        atmosphere: {
            ambientColor: 0xdde8ff, ambientIntensity: 0.65,
            sunColor: 0xffffff, sunIntensity: 0.65,
            fogNear: 15, fogFar: 60
        },
        ambientEffect: { // falling snow
            count: 700, color: 0xffffff, size: 0.55, opacity: 0.95,
            heightMin: 0, heightMax: 30, velocity: [0.6, -3.2, 0.2], sway: 0.8
        },
        // A big igloo on the north edge, a smaller one on the east edge, and frozen puddles
        landmarks: [
            { model: 'createIgloo', x: 0, z: -51, radius: 7.2 },
            { model: 'createIgloo', x: 49, z: 2, radius: 5.04, scale: 0.7 }
        ],
        groundDetail: 'createIcePatches',
        music: {
            melody: 'C5 E5 G5 E5 C6 G5 E5 G5 A4 C5 E5 C5 A5 E5 C5 E5 F4 A4 C5 A4 F5 C5 A4 C5 G4 B4 D5 B4 G5 D5 B4 D5',
            bass: ['C3', 'A2', 'F2', 'G2'], tempo: 0.16, wave: 'sine', gain: 0.12, drums: 'soft'
        },
        // World config
        PINK_COINS_COUNT: 20,
        GOLD_COINS_COUNT: 10,
        TREES_COUNT: 50,
        WORLD_SIZE: 160,
        SMALL_WORLD_SIZE: 80,
        GROUND_SIZE: 200,
        COIN_SPAWN_HEIGHT: 1,
        GOLD_COIN_SPAWN_HEIGHT: 6,
        TREE_EXCLUSION_ZONE: 5
    },

    JUNGLE: {
        // Theme metadata
        displayName: 'LEVEL 4',
        biomeName: 'Jungle Jumble',
        icon: '🌴',
        mapColor: '#2e7d32',
        skyColor: 0x3d6e4a,
        groundType: 'generateJungleTexture',
        primaryCoinModel: 'createFlower',
        primaryCoinName: 'Flowers',
        primaryCoinLabel: 'Flowers: ',
        primaryCoinColor: '#FF69B4',
        goldCoinModel: 'createGrassTuft',
        goldCoinName: 'Grass Tufts',
        goldCoinColor: '#7CFC00',
        obstacleModel: 'createPalmTree',
        bonusItemModel: 'createPineapple',
        hasEnemies: true,
        enemyModel: 'createTiger',
        enemyTypes: ['BLINKY', 'BLINKY', 'PINKY', 'PINKY', 'INKY', 'INKY', 'CLYDE', 'CLYDE'],
        enemyColors: [0xFF4500, 0xFF6600, 0xFF8C00, 0xFFA500, 0xFF5500, 0xFF7700, 0xFF9900, 0xFFBB00],
        enemySpeed: 6.67,
        enemyBehaviour: 'pounce',
        atmosphere: {
            ambientColor: 0xd8ffd0, ambientIntensity: 0.55,
            sunColor: 0xfff4c0, sunIntensity: 0.75,
            fogNear: 15, fogFar: 60
        },
        ambientEffect: { // fireflies
            count: 120, color: 0xd4ff5a, size: 0.6, opacity: 1,
            heightMin: 0.5, heightMax: 6, velocity: [0, 0.15, 0], sway: 1.2, twinkle: true, additive: true
        },
        // Temple ruins on the north edge (stairs facing south) with a flagstone path, and a giant
        // stone head on the west edge
        landmarks: [
            { model: 'createJungleRuins', x: 0, z: -55, halfSize: 11 },
            { model: 'createStoneHead', x: -48, z: 2, radius: 3.8 }
        ],
        groundDetail: 'createRuinsPath',
        music: {
            melody: 'G4 - B4 D5 E5 D5 B4 - A4 - B4 A4 G4 E4 G4 - D5 - E5 G5 E5 D5 B4 - A4 B4 D5 B4 A4 G4 G4 -',
            bass: ['G2', 'E2', 'C3', 'D3'], tempo: 0.12, wave: 'triangle', gain: 0.1, drums: 'tribal'
        },
        // World config
        PINK_COINS_COUNT: 20,
        GOLD_COINS_COUNT: 10,
        TREES_COUNT: 60,
        WORLD_SIZE: 160,
        SMALL_WORLD_SIZE: 80,
        GROUND_SIZE: 200,
        COIN_SPAWN_HEIGHT: 1,
        GOLD_COIN_SPAWN_HEIGHT: 6,
        TREE_EXCLUSION_ZONE: 5
    },

    VOLCANO: {
        // Theme metadata
        displayName: 'LEVEL 5',
        biomeName: 'Volcano Valley',
        icon: '🌋',
        mapColor: '#8a2a0a',
        skyColor: 0x6b2e0e,
        groundType: 'generateVolcanoTexture',
        primaryCoinModel: 'createRuby',
        primaryCoinName: 'Rubies',
        primaryCoinLabel: 'Rubies: ',
        primaryCoinColor: '#FF1744',
        goldCoinModel: 'createDiamond',
        goldCoinName: 'Diamonds',
        goldCoinColor: '#b8f0ff',
        obstacleModel: 'createVolcanicRock',
        bonusItemModel: 'createIceCreamScoop',
        hasEnemies: true,
        enemyModel: 'createFireCrab',
        enemyTypes: ['BLINKY', 'BLINKY', 'PINKY', 'PINKY', 'INKY', 'INKY', 'CLYDE', 'CLYDE', 'BLINKY', 'PINKY'],
        enemyColors: [0xFF2200, 0xFF4400, 0xFF6600, 0xFF8800, 0xFF3300, 0xFF5500, 0xFF7700, 0xFF9900, 0xFF1100, 0xFFAA00],
        enemySpeed: 7.0,
        enemyBehaviour: 'scuttle',
        atmosphere: {
            ambientColor: 0xffc09a, ambientIntensity: 0.5,
            sunColor: 0xff9a50, sunIntensity: 0.9,
            fogNear: 18, fogFar: 62
        },
        ambientEffect: { // rising embers
            count: 260, color: 0xff7a22, size: 0.45, opacity: 1,
            heightMin: 0, heightMax: 25, velocity: [0.4, 2.2, 0], sway: 0.7, twinkle: true, additive: true
        },
        // The volcano on the north edge, and a bubbling lava pool on the east edge
        landmarks: [
            { model: 'createVolcanoLandmark', x: 0, z: -56, radius: 12 },
            { model: 'createLavaPool', x: 50, z: 2, radius: 5.8 }
        ],
        groundDetail: 'createLavaCracks',
        music: {
            melody: 'A4 A4 C5 A4 E5 A4 D5 C5 A4 A4 C5 A4 G4 E4 G4 B4 A4 A4 C5 A4 E5 A4 F5 E5 D5 C5 B4 C5 A4 E4 A4 -',
            bass: ['A2', 'A2', 'F2', 'E2'], tempo: 0.11, wave: 'square', gain: 0.05, drums: 'driving'
        },
        // World config
        PINK_COINS_COUNT: 20,
        GOLD_COINS_COUNT: 10,
        TREES_COUNT: 55,
        WORLD_SIZE: 160,
        SMALL_WORLD_SIZE: 80,
        GROUND_SIZE: 200,
        COIN_SPAWN_HEIGHT: 1,
        GOLD_COIN_SPAWN_HEIGHT: 6,
        TREE_EXCLUSION_ZONE: 5
    },

    // Bonus level configuration
    BONUS: {
        DURATION: 10, // seconds
        RASPBERRY_SPAWN_INTERVAL: 300, // ms
        RASPBERRY_SPAWN_HEIGHT: 30,
        RASPBERRY_FALL_SPEED: 0.4,
        RASPBERRY_FINAL_HEIGHT: 1.5,
        RASPBERRY_COLLISION_DISTANCE: 5,
        RASPBERRY_SCORE: 200
    },

    // Coin values
    SCORES: {
        PINK_COIN: 10,
        GOLD_COIN: 50,
        RASPBERRY: 200
    },

    // Particle system
    PARTICLES: {
        COUNT: 10,
        LIFE_DECAY: 0.03,
        VELOCITY_Y: -0.1,
        ROTATION_SPEED: 0.2,
        OFFSET_DISTANCE: 2.5,
        RANDOM_OFFSET: 1.5
    }
};

// Helper functions for level generation
const LevelUtils = {
    // Generate random position within world bounds
    getRandomPosition(worldSize, exclusionZone = 0) {
        let x, z;
        do {
            x = (Math.random() - 0.5) * worldSize;
            z = (Math.random() - 0.5) * worldSize;
        } while (Math.abs(x) < exclusionZone && Math.abs(z) < exclusionZone);
        return { x, z };
    },

    // Check if position is too close to player spawn
    isTooCloseToSpawn(x, z, minDistance = 5) {
        return Math.abs(x) < minDistance && Math.abs(z) < minDistance;
    },

    // Generate positions for multiple objects
    generatePositions(count, worldSize, exclusionZone = 0) {
        const positions = [];
        for (let i = 0; i < count; i++) {
            positions.push(this.getRandomPosition(worldSize, exclusionZone));
        }
        return positions;
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { LEVEL_ORDER, ENEMY_SCALING, LEVELS, LevelUtils };
}

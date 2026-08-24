const LEVEL_ORDER = ['MAIN', 'DESERT', 'SNOW', 'JUNGLE', 'VOLCANO'];

// Level definitions and configurations
const LEVELS = {
    MAIN: {
        // Theme metadata
        displayName: 'LEVEL 1',
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
        skyColor: 0x87CEEB,
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
        enemyTypes: ['BLINKY', 'BLINKY', 'PINKY', 'PINKY', 'INKY', 'INKY', 'CLYDE', 'CLYDE'],
        enemyColors: [0xff3333, 0xff6666, 0xff88ff, 0xffbbff, 0x00ffff, 0x44ddff, 0xffaa33, 0xffcc77],
        enemySpeed: 5.5,
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
        enemySpeed: 6.5,
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
        enemyTypes: ['BLINKY', 'BLINKY', 'PINKY', 'PINKY', 'INKY', 'INKY', 'CLYDE', 'CLYDE'],
        enemyColors: [0xFF2200, 0xFF4400, 0xFF6600, 0xFF8800, 0xFF3300, 0xFF5500, 0xFF7700, 0xFF9900],
        enemySpeed: 7.0,
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
    module.exports = { LEVEL_ORDER, LEVELS, LevelUtils };
}

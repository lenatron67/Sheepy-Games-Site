// Configuration and Settings
const CONSTANTS = {
    // Game settings
    GAME_STATES: {
        START: 'START',
        PLAYING: 'PLAYING',
        BONUS: 'BONUS',
        FINISHED: 'FINISHED'
    },
    
    // Player settings
    PLAYER_SPEEDS: {
        NORMAL: 0.3,
        SHEEPY: 0.6,
        BONUS: 0.5
    },
    
    // Physics
    GRAVITY: 0.04,
    JUMP_VELOCITY: 0.6,
    
    // Camera
    CAMERA_HEIGHTS: {
        NORMAL: 25,
        SHEEPY: 40,
        BONUS: 35
    },
    CAMERA_DISTANCES: {
        NORMAL: 20,
        SHEEPY: 30,
        BONUS: 25
    },
    
    // Game objectives
    PINK_COINS_TO_TRANSFORM: 10,
    GOLD_COINS_TO_REVERT: 10,
    TOTAL_PINK_COINS: 20,
    
    // Bonus level
    BONUS_TIME: 10, // seconds
    BONUS_RASPBERRY_SPAWN_INTERVAL: 300, // ms
    
    // Colors
    COLORS: {
        PINK_COIN: 0xFF69B4,
        GOLD_COIN: 0xFFD700,
        RASPBERRY: 0xe30b5d,
        MEADOW: 0x2d5a27,
        SKY: 0x87CEEB,
        TREE_TRUNK: 0x8B4513,
        TREE_LEAVES: 0x2E8B57,
        SHEEP_BODY: 0xffffff,
        SHEEP_HEAD: 0x333333,
        CHICKEN_BODY: 0xFFFFFF,
        CHICKEN_BEAK: 0xFFA500,
        CHICKEN_COMB: 0xFF0000
    },
    
    // Audio frequencies
    AUDIO: {
        BAA_BASE: 220,
        BAA_SHEEPY: 800,
        BAA_BONUS: 600,
        BAA_VICTORY: 440,
        COIN_PINK: 1000,
        COIN_GOLD: 1500
    },
    
    // UI text
    UI_TEXTS: {
        START_TITLE: "Collect 10 Pink Coins!",
        SHEEPY_TITLE: "Collect 10 GOLD Coins!",
        BONUS_TITLE: "BONUS ROUND!",
        FINISH_TITLE: "LEVEL COMPLETE!"
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONSTANTS;
}

// Saved progress: which worlds are unlocked, and each world's best score.
// Stored in localStorage on this device only (the website and the Android app each keep their own).
// Needs LEVEL_ORDER from levels.js.

const Progress = {
    STORAGE_KEY: 'sheepy_hop_progress',
    data: null,

    load() {
        if (this.data) return this.data;
        let saved = null;
        try {
            saved = JSON.parse(localStorage.getItem(this.STORAGE_KEY));
        } catch (e) {
            saved = null; // storage blocked or corrupt: start fresh
        }
        const unlocked = saved && Number.isInteger(saved.unlocked) ? saved.unlocked : 1;
        const best = {};
        if (saved && saved.best && typeof saved.best === 'object') {
            for (const name of LEVEL_ORDER) {
                if (Number.isFinite(saved.best[name])) best[name] = saved.best[name];
            }
        }
        this.data = {
            unlocked: Math.max(1, Math.min(LEVEL_ORDER.length, unlocked)), // number of worlds open, from the first
            best: best
        };
        return this.data;
    },

    save() {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
        } catch (e) {
            // Storage unavailable (e.g. private browsing): progress lasts for this session only
        }
    },

    isUnlocked(levelName) {
        const i = LEVEL_ORDER.indexOf(levelName);
        return i >= 0 && i < this.load().unlocked;
    },

    furthestUnlocked() {
        return LEVEL_ORDER[this.load().unlocked - 1];
    },

    bestScore(levelName) {
        const b = this.load().best[levelName];
        return Number.isFinite(b) ? b : null;
    },

    // Record a completed world. Returns what changed, for the level-complete banner:
    //   unlockedLevel: name of a world that just opened up (or null)
    //   newBest: true if this beat a previous best score for the world
    completeLevel(levelName, levelScore) {
        const d = this.load();
        const i = LEVEL_ORDER.indexOf(levelName);
        let unlockedLevel = null;
        if (i >= 0) {
            d.unlocked = Math.max(d.unlocked, i + 1); // the world just completed counts as open, however it was reached
            if (i + 1 < LEVEL_ORDER.length && d.unlocked < i + 2) {
                d.unlocked = i + 2;
                unlockedLevel = LEVEL_ORDER[i + 1];
            }
        }
        const previous = this.bestScore(levelName);
        const newBest = previous !== null && levelScore > previous;
        if (previous === null || levelScore > previous) d.best[levelName] = levelScore;
        this.save();
        return { unlockedLevel, newBest };
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Progress };
}

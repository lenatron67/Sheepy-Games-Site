// Global Firebase configuration and leaderboard logic

const firebaseConfig = {
    apiKey: "AIzaSyBG7k-8lH3jFzIvZKoPggGnDxBxkrfFDmM",
    authDomain: "sheepy-hop.firebaseapp.com",
    projectId: "sheepy-hop",
    storageBucket: "sheepy-hop.firebasestorage.app",
    messagingSenderId: "906765469977",
    appId: "1:906765469977:web:a681adbe8fdd1e4f449d88"
};

// Initialize Firebase (Compat)
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

const FirebaseManager = {
    async saveScore(score, name) {
        if (score <= 0) return; // Don't save zero scores
        try {
            await db.collection("highscores").add({
                name: name,
                score: score,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log("Score saved successfully!");
        } catch (e) {
            console.error("Error saving score: ", e);
        }
    },

    async getLeaderboard() {
        try {
            const qs = await db.collection("highscores")
                .orderBy("score", "desc")
                .limit(5)
                .get();
            return qs.docs.map(doc => doc.data());
        } catch (e) {
            console.error("Error fetching leaderboard: ", e);
            return [];
        }
    },
    
    async isTop5Score(score) {
        if (score <= 0) return false;
        try {
            const scores = await this.getLeaderboard();
            if (scores.length < 5) return true;
            return score > scores[scores.length - 1].score;
        } catch (e) {
            console.error("Error checking top score: ", e);
            return false;
        }
    }
};

// Expose globally
if (typeof window !== 'undefined') {
    window.FirebaseManager = FirebaseManager;
}

// Music and Sound Effects

class AudioManager {
    constructor() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.gameMusicTimer = null;
        this.isGameMusicActive = false;
        this.gameBeat = 0;
        this.noiseBuffer = null;
        
        this.themeLoop = null;
        this.isThemePlaying = false;
        
        // Music notes frequencies
        this.NOTES = {
            G: 196.00,
            B: 246.94,
            D: 293.66,
            g: 392.00,
            C: 261.63,
            E: 329.63,
            c: 523.25,
            A: 220.00,
            Fs: 369.99,
            d: 587.33
        };
        
        // Game music melody
        this.GAME_MELODY = [
            this.NOTES.G, this.NOTES.D, this.NOTES.B, this.NOTES.g,
            this.NOTES.D, this.NOTES.B, this.NOTES.G, this.NOTES.B,
            this.NOTES.C, this.NOTES.E, this.NOTES.g, this.NOTES.c,
            this.NOTES.g, this.NOTES.E, this.NOTES.C, this.NOTES.E,
            this.NOTES.G, this.NOTES.D, this.NOTES.B, this.NOTES.g,
            this.NOTES.D, this.NOTES.B, this.NOTES.G, this.NOTES.B,
            this.NOTES.D, this.NOTES.Fs, this.NOTES.A, this.NOTES.d,
            this.NOTES.A, this.NOTES.Fs, this.NOTES.D, this.NOTES.Fs
        ];
        
        // Theme music
        this.THEME_MELODY = [
            392.00, 329.63, 261.63, 329.63,
            392.00, 392.00, 392.00, 0,
            329.63, 392.00, 523.25, 392.00,
            329.63, 329.63, 261.63, 0
        ];
        
        this.THEME_BASS = [
            130.81, 0, 196.00, 0,
            130.81, 0, 196.00, 0,
            130.81, 0, 196.00, 0,
            130.81, 0, 196.00, 0
        ];
    }
    
    // Initialize audio context (must be called after user interaction)
    init() {
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }
    
    // Play baa sound
    playBaa(baseFreq = 220) {
        this.init();
        
        const t = this.audioContext.currentTime;
        
        // Main oscillator
        const osc = this.audioContext.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(baseFreq, t);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.8, t + 0.5);
        
        // Filter
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, t);
        filter.Q.value = 1;
        
        // Vibrato
        const vOsc = this.audioContext.createOscillator();
        vOsc.type = 'sine';
        vOsc.frequency.value = 7;
        const vGain = this.audioContext.createGain();
        vGain.gain.value = 10;
        vOsc.connect(vGain);
        vGain.connect(osc.frequency);
        
        // Envelope
        const gain = this.audioContext.createGain();
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.3, t + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.6);
        
        // Connect nodes
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.audioContext.destination);
        
        // Start/stop
        osc.start(t);
        vOsc.start(t);
        osc.stop(t + 0.6);
        vOsc.stop(t + 0.6);
        
        return { osc, vOsc, gain };
    }
    
    // Play coin sound
    playCoinSound(type = 'pink') {
        this.init();
        
        const t = this.audioContext.currentTime;
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        
        if (type === 'gold') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1500, t);
            osc.frequency.exponentialRampToValueAtTime(2000, t + 0.1);
            
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(0.3, t + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);
            
            osc.start(t);
            osc.stop(t + 0.5);
        } else {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1000, t);
            
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(0.2, t + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
            
            osc.start(t);
            osc.stop(t + 0.3);
        }
        
        return { osc, gain };
    }
    
    // Get noise buffer for percussion
    getNoiseBuffer() {
        if (!this.noiseBuffer) {
            this.noiseBuffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate, this.audioContext.sampleRate);
            const data = this.noiseBuffer.getChannelData(0);
            for (let i = 0; i < this.audioContext.sampleRate; i++) {
                data[i] = Math.random() * 2 - 1;
            }
        }
        return this.noiseBuffer;
    }
    
    // Note name ('C4', 'F#4', 'Bb3') to frequency in Hz; '-' or empty is a rest (0)
    noteToFreq(name) {
        if (!name || name === '-') return 0;
        const m = /^([A-G])(#|b)?(-?\d)$/.exec(name);
        if (!m) return 0;
        const semis = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
        const midi = (parseInt(m[3], 10) + 1) * 12 + semis;
        return 440 * Math.pow(2, (midi - 69) / 12);
    }

    // Turn a level's music settings (see levels.js) into frequencies the sequencer can play
    compileTrack(track) {
        // Accepts 'C4 E4 -' strings or arrays of note names and/or frequencies
        const toFreqs = (notes) => (Array.isArray(notes) ? notes : notes.trim().split(/\s+/))
            .map(n => typeof n === 'number' ? n : this.noteToFreq(n));
        return {
            melody: toFreqs(track.melody),
            bass: toFreqs(track.bass),
            tempo: track.tempo || 0.13,
            wave: track.wave || 'triangle',
            gain: track.gain || 0.1,
            drums: track.drums || 'standard'
        };
    }

    // Play game music. `track` is a level's music settings; defaults to the original Meadow tune.
    playGameMusic(track) {
        if (this.isGameMusicActive) return;

        this.isGameMusicActive = true;
        this.gameBeat = 0;
        const song = this.compileTrack(track || { melody: this.GAME_MELODY, bass: [98.00, 130.81, 98.00, 146.83] });
        this.activeTrack = song;
        const tempo = song.tempo; // seconds per beat

        const playBeat = () => {
            if (!this.isGameMusicActive) return;

            const t = this.audioContext.currentTime;
            const freq = song.melody[this.gameBeat % song.melody.length];

            // Melody
            if (freq) {
                const osc = this.audioContext.createOscillator();
                osc.type = song.wave;
                osc.frequency.setValueAtTime(freq, t);

                const gain = this.audioContext.createGain();
                gain.gain.setValueAtTime(0, t);
                gain.gain.linearRampToValueAtTime(song.gain, t + 0.01);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

                osc.connect(gain);
                gain.connect(this.audioContext.destination);
                osc.start(t);
                osc.stop(t + 0.15);
            }

            // Bass (every 4 beats): the bar's root note, then its fifth
            if (this.gameBeat % 4 === 0) {
                const bar = Math.floor((this.gameBeat % 32) / 8);
                let bassFreq = song.bass[bar % song.bass.length];
                if (this.gameBeat % 8 !== 0) bassFreq *= 1.5;
                
                const osc = this.audioContext.createOscillator();
                osc.type = 'square';
                osc.frequency.setValueAtTime(bassFreq, t);
                
                const gain = this.audioContext.createGain();
                gain.gain.setValueAtTime(0.05, t);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
                
                const filter = this.audioContext.createBiquadFilter();
                filter.type = 'lowpass';
                filter.frequency.value = 600;
                
                osc.connect(filter);
                filter.connect(gain);
                gain.connect(this.audioContext.destination);
                osc.start(t);
                osc.stop(t + 0.2);
            }
            
            // Percussion
            this.playDrums(song.drums, this.gameBeat, t);

            this.gameBeat++;
            this.gameMusicTimer = setTimeout(playBeat, tempo * 1000);
        };
        
        playBeat();
    }
    
    // Drum patterns, one step (beat) at a time
    playDrums(style, beat, t) {
        const step = beat % 4;
        const oddBar = Math.floor(beat / 4) % 2 === 1;
        switch (style) {
            case 'soft': // gentle: quiet kick and hat
                if (step === 0) this.playKick(t, 0.08);
                if (step === 2) this.playHat(t, 0.04);
                break;
            case 'tribal': // kick plus low toms on alternate bars
                if (step === 0) this.playKick(t, 0.2);
                if (step === 2) oddBar ? this.playTom(t, 0.18, 180) : this.playHat(t, 0.1);
                if (step === 3 && oddBar) this.playTom(t, 0.12, 140);
                break;
            case 'driving': // kick on every other beat, hat in between
                if (step === 0 || step === 2) this.playKick(t, 0.18);
                if (step === 1 || step === 3) this.playHat(t, 0.08);
                break;
            default: // 'standard': the original Meadow beat
                if (step === 0) this.playKick(t, 0.2);
                else if (step === 2) this.playHat(t, 0.1);
        }
    }

    playKick(t, volume) {
        const osc = this.audioContext.createOscillator();
        osc.frequency.setValueAtTime(150, t);
        osc.frequency.exponentialRampToValueAtTime(0.01, t + 0.1);

        const gain = this.audioContext.createGain();
        gain.gain.setValueAtTime(volume, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        osc.start(t);
        osc.stop(t + 0.1);
    }

    playHat(t, volume) {
        const src = this.audioContext.createBufferSource();
        src.buffer = this.getNoiseBuffer();

        const gain = this.audioContext.createGain();
        gain.gain.setValueAtTime(volume, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 1000;

        src.connect(filter);
        filter.connect(gain);
        gain.connect(this.audioContext.destination);
        src.start(t);
        src.stop(t + 0.1);
    }

    playTom(t, volume, startFreq) {
        const osc = this.audioContext.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(startFreq, t);
        osc.frequency.exponentialRampToValueAtTime(60, t + 0.15);

        const gain = this.audioContext.createGain();
        gain.gain.setValueAtTime(volume, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        osc.start(t);
        osc.stop(t + 0.15);
    }

    // Stop game music
    stopGameMusic() {
        this.isGameMusicActive = false;
        if (this.gameMusicTimer) {
            clearTimeout(this.gameMusicTimer);
        }
    }
    
    // Play theme music
    playThemeMusic() {
        if (this.isThemePlaying || this.audioContext.state === 'suspended') return;
        
        this.isThemePlaying = true;
        let noteIndex = 0;
        const noteDuration = 0.2;
        
        const playNextNote = () => {
            if (!this.isThemePlaying) return;
            
            const t = this.audioContext.currentTime;
            const freq = this.THEME_MELODY[noteIndex % this.THEME_MELODY.length];
            
            // Melody
            if (freq > 0) {
                const osc = this.audioContext.createOscillator();
                osc.type = 'square';
                osc.frequency.setValueAtTime(freq, t);
                
                const gain = this.audioContext.createGain();
                gain.gain.setValueAtTime(0.05, t);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
                
                osc.connect(gain);
                gain.connect(this.audioContext.destination);
                osc.start(t);
                osc.stop(t + 0.2);
            }
            
            // Bass
            const bassFreq = this.THEME_BASS[noteIndex % this.THEME_BASS.length];
            if (bassFreq > 0) {
                const osc = this.audioContext.createOscillator();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(bassFreq, t);
                
                const gain = this.audioContext.createGain();
                gain.gain.setValueAtTime(0.1, t);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
                
                osc.connect(gain);
                gain.connect(this.audioContext.destination);
                osc.start(t);
                osc.stop(t + 0.3);
            }
            
            noteIndex++;
            this.themeLoop = setTimeout(playNextNote, noteDuration * 1000);
        };
        
        playNextNote();
    }
    
    // Stop theme music
    stopThemeMusic() {
        this.isThemePlaying = false;
        if (this.themeLoop) {
            clearTimeout(this.themeLoop);
        }
    }
    
    // Stop all music
    stopAllMusic() {
        this.stopGameMusic();
        this.stopThemeMusic();
    }
}

// Create global audio manager instance
const audioManager = new AudioManager();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AudioManager, audioManager };
}

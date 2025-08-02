// Piano configuration
const PIANO_NOTES_IN_ORDER = [
    // Octave 3
    'C3', 'C#3', 'D3', 'D#3', 'E3', 'F3', 'F#3', 'G3', 'G#3', 'A3', 'A#3', 'B3',
    // Octave 4
    'C4', 'C#4', 'D4', 'D#4', 'E4', 'F4', 'F#4', 'G4', 'G#4', 'A4', 'A#4', 'B4',
    // Octave 5
    'C5', 'C#5', 'D5', 'D#5', 'E5', 'F5', 'F#5', 'G5'
];

// Key mappings from keyboard to piano notes
const KEY_TO_NOTE_MAP = {
    // White keys
    'KeyZ': 'C3', 'KeyX': 'D3', 'KeyC': 'E3', 'KeyV': 'F3', 'KeyB': 'G3', 'KeyN': 'A3', 'KeyM': 'B3',
    'Comma': 'C4', 'Period': 'D4', 'Slash': 'E4','KeyQ':'E4',
    'KeyW': 'F4', 'KeyE': 'G4', 'KeyR': 'A4', 'KeyT': 'B4', 'KeyY': 'C5', 'KeyU': 'D5', 
    'KeyI': 'E5', 'KeyO': 'F5', 'KeyP': 'G5',
    
    // Black keys
    'KeyS': 'C#3', 'KeyD': 'D#3', 'KeyG': 'F#3', 'KeyH': 'G#3', 'KeyJ': 'A#3',
    'KeyL': 'C#4', 'Digit1': 'D#4', 'Digit3': 'F#4', 'Digit4': 'G#4', 'Digit5': 'A#4',
    'Digit7': 'C#5', 'Digit8': 'D#5', 'Digit0': 'F#5'
};

// Reverse mapping for display
const NOTE_TO_KEY_MAP = {};
Object.keys(KEY_TO_NOTE_MAP).forEach(key => {
    const note = KEY_TO_NOTE_MAP[key];
    if (!NOTE_TO_KEY_MAP[note]) {
        const keyNames = {
            'KeyZ': 'Z', 'KeyX': 'X', 'KeyC': 'C', 'KeyV': 'V', 'KeyB': 'B', 'KeyN': 'N', 'KeyM': 'M',
            'Comma': ',', 'Period': '.', 'Slash': '/', 'KeyQ': 'Q', 'KeyW': 'W', 'KeyE': 'E', 'KeyR': 'R',
            'KeyT': 'T', 'KeyY': 'Y', 'KeyU': 'U', 'KeyI': 'I', 'KeyO': 'O', 'KeyP': 'P',
            'KeyS': 'S', 'KeyD': 'D', 'KeyG': 'G', 'KeyH': 'H', 'KeyJ': 'J', 'KeyL': 'L',
            'Digit1': '1', 'Digit3': '3', 'Digit4': '4', 'Digit5': '5', 'Digit7': '7', 'Digit8': '8', 'Digit0': '0'
        };
        NOTE_TO_KEY_MAP[note] = keyNames[key] || key;
    }
});

class PianoApp {
    constructor() {
        this.octaveShift = 0;
        this.audioContext = null;
        this.masterVolume = 0.7;
        this.activeOscillators = new Map();
        this.pressedKeys = new Set();
        this.mousePressed = false;
        this.masterGainNode = null;
        this.highlightedKeys = new Set();
        this.currentProgression = null;
        
        this.initAudio();
        this.setupEventListeners();
        this.renderPiano();
        this.updateOctaveLabel();
        this.setupChordProgressions();
        this.showWelcomeMessage();
    }

    async initAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create master gain node for volume control
            this.masterGainNode = this.audioContext.createGain();
            this.masterGainNode.gain.setValueAtTime(this.masterVolume, this.audioContext.currentTime);
            this.masterGainNode.connect(this.audioContext.destination);
            
        } catch (error) {
            console.error('Web Audio API not supported:', error);
            this.showError('Your browser does not support Web Audio API. Please use a modern browser.');
        }
    }

    setupEventListeners() {
        // Keyboard events
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
        
        // Octave controls
        document.getElementById('octave-down').addEventListener('click', () => this.lowerOctave());
        document.getElementById('octave-up').addEventListener('click', () => this.raiseOctave());
        
        // Clear chord highlights
        document.getElementById('clear-chords').addEventListener('click', () => {
            this.clearProgressionHighlight();
            this.showNotification('Chord highlights cleared', 'info', 1500);
        });
        
        // Volume control
        const volumeSlider = document.getElementById('volume-slider');
        const volumeDisplay = document.getElementById('volume-display');
        volumeSlider.addEventListener('input', (e) => {
            this.masterVolume = e.target.value / 100;
            if (this.masterGainNode) {
                this.masterGainNode.gain.setValueAtTime(this.masterVolume, this.audioContext.currentTime);
            }
            volumeDisplay.textContent = `${e.target.value}%`;
        });
        
        // Window resize handler
        window.addEventListener('resize', () => {
            setTimeout(() => this.renderPiano(), 100);
        });
        
        // Prevent context menu on piano keys
        document.getElementById('piano-container').addEventListener('contextmenu', (e) => e.preventDefault());
        
        // Prevent scrolling when using arrow keys
        document.addEventListener('keydown', (e) => {
            if (['ArrowUp', 'ArrowDown', 'Space'].includes(e.code)) {
                e.preventDefault();
            }
        });
    }

    setupChordProgressions() {
        // Genre tab switching
        const genreTabs = document.querySelectorAll('.genre-tab');
        const genreContents = document.querySelectorAll('.genre-content');
        
        genreTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Remove active class from all tabs and contents
                genreTabs.forEach(t => t.classList.remove('active'));
                genreContents.forEach(c => c.classList.remove('active'));
                
                // Add active class to clicked tab and corresponding content
                tab.classList.add('active');
                const genre = tab.dataset.genre;
                document.querySelector(`[data-genre="${genre}"].genre-content`).classList.add('active');
                
                // Clear any active progression
                this.clearProgressionHighlight();
            });
        });

        // Progression item clicking
        const progressionItems = document.querySelectorAll('.progression-item');
        progressionItems.forEach(item => {
            item.addEventListener('click', () => {
                this.handleProgressionClick(item);
            });
        });
    }

    handleProgressionClick(item) {
        // Clear previous highlights
        this.clearProgressionHighlight();
        
        // Remove active class from all progression items
        document.querySelectorAll('.progression-item').forEach(p => p.classList.remove('active'));
        
        // Add active class to clicked item
        item.classList.add('active');
        
        // Get chord data
        const chords = JSON.parse(item.dataset.chords);
        this.currentProgression = chords;
        
        // Highlight chord keys
        this.highlightChordProgression(chords);
        
        // Show notification
        const progressionName = item.querySelector('h4').textContent;
        this.showNotification(`Highlighting: ${progressionName}`, 'info', 3000);
    }

    highlightChordProgression(chords) {
        const chordNotes = this.getChordsNotes(chords);
        
        chordNotes.forEach(note => {
            const keyElement = document.querySelector(`[data-note="${note}"]`);
            if (keyElement) {
                keyElement.classList.add('highlighted-key');
                this.highlightedKeys.add(note);
            }
        });
    }

    clearProgressionHighlight() {
        this.highlightedKeys.forEach(note => {
            const keyElement = document.querySelector(`[data-note="${note}"]`);
            if (keyElement) {
                keyElement.classList.remove('highlighted-key');
            }
        });
        this.highlightedKeys.clear();
        this.currentProgression = null;
        
        // Remove active class from all progression items
        document.querySelectorAll('.progression-item').forEach(p => p.classList.remove('active'));
    }

    getChordsNotes(chords) {
        // Based on your piano layout: C3-G5 with specific key mappings
        const chordDefinitions = {
            // Major chords - optimized for your piano range
            'C': ['C3', 'E3', 'G3'],           // Z, C, B keys
            'D': ['D3', 'F#3', 'A3'],          // X, G, N keys  
            'E': ['E3', 'G#3', 'B3'],          // C, H, M keys
            'F': ['F3', 'A3', 'C4'],           // V, N, , keys
            'G': ['G3', 'B3', 'D4'],           // B, M, . keys
            'A': ['A3', 'C#4', 'E4'],          // N, L, / keys
            'B': ['B3', 'D#4', 'F#4'],         // M, 1, 3 keys
            'Bb': ['A#3', 'D4', 'F4'],         // J, ., W keys
            
            // Minor chords
            'Am': ['A3', 'C4', 'E4'],          // N, ,, / keys
            'Bm': ['B3', 'D4', 'F#4'],         // M, ., 3 keys
            'Cm': ['C3', 'D#3', 'G3'],         // Z, D, B keys
            'Dm': ['D3', 'F3', 'A3'],          // X, V, N keys
            'Em': ['E3', 'G3', 'B3'],          // C, B, M keys
            'Fm': ['F3', 'G#3', 'C4'],         // V, H, , keys
            'Gm': ['G3', 'A#3', 'D4'],         // B, J, . keys
            
            // Seventh chords
            'C7': ['C3', 'E3', 'G3', 'A#3'],   // Z, C, B, J keys
            'D7': ['D3', 'F#3', 'A3', 'C4'],   // X, G, N, , keys
            'E7': ['E3', 'G#3', 'B3', 'D4'],   // C, H, M, . keys
            'F7': ['F3', 'A3', 'C4', 'D#4'],   // V, N, ,, 1 keys
            'G7': ['G3', 'B3', 'D4', 'F4'],    // B, M, ., W keys
            'A7': ['A3', 'C#4', 'E4', 'G4'],   // N, L, /, E keys
            'B7': ['B3', 'D#4', 'F#4', 'A4'],  // M, 1, 3, R keys
            
            // Major seventh chords
            'Cmaj7': ['C3', 'E3', 'G3', 'B3'],    // Z, C, B, M keys
            'Dmaj7': ['D3', 'F#3', 'A3', 'C#4'],  // X, G, N, L keys
            'Emaj7': ['E3', 'G#3', 'B3', 'D#4'],  // C, H, M, 1 keys
            'Fmaj7': ['F3', 'A3', 'C4', 'E4'],    // V, N, ,, / keys
            'Gmaj7': ['G3', 'B3', 'D4', 'F#4'],   // B, M, ., 3 keys
            'Amaj7': ['A3', 'C#4', 'E4', 'G#4'],  // N, L, /, 4 keys
            'Bmaj7': ['B3', 'D#4', 'F#4', 'A#4'], // M, 1, 3, 5 keys
            
            // Minor seventh chords
            'Am7': ['A3', 'C4', 'E4', 'G4'],      // N, ,, /, E keys
            'Bm7': ['B3', 'D4', 'F#4', 'A4'],     // M, ., 3, R keys
            'Cm7': ['C3', 'D#3', 'G3', 'A#3'],    // Z, D, B, J keys
            'Dm7': ['D3', 'F3', 'A3', 'C4'],      // X, V, N, , keys
            'Em7': ['E3', 'G3', 'B3', 'D4'],      // C, B, M, . keys
            'Fm7': ['F3', 'G#3', 'C4', 'D#4'],    // V, H, ,, 1 keys
            'Gm7': ['G3', 'A#3', 'D4', 'F4']      // B, J, ., W keys
        };
        
        const allNotes = new Set();
        
        chords.forEach(chord => {
            const notes = chordDefinitions[chord];
            if (notes) {
                notes.forEach(note => {
                    // Only add notes that exist in your piano range
                    if (PIANO_NOTES_IN_ORDER.includes(note)) {
                        allNotes.add(note);
                    }
                });
            }
        });
        
        return Array.from(allNotes);
    }

    renderPiano() {
        const container = document.getElementById('piano-container');
        container.innerHTML = '';
        
        const whiteKeys = PIANO_NOTES_IN_ORDER.filter(note => !note.includes('#'));
        const containerWidth = container.clientWidth - 20; // Account for padding
        const whiteKeyWidth = containerWidth / whiteKeys.length;
        const blackKeyWidth = whiteKeyWidth * 0.65;
        
        let whiteKeyIndex = 0;
        
        PIANO_NOTES_IN_ORDER.forEach(note => {
            const isBlack = note.includes('#');
            const keyElement = document.createElement('div');
            keyElement.className = `piano-key ${isBlack ? 'black-key' : 'white-key'}`;
            keyElement.dataset.note = note;
            
            if (!isBlack) {
                // White key positioning
                keyElement.style.left = `${10 + whiteKeyIndex * whiteKeyWidth}px`;
                keyElement.style.width = `${whiteKeyWidth - 1}px`;
                whiteKeyIndex++;
                
                // Add octave label for C notes
                if (note.startsWith('C')) {
                    const octaveLabel = document.createElement('div');
                    octaveLabel.className = 'octave-label-key';
                    octaveLabel.textContent = note;
                    keyElement.appendChild(octaveLabel);
                }
            } else {
                // Black key positioning (between white keys)
                const prevWhiteKeyX = 10 + (whiteKeyIndex - 1) * whiteKeyWidth;
                keyElement.style.left = `${prevWhiteKeyX + whiteKeyWidth - blackKeyWidth / 2}px`;
                keyElement.style.width = `${blackKeyWidth}px`;
            }
            
            // Add keyboard label
            const keyLabel = NOTE_TO_KEY_MAP[note];
            if (keyLabel) {
                const labelElement = document.createElement('div');
                labelElement.className = 'key-label';
                labelElement.textContent = keyLabel;
                keyElement.appendChild(labelElement);
            }
            
            // Mouse events
            keyElement.addEventListener('mousedown', (e) => this.handleMouseDown(e, note));
            keyElement.addEventListener('mouseup', (e) => this.handleMouseUp(e, note));
            keyElement.addEventListener('mouseenter', (e) => this.handleMouseEnter(e, note));
            keyElement.addEventListener('mouseleave', (e) => this.handleMouseLeave(e, note));
            
            container.appendChild(keyElement);
        });
    }

    handleKeyDown(event) {
        if (event.repeat) return;
        
        // Handle octave controls
        if (event.code === 'ArrowUp') {
            this.raiseOctave();
            return;
        }
        if (event.code === 'ArrowDown') {
            this.lowerOctave();
            return;
        }
        

        
        const note = KEY_TO_NOTE_MAP[event.code];
        if (note && !this.pressedKeys.has(event.code)) {
            this.pressedKeys.add(event.code);
            this.playNote(note);
            this.setKeyPressed(note, true);
        }
    }

    handleKeyUp(event) {
        const note = KEY_TO_NOTE_MAP[event.code];
        if (note && this.pressedKeys.has(event.code)) {
            this.pressedKeys.delete(event.code);
            this.stopNote(note);
            this.setKeyPressed(note, false);
        }
    }

    handleMouseDown(event, note) {
        event.preventDefault();
        this.mousePressed = true;
        this.playNote(note);
        this.setKeyPressed(note, true);
    }

    handleMouseUp(event, note) {
        event.preventDefault();
        this.mousePressed = false;
        this.stopNote(note);
        this.setKeyPressed(note, false);
    }

    handleMouseEnter(event, note) {
        if (this.mousePressed) {
            this.playNote(note);
            this.setKeyPressed(note, true);
        }
    }

    handleMouseLeave(event, note) {
        if (this.mousePressed) {
            this.stopNote(note);
            this.setKeyPressed(note, false);
        }
    }

    setKeyPressed(note, pressed) {
        const keyElement = document.querySelector(`[data-note="${note}"]`);
        if (keyElement) {
            if (pressed) {
                keyElement.classList.add('pressed');
            } else {
                keyElement.classList.remove('pressed');
            }
        }
    }

    playNote(note) {
        if (!this.audioContext) return;
        
        const shiftedNote = this.shiftNote(note);
        const frequency = this.noteToFrequency(shiftedNote);
        
        if (this.activeOscillators.has(note)) {
            this.stopNote(note);
        }
        

        
        // Create complex piano-like sound with multiple harmonics
        const masterGain = this.audioContext.createGain();
        const compressor = this.audioContext.createDynamicsCompressor();
        const filter = this.audioContext.createBiquadFilter();
        
        // Set up filter for warmth
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(frequency * 8, this.audioContext.currentTime);
        filter.Q.setValueAtTime(0.5, this.audioContext.currentTime);
        
        // Set up compressor for more realistic dynamics
        compressor.threshold.setValueAtTime(-24, this.audioContext.currentTime);
        compressor.knee.setValueAtTime(30, this.audioContext.currentTime);
        compressor.ratio.setValueAtTime(12, this.audioContext.currentTime);
        compressor.attack.setValueAtTime(0.003, this.audioContext.currentTime);
        compressor.release.setValueAtTime(0.25, this.audioContext.currentTime);
        
        const oscillators = [];
        const gains = [];
        
        // Fundamental frequency
        const osc1 = this.audioContext.createOscillator();
        const gain1 = this.audioContext.createGain();
        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        oscillators.push(osc1);
        gains.push(gain1);
        
        // Second harmonic (octave)
        const osc2 = this.audioContext.createOscillator();
        const gain2 = this.audioContext.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(frequency * 2, this.audioContext.currentTime);
        oscillators.push(osc2);
        gains.push(gain2);
        
        // Third harmonic
        const osc3 = this.audioContext.createOscillator();
        const gain3 = this.audioContext.createGain();
        osc3.type = 'sine';
        osc3.frequency.setValueAtTime(frequency * 3, this.audioContext.currentTime);
        oscillators.push(osc3);
        gains.push(gain3);
        
        // Fifth harmonic for brightness
        const osc4 = this.audioContext.createOscillator();
        const gain4 = this.audioContext.createGain();
        osc4.type = 'sine';
        osc4.frequency.setValueAtTime(frequency * 5, this.audioContext.currentTime);
        oscillators.push(osc4);
        gains.push(gain4);
        
        // Slight detuning for richness
        const osc5 = this.audioContext.createOscillator();
        const gain5 = this.audioContext.createGain();
        osc5.type = 'triangle';
        osc5.frequency.setValueAtTime(frequency * 1.002, this.audioContext.currentTime);
        oscillators.push(osc5);
        gains.push(gain5);
        
        const now = this.audioContext.currentTime;
        
        // Connect oscillators to their gains
        oscillators.forEach((osc, i) => {
            osc.connect(gains[i]);
            gains[i].connect(masterGain);
        });
        
        // Connect audio chain
        masterGain.connect(filter);
        filter.connect(compressor);
        compressor.connect(this.masterGainNode);
        
        // Set harmonic levels based on octave for realism
        const octave = parseInt(shiftedNote.slice(-1));
        const harmonicLevels = this.getHarmonicLevels(octave);
        
        gains[0].gain.setValueAtTime(harmonicLevels.fundamental, now); // Fundamental
        gains[1].gain.setValueAtTime(harmonicLevels.second, now);      // 2nd harmonic
        gains[2].gain.setValueAtTime(harmonicLevels.third, now);       // 3rd harmonic
        gains[3].gain.setValueAtTime(harmonicLevels.fifth, now);       // 5th harmonic
        gains[4].gain.setValueAtTime(harmonicLevels.detune, now);      // Detuned fundamental
        
        // Piano-like envelope with octave-dependent characteristics
        const envelope = this.getPianoEnvelope(octave);
        masterGain.gain.setValueAtTime(0, now);
        masterGain.gain.linearRampToValueAtTime(envelope.attackLevel, now + envelope.attack);
        masterGain.gain.exponentialRampToValueAtTime(envelope.decayLevel, now + envelope.attack + envelope.decay);
        masterGain.gain.exponentialRampToValueAtTime(envelope.sustainLevel, now + envelope.attack + envelope.decay + envelope.sustain);
        
        // Start all oscillators
        oscillators.forEach(osc => osc.start());
        
        this.activeOscillators.set(note, { 
            oscillators, 
            gains, 
            masterGain, 
            filter, 
            compressor,
            startTime: now
        });
    }

    stopNote(note) {
        if (this.activeOscillators.has(note)) {
            const { oscillators, masterGain } = this.activeOscillators.get(note);
            const now = this.audioContext.currentTime;
            
            // Natural release envelope
            masterGain.gain.cancelScheduledValues(now);
            masterGain.gain.setValueAtTime(masterGain.gain.value, now);
            masterGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
            
            oscillators.forEach(osc => osc.stop(now + 0.3));
            this.activeOscillators.delete(note);
        }
    }

    shiftNote(note) {
        const match = note.match(/([A-G]#?)(\d)/);
        if (!match) return note;
        
        const [, noteName, octave] = match;
        const newOctave = parseInt(octave) + this.octaveShift;
        
        if (newOctave < 2 || newOctave > 6) {
            return note; // Out of range
        }
        
        return `${noteName}${newOctave}`;
    }

    noteToFrequency(note) {
        const baseFrequencies = {
            'C': 16.35, 'C#': 17.32, 'D': 18.35, 'D#': 19.45,
            'E': 20.60, 'F': 21.83, 'F#': 23.12, 'G': 24.50,
            'G#': 25.96, 'A': 27.50, 'A#': 29.14, 'B': 30.87
        };
        
        const match = note.match(/([A-G]#?)(\d)/);
        if (!match) return 440; // Default to A4
        
        const [, noteName, octave] = match;
        const baseFreq = baseFrequencies[noteName];
        
        return baseFreq * Math.pow(2, parseInt(octave));
    }

    raiseOctave() {
        const maxShift = 6 - parseInt(PIANO_NOTES_IN_ORDER[PIANO_NOTES_IN_ORDER.length - 1].slice(-1));
        if (this.octaveShift < maxShift) {
            this.octaveShift++;
            this.updateOctaveLabel();
            this.showNotification(`Octave raised to ${this.octaveShift >= 0 ? '+' : ''}${this.octaveShift}`);
        } else {
            this.showNotification('Cannot raise octave further', 'warning');
        }
    }

    lowerOctave() {
        const minShift = 2 - parseInt(PIANO_NOTES_IN_ORDER[0].slice(-1));
        if (this.octaveShift > minShift) {
            this.octaveShift--;
            this.updateOctaveLabel();
            this.showNotification(`Octave lowered to ${this.octaveShift >= 0 ? '+' : ''}${this.octaveShift}`);
        } else {
            this.showNotification('Cannot lower octave further', 'warning');
        }
    }

    updateOctaveLabel() {
        const label = document.getElementById('octave-label');
        label.textContent = `Octave shift: ${this.octaveShift >= 0 ? '+' : ''}${this.octaveShift}`;
        document.title = `Virtual Piano (C3-G5) - Press keys to play (Octave shift: ${this.octaveShift >= 0 ? '+' : ''}${this.octaveShift})`;
    }

    getHarmonicLevels(octave) {
        // Lower octaves have more fundamental, higher octaves have more harmonics
        if (octave <= 2) {
            return {
                fundamental: 0.8,
                second: 0.15,
                third: 0.08,
                fifth: 0.03,
                detune: 0.05
            };
        } else if (octave === 3) {
            return {
                fundamental: 0.7,
                second: 0.2,
                third: 0.12,
                fifth: 0.05,
                detune: 0.06
            };
        } else if (octave === 4) {
            return {
                fundamental: 0.6,
                second: 0.25,
                third: 0.15,
                fifth: 0.08,
                detune: 0.07
            };
        } else if (octave === 5) {
            return {
                fundamental: 0.5,
                second: 0.3,
                third: 0.18,
                fifth: 0.12,
                detune: 0.08
            };
        } else { // octave >= 6
            return {
                fundamental: 0.4,
                second: 0.35,
                third: 0.22,
                fifth: 0.15,
                detune: 0.1
            };
        }
    }

    getPianoEnvelope(octave) {
        // Lower notes have longer envelopes, higher notes are more percussive
        if (octave <= 2) {
            return {
                attack: 0.02,
                attackLevel: 0.9,
                decay: 0.15,
                decayLevel: 0.6,
                sustain: 0.4,
                sustainLevel: 0.4
            };
        } else if (octave === 3) {
            return {
                attack: 0.015,
                attackLevel: 0.85,
                decay: 0.12,
                decayLevel: 0.55,
                sustain: 0.3,
                sustainLevel: 0.35
            };
        } else if (octave === 4) {
            return {
                attack: 0.01,
                attackLevel: 0.8,
                decay: 0.1,
                decayLevel: 0.5,
                sustain: 0.25,
                sustainLevel: 0.3
            };
        } else if (octave === 5) {
            return {
                attack: 0.008,
                attackLevel: 0.75,
                decay: 0.08,
                decayLevel: 0.45,
                sustain: 0.2,
                sustainLevel: 0.25
            };
        } else { // octave >= 6
            return {
                attack: 0.005,
                attackLevel: 0.7,
                decay: 0.06,
                decayLevel: 0.4,
                sustain: 0.15,
                sustainLevel: 0.2
            };
        }
    }

    showWelcomeMessage() {
        setTimeout(() => {
            this.showNotification('Welcome! Click anywhere to enable audio, then start playing!', 'info', 4000);
        }, 500);
    }

    showNotification(message, type = 'info', duration = 2000) {
        // Remove existing notifications
        const existing = document.querySelector('.notification');
        if (existing) {
            existing.remove();
        }

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Styles for notification
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 20px',
            borderRadius: '8px',
            color: '#fff',
            fontWeight: '500',
            zIndex: '1000',
            opacity: '0',
            transform: 'translateX(100%)',
            transition: 'all 0.3s ease',
            maxWidth: '300px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
        });

        // Set background color based on type
        const colors = {
            info: 'linear-gradient(135deg, #A8C5E5, #8BB3D9)',
            warning: 'linear-gradient(135deg, #FFB366, #FF9933)',
            error: 'linear-gradient(135deg, #FF6B6B, #FF5252)'
        };
        notification.style.background = colors[type] || colors.info;

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 10);

        // Animate out and remove
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => notification.remove(), 300);
        }, duration);
    }

    showError(message) {
        this.showNotification(message, 'error', 5000);
    }

    // Enhanced key mapping display
    getKeyDisplayName(keyCode) {
        const keyNames = {
            'KeyZ': 'Z', 'KeyX': 'X', 'KeyC': 'C', 'KeyV': 'V', 'KeyB': 'B', 'KeyN': 'N', 'KeyM': 'M',
            'Comma': ',', 'Period': '.', 'Slash': '/', 'KeyQ': 'Q', 'KeyW': 'W', 'KeyE': 'E', 'KeyR': 'R',
            'KeyT': 'T', 'KeyY': 'Y', 'KeyU': 'U', 'KeyI': 'I', 'KeyO': 'O', 'KeyP': 'P',
            'KeyS': 'S', 'KeyD': 'D', 'KeyG': 'G', 'KeyH': 'H', 'KeyJ': 'J', 'KeyL': 'L',
            'Digit1': '1', 'Digit3': '3', 'Digit4': '4', 'Digit5': '5', 'Digit7': '7', 'Digit8': '8', 'Digit0': '0'
        };
        return keyNames[keyCode] || keyCode;
    }
}

// Initialize the piano when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.pianoApp = new PianoApp();
});

// Handle audio context resume (required by some browsers)
document.addEventListener('click', () => {
    if (window.pianoApp && window.pianoApp.audioContext && window.pianoApp.audioContext.state === 'suspended') {
        window.pianoApp.audioContext.resume();
    }
}, { once: true });
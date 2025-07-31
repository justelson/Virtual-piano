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
    'Comma': 'C4', 'Period': 'D4', 'Slash': 'E4',
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
        NOTE_TO_KEY_MAP[note] = key.replace('Key', '').replace('Digit', '').replace('Comma', ',').replace('Period', '.').replace('Slash', '/');
    }
});

class PianoApp {
    constructor() {
        this.octaveShift = 0;
        this.audioContext = null;
        this.activeOscillators = new Map();
        this.pressedKeys = new Set();
        this.mousePressed = false;
        
        this.initAudio();
        this.setupEventListeners();
        this.renderPiano();
        this.updateOctaveLabel();
    }

    async initAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (error) {
            console.error('Web Audio API not supported:', error);
        }
    }

    setupEventListeners() {
        // Keyboard events
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
        
        // Octave controls
        document.getElementById('octave-down').addEventListener('click', () => this.lowerOctave());
        document.getElementById('octave-up').addEventListener('click', () => this.raiseOctave());
        
        // Prevent context menu on piano keys
        document.getElementById('piano-container').addEventListener('contextmenu', (e) => e.preventDefault());
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
        
        // Create oscillator with piano-like sound
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        // Piano-like waveform (combination of sine waves)
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        
        // Envelope for piano-like attack and decay
        const now = this.audioContext.currentTime;
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.3, now + 0.01); // Quick attack
        gainNode.gain.exponentialRampToValueAtTime(0.1, now + 0.1); // Decay
        gainNode.gain.exponentialRampToValueAtTime(0.05, now + 0.5); // Sustain
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.start();
        
        this.activeOscillators.set(note, { oscillator, gainNode });
    }

    stopNote(note) {
        if (this.activeOscillators.has(note)) {
            const { oscillator, gainNode } = this.activeOscillators.get(note);
            const now = this.audioContext.currentTime;
            
            // Quick fade out
            gainNode.gain.cancelScheduledValues(now);
            gainNode.gain.setValueAtTime(gainNode.gain.value, now);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
            
            oscillator.stop(now + 0.1);
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
        } else {
            alert('Cannot raise octave further.');
        }
    }

    lowerOctave() {
        const minShift = 2 - parseInt(PIANO_NOTES_IN_ORDER[0].slice(-1));
        if (this.octaveShift > minShift) {
            this.octaveShift--;
            this.updateOctaveLabel();
        } else {
            alert('Cannot lower octave further.');
        }
    }

    updateOctaveLabel() {
        const label = document.getElementById('octave-label');
        label.textContent = `Octave shift: ${this.octaveShift >= 0 ? '+' : ''}${this.octaveShift}`;
        document.title = `Virtual Piano (C3-G5) - Press keys to play (Octave shift: ${this.octaveShift >= 0 ? '+' : ''}${this.octaveShift})`;
    }
}

// Initialize the piano when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new PianoApp();
});

// Handle audio context resume (required by some browsers)
document.addEventListener('click', () => {
    if (window.pianoApp && window.pianoApp.audioContext && window.pianoApp.audioContext.state === 'suspended') {
        window.pianoApp.audioContext.resume();
    }
}, { once: true });
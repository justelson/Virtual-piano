# 🎹 Virtual Piano

A professional-grade virtual piano application built with HTML5, CSS3, and JavaScript. Experience realistic piano sounds with multiple harmonics, octave-dependent characteristics, and a beautiful modern interface.

![Virtual Piano Screenshot](https://img.shields.io/badge/Status-Complete-brightgreen)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)
![Web Audio API](https://img.shields.io/badge/Web%20Audio%20API-FF6B35?logo=webaudio&logoColor=white)

## ✨ Features

### 🎵 Realistic Piano Sound
- **Multiple Harmonics**: Each note uses 5 oscillators (fundamental, 2nd, 3rd, 5th harmonics, plus slight detuning)
- **Octave-Dependent Characteristics**: Lower notes emphasize fundamental frequency, higher notes have more prominent harmonics
- **Dynamic Audio Processing**: Low-pass filtering and compression for authentic piano sound
- **Natural Envelopes**: Attack, decay, and sustain times vary by octave to match real piano behavior

### 🎮 Interactive Controls
- **Keyboard Input**: Full keyboard mapping for white and black keys
- **Mouse/Touch Support**: Click or tap piano keys directly
- **Octave Shifting**: Change octave range with buttons or arrow keys
- **Volume Control**: Real-time volume adjustment with visual feedback
- **Responsive Design**: Works seamlessly on desktop and mobile devices

### 🎨 Modern Interface
- **Professional Design**: Gradient backgrounds and modern typography
- **Realistic Piano Keys**: 3D-styled keys with hover and press animations
- **Smart Notifications**: Non-intrusive feedback for user actions
- **Comprehensive Instructions**: Clear key mapping guide and controls

## 🚀 Getting Started

### Quick Start
1. **Simple Method**: Open `index.html` directly in your web browser
2. **With Java Server** (optional):
   ```bash
   javac PianoServer.java
   java PianoServer
   ```
   Then open `http://localhost:8080` in your browser

### Browser Requirements
- Modern web browser with Web Audio API support
- Chrome, Firefox, Safari, or Edge (latest versions recommended)
- JavaScript enabled

## 🎹 How to Play

### Keyboard Mapping

#### White Keys
| Keys | Notes |
|------|-------|
| `Z X C V B N M` | C3 - B3 |
| `, . / Q W E R` | C4 - B4 |
| `T Y U I O P` | C5 - G5 |

#### Black Keys (Sharps)
| Keys | Notes |
|------|-------|
| `S D G H J` | C#3 - A#3 |
| `L 1 3 4 5` | C#4 - A#4 |
| `7 8 0` | C#5 - F#5 |

### Controls
- **Arrow Keys**: `↑` / `↓` to change octave
- **Volume Slider**: Adjust sound level (0-100%)
- **Octave Buttons**: Click `Octave +` / `Octave -` for octave control

## 🛠️ Technical Details

### Audio Architecture
```
Oscillators (5 per note) → Individual Gains → Master Gain → 
Low-pass Filter → Dynamic Compressor → Audio Output
```

### Sound Generation
- **Fundamental Frequency**: Triangle wave for rich base tone
- **Harmonics**: Sine waves at 2x, 3x, 5x fundamental frequency
- **Detuning**: Slight frequency offset for natural richness
- **Envelope Shaping**: ADSR envelope with octave-specific timing

### File Structure
```
piano-java-html-v2/
├── index.html          # Main HTML file with UI
├── piano.js           # Core piano logic and audio processing
├── PianoServer.java   # Optional Java HTTP server
├── run.bat           # Windows batch file to run server
└── README.md         # This documentation
```

## 🎼 Note Range

The piano covers **3 octaves** from **C3 to G5**:
- **Octave 3**: C3 - B3 (12 notes)
- **Octave 4**: C4 - B4 (12 notes) 
- **Octave 5**: C5 - G5 (7 notes)

**Total**: 31 keys (19 white keys, 12 black keys)

## 🔧 Customization

### Adjusting Sound Characteristics
Modify the `getHarmonicLevels()` and `getPianoEnvelope()` methods in `piano.js` to customize:
- Harmonic content ratios
- Attack/decay/sustain timings
- Octave-specific sound characteristics

### Visual Styling
Edit the CSS in `index.html` to customize:
- Color schemes and gradients
- Key dimensions and spacing
- Animation effects and transitions

## 🌐 Browser Compatibility

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome | ✅ Full | Recommended |
| Firefox | ✅ Full | Excellent performance |
| Safari | ✅ Full | May require user interaction to start audio |
| Edge | ✅ Full | Good performance |
| Mobile Browsers | ✅ Partial | Touch support, may have audio latency |

## 🚨 Troubleshooting

### No Sound
1. **Check browser support**: Ensure Web Audio API is supported
2. **User interaction required**: Click anywhere on the page first
3. **Volume settings**: Check both app volume and system volume
4. **Browser permissions**: Allow audio playback if prompted

### Performance Issues
1. **Close other audio applications**
2. **Use latest browser version**
3. **Reduce number of simultaneous notes**
4. **Lower volume if experiencing distortion**

## 🤝 Contributing

This project welcomes contributions! Areas for improvement:
- Additional sound synthesis methods
- More octave ranges
- Recording/playback functionality
- MIDI input support
- Additional instrument sounds

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- Inspired by real piano acoustics and Web Audio API capabilities
- Built with modern web technologies for optimal performance
- Designed for both casual users and music enthusiasts

---

**Enjoy playing! 🎵**

*For questions or suggestions, please open an issue or submit a pull request.*
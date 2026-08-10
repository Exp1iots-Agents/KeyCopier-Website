# KeyCopier Web

A web-based port of the [KeyCopier](https://github.com/zinongli/KeyCopier) Flipper Zero app for measuring key bitting patterns.

## What is KeyCopier?

KeyCopier is a tool for measuring the bitting patterns of physical keys. By placing your key on a screen and aligning it with the displayed contour, you can manually adjust pin depths to match your key's cuts. The app then generates a bitting code that can be used for key duplication or 3D printing.

## Features

- **23+ Key Formats**: Supports a wide variety of key manufacturers and formats including Kwikset, Schlage, Yale, Master Lock, and more.
- **Double-Sided Keys**: Support for double-sided keys (e.g., car keys).
- **Visual Alignment**: Place your key on the screen and align it with the contour.
- **Pin Depth Adjustment**: Use sliders or keyboard controls to adjust each pin's depth.
- **Bitting Code Generation**: Automatically generates bitting codes in the correct format.
- **Export Options**: Export bitting codes as text, JSON, or copy to clipboard.
- **MACS Compliance**: Enforces Maximum Adjacent Cut Specification rules for valid bitting codes.

## Supported Key Formats

### Single-Sided Keys
- Kwikset KW1
- Schlage SC4
- Arrow AR4
- Master Lock M1
- American AM7
- Yale Y2, Y11
- Sargent S22
- National NA25, NA12
- Corbin CO88
- Lockwood LW4, LW5
- Russwin RU45
- Weiser WR3
- Best (A2) SFIC

### Double-Sided Keys
- Ford H75
- Chevrolet B102
- Dodge Y159
- Kawasaki KA14
- Suzuki SUZ18
- Yamaha YM63
- RV (FIC, GL, Bauer) RV

## How to Use

1. **Select Your Key Format**
   - Choose the manufacturer from the dropdown menu.
   - Select the specific key format from the second dropdown.

2. **Start Measuring**
   - Click "Start Measuring" to begin.

3. **Align Your Key**
   - Place your physical key on top of the screen.
   - Align it with the displayed contour.

4. **Adjust Pin Depths**
   - Use the sliders to adjust each pin's depth until they match your key's cuts.
   - Alternatively, use the arrow keys:
     - ← → : Navigate between pins
     - ↑ ↓ : Increase/decrease depth
   - Tip: Close one eye for better alignment.

5. **View Bitting Code**
   - The bitting code will be displayed automatically as you adjust the pins.

6. **Export Your Results**
   - Copy to clipboard
   - Export as JSON
   - Export as Text

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| ← | Previous Pin |
| → | Next Pin |
| ↑ | Increase Depth |
| ↓ | Decrease Depth |

## Browser Compatibility

- Chrome (recommended)
- Firefox
- Safari
- Edge
- Mobile browsers (iOS Safari, Chrome for Android)

## Installation

### Option 1: Use Online

Visit the live demo at: [https://vibecode.github.io/keycopier-web](https://vibecode.github.io/keycopier-web)

### Option 2: Local Development

1. Clone this repository:
   ```bash
   git clone https://github.com/vibecode/keycopier-web.git
   cd keycopier-web
   ```

2. Open `index.html` in your browser:
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Then open http://localhost:8000 in your browser
   ```

3. Or use any static file server.

## Project Structure

```
keycopier-web/
├── index.html          # Main HTML file
├── css/
│   └── styles.css      # CSS styles
├── js/
│   ├── app.js          # Main application logic
│   ├── canvas_renderer.js  # Canvas drawing logic
│   └── key_profiles.js # Key format database
└── README.md           # This file
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Adding New Key Formats

To add a new key format:

1. Add the format to the `KEY_PROFILES` array in `js/key_profiles.js`.
2. Follow the existing format structure with all required fields.
3. Test the new format to ensure it displays correctly.

### Required Fields for Key Formats

| Field | Description | Unit |
|-------|-------------|------|
| manufacturer | Key manufacturer name | string |
| format_name | Format identifier | string |
| format_link | Link to format specifications | string |
| sides | Number of sides (1 or 2) | number |
| stop | Stop type (0 or 2) | number |
| first_pin_inch | Position of first pin | inches |
| last_pin_inch | Position of last pin | inches |
| pin_increment_inch | Distance between pins | inches |
| pin_num | Number of pins | number |
| pin_width_inch | Width of each pin | inches |
| drill_angle | Drill angle for keyway | degrees |
| elbow_inch | Elbow position | inches |
| uncut_depth_inch | Depth when uncut | inches |
| deepest_depth_inch | Maximum cut depth | inches |
| depth_step_inch | Depth increment per step | inches |
| min_depth_ind | Minimum depth index | number |
| max_depth_ind | Maximum depth index | number |
| macs | Maximum Adjacent Cut Specification | number |
| clearance | Clearance value | number |

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Credits

- Original KeyCopier app for Flipper Zero: [@Torron](https://github.com/zinongli/KeyCopier)
- Web port: VibeCode
- Key format data: Contributors to the original KeyCopier project

## Special Thanks

- [@jamisonderek](https://github.com/jamisonderek) for Flipper Zero tutorials
- [@HonestLocksmith](https://github.com/HonestLocksmith) for adding new key formats
- All contributors to the original KeyCopier project

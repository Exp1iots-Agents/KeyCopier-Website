// KeyCopier Web - Main Application
// Port of the Flipper Zero KeyCopier app to a website

class KeyCopierApp {
    constructor() {
        // DOM Elements
        this.manufacturerSelect = document.getElementById('manufacturer-select');
        this.formatSelect = document.getElementById('format-select');
        this.startMeasureBtn = document.getElementById('start-measure-btn');
        this.formatSelectionSection = document.getElementById('format-selection');
        this.measurementInterface = document.getElementById('measurement-interface');
        this.canvas = document.getElementById('key-canvas');
        this.prevPinBtn = document.getElementById('prev-pin-btn');
        this.nextPinBtn = document.getElementById('next-pin-btn');
        this.pinIndicator = document.getElementById('pin-indicator');
        this.decreaseDepthBtn = document.getElementById('decrease-depth-btn');
        this.increaseDepthBtn = document.getElementById('increase-depth-btn');
        this.depthIndicator = document.getElementById('depth-indicator');
        this.bittingResult = document.querySelector('.bitting-result');
        this.bittingCodeDisplay = document.getElementById('bitting-code');
        this.copyBtn = document.getElementById('copy-btn');
        this.exportJsonBtn = document.getElementById('export-json-btn');
        this.exportTextBtn = document.getElementById('export-text-btn');
        this.exportStlBtn = document.getElementById('export-stl-btn');
        this.backToSelectionBtn = document.getElementById('back-to-selection-btn');
        this.doubleSidedToggle = document.getElementById('double-sided-toggle');
        this.doubleSidedCheckbox = document.getElementById('double-sided-checkbox');
        this.sideSelect = document.getElementById('side-select');
        this.pinSlidersContainer = document.querySelector('.pin-sliders');

        // State
        this.selectedManufacturer = '';
        this.selectedFormat = null;
        this.selectedFormatIndex = -1;
        this.renderer = new KeyCanvasRenderer('key-canvas');
        this.depths = [];
        this.currentPin = 0;
        this.isDoubleSided = false;
        this.currentSide = 'top';

        // Initialize
        this.init();
    }

    init() {
        this.populateManufacturerDropdown();
        this.setupEventListeners();
        this.updateUI();
    }

    populateManufacturerDropdown() {
        const manufacturers = getUniqueManufacturers();
        
        manufacturers.forEach(manufacturer => {
            const option = document.createElement('option');
            option.value = manufacturer;
            option.textContent = manufacturer;
            this.manufacturerSelect.appendChild(option);
        });
    }

    populateFormatDropdown(manufacturer) {
        this.formatSelect.innerHTML = '<option value="">-- Select Format --</option>';
        
        if (!manufacturer) {
            this.formatSelect.disabled = true;
            return;
        }

        const formats = getFormatsByManufacturer(manufacturer);
        formats.forEach((format, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = `${format.format_name}`;
            this.formatSelect.appendChild(option);
        });

        this.formatSelect.disabled = false;
    }

    setupEventListeners() {
        // Manufacturer selection
        this.manufacturerSelect.addEventListener('change', (e) => {
            this.selectedManufacturer = e.target.value;
            this.populateFormatDropdown(this.selectedManufacturer);
            this.updateUI();
        });

        // Format selection
        this.formatSelect.addEventListener('change', (e) => {
            const index = parseInt(e.target.value);
            if (!isNaN(index)) {
                this.selectedFormatIndex = index;
                this.selectedFormat = getFormatByIndex(index);
                this.updateUI();
            }
        });

        // Start measurement
        this.startMeasureBtn.addEventListener('click', () => {
            this.startMeasurement();
        });

        // Back to selection
        this.backToSelectionBtn.addEventListener('click', () => {
            this.showFormatSelection();
        });

        // Pin navigation
        this.prevPinBtn.addEventListener('click', () => {
            this.selectPreviousPin();
        });

        this.nextPinBtn.addEventListener('click', () => {
            this.selectNextPin();
        });

        // Depth adjustment
        this.decreaseDepthBtn.addEventListener('click', () => {
            this.decreaseCurrentDepth();
        });

        this.increaseDepthBtn.addEventListener('click', () => {
            this.increaseCurrentDepth();
        });

        // Double-sided toggle
        this.doubleSidedCheckbox.addEventListener('change', (e) => {
            this.isDoubleSided = e.target.checked;
            this.sideSelect.classList.toggle('hidden', !this.isDoubleSided);
            this.updateUI();
        });

        // Side selection
        this.sideSelect.addEventListener('change', (e) => {
            this.currentSide = e.target.value;
            this.renderer.setCurrentSide(this.currentSide);
            this.updateUI();
        });

        // Export buttons
        this.copyBtn.addEventListener('click', () => {
            this.copyToClipboard();
        });

        this.exportJsonBtn.addEventListener('click', () => {
            this.exportAsJson();
        });

        this.exportTextBtn.addEventListener('click', () => {
            this.exportAsText();
        });

        this.exportStlBtn.addEventListener('click', () => {
            this.exportAsStl();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (this.measurementInterface.classList.contains('hidden')) return;

            switch (e.key) {
                case 'ArrowLeft':
                    this.selectPreviousPin();
                    break;
                case 'ArrowRight':
                    this.selectNextPin();
                    break;
                case 'ArrowUp':
                    this.increaseCurrentDepth();
                    break;
                case 'ArrowDown':
                    this.decreaseCurrentDepth();
                    break;
            }
        });
    }

    updateUI() {
        // Update start button state
        this.startMeasureBtn.disabled = !this.selectedFormat;

        // Update measurement interface visibility
        if (this.selectedFormat) {
            this.renderer.setFormat(this.selectedFormat);
            this.depths = this.renderer.getDepths();
            this.renderer.draw();
            this.currentPin = 0;
            this.updatePinControls();
            this.updateDepthControls();
            this.updateBittingCode();
            
            // Check if format is double-sided
            this.isDoubleSided = this.selectedFormat.sides === 2;
            this.doubleSidedCheckbox.checked = this.isDoubleSided;
            this.sideSelect.classList.toggle('hidden', !this.isDoubleSided);
            this.doubleSidedToggle.classList.toggle('hidden', !this.isDoubleSided);
            
            // Create sliders for each pin
            this.createPinSliders();
        }
    }

    createPinSliders() {
        this.pinSlidersContainer.innerHTML = '';
        
        if (!this.selectedFormat) return;

        for (let i = 0; i < this.selectedFormat.pin_num; i++) {
            const sliderGroup = document.createElement('div');
            sliderGroup.className = 'pin-slider';

            const label = document.createElement('label');
            label.textContent = `Pin ${i + 1}`;
            sliderGroup.appendChild(label);

            const slider = document.createElement('input');
            slider.type = 'range';
            slider.min = this.selectedFormat.min_depth_ind;
            slider.max = this.selectedFormat.max_depth_ind;
            slider.value = this.depths[i] || this.selectedFormat.min_depth_ind;
            slider.dataset.pinIndex = i;
            
            slider.addEventListener('input', (e) => {
                const pinIndex = parseInt(e.target.dataset.pinIndex);
                const depth = parseInt(e.target.value);
                this.depths[pinIndex] = depth;
                this.renderer.setDepth(pinIndex, depth);
                this.currentPin = pinIndex;
                this.updatePinControls();
                this.updateDepthControls();
                this.updateBittingCode();
            });

            sliderGroup.appendChild(slider);
            
            const valueDisplay = document.createElement('span');
            valueDisplay.className = 'slider-value';
            valueDisplay.textContent = slider.value;
            sliderGroup.appendChild(valueDisplay);

            this.pinSlidersContainer.appendChild(sliderGroup);
        }
    }

    startMeasurement() {
        this.formatSelectionSection.classList.add('hidden');
        this.measurementInterface.classList.remove('hidden');
        this.bittingResult.classList.add('hidden');
        
        // Force canvas resize now that it's visible
        setTimeout(() => {
            this.renderer.resize();
            // Initialize renderer with selected format
            this.renderer.setFormat(this.selectedFormat);
            this.depths = this.renderer.getDepths();
            this.currentPin = 0;
            
            this.updatePinControls();
            this.updateDepthControls();
            this.updateBittingCode();
        }, 100);
    }

    showFormatSelection() {
        this.measurementInterface.classList.add('hidden');
        this.formatSelectionSection.classList.remove('hidden');
        this.bittingResult.classList.add('hidden');
    }

    selectPreviousPin() {
        if (this.currentPin > 0) {
            this.currentPin--;
            this.renderer.setSelectedPin(this.currentPin);
            this.updatePinControls();
            this.updateDepthControls();
        }
    }

    selectNextPin() {
        if (this.selectedFormat && this.currentPin < this.selectedFormat.pin_num - 1) {
            this.currentPin++;
            this.renderer.setSelectedPin(this.currentPin);
            this.updatePinControls();
            this.updateDepthControls();
        }
    }

    decreaseCurrentDepth() {
        if (this.renderer.decreaseDepth(this.currentPin)) {
            this.depths = this.renderer.getDepths();
            this.updateDepthControls();
            this.updateBittingCode();
            this.updatePinSliders();
        }
    }

    increaseCurrentDepth() {
        if (this.renderer.increaseDepth(this.currentPin)) {
            this.depths = this.renderer.getDepths();
            this.updateDepthControls();
            this.updateBittingCode();
            this.updatePinSliders();
        }
    }

    updatePinControls() {
        this.pinIndicator.textContent = `Pin ${this.currentPin + 1}`;
        this.prevPinBtn.disabled = this.currentPin === 0;
        this.nextPinBtn.disabled = !this.selectedFormat || this.currentPin >= (this.selectedFormat.pin_num - 1);
    }

    updateDepthControls() {
        if (!this.selectedFormat) return;
        
        const currentDepth = this.depths[this.currentPin];
        this.depthIndicator.textContent = `Depth: ${currentDepth}`;
    }

    updatePinSliders() {
        const sliders = this.pinSlidersContainer.querySelectorAll('input[type="range"]');
        sliders.forEach((slider, index) => {
            if (index < this.depths.length) {
                slider.value = this.depths[index];
                const valueDisplay = slider.nextElementSibling;
                if (valueDisplay && valueDisplay.classList.contains('slider-value')) {
                    valueDisplay.textContent = slider.value;
                }
            }
        });
    }

    updateBittingCode() {
        if (!this.selectedFormat) return;

        const bittingCode = this.renderer.getBittingCode();
        this.bittingCodeDisplay.textContent = `${this.selectedFormat.manufacturer} ${this.selectedFormat.format_name}: ${bittingCode}`;
    }

    showBittingResult() {
        this.updateBittingCode();
        this.bittingResult.classList.remove('hidden');
    }

    copyToClipboard() {
        const bittingCode = this.bittingCodeDisplay.textContent;
        if (bittingCode) {
            navigator.clipboard.writeText(bittingCode).then(() => {
                this.showToast('Bitting code copied to clipboard!');
            }).catch(err => {
                console.error('Failed to copy:', err);
                this.showToast('Failed to copy to clipboard');
            });
        }
    }

    exportAsJson() {
        if (!this.selectedFormat) return;

        const data = {
            manufacturer: this.selectedFormat.manufacturer,
            format: this.selectedFormat.format_name,
            format_link: this.selectedFormat.format_link,
            pin_num: this.selectedFormat.pin_num,
            bitting_code: this.depths,
            bitting_string: this.depths.join('-'),
            macs: this.selectedFormat.macs,
            clearance: this.selectedFormat.clearance,
            timestamp: new Date().toISOString()
        };

        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.selectedFormat.manufacturer}_${this.selectedFormat.format_name}_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showToast('Exported as JSON!');
    }

    exportAsText() {
        if (!this.selectedFormat) return;

        let text = `KeyCopier Web Export\n`;
        text += `===================\n\n`;
        text += `Manufacturer: ${this.selectedFormat.manufacturer}\n`;
        text += `Format: ${this.selectedFormat.format_name}\n`;
        text += `Pins: ${this.selectedFormat.pin_num}\n`;
        text += `Bitting Code: ${this.depths.join('-')}\n`;
        text += `MACS: ${this.selectedFormat.macs}\n`;
        text += `Clearance: ${this.selectedFormat.clearance}\n`;
        text += `\n`;
        text += `Individual Depths:\n`;
        
        for (let i = 0; i < this.depths.length; i++) {
            text += `  Pin ${i + 1}: ${this.depths[i]}\n`;
        }
        
        text += `\n`;
        text += `Format Link: ${this.selectedFormat.format_link}\n`;
        text += `Exported: ${new Date().toLocaleString()}\n`;

        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.selectedFormat.manufacturer}_${this.selectedFormat.format_name}_${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showToast('Exported as Text!');
    }


    exportAsStl() {
        if (!this.selectedFormat) return;

        // STL generation is complex and requires 3D modeling
        // For now, we'll generate a simple STL based on the key profile
        // This is a placeholder that generates a basic key blank STL
        
        const header = "KeyCopier Web STL Export\n";
        const formatName = `${this.selectedFormat.manufacturer}_${this.selectedFormat.format_name}`;
        const date = new Date().toISOString().split('T')[0];
        const solidName = `key_${formatName}_${date}`;
        
        // Generate a simple STL (this is a simplified version)
        // A real implementation would need proper 3D geometry
        let stl = `solid ${solidName}\n`;
        
        // Add a simple key shape (this is a placeholder)
        // In a real implementation, we would:
        // 1. Create the key blank shape
        // 2. Add cuts based on the bitting code
        // 3. Generate proper facets
        
        // For now, generate a simple rectangular prism as a placeholder
        const width = 20;
        const height = 5;
        const depth = 2;
        
        // Front face
        stl += `  facet normal 0.0 0.0 1.0\n`;
        stl += `    outer loop\n`;
        stl += `      vertex -${width/2} -${height/2} ${depth/2}\n`;
        stl += `      vertex ${width/2} -${height/2} ${depth/2}\n`;
        stl += `      vertex ${width/2} ${height/2} ${depth/2}\n`;
        stl += `      vertex -${width/2} ${height/2} ${depth/2}\n`;
        stl += `    endloop\n`;
        stl += `  endfacet\n`;
        
        // Back face
        stl += `  facet normal 0.0 0.0 -1.0\n`;
        stl += `    outer loop\n`;
        stl += `      vertex -${width/2} -${height/2} -${depth/2}\n`;
        stl += `      vertex -${width/2} ${height/2} -${depth/2}\n`;
        stl += `      vertex ${width/2} ${height/2} -${depth/2}\n`;
        stl += `      vertex ${width/2} -${height/2} -${depth/2}\n`;
        stl += `    endloop\n`;
        stl += `  endfacet\n`;
        
        // Add more facets to complete the shape...
        // (This is a simplified placeholder)
        
        stl += `endsolid ${solidName}\n`;

        const blob = new Blob([stl], { type: 'application/vnd.ms-pki.stl' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `${solidName}.stl`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showToast('Exported as STL! (Placeholder - full 3D coming soon)');
    }

    showToast(message) {
        // Remove existing toast
        const existingToast = document.querySelector('.toast');
        if (existingToast) {
            existingToast.remove();
        }

        // Create new toast
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);

        // Remove after 3 seconds
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new KeyCopierApp();
});

// Canvas Renderer for KeyCopier Web
// Simplified version that definitely draws visible lines

class KeyCanvasRenderer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.format = null;
        this.depths = [];
        this.selectedPin = 0;
        this.sides = 1;
        this.currentSide = 'top';
        
        // Set canvas size
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        const container = this.canvas.parentElement;
        if (container) {
            this.canvas.width = container.clientWidth;
            this.canvas.height = 400;
        } else {
            this.canvas.width = 800;
            this.canvas.height = 400;
        }
        this.draw();
    }

    setFormat(format) {
        this.format = format;
        this.sides = format.sides || 1;
        this.depths = [];
        
        for (let i = 0; i < format.pin_num; i++) {
            this.depths[i] = format.min_depth_ind;
        }
        
        this.selectedPin = 0;
        this.draw();
    }

    setDepths(depths) {
        this.depths = depths;
        this.draw();
    }

    setSelectedPin(pinIndex) {
        this.selectedPin = pinIndex;
        this.draw();
    }

    setCurrentSide(side) {
        this.currentSide = side;
        this.draw();
    }

    setDepth(pinIndex, depth) {
        if (pinIndex >= 0 && pinIndex < this.depths.length) {
            this.depths[pinIndex] = depth;
            this.draw();
        }
    }

    increaseDepth(pinIndex) {
        if (this.format && pinIndex >= 0 && pinIndex < this.depths.length) {
            const currentDepth = this.depths[pinIndex];
            if (currentDepth < this.format.max_depth_ind) {
                let canIncrease = true;
                
                if (pinIndex > 0) {
                    const prevDepth = this.depths[pinIndex - 1];
                    if (Math.abs(currentDepth + 1 - prevDepth) >= this.format.macs) {
                        canIncrease = false;
                    }
                }
                
                if (pinIndex < this.depths.length - 1) {
                    const nextDepth = this.depths[pinIndex + 1];
                    if (Math.abs(currentDepth + 1 - nextDepth) >= this.format.macs) {
                        canIncrease = false;
                    }
                }
                
                if (canIncrease) {
                    this.depths[pinIndex] = currentDepth + 1;
                    this.draw();
                    return true;
                }
            }
        }
        return false;
    }

    decreaseDepth(pinIndex) {
        if (this.format && pinIndex >= 0 && pinIndex < this.depths.length) {
            const currentDepth = this.depths[pinIndex];
            if (currentDepth > this.format.min_depth_ind) {
                let canDecrease = true;
                
                if (pinIndex > 0) {
                    const prevDepth = this.depths[pinIndex - 1];
                    if (Math.abs(currentDepth - 1 - prevDepth) >= this.format.macs) {
                        canDecrease = false;
                    }
                }
                
                if (pinIndex < this.depths.length - 1) {
                    const nextDepth = this.depths[pinIndex + 1];
                    if (Math.abs(currentDepth - 1 - nextDepth) >= this.format.macs) {
                        canDecrease = false;
                    }
                }
                
                if (canDecrease) {
                    this.depths[pinIndex] = currentDepth - 1;
                    this.draw();
                    return true;
                }
            }
        }
        return false;
    }

    getDepths() {
        return this.depths;
    }

    getBittingCode() {
        if (!this.format || this.depths.length === 0) {
            return '';
        }
        return this.depths.join('-');
    }

    clear() {
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    draw() {
        if (!this.format) {
            this.clear();
            // Draw a message if no format selected
            this.ctx.fillStyle = '#000000';
            this.ctx.font = '20px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('Select a key format to begin', this.canvas.width / 2, this.canvas.height / 2);
            return;
        }

        this.clear();
        
        // Calculate scale - use a fixed scale for now to ensure visibility
        const scale = 200; // pixels per inch - this makes things visible
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        const f = this.format;
        
        // Draw format name in top-left
        this.ctx.fillStyle = '#000000';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'top';
        this.ctx.fillText(`${f.manufacturer} ${f.format_name}`, 20, 20);
        
        // Translate to center
        this.ctx.save();
        this.ctx.translate(centerX, centerY);
        
        // Draw the key contour (simplified)
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 3;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        ctx.beginPath();
        
        // Start at the tip
        const tipX = -f.first_pin_inch * scale;
        const tipY = -f.uncut_depth_inch * scale;
        this.ctx.moveTo(tipX, tipY);
        
        // Draw contour through each pin position
        for (let i = 0; i < f.pin_num; i++) {
            const pinX = -(f.first_pin_inch + i * f.pin_increment_inch) * scale;
            const depth = this.depths[i] || f.min_depth_ind;
            const depthOffset = (depth - f.min_depth_ind) * f.depth_step_inch * scale;
            const contourY = -f.uncut_depth_inch * scale + depthOffset;
            
            this.ctx.lineTo(pinX, contourY);
        }
        
        // Draw to the elbow
        const elbowX = -(f.last_pin_inch + f.elbow_inch) * scale;
        const lastDepth = this.depths[f.pin_num - 1] || f.min_depth_ind;
        const lastDepthOffset = (lastDepth - f.min_depth_ind) * f.depth_step_inch * scale;
        const lastContourY = -f.uncut_depth_inch * scale + lastDepthOffset;
        
        this.ctx.lineTo(elbowX, lastContourY);
        this.ctx.lineTo(elbowX, 0);
        
        // Draw the shank
        this.ctx.lineTo(-(f.last_pin_inch + f.elbow_inch + 0.2) * scale, 0);
        
        this.ctx.stroke();
        
        // Draw pin cuts (THICK lines so they're visible)
        for (let i = 0; i < f.pin_num; i++) {
            const pinX = -(f.first_pin_inch + i * f.pin_increment_inch) * scale;
            const depth = this.depths[i] || f.min_depth_ind;
            const depthOffset = (depth - f.min_depth_ind) * f.depth_step_inch * scale;
            const pinY = -f.uncut_depth_inch * scale + depthOffset;
            const pinHalfWidth = (f.pin_width_inch / 2) * scale;
            
            // Draw the pin cut line - MAKE IT THICK AND VISIBLE
            this.ctx.strokeStyle = i === this.selectedPin ? '#ff0000' : '#0000ff';
            this.ctx.lineWidth = 6; // THICK line
            
            this.ctx.beginPath();
            this.ctx.moveTo(pinX - pinHalfWidth, pinY);
            this.ctx.lineTo(pinX + pinHalfWidth, pinY);
            this.ctx.stroke();
            
            // Draw depth number
            this.ctx.fillStyle = '#000000';
            this.ctx.font = 'bold 14px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'bottom';
            this.ctx.fillText(depth.toString(), pinX, pinY - 20);
        }
        
        // Draw selected pin indicator
        if (this.selectedPin >= 0 && this.selectedPin < f.pin_num) {
            const pinX = -(f.first_pin_inch + this.selectedPin * f.pin_increment_inch) * scale;
            const depth = this.depths[this.selectedPin] || f.min_depth_ind;
            const depthOffset = (depth - f.min_depth_ind) * f.depth_step_inch * scale;
            const pinY = -f.uncut_depth_inch * scale + depthOffset;
            
            // Draw a circle around the selected pin
            this.ctx.strokeStyle = '#ff0000';
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.arc(pinX, pinY, 15, 0, Math.PI * 2);
            this.ctx.stroke();
        }
        
        // Draw bottom contour for double-sided keys
        if (this.sides === 2) {
            this.ctx.strokeStyle = '#000000';
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.moveTo(tipX, -tipY);
            
            for (let i = 0; i < f.pin_num; i++) {
                const pinX = -(f.first_pin_inch + i * f.pin_increment_inch) * scale;
                const depth = this.depths[i] || f.min_depth_ind;
                const depthOffset = (depth - f.min_depth_ind) * f.depth_step_inch * scale;
                const contourY = f.uncut_depth_inch * scale - depthOffset;
                
                this.ctx.lineTo(pinX, contourY);
            }
            
            this.ctx.lineTo(elbowX, f.uncut_depth_inch * scale);
            this.ctx.lineTo(elbowX, 0);
            this.ctx.stroke();
            
            // Draw bottom pin cuts
            for (let i = 0; i < f.pin_num; i++) {
                const pinX = -(f.first_pin_inch + i * f.pin_increment_inch) * scale;
                const depth = this.depths[i] || f.min_depth_ind;
                const depthOffset = (depth - f.min_depth_ind) * f.depth_step_inch * scale;
                const pinY = f.uncut_depth_inch * scale - depthOffset;
                const pinHalfWidth = (f.pin_width_inch / 2) * scale;
                
                this.ctx.strokeStyle = i === this.selectedPin ? '#ff0000' : '#0000ff';
                this.ctx.lineWidth = 6;
                
                this.ctx.beginPath();
                this.ctx.moveTo(pinX - pinHalfWidth, pinY);
                this.ctx.lineTo(pinX + pinHalfWidth, pinY);
                this.ctx.stroke();
                
                // Draw depth number
                this.ctx.fillStyle = '#000000';
                this.ctx.font = 'bold 14px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'top';
                this.ctx.fillText(depth.toString(), pinX, pinY + 20);
            }
        }
        
        this.ctx.restore();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = KeyCanvasRenderer;
}

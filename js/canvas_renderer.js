// Canvas Renderer for KeyCopier Web
// Handles drawing key contours, pins, and depth indicators

class KeyCanvasRenderer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.format = null;
        this.depths = [];
        this.selectedPin = 0;
        this.sides = 1;
        this.currentSide = 'top';
        this.scale = 1;
        this.offsetX = 0;
        this.offsetY = 0;
        
        this.init();
    }

    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = 400;
        this.calculateScaleAndOffset();
        this.draw();
    }

    calculateScaleAndOffset() {
        if (!this.format) {
            this.scale = 1;
            this.offsetX = this.canvas.width / 2;
            this.offsetY = this.canvas.height / 2;
            return;
        }

        // Calculate the total width needed in inches
        const totalWidthInches = this.format.last_pin_inch + this.format.elbow_inch + 0.2;
        const totalHeightInches = this.format.uncut_depth_inch * (this.sides === 2 ? 2.5 : 1.5);
        
        // Use most of the canvas width, leave some margin
        const margin = 40;
        const availableWidth = this.canvas.width - 2 * margin;
        const availableHeight = this.canvas.height - 2 * margin;
        
        // Scale based on width (primary)
        this.scale = availableWidth / totalWidthInches;
        
        // Make sure height also fits
        const requiredHeight = totalHeightInches * this.scale;
        if (requiredHeight > availableHeight) {
            this.scale = availableHeight / totalHeightInches;
        }
        
        // Center the drawing
        this.offsetX = this.canvas.width / 2;
        this.offsetY = this.canvas.height / 2;
    }

    toPx(inches) {
        return inches * this.scale;
    }

    setFormat(format) {
        this.format = format;
        this.sides = format.sides || 1;
        this.depths = [];
        
        for (let i = 0; i < format.pin_num; i++) {
            this.depths[i] = format.min_depth_ind;
        }
        
        this.selectedPin = 0;
        this.calculateScaleAndOffset();
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
            return;
        }

        this.clear();
        this.calculateScaleAndOffset();
        
        // Draw the key contour
        this.drawKeyContour();
        
        // Draw the pins
        this.drawPins();
        
        // Draw selected pin indicator
        this.drawSelectedPinIndicator();
        
        // Draw format name
        this.drawFormatName();
    }

    drawKeyContour() {
        const ctx = this.ctx;
        const f = this.format;
        
        // Save context
        ctx.save();
        
        // Translate to center
        ctx.translate(this.offsetX, this.offsetY);
        
        // Draw the key blade contour
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        ctx.beginPath();
        
        // Start at the tip (bow side)
        const tipX = -this.toPx(f.first_pin_inch);
        const tipY = -this.toPx(f.uncut_depth_inch);
        ctx.moveTo(tipX, tipY);
        
        // Draw the top contour line
        for (let i = 0; i < f.pin_num; i++) {
            const pinX = -this.toPx(f.first_pin_inch + i * f.pin_increment_inch);
            const depth = this.depths[i] || f.min_depth_ind;
            const depthOffset = this.toPx((depth - f.min_depth_ind) * f.depth_step_inch);
            const contourY = -this.toPx(f.uncut_depth_inch) + depthOffset;
            
            ctx.lineTo(pinX, contourY);
        }
        
        // Draw to the elbow
        const elbowX = -this.toPx(f.last_pin_inch + f.elbow_inch);
        const lastPinIndex = f.pin_num - 1;
        const lastDepth = this.depths[lastPinIndex] || f.min_depth_ind;
        const lastDepthOffset = this.toPx((lastDepth - f.min_depth_ind) * f.depth_step_inch);
        const lastContourY = -this.toPx(f.uncut_depth_inch) + lastDepthOffset;
        
        ctx.lineTo(elbowX, lastContourY);
        ctx.lineTo(elbowX, 0);
        
        // Draw the level part (shank)
        ctx.lineTo(-this.toPx(f.last_pin_inch + f.elbow_inch + 0.2), 0);
        
        // Close the top contour
        ctx.stroke();
        
        // Draw bottom contour for double-sided keys
        if (this.sides === 2) {
            ctx.beginPath();
            ctx.moveTo(tipX, -tipY);
            
            for (let i = 0; i < f.pin_num; i++) {
                const pinX = -this.toPx(f.first_pin_inch + i * f.pin_increment_inch);
                const depth = this.depths[i] || f.min_depth_ind;
                const depthOffset = this.toPx((depth - f.min_depth_ind) * f.depth_step_inch);
                const contourY = this.toPx(f.uncut_depth_inch) - depthOffset;
                
                ctx.lineTo(pinX, contourY);
            }
            
            ctx.lineTo(elbowX, this.toPx(f.uncut_depth_inch));
            ctx.lineTo(elbowX, 0);
            ctx.stroke();
        }
        
        // Draw stop line if applicable
        if (f.stop === 2) {
            ctx.beginPath();
            ctx.moveTo(elbowX, -this.toPx(f.uncut_depth_inch));
            ctx.lineTo(elbowX, this.sides === 2 ? this.toPx(f.uncut_depth_inch) : 0);
            ctx.stroke();
        }
        
        // Restore context
        ctx.restore();
    }

    drawPins() {
        const ctx = this.ctx;
        const f = this.format;
        
        ctx.save();
        ctx.translate(this.offsetX, this.offsetY);
        
        // Draw pin lines (the cuts)
        for (let i = 0; i < f.pin_num; i++) {
            const pinX = -this.toPx(f.first_pin_inch + i * f.pin_increment_inch);
            const depth = this.depths[i] || f.min_depth_ind;
            const depthOffset = this.toPx((depth - f.min_depth_ind) * f.depth_step_inch);
            
            // Top pin cut
            const topY = -this.toPx(f.uncut_depth_inch) + depthOffset;
            const pinHalfWidth = this.toPx(f.pin_width_inch / 2);
            
            // Draw the pin cut line (horizontal)
            ctx.strokeStyle = i === this.selectedPin ? '#ff0000' : '#0066cc';
            ctx.lineWidth = 4;
            
            ctx.beginPath();
            ctx.moveTo(pinX - pinHalfWidth, topY);
            ctx.lineTo(pinX + pinHalfWidth, topY);
            ctx.stroke();
            
            // Draw vertical center line
            ctx.strokeStyle = '#666666';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(pinX, topY - this.toPx(0.1));
            ctx.lineTo(pinX, topY);
            ctx.stroke();
            
            // Draw depth number above the pin
            ctx.fillStyle = '#000000';
            ctx.font = `${Math.max(10, this.toPx(0.05))}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.fillText(depth.toString(), pinX, topY - this.toPx(0.1));
            
            // Draw bottom pin for double-sided keys
            if (this.sides === 2) {
                const bottomY = this.toPx(f.uncut_depth_inch) - depthOffset;
                
                ctx.strokeStyle = i === this.selectedPin ? '#ff0000' : '#0066cc';
                ctx.lineWidth = 4;
                
                ctx.beginPath();
                ctx.moveTo(pinX - pinHalfWidth, bottomY);
                ctx.lineTo(pinX + pinHalfWidth, bottomY);
                ctx.stroke();
                
                // Draw depth number below the pin
                ctx.fillStyle = '#000000';
                ctx.font = `${Math.max(10, this.toPx(0.05))}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'top';
                ctx.fillText(depth.toString(), pinX, bottomY + this.toPx(0.1));
            }
        }
        
        ctx.restore();
    }

    drawSelectedPinIndicator() {
        const ctx = this.ctx;
        const f = this.format;
        
        if (this.selectedPin >= 0 && this.selectedPin < f.pin_num) {
            ctx.save();
            ctx.translate(this.offsetX, this.offsetY);
            
            const pinX = -this.toPx(f.first_pin_inch + this.selectedPin * f.pin_increment_inch);
            const depth = this.depths[this.selectedPin] || f.min_depth_ind;
            const depthOffset = this.toPx((depth - f.min_depth_ind) * f.depth_step_inch);
            const topY = -this.toPx(f.uncut_depth_inch) + depthOffset;
            
            // Draw arrow above the selected pin
            ctx.fillStyle = '#ff0000';
            ctx.beginPath();
            ctx.moveTo(pinX, topY - this.toPx(0.2));
            ctx.lineTo(pinX - this.toPx(0.05), topY - this.toPx(0.1));
            ctx.lineTo(pinX + this.toPx(0.05), topY - this.toPx(0.1));
            ctx.closePath();
            ctx.fill();
            
            ctx.restore();
        }
    }

    drawFormatName() {
        const ctx = this.ctx;
        if (this.format) {
            ctx.fillStyle = '#000000';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText(`${this.format.manufacturer} ${this.format.format_name}`, 20, 20);
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = KeyCanvasRenderer;
}

// Canvas Renderer for KeyCopier Web
// Handles drawing key contours, pins, and depth indicators

class KeyCanvasRenderer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.format = null;
        this.depths = [];
        this.selectedPin = 0;
        this.sides = 1; // 1 or 2 for double-sided keys
        this.currentSide = 'top'; // 'top' or 'bottom'
        this.pixelsPerInch = 100; // Scale factor for drawing
        this.margin = 40; // Margin around the drawing
        
        this.init();
    }

    init() {
        // Set canvas dimensions
        this.resize();
        
        // Add resize listener
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = 400;
        this.draw();
    }

    setFormat(format) {
        this.format = format;
        this.sides = format.sides || 1;
        this.depths = [];
        
        // Initialize depths to minimum
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
                // Check MACS (Maximum Adjacent Cut Specification)
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
                // Check MACS (Maximum Adjacent Cut Specification)
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
        
        // For double-sided keys, we need to handle both sides
        // For now, just return the top side
        return this.depths.map(d => d).join('-');
    }

    // Convert inches to pixels
    toPx(inches) {
        return inches * this.pixelsPerInch;
    }

    draw() {
        if (!this.format) {
            this.clear();
            return;
        }

        this.clear();
        
        // Calculate scale and offset
        const totalWidthInches = this.format.last_pin_inch + this.format.elbow_inch;
        const totalHeightInches = this.format.uncut_depth_inch * (this.sides === 2 ? 2 : 1);
        
        const scaleX = (this.canvas.width - 2 * this.margin) / this.toPx(totalWidthInches);
        const scaleY = (this.canvas.height - 2 * this.margin) / this.toPx(totalHeightInches);
        const scale = Math.min(scaleX, scaleY);
        
        const offsetX = this.canvas.width / 2;
        const offsetY = this.canvas.height / 2;
        
        // Draw key contour
        this.drawKeyContour(scale, offsetX, offsetY);
        
        // Draw pins
        this.drawPins(scale, offsetX, offsetY);
        
        // Draw selected pin indicator
        this.drawSelectedPinIndicator(scale, offsetX, offsetY);
        
        // Draw format name
        this.drawFormatName();
    }

    clear() {
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawKeyContour(scale, offsetX, offsetY) {
        const ctx = this.ctx;
        const format = this.format;
        
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 2 * scale;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Calculate key contour points
        const points = [];
        
        // Start at the tip
        const tipX = this.toPx(format.first_pin_inch) * scale;
        const tipY = this.toPx(format.uncut_depth_inch) * scale;
        
        // Top contour
        let currentX = -tipX;
        let currentY = -tipY;
        
        // Draw top contour
        ctx.beginPath();
        
        // Start at the tip
        ctx.moveTo(offsetX + currentX, offsetY + currentY);
        
        // Draw to the first pin position
        const firstPinX = this.toPx(format.first_pin_inch) * scale;
        ctx.lineTo(offsetX - firstPinX, offsetY - tipY);
        
        // Draw contour through each pin
        for (let i = 0; i < format.pin_num; i++) {
            const pinX = this.toPx(format.first_pin_inch + i * format.pin_increment_inch) * scale;
            const depth = this.depths[i] || format.min_depth_ind;
            const depthOffset = this.toPx((depth - format.min_depth_ind) * format.depth_step_inch) * scale;
            
            // Calculate the contour point
            const contourY = -this.toPx(format.uncut_depth_inch) * scale + depthOffset;
            
            ctx.lineTo(offsetX - pinX, offsetY + contourY);
        }
        
        // Draw to the elbow
        const elbowX = this.toPx(format.last_pin_inch + format.elbow_inch) * scale;
        const lastPinX = this.toPx(format.last_pin_inch) * scale;
        const lastDepth = this.depths[format.pin_num - 1] || format.min_depth_ind;
        const lastDepthOffset = this.toPx((lastDepth - format.min_depth_ind) * format.depth_step_inch) * scale;
        const lastContourY = -this.toPx(format.uncut_depth_inch) * scale + lastDepthOffset;
        
        ctx.lineTo(offsetX - elbowX, offsetY + lastContourY);
        
        // Draw the elbow line
        ctx.lineTo(offsetX - elbowX, offsetY);
        
        // Draw the level contour
        ctx.lineTo(offsetX - this.toPx(format.last_pin_inch + format.elbow_inch) * scale, offsetY);
        
        // Close the top contour
        ctx.stroke();

        // Draw bottom contour for double-sided keys
        if (this.sides === 2) {
            ctx.beginPath();
            
            // Start at the tip for bottom
            const bottomTipY = this.toPx(format.uncut_depth_inch) * scale;
            ctx.moveTo(offsetX - tipX, offsetY + bottomTipY);
            
            // Draw to the first pin position
            ctx.lineTo(offsetX - firstPinX, offsetY + bottomTipY);
            
            // Draw contour through each pin for bottom
            for (let i = 0; i < format.pin_num; i++) {
                const pinX = this.toPx(format.first_pin_inch + i * format.pin_increment_inch) * scale;
                const depth = this.depths[i] || format.min_depth_ind;
                const depthOffset = this.toPx((depth - format.min_depth_ind) * format.depth_step_inch) * scale;
                
                // For bottom side, we invert the depth
                const contourY = this.toPx(format.uncut_depth_inch) * scale - depthOffset;
                
                ctx.lineTo(offsetX - pinX, offsetY + contourY);
            }
            
            // Draw to the elbow
            ctx.lineTo(offsetX - elbowX, offsetY + bottomTipY);
            
            // Draw the elbow line
            ctx.lineTo(offsetX - elbowX, offsetY);
            
            ctx.stroke();
        }

        // Draw stop line if applicable
        if (format.stop === 2) {
            ctx.beginPath();
            ctx.moveTo(offsetX - this.toPx(format.last_pin_inch + format.elbow_inch) * scale, offsetY - this.toPx(format.uncut_depth_inch) * scale);
            ctx.lineTo(offsetX - this.toPx(format.last_pin_inch + format.elbow_inch) * scale, offsetY + (this.sides === 2 ? this.toPx(format.uncut_depth_inch) * scale : 0));
            ctx.stroke();
        }
    }

    drawPins(scale, offsetX, offsetY) {
        const ctx = this.ctx;
        const format = this.format;
        
        // Draw pin lines
        for (let i = 0; i < format.pin_num; i++) {
            const pinX = this.toPx(format.first_pin_inch + i * format.pin_increment_inch) * scale;
            const depth = this.depths[i] || format.min_depth_ind;
            const depthOffset = this.toPx((depth - format.min_depth_ind) * format.depth_step_inch) * scale;
            
            // Top pin
            const topY = -this.toPx(format.uncut_depth_inch) * scale + depthOffset;
            const pinHalfWidth = this.toPx(format.pin_width_inch / 2) * scale;
            
            ctx.strokeStyle = i === this.selectedPin ? '#ff0000' : '#0066cc';
            ctx.lineWidth = 3 * scale;
            
            ctx.beginPath();
            ctx.moveTo(offsetX - pinX - pinHalfWidth, offsetY + topY);
            ctx.lineTo(offsetX - pinX + pinHalfWidth, offsetY + topY);
            ctx.stroke();
            
            // Draw vertical line to indicate pin center
            ctx.strokeStyle = '#666666';
            ctx.lineWidth = 1 * scale;
            ctx.beginPath();
            ctx.moveTo(offsetX - pinX, offsetY + topY - 10 * scale);
            ctx.lineTo(offsetX - pinX, offsetY + topY);
            ctx.stroke();
            
            // Draw depth number
            ctx.fillStyle = '#333333';
            ctx.font = `${12 * scale}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.fillText(depth.toString(), offsetX - pinX, offsetY + topY - 15 * scale);
            
            // Bottom pin for double-sided keys
            if (this.sides === 2) {
                const bottomY = this.toPx(format.uncut_depth_inch) * scale - depthOffset;
                
                ctx.strokeStyle = i === this.selectedPin ? '#ff0000' : '#0066cc';
                ctx.lineWidth = 3 * scale;
                
                ctx.beginPath();
                ctx.moveTo(offsetX - pinX - pinHalfWidth, offsetY + bottomY);
                ctx.lineTo(offsetX - pinX + pinHalfWidth, offsetY + bottomY);
                ctx.stroke();
                
                // Draw depth number for bottom
                ctx.fillStyle = '#333333';
                ctx.font = `${12 * scale}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'top';
                ctx.fillText(depth.toString(), offsetX - pinX, offsetY + bottomY + 15 * scale);
            }
        }
    }

    drawSelectedPinIndicator(scale, offsetX, offsetY) {
        const ctx = this.ctx;
        const format = this.format;
        
        if (this.selectedPin >= 0 && this.selectedPin < format.pin_num) {
            const pinX = this.toPx(format.first_pin_inch + this.selectedPin * format.pin_increment_inch) * scale;
            const depth = this.depths[this.selectedPin] || format.min_depth_ind;
            const depthOffset = this.toPx((depth - format.min_depth_ind) * format.depth_step_inch) * scale;
            const topY = -this.toPx(format.uncut_depth_inch) * scale + depthOffset;
            
            // Draw arrow above the selected pin
            ctx.fillStyle = '#ff0000';
            ctx.beginPath();
            ctx.moveTo(offsetX - pinX, offsetY + topY - 30 * scale);
            ctx.lineTo(offsetX - pinX - 10 * scale, offsetY + topY - 15 * scale);
            ctx.lineTo(offsetX - pinX + 10 * scale, offsetY + topY - 15 * scale);
            ctx.closePath();
            ctx.fill();
        }
    }

    drawFormatName() {
        const ctx = this.ctx;
        if (this.format) {
            ctx.fillStyle = '#333333';
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

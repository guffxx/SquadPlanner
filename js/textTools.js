export class TextTools {
    constructor(canvas, ctx, mapManager) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.mapManager = mapManager;
        this.texts = [];
        this.currentText = '';
        this.currentColor = '#ff0000';
        this.fontSize = 26;
        this.isPlacingText = false;

        this.setupEventListeners();
    }

    setupEventListeners() {
        // Text color picker
        document.getElementById('textColorPicker').addEventListener('input', (e) => {
            this.currentColor = e.target.value;
        });

        // Quick color buttons for text
        document.querySelectorAll('.text-tools .quick-color-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.currentColor = btn.dataset.color;
                document.getElementById('textColorPicker').value = btn.dataset.color;
            });
        });

        // Text size slider
        document.getElementById('textSize').addEventListener('input', (e) => {
            this.fontSize = parseInt(e.target.value);
            document.querySelector('.text-size-value').textContent = `${this.fontSize}px`;
        });

        // Text input field
        const textInput = document.getElementById('annotationText');
        textInput.addEventListener('input', (e) => {
            this.currentText = e.target.value;
            this.updateAddTextButtonState();
        });

        // Add text button
        const addTextBtn = document.getElementById('addTextBtn');
        addTextBtn.addEventListener('click', () => {
            if (this.currentText.trim()) {
                this.isPlacingText = true;
                this.canvas.style.cursor = 'crosshair';
            }
        });

        // Delete last text button
        document.getElementById('deleteTextBtn').addEventListener('click', () => {
            this.deleteLastText();
        });

        // Canvas click event for placing text
        this.canvas.addEventListener('click', this.handleCanvasClick.bind(this));
    }

    updateAddTextButtonState() {
        const addTextBtn = document.getElementById('addTextBtn');
        if (this.currentText.trim()) {
            addTextBtn.classList.add('has-text');
        } else {
            addTextBtn.classList.remove('has-text');
        }
    }

    handleCanvasClick(e) {
        if (!this.isPlacingText || !this.currentText.trim() || !this.mapManager.currentMap) return;

        const rect = this.canvas.getBoundingClientRect();
        const pos = {
            x: (e.clientX - rect.left - this.mapManager.offset.x) / this.mapManager.scale,
            y: (e.clientY - rect.top - this.mapManager.offset.y) / this.mapManager.scale
        };

        this.texts.push({
            text: this.currentText,
            position: pos,
            color: this.currentColor,
            size: this.fontSize
        });

        // Reset state
        this.isPlacingText = false;
        this.canvas.style.cursor = 'default';
        document.getElementById('annotationText').value = '';
        this.currentText = '';
        this.updateAddTextButtonState();

        // Redraw
        this.mapManager.draw();
        this.drawAllTexts();
    }

    drawAllTexts() {
        this.texts.forEach(text => this.drawText(text));
    }

    drawText(textObj) {
        this.ctx.save();
        this.ctx.translate(this.mapManager.offset.x, this.mapManager.offset.y);
        this.ctx.scale(this.mapManager.scale, this.mapManager.scale);

        // Text shadow for better visibility
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        this.ctx.shadowBlur = 4;
        this.ctx.shadowOffsetX = 2;
        this.ctx.shadowOffsetY = 2;

        // Text settings
        this.ctx.font = `${textObj.size}px Arial`;
        this.ctx.fillStyle = textObj.color;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        // Draw text
        this.ctx.fillText(textObj.text, textObj.position.x, textObj.position.y);

        this.ctx.restore();
    }

    deleteLastText() {
        if (this.texts.length > 0) {
            this.texts.pop();
            this.mapManager.draw();
            this.drawAllTexts();
        }
    }

    clearTexts() {
        this.texts = [];
        this.mapManager.draw();
    }

    // Method to cancel text placement
    cancelTextPlacement() {
        this.isPlacingText = false;
        this.canvas.style.cursor = 'default';
        document.getElementById('annotationText').value = '';
        this.currentText = '';
        this.updateAddTextButtonState();
    }
} 
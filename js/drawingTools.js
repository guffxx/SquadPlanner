export class DrawingTools {
    constructor(canvas, ctx, mapManager) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.mapManager = mapManager;
        this.isDrawing = false;
        this.startPoint = null;
        this.lines = [];
        this.currentLineType = 'arrow'; // 'arrow', 'x', 'plain'
        this.currentColor = '#ff0000';
        this.currentWidth = 5;

        this.setupEventListeners();
    }

    setupEventListeners() {
        // Line type buttons
        document.getElementById('arrowLineBtn').addEventListener('click', () => this.setLineType('arrow'));
        document.getElementById('xLineBtn').addEventListener('click', () => this.setLineType('x'));
        document.getElementById('plainLineBtn').addEventListener('click', () => this.setLineType('plain'));

        // Color picker
        document.getElementById('lineColorPicker').addEventListener('input', (e) => {
            this.currentColor = e.target.value;
        });

        // Quick color buttons
        document.querySelectorAll('.drawing-tools .quick-color-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.currentColor = btn.dataset.color;
                document.getElementById('lineColorPicker').value = btn.dataset.color;
            });
        });

        // Line width slider
        document.getElementById('lineWidth').addEventListener('input', (e) => {
            this.currentWidth = parseInt(e.target.value);
            document.querySelector('.drawing-tools .width-value').textContent = `${this.currentWidth}px`;
        });

        // Delete last line button
        document.getElementById('deleteLineBtn').addEventListener('click', () => this.deleteLastLine());

        // Canvas drawing events
        this.canvas.addEventListener('mousedown', this.startDrawing.bind(this));
        this.canvas.addEventListener('mousemove', this.draw.bind(this));
        this.canvas.addEventListener('mouseup', this.endDrawing.bind(this));
        this.canvas.addEventListener('mouseleave', this.endDrawing.bind(this));
    }

    setLineType(type) {
        this.currentLineType = type;
        document.querySelectorAll('.line-type-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.getElementById(`${type}LineBtn`).classList.add('active');
    }

    startDrawing(e) {
        if (!this.mapManager.currentMap) return;

        this.isDrawing = true;
        const rect = this.canvas.getBoundingClientRect();
        this.startPoint = {
            x: (e.clientX - rect.left - this.mapManager.offset.x) / this.mapManager.scale,
            y: (e.clientY - rect.top - this.mapManager.offset.y) / this.mapManager.scale
        };
    }

    draw(e) {
        if (!this.isDrawing || !this.startPoint) return;

        const rect = this.canvas.getBoundingClientRect();
        const currentPoint = {
            x: (e.clientX - rect.left - this.mapManager.offset.x) / this.mapManager.scale,
            y: (e.clientY - rect.top - this.mapManager.offset.y) / this.mapManager.scale
        };

        this.mapManager.draw();
        this.drawAllLines();
        this.drawCurrentLine(this.startPoint, currentPoint);
    }

    endDrawing(e) {
        if (!this.isDrawing || !this.startPoint) return;

        const rect = this.canvas.getBoundingClientRect();
        const endPoint = {
            x: (e.clientX - rect.left - this.mapManager.offset.x) / this.mapManager.scale,
            y: (e.clientY - rect.top - this.mapManager.offset.y) / this.mapManager.scale
        };

        this.lines.push({
            start: { ...this.startPoint },
            end: { ...endPoint },
            type: this.currentLineType,
            color: this.currentColor,
            width: this.currentWidth
        });

        this.isDrawing = false;
        this.startPoint = null;
        this.mapManager.draw();
        this.drawAllLines();
    }

    drawAllLines() {
        this.lines.forEach(line => {
            this.drawLine(line.start, line.end, line.type, line.color, line.width);
        });
    }

    drawCurrentLine(start, end) {
        this.drawLine(start, end, this.currentLineType, this.currentColor, this.currentWidth);
    }

    drawLine(start, end, type, color, width) {
        const ctx = this.ctx;
        ctx.save();
        ctx.translate(this.mapManager.offset.x, this.mapManager.offset.y);
        ctx.scale(this.mapManager.scale, this.mapManager.scale);

        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();

        // Draw line endings based on type
        if (type === 'arrow') {
            this.drawArrowhead(end, start, width);
        } else if (type === 'x') {
            this.drawX(end, width);
        }

        ctx.restore();
    }

    drawArrowhead(end, start, width) {
        const headLength = width * 4;
        const angle = Math.atan2(end.y - start.y, end.x - start.x);
        
        this.ctx.beginPath();
        this.ctx.moveTo(end.x, end.y);
        this.ctx.lineTo(
            end.x - headLength * Math.cos(angle - Math.PI / 6),
            end.y - headLength * Math.sin(angle - Math.PI / 6)
        );
        this.ctx.moveTo(end.x, end.y);
        this.ctx.lineTo(
            end.x - headLength * Math.cos(angle + Math.PI / 6),
            end.y - headLength * Math.sin(angle + Math.PI / 6)
        );
        this.ctx.stroke();
    }

    drawX(point, width) {
        const size = width * 2;
        this.ctx.beginPath();
        this.ctx.moveTo(point.x - size, point.y - size);
        this.ctx.lineTo(point.x + size, point.y + size);
        this.ctx.moveTo(point.x + size, point.y - size);
        this.ctx.lineTo(point.x - size, point.y + size);
        this.ctx.stroke();
    }

    deleteLastLine() {
        if (this.lines.length > 0) {
            this.lines.pop();
            this.mapManager.draw();
            this.drawAllLines();
        }
    }

    clearLines() {
        this.lines = [];
        this.mapManager.draw();
    }
} 
export class EraserTools {
    constructor(canvas, ctx, mapManager) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.mapManager = mapManager;
        this.isErasing = false;
        this.eraserSize = 40;
        this.eraserCursor = this.createEraserCursor();
        
        this.setupEventListeners();
    }

    createEraserCursor() {
        const cursor = document.createElement('div');
        cursor.className = 'eraser-cursor';
        document.body.appendChild(cursor);
        return cursor;
    }

    setupEventListeners() {
        // Eraser toggle button
        const eraserBtn = document.getElementById('eraserBtn');
        eraserBtn.addEventListener('click', () => this.toggleEraser());

        // Clear all button
        const clearAllBtn = document.getElementById('clearAll');
        clearAllBtn.addEventListener('click', () => this.clearAll());

        // Canvas eraser events
        this.canvas.addEventListener('mousedown', this.startErasing.bind(this));
        this.canvas.addEventListener('mousemove', this.erase.bind(this));
        this.canvas.addEventListener('mouseup', this.stopErasing.bind(this));
        this.canvas.addEventListener('mouseleave', this.stopErasing.bind(this));

        // Track cursor movement for eraser circle
        document.addEventListener('mousemove', this.updateEraserCursor.bind(this));
    }

    toggleEraser() {
        const eraserBtn = document.getElementById('eraserBtn');
        eraserBtn.classList.toggle('active');
        
        if (eraserBtn.classList.contains('active')) {
            this.canvas.style.cursor = 'none';
            this.eraserCursor.style.display = 'block';
        } else {
            this.canvas.style.cursor = 'default';
            this.eraserCursor.style.display = 'none';
            this.isErasing = false;
        }
    }

    updateEraserCursor(e) {
        if (!document.getElementById('eraserBtn').classList.contains('active')) return;

        this.eraserCursor.style.left = `${e.clientX - this.eraserSize / 2}px`;
        this.eraserCursor.style.top = `${e.clientY - this.eraserSize / 2}px`;
        this.eraserCursor.style.width = `${this.eraserSize}px`;
        this.eraserCursor.style.height = `${this.eraserSize}px`;
    }

    startErasing(e) {
        if (!document.getElementById('eraserBtn').classList.contains('active')) return;
        this.isErasing = true;
        this.erase(e);
    }

    erase(e) {
        if (!this.isErasing) return;

        const rect = this.canvas.getBoundingClientRect();
        const pos = {
            x: (e.clientX - rect.left - this.mapManager.offset.x) / this.mapManager.scale,
            y: (e.clientY - rect.top - this.mapManager.offset.y) / this.mapManager.scale
        };

        // Check each tool's elements for intersection with eraser
        this.eraseLines(pos);
        this.eraseMarkers(pos);
        this.eraseTexts(pos);
    }

    eraseLines(pos) {
        const drawingTools = this.mapManager.drawingTools;
        if (!drawingTools) return;

        drawingTools.lines = drawingTools.lines.filter(line => {
            const distance = this.getDistanceToLine(
                pos,
                {x: line.start.x, y: line.start.y},
                {x: line.end.x, y: line.end.y}
            );
            return distance > this.eraserSize / (2 * this.mapManager.scale);
        });
    }

    eraseMarkers(pos) {
        const markerTools = this.mapManager.markerTools;
        if (!markerTools) return;

        markerTools.markers = markerTools.markers.filter(marker => {
            const distance = Math.hypot(
                pos.x - marker.position.x,
                pos.y - marker.position.y
            );
            return distance > (this.eraserSize + marker.size) / (2 * this.mapManager.scale);
        });
    }

    eraseTexts(pos) {
        const textTools = this.mapManager.textTools;
        if (!textTools) return;

        textTools.texts = textTools.texts.filter(text => {
            const distance = Math.hypot(
                pos.x - text.position.x,
                pos.y - text.position.y
            );
            return distance > (this.eraserSize + text.size) / (2 * this.mapManager.scale);
        });
    }

    getDistanceToLine(point, lineStart, lineEnd) {
        const A = point.x - lineStart.x;
        const B = point.y - lineStart.y;
        const C = lineEnd.x - lineStart.x;
        const D = lineEnd.y - lineStart.y;

        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = -1;

        if (lenSq !== 0) {
            param = dot / lenSq;
        }

        let xx, yy;

        if (param < 0) {
            xx = lineStart.x;
            yy = lineStart.y;
        } else if (param > 1) {
            xx = lineEnd.x;
            yy = lineEnd.y;
        } else {
            xx = lineStart.x + param * C;
            yy = lineStart.y + param * D;
        }

        const dx = point.x - xx;
        const dy = point.y - yy;

        return Math.sqrt(dx * dx + dy * dy);
    }

    stopErasing() {
        this.isErasing = false;
    }

    clearAll() {
        // Clear all drawings
        if (this.mapManager.drawingTools) {
            this.mapManager.drawingTools.clearLines();
        }
        
        // Clear all markers
        if (this.mapManager.markerTools) {
            this.mapManager.markerTools.clearMarkers();
        }
        
        // Clear all texts
        if (this.mapManager.textTools) {
            this.mapManager.textTools.clearTexts();
        }

        // Redraw the map
        this.mapManager.draw();
    }
} 
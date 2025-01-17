export class MapManager {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.currentMap = null;
        this.scale = 1;
        this.offset = { x: 0, y: 0 };
        this.isDragging = false;
        this.lastPos = { x: 0, y: 0 };

        // Tool references
        this.drawingTools = null;
        this.markerTools = null;
        this.textTools = null;
        this.eraserTools = null;

        this.setupEventListeners();
        this.setupLoadingIndicator();
    }

    // Add tool references
    setTools(drawingTools, markerTools, textTools, eraserTools) {
        this.drawingTools = drawingTools;
        this.markerTools = markerTools;
        this.textTools = textTools;
        this.eraserTools = eraserTools;
    }

    setupLoadingIndicator() {
        this.loadingIndicator = document.querySelector('.loading-indicator');
        this.errorMessage = document.querySelector('.error-message');
        this.placeholderText = document.querySelector('.placeholder-text');
    }

    setupEventListeners() {
        this.canvas.addEventListener('wheel', this.handleZoom.bind(this));
        this.canvas.addEventListener('mousedown', this.startDrag.bind(this));
        this.canvas.addEventListener('mousemove', this.drag.bind(this));
        this.canvas.addEventListener('mouseup', this.endDrag.bind(this));
        this.canvas.addEventListener('mouseleave', this.endDrag.bind(this));
    }

    async preloadMaps() {
        const preloadContainer = document.getElementById('preloadContainer');
        const loadedMaps = new Map();

        for (const map of mapData) {
            try {
                const img = new Image();
                await new Promise((resolve, reject) => {
                    img.onload = () => {
                        loadedMaps.set(map.id, img);
                        resolve();
                    };
                    img.onerror = () => reject(new Error(`Failed to preload map: ${map.id}`));
                    img.src = map.url;
                });
                
                // Add to preload container to keep in memory
                img.style.display = 'none';
                preloadContainer.appendChild(img);
            } catch (error) {
                console.error(error);
            }
        }

        return loadedMaps;
    }

    async loadMap(url, mapId) {
        this.showLoading();
        try {
            let img;
            if (this.preloadedMaps && this.preloadedMaps.has(mapId)) {
                img = this.preloadedMaps.get(mapId);
            } else {
                img = new Image();
                await new Promise((resolve, reject) => {
                    img.onload = resolve;
                    img.onerror = () => reject(new Error(`Failed to load map: ${url}`));
                    img.src = url;
                });
            }

            this.currentMap = img;
            this.resetView();
            this.hidePlaceholder();
            this.hideError();
        } catch (error) {
            console.error(error);
            this.showError();
            this.currentMap = null;
        } finally {
            this.hideLoading();
        }
    }

    async loadCustomMap(file) {
        this.showLoading();
        try {
            const url = URL.createObjectURL(file);
            await this.loadMap(url);
            URL.revokeObjectURL(url);
        } catch (error) {
            this.showError();
        }
    }

    resetView() {
        if (!this.currentMap) return;
        
        const containerRect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = containerRect.width;
        this.canvas.height = containerRect.height;

        this.scale = Math.min(
            this.canvas.width / this.currentMap.width,
            this.canvas.height / this.currentMap.height
        );

        this.offset.x = (this.canvas.width - this.currentMap.width * this.scale) / 2;
        this.offset.y = (this.canvas.height - this.currentMap.height * this.scale) / 2;

        this.draw();
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (this.currentMap) {
            this.ctx.save();
            this.ctx.translate(this.offset.x, this.offset.y);
            this.ctx.scale(this.scale, this.scale);
            this.ctx.drawImage(this.currentMap, 0, 0);
            this.ctx.restore();

            // Draw all tool elements
            this.drawAllToolElements();
        }
    }

    drawAllToolElements() {
        // Draw lines
        if (this.drawingTools) {
            this.drawingTools.drawAllLines();
        }

        // Draw markers
        if (this.markerTools) {
            this.markerTools.drawAllMarkers();
        }

        // Draw texts
        if (this.textTools) {
            this.textTools.drawAllTexts();
        }
    }

    // UI State Management
    showLoading() {
        this.loadingIndicator.style.display = 'flex';
    }

    hideLoading() {
        this.loadingIndicator.style.display = 'none';
    }

    showError() {
        this.errorMessage.style.display = 'block';
        this.errorMessage.textContent = 'Failed to load map. Please try another or check if the map file exists.';
        setTimeout(() => {
            this.errorMessage.style.display = 'none';
        }, 3000);
    }

    hideError() {
        this.errorMessage.style.display = 'none';
    }

    hidePlaceholder() {
        this.placeholderText.style.display = 'none';
    }

    // Event Handlers
    handleZoom(e) {
        e.preventDefault();
        const zoom = e.deltaY > 0 ? 0.9 : 1.1;
        const mouseX = e.offsetX - this.offset.x;
        const mouseY = e.offsetY - this.offset.y;

        this.scale *= zoom;
        this.offset.x = e.offsetX - mouseX * zoom;
        this.offset.y = e.offsetY - mouseY * zoom;

        this.draw();
    }

    startDrag(e) {
        this.isDragging = true;
        this.lastPos = { x: e.clientX, y: e.clientY };
    }

    drag(e) {
        if (!this.isDragging) return;

        const deltaX = e.clientX - this.lastPos.x;
        const deltaY = e.clientY - this.lastPos.y;

        this.offset.x += deltaX;
        this.offset.y += deltaY;

        this.lastPos = { x: e.clientX, y: e.clientY };
        this.draw();
    }

    endDrag() {
        this.isDragging = false;
    }

    downloadMap() {
        if (!this.currentMap) return;

        const link = document.createElement('a');
        link.download = 'squad-map-plan.png';
        link.href = this.canvas.toDataURL();
        link.click();
    }

    recenterMap() {
        if (!this.currentMap) return;
        this.resetView();
    }
} 
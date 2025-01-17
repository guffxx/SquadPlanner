export class MarkerTools {
    constructor(canvas, ctx, mapManager) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.mapManager = mapManager;
        this.markers = [];
        this.currentMarker = null;
        this.currentColor = '#ff0000';
        this.markerSize = 48;
        this.customIcons = new Map(); // Store custom uploaded icons

        this.setupEventListeners();
        this.preloadIcons();
    }

    async preloadIcons() {
        const iconNames = [
            'heli', 'lav', 'logi', 'matv', 'tank', 'apc', 'ifv', 'mortar',
            'radio', 'rep', 'RALLY', 'hab', 'TOW', 'HAT', 'MG', 'HMG'
        ];

        for (const name of iconNames) {
            const img = new Image();
            img.src = `assets/icons/${name.toLowerCase()}.png`;
            await new Promise((resolve) => {
                img.onload = resolve;
            });
            this.customIcons.set(name, img);
        }
    }

    setupEventListeners() {
        // Marker color picker
        document.getElementById('markerColorPicker').addEventListener('input', (e) => {
            this.currentColor = e.target.value;
        });

        // Quick color buttons for markers
        document.querySelectorAll('.icon-tools .quick-color-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.currentColor = btn.dataset.color;
                document.getElementById('markerColorPicker').value = btn.dataset.color;
            });
        });

        // Marker size slider
        document.getElementById('markerSize').addEventListener('input', (e) => {
            this.markerSize = parseInt(e.target.value);
            document.querySelector('.marker-size-value').textContent = `${this.markerSize}px`;
        });

        // Marker type buttons
        const markerTypes = [
            'heli', 'lav', 'logi', 'matv', 'tank', 'apc', 'ifv', 'mortar',
            'radio', 'repStation', 'rally', 'hab', 'tow', 'hat', 'mg', 'hmg'
        ];

        markerTypes.forEach(type => {
            const btn = document.getElementById(`${type}MarkerBtn`);
            if (btn) {
                btn.addEventListener('click', () => this.setCurrentMarker(type));
            }
        });

        // Delete last marker button
        document.getElementById('deleteMarkerBtn').addEventListener('click', () => this.deleteLastMarker());

        // Custom icon upload
        document.getElementById('uploadIconBtn').addEventListener('click', () => {
            document.getElementById('customIconUpload').click();
        });

        document.getElementById('customIconUpload').addEventListener('change', (e) => {
            this.handleCustomIconUpload(e.target.files[0]);
        });

        // Canvas click event for placing markers
        this.canvas.addEventListener('click', this.placeMarker.bind(this));
    }

    async handleCustomIconUpload(file) {
        if (!file) return;

        try {
            const img = new Image();
            const url = URL.createObjectURL(file);
            
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
                img.src = url;
            });

            const iconId = `custom-${Date.now()}`;
            this.customIcons.set(iconId, img);
            this.addCustomIconToGrid(iconId, url);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error loading custom icon:', error);
        }
    }

    addCustomIconToGrid(iconId, url) {
        const grid = document.getElementById('customIconsGrid');
        const btn = document.createElement('button');
        btn.className = 'icon-btn custom-icon-btn';
        
        const img = document.createElement('img');
        img.src = url;
        img.alt = 'Custom Icon';
        img.className = 'marker-icon';
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-custom-icon';
        deleteBtn.textContent = '×';
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            this.customIcons.delete(iconId);
            btn.remove();
        };

        btn.appendChild(img);
        btn.appendChild(deleteBtn);
        btn.onclick = () => this.setCurrentMarker(iconId);
        grid.appendChild(btn);
    }

    setCurrentMarker(type) {
        this.currentMarker = type;
        document.querySelectorAll('.icon-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.getElementById(`${type}MarkerBtn`)?.classList.add('active');
    }

    placeMarker(e) {
        if (!this.mapManager.currentMap || !this.currentMarker) return;

        const rect = this.canvas.getBoundingClientRect();
        const pos = {
            x: (e.clientX - rect.left - this.mapManager.offset.x) / this.mapManager.scale,
            y: (e.clientY - rect.top - this.mapManager.offset.y) / this.mapManager.scale
        };

        this.markers.push({
            type: this.currentMarker,
            position: pos,
            color: this.currentColor,
            size: this.markerSize
        });

        this.mapManager.draw();
        this.drawAllMarkers();
    }

    drawAllMarkers() {
        this.markers.forEach(marker => this.drawMarker(marker));
    }

    drawMarker(marker) {
        const icon = this.customIcons.get(marker.type);
        if (!icon) return;

        this.ctx.save();
        this.ctx.translate(this.mapManager.offset.x, this.mapManager.offset.y);
        this.ctx.scale(this.mapManager.scale, this.mapManager.scale);

        // Apply color tint
        this.ctx.globalCompositeOperation = 'source-over';
        this.ctx.drawImage(
            icon,
            marker.position.x - marker.size / 2,
            marker.position.y - marker.size / 2,
            marker.size,
            marker.size
        );

        // Apply color overlay
        this.ctx.globalCompositeOperation = 'source-atop';
        this.ctx.fillStyle = marker.color;
        this.ctx.fillRect(
            marker.position.x - marker.size / 2,
            marker.position.y - marker.size / 2,
            marker.size,
            marker.size
        );

        this.ctx.restore();
    }

    deleteLastMarker() {
        if (this.markers.length > 0) {
            this.markers.pop();
            this.mapManager.draw();
            this.drawAllMarkers();
        }
    }

    clearMarkers() {
        this.markers = [];
        this.mapManager.draw();
    }
} 
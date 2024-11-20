document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const canvas = document.getElementById('mapCanvas');
    const ctx = canvas.getContext('2d');

    // Initial canvas setup
    canvas.width = 400;
    canvas.height = 100;

    // State management
    const state = {
        drawing: {
            isActive: false,
            data: []
        },
        map: {
            current: null,
            offset: { x: 0, y: 0 }
        },
        pan: {
            isActive: false,
            lastPoint: { x: 0, y: 0 }
        },
        markers: {
            isPlacing: false,
            list: [],
            selected: null
        }
    };

    // Drawing utilities
    const drawUtils = {
        getMousePos(e) {
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            
            return {
                x: (e.clientX - rect.left) * scaleX - state.map.offset.x,
                y: (e.clientY - rect.top) * scaleY - state.map.offset.y
            };
        },

        redrawCanvas() {
            if (!state.map.current) return;

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.save();
            ctx.translate(state.map.offset.x, state.map.offset.y);
            ctx.drawImage(state.map.current, 0, 0, canvas.width, canvas.height);
            this.drawStoredLines();
            this.drawMarkers();
            ctx.restore();
        },

        drawStoredLines() {
            state.drawing.data.forEach(point => {
                if (point.type === 'start') {
                    ctx.beginPath();
                    ctx.moveTo(point.x, point.y);
                    ctx.strokeStyle = point.color;
                    ctx.lineWidth = 3;
                    ctx.lineCap = 'round';
                } else if (point.type === 'draw') {
                    ctx.lineTo(point.x, point.y);
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.moveTo(point.x, point.y);
                }
            });
        },

        drawMarkers() {
            state.markers.list.forEach(marker => {
                const img = new Image();
                img.src = 'assets/icons/HAB.webp';
                
                // Save context to apply color filter
                ctx.save();
                
                // Create temporary canvas for coloring
                const tempCanvas = document.createElement('canvas');
                const tempCtx = tempCanvas.getContext('2d');
                tempCanvas.width = 72;  // Reduced by 25% from 96 to 72
                tempCanvas.height = 72; // Reduced by 25% from 96 to 72
                
                // Draw and color the image
                img.onload = () => {
                    tempCtx.filter = 'brightness(0) saturate(100%) invert(12%) sepia(96%) saturate(6829%) hue-rotate(360deg) brightness(103%) contrast(115%)'; // Pure red
                    tempCtx.drawImage(img, 0, 0, 72, 72);
                    
                    // Draw the colored image onto main canvas
                    ctx.drawImage(tempCanvas, marker.x - 36, marker.y - 36, 72, 72); // Reduced by 25% (36 from 48)
                    
                    // Draw selection box if selected
                    if (state.markers.selected === marker) {
                        ctx.strokeStyle = 'var(--accent)';
                        ctx.lineWidth = 2;
                        ctx.strokeRect(marker.x - 38, marker.y - 38, 76, 76); // Adjusted for new size
                    }
                };
                
                ctx.restore();
            });
        }
    };

    // Map handling
    const mapHandler = {
        load(imagePath) {
            if (!imagePath) {
                this.reset();
                return;
            }

            const img = new Image();
            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                state.map.offset = { x: 0, y: 0 };
                state.map.current = img;
                this.loadSavedData(imagePath);
                drawUtils.redrawCanvas();
            };
            img.src = imagePath;
        },

        reset() {
            canvas.width = 400;
            canvas.height = 100;
            state.map.current = null;
            state.drawing.data = [];
            state.markers.list = [];
            state.map.offset = { x: 0, y: 0 };
        },

        loadSavedData(mapPath) {
            const savedData = localStorage.getItem(mapPath);
            if (savedData) {
                try {
                    const data = JSON.parse(savedData);
                    state.drawing.data = data.drawings || [];
                    state.markers.list = data.markers || [];
                } catch (e) {
                    this.reset();
                }
            } else {
                this.reset();
            }
        },

        saveData() {
            const mapPath = document.getElementById('mapSelect').value;
            localStorage.setItem(mapPath, JSON.stringify({
                drawings: state.drawing.data,
                markers: state.markers.list
            }));
        }
    };

    // Event handlers
    const handlers = {
        startDrawing(e) {
            if (!state.map.current || e.button !== 0) return;
            
            state.drawing.isActive = true;
            const pos = drawUtils.getMousePos(e);
            state.drawing.data.push({
                type: 'start',
                x: pos.x,
                y: pos.y,
                color: document.querySelector('input[name="color"]:checked').value
            });
        },

        draw(e) {
            if (!state.drawing.isActive || !state.map.current) return;

            const pos = drawUtils.getMousePos(e);
            state.drawing.data.push({
                type: 'draw',
                x: pos.x,
                y: pos.y,
                color: document.querySelector('input[name="color"]:checked').value
            });

            drawUtils.redrawCanvas();
        },

        stopDrawing() {
            if (state.drawing.isActive && state.map.current) {
                mapHandler.saveData();
            }
            state.drawing.isActive = false;
        },

        handleMarkers(e) {
            if (state.markers.isPlacing) {
                const pos = drawUtils.getMousePos(e);
                state.markers.list.push({ x: pos.x, y: pos.y });
                state.markers.isPlacing = false;
                document.getElementById('habMarkerBtn').classList.remove('active');
                mapHandler.saveData();
                drawUtils.redrawCanvas();
            } else {
                const pos = drawUtils.getMousePos(e);
                state.markers.selected = state.markers.list.find(marker => {
                    const dx = marker.x - pos.x;
                    const dy = marker.y - pos.y;
                    return Math.sqrt(dx * dx + dy * dy) < 24;
                });
                drawUtils.redrawCanvas();
            }
        }
    };

    // Event listeners
    document.getElementById('mapSelect').addEventListener('change', e => {
        if (e.target.value === 'custom') {
            document.getElementById('imageUpload').click();
            e.target.value = '';
        } else {
            mapHandler.load(e.target.value);
        }
    });

    canvas.addEventListener('mousedown', e => e.button === 2 ? handlers.startPan(e) : handlers.startDrawing(e));
    canvas.addEventListener('mousemove', e => state.pan.isActive ? handlers.pan(e) : handlers.draw(e));
    canvas.addEventListener('mouseup', e => e.button === 2 ? handlers.stopPan() : handlers.stopDrawing());
    canvas.addEventListener('mouseout', () => {
        handlers.stopPan();
        handlers.stopDrawing();
    });
    canvas.addEventListener('click', handlers.handleMarkers);
    canvas.addEventListener('contextmenu', e => e.preventDefault());

    // Initialize event listeners
    document.getElementById('clearCanvas').addEventListener('click', () => {
        if (state.map.current) {
            // Only clear drawings and markers, not the map
            state.drawing.data = [];
            state.markers.list = [];
            state.markers.selected = null;
            
            // Remove saved data
            localStorage.removeItem(document.getElementById('mapSelect').value);
            
            // Redraw the map without drawings/markers
            drawUtils.redrawCanvas();
        }
    });

    document.getElementById('downloadMap').addEventListener('click', () => {
        if (!state.map.current) return;
        const link = document.createElement('a');
        link.download = `${document.getElementById('mapSelect').options[document.getElementById('mapSelect').selectedIndex].text}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    });

    document.getElementById('habMarkerBtn').addEventListener('click', () => {
        state.markers.isPlacing = !state.markers.isPlacing;
        document.getElementById('habMarkerBtn').classList.toggle('active');
    });

    document.getElementById('deleteMarkerBtn').addEventListener('click', () => {
        if (state.markers.selected) {
            state.markers.list = state.markers.list.filter(m => m !== state.markers.selected);
            state.markers.selected = null;
            mapHandler.saveData();
            drawUtils.redrawCanvas();
        }
    });
});

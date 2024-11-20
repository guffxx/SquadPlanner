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
            data: [],
            currentColor: 'red'
        },
        map: {
            current: null,
            offset: { x: 0, y: 0 }
        },
        pan: {
            isActive: false,
            lastPoint: { x: 0, y: 0 }
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
            
            // Apply transformations
            ctx.save();
            ctx.translate(state.map.offset.x, state.map.offset.y);
            
            // Draw map
            ctx.drawImage(state.map.current, 0, 0, canvas.width, canvas.height);

            // Draw stored lines
            this.drawStoredLines();
            
            ctx.restore();
        },

        drawStoredLines() {
            let currentPath = null;
            state.drawing.data.forEach(point => {
                if (point.type === 'start') {
                    if (currentPath) ctx.stroke();
                    currentPath = point;
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
                this.loadSavedDrawings(imagePath);
                drawUtils.redrawCanvas();
            };
            img.onerror = () => {
                console.error(`Failed to load map: ${imagePath}`);
                this.reset();
            };
            img.src = imagePath;
        },

        reset() {
            canvas.width = 400;
            canvas.height = 100;
            state.map.current = null;
            state.drawing.data = [];
            state.map.offset = { x: 0, y: 0 };
        },

        loadSavedDrawings(mapPath) {
            const savedData = localStorage.getItem(mapPath);
            if (savedData) {
                try {
                    state.drawing.data = JSON.parse(savedData);
                    drawUtils.redrawCanvas();
                } catch (e) {
                    console.error('Failed to load saved drawings');
                    state.drawing.data = [];
                }
            } else {
                state.drawing.data = [];
            }
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
                localStorage.setItem(
                    document.getElementById('mapSelect').value,
                    JSON.stringify(state.drawing.data)
                );
            }
            state.drawing.isActive = false;
        },

        startPan(e) {
            if (e.button === 2) {
                state.pan.isActive = true;
                state.pan.lastPoint = { x: e.clientX, y: e.clientY };
                canvas.style.cursor = 'grabbing';
            }
        },

        pan(e) {
            if (!state.pan.isActive) return;
            
            const deltaX = e.clientX - state.pan.lastPoint.x;
            const deltaY = e.clientY - state.pan.lastPoint.y;
            
            state.map.offset.x += deltaX;
            state.map.offset.y += deltaY;
            
            state.pan.lastPoint = { x: e.clientX, y: e.clientY };
            drawUtils.redrawCanvas();
        },

        stopPan() {
            state.pan.isActive = false;
            canvas.style.cursor = 'crosshair';
        }
    };

    // Event listeners
    document.getElementById('mapSelect').addEventListener('change', e => mapHandler.load(e.target.value));
    
    canvas.addEventListener('mousedown', e => {
        if (e.button === 2) handlers.startPan(e);
        else handlers.startDrawing(e);
    });

    canvas.addEventListener('mousemove', e => {
        if (state.pan.isActive) handlers.pan(e);
        else handlers.draw(e);
    });

    canvas.addEventListener('mouseup', e => {
        if (e.button === 2) handlers.stopPan();
        else handlers.stopDrawing();
    });

    canvas.addEventListener('mouseout', () => {
        handlers.stopPan();
        handlers.stopDrawing();
    });

    canvas.addEventListener('contextmenu', e => e.preventDefault());

    // Button handlers
    document.getElementById('clearCanvas').addEventListener('click', () => {
        if (state.map.current) {
            state.drawing.data = [];
            localStorage.removeItem(document.getElementById('mapSelect').value);
            drawUtils.redrawCanvas();
        }
    });

    document.getElementById('downloadMap').addEventListener('click', () => {
        if (!state.map.current) return;
        const mapSelect = document.getElementById('mapSelect');
        const link = document.createElement('a');
        link.download = `${mapSelect.options[mapSelect.selectedIndex].text}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    });

    // Color selection
    document.querySelectorAll('.color-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    document.getElementById('imageUpload').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    // Calculate dimensions to fit the canvas container
                    const container = document.querySelector('.canvas-container');
                    const maxWidth = container.clientWidth - 40; // Account for padding
                    const maxHeight = container.clientHeight - 40;
                    
                    let width = img.width;
                    let height = img.height;
                    
                    // Scale down if image is too large
                    if (width > maxWidth || height > maxHeight) {
                        const ratio = Math.min(maxWidth / width, maxHeight / height);
                        width *= ratio;
                        height *= ratio;
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    state.map.current = img;
                    state.map.offset = { x: 0, y: 0 };
                    state.drawing.data = [];
                    drawUtils.redrawCanvas();
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    });
});

document.addEventListener('DOMContentLoaded', () => {
    // Initialize canvas and context
    const canvas = document.getElementById('mapCanvas');
    const ctx = canvas.getContext('2d');
    const mapSelect = document.getElementById('mapSelect');

    // Initial setup
    canvas.width = 400;
    canvas.height = 100;

    // State
    let isDrawing = false;
    let currentMap = null;
    let drawingData = [];
    let currentColor = 'red';

    // Draw initial placeholder
    function drawPlaceholder() {
        ctx.fillStyle = 'var(--text-color)';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Select a map from the left', canvas.width / 2, canvas.height / 2);
    }

    drawPlaceholder();

    // Load map
    mapSelect.addEventListener('change', (e) => {
        if (!e.target.value) {
            canvas.width = 400;
            canvas.height = 100;
            drawPlaceholder();
            currentMap = null;
            drawingData = [];
            return;
        }

        const img = new Image();
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            currentMap = img;
            
            // Load saved drawings if they exist
            const savedData = localStorage.getItem(e.target.value);
            if (savedData) {
                drawingData = JSON.parse(savedData);
                redrawAll();
            } else {
                drawingData = [];
            }
        };
        img.src = e.target.value;
    });

    // Drawing functionality
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);

    function startDrawing(e) {
        if (!currentMap) return;
        
        isDrawing = true;
        const pos = getMousePos(e);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        ctx.strokeStyle = document.querySelector('input[name="color"]:checked').value;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        
        drawingData.push({
            type: 'start',
            x: pos.x,
            y: pos.y,
            color: ctx.strokeStyle
        });
    }

    function draw(e) {
        if (!isDrawing || !currentMap) return;

        const pos = getMousePos(e);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        
        drawingData.push({
            type: 'draw',
            x: pos.x,
            y: pos.y,
            color: ctx.strokeStyle
        });
    }

    function stopDrawing() {
        if (isDrawing && currentMap) {
            // Save drawing data
            localStorage.setItem(mapSelect.value, JSON.stringify(drawingData));
        }
        isDrawing = false;
    }

    function getMousePos(e) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    }

    function redrawAll() {
        if (!currentMap) return;

        // Clear and draw map
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(currentMap, 0, 0, canvas.width, canvas.height);

        // Redraw all lines
        let currentPath = null;
        drawingData.forEach(point => {
            if (point.type === 'start') {
                currentPath = point;
                ctx.beginPath();
                ctx.moveTo(point.x, point.y);
                ctx.strokeStyle = point.color;
                ctx.lineWidth = 3;
                ctx.lineCap = 'round';
            } else if (point.type === 'draw') {
                ctx.lineTo(point.x, point.y);
                ctx.stroke();
            }
        });
    }

    // Clear canvas
    document.getElementById('clearCanvas').addEventListener('click', () => {
        if (currentMap) {
            drawingData = [];
            localStorage.removeItem(mapSelect.value);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(currentMap, 0, 0, canvas.width, canvas.height);
        }
    });

    // Download functionality
    document.getElementById('downloadMap').addEventListener('click', () => {
        if (!currentMap) return;
        
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
});

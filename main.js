document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('mapCanvas');
    const ctx = canvas.getContext('2d');
    const mapSelect = document.getElementById('mapSelect');

    // Initial setup
    canvas.width = 400;
    canvas.height = 100;

    // State
    let isDrawing = false;
    let currentMap = null;
    let scale = 1;
    let offsetX = 0;
    let offsetY = 0;
    let lastX = 0;
    let lastY = 0;
    let isDragging = false;

    function drawPlaceholder() {
        ctx.fillStyle = 'var(--text-color)';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Select a map from the left', canvas.width / 2, canvas.height / 2);
    }

    drawPlaceholder();

    // Map loading
    mapSelect.addEventListener('change', (e) => {
        if (!e.target.value) {
            canvas.width = 400;
            canvas.height = 100;
            drawPlaceholder();
            currentMap = null;
            scale = 1;
            offsetX = 0;
            offsetY = 0;
            return;
        }

        const img = new Image();
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            currentMap = img;
            redrawCanvas();
        };
        img.src = e.target.value;
    });

    function redrawCanvas() {
        ctx.save();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Apply transformations
        ctx.translate(offsetX, offsetY);
        ctx.scale(scale, scale);

        // Draw map
        if (currentMap) {
            ctx.drawImage(currentMap, 0, 0, currentMap.width, currentMap.height);
        }
        
        ctx.restore();
    }

    // Zoom functionality
    canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        if (!currentMap) return;

        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Calculate real position before zoom
        const pointX = (mouseX - offsetX) / scale;
        const pointY = (mouseY - offsetY) / scale;

        // Adjust scale
        const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
        scale *= zoomFactor;
        scale = Math.min(Math.max(0.5, scale), 4); // Limit zoom between 0.5x and 4x

        // Adjust offset to zoom into mouse position
        offsetX = mouseX - pointX * scale;
        offsetY = mouseY - pointY * scale;

        redrawCanvas();
    });

    // Pan functionality
    canvas.addEventListener('mousedown', (e) => {
        if (e.button === 1 || e.button === 2) { // Middle or right click for panning
            isDragging = true;
            lastX = e.clientX;
            lastY = e.clientY;
        } else if (e.button === 0) { // Left click for drawing
            isDrawing = true;
            const pos = getMousePos(e);
            ctx.beginPath();
            ctx.moveTo(pos.x, pos.y);
        }
    });

    canvas.addEventListener('mousemove', (e) => {
        if (isDragging) {
            const deltaX = e.clientX - lastX;
            const deltaY = e.clientY - lastY;
            offsetX += deltaX;
            offsetY += deltaY;
            lastX = e.clientX;
            lastY = e.clientY;
            redrawCanvas();
        } else if (isDrawing) {
            draw(e);
        }
    });

    canvas.addEventListener('mouseup', (e) => {
        if (e.button === 1 || e.button === 2) {
            isDragging = false;
        } else if (e.button === 0) {
            isDrawing = false;
            ctx.beginPath();
        }
    });

    canvas.addEventListener('mouseout', () => {
        isDrawing = false;
        isDragging = false;
        ctx.beginPath();
    });

    // Prevent context menu on right click
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    function getMousePos(e) {
        const rect = canvas.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left - offsetX) / scale,
            y: (e.clientY - rect.top - offsetY) / scale
        };
    }

    function draw(e) {
        if (!isDrawing) return;

        const pos = getMousePos(e);
        
        ctx.save();
        ctx.translate(offsetX, offsetY);
        ctx.scale(scale, scale);
        
        ctx.lineWidth = 3 / scale;
        ctx.lineCap = 'round';
        ctx.strokeStyle = document.querySelector('input[name="color"]:checked').value;

        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        
        ctx.restore();
    }

    // Clear canvas
    document.getElementById('clearCanvas').addEventListener('click', () => {
        if (currentMap) {
            redrawCanvas();
        }
    });

    // Download functionality
    document.getElementById('downloadMap').addEventListener('click', () => {
        if (!currentMap) return;
        
        const link = document.createElement('a');
        link.download = 'modified-map.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    });
});

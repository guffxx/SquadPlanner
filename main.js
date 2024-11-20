// Canvas setup
const canvas = document.getElementById('mapCanvas');
const ctx = canvas.getContext('2d');
let currentColor = 'red';
let isDrawing = false;
let currentImage = null;
let markers = [];
let isPlacingHab = false;
let drawingCanvas = document.createElement('canvas');
let drawingCtx = drawingCanvas.getContext('2d');
let drawingHistory = []; // Store each line as a separate path
let currentPath = []; // Store the current line being drawn

// Initialize canvas size
canvas.width = 400;
canvas.height = 400;

// Drawing coordinates
let lastX = 0;
let lastY = 0;

// Event Listeners for color picker
document.querySelectorAll('.color-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        // Remove active class from all buttons
        document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
        // Add active class to clicked button
        this.classList.add('active');
        currentColor = this.dataset.color;
        isPlacingHab = false; // Exit HAB placement mode when color is selected
        document.getElementById('habMarkerBtn').classList.remove('active');
    });
});

// Map selection handling
const mapSelect = document.getElementById('mapSelect');
const imageUpload = document.getElementById('imageUpload');

mapSelect.addEventListener('change', function() {
    if (this.value === 'custom') {
        imageUpload.click();
    } else if (this.value) {
        loadMap(this.value);
    }
});

imageUpload.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            loadMap(event.target.result);
        };
        reader.readAsDataURL(file);
    }
});

function loadMap(src) {
    console.log('Loading map from:', src);
    
    currentImage = new Image();
    
    currentImage.onload = function() {
        console.log('Image loaded successfully');
        
        // Set canvas size to match image size
        canvas.width = currentImage.width;
        canvas.height = currentImage.height;
        
        // Set drawing canvas size to match
        drawingCanvas.width = canvas.width;
        drawingCanvas.height = canvas.height;
        
        // Draw image
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(currentImage, 0, 0, canvas.width, canvas.height);
        
        // Hide placeholder text
        document.querySelector('.placeholder-text').style.display = 'none';
        redrawMarkers(); // Redraw any existing markers
        
        // Reset drawing history
        drawingHistory = [];
        currentPath = [];
    };
    
    currentImage.onerror = function(e) {
        console.error('Error loading image:', e);
        console.error('Failed to load:', src);
        alert('Failed to load map image. Please check the console for details.');
    };
    
    currentImage.src = src;
    console.log('Set image source to:', src);
}

// Drawing functionality
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseout', stopDrawing);

function startDrawing(e) {
    if (isPlacingHab) {
        // Place HAB marker
        placeHABMarker(e);
    } else {
        isDrawing = true;
        [lastX, lastY] = getMousePos(canvas, e);
    }
}

function draw(e) {
    if (!isDrawing || isPlacingHab) return;
    
    const [currentX, currentY] = getMousePos(canvas, e);
    
    // Add point to current path
    currentPath.push({
        x: currentX,
        y: currentY,
        color: currentColor,
        lastX: lastX,
        lastY: lastY
    });
    
    // Draw on drawing canvas
    drawingCtx.beginPath();
    drawingCtx.moveTo(lastX, lastY);
    drawingCtx.lineTo(currentX, currentY);
    drawingCtx.strokeStyle = currentColor;
    drawingCtx.lineWidth = 4;
    drawingCtx.lineCap = 'round';
    drawingCtx.stroke();
    
    // Update display
    redrawCanvas();
    
    [lastX, lastY] = [currentX, currentY];
}

function stopDrawing() {
    if (isDrawing && currentPath.length > 0) {
        drawingHistory.push([...currentPath]);
        currentPath = [];
    }
    isDrawing = false;
}

function getMousePos(canvas, e) {
    const rect = canvas.getBoundingClientRect();
    return [
        (e.clientX - rect.left) * (canvas.width / rect.width),
        (e.clientY - rect.top) * (canvas.height / rect.height)
    ];
}

// HAB marker functionality
document.getElementById('habMarkerBtn').addEventListener('click', function() {
    isPlacingHab = !isPlacingHab;
    this.classList.toggle('active');
    if (isPlacingHab) {
        canvas.style.cursor = 'crosshair';
    } else {
        canvas.style.cursor = 'default';
    }
});

// Delete marker functionality
document.getElementById('deleteMarkerBtn').addEventListener('click', function() {
    if (markers.length > 0) {
        markers.pop(); // Remove the last HAB marker
        redrawCanvas();
    }
});

function redrawCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw base image
    if (currentImage) {
        ctx.drawImage(currentImage, 0, 0);
    }
    
    // Draw lines
    ctx.drawImage(drawingCanvas, 0, 0);
    
    // Draw markers with tint
    redrawMarkers();
}

function redrawMarkers() {
    markers.forEach(marker => {
        if (marker.type === 'HAB') {
            // Draw tint effect first
            ctx.save();
            ctx.fillStyle = marker.tintColor;
            ctx.globalAlpha = marker.tintAlpha;
            ctx.beginPath();
            ctx.arc(marker.x, marker.y, marker.tintRadius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            // Draw HAB marker
            const habImage = new Image();
            habImage.src = 'assets/icons/HAB.webp';
            habImage.onload = () => {
                ctx.drawImage(habImage, marker.x - marker.width/2, marker.y - marker.height/2, marker.width, marker.height);
            };
        }
    });
}

// Clear canvas functionality - modified to clear everything
document.getElementById('clearAll').addEventListener('click', function() {
    markers = []; // Clear HAB markers
    drawingHistory = []; // Clear drawing history
    currentPath = []; // Clear current path
    drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height); // Clear drawings
    if (currentImage) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(currentImage, 0, 0);
    } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
});

// Download functionality
document.getElementById('downloadNow').addEventListener('click', function() {
    const link = document.createElement('a');
    link.download = 'squad-map-plan.png';
    link.href = canvas.toDataURL();
    link.click();
});

// Window resize handling
window.addEventListener('resize', function() {
    if (currentImage) {
        redrawCanvas();
    }
});

function placeHABMarker(event) {
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) * (canvas.width / rect.width);
    const y = (event.clientY - rect.top) * (canvas.height / rect.height);

    const marker = new Image();
    marker.src = 'assets/icons/HAB.webp';
    
    marker.onload = function() {
        const markerWidth = 48;  
        const markerHeight = 48; 
        
        // Store marker data with tint information
        markers.push({ 
            x, 
            y, 
            type: 'HAB', 
            width: markerWidth, 
            height: markerHeight,
            tintColor: 'red',
            tintAlpha: 0.5,
            tintRadius: markerWidth/2
        });
        
        redrawCanvas();
    };
}

// Add delete line button functionality
document.getElementById('deleteLineBtn').addEventListener('click', function() {
    if (drawingHistory.length > 0) {
        drawingHistory.pop(); // Remove the last line
        redrawDrawings(); // Redraw all remaining lines
        redrawCanvas();
    }
});

// Add function to redraw all drawings
function redrawDrawings() {
    drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
    
    drawingHistory.forEach(path => {
        path.forEach((point, index) => {
            if (index > 0) {
                drawingCtx.beginPath();
                drawingCtx.moveTo(path[index - 1].x, path[index - 1].y);
                drawingCtx.lineTo(point.x, point.y);
                drawingCtx.strokeStyle = point.color;
                drawingCtx.lineWidth = 4;
                drawingCtx.lineCap = 'round';
                drawingCtx.stroke();
            }
        });
    });
}

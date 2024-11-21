// Canvas setup
const canvas = document.getElementById('mapCanvas');
const ctx = canvas.getContext('2d');
let currentColor = 'red';
let isDrawing = false;
let currentImage = null;
let markers = [];
let isPlacingHab = false;
let drawingHistory = []; // Store each line as a separate path
let currentPath = []; // Store the current line being drawn
let scale = 1;
let minScale = 1;  // Allow zoom out to 50%
let maxScale = 2.5;    // Allow zoom in to 250%
let offsetX = 0;
let offsetY = 0;
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;

// Initialize canvas size
canvas.width = 400;
canvas.height = 400;

// Drawing coordinates
let lastX = 0;
let lastY = 0;

// Event Listeners for color picker
document.querySelectorAll('.marker-color-picker .color-btn').forEach(btn => {
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
    
    if (currentImage) {
        currentImage.onload = null; // Remove old event listener
    }
    
    currentImage = new Image();
    
    currentImage.onload = function() {
        console.log('Image loaded successfully');
        
        // Set canvas size to match image size
        canvas.width = currentImage.width;
        canvas.height = currentImage.height;
        
        // Draw image
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Hide placeholder text
        document.querySelector('.placeholder-text').style.display = 'none';
        
        // Reset drawing history
        drawingHistory = [];
        currentPath = [];
        
        // Reset zoom and offset
        scale = 1;
        offsetX = 0;
        offsetY = 0;
        
        // Draw the initial state
        redrawCanvas();
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
canvas.addEventListener('contextmenu', function(e) {
    e.preventDefault(); // Prevent the context menu from appearing
});

canvas.addEventListener('mousedown', function(e) {
    if (e.button === 2) { // Right mouse button
        isDragging = true;
        const rect = canvas.getBoundingClientRect();
        dragStartX = e.clientX - rect.left;
        dragStartY = e.clientY - rect.top;
        canvas.style.cursor = 'grabbing';
    }
});

canvas.addEventListener('mousemove', function(e) {
    if (isDragging) {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const dx = (mouseX - dragStartX) * (canvas.width / rect.width);
        const dy = (mouseY - dragStartY) * (canvas.height / rect.height);
        
        offsetX += dx;
        offsetY += dy;
        
        dragStartX = mouseX;
        dragStartY = mouseY;
        
        redrawCanvas();
    }
});

canvas.addEventListener('mouseup', function(e) {
    if (e.button === 2) { // Right mouse button
        isDragging = false;
        canvas.style.cursor = 'default';
    }
});

canvas.addEventListener('mouseout', function() {
    if (isDragging) {
        isDragging = false;
        canvas.style.cursor = 'default';
    }
});

function startDrawing(e) {
    if (!currentImage || e.button === 2) return; // Don't draw on right click
    
    if (isPlacingHab) {
        placeHABMarker(e);
    } else {
        isDrawing = true;
        const pos = getMousePos(e);
        [lastX, lastY] = [pos.x, pos.y];
        
        currentPath = [{
            x: lastX,
            y: lastY,
            color: currentColor
        }];
    }
}

function draw(e) {
    if (!currentImage || !isDrawing) return;

    const pos = getMousePos(e);
    
    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);
    
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = currentColor;
    ctx.lineWidth = 3 / scale;
    ctx.lineCap = 'round';
    ctx.stroke();
    
    ctx.restore();

    currentPath.push({
        x: pos.x,
        y: pos.y,
        color: currentColor
    });

    [lastX, lastY] = [pos.x, pos.y];
}

function stopDrawing() {
    if (isDrawing && currentPath.length > 0) {
        drawingHistory.push([...currentPath]);
        currentPath = [];
    }
    isDrawing = false;
}

function getMousePos(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
        x: ((e.clientX - rect.left) * scaleX - offsetX) / scale,
        y: ((e.clientY - rect.top) * scaleY - offsetY) / scale
    };
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

// Update the HAB marker rendering in redrawCanvas
function redrawCanvas() {
    if (!currentImage) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);
    
    // Draw base image
    ctx.drawImage(currentImage, 0, 0);
    
    // Draw all paths
    drawingHistory.forEach(path => {
        if (path.length < 2) return;
        
        ctx.beginPath();
        ctx.moveTo(path[0].x, path[0].y);
        ctx.strokeStyle = path[0].color;
        ctx.lineWidth = 3 / scale;
        ctx.lineCap = 'round';
        
        for (let i = 1; i < path.length; i++) {
            ctx.lineTo(path[i].x, path[i].y);
        }
        ctx.stroke();
    });
    
    // Draw current path if exists
    if (currentPath.length > 0) {
        ctx.beginPath();
        ctx.moveTo(currentPath[0].x, currentPath[0].y);
        ctx.strokeStyle = currentPath[0].color;
        ctx.lineWidth = 3 / scale;
        ctx.lineCap = 'round';
        
        for (let i = 1; i < currentPath.length; i++) {
            ctx.lineTo(currentPath[i].x, currentPath[i].y);
        }
        ctx.stroke();
    }
    
    // Draw HAB markers
    const habImage = new Image();
    habImage.src = 'assets/icons/HAB.webp';
    
    markers.forEach(marker => {
        if (marker.type === 'HAB') {
            // Draw tint effect
            ctx.save();
            ctx.fillStyle = marker.tintColor;
            ctx.globalAlpha = marker.tintAlpha;
            ctx.beginPath();
            ctx.arc(marker.x, marker.y, marker.tintRadius / scale, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            // Draw HAB marker with corrected positioning and scaling
            const scaledWidth = marker.width / scale;
            const scaledHeight = marker.height / scale;
            
            ctx.drawImage(
                habImage,
                marker.x - scaledWidth / 2,  // Center horizontally
                marker.y - scaledHeight / 2,  // Center vertically
                scaledWidth,
                scaledHeight
            );
        }
    });
    
    ctx.restore();
}
// Clear canvas functionality - modified to clear everything
document.getElementById('clearAll').addEventListener('click', function() {
    markers = []; // Clear HAB markers
    drawingHistory = []; // Clear drawing history
    currentPath = []; // Clear current path
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
        const tempScale = scale;
        const tempOffsetX = offsetX;
        const tempOffsetY = offsetY;
        
        redrawCanvas();
        
        scale = tempScale;
        offsetX = tempOffsetX;
        offsetY = tempOffsetY;
    }
});

function placeHABMarker(event) {
    const pos = getMousePos(event);
    
    const marker = new Image();
    marker.src = 'assets/icons/HAB.webp';
    
    marker.onload = function() {
        const markerWidth = 48;  
        const markerHeight = 48; 
        const tintRadius = markerWidth/2.5;
        
        markers.push({ 
            x: pos.x, 
            y: pos.y, 
            type: 'HAB', 
            width: markerWidth, 
            height: markerHeight,
            tintColor: 'red',
            tintAlpha: 0.5,
            tintRadius: tintRadius
        });
        
        redrawCanvas();
    };
}

// Add delete line button functionality
document.getElementById('deleteLineBtn').addEventListener('click', function() {
    if (drawingHistory.length > 0) {
        drawingHistory.pop(); // Remove the last line
        redrawCanvas();
    }
});

// Add zoom handler function
function handleZoom(e) {
    e.preventDefault();
    
    if (!currentImage) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Calculate zoom direction and factor
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = scale * zoomFactor;
    
    // Check zoom limits
    if (newScale < minScale || newScale > maxScale) return;

    // Calculate mouse position relative to canvas
    const canvasX = mouseX * (canvas.width / rect.width);
    const canvasY = mouseY * (canvas.height / rect.height);

    // Update the offset to zoom towards mouse position
    offsetX = canvasX - (canvasX - offsetX) * zoomFactor;
    offsetY = canvasY - (canvasY - offsetY) * zoomFactor;
    
    scale = newScale;
    redrawAll();
}

// Add wheel event listener to canvas
canvas.addEventListener('wheel', handleZoom);

// Update redrawAll function to handle zoom and offset
function redrawAll() {
    redrawCanvas();
}


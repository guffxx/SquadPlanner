// Canvas setup
const canvas = document.getElementById('mapCanvas');
const ctx = canvas.getContext('2d');
let currentColor = 'red';
let isDrawing = false;
let currentImage = null;
let markers = [];
let isPlacingMarker = false;
let currentMarkerType = null;
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
let textAnnotations = [];
let isPlacingText = false;
let currentText = '';

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
        isPlacingMarker = false;
        currentMarkerType = null;
        Object.keys(markerButtons).forEach(id => {
            document.getElementById(id).classList.remove('active');
        });
        canvas.style.cursor = 'default';
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
    if (!currentImage || e.button === 2) return;
    
    if (isPlacingText && currentText) {
        const pos = getMousePos(e);
        
        // Add text annotation
        textAnnotations.push({
            x: pos.x,
            y: pos.y,
            text: currentText
        });
        
        // Reset text placement mode
        isPlacingText = false;
        currentText = '';
        canvas.style.cursor = 'default';
        document.getElementById('addTextBtn').classList.remove('active');
        document.getElementById('textInput').value = ''; // Clear input field
        
        redrawCanvas();
        e.preventDefault(); // Prevent other mouse events
    } else if (isPlacingMarker && currentMarkerType) {
        placeMarker(e, currentMarkerType);
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
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
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
const markerButtons = {
    'habMarkerBtn': 'HAB',
    'heliMarkerBtn': 'heli',
    'lavMarkerBtn': 'lav',
    'logiMarkerBtn': 'logi',
    'matvMarkerBtn': 'matv',
    'tankMarkerBtn': 'tank'
};


// Update the marker button event listeners - remove the cloning which was causing issues
Object.entries(markerButtons).forEach(([buttonId, markerType]) => {
    const button = document.getElementById(buttonId);
    if (button) {
        // Remove the cloning
        button.addEventListener('click', () => handleMarkerButtonClick(buttonId, markerType));
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
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
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
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        for (let i = 1; i < currentPath.length; i++) {
            ctx.lineTo(currentPath[i].x, currentPath[i].y);
        }
        ctx.stroke();
    }
    
    // Draw all markers
    markers.forEach(marker => {
        // Draw marker image
        const markerImage = new Image();
        markerImage.src = `assets/icons/${marker.type.toLowerCase()}.png`;
        
        const scaledWidth = marker.width / scale;
        const scaledHeight = marker.height / scale;
        
        ctx.drawImage(
            markerImage,
            marker.x - scaledWidth / 2,
            marker.y - scaledHeight / 2,
            scaledWidth,
            scaledHeight
        );
    });
    
    // Draw text annotations
    textAnnotations.forEach(annotation => {
        ctx.save();
        
        // Set text properties
        ctx.font = 'bold 32px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Draw black outline
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 4;
        ctx.strokeText(annotation.text, annotation.x, annotation.y);
        
        // Draw white text
        ctx.fillStyle = 'white';
        ctx.fillText(annotation.text, annotation.x, annotation.y);
        
        ctx.restore();
    });
    
    ctx.restore();
}
// Clear canvas functionality - modified to clear everything
document.getElementById('clearAll').addEventListener('click', function() {
    markers = []; // Clear HAB markers
    drawingHistory = []; // Clear drawing history
    currentPath = []; // Clear current path
    textAnnotations = []; // Clear text annotations
    if (currentImage) {
        redrawCanvas();
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



function placeMarker(event, markerType) {
    if (!markerType || !currentImage) return;
    
    const pos = getMousePos(event);
    
    // Create marker image
    const marker = new Image();
    marker.src = `assets/icons/${markerType.toLowerCase()}.png`;
    
    marker.onload = function() {
        let markerWidth, markerHeight;
        // Adjust base sizes
        const baseSize = markerType.toLowerCase() === 'lav' ? 40 : 36;
        
        // Calculate dimensions maintaining aspect ratio
        const aspectRatio = marker.naturalWidth / marker.naturalHeight;
        
        if (aspectRatio > 1) {
            markerWidth = baseSize;
            markerHeight = baseSize / aspectRatio;
        } else {
            markerHeight = baseSize;
            markerWidth = baseSize * aspectRatio;
        }
        
        // Add marker to array
        markers.push({ 
            x: pos.x, 
            y: pos.y, 
            type: markerType, 
            width: markerWidth, 
            height: markerHeight
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

// Add recenter functionality
document.getElementById('recenterBtn').addEventListener('click', function() {
    if (currentImage) {
        // Store current drawings and markers
        const tempDrawings = [...drawingHistory];
        const tempMarkers = [...markers];
        
        // Reset position and zoom
        scale = 1;
        offsetX = 0;
        offsetY = 0;
        
        // Redraw everything with original position
        redrawCanvas();
        
        // Restore drawings and markers
        drawingHistory = tempDrawings;
        markers = tempMarkers;
        redrawCanvas();
    }
});

// Clean up the handleMarkerButtonClick function
function handleMarkerButtonClick(buttonId, markerType) {
    // Remove active class from all buttons
    Object.keys(markerButtons).forEach(id => {
        document.getElementById(id).classList.remove('active');
    });
    
    // Remove active class from color buttons
    document.querySelectorAll('.color-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Toggle marker placement mode
    if (currentMarkerType === markerType && isPlacingMarker) {
        isPlacingMarker = false;
        currentMarkerType = null;
        canvas.style.cursor = 'default';
    } else {
        isPlacingMarker = true;
        currentMarkerType = markerType;
        document.getElementById(buttonId).classList.add('active');
        canvas.style.cursor = 'crosshair';
    }
    
    // Exit drawing mode
    isDrawing = false;
}

// Update the addTextBtn click handler
document.getElementById('addTextBtn').addEventListener('click', function() {
    if (!currentImage) return; // Don't add text if no map is loaded
    
    const textInput = document.getElementById('textInput');
    const text = textInput.value.trim();
    
    if (!text) return; // Don't proceed if text is empty
    
    // Remove active states from other tools
    Object.keys(markerButtons).forEach(id => {
        document.getElementById(id).classList.remove('active');
    });
    document.querySelectorAll('.color-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Set text placement mode
    isPlacingText = true;
    currentText = text;
    canvas.style.cursor = 'text';
    this.classList.add('active');
});

// Remove the style element that was added
const styleElement = document.querySelector('style');
if (styleElement && styleElement.textContent.includes('.draggable-text')) {
    styleElement.remove();
}
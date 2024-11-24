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
let isErasing = false;
let eraserCursor = null;
let currentTextColor = '#ffc409';

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
        
        // Disable eraser tool when selecting color
        isErasing = false;
        eraserCursor.style.display = 'none';
        document.getElementById('eraserBtn').classList.remove('active');
        
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
        
        // Calculate new offsets
        let newOffsetX = offsetX + dx;
        let newOffsetY = offsetY + dy;
        
        // Calculate bounds
        const maxOffsetX = canvas.width * (scale - 1);
        const maxOffsetY = canvas.height * (scale - 1);
        
        // Apply bounds checking
        if (scale <= 1) {
            // If zoomed out to 1x or less, center the image
            newOffsetX = 0;
            newOffsetY = 0;
        } else {
            // Limit panning when zoomed in
            newOffsetX = Math.max(-maxOffsetX, Math.min(maxOffsetX, newOffsetX));
            newOffsetY = Math.max(-maxOffsetY, Math.min(maxOffsetY, newOffsetY));
        }
        
        offsetX = newOffsetX;
        offsetY = newOffsetY;
        
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
    if (!currentImage || e.button === 2 || isErasing) return;
    
    if (isPlacingText) {
        const pos = getMousePos(e);
        
        // Check if clicking near existing text to replace it
        const clickRadius = 20;
        const clickX = pos.x;
        const clickY = pos.y;
        
        const existingTextIndex = textAnnotations.findIndex(annotation => {
            const dx = annotation.x - clickX;
            const dy = annotation.y - clickY;
            return Math.sqrt(dx * dx + dy * dy) < clickRadius;
        });
        
        if (existingTextIndex !== -1) {
            // Replace existing text and update color
            textAnnotations[existingTextIndex] = {
                x: pos.x,
                y: pos.y,
                text: currentText,
                color: currentTextColor
            };
        } else {
            // Add new text with color
            textAnnotations.push({
                x: pos.x,
                y: pos.y,
                text: currentText,
                color: currentTextColor
            });
        }
        
        // Reset text placement mode
        isPlacingText = false;
        currentText = '';
        document.getElementById('annotationText').value = '';
        canvas.style.cursor = 'default';
        
        redrawCanvas();
    } else if (isPlacingMarker) {
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

// Add line width control
let lineWidth = 5;
const widthSlider = document.getElementById('lineWidth');
const widthValue = document.querySelector('.width-value');

widthSlider.addEventListener('input', function() {
    lineWidth = this.value;
    widthValue.textContent = `${lineWidth}px`;
});

// Update the draw function to use the lineWidth
function draw(e) {
    if (!currentImage || !isDrawing || isErasing) return;

    const pos = getMousePos(e);
    
    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);
    
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = currentColor;
    ctx.lineWidth = lineWidth; // Use the variable line width
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    
    ctx.restore();

    currentPath.push({
        x: pos.x,
        y: pos.y,
        color: currentColor,
        width: lineWidth // Store the line width with the path
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
    isPlacingMarker = !isPlacingMarker;
    this.classList.toggle('active');
    if (isPlacingMarker) {
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
        ctx.lineWidth = path[0].width || 5; // Use stored width or default to 5
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
        ctx.lineWidth = currentPath[0].width || 5; // Use stored width or default to 5
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
        
        ctx.font = 'bold 32px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Add black outline
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 4;
        ctx.strokeText(annotation.text, annotation.x, annotation.y);
        
        // Fill with the annotation's color
        ctx.fillStyle = annotation.color;
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
    textAnnotations = []; // Add this line
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



function placeMarker(event, markerType) {
    if (!markerType || !currentImage) return;
    
    const pos = getMousePos(event);
    
    const marker = new Image();
    marker.src = `assets/icons/${markerType.toLowerCase()}.png`;
    
    marker.onload = function() {
        let markerWidth, markerHeight;
        const baseSize = markerType.toLowerCase() === 'logi' ? 44 : 42;
        
        // Calculate dimensions maintaining aspect ratio
        const aspectRatio = marker.naturalWidth / marker.naturalHeight;
        
        if (aspectRatio > 1) {
            markerWidth = baseSize;
            markerHeight = baseSize / aspectRatio;
        } else {
            markerHeight = baseSize;
            markerWidth = baseSize * aspectRatio;
        }
        
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
    if (newScale < minScale || newScale > maxScale) {
        // If zooming out beyond minimum scale, reset to center
        if (newScale < minScale) {
            scale = minScale;
            offsetX = 0;
            offsetY = 0;
            redrawCanvas();
        }
        return;
    }

    // Calculate mouse position relative to canvas
    const canvasX = mouseX * (canvas.width / rect.width);
    const canvasY = mouseY * (canvas.height / rect.height);

    // Update the offset to zoom towards mouse position
    offsetX = canvasX - (canvasX - offsetX) * zoomFactor;
    offsetY = canvasY - (canvasY - offsetY) * zoomFactor;
    
    scale = newScale;
    redrawCanvas();
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

// Add event listeners for all marker buttons
const markerButtons = {
    'habMarkerBtn': 'HAB',
    'heliMarkerBtn': 'heli',
    'lavMarkerBtn': 'lav',
    'logiMarkerBtn': 'logi',
    'matvMarkerBtn': 'matv',
    'tankMarkerBtn': 'tank'
};

// Remove any existing event listeners
Object.entries(markerButtons).forEach(([buttonId, markerType]) => {
    const button = document.getElementById(buttonId);
    if (button) {
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
        
        newButton.addEventListener('click', function() {
            // Remove active class from all buttons
            Object.keys(markerButtons).forEach(id => {
                document.getElementById(id).classList.remove('active');
            });
            
            // Remove active class from color buttons
            document.querySelectorAll('.color-btn').forEach(btn => btn.classList.remove('active'));
            
            // Disable eraser tool when selecting marker
            isErasing = false;
            eraserCursor.style.display = 'none';
            document.getElementById('eraserBtn').classList.remove('active');
            
            // Toggle marker placement mode
            if (currentMarkerType === markerType) {
                isPlacingMarker = false;
                currentMarkerType = null;
                canvas.style.cursor = 'default';
                this.classList.remove('active');
            } else {
                isPlacingMarker = true;
                currentMarkerType = markerType;
                this.classList.add('active');
                canvas.style.cursor = 'crosshair';
            }
            
            // Exit drawing mode
            isDrawing = false;
        });
    }

});

document.getElementById('addTextBtn').addEventListener('click', function() {
    const textInput = document.getElementById('annotationText');
    currentText = textInput.value.trim();
    
    if (currentText) {
        isPlacingText = true;
        isPlacingMarker = false;
        currentMarkerType = null;
        canvas.style.cursor = 'text';
        
        // Disable eraser tool when adding text
        isErasing = false;
        eraserCursor.style.display = 'none';
        document.getElementById('eraserBtn').classList.remove('active');
        
        // Remove active states from other tools
        Object.keys(markerButtons).forEach(id => {
            document.getElementById(id).classList.remove('active');
        });
        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.classList.remove('active');
        });
    }
});

document.getElementById('deleteTextBtn').addEventListener('click', function() {
    if (textAnnotations.length > 0) {
        textAnnotations.pop();
        redrawCanvas();
    }
});

// Update the eraseElements function
function eraseElements(e) {
    const pos = getMousePos(e);
    const eraseRadius = 40 / scale; // Increased from 20 to 40
    
    // Filter out markers within erase radius
    markers = markers.filter(marker => {
        const dx = marker.x - pos.x;
        const dy = marker.y - pos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance > eraseRadius;
    });
    
    // Filter out text annotations within erase radius
    textAnnotations = textAnnotations.filter(annotation => {
        const dx = annotation.x - pos.x;
        const dy = annotation.y - pos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance > eraseRadius;
    });
    
    // Filter out line segments that intersect with the eraser
    drawingHistory = drawingHistory.filter(path => {
        if (path.length < 2) return false;
        
        // Check if any segment of the line intersects with eraser circle
        for (let i = 1; i < path.length; i++) {
            const x1 = path[i-1].x;
            const y1 = path[i-1].y;
            const x2 = path[i].x;
            const y2 = path[i].y;
            
            // Calculate distance from point to line segment
            const distance = pointToLineDistance(pos.x, pos.y, x1, y1, x2, y2);
            if (distance < eraseRadius) return false;
        }
        return true;
    });
    
    redrawCanvas();
}

// Helper function to calculate distance from point to line segment
function pointToLineDistance(px, py, x1, y1, x2, y2) {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const len_sq = C * C + D * D;
    let param = -1;

    if (len_sq !== 0) param = dot / len_sq;

    let xx, yy;

    if (param < 0) {
        xx = x1;
        yy = y1;
    } else if (param > 1) {
        xx = x2;
        yy = y2;
    } else {
        xx = x1 + param * C;
        yy = y1 + param * D;
    }

    const dx = px - xx;
    const dy = py - yy;
    return Math.sqrt(dx * dx + dy * dy);
}

// Update the initializeEraser function
function initializeEraser() {
    // Create eraser cursor element
    eraserCursor = document.createElement('div');
    eraserCursor.className = 'eraser-cursor';
    document.body.appendChild(eraserCursor);

    // Add eraser button functionality
    const eraserBtn = document.getElementById('eraserBtn');
    eraserBtn.addEventListener('click', function() {
        isErasing = !isErasing;
        this.classList.toggle('active');
        
        if (isErasing) {
            canvas.style.cursor = 'none';
            eraserCursor.style.display = 'block';
            
            // Disable other tools
            isPlacingMarker = false;
            isPlacingText = false;
            isDrawing = false;
            currentMarkerType = null;
            
            // Remove active states from other tools
            Object.keys(markerButtons).forEach(id => {
                document.getElementById(id).classList.remove('active');
            });
            document.querySelectorAll('.color-btn').forEach(btn => {
                btn.classList.remove('active');
            });
        } else {
            canvas.style.cursor = 'default';
            eraserCursor.style.display = 'none';
        }
    });

    // Update eraser cursor position
    canvas.addEventListener('mousemove', function(e) {
        if (isErasing) {
            const rect = canvas.getBoundingClientRect();
            eraserCursor.style.left = (e.clientX - 20) + 'px'; // Changed from 10 to 20
            eraserCursor.style.top = (e.clientY - 20) + 'px';  // Changed from 10 to 20
            
            if (e.buttons === 1) { // Left mouse button is pressed
                eraseElements(e);
            }
        }
    });

    // Handle erasing on mouse down
    canvas.addEventListener('mousedown', function(e) {
        if (isErasing && e.button === 0) { // Left click only
            eraseElements(e);
        }
    });
}

initializeEraser();

// Add event listeners for text color picker
document.querySelectorAll('.text-color-picker .color-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        // Remove active class from all text color buttons
        document.querySelectorAll('.text-color-picker .color-btn').forEach(b => b.classList.remove('active'));
        // Add active class to clicked button
        this.classList.add('active');
        currentTextColor = this.dataset.color;
    });
});


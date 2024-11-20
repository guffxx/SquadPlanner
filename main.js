// Canvas setup
const canvas = document.getElementById('mapCanvas');
const ctx = canvas.getContext('2d');
let currentColor = 'red';
let isDrawing = false;
let currentImage = null;
let markers = [];
let isPlacingHab = false;

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
        
        // Draw image
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(currentImage, 0, 0, canvas.width, canvas.height);
        
        // Hide placeholder text
        document.querySelector('.placeholder-text').style.display = 'none';
        redrawMarkers(); // Redraw any existing markers
    };
    
    currentImage.onerror = function(e) {
        console.error('Error loading image:', e);
        console.error('Failed to load:', src);
        alert('Failed to load map image. Please check the console for details.');
    };

    // Remove the ./ from the start of the path if it exists
    if (src.startsWith('./')) {
        src = src.substring(2);
    }
    
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
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (canvas.width / rect.width);
        const y = (e.clientY - rect.top) * (canvas.height / rect.height);
        
        markers.push({
            x: x,
            y: y,
            type: 'HAB',
            color: currentColor
        });
        redrawCanvas();
    } else {
        isDrawing = true;
        [lastX, lastY] = getMousePos(canvas, e);
    }
}

function draw(e) {
    if (!isDrawing || isPlacingHab) return;
    
    const [currentX, currentY] = getMousePos(canvas, e);
    
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(currentX, currentY);
    ctx.strokeStyle = currentColor;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.stroke();
    
    [lastX, lastY] = [currentX, currentY];
}

function stopDrawing() {
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
    markers = [];
    redrawCanvas();
});

function redrawCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (currentImage) {
        ctx.drawImage(currentImage, 0, 0, canvas.width, canvas.height);
    }
    redrawMarkers();
}

function redrawMarkers() {
    markers.forEach(marker => {
        if (marker.type === 'HAB') {
            const habImage = new Image();
            habImage.src = 'assets/icons/HAB.webp';
            habImage.onload = () => {
                ctx.drawImage(habImage, marker.x - 24, marker.y - 24, 48, 48);
            };
        }
    });
}

// Clear canvas functionality
document.getElementById('clearCanvas').addEventListener('click', function() {
    markers = [];
    redrawCanvas();
});

// Download functionality
document.getElementById('downloadMap').addEventListener('click', function() {
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

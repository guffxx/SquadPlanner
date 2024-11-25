import { state } from './state.js';
import { loadMap } from './imageHandling.js';
import { startDrawing, draw, stopDrawing, getMousePos, startStraightLine, updateStraightLine, finishStraightLine } from './drawing.js';
import { markerButtons, placeMarker } from './markers.js';
import { addTextAnnotation } from './annotations.js';
import { initializeEraser, eraseElements, handleZoom } from './tools.js';
import { redrawCanvas } from './canvas.js';
import { initializeCustomIcons } from './customIcons.js';

// Initialize event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Map selection
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

    // Canvas events
    state.canvas.addEventListener('mousedown', handleCanvasClick);
    state.canvas.addEventListener('mousemove', draw);
    state.canvas.addEventListener('mouseup', stopDrawing);
    state.canvas.addEventListener('mouseout', stopDrawing);
    state.canvas.addEventListener('wheel', handleZoom);
    state.canvas.addEventListener('contextmenu', e => e.preventDefault());

    // Initialize tools
    initializeEraser();
    
    // Initialize UI controls
    initializeUIControls();

    // Initialize custom icons
    initializeCustomIcons();
});

// Add this new function to handle canvas clicks
function handleCanvasClick(e) {
    if (state.isPlacingMarker && state.currentMarkerType) {
        placeMarker(e, state.currentMarkerType);
    } else if (state.isPlacingText) {
        addTextAnnotation(e);
    } else {
        startDrawing(e);
    }
}

function initializeUIControls() {
    // Line color picker and draw tool
    const lineColorPicker = document.getElementById('lineColorPicker');
    const lineColorContainer = document.querySelector('.line-tools-container .color-picker-container');
    
    lineColorPicker.addEventListener('input', function() {
        state.currentColor = this.value;
    });
    
    lineColorContainer.addEventListener('click', function(e) {
        if (e.target === lineColorPicker) return;
        deselectAllTools();
        lineColorContainer.classList.add('active');
        state.canvas.style.cursor = 'crosshair';
    });

    // Marker color picker and tool
    const markerColorPicker = document.getElementById('markerColorPicker');
    const markerColorContainer = document.querySelector('.tint-selector .color-picker-container');
    
    markerColorPicker.addEventListener('input', function() {
        state.currentTint = this.value;
    });
    
    markerColorContainer.addEventListener('click', function(e) {
        if (e.target !== markerColorPicker) {
            deselectAllTools();
            markerColorContainer.classList.add('active');
            state.isPlacingMarker = true;
            state.currentMarkerType = state.lastUsedMarker || 'HAB';
            state.canvas.style.cursor = 'crosshair';
        } else {
            // Programmatically click the color picker when container is clicked
            markerColorPicker.click();
        }
    });

    // Text color picker and tool
    const textColorPicker = document.getElementById('textColorPicker');
    const textColorContainer = document.querySelector('.text-input-container .color-picker-container');
    
    textColorPicker.addEventListener('input', function() {
        state.currentTextColor = this.value;
    });
    
    textColorContainer.addEventListener('click', function(e) {
        if (e.target !== textColorPicker) {
            deselectAllTools();
            textColorContainer.classList.add('active');
        } else {
            // Programmatically click the color picker when container is clicked
            textColorPicker.click();
        }
    });

    // Marker buttons
    Object.entries(markerButtons).forEach(([buttonId, markerType]) => {
        const button = document.getElementById(buttonId);
        if (button) {
            button.addEventListener('click', function() {
                deselectAllTools();
                
                state.isPlacingMarker = true;
                state.currentMarkerType = markerType;
                state.lastUsedMarker = markerType; // Store the last used marker
                this.classList.add('active');
                state.canvas.style.cursor = 'crosshair';
            });
        }
    });

    // Text tools
    const textInput = document.getElementById('annotationText');
    const addTextBtn = document.getElementById('addTextBtn');

    textInput.addEventListener('input', function() {
        if (this.value.trim()) {
            addTextBtn.classList.add('has-text');
        } else {
            addTextBtn.classList.remove('has-text');
        }
    });

    addTextBtn.addEventListener('click', function() {
        state.currentText = textInput.value.trim();
        if (state.currentText) {
            deselectAllTools();
            
            state.isPlacingText = true;
            state.canvas.style.cursor = 'text';
        }
    });

    // Eraser button
    const eraserBtn = document.getElementById('eraserBtn');
    eraserBtn.addEventListener('click', function() {
        deselectAllTools();
        
        state.isErasing = true;
        this.classList.add('active');
        state.canvas.style.cursor = 'none';
        if (state.eraserCursor) {
            state.eraserCursor.style.display = 'block';
        }
    });

    // Other controls
    document.getElementById('clearAll').addEventListener('click', function() {
        state.markers = [];
        state.drawingHistory = [];
        state.currentPath = [];
        state.textAnnotations = [];
        redrawCanvas();
    });

    document.getElementById('downloadNow').addEventListener('click', function() {
        const link = document.createElement('a');
        link.download = 'squad-map-plan.png';
        link.href = state.canvas.toDataURL();
        link.click();
    });

    // Initialize marker size slider
    const markerSizeSlider = document.getElementById('markerSize');
    const markerSizeValue = document.querySelector('.marker-size-value');
    if (markerSizeSlider && markerSizeValue) {
        markerSizeSlider.addEventListener('input', function() {
            state.markerSize = this.value;
            markerSizeValue.textContent = `${state.markerSize}px`;
        });
    }

    // Initialize line width slider
    const widthSlider = document.getElementById('lineWidth');
    const widthValue = document.querySelector('.width-value');
    if (widthSlider && widthValue) {
        widthSlider.addEventListener('input', function() {
            state.lineWidth = this.value;
            widthValue.textContent = `${state.lineWidth}px`;
        });
    }

    // Add text size slider handler
    const textSizeSlider = document.getElementById('textSize');
    const textSizeValue = document.querySelector('.text-size-value');
    if (textSizeSlider && textSizeValue) {
        textSizeSlider.addEventListener('input', function() {
            state.textSize = this.value;
            textSizeValue.textContent = `${state.textSize}px`;
        });
    }

    // Straight line button
    const straightLineBtn = document.getElementById('straightLineBtn');
    straightLineBtn.addEventListener('click', function() {
        deselectAllTools();
        this.classList.add('active');
        state.isDrawingStraightLine = true;
        state.canvas.style.cursor = 'crosshair';
    });

    // Update canvas event listeners
    state.canvas.addEventListener('mousedown', function(e) {
        if (state.isDrawingStraightLine) {
            startStraightLine(e);
        } else if (state.isPlacingMarker && state.currentMarkerType) {
            placeMarker(e, state.currentMarkerType);
        } else if (state.isPlacingText) {
            addTextAnnotation(e);
        } else if (!state.isErasing) {
            startDrawing(e);
        }
    });

    state.canvas.addEventListener('mousemove', function(e) {
        if (state.isDrawingStraightLine && state.isDraggingHandle) {
            updateStraightLine(e);
        } else if (!state.isErasing) {
            draw(e);
        }
    });

    state.canvas.addEventListener('mouseup', function(e) {
        if (state.isDrawingStraightLine) {
            finishStraightLine(e);
        } else {
            stopDrawing();
        }
    });
}

function deselectAllTools() {
    // Reset all tool states
    state.isPlacingMarker = false;
    state.currentMarkerType = null;
    state.isPlacingText = false;
    state.isErasing = false;
    state.isDrawing = false;
    state.isDrawingStraightLine = false;

    // Remove active class from all buttons and containers
    document.querySelectorAll('.icon-btn, .custom-icon-btn, .color-picker-container').forEach(btn => {
        btn.classList.remove('active');
    });

    // Hide eraser cursor and deactivate eraser button
    if (state.eraserCursor) {
        state.eraserCursor.style.display = 'none';
    }
    document.getElementById('eraserBtn').classList.remove('active');

    // Reset cursor
    state.canvas.style.cursor = 'default';

    // Remove active class from straight line button
    document.getElementById('straightLineBtn')?.classList.remove('active');
}
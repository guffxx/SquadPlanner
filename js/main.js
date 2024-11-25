import { state } from './state.js';
import { loadMap } from './imageHandling.js';
import { startDrawing, draw, stopDrawing, getMousePos } from './drawing.js';
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
    // Line color picker
    const lineColorPicker = document.getElementById('lineColorPicker');
    lineColorPicker.addEventListener('input', function() {
        state.currentColor = this.value;
    });

    // Marker color picker
    const markerColorPicker = document.getElementById('markerColorPicker');
    markerColorPicker.addEventListener('input', function() {
        state.currentTint = this.value;
    });

    // Text color picker
    const textColorPicker = document.getElementById('textColorPicker');
    textColorPicker.addEventListener('input', function() {
        state.currentTextColor = this.value;
    });

    // Marker buttons
    Object.entries(markerButtons).forEach(([buttonId, markerType]) => {
        const button = document.getElementById(buttonId);
        if (button) {
            button.addEventListener('click', function() {
                // Deselect all tools first
                deselectAllTools();
                
                // Toggle marker placement mode
                if (state.currentMarkerType === markerType) {
                    state.isPlacingMarker = false;
                    state.currentMarkerType = null;
                    state.canvas.style.cursor = 'default';
                    this.classList.remove('active');
                } else {
                    state.isPlacingMarker = true;
                    state.currentMarkerType = markerType;
                    this.classList.add('active');
                    state.canvas.style.cursor = 'crosshair';
                }
            });
        }
    });

    // Text tools
    document.getElementById('addTextBtn').addEventListener('click', function() {
        const textInput = document.getElementById('annotationText');
        state.currentText = textInput.value.trim();
        if (state.currentText) {
            // Deselect all tools
            deselectAllTools();
            
            state.isPlacingText = true;
            state.canvas.style.cursor = 'text';
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
}

// Add this new function to handle tool deselection
function deselectAllTools() {
    // Reset all tool states
    state.isPlacingMarker = false;
    state.currentMarkerType = null;
    state.isPlacingText = false;
    state.isErasing = false;

    // Remove active class from all marker buttons
    Object.keys(markerButtons).forEach(id => {
        document.getElementById(id).classList.remove('active');
    });

    // Hide eraser cursor and deactivate eraser button
    if (state.eraserCursor) {
        state.eraserCursor.style.display = 'none';
    }
    document.getElementById('eraserBtn').classList.remove('active');

    // Reset cursor
    state.canvas.style.cursor = 'default';
}
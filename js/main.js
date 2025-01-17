import { state } from './state.js';
import { loadMap } from './imageHandling.js';
import { startDrawing, draw, stopDrawing, getMousePos, startStraightLine, updateStraightLine, finishStraightLine } from './drawing.js';
import { markerButtons, placeMarker } from './markers.js';
import { addTextAnnotation } from './annotations.js';
import { initializeEraser, eraseElements, handleZoom } from './tools.js';
import { redrawCanvas } from './canvas.js';
import { initializeCustomIcons } from './customIcons.js';
import { maps, mapUtils } from './maps.js';

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    // Initialize map selection
    mapUtils.initializeMapSelect();

    // Map selection handlers
    const mapSelect = document.getElementById('mapSelect');
    const imageUpload = document.getElementById('imageUpload');

    mapSelect.addEventListener('change', async function() {
        try {
            if (this.value === 'custom') {
                imageUpload.click();
                return;
            }
            
            if (this.value) {
                state.isLoading = true;
                state.currentMapKey = this.value;
                redrawCanvas(); // Show loading state
                
                const mapData = mapUtils.getMapData(this.value);
                if (mapData) {
                    // Show loading state
                    const placeholder = document.querySelector('.placeholder-text');
                    if (placeholder) {
                        placeholder.style.display = 'block';
                        placeholder.textContent = 'Loading map...';
                    }
                    
                    // Reset state for new map
                    state.resetState();
                    
                    // Load map asynchronously
                    await loadMap(mapData.path);
                    
                    // Update UI based on map size
                    document.body.classList.toggle('large-map', 
                        mapData.size === '4096x4096');
                }
            }
        } catch (error) {
            console.error('Error loading map:', error);
            state.loadingError = error;
            alert('Failed to load map. Please try another.');
        } finally {
            state.isLoading = false;
            redrawCanvas();
        }
    });

    // Handle custom map upload
    imageUpload.addEventListener('change', async function(e) {
        const file = e.target.files[0];
        if (file) {
            try {
                const reader = new FileReader();
                const imageData = await new Promise((resolve, reject) => {
                    reader.onload = e => resolve(e.target.result);
                    reader.onerror = e => reject(e);
                    reader.readAsDataURL(file);
                });
                
                await loadMap(imageData);
            } catch (error) {
                console.error('Error loading custom map:', error);
                alert('Failed to load custom map. Please try another file.');
            }
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
        state.canvas.style.cursor = 'crosshair';
    });

    // Marker color picker
    const markerColorPicker = document.getElementById('markerColorPicker');
    const markerColorContainer = document.querySelector('.tint-selector .color-picker-container');
    
    markerColorPicker.addEventListener('input', function() {
        state.currentTint = this.value;
    });
    
    markerColorContainer.addEventListener('click', function(e) {
        if (e.target === markerColorPicker) {
            markerColorPicker.click();
        }
    });

    // Text color picker
    const textColorPicker = document.getElementById('textColorPicker');
    const textColorContainer = document.querySelector('.text-input-container .color-picker-container');
    
    textColorPicker.addEventListener('input', function() {
        state.currentTextColor = this.value;
    });
    
    textColorContainer.addEventListener('click', function(e) {
        if (e.target === textColorPicker) {
            textColorPicker.click();
        }
    });

    // Marker buttons
    Object.entries(markerButtons).forEach(([buttonId, markerType]) => {
        const button = document.getElementById(buttonId);
        if (button) {
            button.addEventListener('click', function() {
                deselectAllTools();
                deselectDrawingTools();
                
                state.isPlacingMarker = true;
                state.currentMarkerType = markerType;
                state.lastUsedMarker = markerType;
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

    // Add this to initializeUIControls()
    const lineTypeButtons = {
        'arrowLineBtn': 'arrow',
        'xLineBtn': 'x',
        'plainLineBtn': 'plain'
    };

    Object.entries(lineTypeButtons).forEach(([buttonId, lineType]) => {
        const button = document.getElementById(buttonId);
        if (button) {
            button.addEventListener('click', function() {
                deselectAllTools();
                deselectMarkerTools();
                
                // Remove active class from all line type buttons
                document.querySelectorAll('.line-type-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                
                // Add active class to clicked button
                this.classList.add('active');
                
                // Set the current line type
                state.currentLineType = lineType;
                state.canvas.style.cursor = 'crosshair';
            });
        }
    });

    // Update quick color button handler
    document.querySelectorAll('.quick-color-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const color = this.dataset.color;
            const container = this.closest('.color-picker-container');
            const colorPicker = container.querySelector('input[type="color"]');
            colorPicker.value = color;
            
            // Trigger a change event on the color picker
            const event = new Event('input', { bubbles: true });
            colorPicker.dispatchEvent(event);
            
            // Update active state of quick color buttons in this container
            container.querySelectorAll('.quick-color-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

function deselectDrawingTools() {
    // Remove active class from line type buttons
    document.querySelectorAll('.line-type-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Reset drawing states
    state.isDrawing = false;
    state.isDrawingStraightLine = false;
    state.currentLineType = null;
}

function deselectMarkerTools() {
    // Remove active class from marker buttons
    document.querySelectorAll('.icon-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Reset marker states
    state.isPlacingMarker = false;
    state.currentMarkerType = null;
}

function deselectAllTools() {
    // Reset all tool states except colors
    state.isPlacingMarker = false;
    state.currentMarkerType = null;
    state.isPlacingText = false;
    state.isErasing = false;
    state.isDrawing = false;
    state.isDrawingStraightLine = false;
    state.currentLineType = null;

    // Remove active class from all tool buttons
    document.querySelectorAll('.icon-btn, .custom-icon-btn, .line-type-btn').forEach(btn => {
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
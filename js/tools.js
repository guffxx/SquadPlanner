import { state } from './state.js';
import { redrawCanvas } from './canvas.js';
import { getMousePos } from './drawing.js';
import { markerButtons } from './markers.js';

export function pointToLineDistance(px, py, x1, y1, x2, y2) {
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

export function eraseElements(e) {
    const pos = getMousePos(e);
    const eraseRadius = 40 / state.scale;
    
    state.markers = state.markers.filter(marker => {
        const dx = marker.x - pos.x;
        const dy = marker.y - pos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance > eraseRadius;
    });
    
    state.textAnnotations = state.textAnnotations.filter(annotation => {
        const dx = annotation.x - pos.x;
        const dy = annotation.y - pos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance > eraseRadius;
    });
    
    state.drawingHistory = state.drawingHistory.filter(path => {
        if (path.length < 2) return false;
        
        for (let i = 1; i < path.length; i++) {
            const x1 = path[i-1].x;
            const y1 = path[i-1].y;
            const x2 = path[i].x;
            const y2 = path[i].y;
            
            const distance = pointToLineDistance(pos.x, pos.y, x1, y1, x2, y2);
            if (distance < eraseRadius) return false;
        }
        return true;
    });
    
    redrawCanvas();
}

export function initializeEraser() {
    state.eraserCursor = document.createElement('div');
    state.eraserCursor.className = 'eraser-cursor';
    document.body.appendChild(state.eraserCursor);

    // Add eraser button functionality
    const eraserBtn = document.getElementById('eraserBtn');
    eraserBtn.addEventListener('click', function() {
        state.isErasing = !state.isErasing;
        this.classList.toggle('active');
        
        if (state.isErasing) {
            state.canvas.style.cursor = 'none';
            state.eraserCursor.style.display = 'block';
            
            // Disable other tools
            state.isPlacingMarker = false;
            state.isPlacingText = false;
            state.currentMarkerType = null;
            
            // Remove active states from other tools
            Object.keys(markerButtons).forEach(id => {
                document.getElementById(id).classList.remove('active');
            });
        } else {
            state.canvas.style.cursor = 'default';
            state.eraserCursor.style.display = 'none';
        }
    });

    // Update eraser cursor position
    state.canvas.addEventListener('mousemove', function(e) {
        if (state.isErasing) {
            const rect = state.canvas.getBoundingClientRect();
            state.eraserCursor.style.left = (e.clientX - 20) + 'px';
            state.eraserCursor.style.top = (e.clientY - 20) + 'px';
            
            if (e.buttons === 1) { // Left mouse button is pressed
                eraseElements(e);
            }
        }
    });

    // Handle erasing on mouse down
    state.canvas.addEventListener('mousedown', function(e) {
        if (state.isErasing && e.button === 0) { // Left click only
            eraseElements(e);
        }
    });
}

export function handleZoom(e) {
    e.preventDefault();
    
    if (!state.currentImage) return;

    const rect = state.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = state.scale * zoomFactor;
    
    if (newScale < state.minScale || newScale > state.maxScale) {
        if (newScale < state.minScale) {
            state.scale = state.minScale;
            state.offsetX = 0;
            state.offsetY = 0;
            redrawCanvas();
        }
        return;
    }

    const canvasX = mouseX * (state.canvas.width / rect.width);
    const canvasY = mouseY * (state.canvas.height / rect.height);

    state.offsetX = canvasX - (canvasX - state.offsetX) * zoomFactor;
    state.offsetY = canvasY - (canvasY - state.offsetY) * zoomFactor;
    
    state.scale = newScale;
    redrawCanvas();
} 
import { state } from './state.js';
import { drawArrow, drawX } from './drawing.js';
import { applyTint } from './imageHandling.js';

const markerImageCache = new Map();

export function redrawCanvas() {
    if (!state.currentImage) return;
    
    // Clear canvas
    state.ctx.clearRect(0, 0, state.canvas.width, state.canvas.height);
    
    // Show loading state if needed
    if (state.isLoading) {
        state.ctx.save();
        state.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        state.ctx.fillRect(0, 0, state.canvas.width, state.canvas.height);
        state.ctx.fillStyle = '#ffffff';
        state.ctx.font = '24px Arial';
        state.ctx.textAlign = 'center';
        state.ctx.fillText('Loading map...', state.canvas.width / 2, state.canvas.height / 2);
        state.ctx.restore();
        return;
    }
    
    // Normal drawing code...
    state.ctx.save();
    state.ctx.translate(state.offsetX, state.offsetY);
    state.ctx.scale(state.scale, state.scale);
    
    // Draw base image
    state.ctx.drawImage(state.currentImage, 0, 0);
    
    // Draw all elements
    state.drawingHistory.forEach(renderUtils.drawPath);
    if (state.currentPath.length > 0) {
        renderUtils.drawPath(state.currentPath);
    }
    
    state.markers.forEach(renderUtils.drawMarker.bind(renderUtils));
    state.textAnnotations.forEach(renderUtils.drawAnnotation);
    
    state.ctx.restore();
}

function drawMarker(marker, markerImage) {
    state.ctx.save();
    // Reset the transformation for markers
    state.ctx.setTransform(1, 0, 0, 1, 0, 0);
    
    // Calculate screen position
    const screenX = marker.x * state.scale + state.offsetX;
    const screenY = marker.y * state.scale + state.offsetY;
    
    if (marker.tint !== '#ffffff') {
        const tintedCanvas = applyTint(markerImage, marker.tint);
        state.ctx.drawImage(
            tintedCanvas,
            screenX - (marker.width * state.scale) / 2,
            screenY - (marker.height * state.scale) / 2,
            marker.width * state.scale,
            marker.height * state.scale
        );
    } else {
        state.ctx.drawImage(
            markerImage,
            screenX - (marker.width * state.scale) / 2,
            screenY - (marker.height * state.scale) / 2,
            marker.width * state.scale,
            marker.height * state.scale
        );
    }
    state.ctx.restore();
} 
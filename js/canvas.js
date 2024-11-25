import { state } from './state.js';
import { drawArrow } from './drawing.js';
import { applyTint } from './imageHandling.js';

export function redrawCanvas() {
    if (!state.currentImage) return;
    
    state.ctx.clearRect(0, 0, state.canvas.width, state.canvas.height);
    
    state.ctx.save();
    state.ctx.translate(state.offsetX, state.offsetY);
    state.ctx.scale(state.scale, state.scale);
    
    // Draw base image
    state.ctx.drawImage(state.currentImage, 0, 0);
    
    // Draw paths
    state.drawingHistory.forEach(path => {
        if (path.length < 2) return;
        
        state.ctx.beginPath();
        state.ctx.moveTo(path[0].x, path[0].y);
        state.ctx.strokeStyle = path[0].color;
        state.ctx.lineWidth = path[0].width;
        state.ctx.lineCap = 'round';
        state.ctx.lineJoin = 'round';
        
        for (let i = 1; i < path.length; i++) {
            state.ctx.lineTo(path[i].x, path[i].y);
        }
        state.ctx.stroke();
        
        if (path.length >= 4) {
            const lastPoint = path[path.length - 1];
            const secondLastPoint = path[path.length - 2];
            drawArrow(
                state.ctx,
                secondLastPoint.x,
                secondLastPoint.y,
                lastPoint.x,
                lastPoint.y,
                path[0].width * 3
            );
        }
    });
    
    // Draw current path
    if (state.currentPath.length > 1) {
        state.ctx.beginPath();
        state.ctx.moveTo(state.currentPath[0].x, state.currentPath[0].y);
        state.ctx.strokeStyle = state.currentPath[0].color;
        state.ctx.lineWidth = state.currentPath[0].width;
        state.ctx.lineCap = 'round';
        state.ctx.lineJoin = 'round';
        
        for (let i = 1; i < state.currentPath.length; i++) {
            state.ctx.lineTo(state.currentPath[i].x, state.currentPath[i].y);
        }
        state.ctx.stroke();
        
        const lastPoint = state.currentPath[state.currentPath.length - 1];
        const secondLastPoint = state.currentPath[state.currentPath.length - 2];
        drawArrow(
            state.ctx,
            secondLastPoint.x,
            secondLastPoint.y,
            lastPoint.x,
            lastPoint.y,
            state.currentPath[0].width * 3
        );
    }
    
    // Draw markers - fixed position with zoom
    state.markers.forEach(marker => {
        const markerImage = new Image();
        markerImage.src = `assets/icons/${marker.type.toLowerCase()}.png`;
        
        markerImage.onload = function() {
            state.ctx.save();
            // Reset the transformation for markers
            state.ctx.setTransform(1, 0, 0, 1, 0, 0);
            
            // Calculate screen position
            const screenX = marker.x * state.scale + state.offsetX;
            const screenY = marker.y * state.scale + state.offsetY;
            
            if (marker.tint !== 'white') {
                const tintedCanvas = applyTint(markerImage, marker.tint);
                state.ctx.drawImage(
                    tintedCanvas,
                    screenX - marker.width / 2,
                    screenY - marker.height / 2,
                    marker.width,
                    marker.height
                );
            } else {
                state.ctx.drawImage(
                    markerImage,
                    screenX - marker.width / 2,
                    screenY - marker.height / 2,
                    marker.width,
                    marker.height
                );
            }
            state.ctx.restore();
        };
    });
    
    // Draw text annotations
    state.textAnnotations.forEach(annotation => {
        state.ctx.save();
        
        state.ctx.font = `bold ${annotation.size}px Arial`;
        state.ctx.textAlign = 'center';
        state.ctx.textBaseline = 'middle';
        
        state.ctx.strokeStyle = 'black';
        state.ctx.lineWidth = 4;
        state.ctx.strokeText(annotation.text, annotation.x, annotation.y);
        
        state.ctx.fillStyle = annotation.color;
        state.ctx.fillText(annotation.text, annotation.x, annotation.y);
        
        state.ctx.restore();
    });
    
    state.ctx.restore();
} 
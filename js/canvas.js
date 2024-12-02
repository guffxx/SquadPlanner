import { state } from './state.js';
import { drawArrow, drawX } from './drawing.js';
import { applyTint } from './imageHandling.js';

const markerImageCache = new Map();

export function redrawCanvas() {
    if (!state.currentImage) return;
    
    state.ctx.clearRect(0, 0, state.canvas.width, state.canvas.height);
    
    state.ctx.save();
    state.ctx.translate(state.offsetX, state.offsetY);
    state.ctx.scale(state.scale, state.scale);
    
    // Draw base image
    state.ctx.drawImage(state.currentImage, 0, 0);
    
    // Function to draw a path
    const drawPath = (path) => {
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
        
        if (path.length >= 2) {
            const lastPoint = path[path.length - 1];
            const secondLastPoint = path[path.length - 2];
            state.ctx.strokeStyle = path[0].color;

            switch (path[0].type) {
                case 'arrow':
                    drawArrow(
                        state.ctx,
                        secondLastPoint.x,
                        secondLastPoint.y,
                        lastPoint.x,
                        lastPoint.y,
                        path[0].width * 3
                    );
                    break;
                case 'x':
                    drawX(state.ctx, lastPoint.x, lastPoint.y, path[0].width * 4);
                    break;
                // Plain line has no ending decoration
            }
        }
    };

    // Draw saved paths
    state.drawingHistory.forEach(drawPath);
    
    // Draw current path
    if (state.currentPath.length > 0) {
        drawPath(state.currentPath);
    }
    
    // Draw markers
    state.markers.forEach(marker => {
        const imageKey = marker.isCustom ? marker.type : `assets/icons/${marker.type.toLowerCase()}.png`;
        
        if (!markerImageCache.has(imageKey)) {
            // Create and cache the image if it doesn't exist
            const markerImage = new Image();
            markerImage.src = imageKey;
            markerImage.onload = () => {
                markerImageCache.set(imageKey, markerImage);
                drawMarker(marker, markerImage);
            };
        } else {
            // Use cached image
            drawMarker(marker, markerImageCache.get(imageKey));
        }
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
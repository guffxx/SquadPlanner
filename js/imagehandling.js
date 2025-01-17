import { state } from './state.js';
import { redrawCanvas } from './canvas.js';

export function loadMap(src) {
    return new Promise((resolve, reject) => {
        if (state.currentImage) {
            state.currentImage.onload = null;
            state.currentImage.onerror = null;
        }
        
        state.currentImage = new Image();
        
        state.currentImage.onload = function() {
            try {
                state.canvas.width = state.currentImage.width;
                state.canvas.height = state.currentImage.height;
                state.ctx.clearRect(0, 0, state.canvas.width, state.canvas.height);
                document.querySelector('.placeholder-text').style.display = 'none';
                state.drawingHistory = [];
                state.currentPath = [];
                state.scale = 1;
                state.offsetX = 0;
                state.offsetY = 0;
                redrawCanvas();
                resolve();
            } catch (error) {
                console.error('Error in map load handler:', error);
                reject(error);
            }
        };
        
        state.currentImage.onerror = function(e) {
            console.error('Error loading image:', e);
            alert('Failed to load map image. Please check if the file exists and try again.');
            reject(e);
        };
        
        // Add crossOrigin for external images if needed
        if (src.startsWith('http')) {
            state.currentImage.crossOrigin = 'anonymous';
        }
        
        state.currentImage.src = src;
    });
}

export function applyTint(image, tint) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = image.width;
    canvas.height = image.height;
    
    ctx.drawImage(image, 0, 0);
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = tint;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'destination-in';
    ctx.drawImage(image, 0, 0);
    
    return canvas;
} 
import { state } from './state.js';
import { getMousePos } from './drawing.js';
import { redrawCanvas } from './canvas.js';

export function addTextAnnotation(e) {
    if (!state.currentText) return;
    
    const pos = getMousePos(e);
    const clickRadius = 20;
    const clickX = pos.x;
    const clickY = pos.y;
    
    const existingTextIndex = state.textAnnotations.findIndex(annotation => {
        const dx = annotation.x - clickX;
        const dy = annotation.y - clickY;
        return Math.sqrt(dx * dx + dy * dy) < clickRadius;
    });
    
    if (existingTextIndex !== -1) {
        state.textAnnotations[existingTextIndex] = {
            x: pos.x,
            y: pos.y,
            text: state.currentText,
            color: state.currentTextColor,
            size: state.textSize
        };
    } else {
        state.textAnnotations.push({
            x: pos.x,
            y: pos.y,
            text: state.currentText,
            color: state.currentTextColor,
            size: state.textSize
        });
    }
    
    state.isPlacingText = false;
    state.currentText = '';
    document.getElementById('annotationText').value = '';
    state.canvas.style.cursor = 'default';
    
    redrawCanvas();
} 
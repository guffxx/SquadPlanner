import { state } from './state.js';
import { redrawCanvas } from './canvas.js';

export function drawArrow(ctx, fromx, fromy, tox, toy, headLength = 15) {
    headLength = headLength * 1.33;
    const angle = Math.atan2(toy - fromy, tox - fromx);
    const headAngle = Math.PI / 6;

    ctx.beginPath();
    ctx.moveTo(tox, toy);
    ctx.lineTo(
        tox - headLength * Math.cos(angle - headAngle),
        toy - headLength * Math.sin(angle - headAngle)
    );
    ctx.moveTo(tox, toy);
    ctx.lineTo(
        tox - headLength * Math.cos(angle + headAngle),
        toy - headLength * Math.sin(angle + headAngle)
    );
    ctx.stroke();
}

export function getMousePos(e) {
    const rect = state.canvas.getBoundingClientRect();
    const scaleX = state.canvas.width / rect.width;
    const scaleY = state.canvas.height / rect.height;
    
    return {
        x: ((e.clientX - rect.left) * scaleX - state.offsetX) / state.scale,
        y: ((e.clientY - rect.top) * scaleY - state.offsetY) / state.scale
    };
}

export function startDrawing(e) {
    if (!state.currentImage || e.button === 2 || state.isErasing) return;
    
    state.isDrawing = true;
    const pos = getMousePos(e);
    [state.lastX, state.lastY] = [pos.x, pos.y];
    [state.lastSmoothX, state.lastSmoothY] = [pos.x, pos.y];
    state.smoothedPoints = [];
    
    state.currentPath = [{
        x: state.lastX,
        y: state.lastY,
        color: state.currentColor,
        width: state.lineWidth
    }];
}

export function draw(e) {
    if (!state.currentImage || !state.isDrawing || state.isErasing) return;

    const pos = getMousePos(e);
    
    if (state.smoothedPoints.length === 0) {
        state.lastSmoothX = pos.x;
        state.lastSmoothY = pos.y;
    }
    
    const smoothX = state.lastSmoothX + (pos.x - state.lastSmoothX) * state.smoothingFactor;
    const smoothY = state.lastSmoothY + (pos.y - state.lastSmoothY) * state.smoothingFactor;
    
    state.ctx.save();
    state.ctx.translate(state.offsetX, state.offsetY);
    state.ctx.scale(state.scale, state.scale);
    
    redrawCanvas();
    
    state.currentPath.push({
        x: smoothX,
        y: smoothY,
        color: state.currentColor,
        width: state.lineWidth
    });

    state.lastSmoothX = smoothX;
    state.lastSmoothY = smoothY;
    state.smoothedPoints.push({ x: smoothX, y: smoothY });
    
    state.ctx.restore();
}

export function stopDrawing() {
    if (state.isDrawing && state.currentPath.length > 0) {
        state.drawingHistory.push([...state.currentPath]);
        state.currentPath = [];
        state.smoothedPoints = [];
    }
    state.isDrawing = false;
} 
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

export function drawX(ctx, x, y, size = 15) {
    const halfSize = size / 2;
    ctx.beginPath();
    ctx.moveTo(x - halfSize, y - halfSize);
    ctx.lineTo(x + halfSize, y + halfSize);
    ctx.moveTo(x + halfSize, y - halfSize);
    ctx.lineTo(x - halfSize, y + halfSize);
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
    
    state.currentPath = [{
        x: state.lastX,
        y: state.lastY,
        color: state.currentColor,
        width: state.lineWidth,
        type: state.currentLineType
    }];
}

export function draw(e) {
    if (!state.currentImage || !state.isDrawing || state.isErasing) return;

    const pos = getMousePos(e);
    const smoothX = state.lastSmoothX + (pos.x - state.lastSmoothX) * state.smoothingFactor;
    const smoothY = state.lastSmoothY + (pos.y - state.lastSmoothY) * state.smoothingFactor;
    
    state.currentPath.push({
        x: smoothX,
        y: smoothY,
        color: state.currentColor,
        width: state.lineWidth,
        type: state.currentLineType
    });

    state.lastSmoothX = smoothX;
    state.lastSmoothY = smoothY;
    
    redrawCanvas();
}

export function stopDrawing() {
    if (state.isDrawing && state.currentPath.length > 0) {
        state.drawingHistory.push([...state.currentPath]);
        state.currentPath = [];
        state.smoothedPoints = [];
    }
    state.isDrawing = false;
}

export function drawStraightLine(startX, startY, angle) {
    const length = 200;
    const endX = startX + length * Math.cos(angle);
    const endY = startY + length * Math.sin(angle);
    
    state.ctx.save();
    state.ctx.translate(state.offsetX, state.offsetY);
    state.ctx.scale(state.scale, state.scale);
    
    state.ctx.beginPath();
    state.ctx.moveTo(startX, startY);
    state.ctx.lineTo(endX, endY);
    state.ctx.strokeStyle = state.currentColor;
    state.ctx.lineWidth = state.lineWidth;
    state.ctx.stroke();
    
    // Draw arrow at the end
    drawArrow(state.ctx, startX, startY, endX, endY, state.lineWidth * 3);
    
    // Draw manipulation handles
    if (state.isDrawingStraightLine) {
        // Start handle
        state.ctx.beginPath();
        state.ctx.arc(startX, startY, 6 / state.scale, 0, Math.PI * 2);
        state.ctx.fillStyle = '#ffffff';
        state.ctx.strokeStyle = '#000000';
        state.ctx.lineWidth = 2 / state.scale;
        state.ctx.fill();
        state.ctx.stroke();
        
        // End handle
        state.ctx.beginPath();
        state.ctx.arc(endX, endY, 6 / state.scale, 0, Math.PI * 2);
        state.ctx.fill();
        state.ctx.stroke();
    }
    
    state.ctx.restore();
    
    return { startX, startY, endX, endY };
}

export function startStraightLine(e) {
    if (!state.currentImage || e.button === 2) return;
    
    const pos = getMousePos(e);
    state.isDrawingStraightLine = true;
    state.straightLineStart = { x: pos.x, y: pos.y };
    state.isDraggingHandle = true;
}

export function updateStraightLine(e) {
    if (!state.isDrawingStraightLine || !state.isDraggingHandle) return;
    
    const pos = getMousePos(e);
    const dx = pos.x - state.straightLineStart.x;
    const dy = pos.y - state.straightLineStart.y;
    const angle = Math.atan2(dy, dx);
    
    redrawCanvas();
    drawStraightLine(state.straightLineStart.x, state.straightLineStart.y, angle);
}

export function finishStraightLine(e) {
    if (!state.isDrawingStraightLine) return;
    
    const pos = getMousePos(e);
    const dx = pos.x - state.straightLineStart.x;
    const dy = pos.y - state.straightLineStart.y;
    const angle = Math.atan2(dy, dx);
    
    const line = drawStraightLine(state.straightLineStart.x, state.straightLineStart.y, angle);
    
    // Save the line to drawing history
    state.drawingHistory.push([
        { x: line.startX, y: line.startY, color: state.currentColor, width: state.lineWidth },
        { x: line.endX, y: line.endY, color: state.currentColor, width: state.lineWidth }
    ]);
    
    state.isDrawingStraightLine = false;
    state.isDraggingHandle = false;
    redrawCanvas();
} 
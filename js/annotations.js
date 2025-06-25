import { state } from "./state.js";
import { getMousePos } from "./drawing.js";
import { redrawCanvas } from "./canvas.js";

/**
 * Adds or updates a text annotation on the canvas.
 * If the click is near an existing annotation, it updates it; otherwise, it creates a new one.
 * @param {MouseEvent} e - The mouse event.
 */
export function addTextAnnotation(e) {
  if (!state.currentText) return;

  const pos = getMousePos(e);
  const clickRadius = 20;
  const clickX = pos.x;
  const clickY = pos.y;

  const existingTextIndex = state.textAnnotations.findIndex((annotation) => {
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
      size: state.textSize,
    };
  } else {
    state.textAnnotations.push({
      x: pos.x,
      y: pos.y,
      text: state.currentText,
      color: state.currentTextColor,
      size: state.textSize,
    });
  }

  state.isPlacingText = false;
  state.currentText = "";
  document.getElementById("annotationText").value = "";
  state.canvas.style.cursor = "default";

  redrawCanvas();
}

/**
 * Handles the start of a text drag operation on right-click.
 * @param {MouseEvent} e - The mouse event.
 */
export function handleTextDrag(e) {
  if (e.button === 2) {
    // Right click
    e.preventDefault();
    const pos = getMousePos(e);

    // Find clicked text annotation
    for (let i = state.textAnnotations.length - 1; i >= 0; i--) {
      const annotation = state.textAnnotations[i];

      // Calculate text dimensions
      state.ctx.save();
      state.ctx.font = `${annotation.size}px Arial`;
      const textWidth = state.ctx.measureText(annotation.text).width;
      state.ctx.restore();

      // Calculate text boundaries
      const textLeft = annotation.x - textWidth / 2;
      const textRight = annotation.x + textWidth / 2;
      const textTop = annotation.y - annotation.size / 2;
      const textBottom = annotation.y + annotation.size / 2;

      // Check if click is within text boundaries
      if (
        pos.x >= textLeft &&
        pos.x <= textRight &&
        pos.y >= textTop &&
        pos.y <= textBottom
      ) {
        state.isDraggingText = true;
        state.draggedTextIndex = i;
        state.canvas.style.cursor = "move";
        state.isPlacingText = false; // Disable text placement while dragging
        break;
      }
    }
  }
}

/**
 * Updates the position of the currently dragged text annotation.
 * @param {MouseEvent} e - The mouse event.
 */
export function updateTextDrag(e) {
  if (state.isDraggingText && state.draggedTextIndex !== null) {
    const pos = getMousePos(e);
    const annotation = state.textAnnotations[state.draggedTextIndex];
    annotation.x = pos.x;
    annotation.y = pos.y;
    redrawCanvas();
  }
}

/**
 * Stops the text drag operation and restores the default cursor.
 */
export function stopTextDrag() {
  if (state.isDraggingText) {
    state.isDraggingText = false;
    state.draggedTextIndex = null;
    state.canvas.style.cursor = "default";
  }
}

import { state } from "./state.js";
import { getMousePos } from "./drawing.js";
import { redrawCanvas } from "./canvas.js";

/**
 * A map of marker button IDs to their corresponding marker image filenames.
 * @type {Object.<string, string>}
 */
export const markerButtons = {
  heliMarkerBtn: "transporthelo",
  lavMarkerBtn: "ifv",
  logiMarkerBtn: "truck_logistics",
  matvMarkerBtn: "jeep_turret",
  tankMarkerBtn: "tank",
  apcMarkerBtn: "apc",
  ifvMarkerBtn: "trackedifv",
  mortarMarkerBtn: "MORTAR",
  habMarkerBtn: "hab",
  repStationMarkerBtn: "REP",
  rallyMarkerBtn: "rally",
  towMarkerBtn: "TOW",
  AAMarkerBtn: "antiair",
  mgMarkerBtn: "mgs",
  hmgMarkerBtn: "mgbunker",
  mortarBoomMarkerBtn: "MORT",
  boatlogiMarkerBtn: "boalogistics",
  msvMarkerBtn: "trackedapc_msv",
  jeepantitankMarkerBtn: "jeep_antitank",
  heavyantitankMarkerBtn: "heavyantitank",
  minesMarkerBtn: "MINES",
  boaopenturretMarkerBtn: "boaopenturret",
  trackedjeepMarkerBtn: "trackedjeep",
  truck_transportMarkerBtn: "truck_transport",
};

/**
 * Places a marker on the canvas at the specified position.
 * @param {MouseEvent} event - The mouse event.
 * @param {string} markerType - The type of marker to place (filename or data URL).
 */
export function placeMarker(event, markerType) {
  // Only place markers on left click and when not dragging
  if (!markerType || !state.currentImage) return;
  if (
    event.button !== 0 ||
    state.isDraggingMarker ||
    state.draggedMarkerIndex !== null
  )
    return; // Only allow left click placement and prevent placement during drag

  const pos = getMousePos(event);
  const marker = new Image();

  // Handle both built-in and custom icons
  marker.src = markerType.includes("data:")
    ? markerType
    : `assets/icons/${markerType}.png`;

  marker.onload = function () {
    let markerWidth, markerHeight;
    const aspectRatio = marker.naturalWidth / marker.naturalHeight;

    if (aspectRatio > 1) {
      markerWidth = state.markerSize;
      markerHeight = state.markerSize / aspectRatio;
    } else {
      markerHeight = state.markerSize;
      markerWidth = state.markerSize * aspectRatio;
    }

    const newMarker = {
      x: pos.x,
      y: pos.y,
      type: markerType,
      width: markerWidth,
      height: markerHeight,
      tint: state.currentTint,
      originalX: pos.x,
      originalY: pos.y,
      isCustom: markerType.includes("data:"),
    };

    state.markers.push(newMarker);
    redrawCanvas();
  };
}

/**
 * Handles the start of a marker drag operation on right-click.
 * @param {MouseEvent} e - The mouse event.
 */
export function handleMarkerDrag(e) {
  if (e.button === 2) {
    // Right click
    e.preventDefault();
    const pos = getMousePos(e);

    // Find clicked marker
    for (let i = state.markers.length - 1; i >= 0; i--) {
      const marker = state.markers[i];
      const dx = pos.x - marker.x;
      const dy = pos.y - marker.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < marker.width / 2) {
        state.isDraggingMarker = true;
        state.draggedMarkerIndex = i;
        state.canvas.style.cursor = "move";
        state.isPlacingMarker = false; // Disable marker placement while dragging
        break;
      }
    }
  }
}

/**
 * Updates the position of the currently dragged marker.
 * @param {MouseEvent} e - The mouse event.
 */
export function updateMarkerDrag(e) {
  if (state.isDraggingMarker && state.draggedMarkerIndex !== null) {
    const pos = getMousePos(e);
    const marker = state.markers[state.draggedMarkerIndex];
    marker.x = pos.x;
    marker.y = pos.y;
    redrawCanvas();
  }
}

/**
 * Stops the marker drag operation and restores the cursor.
 */
export function stopMarkerDrag() {
  if (state.isDraggingMarker) {
    state.isDraggingMarker = false;
    state.draggedMarkerIndex = null;
    // Restore marker placement state if a marker type was previously selected
    if (state.currentMarkerType) {
      state.isPlacingMarker = true;
      state.canvas.style.cursor = "crosshair";
    } else {
      state.canvas.style.cursor = "default";
    }
  }
}

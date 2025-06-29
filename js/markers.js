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
 * Creates and appends marker buttons to the marker grid.
 * This function dynamically generates buttons based on the markerButtons object.
 * Ensures buttons are sized appropriately for the sidebar.
 */
export function generateMarkerButtons() {
  const markerGrid = document.querySelector('.marker-grid');
  
  // Clear any existing buttons
  markerGrid.innerHTML = '';
  
  // Update grid layout to fit more items per row
  markerGrid.style.gridTemplateColumns = 'repeat(5, 1fr)';
  
  // Generate buttons for each marker type
  Object.entries(markerButtons).forEach(([buttonId, markerType]) => {
    const button = document.createElement('button');
    button.id = buttonId;
    button.className = 'icon-btn';
    button.title = markerType.replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .replace(/^./, str => str.toUpperCase());
    
    // Create image element for the button with explicit size constraints
    const img = document.createElement('img');
    img.src = `assets/icons/${markerType}.png`;
    img.alt = button.title;
    img.className = 'icon-image';
    img.style.maxWidth = '100%';
    img.style.maxHeight = '100%';
    
    // Append image to button and button to grid
    button.appendChild(img);
    markerGrid.appendChild(button);
  });

  // Add a style element to ensure proper sizing
  const styleEl = document.createElement('style');
  styleEl.innerHTML = `
    .marker-grid .icon-btn {
      width: 100%;
      aspect-ratio: 1;
      padding: 2px;
      margin: 1px;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: var(--darker-bg);
      border-radius: 4px;
      cursor: pointer;
      opacity: 0.75;
      transition: all 0.2s ease;
    }
    
    .icon-image {
      width: auto;
      height: auto;
      max-width: 95%;
      max-height: 95%;
      object-fit: contain;
    }
  `;
  document.head.appendChild(styleEl);
}

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

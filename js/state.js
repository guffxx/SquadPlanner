// Global state variables
/**
 * Global state for the application.
 * @property {HTMLCanvasElement} canvas - The main canvas element.
 * @property {CanvasRenderingContext2D} ctx - The 2D rendering context for the canvas.
 * @property {string} currentColor - The current color for drawing.
 * @property {boolean} isDrawing - Flag indicating if freehand drawing is active.
 * @property {HTMLImageElement|null} currentImage - The currently loaded map image.
 * @property {Array<object>} markers - Array of marker objects on the canvas.
 * @property {boolean} isPlacingMarker - Flag indicating if marker placement mode is active.
 * @property {string|null} currentMarkerType - The type of marker currently selected for placement.
 * @property {Array<Array<object>>} drawingHistory - History of completed drawing paths.
 * @property {Array<object>} currentPath - The current drawing path being created.
 * @property {number} scale - The current zoom scale of the canvas.
 * @property {number} minScale - The minimum allowed zoom scale.
 * @property {number} maxScale - The maximum allowed zoom scale.
 * @property {number} offsetX - The current horizontal offset for panning.
 * @property {number} offsetY - The current vertical offset for panning.
 * @property {boolean} isDragging - Flag indicating if the canvas is being panned.
 * @property {number} dragStartX - The starting x-coordinate for panning.
 * @property {number} dragStartY - The starting y-coordinate for panning.
 * @property {Array<object>} textAnnotations - Array of text annotation objects.
 * @property {boolean} isPlacingText - Flag indicating if text placement mode is active.
 * @property {string} currentText - The current text input for annotations.
 * @property {boolean} isErasing - Flag indicating if the eraser tool is active.
 * @property {HTMLElement|null} eraserCursor - The custom cursor element for the eraser.
 * @property {string} currentTextColor - The current color for text annotations.
 * @property {string} currentTint - The current color for tinting markers.
 * @property {number} smoothingFactor - The factor for smoothing freehand drawing lines.
 * @property {Array<object>} smoothedPoints - The smoothed points for the current path.
 * @property {number} lastSmoothX - The last smoothed x-coordinate.
 * @property {number} lastSmoothY - The last smoothed y-coordinate.
 * @property {number} markerSize - The current size for markers.
 * @property {number} lineWidth - The current width for drawing lines.
 * @property {number} lastX - The last recorded x-coordinate for drawing.
 * @property {number} lastY - The last recorded y-coordinate for drawing.
 * @property {number} textSize - The current font size for text annotations.
 * @property {string|null} lastUsedMarker - The type of the last used marker.
 * @property {boolean} isDrawingStraightLine - Flag indicating if straight line drawing mode is active.
 * @property {object|null} straightLineStart - The starting point of a straight line.
 * @property {boolean|null} isDraggingHandle - Flag indicating if a line handle is being dragged.
 * @property {string} currentLineType - The current type of line to draw ('arrow', 'x', 'plain').
 * @property {boolean} isDraggingMarker - Flag indicating if a marker is being dragged.
 * @property {number|null} draggedMarkerIndex - The index of the marker being dragged.
 * @property {boolean} isDraggingText - Flag indicating if a text annotation is being dragged.
 * @property {number|null} draggedTextIndex - The index of the text annotation being dragged.
 * @property {boolean} isMortarMode - Flag indicating if mortar calculator mode is active.
 * @property {object|null} mortarPosition - The position of the mortar on the map.
 * @property {object|null} targetPosition - The position of the target on the map.
 * @property {number|null} currentMapSize - The size of the current map in meters.
 * @property {boolean} showMortarRadius - Whether to show the maximum mortar range circle.
 * @property {boolean} showCoordinates - Whether to show grid coordinates on the map.
 * @property {boolean} highQualityMode - Whether to use high-quality image rendering.
 */
export const state = {
  canvas: document.getElementById("mapCanvas"),
  ctx: document.getElementById("mapCanvas").getContext("2d"),
  currentColor: "#ff0000",
  isDrawing: false,
  currentImage: null,
  markers: [],
  isPlacingMarker: false,
  currentMarkerType: null,
  drawingHistory: [],
  currentPath: [],
  scale: 1,
  minScale: 1,
  maxScale: 5, // Increased max zoom for higher detail
  offsetX: 0,
  offsetY: 0,
  isDragging: false,
  dragStartX: 0,
  dragStartY: 0,
  textAnnotations: [],
  isPlacingText: false,
  currentText: "",
  isErasing: false,
  eraserCursor: null,
  currentTextColor: "#ff0000",
  currentTint: "#ff0000",
  smoothingFactor: 0.2,
  smoothedPoints: [],
  lastSmoothX: 0,
  lastSmoothY: 0,
  markerSize: 56,
  lineWidth: 5,
  lastX: 0,
  lastY: 0,
  textSize: 36,
  lastUsedMarker: null,
  isDrawingStraightLine: false,
  straightLineStart: null,
  isDraggingHandle: null,
  currentLineType: "arrow",
  isDraggingMarker: false,
  draggedMarkerIndex: null,
  isDraggingText: false,
  draggedTextIndex: null,
  
  // Mortar Calculator related properties
  isMortarMode: false,
  mortarPosition: null,
  targetPosition: null,
  currentMapSize: null, // Will be set when loading a map
  showMortarRadius: true,
  showCoordinates: true,
  
  // High-quality rendering
  highQualityMode: true
};

// Initialize canvas size
state.canvas.width = 400;
state.canvas.height = 400;

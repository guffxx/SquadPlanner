// Global state variables
export const state = {
    canvas: document.getElementById('mapCanvas'),
    ctx: document.getElementById('mapCanvas').getContext('2d'),
    currentColor: '#ff0000',
    isDrawing: false,
    currentImage: null,
    markers: [],
    isPlacingMarker: false,
    currentMarkerType: null,
    drawingHistory: [],
    currentPath: [],
    scale: 1,
    minScale: 1,
    maxScale: 2.5,
    offsetX: 0,
    offsetY: 0,
    isDragging: false,
    dragStartX: 0,
    dragStartY: 0,
    textAnnotations: [],
    isPlacingText: false,
    currentText: '',
    isErasing: false,
    eraserCursor: null,
    currentTextColor: '#ff0000',
    currentTint: '#ff0000',
    smoothingFactor: 0.2,
    smoothedPoints: [],
    lastSmoothX: 0,
    lastSmoothY: 0,
    markerSize: 48,
    lineWidth: 5,
    lastX: 0,
    lastY: 0,
    textSize: 28,
    lastUsedMarker: null,
    isDrawingStraightLine: false,
    straightLineStart: null,
    isDraggingHandle: null,
    currentLineType: 'arrow',
    isLoading: false,
    loadingError: null,
    currentMapKey: null,
    resetState() {
        this.drawingHistory = [];
        this.currentPath = [];
        this.markers = [];
        this.textAnnotations = [];
        this.scale = 1;
        this.offsetX = 0;
        this.offsetY = 0;
        this.isDrawing = false;
        this.isPlacingMarker = false;
        this.isPlacingText = false;
        this.isErasing = false;
        this.isDrawingStraightLine = false;
        this.isDraggingHandle = false;
        this.straightLineStart = null;
        this.straightLineEnd = null;
        this.loadingError = null;
    }
};

// Initialize canvas size
state.canvas.width = 400;
state.canvas.height = 400; 
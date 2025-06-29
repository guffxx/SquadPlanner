import { state } from "./state.js";
import { mapData } from "./maps.js";
import { loadMap } from "./imageHandling.js";
import {
  startDrawing,
  draw,
  stopDrawing,
  getMousePos,
  startStraightLine,
  updateStraightLine,
  finishStraightLine,
} from "./drawing.js";
import {
  markerButtons,
  placeMarker,
  handleMarkerDrag,
  updateMarkerDrag,
  stopMarkerDrag,
  generateMarkerButtons,
} from "./markers.js";
import {
  addTextAnnotation,
  handleTextDrag,
  updateTextDrag,
  stopTextDrag,
} from "./annotations.js";
import { initializeEraser, eraseElements, handleZoom } from "./tools.js";
import { redrawCanvas } from "./canvas.js";
import { initializeCustomIcons } from "./customicons.js";

// Initialize event listeners
document.addEventListener("DOMContentLoaded", () => {
  // Populate map selection dropdown
  populateMapSelection();

  // Generate marker buttons
  generateMarkerButtons();

  // Map selection
  const mapSelect = document.getElementById("mapSelect");
  const imageUpload = document.getElementById("imageUpload");

  mapSelect.addEventListener("change", function () {
    if (this.value === "custom") {
      imageUpload.click();
    } else if (this.value) {
      loadMap(this.value);
    }
  });

  imageUpload.addEventListener("change", function (e) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (event) {
        loadMap(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  });

  // Canvas events - consolidate into handleCanvasClick
  state.canvas.addEventListener("mousedown", handleCanvasClick);
  state.canvas.addEventListener("mousemove", handleMouseMove);
  state.canvas.addEventListener("mouseup", handleMouseUp);
  state.canvas.addEventListener("mouseout", handleMouseUp);
  state.canvas.addEventListener("wheel", handleZoom);
  state.canvas.addEventListener("contextmenu", (e) => e.preventDefault());

  // Initialize tools
  initializeEraser();

  // Initialize UI controls
  initializeUIControls();

  // Initialize custom icons
  initializeCustomIcons();
});

function populateMapSelection() {
  const mapSelect = document.getElementById("mapSelect");

  Object.entries(mapData).forEach(([groupLabel, maps]) => {
    const optgroup = document.createElement("optgroup");
    optgroup.label = groupLabel;

    maps.forEach((map) => {
      const option = document.createElement("option");
      option.value = map.value;
      option.textContent = map.text;
      optgroup.appendChild(option);
    });

    mapSelect.appendChild(optgroup);
  });
}

// Consolidated mouse handlers
function handleCanvasClick(e) {
  if (e.button === 2) {
    // Right click
    handleMarkerDrag(e);
    handleTextDrag(e);
    return;
  }

  // Handle left click
  if (e.button === 0) {
    if (state.isDrawingStraightLine) {
      startStraightLine(e);
    } else if (state.isPlacingMarker && state.currentMarkerType) {
      placeMarker(e, state.currentMarkerType);
    } else if (state.isPlacingText) {
      addTextAnnotation(e);
    } else if (state.isErasing) {
      eraseElements(e);
    } else {
      startDrawing(e);
    }
  }
}

function handleMouseMove(e) {
  if (state.isDraggingMarker) {
    updateMarkerDrag(e);
  } else if (state.isDraggingText) {
    updateTextDrag(e);
  } else if (state.isDrawingStraightLine && state.isDraggingHandle) {
    updateStraightLine(e);
  } else if (state.isErasing && e.buttons === 1) {
    eraseElements(e);
  } else if (!state.isErasing) {
    draw(e);
  }
}

function handleMouseUp(e) {
  if (state.isDraggingMarker) {
    stopMarkerDrag();
  } else if (state.isDraggingText) {
    stopTextDrag();
  } else if (state.isDrawingStraightLine) {
    finishStraightLine(e);
  } else {
    stopDrawing();
  }
}

function initializeUIControls() {
  // Line color picker and draw tool
  const lineColorPicker = document.getElementById("lineColorPicker");
  const lineColorContainer = document.querySelector(
    ".line-tools-container .color-picker-container"
  );

  lineColorPicker.addEventListener("input", function () {
    state.currentColor = this.value;
  });

  lineColorContainer.addEventListener("click", function (e) {
    if (e.target === lineColorPicker) return;
    state.canvas.style.cursor = "crosshair";
  });

  // Marker color picker
  const markerColorPicker = document.getElementById("markerColorPicker");
  const markerColorContainer = document.querySelector(
    ".tint-selector .color-picker-container"
  );

  markerColorPicker.addEventListener("input", function () {
    state.currentTint = this.value;
  });

  markerColorContainer.addEventListener("click", function (e) {
    if (e.target === markerColorPicker) {
      markerColorPicker.click();
    }
  });

  // Text color picker
  const textColorPicker = document.getElementById("textColorPicker");
  const textColorContainer = document.querySelector(
    ".text-input-container .color-picker-container"
  );

  textColorPicker.addEventListener("input", function () {
    state.currentTextColor = this.value;
  });

  textColorContainer.addEventListener("click", function (e) {
    if (e.target === textColorPicker) {
      textColorPicker.click();
    }
  });

  // Marker buttons
  Object.entries(markerButtons).forEach(([buttonId, markerType]) => {
    const button = document.getElementById(buttonId);
    if (button) {
      button.addEventListener("click", function () {
        deselectAllTools();
        deselectDrawingTools();

        // Remove active class from all marker buttons first
        document.querySelectorAll(".icon-btn").forEach((btn) => {
          btn.classList.remove("active");
        });

        state.isPlacingMarker = true;
        state.currentMarkerType = markerType;
        state.lastUsedMarker = markerType;
        this.classList.add("active");
        state.canvas.style.cursor = "crosshair";
      });
    }
  });

  // Text tools
  const textInput = document.getElementById("annotationText");
  const addTextBtn = document.getElementById("addTextBtn");

  textInput.addEventListener("input", function () {
    if (this.value.trim()) {
      addTextBtn.classList.add("has-text");
    } else {
      addTextBtn.classList.remove("has-text");
    }
  });

  addTextBtn.addEventListener("click", function () {
    state.currentText = textInput.value.trim();
    if (state.currentText) {
      deselectAllTools();

      state.isPlacingText = true;
      state.canvas.style.cursor = "text";
    }
  });

  // Eraser button
  const eraserBtn = document.getElementById("eraserBtn");
  eraserBtn.addEventListener("click", function () {
    deselectAllTools();

    state.isErasing = true;
    this.classList.add("active");
    state.canvas.style.cursor = "none";
    if (state.eraserCursor) {
      state.eraserCursor.style.display = "block";
    }
  });

  // Other controls
  document.getElementById("clearAll").addEventListener("click", function () {
    state.markers = [];
    state.drawingHistory = [];
    state.currentPath = [];
    state.textAnnotations = [];
    redrawCanvas();
  });

  document.getElementById("downloadNow").addEventListener("click", function () {
    const link = document.createElement("a");
    link.download = "squad-map-plan.png";
    link.href = state.canvas.toDataURL();
    link.click();
  });

  // Initialize marker size slider
  const markerSizeSlider = document.getElementById("markerSize");
  const markerSizeValue = document.querySelector(".marker-size-value");
  if (markerSizeSlider && markerSizeValue) {
    markerSizeSlider.addEventListener("input", function () {
      state.markerSize = this.value;
      markerSizeValue.textContent = `${state.markerSize}px`;
    });
  }

  // Initialize line width slider
  const widthSlider = document.getElementById("lineWidth");
  const widthValue = document.querySelector(".width-value");
  if (widthSlider && widthValue) {
    widthSlider.addEventListener("input", function () {
      state.lineWidth = this.value;
      widthValue.textContent = `${state.lineWidth}px`;
    });
  }

  // Add text size slider handler
  const textSizeSlider = document.getElementById("textSize");
  const textSizeValue = document.querySelector(".text-size-value");
  if (textSizeSlider && textSizeValue) {
    textSizeSlider.addEventListener("input", function () {
      state.textSize = this.value;
      textSizeValue.textContent = `${state.textSize}px`;
    });
  }

  // Straight line button
  const straightLineBtn = document.getElementById("straightLineBtn");
  straightLineBtn.addEventListener("click", function () {
    deselectAllTools();
    this.classList.add("active");
    state.isDrawingStraightLine = true;
    state.canvas.style.cursor = "crosshair";
  });

  // Add this to initializeUIControls()
  const lineTypeButtons = {
    arrowLineBtn: "arrow",
    xLineBtn: "x",
    plainLineBtn: "plain",
  };

  Object.entries(lineTypeButtons).forEach(([buttonId, lineType]) => {
    const button = document.getElementById(buttonId);
    if (button) {
      button.addEventListener("click", function () {
        deselectAllTools();
        deselectMarkerTools();

        // Remove active class from all line type buttons
        document.querySelectorAll(".line-type-btn").forEach((btn) => {
          btn.classList.remove("active");
        });

        // Add active class to clicked button
        this.classList.add("active");

        // Set the current line type
        state.currentLineType = lineType;
        state.canvas.style.cursor = "crosshair";
      });
    }
  });

  // Update quick color button handler
  document.querySelectorAll(".quick-color-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const color = this.dataset.color;
      const container = this.closest(".color-picker-container");
      const colorPicker = container.querySelector('input[type="color"]');
      colorPicker.value = color;

      // Trigger a change event on the color picker
      const event = new Event("input", { bubbles: true });
      colorPicker.dispatchEvent(event);

      // Update active state of quick color buttons in this container
      container
        .querySelectorAll(".quick-color-btn")
        .forEach((b) => b.classList.remove("active"));
      this.classList.add("active");
    });
  });

  // Add undo functionality
  const undoBtn = document.getElementById("undoBtn");
  undoBtn.addEventListener("click", () => {
    if (state.markers.length > 0) {
      state.markers.pop();
    } else if (state.drawingHistory.length > 0) {
      state.drawingHistory.pop();
    } else if (state.textAnnotations.length > 0) {
      state.textAnnotations.pop();
    }
    redrawCanvas();
  });
}

function deselectDrawingTools() {
  // Remove active class from line type buttons
  document.querySelectorAll(".line-type-btn").forEach((btn) => {
    btn.classList.remove("active");
  });

  // Reset drawing states
  state.isDrawing = false;
  state.isDrawingStraightLine = false;
  state.currentLineType = null;
}

function deselectMarkerTools() {
  // Remove active class from marker buttons
  document.querySelectorAll(".icon-btn").forEach((btn) => {
    btn.classList.remove("active");
  });

  // Reset marker states
  state.isPlacingMarker = false;
  state.currentMarkerType = null;
}

function deselectAllTools() {
  // Reset all tool states except colors
  state.isPlacingMarker = false;
  state.currentMarkerType = null;
  state.isPlacingText = false;
  state.isErasing = false;
  state.isDrawing = false;
  state.isDrawingStraightLine = false;
  state.currentLineType = null;

  // Remove active class from all tool buttons
  document
    .querySelectorAll(".icon-btn, .custom-icon-btn, .line-type-btn")
    .forEach((btn) => {
      btn.classList.remove("active");
    });

  // Hide eraser cursor and deactivate eraser button
  if (state.eraserCursor) {
    state.eraserCursor.style.display = "none";
  }
  document.getElementById("eraserBtn").classList.remove("active");

  // Reset cursor
  state.canvas.style.cursor = "default";

  // Remove active class from straight line button
  document.getElementById("straightLineBtn")?.classList.remove("active");
}

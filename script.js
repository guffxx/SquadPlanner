const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const drawBtn = document.getElementById("draw-btn");
const textBtn = document.getElementById("text-btn");
const iconBtn = document.getElementById("icon-btn");
const eraseBtn = document.getElementById("erase-btn");
const clearBtn = document.getElementById("clear-btn");
const colorPicker = document.getElementById("color-picker");
const mapSelect = document.getElementById("map-select");
const iconItems = document.querySelectorAll(".icon-item");

// Set canvas size
function resizeCanvas() {
  canvas.width = canvas.parentElement.clientWidth;
  canvas.height = window.innerHeight - 300; // Adjust as needed
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// Drawing state
let isDrawing = false;
let currentTool = "draw";
let currentColor = "#000000";
let lastX = 0;
let lastY = 0;

// Tool selection
function setActiveTool(tool) {
  currentTool = tool;
  [drawBtn, textBtn, iconBtn, eraseBtn].forEach((btn) => {
    btn.classList.remove("active");
  });
  document.getElementById(`${tool}-btn`).classList.add("active");
}

drawBtn.onclick = () => setActiveTool("draw");
textBtn.onclick = () => setActiveTool("text");
iconBtn.onclick = () => setActiveTool("icon");
eraseBtn.onclick = () => setActiveTool("erase");
clearBtn.onclick = () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (currentMap) {
    ctx.drawImage(currentMap, 0, 0, canvas.width, canvas.height);
  }
};

colorPicker.onchange = (e) => {
  currentColor = e.target.value;
};

// Drawing functionality
canvas.addEventListener("mousedown", startDrawing);
canvas.addEventListener("mousemove", draw);
canvas.addEventListener("mouseup", stopDrawing);
canvas.addEventListener("mouseout", stopDrawing);
canvas.addEventListener("click", handleCanvasClick);

function startDrawing(e) {
  isDrawing = true;
  [lastX, lastY] = [e.offsetX, e.offsetY];
}

function draw(e) {
  if (!isDrawing || currentTool !== "draw") return;

  ctx.beginPath();
  ctx.moveTo(lastX, lastY);
  ctx.lineTo(e.offsetX, e.offsetY);
  ctx.strokeStyle = currentColor;
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.stroke();

  [lastX, lastY] = [e.offsetX, e.offsetY];
}

function stopDrawing() {
  isDrawing = false;
}

// Handle text input
function handleCanvasClick(e) {
  if (currentTool === "text") {
    const text = prompt("Enter text:");
    if (text) {
      ctx.font = "16px Arial";
      ctx.fillStyle = currentColor;
      ctx.fillText(text, e.offsetX, e.offsetY);
    }
  }
}

// Icon selection
iconItems.forEach((item) => {
  item.addEventListener("click", () => {
    iconItems.forEach((i) => i.classList.remove("selected"));
    item.classList.add("selected");
  });
});

// Map loading
let currentMap = null;
mapSelect.addEventListener("change", (e) => {
  if (e.target.value) {
    // Load and display selected map
    const img = new Image();
    img.onload = () => {
      currentMap = img;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    img.src = e.target.value; // You'll need to set the actual map image URL
  }
});

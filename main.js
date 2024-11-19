document.addEventListener('DOMContentLoaded', () => {
    // Initialize canvas and context
    const canvas = document.getElementById('mapCanvas');
    const ctx = canvas.getContext('2d');
    const mapSelect = document.getElementById('mapSelect');

    // Initial setup
    canvas.width = 400;
    canvas.height = 100;

    // State
    let isDrawing = false;
    let currentMap = null;
    let drawingData = [];
    let currentColor = 'red';
    let scale = 1;
    let offsetX = 0;
    let offsetY = 0;
    let currentTool = 'draw'; // or 'pan'
    let isPanning = false;
    let lastPanPoint = { x: 0, y: 0 };
    let eraserRadius = 10;
    let isErasing = false;
    let lastMousePos = { x: 0, y: 0 };

    // Draw initial placeholder
    function drawPlaceholder() {
        ctx.fillStyle = 'var(--text-color)';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Select a map from the left', canvas.width / 2, canvas.height / 2);
    }

    drawPlaceholder();

    // Load map
    mapSelect.addEventListener('change', (e) => {
        if (!e.target.value) {
            canvas.width = 400;
            canvas.height = 100;
            drawPlaceholder();
            currentMap = null;
            drawingData = [];
            scale = 1;
            offsetX = 0;
            offsetY = 0;
            isPanning = false;
            isDrawing = false;
            return;
        }

        const img = new Image();
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            currentMap = img;
            
            // Load saved drawings if they exist
            const savedData = localStorage.getItem(e.target.value);
            if (savedData) {
                drawingData = JSON.parse(savedData);
                redrawAll();
            } else {
                drawingData = [];
            }
        };
        img.src = e.target.value;
    });

    // Drawing functionality
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);

    function startDrawing(e) {
        if (!currentMap) return;
        
        if (currentTool === 'draw') {
            isDrawing = true;
            const pos = getMousePos(e);
            const currentColor = document.querySelector('input[name="color"]:checked').value;
            
            // Save current transformation state
            ctx.save();
            
            // Apply transformations for drawing
            ctx.translate(offsetX, offsetY);
            ctx.scale(scale, scale);
            
            // Start the path with correct color
            ctx.beginPath();
            ctx.moveTo(pos.x, pos.y);
            ctx.strokeStyle = currentColor;
            ctx.lineWidth = 3 / scale;
            ctx.lineCap = 'round';
            
            // Restore the transformation state
            ctx.restore();
            
            drawingData.push({
                type: 'start',
                x: pos.x,
                y: pos.y,
                color: currentColor
            });
        } else if (currentTool === 'erase') {
            isDrawing = true;
            const pos = getMousePos(e);
            eraseAtPoint(pos);
        } else if (currentTool === 'pan') {
            isPanning = true;
            canvas.style.cursor = 'grabbing';
            const rect = canvas.getBoundingClientRect();
            lastPanPoint = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
        }
    }

    function draw(e) {
        if (!currentMap) return;

        const pos = getMousePos(e);
        lastMousePos = pos; // Store last mouse position for eraser preview

        if (currentTool === 'draw' && isDrawing) {
            const currentColor = document.querySelector('input[name="color"]:checked').value;
            
            // Save current transformation state
            ctx.save();
            
            // Apply transformations for drawing
            ctx.translate(offsetX, offsetY);
            ctx.scale(scale, scale);
            
            // Set the correct color before drawing
            ctx.strokeStyle = currentColor;
            ctx.lineWidth = 3 / scale;
            ctx.lineCap = 'round';
            
            // Draw the line
            ctx.lineTo(pos.x, pos.y);
            ctx.stroke();
            
            // Start a new path to prevent connecting lines
            ctx.beginPath();
            ctx.moveTo(pos.x, pos.y);
            
            // Restore the transformation state
            ctx.restore();
            
            drawingData.push({
                type: 'draw',
                x: pos.x,
                y: pos.y,
                color: currentColor
            });
        } else if (currentTool === 'erase' && isDrawing) {
            eraseAtPoint(pos);
        } else if (currentTool === 'pan' && isPanning) {
            const rect = canvas.getBoundingClientRect();
            const currentPoint = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };

            offsetX += (currentPoint.x - lastPanPoint.x);
            offsetY += (currentPoint.y - lastPanPoint.y);

            lastPanPoint = currentPoint;
            redrawAll();
        }

        // Redraw and show eraser preview if eraser tool is selected
        if (currentTool === 'erase' && !isDrawing) {
            redrawAll();
            drawEraserPreview(pos);
        }
    }

    function stopDrawing() {
        if (currentTool === 'draw') {
            if (isDrawing && currentMap) {
                localStorage.setItem(mapSelect.value, JSON.stringify(drawingData));
            }
            isDrawing = false;
        } else if (currentTool === 'erase') {
            isDrawing = false;
            // Redraw with eraser preview at last position
            if (currentMap) {
                redrawAll();
                drawEraserPreview(lastMousePos);
            }
        } else if (currentTool === 'pan') {
            isPanning = false;
            canvas.style.cursor = 'grab';
        }
    }

    function getMousePos(e) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        
        // Calculate the actual mouse position in canvas coordinates
        const mouseX = (e.clientX - rect.left) * scaleX;
        const mouseY = (e.clientY - rect.top) * scaleY;
        
        // Return the position adjusted for both pan and scale
        return {
            x: (mouseX - offsetX) / scale,
            y: (mouseY - offsetY) / scale
        };
    }

    function redrawAll() {
        if (!currentMap) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        
        // Apply transformations
        ctx.translate(offsetX, offsetY);
        ctx.scale(scale, scale);

        // Draw map
        ctx.drawImage(currentMap, 0, 0, currentMap.width, currentMap.height);

        // Draw all lines with correct coordinates
        drawingData.forEach(point => {
            if (point.type === 'start') {
                ctx.beginPath();
                ctx.moveTo(point.x, point.y);
                ctx.strokeStyle = point.color;
                ctx.lineWidth = 3 / scale;
                ctx.lineCap = 'round';
            } else if (point.type === 'draw') {
                ctx.lineTo(point.x, point.y);
                ctx.stroke();
            }
        });

        ctx.restore();
    }

    // Clear canvas
    document.getElementById('clearCanvas').addEventListener('click', () => {
        if (currentMap) {
            drawingData = [];
            localStorage.removeItem(mapSelect.value);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(currentMap, 0, 0, canvas.width, canvas.height);
        }
    });

    // Download functionality
    document.getElementById('downloadMap').addEventListener('click', () => {
        if (!currentMap) return;
        
        const link = document.createElement('a');
        link.download = `${mapSelect.options[mapSelect.selectedIndex].text}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    });

    // Color selection
    document.querySelectorAll('.color-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active state visually
            document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Update the radio input
            const radioId = btn.getAttribute('for');
            document.getElementById(radioId).checked = true;
            
            // If currently drawing, update the stroke style
            if (isDrawing) {
                ctx.strokeStyle = document.querySelector('input[name="color"]:checked').value;
            }
        });
    });

    // Add zoom functionality
    canvas.addEventListener('wheel', handleZoom);

    function handleZoom(e) {
        e.preventDefault();
        
        if (!currentMap) return;

        const rect = canvas.getBoundingClientRect();
        const mouseX = (e.clientX - rect.left) * (canvas.width / rect.width);
        const mouseY = (e.clientY - rect.top) * (canvas.height / rect.height);

        // Determine zoom direction
        const delta = e.deltaY > 0 ? -1 : 1;
        const zoomFactor = 1.1;
        const zoom = delta > 0 ? zoomFactor : 1 / zoomFactor;

        // Calculate new scale
        const newScale = scale * zoom;

        // Limit zoom levels
        if (newScale >= 0.5 && newScale <= 5) {
            // Calculate mouse position in canvas space
            const mouseXCanvas = (mouseX - offsetX) / scale;
            const mouseYCanvas = (mouseY - offsetY) / scale;

            // Update scale
            scale = newScale;

            // Adjust offset to zoom towards mouse position
            offsetX = mouseX - mouseXCanvas * scale;
            offsetY = mouseY - mouseYCanvas * scale;

            redrawAll();
        }
    }

    // Add tool selection handlers after other initialization code
    document.getElementById('drawTool').addEventListener('click', () => {
        currentTool = 'draw';
        document.getElementById('drawTool').classList.add('active');
        document.getElementById('eraseTool').classList.remove('active');
        document.getElementById('panTool').classList.remove('active');
        canvas.style.cursor = 'crosshair';
        redrawAll(); // Remove eraser preview
    });

    document.getElementById('eraseTool').addEventListener('click', () => {
        currentTool = 'erase';
        document.getElementById('eraseTool').classList.add('active');
        document.getElementById('drawTool').classList.remove('active');
        document.getElementById('panTool').classList.remove('active');
        canvas.style.cursor = 'none'; // Hide default cursor when using eraser
        
        // Show initial eraser preview if map is loaded
        if (currentMap) {
            redrawAll();
            drawEraserPreview(lastMousePos);
        }
    });

    document.getElementById('panTool').addEventListener('click', () => {
        currentTool = 'pan';
        document.getElementById('panTool').classList.add('active');
        document.getElementById('drawTool').classList.remove('active');
        document.getElementById('eraseTool').classList.remove('active');
        canvas.style.cursor = 'grab';
        redrawAll(); // Remove eraser preview
    });

    // Add keyboard shortcut for quick tool switching (optional)
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Space') {
            e.preventDefault();
            if (currentTool === 'draw') {
                document.getElementById('eraseTool').click();
            } else if (currentTool === 'erase') {
                document.getElementById('panTool').click();
            } else {
                document.getElementById('drawTool').click();
            }
        }
    });

    // Add eraser functionality
    function eraseAtPoint(pos) {
        // Convert eraser radius to account for scale
        const scaledRadius = eraserRadius / scale;
        
        // Find points to remove
        let newDrawingData = [];
        let changed = false;
        let currentPath = [];
        
        drawingData.forEach((point, index) => {
            if (point.type === 'start') {
                if (currentPath.length > 0) {
                    newDrawingData.push(...currentPath);
                }
                currentPath = [point];
            } else if (point.type === 'draw') {
                const dx = point.x - pos.x;
                const dy = point.y - pos.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < scaledRadius) {
                    changed = true;
                    if (currentPath.length > 0) {
                        // Start a new path after this erased point
                        if (currentPath.length > 1) {
                            newDrawingData.push(...currentPath);
                        }
                        currentPath = [];
                    }
                } else {
                    currentPath.push(point);
                }
            }
        });
        
        // Add any remaining path
        if (currentPath.length > 1) {
            newDrawingData.push(...currentPath);
        }
        
        if (changed) {
            drawingData = newDrawingData;
            localStorage.setItem(mapSelect.value, JSON.stringify(drawingData));
            redrawAll();
        }
    }

    // Add function to draw eraser preview
    function drawEraserPreview(pos) {
        ctx.save();
        ctx.translate(offsetX, offsetY);
        ctx.scale(scale, scale);
        
        // Draw eraser circle
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, eraserRadius, 0, Math.PI * 2);
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2 / scale;
        ctx.stroke();
        
        ctx.restore();
    }

    // Add mouseleave handler to remove eraser preview when mouse leaves canvas
    canvas.addEventListener('mouseleave', () => {
        if (currentTool === 'erase') {
            redrawAll();
        }
    });
});

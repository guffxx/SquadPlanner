// Constants
const MAPS = [
    { 
        value: "assets/maps/AlBasrah_AAS_v1.jpg", 
        name: "Al-Basrah",
        versions: [
            { value: "assets/maps/AlBasrah_AAS_v1.jpg", name: "Al-Basrah AAS V1" },
            { value: "assets/maps/AlBasrah_RAAS_v1.jpg", name: "Al-Basrah RAAS V1" },
            { value: "assets/maps/AlBasrah_Invasion.jpg", name: "Al-Basrah Invasion" }
        ]
    }
];

class Canvas {
    constructor() {
        this.canvas = document.getElementById("canvas");
        this.ctx = this.canvas.getContext("2d");
        this.currentMap = null;
        this.isDrawing = false;
        this.lastX = 0;
        this.lastY = 0;
        
        // Set default styles
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 2;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        this.initializeEventListeners();
        this.handleResize();
    }

    initializeEventListeners() {
        this.canvas.addEventListener("mousedown", this.startDrawing.bind(this));
        this.canvas.addEventListener("mousemove", this.draw.bind(this));
        this.canvas.addEventListener("mouseup", this.stopDrawing.bind(this));
        this.canvas.addEventListener("mouseout", this.stopDrawing.bind(this));
        this.canvas.addEventListener("click", this.handleCanvasClick.bind(this));
        window.addEventListener("resize", this.handleResize.bind(this));
    }

    resizeCanvasToImage(image) {
        try {
            const maxWidth = this.canvas.parentElement.clientWidth;
            const maxHeight = window.innerHeight - 300;
            
            const imageRatio = image.width / image.height;
            const containerRatio = maxWidth / maxHeight;
            
            let newWidth, newHeight;
            
            if (imageRatio > containerRatio) {
                newWidth = maxWidth;
                newHeight = maxWidth / imageRatio;
            } else {
                newHeight = maxHeight;
                newWidth = maxHeight * imageRatio;
            }
            
            this.canvas.width = newWidth;
            this.canvas.height = newHeight;
            
            return { width: newWidth, height: newHeight };
        } catch (error) {
            console.error('Error resizing canvas:', error);
        }
    }

    handleResize() {
        if (this.currentMap) {
            const dimensions = this.resizeCanvasToImage(this.currentMap);
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.drawImage(this.currentMap, 0, 0, dimensions.width, dimensions.height);
        }
    }

    startDrawing(e) {
        this.isDrawing = true;
        [this.lastX, this.lastY] = this.getMousePos(e);
    }

    draw(e) {
        if (!this.isDrawing) return;
        
        const [x, y] = this.getMousePos(e);
        
        this.ctx.beginPath();
        this.ctx.moveTo(this.lastX, this.lastY);
        this.ctx.lineTo(x, y);
        this.ctx.stroke();
        this.ctx.closePath();
        
        [this.lastX, this.lastY] = [x, y];
    }

    stopDrawing() {
        this.isDrawing = false;
    }

    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        return [
            e.clientX - rect.left,
            e.clientY - rect.top
        ];
    }

    handleCanvasClick(e) {
        const [x, y] = this.getMousePos(e);
        // Handle click based on current tool
    }
}

class Tools {
    constructor(canvas) {
        this.canvas = canvas;
        this.currentTool = 'draw';
        this.drawBtn = document.getElementById('draw-btn');
        this.textBtn = document.getElementById('text-btn');
        this.iconBtn = document.getElementById('icon-btn');
        this.eraseBtn = document.getElementById('erase-btn');
        this.clearBtn = document.getElementById('clear-btn');
        this.colorPicker = document.getElementById('color-picker');
        
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        this.drawBtn.addEventListener('click', () => this.setTool('draw'));
        this.textBtn.addEventListener('click', () => this.setTool('text'));
        this.iconBtn.addEventListener('click', () => this.setTool('icon'));
        this.eraseBtn.addEventListener('click', () => this.setTool('erase'));
        this.clearBtn.addEventListener('click', () => this.clearCanvas());
        this.colorPicker.addEventListener('change', (e) => this.setColor(e.target.value));
    }

    setTool(tool) {
        this.currentTool = tool;
        const buttons = [this.drawBtn, this.textBtn, this.iconBtn, this.eraseBtn];
        buttons.forEach(btn => btn.classList.remove('active'));
        document.getElementById(`${tool}-btn`).classList.add('active');
    }

    setColor(color) {
        this.canvas.ctx.strokeStyle = color;
        this.canvas.ctx.lineWidth = 2;
    }

    clearCanvas() {
        if (this.canvas.currentMap) {
            const dimensions = this.canvas.resizeCanvasToImage(this.canvas.currentMap);
            this.canvas.ctx.clearRect(0, 0, this.canvas.canvas.width, this.canvas.canvas.height);
            this.canvas.ctx.drawImage(this.canvas.currentMap, 0, 0, dimensions.width, dimensions.height);
        } else {
            this.canvas.ctx.clearRect(0, 0, this.canvas.canvas.width, this.canvas.canvas.height);
        }
    }
}

class MapSelector {
    constructor(canvas) {
        this.canvas = canvas;
        this.mapSelect = document.getElementById("map-select");
        this.subMapSelect = document.getElementById("sub-map-select");
        
        this.initializeMapSelect();
        this.initializeEventListeners();
    }

    initializeMapSelect() {
        this.mapSelect.innerHTML = '<option value="">Choose a map...</option>';
        MAPS.forEach(map => {
            const option = document.createElement('option');
            option.value = map.value;
            option.text = map.name;
            this.mapSelect.appendChild(option);
        });
    }

    initializeEventListeners() {
        this.mapSelect.addEventListener('change', this.handleMapChange.bind(this));
        this.subMapSelect.addEventListener('change', this.handleSubMapChange.bind(this));
    }

    handleMapChange(e) {
        const selectedMap = MAPS.find(map => map.value === e.target.value);
        
        if (selectedMap) {
            this.updateSubMapOptions(selectedMap.versions);
            this.subMapSelect.disabled = false;
        } else {
            this.updateSubMapOptions([]);
            this.subMapSelect.disabled = true;
        }
    }

    handleSubMapChange(e) {
        if (e.target.value) {
            this.loadMap(e.target.value);
        }
    }

    updateSubMapOptions(versions) {
        this.subMapSelect.innerHTML = '<option value="">Select version...</option>';
        versions.forEach(version => {
            const option = document.createElement('option');
            option.value = version.value;
            option.text = version.name;
            this.subMapSelect.appendChild(option);
        });
    }

    loadMap(mapUrl) {
        const image = new Image();
        image.onload = () => {
            this.canvas.currentMap = image;
            const dimensions = this.canvas.resizeCanvasToImage(image);
            this.canvas.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.canvas.ctx.drawImage(image, 0, 0, dimensions.width, dimensions.height);
        };
        image.src = mapUrl;
    }
}

class IconManager {
    constructor() {
        this.iconItems = document.querySelectorAll(".icon-item");
        this.selectedIcon = null;
        this.initializeIcons();
    }

    initializeIcons() {
        this.iconItems.forEach(item => {
            item.addEventListener("click", () => this.selectIcon(item));
        });
    }

    selectIcon(item) {
        this.iconItems.forEach(i => i.classList.remove("selected"));
        item.classList.add("selected");
        this.selectedIcon = item.dataset.icon || item.textContent;
    }

    getSelectedIcon() {
        return this.selectedIcon;
    }
}

class App {
    constructor() {
        this.canvas = new Canvas();
        this.iconManager = new IconManager();
        this.tools = new Tools(this.canvas);
        this.mapSelector = new MapSelector(this.canvas);

        // Set initial tool
        this.tools.setTool('draw');
    }
}

// Initialize the application when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
}); 
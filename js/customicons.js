import { state } from './state.js';
import { placeMarker } from './markers.js';

export function initializeCustomIcons() {
    const uploadBtn = document.getElementById('uploadIconBtn');
    const fileInput = document.getElementById('customIconUpload');
    const customIconsGrid = document.getElementById('customIconsGrid');

    uploadBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleIconUpload);

    // Load saved custom icons from localStorage
    loadSavedIcons();
}

function handleIconUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const iconData = {
            id: `custom-${Date.now()}`,
            src: e.target.result
        };

        // Save to localStorage
        const savedIcons = JSON.parse(localStorage.getItem('customIcons') || '[]');
        savedIcons.push(iconData);
        localStorage.setItem('customIcons', JSON.stringify(savedIcons));

        // Add to grid
        addIconToGrid(iconData);
    };
    reader.readAsDataURL(file);
    event.target.value = ''; // Reset file input
}

function loadSavedIcons() {
    const savedIcons = JSON.parse(localStorage.get.Item('customIcons') || '[]');
    savedIcons.forEach(iconData => addIconToGrid(iconData));
}

function addIconToGrid(iconData) {
    const customIconsGrid = document.getElementById('customIconsGrid');
    const iconBtn = document.createElement('button');
    iconBtn.className = 'custom-icon-btn';
    iconBtn.dataset.iconId = iconData.id;

    const img = document.createElement('img');
    img.src = iconData.src;
    img.className = 'marker-icon';
    img.alt = 'Custom Icon';


    iconBtn.appendChild(img);
   
    customIconsGrid.appendChild(iconBtn);

    // Add click handler for placing custom icon
    iconBtn.addEventListener('click', () => {
        document.querySelectorAll('.icon-btn, .custom-icon-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        iconBtn.classList.add('active');
        
        // Deselect all other tools first
        state.isPlacingMarker = true;
        state.currentMarkerType = iconData.src;
        state.lastUsedMarker = iconData.src;
        state.isPlacingText = false;
        state.isErasing = false;
        state.isDrawing = false;
        
        // Hide eraser cursor if it's visible
        if (state.eraserCursor) {
            state.eraserCursor.style.display = 'none';
        }
        
        // Reset eraser button state
        document.getElementById('eraserBtn').classList.remove('active');
        
        state.canvas.style.cursor = 'crosshair';
        
        // Add event listener for placing marker
        state.canvas.addEventListener('click', function onCanvasClick(e) {
            if (state.isPlacingMarker && state.currentMarkerType === iconData.src) {
                placeMarker(e, iconData.src);
                state.canvas.removeEventListener('click', onCanvasClick);
            }
        });
    });
}

function deleteCustomIcon(iconId) {
    const savedIcons = JSON.parse(localStorage.getItem('customIcons') || '[]');
    const updatedIcons = savedIcons.filter(icon => icon.id !== iconId);
    localStorage.setItem('customIcons', JSON.stringify(updatedIcons));
}


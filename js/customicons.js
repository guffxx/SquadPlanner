import { state } from './state.js';
import { placeMarker } from './markers.js';

export function initializeCustomIcons() {
    const uploadBtn = document.getElementById('uploadIconBtn');
    const clearBtn = document.getElementById('clearIconsBtn');
    const fileInput = document.getElementById('customIconUpload');
    const customIconsGrid = document.getElementById('customIconsGrid');

    uploadBtn.addEventListener('click', () => fileInput.click());
    clearBtn.addEventListener('click', clearCustomIcons);
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
    const savedIcons = JSON.parse(localStorage.getItem('customIcons') || '[]');
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

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-custom-icon';
    deleteBtn.innerHTML = '×';
    deleteBtn.onclick = (e) => {
        e.stopPropagation();
        deleteCustomIcon(iconData.id);
        iconBtn.remove();
    };

    iconBtn.appendChild(img);
    iconBtn.appendChild(deleteBtn);
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
    });
}

function deleteCustomIcon(iconId) {
    const savedIcons = JSON.parse(localStorage.getItem('customIcons') || '[]');
    const updatedIcons = savedIcons.filter(icon => icon.id !== iconId);
    localStorage.setItem('customIcons', JSON.stringify(updatedIcons));
}

// Add this function to handle clearing icons
function clearCustomIcons() {
    localStorage.removeItem('customIcons');
    const customIconsGrid = document.getElementById('customIconsGrid');
    customIconsGrid.innerHTML = '';
} 
import { MapManager } from './mapManager.js';
import { DrawingTools } from './drawingTools.js';
import { MarkerTools } from './markerTools.js';
import { TextTools } from './textTools.js';
import { EraserTools } from './eraserTools.js';
import { mapData } from './mapData.js';

document.addEventListener('DOMContentLoaded', async () => {
    const canvas = document.getElementById('mapCanvas');
    const ctx = canvas.getContext('2d');

    // Initialize managers
    const mapManager = new MapManager(canvas, ctx);
    
    // Preload maps
    try {
        mapManager.preloadedMaps = await mapManager.preloadMaps();
    } catch (error) {
        console.error('Error preloading maps:', error);
    }

    const drawingTools = new DrawingTools(canvas, ctx, mapManager);
    const markerTools = new MarkerTools(canvas, ctx, mapManager);
    const textTools = new TextTools(canvas, ctx, mapManager);
    const eraserTools = new EraserTools(canvas, ctx, mapManager);

    // Set tool references in mapManager
    mapManager.setTools(drawingTools, markerTools, textTools, eraserTools);

    // Initialize map selection
    const mapSelect = document.getElementById('mapSelect');
    await initializeMapSelection(mapSelect, mapManager);

    // Initialize download functionality
    const downloadBtn = document.getElementById('downloadNow');
    downloadBtn.addEventListener('click', () => mapManager.downloadMap());

    // Initialize recenter functionality
    const recenterBtn = document.getElementById('recenterBtn');
    recenterBtn.addEventListener('click', () => mapManager.recenterMap());
});

async function initializeMapSelection(mapSelect, mapManager) {
    try {
        // Sort maps alphabetically by name
        const sortedMaps = [...mapData].sort((a, b) => a.name.localeCompare(b.name));
        
        // Add map options
        mapSelect.innerHTML = `
            <option value="">Choose map...</option>
            ${sortedMaps.map(map => `
                <option value="${map.id}" ${mapManager.preloadedMaps?.has(map.id) ? '' : 'disabled'}>
                    ${map.name}${mapManager.preloadedMaps?.has(map.id) ? '' : ' (Loading...)'}
                </option>
            `).join('')}
            <option value="custom">Upload Custom Map...</option>
        `;

        // Handle map selection
        mapSelect.addEventListener('change', async (e) => {
            const selectedValue = e.target.value;
            
            if (selectedValue === 'custom') {
                document.getElementById('imageUpload').click();
            } else if (selectedValue) {
                const selectedMap = mapData.find(map => map.id === selectedValue);
                if (selectedMap) {
                    await mapManager.loadMap(selectedMap.url, selectedMap.id);
                }
            }
        });

        // Handle custom map upload
        document.getElementById('imageUpload').addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                if (file.type.startsWith('image/')) {
                    await mapManager.loadCustomMap(file);
                } else {
                    alert('Please upload an image file.');
                }
                e.target.value = ''; // Reset file input
            }
        });
    } catch (error) {
        console.error('Error initializing map selection:', error);
        mapSelect.innerHTML = '<option value="">Error loading maps</option>';
    }
} 
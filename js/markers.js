import { state } from './state.js';
import { getMousePos } from './drawing.js';
import { redrawCanvas } from './canvas.js';
import { applyTint } from './imageHandling.js';

export const markerButtons = {
    'habMarkerBtn': 'HAB',
    'heliMarkerBtn': 'heli',
    'lavMarkerBtn': 'lav',
    'logiMarkerBtn': 'logi',
    'matvMarkerBtn': 'matv',
    'tankMarkerBtn': 'tank',
    'apcMarkerBtn': 'apc',
    'ifvMarkerBtn': 'ifv',
    'mortarMarkerBtn': 'mortar',
    'radioMarkerBtn': 'radio',
    'repStationMarkerBtn': 'rep',
    'rallyMarkerBtn': 'rally',
    'towMarkerBtn': 'TOW',
    'hatMarkerBtn': 'HAT',
    'mgMarkerBtn': 'MG',
    'hmgMarkerBtn': 'HMG'
};

export function placeMarker(event, markerType) {
    if (!markerType || !state.currentImage) return;
    
    const pos = getMousePos(event);
    const marker = new Image();
    
    // Handle both built-in and custom icons
    marker.src = markerType.includes('data:') ? markerType : `assets/icons/${markerType.toLowerCase()}.png`;
    
    marker.onload = function() {
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
            isCustom: markerType.includes('data:')
        };
        
        state.markers.push(newMarker);
        redrawCanvas();
    };
} 
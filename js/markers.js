import { state } from './state.js';
import { getMousePos } from './drawing.js';
import { redrawCanvas } from './canvas.js';

export const markerButtons = {
    'heliMarkerBtn': 'transporthelo',
    'lavMarkerBtn': 'ifv',
    'logiMarkerBtn': 'truck_logistics',
    'matvMarkerBtn': 'jeep_turret',
    'tankMarkerBtn': 'tank',
    'apcMarkerBtn': 'apc',
    'ifvMarkerBtn': 'trackedifv',
    'mortarMarkerBtn': 'MORTAR',
    'habMarkerBtn': 'hab',
    'repStationMarkerBtn': 'REP',
    'rallyMarkerBtn': 'rally',
    'towMarkerBtn': 'TOW',
    'AAMarkerBtn': 'antiair',
    'mgMarkerBtn': 'mgs',
    'hmgMarkerBtn': 'mgbunker',
    'mortarBoomMarkerBtn': 'MORT',
    'boatlogiMarkerBtn': 'boalogistics',
    'msvMarkerBtn': 'trackedapc_msv',
    'jeepantitankMarkerBtn': 'jeep_antitank',
    'heavyantitankMarkerBtn': 'heavyantitank',
    'minesMarkerBtn': 'MINES',
    'boaopenturretMarkerBtn': 'boaopenturret',
    'trackedjeepMarkerBtn': 'trackedjeep',
    'truck_transportMarkerBtn': 'truck_transport',
};

export function placeMarker(event, markerType) {
    if (!markerType || !state.currentImage) return;
    
    const pos = getMousePos(event);
    const marker = new Image();
    
    // Handle both built-in and custom icons
    marker.src = markerType.includes('data:') ? markerType : `assets/icons/${markerType}.png`;
    
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
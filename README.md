# Squad Map Planning Tool

An interactive web-based tool for planning Squad game strategies. Create, annotate, and share tactical map plans with your team.

## Features

- Load official Squad maps or upload custom maps
- Draw tactical lines with different styles (arrows, X marks, plain lines)
- Place military markers and icons
- Add text annotations
- Erase or clear elements
- Pan and zoom map view
- Download finished plans
- Customizable colors and sizes for all elements

## Usage

1. Select a map from the dropdown or upload your own
2. Use the drawing tools to add tactical lines:
   - Arrow lines for movement paths
   - X lines for targets or objectives
   - Plain lines for boundaries or areas
3. Place markers using the icon toolbar:
   - Military vehicles (tanks, APCs, etc.)
   - Tactical elements (HABs, rallies, etc.)
   - Upload and use custom icons
4. Add text annotations for additional information
5. Use the eraser tool to remove specific elements
6. Click "CLEAR MAP" to start over
7. Download your finished plan

## Technical Details

The tool is built using vanilla JavaScript with a modular architecture:
- MapManager: Handles map loading, pan/zoom, and coordinates
- DrawingTools: Manages tactical line drawing
- MarkerTools: Handles icon placement and management
- TextTools: Controls text annotations
- EraserTools: Manages element removal

## Setup

1. Clone the repository
2. Ensure all assets are in their correct directories
3. Serve the files using a web server
4. Open index.html in a modern browser

## Browser Support

Tested and supported in:
- Chrome (latest)
- Firefox (latest)
- Edge (latest)
- Safari (latest)

## Contributing

Feel free to submit issues and enhancement requests.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

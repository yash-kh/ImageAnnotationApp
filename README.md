# ImageAnnotationApp

## Overview

`ImageAnnotationApp` is an Angular application that allows users to capture images, annotate them with various shapes and lines, and export both the annotated images and their annotations. It utilizes Fabric.js for canvas manipulation and Angular Material for UI components.

## Features

- **Capture Image:** Capture images directly from the device camera.
- **Annotate Image:** Add shapes (polygon, polyline, rectangle) and draw freehand lines on the captured image.
- **Export:** Export the annotated image in PNG or JPG format and save the annotations in JSON format.
- **Undo/Redo:** Navigate through annotation changes with undo and redo functionality.
- **Drawing Mode:** Toggle drawing mode for freehand line drawing with snapping functionality.

## Setup

### Prerequisites

- Node.js (v14 or later)
- Angular CLI (v12 or later)

### Installation

1. **Clone the Repository**

   ```bash
   git clone <repository-url>
   cd ImageAnnotationApp
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```
3. **Build the Project**

   ```bash
   ng build
   ```
4. **Serve the Application**

   ```bash
   ng serve
   ```
## Usage

1. **Capture an Image**

   Click the "Capture Image" button to open the file picker and select an image.

2. **Annotate the Image**

   - Use the controls to add shapes (triangle, rectangle) or draw freehand lines.
   - Use the "Undo" and "Redo" buttons to navigate through annotation changes.

3. **Export**

   - Click "Export Annotations" to save the annotations as a JSON file.
   - Click "Export Image (PNG)" or "Export Image (JPG)" to save the annotated image in the desired format.

4. **Exit Capture Mode**

   Click the "Exit" button to clear the captured image and reset the canvas.

## Assumptions

- The application assumes that images will be captured in a standard format (e.g., JPEG or PNG).
- The application does not handle image rotation beyond 90 degrees (landscape to portrait).
- The canvas size is set to a fixed height of 400 pixels; resizing may be necessary for different screen sizes.

## Libraries and Tools Used

- **Fabric.js:** A library for canvas manipulation that simplifies drawing and interaction on the canvas. It was chosen for its ease of use in creating and managing shapes, lines, and images on the canvas.

- **Angular Material:** A UI component library for Angular that provides a set of reusable and well-designed UI components. It was selected for its consistent styling and ease of integration with Angular applications.

- **Font Awesome:** An icon library that offers a wide range of icons. It was used for its comprehensive set of icons that enhance the user interface with visually appealing and meaningful symbols.


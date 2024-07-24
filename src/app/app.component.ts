import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import * as fabric from 'fabric';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, MatButtonModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements AfterViewInit {
  title = 'ImageAnnotationApp';
  capturedImage: string | ArrayBuffer | null = null;
  history: string[] = [];
  historyIndex = -1;
  isDrawing = false;
  private canvas!: fabric.Canvas;
  private drawingLine: fabric.Line | null = null;
  private snapThreshold = 10;

  @ViewChild('imageCanvas') imageCanvas!: ElementRef<HTMLCanvasElement>;

  ngAfterViewInit(): void {
    const canvasElement = this.imageCanvas.nativeElement;
    const { innerWidth: width } = window;

    this.canvas = new fabric.Canvas(canvasElement, {
      width: width,
      height: 400,
    });
    this.canvas.setWidth(width);
    this.canvas.setHeight(400);
    this.canvas.isDrawingMode = false;

    this.canvas.on('object:modified', this.saveState.bind(this));
    this.canvas.on('mouse:down', this.onMouseDown.bind(this));
    this.canvas.on('mouse:move', this.onMouseMove.bind(this));
    this.canvas.on('mouse:up', this.onMouseUp.bind(this));
  }

  captureImage(event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();

      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const { width, height } = img;
          const canvasWidth = this.canvas.getWidth();
          const canvasHeight = this.canvas.getHeight();

          let scale = Math.min(canvasWidth / width, canvasHeight / height);
          let imgWidth = width * scale;
          let imgHeight = height * scale;

          if (height > width) {
            // Rotate the image
            const rotatedCanvas = document.createElement('canvas');
            const rotatedCtx = rotatedCanvas.getContext('2d');
            if (!rotatedCtx) return;

            rotatedCanvas.width = height;
            rotatedCanvas.height = width;
            rotatedCtx.translate(height / 2, width / 2);
            rotatedCtx.rotate(Math.PI / 2);
            rotatedCtx.drawImage(img, -width / 2, -height / 2);
            const rotatedImg = new Image();
            rotatedImg.onload = () => {
              scale = Math.min(
                canvasWidth / rotatedImg.width,
                canvasHeight / rotatedImg.height
              );
              imgWidth = rotatedImg.width * scale;
              imgHeight = rotatedImg.height * scale;

              this.canvas.setWidth(imgWidth);
              this.canvas.setHeight(imgHeight);
              const backgroundImage = new fabric.Image(rotatedImg, {
                left: 0,
                top: 0,
                scaleX: imgWidth / rotatedImg.width,
                scaleY: imgHeight / rotatedImg.height,
              });
              this.canvas.backgroundImage = backgroundImage;
              this.capturedImage = this.canvas.toDataURL();
              this.saveState();
            };
            rotatedImg.src = rotatedCanvas.toDataURL();
          } else {
            // Set image as background without rotation
            this.canvas.setWidth(imgWidth);
            this.canvas.setHeight(imgHeight);
            const backgroundImage = new fabric.Image(img, {
              left: 0,
              top: 0,
              scaleX: imgWidth / img.width,
              scaleY: imgHeight / img.height,
            });
            this.canvas.backgroundImage = backgroundImage;
            this.capturedImage = this.canvas.toDataURL();
            this.saveState();
          }
        };
        img.src = e.target?.result as string;
      };

      reader.readAsDataURL(file);
    }
  }

  addShape(shapeType: string): void {
    let shape: fabric.Object;
    switch (shapeType) {
      case 'polygon':
        shape = new fabric.Polygon(
          [
            { x: 100, y: 100 },
            { x: 200, y: 100 },
            { x: 150, y: 200 },
          ],
          {
            fill: 'transparent',
            stroke: 'red',
            strokeWidth: 2,
          }
        );
        break;
      case 'polyline':
        shape = new fabric.Polyline(
          [
            { x: 100, y: 100 },
            { x: 300, y: 100 },
          ],
          {
            fill: 'transparent',
            stroke: 'blue',
            strokeWidth: 3,
          }
        );
        break;
      case 'rectangle':
        shape = new fabric.Rect({
          left: 100,
          top: 100,
          width: 150,
          height: 100,
          fill: 'transparent',
          stroke: 'green',
          strokeWidth: 2,
        });
        break;
      default:
        return;
    }
    this.canvas.add(shape);
    this.saveState();
  }

  exportAnnotations(): void {
    const annotations = this.canvas
      .getObjects()
      .map((obj) =>
        obj.toObject([
          'left',
          'top',
          'width',
          'height',
          'angle',
          'points',
          'path',
        ])
      );
    const json = JSON.stringify(annotations);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'annotations.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  exportImage(format: string): void {
    if (format !== 'png' && format !== 'jpg') {
      console.error('Unsupported format');
      return;
    }

    // Increase canvas size for high resolution export
    const scaleFactor = 2;
    const originalWidth = this.canvas.getWidth();
    const originalHeight = this.canvas.getHeight();

    this.canvas.setWidth(originalWidth * scaleFactor);
    this.canvas.setHeight(originalHeight * scaleFactor);
    this.canvas.setZoom(scaleFactor);

    // Render the canvas with high resolution
    this.canvas.renderAll();

    const dataURL = this.canvas.toDataURL();

    // Reset canvas size and zoom
    this.canvas.setWidth(originalWidth);
    this.canvas.setHeight(originalHeight);
    this.canvas.setZoom(1);

    const a = document.createElement('a');
    a.href = dataURL;
    a.download = `annotated-image.${format}`;
    a.click();
  }

  saveState(): void {
    const state = this.canvas.toJSON();
    const stateString = JSON.stringify(state);

    if (
      this.historyIndex === -1 ||
      stateString !== this.history[this.historyIndex]
    ) {
      this.history = this.history.slice(0, this.historyIndex + 1);
      this.history.push(stateString);
      this.historyIndex++;
    }
  }

  undo(): void {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      const previousState = this.history[this.historyIndex];
      this.canvas.loadFromJSON(previousState);
      setTimeout(() => {
        this.canvas.renderAll();
      }, 1);
    }
  }

  redo(): void {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      const nextState = this.history[this.historyIndex];
      this.canvas.loadFromJSON(nextState);
      setTimeout(() => {
        this.canvas.renderAll();
      }, 1);
    }
  }

  exitCaptureMode(): void {
    this.capturedImage = null; // Clear captured image
    this.canvas.clear(); // Clear the canvas
    this.history = []; // Clear the history
    this.historyIndex = -1; // Reset the history index
  }

  toggleDrawingMode(): void {
    this.isDrawing = !this.isDrawing;
    this.canvas.isDrawingMode = this.isDrawing;
  }

  onMouseDown(event: fabric.TEvent): void {
    if (!this.isDrawing) return;
    const pointer = this.canvas.getPointer(event.e);
    this.drawingLine = new fabric.Line(
      [pointer.x, pointer.y, pointer.x, pointer.y],
      {
        stroke: 'blue',
        strokeWidth: 2,
      }
    );
    this.canvas.add(this.drawingLine);
  }

  onMouseMove(event: fabric.TEvent): void {
    if (!this.isDrawing || !this.drawingLine) return;
    const pointer = this.canvas.getPointer(event.e);
    this.drawingLine.set({ x2: pointer.x, y2: pointer.y });
    this.canvas.renderAll();
  }

  onMouseUp(event: fabric.TEvent): void {
    if (!this.isDrawing || !this.drawingLine) return;

    const lines = this.canvas.getObjects('line') as fabric.Line[];
    const pointer = this.canvas.getPointer(event.e);
    this.drawingLine.set({ x2: pointer.x, y2: pointer.y });

    // Check for line snapping
    lines.forEach((line) => {
      if (!this.drawingLine) return;
      if (line !== this.drawingLine) {
        const line1Start = { x: this.drawingLine.x1, y: this.drawingLine.y1 };
        const line1End = { x: this.drawingLine.x2, y: this.drawingLine.y2 };
        const line2Start = { x: line.x1, y: line.y1 };
        const line2End = { x: line.x2, y: line.y2 };

        if (this.getDistance(line1End, line2Start) < this.snapThreshold) {
          this.drawingLine.set({ x2: line2Start.x, y2: line2Start.y });
        } else if (this.getDistance(line1End, line2End) < this.snapThreshold) {
          this.drawingLine.set({ x2: line2End.x, y2: line2End.y });
        } else if (
          this.getDistance(line1Start, line2Start) < this.snapThreshold
        ) {
          this.drawingLine.set({ x1: line2Start.x, y1: line2Start.y });
        } else if (
          this.getDistance(line1Start, line2End) < this.snapThreshold
        ) {
          this.drawingLine.set({ x1: line2End.x, y1: line2End.y });
        }
      }
    });

    this.canvas.renderAll();
    this.saveState();
    this.drawingLine = null;
  }

  getDistance(
    point1: { x: number; y: number },
    point2: { x: number; y: number }
  ): number {
    return Math.sqrt(
      Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2)
    );
  }
}

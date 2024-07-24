import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import * as fabric from 'fabric';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    CommonModule,
    MatButtonModule,
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements AfterViewInit {
  title = 'ImageAnnotationApp';
  capturedImage: string | ArrayBuffer | null = null;

  @ViewChild('imageCanvas') imageCanvas!: ElementRef<HTMLCanvasElement>;
  private canvas!: fabric.Canvas;
  private history: string[] = [];
  private historyIndex = -1;

  ngAfterViewInit(): void {
    const canvasElement = this.imageCanvas.nativeElement;
    this.canvas = new fabric.Canvas(canvasElement, {
      width: canvasElement.width,
      height: canvasElement.height,
    });
    this.canvas.isDrawingMode = false;

    this.canvas.on('object:modified', this.saveState.bind(this));
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
              this.canvas.setWidth(rotatedImg.width);
              this.canvas.setHeight(rotatedImg.height);
              const backgroundImage = new fabric.Image(rotatedImg, {
                left: 0,
                top: 0,
                scaleX: rotatedImg.width / rotatedImg.width,
                scaleY: rotatedImg.height / rotatedImg.height,
              });
              this.canvas.backgroundImage = backgroundImage;
              this.capturedImage = this.canvas.toDataURL();
              this.saveState();
            };
            rotatedImg.src = rotatedCanvas.toDataURL();
          } else {
            // Set image as background without rotation
            this.canvas.setWidth(width);
            this.canvas.setHeight(height);
            const backgroundImage = new fabric.Image(img, {
              left: 0,
              top: 0,
              scaleX: width / img.width,
              scaleY: height / img.height,
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
            { x: 200, y: 100 },
            { x: 150, y: 200 },
          ],
          {
            fill: 'transparent',
            stroke: 'blue',
            strokeWidth: 2,
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
    const dataURL = this.canvas.toDataURL();
    const a = document.createElement('a');
    a.href = dataURL;
    a.download = `annotated-image.${format}`;
    a.click();
  }

  saveState(): void {
    const state = this.canvas.toJSON();
    const stateString = JSON.stringify(state);

    if (this.historyIndex === -1 || stateString !== this.history[this.historyIndex]) {
      this.history = this.history.slice(0, this.historyIndex + 1);
      this.history.push(stateString);
      this.historyIndex++;
      console.log('State saved:', this.historyIndex, this.history);
    }
  }

  undo(): void {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      const previousState = this.history[this.historyIndex];
      console.log('Undo:', JSON.parse(previousState));
      this.canvas.loadFromJSON(previousState, this.canvas.renderAll.bind(this.canvas));
      console.log('Undo:', this.historyIndex);
    }
  }

  redo(): void {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      const nextState = this.history[this.historyIndex];
      this.canvas.loadFromJSON(nextState, this.canvas.renderAll.bind(this.canvas));
      console.log('Redo:', this.historyIndex);
    }
  }
}

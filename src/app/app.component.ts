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

  @ViewChild('imageCanvas') imageCanvas!: ElementRef<HTMLCanvasElement>;
  private canvas!: fabric.Canvas;

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
            { x: 200, y: 100 },
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
}

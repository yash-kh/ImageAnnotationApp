import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  title = 'ImageAnnotationApp';
  capturedImage: string | ArrayBuffer | null = null;

  @ViewChild('imageCanvas') imageCanvas!: ElementRef<HTMLCanvasElement>;

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
          const canvas = this.imageCanvas.nativeElement;
          const ctx = canvas.getContext('2d');
          if (!ctx) return;

          const { width, height } = img;

          if (height > width) {
            // Rotate the image to horizontal mode
            canvas.width = height;
            canvas.height = width;
            ctx.translate(height / 2, width / 2);
            ctx.rotate((90 * Math.PI) / 180);
            ctx.drawImage(img, -width / 2, -height / 2);
          } else {
            // Image is already in horizontal mode
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0);
          }

          this.capturedImage = canvas.toDataURL('image/png');
        };
        img.src = e.target?.result as string;
      };

      reader.readAsDataURL(file);
    }
  }
}

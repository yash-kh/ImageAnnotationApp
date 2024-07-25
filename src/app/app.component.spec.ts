import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import * as fabric from 'fabric';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        CommonModule,
        MatButtonModule,
        RouterOutlet,
        NoopAnimationsModule,
        AppComponent,
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    if (component.canvas) {
      component.canvas.dispose();
    }
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have the 'ImageAnnotationApp' title`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('ImageAnnotationApp');
  });

  it('should initialize canvas after view init', () => {
    expect(component.canvas).toBeDefined();
    expect(component.canvas.getWidth()).toBeGreaterThan(0);
    expect(component.canvas.getHeight()).toBe(400);
  });

  it('should add a polygon shape to the canvas', () => {
    component.addShape('polygon');
    expect(component.canvas.getObjects().length).toBe(1);
    const shape = component.canvas.getObjects()[0] as fabric.Polygon;
    expect(shape.type).toBe('polygon');
  });

  it('should add a rectangle shape to the canvas', () => {
    component.addShape('rectangle');
    expect(component.canvas.getObjects().length).toBe(1);
    const shape = component.canvas.getObjects()[0] as fabric.Rect;
    expect(shape.type).toBe('rect');
  });

  it('should export annotations as JSON', () => {
    const blobSpy = spyOn(window.URL, 'createObjectURL').and.returnValue(
      'test-url'
    );

    component.addShape('rectangle');
    component.exportAnnotations();
    expect(blobSpy).toHaveBeenCalled();
  });

  it('should export image as PNG', () => {
    const downloadSpy = spyOn(document, 'createElement').and.callThrough();

    component.addShape('rectangle');
    component.exportImage('png');
    expect(downloadSpy).toHaveBeenCalledWith('a');
  });

  it('should toggle drawing mode', () => {
    expect(component.isDrawing).toBeFalse();
    component.toggleDrawingMode();
    expect(component.isDrawing).toBeTrue();
    expect(component.canvas.isDrawingMode).toBeTrue();
    component.toggleDrawingMode();
    expect(component.isDrawing).toBeFalse();
    expect(component.canvas.isDrawingMode).toBeFalse();
  });

  it('should undo and redo state changes', () => {
    const rect = new fabric.Rect({ left: 0, top: 0, width: 50, height: 50 });
    component.canvas.add(rect);
    component.saveState();
    expect(component.history.length).toBe(1);
    rect.set('left', 10);
    component.saveState();
    expect(component.history.length).toBe(2);
    component.undo();
    expect(component.historyIndex).toBe(0);
    component.redo();
    expect(component.historyIndex).toBe(1);
  });

  it('should exit capture mode', () => {
    component.capturedImage = 'test-image';

    component.exitCaptureMode();
    expect(component.capturedImage).toBeNull();
    expect(component.canvas.getObjects().length).toBe(0);
    expect(component.history.length).toBe(0);
    expect(component.historyIndex).toBe(-1);
  });
});

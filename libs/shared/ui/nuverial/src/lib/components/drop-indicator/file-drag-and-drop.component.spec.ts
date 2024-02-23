import { ChangeDetectorRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NuverialFileDragAndDropComponent } from './file-drag-and-drop.component';

const file = new File([], 'file');
const fileList: FileList = Object.assign([file], {
  item: (index: number) => (index === 0 ? file : null),
});
const dataTransfer: DataTransfer = { files: fileList } as DataTransfer;
const event: Partial<DragEvent> = {
  dataTransfer,
  preventDefault: jest.fn(),
  stopPropagation: jest.fn(),
  target: null,
};

describe('FileDropIndicatorComponent', () => {
  let component: NuverialFileDragAndDropComponent;
  let fixture: ComponentFixture<NuverialFileDragAndDropComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NuverialFileDragAndDropComponent],
      providers: [ChangeDetectorRef],
    }).compileComponents();

    fixture = TestBed.createComponent(NuverialFileDragAndDropComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set visible to true on dragEnterHandler', () => {
    component.dragEnterHandler(event as DragEvent);

    expect(component.visible).toBe(true);
    expect(component['_counter']).toEqual(1);
  });

  it('should set visible to false on dragLeaveHandler if counter is 1', () => {
    component['_counter'] = 1;
    component.visible = true;

    component.dragLeaveHandler(event as DragEvent);

    expect(component.visible).toBe(false);
    expect(component['_counter']).toEqual(0);
  });

  it('should set not visible to false on dragLeaveHandler if counter is greater than 1', () => {
    component['_counter'] = 4;
    component.visible = true;

    component.dragLeaveHandler(event as DragEvent);

    expect(component.visible).toBe(true);
    expect(component['_counter']).toEqual(3);
  });

  it('should set visible to false and counter to 0 on dropHandler', () => {
    component.visible = true;

    component.dropHandler(event as DragEvent);

    expect(component.visible).toBe(false);
    expect(component['_counter']).toEqual(0);
  });

  describe('event listeners', () => {
    const div = document.createElement('div');

    beforeEach(() => {
      component.targetClassSelector = '.target';
      jest.spyOn(document, 'querySelector').mockReturnValue(div);
      component.ngAfterViewInit();
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should set event listener on document if showOnWindowDrag is true', () => {
      const spy = jest.spyOn(document.documentElement, 'addEventListener');
      component.showOnWindowDrag = true;
      component.ngAfterViewInit();

      expect(spy).toHaveBeenCalledWith('dragenter', expect.any(Function));
    });

    it('should set event listener on target element if targetClassSelector is truthy', () => {
      const spy = jest.spyOn(div, 'addEventListener');
      component.showOnWindowDrag = false;
      component.targetClassSelector = '.target';
      component.ngAfterViewInit();

      expect(spy).toHaveBeenCalledWith('dragenter', expect.any(Function));
    });

    it('should set event listener on default target element if both inputs are falsy', () => {
      component.defaultTarget = { nativeElement: div };
      const spy = jest.spyOn(component.defaultTarget.nativeElement, 'addEventListener');
      component.showOnWindowDrag = false;
      component.targetClassSelector = '';
      component.ngAfterViewInit();

      expect(spy).toHaveBeenCalledWith('dragenter', expect.any(Function));
    });
  });

  it('should show indicator overlay when visible is true', () => {
    component.visible = true;
    fixture.detectChanges();
    const overlay = fixture.debugElement.query(By.css('.drop-indicator'));
    expect(overlay).toBeTruthy();
  });

  it('should call preventDefault on dragOverHandler', () => {
    const spy = jest.spyOn(event, 'preventDefault');
    component.dragOverHandler(event as DragEvent);
    expect(spy).toHaveBeenCalled();
  });
});

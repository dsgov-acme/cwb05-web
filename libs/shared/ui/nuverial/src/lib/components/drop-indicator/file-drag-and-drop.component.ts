import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Input, ViewChild } from '@angular/core';

/**
 * A component that displays a drop indicator when a file is dragged over it.
 * Set pointer-events: none on children to prevent premature dragleave events.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  selector: 'nuverial-file-drag-and-drop',
  standalone: true,
  styleUrls: ['./file-drag-and-drop.component.scss'],
  templateUrl: './file-drag-and-drop.component.html',
})
export class NuverialFileDragAndDropComponent implements AfterViewInit {
  /**
   * Whether the drop indicator should be shown when file is dragged over entire window
   */
  @Input() public showOnWindowDrag = false;

  /**
   * Class selector of the target element to capture drag events. If empty, the component will capture events at the root level.
   */
  @Input() public targetClassSelector = '';

  @ViewChild('defaultTarget') public defaultTarget!: ElementRef;

  public visible = false;

  public target: HTMLElement | null = null;

  private _counter = 0;

  constructor(private readonly _cdr: ChangeDetectorRef) {}

  public ngAfterViewInit(): void {
    let bindTarget: HTMLElement;

    if (this.showOnWindowDrag) {
      bindTarget = document.documentElement;
    } else if (this.targetClassSelector) {
      bindTarget = document.querySelector(this.targetClassSelector) || document.documentElement;
    } else {
      bindTarget = this.defaultTarget.nativeElement;
    }

    bindTarget.addEventListener('dragenter', this.dragEnterHandler.bind(this));
    bindTarget.addEventListener('dragleave', this.dragLeaveHandler.bind(this));
    bindTarget.addEventListener('dragover', this.dragOverHandler.bind(this));
    bindTarget.addEventListener('drop', this.dropHandler.bind(this));
  }

  public dragEnterHandler(event: DragEvent): void {
    event.preventDefault();

    this._counter++;
    if (!this.visible) {
      this.visible = true;
      this._cdr.markForCheck();
    }
  }

  public dragLeaveHandler(event: DragEvent): void {
    event.preventDefault();

    this._counter--;
    if (this._counter === 0) {
      this.visible = false;
      this._cdr.markForCheck();
    }
  }

  public dragOverHandler(event: DragEvent): void {
    event.preventDefault();
  }

  public dropHandler(event: DragEvent): void {
    event.preventDefault();

    this._counter = 0;
    this.visible = false;
    this._cdr.markForCheck();
  }
}

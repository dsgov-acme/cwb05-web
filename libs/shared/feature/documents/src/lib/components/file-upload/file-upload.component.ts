import { FocusMonitor } from '@angular/cdk/a11y';
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Inject,
  Injector,
  Input,
  OnInit,
  Optional,
  Output,
  Self,
  ViewChild,
} from '@angular/core';
import { ControlValueAccessor, FormControl, NgControl, ValidationErrors } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  FormInputBaseDirective,
  NUVERIAL_FILE_UPLOAD_STATUS,
  NuverialButtonComponent,
  NuverialFormFieldErrorComponent,
  NuverialIconComponent,
} from '@dsg/shared/ui/nuverial';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { DeviceDetectorService } from 'ngx-device-detector';
import { BehaviorSubject, Observable, combineLatest, filter, map, startWith, tap } from 'rxjs';
import { FileUploadControl, FileValidationErrors } from '../../models';
import { FileUploadService } from '../../services/file-upload.service';
import { FileStatus, isNullOrEmpty } from '../../utils/file-utils';
import { ITooltipProcessingResult, NuverialFileProcessorTooltipComponent } from '../file-processor-tooltip';
import { FileUploadListComponent } from '../file-upload-list/file-upload-list.component';

/***
 * File upload component that uploads the file. This is an example of how it can be used
 * in the parent component to handle the progress and retrieve the document id
 *
 * ## Usage
 *
 * ```
 * <dsg-file-upload
    [documentTitle]="field.props.label"
    [filePreview]="filePreview"
    [fileStatus]="fileStatus"
    [formControl]="formControl"
    [loading]="isLoading"
    [maxFileSize]="maxFileSize"
    [multiple]="field.props.multiple || false"
    (removeDocument)="onRemoveDocument($event)"
    (uploadDocument)="onUploadDocument($event)"
  ></dsg-file-upload>
 *
 * - `documentTitle`: The title of the document(s) to be uploaded
 * - `filePreview`: Map of the file name and object for file preview and download
 * - `fileStatus`: Map of the file name and FileStatus to track status of each file (upload progress, errors, etc)
 * - `formControl`: The formControl that contains either a single file or an array of files (single or multiple upload)
 * - `loading`: Determines if the file previews are loading
 * - `maxFileSize`: The maximum file size of the uploaded document in MB
 * - `multiple`: Determines if multiple files can be uploaded
 * - `removeDocument`: Event emitter that emits the name of the file to be removed and/or cancelled.
 *      The binded method MUST remove the file entry from fileStatus, filePreview, and formControl
 * - `uploadDocument`: Event emitter that emits the file to be uploaded.
 *      The binded method MUST add the file to fileStatus, filePreview, and formControl
 *
 * Example onRemoveDocument:
 *   public onRemoveDocument(name: string) {
 *     this.fileStatus.delete(name);
 *     this.filePreview.delete(name);
 *     this.fileStatus = structuredClone(this.fileStatus);
 *     this.removeDocument(name);
 *     this._cancelUpload$.next(name);
 *   }
 *
 * Example onUploadDocument:
 *   public onUploadDocument(file: File) {
 *     this._documentFormService
 *       .uploadDocument$(file)
 *       .pipe(
 *         tap(response => {
 *           let status = this.fileStatus.get(file.name);
 *
 *           status = this.updateStatus(status, response);
 *           this.fileStatus.set(file.name, updatedfileStatus);
 *           this.fileStatus = structuredClone(this.fileStatus);
 *
 *           if (response instanceof DocumentModel) {
 *             let updatedFormValue = this.updateFormControlValue(this.formControl?.value);
 *
 *             this.formControl?.setValue(updatedFormValue);
 *
 *             if (status) {
 *               const uploadFinishedStatus = this.updateIploadFinishedStatus(status, response);
 *               this.fileStatus.set(file.name, uploadFinishedStatus);
 *               this.fileStatus = structuredClone(this.fileStatus);
 *               this._changeDetectorRef.markForCheck();
 *             }
 *           }
 *         })
 *       )
 *       .subscribe();
 *   }
 *
 */

@UntilDestroy()
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    NuverialButtonComponent,
    NuverialFormFieldErrorComponent,
    NuverialIconComponent,
    MatFormFieldModule,
    NuverialFileProcessorTooltipComponent,
    MatProgressSpinnerModule,
    FileUploadListComponent,
  ],
  selector: 'dsg-file-upload',
  standalone: true,
  styleUrls: ['./file-upload.component.scss'],
  templateUrl: './file-upload.component.html',
})
export class NuverialFileUploadComponent extends FormInputBaseDirective implements ControlValueAccessor, OnInit {
  // We override formControl here because file upload requires the formControl to be created
  /**
   * The formControl
   */
  @Input() public override formControl: FormControl = new FormControl();

  /**
   * Attached to the aria-label attribute of the host element. This should be considered a required input field, if not provided a warning message will be logged
   */
  @Input() public ariaLabel?: string;

  /**
   * TextInput aria described by
   */
  @Input() public ariaDescribedBy?: string;

  /**
   * The title of the document to be uploaded
   */
  @Input() public documentTitle?: string;

  /**
   * Determines if the drag and drop functionality is available
   */
  @Input() public fileDragDropAvailable = true;

  /**
   * Determines if multiple files can be uploaded
   */
  @Input()
  public multiple = false;

  /**
   * Determines if the file previews are loading
   */
  @Input()
  public loading = false;

  /**
   * Event emitter for newly uploaded documents
   */
  @Output()
  public readonly uploadDocument = new EventEmitter<File>();

  /**
   * Event emitter for removed document name
   */
  @Output()
  public readonly removeDocument = new EventEmitter<string>();

  @ViewChild('fileInput', { static: false }) public fileInput!: ElementRef<HTMLInputElement>;

  public showSingleFileStatusBar = false;
  public singleFileStatus = '';
  public singleFileProgressWidth = '0%';
  public singleFileStatusMessage = '';
  public singleFileProcessors: ITooltipProcessingResult[] = [];
  public showOverlayBackground = false;
  public showPending = false;
  public isProcessing = false;

  public fileUploadControl!: FileUploadControl;
  public imageError = false;
  public statusOptions = NUVERIAL_FILE_UPLOAD_STATUS;
  public iconName = '';

  // Set file preview and also initially populate the fileUploadControl
  public filePreview$ = this._fileUploadService.filePreview$.pipe(
    filter(filePreview => !!filePreview.size),
    tap(filePreview => {
      if (!this.multiple && filePreview.size) {
        const file = filePreview.values().next().value;
        this._setImagePreview(file);
      }

      this.fileUploadControl.addFiles(Array.from(filePreview.values()), false); // emit = false to prevent infinite loop from valueChanges to uploading
    }),
    untilDestroyed(this),
  );

  public fileStatus$ = this._fileUploadService.fileStatus$.pipe(
    tap(fileStatus => {
      this.setStatusIcons(fileStatus);
      this.setProcessing(fileStatus);
      this.setDisplayProperties(fileStatus);
    }),
    untilDestroyed(this),
  );

  public readonly singleFilePreview$: Observable<unknown>;

  private _maxFileSize = 15;

  private readonly _singleFilePreview: BehaviorSubject<unknown> = new BehaviorSubject<unknown>('');

  constructor(
    protected _changeDetectorRef: ChangeDetectorRef,
    protected _elementRef: ElementRef,
    protected readonly _focusMonitor: FocusMonitor,
    private readonly _deviceService: DeviceDetectorService,
    private readonly _fileUploadService: FileUploadService,
    @Inject(Injector) protected override readonly _injector: Injector,
    @Self() @Optional() protected override readonly _ngControl: NgControl,
  ) {
    super();
    this.singleFilePreview$ = this._singleFilePreview.asObservable();
  }

  /**
   * The maximum file size of the uploaded document in MB
   */
  @Input()
  public set maxFileSize(value: number | undefined) {
    if (!value) return;

    this._maxFileSize = value;
  }

  public get maxFileSize(): number {
    return this._maxFileSize;
  }

  public get maxFileSizeBytes() {
    return this.maxFileSize * 1024 * 1024;
  }

  public get isMobile() {
    return this._deviceService.isMobile();
  }

  public ngOnInit(): void {
    this.formControl = this._modelFormControl();
    const showList = !this.multiple;

    this.fileUploadControl = new FileUploadControl(this.maxFileSizeBytes, showList, this.multiple);
    this.fileUploadControl.valueChanges$
      .pipe(
        tap(files => {
          if (files.length > 0) {
            for (const file of files) {
              if (this._isFileSizeError(file)) {
                this._handleSizeError(file);
                this._setFormControlFileSizeError(file);
              } else {
                this.imageError = false;

                this.uploadFile(file);
                this._changeDetectorRef.markForCheck();
              }
            }
          }
        }),
        untilDestroyed(this),
      )
      .subscribe();

    this.fileStatus$.subscribe();
    this.filePreview$.subscribe();

    this._initErrorHandler(this._focusMonitor.monitor(this._elementRef, true).pipe(filter(origin => origin === null)));
  }

  /**
   * Updates the status and status message after an update
   */
  public setStatusIcons(fileStatus: Map<string, FileStatus>): void {
    for (const file of fileStatus.values()) {
      this._setStatusIcon(file.status);
    }
  }

  /**
   * Sets the overall processing status of all files
   */
  public setProcessing(fileStatus: Map<string, FileStatus>): void {
    this.isProcessing = Array.from(fileStatus.values()).some(file => file.status === NUVERIAL_FILE_UPLOAD_STATUS.processing);
  }

  /**
   * Sets the single file display and preview properties
   */
  public setDisplayProperties(fileStatus: Map<string, FileStatus>): void {
    const file = fileStatus.values().next().value;

    if (!file) {
      this.singleFileStatus = '';
      this.singleFileProgressWidth = '0%';
      this.singleFileStatusMessage = '';
      this.singleFileProcessors = [];
    } else {
      this.singleFileStatus = file.status;
      this.singleFileProgressWidth = `${file.uploadProgress}%`;
      this.singleFileStatusMessage = file.statusMessage;
      this.singleFileProcessors = file.processingStatus.processors;
    }

    if (!file || this.multiple) {
      this.showSingleFileStatusBar = false;
      this.showOverlayBackground = false;
      this.showPending = false;
    } else {
      this.showSingleFileStatusBar = file.status !== NUVERIAL_FILE_UPLOAD_STATUS.pending && file.status !== NUVERIAL_FILE_UPLOAD_STATUS.loading;
      const isNotFailed =
        file.status === this.statusOptions.success || file.status === this.statusOptions.pending || file.status === this.statusOptions.processing;
      this.showOverlayBackground = this.imageError || isNotFailed;
      this.showPending = file.status === this.statusOptions.pending;
    }

    this._changeDetectorRef.markForCheck();
  }

  public uploadFile(file: File): void {
    this.imageError = false;
    this.uploadDocument.emit(file);
    if (!this.multiple) this._setImagePreview(file);
  }

  public handleFileSelection(event: Event): void {
    const fileInput = event.target as HTMLInputElement;
    event.stopPropagation();
    if (!fileInput || !fileInput.files) {
      return;
    }

    this.fileUploadControl?.addFiles(Array.from(fileInput.files)); // use addFiles to prevent valueChanges from triggering more than once
    fileInput.value = ''; // reset file input so change event is fired for files of same name
  }

  public stopUpload(name: string): void {
    if (!name) return;

    this.fileUploadControl.removeFile(name);

    this.removeDocument.emit(name);
    this.fileInput.nativeElement.value = '';
  }

  public downloadFile(name: string): void {
    this._fileUploadService.downloadFile(name);
  }

  public handleFileBrowserOpen(event: Event): void {
    // Only stop file upload when restricted to single files
    if (!this.multiple && this.fileUploadControl.size) {
      const currentFileName = this.fileUploadControl.value[0].name;
      this.stopUpload(currentFileName);
    }

    event.stopPropagation();
    this.fileInput.nativeElement.click();
  }

  public removeFile(name: string): void {
    const currentErrors = { ...this.formControl.errors };
    delete currentErrors[`fileSize-${name}`];
    this.formControl.setErrors(currentErrors);

    this.fileUploadControl.removeFile(name);
    this.removeDocument.emit(name);

    this._changeDetectorRef.detectChanges();
  }

  public dropHandler(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();

    const files = event.dataTransfer?.files;

    if (!files || isNullOrEmpty(files)) return;

    if (!this.multiple && this.fileUploadControl.size) {
      const currentFileName = this.fileUploadControl.value[0].name;
      this.stopUpload(currentFileName);
    }

    this.fileUploadControl.addFiles(Array.from(files));
  }

  public dragOverHandler(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  public trackByFn(index: number): number {
    return index;
  }

  protected override _initErrorHandler(events: Observable<unknown>): void {
    this.error$ = combineLatest([
      events.pipe(startWith(null)),
      this.formControl?.statusChanges.pipe(
        filter(status => !!status),
        startWith(null),
      ),
      this.formControl?.valueChanges.pipe(
        filter(value => !!value),
        startWith(null),
      ),
    ]).pipe(
      filter(([event, _status]) => event === null),
      map(([_event, _status, _value]) => {
        const fileSizeError = this._validateFileSizeError();
        const errors = fileSizeError || this._validateRequired();

        return (
          errors &&
          Object.keys(errors).map(key => ({
            [key]: this._validationMessage(key, this.validationMessages),
          }))
        );
      }),
      tap(errors => errors && this.validationErrors.emit(errors)),
      map(errors => (errors ? Object.keys(errors[0]).map(key => errors[0][key])[0] : '')),
    );
  }

  /**
   * Set icon based on the status
   */
  private _setStatusIcon(status: string): void {
    switch (status) {
      case NUVERIAL_FILE_UPLOAD_STATUS.success:
        this.iconName = 'check_circle';
        break;

      case NUVERIAL_FILE_UPLOAD_STATUS.pending:
        break;

      case NUVERIAL_FILE_UPLOAD_STATUS.processing:
        this.iconName = 'refresh';
        break;

      case NUVERIAL_FILE_UPLOAD_STATUS.loading:
        this.iconName = 'refresh';
        break;

      case NUVERIAL_FILE_UPLOAD_STATUS.failure:
        this.iconName = 'error';
        break;

      case NUVERIAL_FILE_UPLOAD_STATUS.unsupportedType:
        this.iconName = 'error';
        break;

      case NUVERIAL_FILE_UPLOAD_STATUS.failedAntivirusCheck:
        this.iconName = 'error';
        break;

      case NUVERIAL_FILE_UPLOAD_STATUS.sizeExceeded:
        this.iconName = 'error';
        break;

      default:
        break;
    }
  }

  private _setFormControlFileSizeError(file: File) {
    const errorKey = `fileSize-${file.name}`;
    this.formControl.setErrors({ [errorKey]: true });
  }

  private _handleSizeError(file: File) {
    const fileSizeMessage = 'File is too large';
    const status = NUVERIAL_FILE_UPLOAD_STATUS.sizeExceeded;
    this._fileUploadService.setErrorFileStatus(file.name, status, fileSizeMessage);
  }

  private _isFileSizeError(file: File): boolean {
    const errors = this.fileUploadControl.getErrors();
    const errorKey = `fileSize-${file.name}`;

    return (
      errors.length > 0 &&
      errors.some((error: FileValidationErrors) => error.name === file.name && Object.prototype.hasOwnProperty.call(error.errors, errorKey))
    );
  }

  private _validateFileSizeError(): ValidationErrors | undefined {
    const formErrors = this.formControl.errors;

    if (formErrors) {
      for (const errorKey of Object.keys(formErrors)) {
        if (errorKey.startsWith('fileSize-')) {
          return { [errorKey]: true };
        }
      }
    }

    return undefined;
  }

  private _validateRequired(): ValidationErrors | undefined {
    if (!this.formControl?.hasError('required')) {
      return undefined;
    } else if (this.formControl.touched && this._isFormEmpty()) {
      return { required: true };
    }

    return undefined;
  }

  private _setImagePreview(file: File): void {
    if (!FileReader || file.size === 0) return;

    const fr = new FileReader();
    fr.onload = (e: ProgressEvent<FileReader>) => {
      this._singleFilePreview.next(e.target?.result);
      this._changeDetectorRef.markForCheck();
    };

    fr.readAsDataURL(file);
  }

  private _isFormEmpty(): boolean {
    return !this.formControl.value || (Array.isArray(this.formControl.value) && !this.formControl.value.length);
  }
}

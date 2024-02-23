import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, Inject, Injector, Input, OnInit, Optional, Self, ViewChild } from '@angular/core';
import { AbstractControl, ControlValueAccessor, NgControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { DocumentModel } from '@dsg/shared/data-access/document-api';
import { FormInputBaseDirective, NuverialButtonComponent, NuverialIconComponent, NuverialSnackBarService } from '@dsg/shared/ui/nuverial';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { DeviceDetectorService } from 'ngx-device-detector';
import { EMPTY, catchError, filter, switchMap, take, tap } from 'rxjs';
import { FileUploadService } from '../../services';
import { DocumentEntry, isNullOrEmpty } from '../../utils/file-utils';
import { FileUploadListComponent } from '../file-upload-list';

@UntilDestroy()
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FileUploadListComponent, NuverialIconComponent, NuverialButtonComponent],
  providers: [FileUploadService],
  selector: 'dsg-rich-text-editor-attachment',
  standalone: true,
  styleUrls: ['./rich-text-editor-attachment.component.scss'],
  templateUrl: './rich-text-editor-attachment.component.html',
})
export class RichTextEditorAttachmentComponent extends FormInputBaseDirective implements ControlValueAccessor, OnInit {
  @ViewChild('fileInput', { static: false }) public fileInput!: ElementRef<HTMLInputElement>;

  @Input()
  public key = '';

  @Input()
  public transactionId = '';

  private _uploading = false;
  private _hasError = false;

  private readonly _uploading$ = this._fileUploadService.uploading$.pipe(
    tap(isUploading => {
      this._uploading = isUploading;
      this.formControl.updateValueAndValidity();
    }),
  );

  private readonly _hasError$ = this._fileUploadService.hasError$.pipe(
    tap(hasError => {
      this._hasError = hasError;
      this.formControl.updateValueAndValidity();
    }),
  );

  constructor(
    private readonly _fileUploadService: FileUploadService,
    private readonly _deviceService: DeviceDetectorService,
    private readonly _nuverialSnackBarService: NuverialSnackBarService,
    @Inject(Injector) protected override readonly _injector: Injector,
    @Self() @Optional() protected override readonly _ngControl: NgControl,
  ) {
    super();
    this._ngControl && (this._ngControl.valueAccessor = this);
  }

  public get isMobile() {
    return this._deviceService.isMobile();
  }

  public ngOnInit(): void {
    this.formControl = this._modelFormControl();
    this.formControl.setValidators(this._attachmentUploadValidator());

    this._uploading$.pipe(untilDestroyed(this)).subscribe();
    this._hasError$.pipe(untilDestroyed(this)).subscribe();
  }

  public uploadDocuments(files: File[]) {
    if (isNullOrEmpty(files)) return;

    files.forEach(file => {
      this.formControl.updateValueAndValidity();

      const document$ = this._fileUploadService.uploadDocument$(file).pipe(
        filter(this._responseIsDocumentModel),
        take(1),
        tap(document => {
          let updatedFormValue = this.formControl.value;

          // Update value depending on multiple or single
          if (!updatedFormValue) updatedFormValue = [];

          updatedFormValue.push({
            documentId: document.documentId,
            filename: file.name,
          });

          this.formControl.setValue(updatedFormValue);
          this.formControl.updateValueAndValidity();
        }),
        catchError(_error => {
          const message = _error.error?.message;
          this._nuverialSnackBarService.notifyApplicationError(message);

          return EMPTY;
        }),
      );

      document$
        .pipe(
          switchMap(document => this._fileUploadService.getProcessingResults$(file, document.documentId)),
          catchError(_error => {
            const message = _error.error?.message;
            this._nuverialSnackBarService.notifyApplicationError(message);

            return EMPTY;
          }),
          take(1),
        )
        .subscribe();
    });
  }

  public removeDocument(name: string) {
    this._fileUploadService.removeFile(name);

    const updatedValue = this.formControl.value?.filter((file: DocumentEntry) => file.filename !== name);
    this.formControl.setValue(updatedValue);
    this.formControl.updateValueAndValidity();
  }

  public handleFileSelection(event: Event): void {
    const fileInput = event.target as HTMLInputElement;
    event.stopPropagation();
    if (!fileInput || !fileInput.files) {
      return;
    }

    this.uploadDocuments(Array.from(fileInput.files));
    fileInput.value = ''; // reset file input so change event is fired for files of same name
  }

  public handleFileBrowserOpen(event: Event): void {
    event.stopPropagation();
    this.fileInput.nativeElement.click();
  }

  public downloadFile(name: string): void {
    this._fileUploadService.downloadFile(name);
  }

  private _attachmentUploadValidator(): ValidatorFn {
    return (_control: AbstractControl): ValidationErrors | null => {
      const errors = _control.errors || {};

      if (this._uploading) {
        errors['uploading'] = true;
      } else {
        delete errors['uploading'];
      }

      if (this._hasError) {
        errors['hasError'] = true;
      } else {
        delete errors['hasError'];
      }

      if (Object.keys(errors).length === 0) {
        return null;
      }

      return errors;
    };
  }

  private _responseIsDocumentModel(response: number | DocumentModel | undefined): response is DocumentModel {
    return response instanceof DocumentModel;
  }
}

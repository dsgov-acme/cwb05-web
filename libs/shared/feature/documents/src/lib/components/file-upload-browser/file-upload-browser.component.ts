import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { AbstractControl, FormControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { DocumentModel } from '@dsg/shared/data-access/document-api';
import { NuverialSnackBarService } from '@dsg/shared/ui/nuverial';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { EMPTY, catchError, filter, finalize, take, tap } from 'rxjs';
import { FileUploadService } from '../../services';
import { NuverialFileUploadComponent } from '../file-upload/file-upload.component';

interface DocumentEntry {
  documentId: string;
  filename: string;
}

@UntilDestroy()
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NuverialFileUploadComponent],
  providers: [FileUploadService],
  selector: 'dsg-file-upload-browser',
  standalone: true,
  styleUrls: ['./file-upload-browser.component.scss'],
  templateUrl: './file-upload-browser.component.html',
})
export class FileUploadBrowserComponent implements OnInit {
  @Input()
  public formControl = new FormControl();

  @Input()
  public multiple = false;

  @Input()
  public loading = false;

  @Input()
  public required = false;

  @Input()
  public label = '';

  @Input()
  public key = '';

  @Input()
  public transactionId = '';

  private _maxFileSize = 15;
  private _uploading = false;
  private _hasError = false;

  private readonly _uploading$ = this._fileUploadService.uploading$.pipe(
    tap(isUploading => {
      this._uploading = isUploading;
      this.formControl.updateValueAndValidity();
    }),
    untilDestroyed(this),
  );

  private readonly _hasError$ = this._fileUploadService.hasError$.pipe(
    tap(hasError => {
      this._hasError = hasError;
      this.formControl.updateValueAndValidity();
    }),
    untilDestroyed(this),
  );

  constructor(
    private readonly _fileUploadService: FileUploadService,
    private readonly _changeDetectorRef: ChangeDetectorRef,
    private readonly _nuverialSnackBarService: NuverialSnackBarService,
  ) {}

  public get maxFileSize(): number {
    return this._maxFileSize;
  }

  @Input()
  public set maxFileSize(value: number | undefined) {
    if (value) {
      this._maxFileSize = value;
    }
  }

  public ngOnInit(): void {
    this._initFilePreview();

    this.formControl.setValidators(this._fileUploadValidator(this.required));

    this._uploading$.subscribe();
    this._hasError$.subscribe();
  }

  public onUploadDocument(file: File) {
    const document$ = this._fileUploadService.uploadDocument$(file).pipe(
      filter(this._responseIsDocumentModel),
      take(1),
      tap(document => {
        let updatedFormValue = this.formControl.value;

        // Update value depending on multiple or single
        if (this.multiple) {
          if (!updatedFormValue) updatedFormValue = [];

          updatedFormValue.push({
            documentId: document.documentId,
            filename: file.name,
          });
        } else {
          updatedFormValue = {
            ...updatedFormValue,
            documentId: document.documentId,
            filename: file.name,
          };
        }

        this.formControl.setValue(updatedFormValue);
        this.formControl.updateValueAndValidity();
      }),
      catchError(_error => {
        const message = _error.error?.message;
        this._nuverialSnackBarService.notifyApplicationError(message);

        return EMPTY;
      }),
    );

    this._fileUploadService
      .processDocument$(document$, file, this.transactionId, this.key)
      .pipe(
        take(1),
        catchError(_ => {
          this._nuverialSnackBarService.notifyApplicationError();

          return EMPTY;
        }),
      )
      .subscribe();
  }

  public removeDocument(name: string) {
    const currentErrors = { ...this.formControl.errors };
    delete currentErrors[`fileSize-${name}`];
    this.formControl.setErrors(currentErrors);

    if (Array.isArray(this.formControl.value)) {
      const updatedValue = this.formControl.value.filter((file: DocumentEntry) => file.filename !== name);
      this.formControl.setValue(updatedValue);
    } else {
      this.formControl.setValue(null);
    }
  }

  public onRemoveDocument(name: string) {
    this._fileUploadService.removeFile(name);
    this.removeDocument(name);
    this.formControl.updateValueAndValidity();
  }

  public openDocument(index: number) {
    const document = this.multiple ? this.formControl.value[index] : this.formControl.value;

    this._fileUploadService.openDocument(document.documentId);
  }

  public trackByFn(index: number): number {
    return index;
  }

  private _fileUploadValidator(required: boolean): ValidatorFn {
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

      if (required && (!this.formControl.value || this.formControl.value.length === 0)) {
        errors['required'] = true;
      } else {
        delete errors['required'];
      }

      if (Object.keys(errors).length === 0) {
        return null;
      }

      return errors;
    };
  }

  private _initFilePreview(): void {
    // Get all existing documents
    this.loading = true;

    let documentList: Array<DocumentEntry | undefined> = [];
    if (Array.isArray(this.formControl.value)) {
      documentList = this.formControl.value;
    } else {
      documentList.push(this.formControl.value);
    }

    this._fileUploadService
      .loadDocuments$(documentList)
      .pipe(
        catchError(_ => {
          this._nuverialSnackBarService.notifyApplicationError();

          return EMPTY;
        }),
        finalize(() => {
          this.loading = false;
          this._changeDetectorRef.markForCheck();
        }),
      )
      .subscribe();
  }

  private _responseIsDocumentModel(response: number | DocumentModel | undefined): response is DocumentModel {
    return response instanceof DocumentModel;
  }
}

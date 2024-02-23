import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { DocumentModel, IProcessingResultSchema, checkIfDocumentShouldDisplayErrors } from '@dsg/shared/data-access/document-api';
import { NUVERIAL_FILE_UPLOAD_STATUS } from '@dsg/shared/ui/nuverial';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import {
  BehaviorSubject,
  EMPTY,
  Observable,
  Subject,
  catchError,
  concatMap,
  filter,
  finalize,
  from,
  mergeMap,
  of,
  switchMap,
  take,
  takeUntil,
  tap,
  throwError,
} from 'rxjs';
import { FileStatus, getStatusFromCode, getStatusMessage } from '../utils';
import { DocumentFormService } from './document-form.service';

interface FormControlEntry {
  documentId: string;
  filename: string;
}

interface ProcessingStatus {
  isProcessing: boolean;
}

interface UploadingStatus {
  isUploading: boolean;
}

interface ErrorStatus {
  hasError: boolean;
}

const failedStatus = { failed: true, processors: [] };

@UntilDestroy()
@Injectable({ providedIn: 'root' })
export class FileUploadService {
  /**
   * An observable of the fileStatus map, updated whenever the fileStatus changes.
   */
  public fileStatus$: Observable<Map<string, FileStatus>>;

  /**
   * An observable of the filePreview map, updated whenever the filePreview changes.
   */
  public filePreview$: Observable<Map<string, File>>;

  /**
   * An observable of the overall processing status of the service.
   * True if at least one file is processing, false otherwise.
   */
  public processing$: Observable<boolean>;

  /**
   * An observable of the overall uploading status of the service.
   * True if at least one file is uploading, false otherwise.
   */
  public uploading$: Observable<boolean>;

  public hasError$: Observable<boolean>;

  private readonly _fileStatus: BehaviorSubject<Map<string, FileStatus>> = new BehaviorSubject(new Map());
  private readonly _filePreview: BehaviorSubject<Map<string, File>> = new BehaviorSubject(new Map());
  private readonly _processing: BehaviorSubject<boolean> = new BehaviorSubject(false);
  private readonly _uploading: BehaviorSubject<boolean> = new BehaviorSubject(false);
  private readonly _hasError: BehaviorSubject<boolean> = new BehaviorSubject(false);

  // Do not modify directly. Mutex is achieved with subjects and concatMap.
  private _numProcessingMutex = 0;
  private _numUploadingMutex = 0;
  private _numErrors = 0;

  private readonly _processingSubject = new Subject<ProcessingStatus>();
  private readonly _uploadingSubject = new Subject<UploadingStatus>();
  private readonly _errorSubject = new Subject<ErrorStatus>();
  private readonly _cancelUpload$ = new Subject<string>();

  private readonly _updateProcessing$ = this._processingSubject.pipe(
    concatMap(status => of(status)),
    tap(status => {
      status.isProcessing ? this._numProcessingMutex++ : this._numProcessingMutex--;
      this._processing.next(this._numProcessingMutex > 0);
    }),
    untilDestroyed(this),
  );

  private readonly _updateUploading$ = this._uploadingSubject.pipe(
    concatMap(status => of(status)),
    tap(status => {
      status.isUploading ? this._numUploadingMutex++ : this._numUploadingMutex--;
      this._uploading.next(this._numUploadingMutex > 0);
    }),
    untilDestroyed(this),
  );

  private readonly _updateHasError$ = this._errorSubject.pipe(
    concatMap(status => of(status)),
    tap(status => {
      status.hasError ? this._numErrors++ : this._numErrors--;
      this._hasError.next(this._numErrors > 0);
    }),
    untilDestroyed(this),
  );

  constructor(private readonly _documentFormService: DocumentFormService) {
    this.fileStatus$ = this._fileStatus.asObservable();
    this.filePreview$ = this._filePreview.asObservable();
    this.processing$ = this._processing.asObservable();
    this.uploading$ = this._uploading.asObservable();
    this.hasError$ = this._hasError.asObservable();

    this._updateUploading$.subscribe();
    this._updateProcessing$.subscribe();
    this._updateHasError$.subscribe();
  }

  /**
   * Load the files and populate the fileStatus and filePreview observables.
   *
   * @param documentList The list of documents to load
   * @returns An observable of the processing results
   */
  public loadDocuments$(documentList: Array<FormControlEntry | undefined>): Observable<IProcessingResultSchema[]> {
    const initialProcessingStatus = {
      failed: false,
      processors: [],
    };

    const filteredDocumentList = documentList.filter((document): document is FormControlEntry => !!document);

    // Populate fileStatus to show all files in order
    filteredDocumentList.forEach(document => {
      const fileName = document.filename;
      const documentId = document.documentId;

      if (!fileName || !documentId) return;

      this._setFileStatus(fileName, {
        name: fileName,
        processingStatus: initialProcessingStatus,
        status: NUVERIAL_FILE_UPLOAD_STATUS.loading,
        statusMessage: getStatusMessage(NUVERIAL_FILE_UPLOAD_STATUS.loading),
        uploadProgress: 100,
      });
    });

    return from(filteredDocumentList).pipe(
      filter(document => !!document.documentId),
      mergeMap(document => {
        const documentId = document.documentId;
        const fileName = document.filename;
        if (!documentId || !fileName) return EMPTY;

        return this._documentFormService.getDocumentFileDataById$(documentId).pipe(
          tap(blob => {
            const loadedFile = new File([blob], fileName, { type: blob.type }); // Unfortunately getDocumentFileDataById$ does not return the file name

            this._setFilePreview(fileName, loadedFile);
          }),
          switchMap(_ => {
            return this._documentFormService.getProcessingResultsById$(documentId, () => {
              this._setFileStatus(fileName, {
                name: fileName,
                processingStatus: initialProcessingStatus,
                status: NUVERIAL_FILE_UPLOAD_STATUS.processing,
                statusMessage: getStatusMessage(NUVERIAL_FILE_UPLOAD_STATUS.processing),
                uploadProgress: 100,
              });
            });
          }),
          tap(processingResult => {
            const failed = checkIfDocumentShouldDisplayErrors(processingResult) > 0;
            const processingStatus = {
              failed: failed,
              processors: processingResult,
            };

            const status = failed ? NUVERIAL_FILE_UPLOAD_STATUS.failure : NUVERIAL_FILE_UPLOAD_STATUS.success;
            this._setFileStatus(fileName, {
              name: fileName,
              processingStatus: processingStatus,
              status,
              statusMessage: getStatusMessage(status),
              uploadProgress: 100,
            });
          }),
          catchError(_error => {
            // Catch any errors and update the fileStatus
            this._errorSubject.next({ hasError: true });

            this._setFileStatus(fileName, this._getErrorFileStatus(_error, fileName));

            return throwError(() => _error);
          }),
          // We handle unsubscribe in 3 ways here because this is a polling observable and we want to complete if this cancels or we navigate away
          take(1),
          takeUntil(this._cancelUpload$),
          untilDestroyed(this),
        );
      }),
      takeUntil(this._cancelUpload$.asObservable()),
      untilDestroyed(this),
    );
  }

  /**
   * Uploads the file and updates the fileStatus and filePreview observables.
   * Returns a polling observable containing the progress or the successfully uploaded document model.
   * To complete this observable after the upload is finished, filter the observable for DocumentModel and take(1).
   * - updates filePreview with the file
   * - updates fileStatus with the upload progress
   * - use catchError when subscribing to the returned observable
   *
   * @param file The file to upload
   * @returns An observable of the upload progress or the successfully uploaded document model
   */
  public uploadDocument$(file: File): Observable<number | DocumentModel | undefined> {
    if (this._fileStatus.value.get(file.name)) return of(undefined);

    this._uploadingSubject.next({ isUploading: true });

    return this._documentFormService.uploadDocument$(file).pipe(
      tap(response => {
        let status = this._fileStatus.value.get(file.name);

        // Add the file to the fileStatus map if it doesn't exist
        if (!status) {
          const processingStatus = { failed: false, processors: [] };
          this._setFileStatus(file.name, {
            name: file.name,
            processingStatus,
            status: NUVERIAL_FILE_UPLOAD_STATUS.pending,
            statusMessage: getStatusMessage(NUVERIAL_FILE_UPLOAD_STATUS.pending),
            uploadProgress: 0,
          });
          this._setFilePreview(file.name, file);

          status = this._fileStatus.value.get(file.name);
        }

        // Update the upload progress
        if (typeof response === 'number' && status) {
          const updatedfileStatus = { ...status, uploadProgress: response };
          this._setFileStatus(file.name, updatedfileStatus);

          status = this._fileStatus.value.get(file.name);
        }

        // Update file processing and upload status when upload finishes
        if (response instanceof DocumentModel) {
          if (status) {
            const updatedfileStatus = {
              ...status,
              status: NUVERIAL_FILE_UPLOAD_STATUS.processing,
              statusMessage: getStatusMessage(NUVERIAL_FILE_UPLOAD_STATUS.processing),
            };
            this._setFileStatus(file.name, updatedfileStatus);
          }
        }
      }),
      catchError(_error => {
        // Catch any errors and update the fileStatus
        this._errorSubject.next({ hasError: true });

        this._setFileStatus(file.name, this._getErrorFileStatus(_error, file.name, 0));

        return throwError(() => _error);
      }),
      finalize(() => {
        this._uploadingSubject.next({ isUploading: false });
      }),
      // We handle unsubscribe in 2 ways here because this is a polling observable and we want to complete if this cancels or we navigate away
      takeUntil(this._cancelUpload$.pipe(filter(name => name === file.name))),
      untilDestroyed(this),
    );
  }

  /**
   * Initiates the processing of the document and updates the fileStatus observable.
   * - updates the overall processing status of the service
   * - use catchError when subscribing to the returned observable
   *
   * @param document$ An observable of the document to process
   * @param file The file to process
   * @param transactionId The id of the current transaction
   * @param key The key of the document component
   * @returns An observable of the processing results
   */
  public processDocument$(document$: Observable<DocumentModel>, file: File, transactionId: string, key: string): Observable<IProcessingResultSchema[]> {
    this._processingSubject.next({ isProcessing: true });

    return document$.pipe(
      switchMap(document => this._documentFormService.processDocument$(transactionId, document.documentId, key.toString() || '')),
      tap(processingResult => {
        const failed = checkIfDocumentShouldDisplayErrors(processingResult) > 0;
        const processingStatus = {
          failed,
          processors: processingResult,
        };

        const status = failed ? NUVERIAL_FILE_UPLOAD_STATUS.failure : NUVERIAL_FILE_UPLOAD_STATUS.success;

        const fileStatus = this._fileStatus.value.get(file.name);
        if (fileStatus) this._setFileStatus(file.name, { ...fileStatus, processingStatus, status, statusMessage: getStatusMessage(status) });
      }),
      catchError(_error => {
        // Catch any error in processing (e.g. antivirus failure) and update the fileStatus
        this._errorSubject.next({ hasError: true });

        this._setFileStatus(file.name, this._getErrorFileStatus(_error, file.name));

        return throwError(() => _error);
      }),
      finalize(() => {
        this._processingSubject.next({ isProcessing: false });
      }),
    );
  }

  /**
   * Get the processing results of the document
   * - also updates the file status
   *
   * @param file The file object (document) to get the processing results for
   * @param documentId The id of the document to get the processing results for
   * @returns An observable of the processing results
   */
  public getProcessingResults$(file: File, documentId: string): Observable<IProcessingResultSchema[]> {
    return this._documentFormService.getProcessingResultsById$(documentId).pipe(
      tap(processingResult => {
        const failed = checkIfDocumentShouldDisplayErrors(processingResult) > 0;
        const processingStatus = {
          failed: failed,
          processors: processingResult,
        };
        const status = failed ? NUVERIAL_FILE_UPLOAD_STATUS.failure : NUVERIAL_FILE_UPLOAD_STATUS.success;

        const fileStatus = this._fileStatus.value.get(file.name);
        if (fileStatus) this._setFileStatus(file.name, { ...fileStatus, processingStatus: processingStatus, status, statusMessage: getStatusMessage(status) });
      }),
      catchError(_error => {
        // Catch any error in processing (e.g. antivirus failure) and update the fileStatus
        this._errorSubject.next({ hasError: true });

        this._setFileStatus(file.name, this._getErrorFileStatus(_error, file.name));

        return throwError(() => _error);
      }),
    );
  }

  /**
   * Removes the file from the fileStatus and filePreview observables and cancels any upload related to it.
   *
   * @param name The name of the file to remove
   */
  public removeFile(name: string): void {
    this._deleteFileStatus(name);
    this._deleteFilePreview(name);
    this._cancelUpload$.next(name);
  }

  /**
   * Opens the file associated with the documentId
   *
   * @param name The id of the document to open
   */
  public openDocument(documentId: string): void {
    this._documentFormService.openDocument$(documentId).pipe(take(1)).subscribe();
  }

  public downloadFile(name: string): void {
    const file = this._filePreview.value.get(name);
    if (!file) return;

    const fileUrl = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = name;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(fileUrl);
  }

  public setErrorFileStatus(name: string, status: string, errorMessage: string) {
    const fileStatus = {
      isLoading: false,
      isProcessing: false,
      isUploading: false,
      name: name,
      processingStatus: { failed: true, processors: [] },
      status: status,
      statusMessage: errorMessage,
      uploadProgress: 0,
    };
    this._setFileStatus(name, fileStatus);
  }

  private _getErrorFileStatus(error: HttpErrorResponse, fileName: string, uploadProgress = 100): FileStatus {
    const errorCode = error.status;
    const status = getStatusFromCode(errorCode);

    return {
      errorCode,
      name: fileName,
      processingStatus: failedStatus,
      status,
      statusMessage: getStatusMessage(status),
      uploadProgress,
    };
  }

  private _setFileStatus(name: string, status: FileStatus) {
    const currentValue = this._fileStatus.value;
    currentValue.set(name, status);
    this._fileStatus.next(currentValue);
  }

  private _setFilePreview(name: string, file: File) {
    const currentValue = this._filePreview.value;
    currentValue.set(name, file);
    this._filePreview.next(currentValue);
  }

  private _deleteFileStatus(name: string) {
    const currentValue = this._fileStatus.value;
    const status = currentValue.get(name)?.status;
    if (status === NUVERIAL_FILE_UPLOAD_STATUS.unsupportedType || status === NUVERIAL_FILE_UPLOAD_STATUS.failedAntivirusCheck) {
      this._errorSubject.next({ hasError: false });
    }
    currentValue.delete(name);
    this._fileStatus.next(currentValue);
  }

  private _deleteFilePreview(name: string) {
    const currentValue = this._filePreview.value;
    currentValue.delete(name);
    this._filePreview.next(currentValue);
  }
}

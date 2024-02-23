import { TestBed, fakeAsync, tick } from '@angular/core/testing';

import { DocumentModel, IProcessingResultSchema } from '@dsg/shared/data-access/document-api';
import { NUVERIAL_FILE_UPLOAD_STATUS } from '@dsg/shared/ui/nuverial';
import { HttpTestingModule } from '@dsg/shared/utils/http';
import { MockProvider } from 'ng-mocks';
import { EMPTY, catchError, of, take, throwError } from 'rxjs';
import { IProcessingStatus } from '../components';
import { getStatusMessage } from '../utils';
import { DocumentFormService } from './document-form.service';
import { FileUploadService } from './file-upload.service';

const mockReadyProcessingResult: IProcessingResultSchema[] = [
  {
    processorId: 'antivirus-scanner',
    result: {
      code: 'READY',
      message: 'Document is available for download',
      shouldDisplayError: false,
      status: 200,
    },
    status: 'COMPLETE',
    timestamp: '2023-08-02T16:03:26.925543Z',
  },
];

const mockFailedProcessingResult: IProcessingResultSchema[] = [
  {
    processorId: 'docai-id-proofing',
    result: {
      allPass: false,
      shouldDisplayError: true,
      signals: [{ isPass: false, mentionText: 'test', name: 'test' }],
    },
    status: 'COMPLETE',
    timestamp: '2023-08-02T16:03:26.925543Z',
  },
];

const processingStatus: IProcessingStatus = {
  failed: false,
  processors: [],
};
const uploadingFileStatus = {
  name: 'test.doc',
  processingStatus: processingStatus,
  status: NUVERIAL_FILE_UPLOAD_STATUS.pending,
  statusMessage: getStatusMessage(NUVERIAL_FILE_UPLOAD_STATUS.pending),
  uploadProgress: 0,
};
const processingFileStatus = {
  name: 'test.doc',
  processingStatus: processingStatus,
  status: NUVERIAL_FILE_UPLOAD_STATUS.processing,
  statusMessage: getStatusMessage(NUVERIAL_FILE_UPLOAD_STATUS.processing),
  uploadProgress: 100,
};

const documentModel = new DocumentModel({ ['document_id']: '1' });
const file = new File([], 'test.doc', { type: 'text/plain' });

describe('FileUploadService', () => {
  let service: FileUploadService;
  let documentFormService: DocumentFormService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpTestingModule],
      providers: [
        MockProvider(DocumentFormService, {
          getDocumentFileDataById$: jest.fn().mockImplementation(() => of(file)),
          getProcessingResultsById$: jest.fn().mockImplementation(() => of(mockReadyProcessingResult)),
          openDocument$: jest.fn().mockImplementation(() => of(new Blob())),
          processDocument$: jest.fn().mockImplementation(() => of(mockReadyProcessingResult)),
          uploadDocument$: jest.fn().mockImplementation(() => of(documentModel)),
        }),
      ],
    });
    service = TestBed.inject(FileUploadService);
    documentFormService = TestBed.inject(DocumentFormService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('uploadDocuments', () => {
    it('should upload document', done => {
      const uploadSpy = jest.spyOn(documentFormService, 'uploadDocument$');

      service.uploadDocument$(file).subscribe(_ => {
        expect(uploadSpy).toBeCalledWith(file);

        done();
      });
    });

    it('should not upload document if it exists in fileStatus', done => {
      const uploadSpy = jest.spyOn(documentFormService, 'uploadDocument$');
      service['_fileStatus'].next(new Map([[file.name, processingFileStatus]]));

      service.uploadDocument$(file).subscribe(_ => {
        expect(uploadSpy).not.toBeCalledWith(file);

        done();
      });
    });

    it('should add to fileStatus with correct progress when document is uploaded', done => {
      const spy = jest.spyOn(service as any, '_setFileStatus');
      jest.spyOn(documentFormService, 'uploadDocument$').mockImplementation(() => of(80));

      service.uploadDocument$(file).subscribe(_ => {
        expect(spy).toHaveBeenCalledTimes(2);
        expect(spy).toHaveBeenNthCalledWith(1, file.name, uploadingFileStatus);
        expect(spy).toHaveBeenNthCalledWith(2, file.name, {
          name: file.name,
          processingStatus: processingStatus,
          status: NUVERIAL_FILE_UPLOAD_STATUS.pending,
          statusMessage: getStatusMessage(NUVERIAL_FILE_UPLOAD_STATUS.pending),
          uploadProgress: 80,
        });
        expect(service['_fileStatus'].value.get(file.name)).toEqual({
          name: file.name,
          processingStatus: processingStatus,
          status: NUVERIAL_FILE_UPLOAD_STATUS.pending,
          statusMessage: getStatusMessage(NUVERIAL_FILE_UPLOAD_STATUS.pending),
          uploadProgress: 80,
        });

        done();
      });
    });

    it('should initially add to filePreview when document is uploaded', done => {
      const spy = jest.spyOn(service as any, '_setFilePreview');
      jest.spyOn(documentFormService, 'uploadDocument$').mockImplementation(() => of(0));

      service.uploadDocument$(file).subscribe(_ => {
        expect(spy).toHaveBeenCalledWith(file.name, file);
        expect(service['_filePreview'].value.get(file.name)).toEqual(file);

        done();
      });
    });

    it('should set fileStatus and return documentModel when finished', done => {
      const spy = jest.spyOn(service as any, '_setFileStatus');
      jest.spyOn(documentFormService, 'uploadDocument$').mockImplementation(() => of(documentModel));

      service.uploadDocument$(file).subscribe(model => {
        expect(spy).toBeCalledWith(file.name, { ...uploadingFileStatus });
        expect(model).toEqual(documentModel);

        done();
      });
    });

    it('should emit _cancelUpload$ with file name and cancel the corresponding file upload', async () => {
      const cancelSpy = jest.spyOn(service['_cancelUpload$'], 'next');
      const deleteFileStatusSpy = jest.spyOn(service as any, '_deleteFileStatus');
      const deleteFilePreviewSpy = jest.spyOn(service as any, '_deleteFilePreview');

      service['_setFilePreview'](file.name, file);
      service['_setFileStatus'](file.name, {
        name: file.name,
        processingStatus: processingStatus,
        status: NUVERIAL_FILE_UPLOAD_STATUS.pending,
        statusMessage: getStatusMessage(NUVERIAL_FILE_UPLOAD_STATUS.pending),
        uploadProgress: 80,
      });

      service.removeFile(file.name);

      expect(cancelSpy).toBeCalledWith(file.name);
      expect(deleteFileStatusSpy).toBeCalledWith(file.name);
      expect(deleteFilePreviewSpy).toBeCalledWith(file.name);
    });

    it('should catch error and emit _uploadingSubject with isUploading set to false and emit _errorSubject with hasError set to true', fakeAsync(() => {
      const uploadingSpy = jest.spyOn(service['_uploadingSubject'], 'next');
      const errorSpy = jest.spyOn(service['_errorSubject'], 'next');
      const setFileStatusSpy = jest.spyOn(service as any, '_setFileStatus');

      jest.spyOn(documentFormService, 'uploadDocument$').mockImplementation(() => throwError(() => ({ status: 415 })));

      service
        .uploadDocument$(file)
        .pipe(
          take(1),
          catchError(_ => EMPTY),
        )
        .subscribe();
      tick();

      expect(uploadingSpy).toBeCalledWith({ isUploading: false });
      expect(errorSpy).toBeCalledWith({ hasError: true });
      expect(setFileStatusSpy).toBeCalledWith('test.doc', {
        errorCode: 415,
        name: file.name,
        processingStatus: { failed: true, processors: [] },
        status: NUVERIAL_FILE_UPLOAD_STATUS.unsupportedType,
        statusMessage: getStatusMessage(NUVERIAL_FILE_UPLOAD_STATUS.unsupportedType),
        uploadProgress: 0,
      });
    }));
  });

  describe('loadDocuments', () => {
    it('should set file status for each file', () => {
      const spy = jest.spyOn(service as any, '_setFileStatus');
      const files = [
        { documentId: '1', filename: 'test.doc' },
        { documentId: '2', filename: 'test2.doc' },
      ];

      service.loadDocuments$(files);

      expect(spy).toHaveBeenCalledTimes(2);
      expect(spy).toHaveBeenNthCalledWith(1, 'test.doc', {
        name: 'test.doc',
        processingStatus: processingStatus,
        status: NUVERIAL_FILE_UPLOAD_STATUS.loading,
        statusMessage: '',
        uploadProgress: 100,
      });
      expect(spy).toHaveBeenNthCalledWith(2, 'test2.doc', {
        name: 'test2.doc',
        processingStatus: processingStatus,
        status: NUVERIAL_FILE_UPLOAD_STATUS.loading,
        statusMessage: '',
        uploadProgress: 100,
      });
    });

    it('should not call getDocumentFileDataById for documents without documentId or filename', done => {
      const documentList = [
        { documentId: '1', filename: 'test.doc' },
        { documentId: '', filename: 'test2.doc' },
        { documentId: '3', filename: '' },
        { documentId: '', filename: '' },
      ];

      const spy = jest.spyOn(documentFormService, 'getDocumentFileDataById$').mockReturnValue(of(new Blob()));
      jest.spyOn(documentFormService, 'getProcessingResultsById$').mockReturnValue(of([]));

      service.loadDocuments$(documentList).subscribe(() => {
        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith('1');

        done();
      });
    });

    it('should set fileStatus and filePreview', done => {
      const documentList = [{ documentId: '1', filename: 'test.doc' }];
      const blob = new Blob();

      const setFileStatusSpy = jest.spyOn(service as any, '_setFileStatus');
      const setFilePreviewSpy = jest.spyOn(service as any, '_setFilePreview');
      jest.spyOn(documentFormService, 'getDocumentFileDataById$').mockReturnValue(of(blob));
      jest.spyOn(documentFormService, 'getProcessingResultsById$').mockImplementation((_, callback) => {
        if (callback) callback();

        return of([]);
      });

      service.loadDocuments$(documentList).subscribe(() => {
        expect(setFileStatusSpy).toHaveBeenCalledTimes(3);
        expect(setFileStatusSpy).toHaveBeenNthCalledWith(1, 'test.doc', {
          name: 'test.doc',
          processingStatus: processingStatus,
          status: NUVERIAL_FILE_UPLOAD_STATUS.loading,
          statusMessage: '',
          uploadProgress: 100,
        });
        expect(setFileStatusSpy).toHaveBeenNthCalledWith(2, 'test.doc', {
          name: 'test.doc',
          processingStatus: processingStatus,
          status: NUVERIAL_FILE_UPLOAD_STATUS.processing,
          statusMessage: getStatusMessage(NUVERIAL_FILE_UPLOAD_STATUS.processing),
          uploadProgress: 100,
        });
        expect(setFileStatusSpy).toHaveBeenNthCalledWith(3, 'test.doc', {
          name: 'test.doc',
          processingStatus: processingStatus,
          status: NUVERIAL_FILE_UPLOAD_STATUS.success,
          statusMessage: getStatusMessage(NUVERIAL_FILE_UPLOAD_STATUS.success),
          uploadProgress: 100,
        });

        expect(setFilePreviewSpy).toHaveBeenCalledWith('test.doc', new File([blob], 'test.doc', { type: blob.type }));

        done();
      });
    });

    it('should set failed processingStatus if failed', done => {
      const documentList = [{ documentId: '1', filename: 'test.doc' }];
      const blob = new Blob();

      const setFileStatusSpy = jest.spyOn(service as any, '_setFileStatus');
      jest.spyOn(documentFormService, 'getDocumentFileDataById$').mockReturnValue(of(blob));
      jest.spyOn(documentFormService, 'getProcessingResultsById$').mockImplementation((_, callback) => {
        if (callback) callback();

        return of([]);
      });

      jest.spyOn(documentFormService, 'getDocumentFileDataById$').mockReturnValue(of(blob));
      jest.spyOn(documentFormService, 'getProcessingResultsById$').mockImplementation((_, callback) => {
        if (callback) callback();

        return of(mockFailedProcessingResult);
      });

      service.loadDocuments$(documentList).subscribe(() => {
        expect(setFileStatusSpy).toHaveBeenCalledTimes(3);
        expect(setFileStatusSpy).toHaveBeenNthCalledWith(3, 'test.doc', {
          name: 'test.doc',
          processingStatus: {
            failed: true,
            processors: mockFailedProcessingResult,
          },
          status: NUVERIAL_FILE_UPLOAD_STATUS.failure,
          statusMessage: getStatusMessage(NUVERIAL_FILE_UPLOAD_STATUS.failure),
          uploadProgress: 100,
        });

        done();
      });
    });
  });

  describe('processDocuments', () => {
    it('should process document', done => {
      const processSpy = jest.spyOn(documentFormService, 'processDocument$');
      const uploadObservable$ = of(documentModel);

      service.processDocument$(uploadObservable$, file, 'transactionId', 'key').subscribe(_ => {
        expect(processSpy).toBeCalledWith('transactionId', documentModel.documentId, 'key');

        done();
      });
    });

    it('should set file status with processing result', done => {
      const setFileStatusSpy = jest.spyOn(service as any, '_setFileStatus');
      const uploadObservable$ = of(documentModel);
      jest.spyOn(documentFormService, 'processDocument$').mockReturnValue(of(mockFailedProcessingResult));
      service['_fileStatus'].next(new Map([[file.name, processingFileStatus]]));

      service.processDocument$(uploadObservable$, file, 'transactionId', 'key').subscribe(_ => {
        expect(setFileStatusSpy).toHaveBeenCalledWith(file.name, {
          name: file.name,
          processingStatus: {
            failed: true,
            processors: mockFailedProcessingResult,
          },
          status: 'failure',
          statusMessage: getStatusMessage(NUVERIAL_FILE_UPLOAD_STATUS.failure),
          uploadProgress: 100,
        });

        done();
      });
    });

    it('should catch error and update processing status', fakeAsync(() => {
      const processingSpy = jest.spyOn(service['_processingSubject'], 'next');
      const uploadObservable$ = of(documentModel);
      jest.spyOn(documentFormService, 'processDocument$').mockReturnValue(throwError(() => new Error()));
      service['_fileStatus'].next(new Map([[file.name, processingFileStatus]]));

      service
        .processDocument$(uploadObservable$, file, 'transactionId', 'key')
        .pipe(
          take(1),
          catchError(() => EMPTY),
        )
        .subscribe();
      tick();

      expect(processingSpy).toHaveBeenCalledWith({ isProcessing: false });
    }));
  });

  describe('getProcessingResults', () => {
    it('should process document', done => {
      const processSpy = jest.spyOn(documentFormService, 'getProcessingResultsById$');

      service.getProcessingResults$(file, '1').subscribe(_ => {
        expect(processSpy).toBeCalledWith('1');

        done();
      });
    });

    it('should set file status with processing result', done => {
      const setFileStatusSpy = jest.spyOn(service as any, '_setFileStatus');
      jest.spyOn(documentFormService, 'getProcessingResultsById$').mockReturnValue(of(mockReadyProcessingResult));
      service['_fileStatus'].next(new Map([[file.name, processingFileStatus]]));

      service.getProcessingResults$(file, '1').subscribe(_ => {
        expect(setFileStatusSpy).toHaveBeenCalledWith(file.name, {
          name: file.name,
          processingStatus: {
            failed: false,
            processors: mockReadyProcessingResult,
          },
          status: 'success',
          statusMessage: getStatusMessage(NUVERIAL_FILE_UPLOAD_STATUS.success),
          uploadProgress: 100,
        });

        done();
      });
    });
  });

  describe('setErrorFileStatus', () => {
    it('should call _setFileStatus with the correct values', () => {
      const name = 'test.doc';
      const status = 'size_exceeded';
      const errorMessage = 'File size exceeded.';
      const spy = jest.spyOn(service as any, '_setFileStatus');
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

      service.setErrorFileStatus(name, status, errorMessage);
      expect(spy).toBeCalledWith(name, fileStatus);
    });
  });

  describe('removeFile', () => {
    it('should remove file status and file preview', () => {
      const name = 'test.doc';
      const deleteFileStatusSpy = jest.spyOn(service as any, '_deleteFileStatus');
      const deleteFilePreviewSpy = jest.spyOn(service as any, '_deleteFilePreview');
      const cancelUploadSpy = jest.spyOn(service['_cancelUpload$'], 'next');

      service.removeFile(name);

      expect(deleteFileStatusSpy).toHaveBeenCalledWith(name);
      expect(deleteFilePreviewSpy).toHaveBeenCalledWith(name);
      expect(cancelUploadSpy).toHaveBeenCalledWith(name);
    });
  });

  describe('openDocument', () => {
    it('should open the document', async () => {
      const spy = jest.spyOn(documentFormService, 'openDocument$');

      service.openDocument('testId');

      expect(spy).toHaveBeenCalledWith('testId');
    });
  });

  describe('_setFileStatus', () => {
    it('should set file status', () => {
      const spy = jest.spyOn(service['_fileStatus'], 'next');
      service['_setFileStatus'](file.name, processingFileStatus);

      expect(spy).toHaveBeenCalledWith(new Map([[file.name, processingFileStatus]]));
      expect(service['_fileStatus'].value.get(file.name)).toEqual(processingFileStatus);
    });
  });

  describe('_setFilePreview', () => {
    it('should set file preview', () => {
      const spy = jest.spyOn(service['_filePreview'], 'next');
      service['_setFilePreview'](file.name, file);

      expect(spy).toHaveBeenCalledWith(new Map([[file.name, file]]));
      expect(service['_filePreview'].value.get(file.name)).toEqual(file);
    });
  });

  describe('_deleteFileStatus', () => {
    it('should delete entry file status', () => {
      const spy = jest.spyOn(service['_fileStatus'], 'next');
      service['_fileStatus'].next(new Map([[file.name, processingFileStatus]]));

      service['_deleteFileStatus'](file.name);

      expect(spy).toHaveBeenCalledWith(new Map());
      expect(service['_fileStatus'].value.get(file.name)).toBeFalsy();
    });

    it('should update overall error status if the delete file has unsupportedType status', () => {
      const spy = jest.spyOn(service['_errorSubject'], 'next');
      const unsupportedFileStatus = { ...uploadingFileStatus, status: NUVERIAL_FILE_UPLOAD_STATUS.unsupportedType };
      service['_fileStatus'].next(new Map([[file.name, unsupportedFileStatus]]));

      service['_deleteFileStatus'](file.name);

      expect(spy).toHaveBeenCalledWith({ hasError: false });
    });

    it('should update overall error status if the delete file has failedAntivirusCheck status', () => {
      const spy = jest.spyOn(service['_errorSubject'], 'next');
      const failedAntivirusStatus = { ...uploadingFileStatus, status: NUVERIAL_FILE_UPLOAD_STATUS.failedAntivirusCheck };
      service['_fileStatus'].next(new Map([[file.name, failedAntivirusStatus]]));

      service['_deleteFileStatus'](file.name);

      expect(spy).toHaveBeenCalledWith({ hasError: false });
    });
  });

  describe('_deleteFilePreview', () => {
    it('should delete entry file status', () => {
      const spy = jest.spyOn(service['_filePreview'], 'next');
      service['_filePreview'].next(new Map([[file.name, file]]));

      service['_deleteFilePreview'](file.name);

      expect(spy).toHaveBeenCalledWith(new Map());
      expect(service['_filePreview'].value.get(file.name)).toBeFalsy();
    });
  });

  describe('_updateProcessing', () => {
    it('should update processing to true', () => {
      const spy = jest.spyOn(service['_processing'], 'next');
      service['_numProcessingMutex'] = 0;
      service['_processingSubject'].next({ isProcessing: true });

      service['_updateProcessing$'].subscribe(_ => {
        expect(spy).toHaveBeenCalledWith(true);
      });
    });

    it('should update processing to false', () => {
      const spy = jest.spyOn(service['_processing'], 'next');
      service['_numProcessingMutex'] = 1;
      service['_processingSubject'].next({ isProcessing: false });

      service['_updateProcessing$'].subscribe(_ => {
        expect(spy).toHaveBeenCalledWith(false);
      });
    });
  });

  describe('_updateUploading', () => {
    it('should update uploading to true', () => {
      const spy = jest.spyOn(service['_uploading'], 'next');
      service['_numUploadingMutex'] = 0;
      service['_uploadingSubject'].next({ isUploading: true });

      service['_updateUploading$'].subscribe(_ => {
        expect(spy).toHaveBeenCalledWith(true);
      });
    });

    it('should update uploading to false', () => {
      const spy = jest.spyOn(service['_uploading'], 'next');
      service['_numUploadingMutex'] = 1;
      service['_uploadingSubject'].next({ isUploading: false });

      service['_updateUploading$'].subscribe(_ => {
        expect(spy).toHaveBeenCalledWith(false);
      });
    });
  });

  describe('_updateHasError', () => {
    it('should update hasError to true', () => {
      const spy = jest.spyOn(service['_hasError'], 'next');
      service['_numErrors'] = 0;
      service['_errorSubject'].next({ hasError: true });

      service['_updateHasError$'].subscribe(_ => {
        expect(spy).toHaveBeenCalledWith(true);
      });
    });

    it('should update hasError to false', () => {
      const spy = jest.spyOn(service['_hasError'], 'next');
      service['_numErrors'] = 1;
      service['_errorSubject'].next({ hasError: false });

      service['_updateHasError$'].subscribe(_ => {
        expect(spy).toHaveBeenCalledWith(false);
      });
    });
  });

  describe('downloadFile', () => {
    it('should download the file', async () => {
      const createObjectURLMock = jest.fn().mockReturnValue('mocked-url');
      global.URL.createObjectURL = createObjectURLMock;
      const createElementMock = jest.spyOn(document, 'createElement').mockReturnValue({ click: jest.fn() } as unknown as HTMLAnchorElement);
      const appendChildMock = jest.spyOn(document.body, 'appendChild').mockImplementation();
      const removeChildMock = jest.spyOn(document.body, 'removeChild').mockImplementation();
      const revokeObjectURLMock = jest.fn();
      Object.defineProperty(window, 'URL', { value: { createObjectURL: jest.fn(), revokeObjectURL: revokeObjectURLMock } });

      service['_filePreview'].next(new Map([[file.name, file]]));
      service.downloadFile(file.name);

      expect(createElementMock).toHaveBeenCalledWith('a');
      expect(appendChildMock).toHaveBeenCalled();
      expect(removeChildMock).toHaveBeenCalled();
      expect(revokeObjectURLMock).toHaveBeenCalled();
    });
  });
});

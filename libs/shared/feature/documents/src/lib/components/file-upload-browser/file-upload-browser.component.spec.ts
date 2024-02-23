import { HttpClientModule } from '@angular/common/http';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { DocumentModel, IProcessingResultSchema } from '@dsg/shared/data-access/document-api';
import { ProcessDocumentsMock } from '@dsg/shared/data-access/work-api';
import { NuverialSnackBarService } from '@dsg/shared/ui/nuverial';
import { LoggingService } from '@dsg/shared/utils/logging';
import { axe } from 'jest-axe';
import { MockProvider, ngMocks } from 'ng-mocks';
import { of, ReplaySubject, throwError } from 'rxjs';
import { DocumentFormService, FileUploadService } from '../../services';
import { FileStatus } from '../../utils';
import { FileUploadBrowserComponent } from './file-upload-browser.component';

global.structuredClone = jest.fn(obj => obj);

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

const documentModel = new DocumentModel({ ['document_id']: '1' });
const file = new File([], 'test.doc', { type: 'text/plain' });
const mockFormControl = new FormControl({ disabled: false, value: '123' });

describe('FileUploadBrowserComponent', () => {
  let component: FileUploadBrowserComponent;
  let fixture: ComponentFixture<FileUploadBrowserComponent>;
  let filePreviewSubject: ReplaySubject<Map<string, File>>;
  let fileStatusSubject: ReplaySubject<Map<string, FileStatus>>;
  let fileUploadService: FileUploadService;

  beforeAll(() => {
    TestBed.resetTestEnvironment();
    TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
  });

  beforeEach(async () => {
    filePreviewSubject = new ReplaySubject<Map<string, File>>(1);
    fileStatusSubject = new ReplaySubject<Map<string, FileStatus>>(1);
    filePreviewSubject.next(new Map());
    fileStatusSubject.next(new Map());

    await TestBed.configureTestingModule({
      imports: [FileUploadBrowserComponent, NoopAnimationsModule, HttpClientModule],
      providers: [
        MockProvider(LoggingService),
        MockProvider(NuverialSnackBarService),
        MockProvider(DocumentFormService, {
          getDocumentFileDataById$: jest.fn().mockImplementation(() => of(file)),
          getProcessingResultsById$: jest.fn().mockImplementation(() => of(mockReadyProcessingResult)),
          openDocument$: jest.fn().mockImplementation(() => of(new Blob())),
          processDocument$: jest.fn().mockImplementation(() => of(ProcessDocumentsMock)),
          uploadDocument$: jest.fn().mockImplementation(() => of(documentModel)),
        }),
        MockProvider(FileUploadService, {
          filePreview$: filePreviewSubject.asObservable(),
          fileStatus$: fileStatusSubject.asObservable(),
          processDocument$: jest.fn().mockReturnValue(of(mockReadyProcessingResult)),
          uploadDocument$: jest.fn().mockReturnValue(of(documentModel)),
        }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FileUploadBrowserComponent);
    component = fixture.componentInstance;
    fileUploadService = ngMocks.findInstance(FileUploadService);

    fixture.detectChanges();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create', async () => {
    expect(component).toBeTruthy();
  });

  describe('Accessibility', () => {
    it('should have no violations', async () => {
      const axeResults = await axe(fixture.nativeElement);
      expect(axeResults).toHaveNoViolations();
    });
  });

  describe('Component Inputs', () => {
    it('should have default values', () => {
      expect(component.multiple).toBeFalsy();
      expect(component.loading).toBeFalsy();
      expect(component.required).toBeFalsy();
      expect(component.maxFileSize).toEqual(15);
      expect(component.label).toEqual('');
      expect(component.key).toEqual('');
      expect(component.transactionId).toEqual('');
      expect(component.formControl.value).toBeFalsy();
    });
  });

  describe('File upload', () => {
    it('should upload document', fakeAsync(() => {
      component.formControl = mockFormControl;
      component.transactionId = 'testId';
      component.key = 'testKey';

      const uploadSpy = jest.spyOn(fileUploadService, 'uploadDocument$').mockReturnValue(of(documentModel));
      const processSpy = jest.spyOn(fileUploadService, 'processDocument$').mockReturnValue(of(mockReadyProcessingResult));

      component.onUploadDocument(file);
      tick();

      expect(uploadSpy).toBeCalledWith(file);
      expect(processSpy).toBeCalledWith(expect.anything(), file, 'testId', 'testKey');
    }));

    it('should add to formControl array when document finishes uploading and multiple is true', fakeAsync(() => {
      const spy = jest.spyOn(component.formControl, 'setValue');

      component.multiple = true;
      component.formControl.setValue([]);
      jest.spyOn(fileUploadService, 'uploadDocument$').mockReturnValue(of(documentModel));

      component.onUploadDocument(file);
      tick();

      expect(spy).toHaveBeenCalledWith([{ documentId: '1', filename: 'test.doc' }]);
    }));

    it('should create new array and set formControl value if multiple is true', fakeAsync(() => {
      const spy = jest.spyOn(component.formControl, 'setValue');

      component.multiple = true;
      component.formControl.setValue(undefined);
      jest.spyOn(fileUploadService, 'uploadDocument$').mockReturnValue(of(documentModel));

      component.onUploadDocument(file);
      tick();

      expect(spy).toHaveBeenCalledWith([{ documentId: '1', filename: 'test.doc' }]);
    }));

    it('should set formControl value when when document finishes uploading and multiple is false', fakeAsync(() => {
      const spy = jest.spyOn(component.formControl, 'setValue');

      component.multiple = false;
      component.formControl.setValue(undefined);
      jest.spyOn(fileUploadService, 'uploadDocument$').mockReturnValue(of(documentModel));

      component.onUploadDocument(file);
      tick();

      expect(spy).toHaveBeenCalledWith({ documentId: '1', filename: 'test.doc' });
    }));

    it('should handle errors on upload', fakeAsync(() => {
      const snackbarService = ngMocks.findInstance(NuverialSnackBarService);
      const snackbarSpy = jest.spyOn(snackbarService, 'notifyApplicationError');

      jest.spyOn(fileUploadService, 'uploadDocument$').mockImplementation(() => throwError(() => 'an error'));

      component.onUploadDocument(file);
      tick();

      expect(snackbarSpy).toBeCalled();
    }));

    it('should handle errors on processing', fakeAsync(() => {
      const snackbarService = ngMocks.findInstance(NuverialSnackBarService);
      const snackbarSpy = jest.spyOn(snackbarService, 'notifyApplicationError');

      jest.spyOn(fileUploadService, 'processDocument$').mockImplementation(() => throwError(() => 'an error'));

      component.onUploadDocument(file);
      tick();

      expect(snackbarSpy).toBeCalled();
    }));

    it('should call nuverialSnackBarService.notifyApplicationError with message if present', fakeAsync(() => {
      const snackbarService = ngMocks.findInstance(NuverialSnackBarService);
      const snackbarSpy = jest.spyOn(snackbarService, 'notifyApplicationError');
      const errorMessage = 'error uploading';
      jest.spyOn(fileUploadService, 'uploadDocument$').mockImplementation(() => throwError(() => ({ error: { message: errorMessage } })));

      component.onUploadDocument(file);
      tick();

      expect(snackbarSpy).toHaveBeenCalledWith(errorMessage);
    }));
  });

  describe('openDocument', () => {
    it('should open the document if multiple is false', () => {
      const spy = jest.spyOn(fileUploadService, 'openDocument');

      component.multiple = false;
      component.formControl.setValue({ documentId: 'testId' });
      component.openDocument(3);

      expect(spy).toBeCalledWith('testId');
    });

    it('should open the document at index if multiple is true', () => {
      const spy = jest.spyOn(fileUploadService, 'openDocument');

      component.multiple = true;
      component.formControl.setValue([{ documentId: 'testId' }, { documentId: 'testId1' }, { documentId: 'testId2' }]);
      component.openDocument(2);

      expect(spy).toBeCalledWith('testId2');
    });
  });

  describe('_initFilePreview', () => {
    it('should call loadDocuments$ once', () => {
      const spy = jest.spyOn(fileUploadService, 'loadDocuments$');
      const documentList = [
        {
          documentId: 'testId1',
          filename: 'test.doc1',
        },
        {
          documentId: 'testId2',
          filename: 'test.doc2',
        },
      ];

      component.multiple = true;
      component.formControl.setValue(documentList);

      component['_initFilePreview']();

      expect(spy).toBeCalledTimes(1);
      expect(spy).toBeCalledWith(documentList);
    });

    it('should set loading to false after files are loaded', () => {
      component.formControl.setValue([
        {
          documentId: 'testId1',
          filename: 'test.doc1',
        },
      ]);
      jest.spyOn(fileUploadService, 'loadDocuments$').mockReturnValue(of(mockReadyProcessingResult));

      component['_initFilePreview']();

      expect(component.loading).toBeFalsy();
    });

    it('should handle errors on loading', fakeAsync(() => {
      const snackbarService = ngMocks.findInstance(NuverialSnackBarService);
      const snackbarSpy = jest.spyOn(snackbarService, 'notifyApplicationError');
      component.formControl.setValue([
        {
          documentId: 'testId1',
          filename: 'test.doc1',
        },
      ]);
      jest.spyOn(fileUploadService, 'loadDocuments$').mockImplementation(() => throwError(() => 'an error'));

      component['_initFilePreview']();
      tick();

      expect(snackbarSpy).toBeCalled();
    }));
  });

  describe('removeDocument', () => {
    it('should remove the correct document from the formControl value', () => {
      component.multiple = true;
      component.formControl.setValue([
        {
          documentId: 'testId1',
          filename: 'test.doc1',
        },
        {
          documentId: 'testId2',
          filename: 'test.doc2',
        },
      ]);

      component.removeDocument('test.doc1');

      expect(component.formControl.value).toEqual([{ documentId: 'testId2', filename: 'test.doc2' }]);

      component.formControl.setValue(undefined);
    });

    it('should delete the fileSize formControl error for the deleted document', () => {
      component.multiple = true;
      component.formControl.setValue([
        {
          documentId: 'testId1',
          filename: 'test.doc1',
        },
        {
          documentId: 'testId2',
          filename: 'test.doc2',
        },
      ]);
      component.formControl.setErrors({ ['fileSize-test.doc1']: true, ['fileSize-test.doc2']: true });
      component.removeDocument('test.doc1');
      expect(component.formControl.errors).toEqual({ ['fileSize-test.doc2']: true });
    });

    it('should set formControl value as null if single file', () => {
      component.multiple = false;
      component.formControl.setValue({
        documentId: 'testId1',
        filename: 'test.doc1',
      });

      component.removeDocument('test.doc1');

      expect(component.formControl.value).toEqual(null);

      component.formControl.setValue(undefined);
    });
  });

  describe('onRemoveDocument', () => {
    it('should call removeFile and removeDocument', () => {
      const removeFileSpy = jest.spyOn(fileUploadService, 'removeFile');
      const removeDocumentSpy = jest.spyOn(component, 'removeDocument');

      component.onRemoveDocument('test.doc1');

      expect(removeFileSpy).toHaveBeenCalled();
      expect(removeDocumentSpy).toHaveBeenCalled();
    });

    it('should set required error if required is true and last document is removed', () => {
      component.required = true;
      component.ngOnInit();
      component.formControl.setValue({
        documentId: 'testId1',
        filename: 'test.doc1',
      });

      component.onRemoveDocument('test.doc1');

      expect(component.formControl.errors).toEqual({ required: true });
    });
  });

  describe('validation', () => {
    it('should raise required error if required is true and no files are uploaded', () => {
      component.required = true;
      component.ngOnInit();
      component.formControl.setValue(undefined);
      component.formControl.updateValueAndValidity();

      expect(component.formControl.errors).toEqual({ required: true });
    });

    it('should raise uploading error if file is uploading', () => {
      component['_uploading'] = true;
      component.formControl.updateValueAndValidity();

      expect(component.formControl.errors).toEqual({ uploading: true });
    });

    it('should raise uploading error if no files are uploading', () => {
      component['_uploading'] = false;
      component.formControl.updateValueAndValidity();

      expect(component.formControl.errors).toBeFalsy();
    });

    it('should raise hasError error if file has error', () => {
      component['_hasError'] = true;
      component.formControl.updateValueAndValidity();

      expect(component.formControl.errors).toEqual({ hasError: true });
    });

    it('should not raise hasError error if no files have errors', () => {
      component['_hasError'] = false;
      component.formControl.updateValueAndValidity();

      expect(component.formControl.errors).toBeFalsy();
    });
  });

  it('trackByFn', () => {
    const results = component.trackByFn(1);

    expect(results).toEqual(1);
  });

  describe('maxFileSize', () => {
    it('should set maxFileSize', () => {
      component.maxFileSize = 20;

      expect(component['_maxFileSize']).toEqual(20);
    });

    it('should not set maxFileSize if value is undefined', () => {
      component.maxFileSize = undefined;

      expect(component['_maxFileSize']).toEqual(15);
    });

    it('should get maxFileSize', () => {
      const maxFileSize = component.maxFileSize;

      expect(maxFileSize).toEqual(15);
    });
  });
});

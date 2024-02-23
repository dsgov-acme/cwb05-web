import { HttpClientModule } from '@angular/common/http';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { DocumentModel, IProcessingResultSchema } from '@dsg/shared/data-access/document-api';
import { ProcessDocumentsMock } from '@dsg/shared/data-access/work-api';
import { NuverialSnackBarService } from '@dsg/shared/ui/nuverial';
import { LoggingService } from '@dsg/shared/utils/logging';
import { MockProvider, ngMocks } from 'ng-mocks';
import { DeviceDetectorService } from 'ngx-device-detector';
import { ReplaySubject, of, throwError } from 'rxjs';
import { DocumentFormService, FileUploadService } from '../../services';
import { FileStatus } from '../../utils';
import { FileUploadBrowserComponent } from '../file-upload-browser';
import { RichTextEditorAttachmentComponent } from './rich-text-editor-attachment.component';

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
const file = new File(['asdf'], 'test.doc', { type: 'text/plain' });
const file2 = new File(['asdf'], 'test2.doc', { type: 'text/plain' });

describe('RichTextEditorAttachmentComponent', () => {
  let component: RichTextEditorAttachmentComponent;
  let fixture: ComponentFixture<RichTextEditorAttachmentComponent>;
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
        MockProvider(DeviceDetectorService),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RichTextEditorAttachmentComponent);
    component = fixture.componentInstance;
    component.formControl = new FormControl();
    fileUploadService = ngMocks.findInstance(FileUploadService);

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('uploadDocuments', () => {
    it('should upload document and get processing results', fakeAsync(() => {
      const uploadSpy = jest.spyOn(fileUploadService, 'uploadDocument$').mockReturnValue(of(documentModel));
      const processSpy = jest.spyOn(fileUploadService, 'getProcessingResults$').mockReturnValue(of(mockReadyProcessingResult));

      component.uploadDocuments([file]);
      tick();

      expect(uploadSpy).toBeCalledWith(file);
      expect(processSpy).toBeCalledWith(file, '1');
    }));

    it('should upload multiple documents and get processing results', fakeAsync(() => {
      const uploadSpy = jest.spyOn(fileUploadService, 'uploadDocument$').mockReturnValue(of(documentModel));

      component.uploadDocuments([file, file2]);
      tick();

      expect(uploadSpy).toHaveBeenCalledTimes(2);
      expect(uploadSpy).toHaveBeenNthCalledWith(1, file);
      expect(uploadSpy).toHaveBeenNthCalledWith(2, file2);
    }));

    it('should add to formControl array when document finishes uploading', fakeAsync(() => {
      const spy = jest.spyOn(component.formControl, 'setValue');

      component.formControl.setValue([]);
      jest.spyOn(fileUploadService, 'uploadDocument$').mockReturnValue(of(documentModel));

      component.uploadDocuments([file]);
      tick();

      expect(spy).toHaveBeenCalledWith([{ documentId: '1', filename: 'test.doc' }]);
    }));

    it('should add to formControl array when document finishes uploading', fakeAsync(() => {
      const spy = jest.spyOn(component.formControl, 'setValue');

      component.formControl.setValue(undefined);
      jest.spyOn(fileUploadService, 'uploadDocument$').mockReturnValue(of(documentModel));

      component.uploadDocuments([file]);
      tick();

      expect(spy).toHaveBeenCalledWith([{ documentId: '1', filename: 'test.doc' }]);
    }));

    it('should handle errors on upload', fakeAsync(() => {
      const snackbarService = ngMocks.findInstance(NuverialSnackBarService);
      const snackbarSpy = jest.spyOn(snackbarService, 'notifyApplicationError');

      jest.spyOn(fileUploadService, 'uploadDocument$').mockImplementation(() => throwError(() => 'an error'));

      component.uploadDocuments([file]);
      tick();

      expect(snackbarSpy).toBeCalled();
    }));

    it('should handle errors on gett processing results', fakeAsync(() => {
      const snackbarService = ngMocks.findInstance(NuverialSnackBarService);
      const snackbarSpy = jest.spyOn(snackbarService, 'notifyApplicationError');

      jest.spyOn(fileUploadService, 'getProcessingResults$').mockImplementation(() => throwError(() => 'an error'));

      component.uploadDocuments([file]);
      tick();

      expect(snackbarSpy).toBeCalled();
    }));
  });

  describe('removeDocument', () => {
    it('should remove the correct document from the formControl value', () => {
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

    it('should call fileUploadService.removeFile', () => {
      const spy = jest.spyOn(fileUploadService, 'removeFile');

      component.removeDocument('test.doc');

      expect(spy).toBeCalledWith('test.doc');
    });
  });

  describe('Single file upload', () => {
    it('should handle the selected file', () => {
      fixture.detectChanges();

      const fileList: FileList = Object.assign([file], {
        item: (index: number) => (index === 0 ? file : null),
      });
      const event: Partial<Event> = {
        stopPropagation: jest.fn(),
        target: {
          files: fileList,
        } as HTMLInputElement,
      };

      const uploadDocumentsSpy = jest.spyOn(component, 'uploadDocuments');
      const propagationSpy = jest.spyOn(event, 'stopPropagation');
      fixture.componentInstance.handleFileSelection(event as Event);

      expect(uploadDocumentsSpy).toHaveBeenCalled();
      expect(propagationSpy).toHaveBeenCalled();
    });

    it('should reset file input value to empty string', () => {
      fixture.detectChanges();

      const filePath = String.raw`C:\fakepath\file.doc`;
      const fileList: FileList = Object.assign([file], {
        item: (index: number) => (index === 0 ? file : null),
      });
      const fileInput = {
        files: fileList,
        value: filePath,
      } as HTMLInputElement;
      const event: Partial<Event> = {
        stopPropagation: jest.fn(),
        target: fileInput,
      };

      expect(fileInput.value).toEqual(filePath);

      fixture.componentInstance.handleFileSelection(event as Event);

      expect(fileInput.value).toEqual('');
    });

    it('should click on input element', () => {
      fixture.detectChanges();

      const clickSpy = jest.spyOn(component.fileInput.nativeElement, 'click');
      const event: Partial<Event> = {
        stopPropagation: jest.fn(),
      };

      fixture.componentInstance.handleFileBrowserOpen(event as Event);

      expect(clickSpy).toHaveBeenCalled();
    });

    it('should do nothing if no file is selected', () => {
      fixture.detectChanges();
      const event: Partial<Event> = {
        stopPropagation: jest.fn(),
        target: null,
      };

      const uploadDocumentsSpy = jest.spyOn(component, 'uploadDocuments');
      const propagationSpy = jest.spyOn(event, 'stopPropagation');
      fixture.componentInstance.handleFileSelection(event as Event);

      expect(uploadDocumentsSpy).not.toHaveBeenCalled();
      expect(propagationSpy).toHaveBeenCalled();
    });
  });

  it('should download file', () => {
    const spy = jest.spyOn(fileUploadService, 'downloadFile');

    component.downloadFile('test.doc');

    expect(spy).toBeCalledWith('test.doc');
  });

  describe('error validator', () => {
    it('should return null if there is no error', () => {
      component['_hasError'] = false;
      const result = component['_attachmentUploadValidator']()(component.formControl);
      expect(result).toBeNull();
    });

    it('should return error object if there is an error', () => {
      component['_hasError'] = true;
      const result = component['_attachmentUploadValidator']()(component.formControl);
      expect(result).toEqual({ hasError: true });
    });
  });

  describe('deviceService', () => {
    it('should detect mobile device', async () => {
      const service = ngMocks.findInstance(DeviceDetectorService);
      const spy = jest.spyOn(service, 'isMobile').mockReturnValue(true);

      const result = component.isMobile;

      expect(spy).toHaveBeenCalled();
      expect(result).toBeTruthy();
    });

    it('should detect desktop device', async () => {
      const service = ngMocks.findInstance(DeviceDetectorService);
      const spy = jest.spyOn(service, 'isMobile').mockReturnValue(false);

      const result = component.isMobile;

      expect(spy).toHaveBeenCalled();
      expect(result).toBeFalsy();
    });
  });
});

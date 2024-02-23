import { FocusMonitor, FocusOrigin } from '@angular/cdk/a11y';
import { HttpClientModule } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, Validators } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { NUVERIAL_FILE_UPLOAD_STATUS } from '@dsg/shared/ui/nuverial';
import { LoggingService } from '@dsg/shared/utils/logging';
import { screen } from '@testing-library/dom';
import { axe } from 'jest-axe';
import { MockProvider, ngMocks } from 'ng-mocks';
import { DeviceDetectorService } from 'ngx-device-detector';
import { ReplaySubject, Subject } from 'rxjs';
import { FileUploadService } from '../../services';
import { FileStatus, getStatusMessage } from '../../utils';
import { NuverialFileUploadComponent } from './file-upload.component';

const focusEvents = new Subject<FocusOrigin | null>();

const fileData = 'new file doc';
const fileName = 'file.doc';
const fileType = 'application/msword';

const file = new File([fileData], fileName, { type: fileType });

const fileStatusMock: FileStatus = {
  name: file.name,
  processingStatus: { failed: false, processors: [] },
  status: NUVERIAL_FILE_UPLOAD_STATUS.success,
  statusMessage: getStatusMessage(NUVERIAL_FILE_UPLOAD_STATUS.success),
  uploadProgress: 0,
};

describe('NuverialFileUploadComponent', () => {
  let component: NuverialFileUploadComponent;
  let fixture: ComponentFixture<NuverialFileUploadComponent>;
  let filePreviewSubject: ReplaySubject<Map<string, File>>;
  let fileStatusSubject: ReplaySubject<Map<string, FileStatus>>;

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
      imports: [NuverialFileUploadComponent, NoopAnimationsModule, HttpClientModule],
      providers: [
        MockProvider(DeviceDetectorService, {
          isMobile: jest.fn().mockReturnValue(false),
        }),
        MockProvider(FocusMonitor, {
          monitor: jest.fn().mockReturnValue(focusEvents.asObservable()),
          stopMonitoring: jest.fn(),
        }),
        MockProvider(LoggingService),
        MockProvider(FileUploadService, {
          filePreview$: filePreviewSubject.asObservable(),
          fileStatus$: fileStatusSubject.asObservable(),
        }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NuverialFileUploadComponent);
    component = fixture.componentInstance;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Accessibility', () => {
    it('should have no violations', async () => {
      const axeResults = await axe(fixture.nativeElement);
      expect(axeResults).toHaveNoViolations();
    });
  });

  describe('Component Inputs', () => {
    it('should have default values', async () => {
      expect(fixture.componentInstance.ariaLabel).toBeFalsy();
      expect(fixture.componentInstance.ariaDescribedBy).toBeFalsy();
      expect(fixture.componentInstance.formControl).toBeTruthy();
      expect(fixture.componentInstance.documentTitle).toEqual(undefined);
      expect(fixture.componentInstance.maxFileSize).toEqual(15);
      expect(fixture.componentInstance.fileDragDropAvailable).toEqual(true);
      expect(fixture.componentInstance.validationMessages).toBeFalsy();

      const fieldUpload = fixture.debugElement.query(By.css('.file-upload'));
      expect(fieldUpload).toBeTruthy();
      expect(screen.getByText('Drag and drop your file, or')).toBeInTheDocument();
      expect(screen.getByText('browse')).toBeInTheDocument();
      expect(screen.getByText('The file must be 15MB or smaller in size.')).toBeInTheDocument();
    });
  });

  describe('Single file upload', () => {
    it('should handle the selected file', async () => {
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

      const addFileSpy = jest.spyOn(fixture.componentInstance.fileUploadControl, 'addFiles');
      const propagationSpy = jest.spyOn(event, 'stopPropagation');
      fixture.componentInstance.handleFileSelection(event as Event);

      expect(addFileSpy).toHaveBeenCalled();
      expect(propagationSpy).toHaveBeenCalled();
    });

    it('should reset file input value to empty string', async () => {
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

    it('should not set image if empty file is passed in', async () => {
      const readDataSpy = jest.spyOn(FileReader.prototype, 'readAsDataURL');

      fixture.componentInstance['_setImagePreview']({ ...file, size: 0 });
      expect(readDataSpy).not.toHaveBeenCalled();
    });

    it('should set image if file is passed in', async () => {
      const readDataSpy = jest.spyOn(FileReader.prototype, 'readAsDataURL');

      fixture.componentInstance['_setImagePreview'](file);
      expect(readDataSpy).toHaveBeenCalled();
    });

    it('should show required error', async () => {
      fixture.componentInstance.ngOnInit();
      fixture.componentInstance.formControl.setValidators(Validators.required);

      fixture.componentInstance.formControl.markAsTouched();
      fixture.componentInstance.formControl.setValue(undefined);
      fixture.componentInstance.formControl.updateValueAndValidity();

      fixture.detectChanges();

      expect(screen.getByText('Required')).toBeInTheDocument();
    });
    it('should return undefined from validate required if formcontrol has required error and value', async () => {
      fixture.componentInstance.formControl = new FormControl();
      fixture.componentInstance.formControl.setValue('test');
      fixture.componentInstance.formControl.setErrors({ required: true });
      const requiredError = fixture.componentInstance['_validateRequired']();

      expect(requiredError).toEqual(undefined);
    });
    it('should show file size error', async () => {
      fixture.componentInstance.formControl = new FormControl();
      fixture.componentInstance.formControl.setErrors({ ['fileSize-test.doc']: true });
      const fileSizeError = fixture.componentInstance['_validateFileSizeError']();

      expect(fileSizeError).toEqual({ ['fileSize-test.doc']: true });
    });
    it('should do nothing if no file is selected', async () => {
      fixture.detectChanges();
      const event: Partial<Event> = {
        stopPropagation: jest.fn(),
        target: null,
      };
      const addFileSpy = jest.spyOn(fixture.componentInstance.fileUploadControl, 'addFile');
      const propagationSpy = jest.spyOn(event, 'stopPropagation');
      fixture.componentInstance.handleFileSelection(event as Event);

      expect(addFileSpy).not.toHaveBeenCalled();
      expect(propagationSpy).toHaveBeenCalled();
    });
    it('should upload file', async () => {
      const uploadDocumentSpy = jest.spyOn(fixture.componentInstance.uploadDocument, 'emit');
      fixture.componentInstance.multiple = false;

      fixture.componentInstance.uploadFile(file);
      fixture.detectChanges();
      expect(uploadDocumentSpy).toHaveBeenCalledWith(file);
    });
    it('should return true if file size error is set', async () => {
      jest
        .spyOn(fixture.componentInstance.fileUploadControl, 'getErrors')
        .mockImplementation(() => [{ errors: { [`fileSize-file.doc`]: true }, name: file.name }]);
      let error = fixture.componentInstance['_isFileSizeError'](file);
      expect(error).toEqual(true);

      jest.spyOn(fixture.componentInstance.fileUploadControl, 'getErrors').mockImplementation(() => []);
      error = fixture.componentInstance['_isFileSizeError'](file);
      expect(error).toEqual(false);
    });
    it('should handle file changes', async () => {
      const uploadFileSpy = jest.spyOn(fixture.componentInstance, 'uploadFile');

      fixture.componentInstance.fileUploadControl.valueChanges$.subscribe(() => {
        expect(uploadFileSpy).toHaveBeenCalledWith(file);
      });

      fixture.componentInstance.fileUploadControl.addFile(file);
    });
    it('should set file size error if file is too large', async () => {
      const setErrorSpy = jest.spyOn(fixture.componentInstance as any, '_setFormControlFileSizeError');
      jest.spyOn(fixture.componentInstance as any, '_isFileSizeError').mockReturnValue(true);

      fixture.componentInstance.fileUploadControl.valueChanges$.subscribe(() => {
        expect(setErrorSpy).toHaveBeenCalled();
      });

      fixture.componentInstance.fileUploadControl.addFile(file);
      fixture.componentInstance.ngOnInit();
      fixture.detectChanges();
    });
    it('should set file size error if file is too large', async () => {
      const setErrorSpy = jest.spyOn(fixture.componentInstance as any, '_setFormControlFileSizeError');
      jest.spyOn(fixture.componentInstance as any, '_isFileSizeError').mockReturnValue(true);

      fixture.componentInstance.fileUploadControl.valueChanges$.subscribe(() => {
        expect(setErrorSpy).toHaveBeenCalled();
      });

      fixture.componentInstance.fileUploadControl.addFile(file);
      fixture.componentInstance.ngOnInit();
      fixture.detectChanges();
    });
    it('should stop current file upload if another file is selected', async () => {
      const stopUploadSpy = jest.spyOn(fixture.componentInstance, 'stopUpload');
      fixture.componentInstance.multiple = false;
      fixture.componentInstance.fileUploadControl.addFile(file);

      fixture.componentInstance.handleFileBrowserOpen(new MouseEvent('click'));

      expect(stopUploadSpy).toHaveBeenCalledWith(file.name);
    });
  });

  describe('Multiple file upload', () => {
    it('should not show document title if container is in multi-file mode', async () => {
      fixture.componentInstance.multiple = true;

      fixture.detectChanges();

      const documentTitle = fixture.debugElement.query(By.css('.document-title'));
      expect(documentTitle).toBeFalsy();
    });
  });

  it('should emit when user wants to stop file upload', async () => {
    fixture.componentInstance.fileUploadControl.addFile(file);

    const cancelUploadSpy = jest.spyOn(fixture.componentInstance.removeDocument, 'emit');
    const fileUploadControlSpy = jest.spyOn(fixture.componentInstance.fileUploadControl, 'removeFile');

    fixture.componentInstance.stopUpload(file.name);
    expect(cancelUploadSpy).toHaveBeenCalled();
    expect(fileUploadControlSpy).toHaveBeenCalledWith(file.name);
  });

  it('should set the maxFileSize when the value is defined', async () => {
    component.maxFileSize = 20;

    expect(component['_maxFileSize']).toBe(20);
    expect(component.maxFileSize).toBe(20);
  });

  it('should set the maxFileSize when the value is undefined', async () => {
    component.maxFileSize = undefined;

    expect(component['_maxFileSize']).toBe(15);
    expect(component.maxFileSize).toBe(15);
  });

  describe('deviceService', () => {
    it('should detect mobile device', async () => {
      const service = fixture.debugElement.injector.get(DeviceDetectorService);
      const spy = jest.spyOn(service, 'isMobile').mockReturnValue(true);

      fixture.detectChanges();

      expect(spy).toHaveBeenCalled();
      expect(component.isMobile).toBeTruthy();
    });

    it('should detect desktop device', async () => {
      const service = fixture.debugElement.injector.get(DeviceDetectorService);
      const spy = jest.spyOn(service, 'isMobile').mockReturnValue(false);

      fixture.detectChanges();

      expect(spy).toHaveBeenCalled();
      expect(component.isMobile).toBeFalsy();
    });
  });

  describe('removeFile', () => {
    it('removeFile should emit removeDocument', async () => {
      const spy = jest.spyOn(fixture.componentInstance.removeDocument, 'emit');
      fixture.componentInstance.fileUploadControl.addFile(file);
      fileStatusSubject.next(new Map([[file.name, { ...fileStatusMock }]]));

      fixture.componentInstance.removeFile(file.name);

      expect(spy).toHaveBeenCalledWith(file.name);
    });
  });

  describe('fileStatus', () => {
    it('should set status icons and processing to true', done => {
      const updatedFileStatus = new Map<string, FileStatus>();
      const fileProcessing: FileStatus = {
        name: 'file1',
        processingStatus: { failed: false, processors: [] },
        status: NUVERIAL_FILE_UPLOAD_STATUS.processing,
        statusMessage: getStatusMessage(NUVERIAL_FILE_UPLOAD_STATUS.processing),
        uploadProgress: 100,
      };
      const fileUploading: FileStatus = {
        name: 'file2',
        processingStatus: { failed: false, processors: [] },
        status: NUVERIAL_FILE_UPLOAD_STATUS.pending,
        statusMessage: '',
        uploadProgress: 50,
      };
      updatedFileStatus.set(fileProcessing.name, fileProcessing);
      updatedFileStatus.set(fileUploading.name, fileUploading);

      const setStatusIconSpy = jest.spyOn(component as any, '_setStatusIcon');

      fileStatusSubject.next(updatedFileStatus);
      fixture.detectChanges();

      component.fileStatus$.subscribe(fileStatus => {
        expect(component.isProcessing).toBeTruthy();
        expect(fileStatus.size).toBe(2);

        expect(setStatusIconSpy).toHaveBeenNthCalledWith(1, NUVERIAL_FILE_UPLOAD_STATUS.processing);
        expect(setStatusIconSpy).toHaveBeenNthCalledWith(2, NUVERIAL_FILE_UPLOAD_STATUS.pending);

        done();
      });
    });

    it('should set processing to false if no files are processing', done => {
      const updatedFileStatus = new Map<string, FileStatus>();
      const fileSuccess: FileStatus = {
        name: 'file1',
        processingStatus: { failed: false, processors: [] },
        status: NUVERIAL_FILE_UPLOAD_STATUS.success,
        statusMessage: getStatusMessage(NUVERIAL_FILE_UPLOAD_STATUS.success),
        uploadProgress: 100,
      };
      const fileUploading: FileStatus = {
        name: 'file2',
        processingStatus: { failed: false, processors: [] },
        status: NUVERIAL_FILE_UPLOAD_STATUS.pending,
        statusMessage: '',
        uploadProgress: 50,
      };
      updatedFileStatus.set(fileSuccess.name, fileSuccess);
      updatedFileStatus.set(fileUploading.name, fileUploading);

      component.fileStatus$.subscribe(_ => {
        expect(component.isProcessing).toBeFalsy();

        done();
      });
    });
  });

  describe('setDisplayProperties', () => {
    it('should set singleFile properties empty if file does not exist', () => {
      component.setDisplayProperties(new Map());

      fixture.detectChanges();

      expect(component.singleFileStatus).toEqual('');
      expect(component.singleFileProgressWidth).toEqual('0%');
      expect(component.singleFileStatusMessage).toEqual('');
      expect(component.singleFileProcessors).toEqual([]);
    });

    it('should set show properties falsy if file does not exist', () => {
      component.setDisplayProperties(new Map());

      fixture.detectChanges();

      expect(component.showSingleFileStatusBar).toBeFalsy();
      expect(component.showOverlayBackground).toBeFalsy();
      expect(component.showPending).toBeFalsy();
    });

    it('should set show properties falsy if multiple is true', () => {
      component.multiple = true;
      component.setDisplayProperties(new Map([[fileName, fileStatusMock]]));

      fixture.detectChanges();

      expect(component.showSingleFileStatusBar).toBeFalsy();
      expect(component.showOverlayBackground).toBeFalsy();
      expect(component.showPending).toBeFalsy();
    });

    it('should set appropriate singleFile properties if file exists', () => {
      const processingFileStatusMock = {
        ...fileStatusMock,
        status: NUVERIAL_FILE_UPLOAD_STATUS.processing,
        statusMessage: 'Analyzing your upload to ensure it meets requirements',
        uploadProgress: 100,
      };
      component.setDisplayProperties(new Map([[fileName, processingFileStatusMock]]));

      fixture.detectChanges();

      expect(component.singleFileStatus).toEqual(NUVERIAL_FILE_UPLOAD_STATUS.processing);
      expect(component.singleFileProgressWidth).toEqual('100%');
      expect(component.singleFileStatusMessage).toEqual('Analyzing your upload to ensure it meets requirements');
      expect(component.singleFileProcessors).toEqual([]);
    });

    describe('should set showSingleFileStatusBar', () => {
      it('false if there is no file or multiple files are allowed', () => {
        component.multiple = true;
        component.setDisplayProperties(new Map());

        fixture.detectChanges();

        expect(component.showSingleFileStatusBar).toBeFalsy();
      });

      it('false if the file status is pending', () => {
        component.multiple = false;
        component.setDisplayProperties(new Map([[file.name, { ...fileStatusMock, status: NUVERIAL_FILE_UPLOAD_STATUS.pending }]]));

        fixture.detectChanges();

        expect(component.showSingleFileStatusBar).toBeFalsy();
      });

      it('false if the file status is loading', () => {
        component.multiple = false;
        component.setDisplayProperties(new Map([[file.name, { ...fileStatusMock, status: NUVERIAL_FILE_UPLOAD_STATUS.loading }]]));

        fixture.detectChanges();

        expect(component.showSingleFileStatusBar).toBeFalsy();
      });

      it('true if the file status is not initial or pending', () => {
        component.multiple = false;
        component.setDisplayProperties(new Map([[file.name, { ...fileStatusMock, status: NUVERIAL_FILE_UPLOAD_STATUS.processing }]]));

        fixture.detectChanges();

        expect(component.showSingleFileStatusBar).toBeTruthy();
      });
    });

    describe('should set showOverlayBackground', () => {
      it('true if file status is success', () => {
        component.setDisplayProperties(new Map([[file.name, { ...fileStatusMock, status: NUVERIAL_FILE_UPLOAD_STATUS.success }]]));

        fixture.detectChanges();

        expect(component.showOverlayBackground).toBeTruthy();
      });

      it('true if file status is pending', () => {
        component.setDisplayProperties(new Map([[file.name, { ...fileStatusMock, status: NUVERIAL_FILE_UPLOAD_STATUS.pending }]]));

        fixture.detectChanges();

        expect(component.showOverlayBackground).toBeTruthy();
      });

      it('true if file status is processing', () => {
        component.setDisplayProperties(new Map([[file.name, { ...fileStatusMock, status: NUVERIAL_FILE_UPLOAD_STATUS.processing }]]));

        fixture.detectChanges();

        expect(component.showOverlayBackground).toBeTruthy();
      });

      it('should return true if imageError is true', () => {
        component.setDisplayProperties(new Map([[file.name, { ...fileStatusMock, status: NUVERIAL_FILE_UPLOAD_STATUS.success }]]));
        component.imageError = true;

        fixture.detectChanges();

        expect(component.showOverlayBackground).toBeTruthy();
      });
    });

    describe('should set showPending', () => {
      it('true if the file status is pending', () => {
        component.setDisplayProperties(new Map([[file.name, { ...fileStatusMock, status: NUVERIAL_FILE_UPLOAD_STATUS.pending }]]));

        fixture.detectChanges();

        expect(component.showPending).toBeTruthy();
      });

      it('false if the file status is not pending', () => {
        component.setDisplayProperties(new Map([[file.name, { ...fileStatusMock, status: NUVERIAL_FILE_UPLOAD_STATUS.success }]]));

        fixture.detectChanges();

        expect(component.showPending).toBeFalsy();
      });
    });
  });

  describe('filePreview', () => {
    it('should set filePreview', done => {
      const filePreviewMock = new Map<string, File>();
      filePreviewMock.set(file.name, file);

      filePreviewSubject.next(filePreviewMock);

      component.filePreview$.subscribe(filePreview => {
        expect(filePreview.size).toEqual(1);
        expect(filePreview.get(file.name)).toEqual(file);

        done();
      });
    });

    it('should add files to fileUploadControl', () => {
      const control = component.fileUploadControl;
      const spy = jest.spyOn(control, 'addFiles');
      const filePreviewMock = new Map<string, File>();
      filePreviewMock.set(file.name, file);

      filePreviewSubject.next(filePreviewMock);

      expect(spy).toHaveBeenCalledWith([file], false);
    });

    it('should set image preview if multiple is false', () => {
      const spy = jest.spyOn(component as any, '_setImagePreview');
      const filePreviewMock = new Map<string, File>();
      filePreviewMock.set(file.name, file);
      component.multiple = false;

      fixture.detectChanges();
      filePreviewSubject.next(filePreviewMock);

      expect(spy).toHaveBeenCalledWith(file);
    });
  });

  describe('_handleSizeError', () => {
    it('should call setErrorFileStatus with correct message', () => {
      const service = ngMocks.findInstance(FileUploadService);
      const spy = jest.spyOn(service, 'setErrorFileStatus');
      component['_handleSizeError'](file);
      expect(spy).toBeCalledWith('file.doc', NUVERIAL_FILE_UPLOAD_STATUS.sizeExceeded, 'File is too large');
    });
  });

  describe('setFormControlFileSizeError', () => {
    it('should set the fileSize error on the form control', () => {
      const formControl = new FormControl();

      component.formControl = formControl;
      component['_setFormControlFileSizeError'](file);

      expect(formControl.hasError('fileSize-file.doc')).toBeTruthy();
    });
  });

  describe('_isFormEmpty', () => {
    it('should return true if formControl value is empty', () => {
      fixture.componentInstance.formControl = new FormControl('');

      const result = fixture.componentInstance['_isFormEmpty']();

      expect(result).toBe(true);
    });

    it('should return true if formControl value is an empty array', () => {
      fixture.componentInstance.formControl = new FormControl([]);

      const result = fixture.componentInstance['_isFormEmpty']();

      expect(result).toBe(true);
    });

    it('should return false if formControl value is not empty', () => {
      fixture.componentInstance.formControl = new FormControl({ name: 'file.doc' });

      const result = fixture.componentInstance['_isFormEmpty']();

      expect(result).toBe(false);
    });

    it('should return false if formControl value is a non-empty array', () => {
      fixture.componentInstance.formControl = new FormControl([{ name: 'file.doc' }, { name: 'file2.doc' }]);

      const result = fixture.componentInstance['_isFormEmpty']();

      expect(result).toBe(false);
    });
  });

  describe('dropHandler', () => {
    it('should add files to fileUploadControl', () => {
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

      const addFilesSpy = jest.spyOn(fixture.componentInstance.fileUploadControl, 'addFiles');
      const stopPropagationSpy = jest.spyOn(event, 'stopPropagation');
      const preventDefaultSpy = jest.spyOn(event, 'stopPropagation');

      fixture.componentInstance.dropHandler(event as DragEvent);
      fixture.detectChanges();

      expect(addFilesSpy).toHaveBeenCalledWith([file]);
      expect(stopPropagationSpy).toHaveBeenCalled();
      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('should not add files if dataTransfer.files is undefined', () => {
      const dataTransfer: DataTransfer = {} as DataTransfer;
      const event: Partial<DragEvent> = {
        dataTransfer,
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        target: null,
      };

      const addFilesSpy = jest.spyOn(fixture.componentInstance.fileUploadControl, 'addFiles');

      fixture.componentInstance.dropHandler(event as DragEvent);
      fixture.detectChanges();

      expect(addFilesSpy).not.toHaveBeenCalled();
    });

    it('should stop upload if multiple is false and there is already a file', () => {
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

      const stopUploadSpy = jest.spyOn(fixture.componentInstance, 'stopUpload');

      fixture.componentInstance.multiple = false;
      fixture.componentInstance.fileUploadControl.addFile(file);
      fixture.componentInstance.dropHandler(event as DragEvent);
      fixture.detectChanges();

      expect(stopUploadSpy).toHaveBeenCalled();
    });

    it('should not stop upload if multiple is false and there are no files', () => {
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

      const stopUploadSpy = jest.spyOn(fixture.componentInstance, 'stopUpload');

      fixture.componentInstance.multiple = false;
      fixture.componentInstance.dropHandler(event as DragEvent);
      fixture.detectChanges();

      expect(stopUploadSpy).not.toHaveBeenCalled();
    });
  });

  describe('dragOverHandler', () => {
    it('should prevent default and stop propagation', () => {
      const dataTransfer: DataTransfer = {} as DataTransfer;
      const event: Partial<DragEvent> = {
        dataTransfer,
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        target: null,
      };

      const preventDefaultSpy = jest.spyOn(event, 'preventDefault');
      const stopPropagationSpy = jest.spyOn(event, 'stopPropagation');

      fixture.componentInstance.dragOverHandler(event as DragEvent);
      fixture.detectChanges();

      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(stopPropagationSpy).toHaveBeenCalled();
    });
  });

  it('should download the file', () => {
    const service = ngMocks.findInstance(FileUploadService);
    const downloadFileSpy = jest.spyOn(service, 'downloadFile');
    component.downloadFile(file.name);
    expect(downloadFileSpy).toHaveBeenCalledWith(file.name);
  });

  describe('_setStatusIcon', () => {
    it('should set iconName to "check_circle" when status is NUVERIAL_FILE_UPLOAD_STATUS.success', () => {
      component['_setStatusIcon'](NUVERIAL_FILE_UPLOAD_STATUS.success);
      expect(component.iconName).toEqual('check_circle');
    });

    it('should not set iconName when status is NUVERIAL_FILE_UPLOAD_STATUS.pending', () => {
      component['_setStatusIcon'](NUVERIAL_FILE_UPLOAD_STATUS.pending);
      expect(component.iconName).toEqual('');
    });

    it('should set iconName to "refresh" when status is NUVERIAL_FILE_UPLOAD_STATUS.processing', () => {
      component['_setStatusIcon'](NUVERIAL_FILE_UPLOAD_STATUS.processing);
      expect(component.iconName).toEqual('refresh');
    });

    it('should set iconName to "refresh" when status is NUVERIAL_FILE_UPLOAD_STATUS.loading', () => {
      component['_setStatusIcon'](NUVERIAL_FILE_UPLOAD_STATUS.loading);
      expect(component.iconName).toEqual('refresh');
    });

    it('should set iconName to "error" when status is NUVERIAL_FILE_UPLOAD_STATUS.failure', () => {
      component['_setStatusIcon'](NUVERIAL_FILE_UPLOAD_STATUS.failure);
      expect(component.iconName).toEqual('error');
    });

    it('should set iconName to "error" when status is NUVERIAL_FILE_UPLOAD_STATUS.unsupportedType', () => {
      component['_setStatusIcon'](NUVERIAL_FILE_UPLOAD_STATUS.unsupportedType);
      expect(component.iconName).toEqual('error');
    });

    it('should set iconName to "error" when status is NUVERIAL_FILE_UPLOAD_STATUS.failedAntivirusCheck', () => {
      component['_setStatusIcon'](NUVERIAL_FILE_UPLOAD_STATUS.failedAntivirusCheck);
      expect(component.iconName).toEqual('error');
    });

    it('should set iconName to "error" when status is NUVERIAL_FILE_UPLOAD_STATUS.sizeExceeded', () => {
      component['_setStatusIcon'](NUVERIAL_FILE_UPLOAD_STATUS.sizeExceeded);
      expect(component.iconName).toEqual('error');
    });

    it('should not set iconName when status is not recognized', () => {
      component['_setStatusIcon']('unknown_status');
      expect(component.iconName).toEqual('');
    });
  });
});

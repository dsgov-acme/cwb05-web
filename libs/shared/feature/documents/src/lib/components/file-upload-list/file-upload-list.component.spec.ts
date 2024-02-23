import { ComponentFixture, TestBed } from '@angular/core/testing';

import { By } from '@angular/platform-browser';
import { NUVERIAL_FILE_UPLOAD_STATUS } from '@dsg/shared/ui/nuverial';
import { axe } from 'jest-axe';
import { MockProvider } from 'ng-mocks';
import { of } from 'rxjs';
import { FileUploadService } from '../../services';
import { getStatusMessage } from '../../utils';
import { FileUploadListComponent } from './file-upload-list.component';

describe('FileUploadListComponent', () => {
  let component: FileUploadListComponent;
  let fixture: ComponentFixture<FileUploadListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FileUploadListComponent],
      providers: [
        MockProvider(FileUploadService, {
          fileStatus$: of(
            new Map([
              [
                'test.doc',
                {
                  name: 'test.doc',
                  processingStatus: { failed: false, processors: [] },
                  status: NUVERIAL_FILE_UPLOAD_STATUS.loading,
                  statusMessage: getStatusMessage(NUVERIAL_FILE_UPLOAD_STATUS.loading),
                  uploadProgress: 100,
                },
              ],
            ]),
          ),
        }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FileUploadListComponent);
    component = fixture.componentInstance;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have no violations when ariaLabel is set', async () => {
    const axeResults = await axe(fixture.nativeElement);

    expect(axeResults).toHaveNoViolations();
  });

  describe('event emitters', () => {
    it('onDownloadFile should emit downloadFile', () => {
      const name = 'test';
      const spy = jest.spyOn(component.downloadFile, 'emit');
      component.onDownloadFile(name);
      expect(spy).toHaveBeenCalledWith(name);
    });

    it('onStopUpload should emit stopUpload', () => {
      const name = 'test';
      const spy = jest.spyOn(component.stopUpload, 'emit');
      component.onStopUpload(name);
      expect(spy).toHaveBeenCalledWith(name);
    });

    it('onRemoveFile should emit removeFile', () => {
      const name = 'test';
      const spy = jest.spyOn(component.removeFile, 'emit');
      component.onRemoveFile(name);
      expect(spy).toHaveBeenCalledWith(name);
    });
  });

  describe('trackByFn', () => {
    it('trackByFn should return the index', async () => {
      const index = 0;
      const result = component.trackByFn(index);
      expect(result).toEqual(index);
    });
  });

  describe('download button', () => {
    it('should be disabled when loading', async () => {
      const downloadButton = fixture.debugElement.query(By.css('.file-action-button'));
      expect(downloadButton.nativeElement).toBeDisabled();
    });
  });
});

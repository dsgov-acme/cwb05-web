import { ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DocumentFormService } from '@dsg/shared/feature/documents';
import { render } from '@testing-library/angular';
import { MockProvider, ngMocks } from 'ng-mocks';
import { of } from 'rxjs';
import { AttachmentsListViewComponent } from './attachments-list-view.component';

describe('AttachmentsListViewComponent', () => {
  let attachments: string[];
  let component: AttachmentsListViewComponent;
  let fixture: ComponentFixture<AttachmentsListViewComponent>;

  beforeEach(async () => {
    attachments = ['12345', '67890'];
    const props = { componentProperties: { attachments: attachments, attachmentNames: { 12345: 'Doc 1', 67890: 'Doc 2' } } };
    fixture = (
      await render(AttachmentsListViewComponent, {
        ...props,
        providers: [MockProvider(DocumentFormService, {})],
      })
    ).fixture;

    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('trackByFn', async () => {
    const results = component.trackByFn(1);
    expect(results).toEqual(1);
  });

  it('should stop propagation on click', () => {
    const element = fixture.debugElement.query(By.css('.message__attachment-container'));
    const event = new MouseEvent('click');
    const stopPropagationSpy = jest.spyOn(event, 'stopPropagation');
    const onClickSpy = jest.spyOn(component, 'onClick');
    element.nativeElement.dispatchEvent(event);
    expect(onClickSpy).toBeCalledWith(event);
    expect(stopPropagationSpy).toHaveBeenCalled();
  });

  it('should stop propagation on downloadFile', () => {
    const documentFormService = ngMocks.findInstance(DocumentFormService);
    jest.spyOn(documentFormService, 'downloadDocument$').mockReturnValue(of());
    const downloadSpy = jest.spyOn(component, 'downloadFile');
    const element = fixture.debugElement.query(By.css('.message__attachment-container .message__attachments a'));
    const event = new MouseEvent('click');
    const stopPropagationSpy = jest.spyOn(event, 'stopPropagation');

    element.nativeElement.dispatchEvent(event);
    expect(stopPropagationSpy).toHaveBeenCalled();
    expect(downloadSpy).toBeCalled();
  });

  it('should download file with correct name', () => {
    const documentFormService = ngMocks.findInstance(DocumentFormService);
    const documentSpy = jest.spyOn(documentFormService, 'downloadDocument$').mockReturnValue(of());
    component.attachmentNames = { testId: 'IdName' };
    const event = { stopPropagation: jest.fn() } as any as MouseEvent;

    component.downloadFile(event, 'testId');
    expect(documentSpy).toBeCalledWith('testId', 'IdName');
  });

  it('should download file with attachmentId if no name found', () => {
    const documentFormService = ngMocks.findInstance(DocumentFormService);
    const documentSpy = jest.spyOn(documentFormService, 'downloadDocument$').mockReturnValue(of());
    component.attachmentNames = {};
    const event = { stopPropagation: jest.fn() } as any as MouseEvent;

    component.downloadFile(event, 'testId');
    expect(documentSpy).toBeCalledWith('testId', 'testId');
  });

  it('should display the attachments with proper names', async () => {
    component.attachmentNames = { 12345: 'Doc 1', 67890: 'Doc 2' };
    component.attachments = ['12345', '67890'];

    fixture.detectChanges();
    const attachmentLinks = fixture.debugElement.queryAll(By.css('.message__attachments a'));
    const linkTexts = attachmentLinks.map(link => link.nativeElement.textContent.trim());

    expect(linkTexts[0]).toEqual('Doc 1');
    expect(linkTexts[1]).toEqual('Doc 2');
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, Router } from '@angular/router';
import { NewConversationResponseMock } from '@dsg/shared/data-access/work-api';
import { NuverialSnackBarService } from '@dsg/shared/ui/nuverial';
import { HttpTestingModule } from '@dsg/shared/utils/http';
import { LoggingService } from '@dsg/shared/utils/logging';
import { MockProvider, ngMocks } from 'ng-mocks';
import { of, throwError } from 'rxjs';
import { MessagingService } from '../../services';
import { NewConversationComponent } from './new-conversation.component';

const fileData = 'new file doc';
const fileName = 'file.doc';
const fileType = 'application/msword';
const file = new File([fileData], fileName, { type: fileType });

describe('NewConversationComponent', () => {
  let component: NewConversationComponent;
  let fixture: ComponentFixture<NewConversationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewConversationComponent, NoopAnimationsModule, HttpTestingModule],
      providers: [
        MockProvider(LoggingService),
        MockProvider(Router),
        MockProvider(ActivatedRoute),
        MockProvider(NuverialSnackBarService),
        MockProvider(MessagingService, {
          createNewConversation$: jest.fn().mockImplementation(() => of(NewConversationResponseMock)),
        }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NewConversationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('onActionClick', () => {
    it('should navigate back if the user cancels', () => {
      const event = 'cancel';

      const route = ngMocks.findInstance(ActivatedRoute);
      const router = ngMocks.findInstance(Router);
      const navigateSpy = jest.spyOn(router, 'navigate');

      component.onActionClick(event);

      expect(navigateSpy).toHaveBeenCalledWith(['../'], { relativeTo: route });
    });

    it('should filter attachments from formErrors', () => {
      const event = 'send';
      component.newConversationForm.setValue({
        attachments: [],
        body: '<p>Test body</p>',
        subject: '',
      });
      component.newConversationForm.controls['attachments'].setErrors({ uploading: true });

      const service = ngMocks.findInstance(MessagingService);
      const spy = jest.spyOn(service, 'createNewConversation$');

      component.onActionClick(event);

      expect(component.formErrors.length).toEqual(1);
      expect(component.formErrors[0].id).toEqual('conversation-form-subject');
      expect(spy).not.toHaveBeenCalled();
    });

    it('should set formErrors and not create if files are still uploading', () => {
      const event = 'send';
      component.newConversationForm.setValue({
        attachments: [],
        body: '<p>Test body</p>',
        subject: '',
      });
      const service = ngMocks.findInstance(MessagingService);
      const spy = jest.spyOn(service, 'createNewConversation$');

      component.onActionClick(event);

      expect(component.formErrors.length).toBeGreaterThan(0);
      expect(spy).not.toHaveBeenCalled();
    });

    it('should create conversation and navigate to messages if the form is valid', () => {
      const event = 'send';
      const mockForm = {
        attachments: [],
        body: '<p>Test body</p>',
        subject: 'Test subject',
      };
      component.newConversationForm.setValue(mockForm);

      const messagingService = ngMocks.findInstance(MessagingService);
      const createSpy = jest.spyOn(messagingService, 'createNewConversation$');
      const route = ngMocks.findInstance(ActivatedRoute);
      const router = ngMocks.findInstance(Router);
      const navigateSpy = jest.spyOn(router, 'navigate');
      const snackService = ngMocks.findInstance(NuverialSnackBarService);
      const successSpy = jest.spyOn(snackService, 'notifyApplicationSuccess');

      component.onActionClick(event);

      expect(component.formErrors.length).toEqual(0);
      expect(createSpy).toHaveBeenCalledWith(mockForm.body, mockForm.subject, []);
      expect(navigateSpy).toHaveBeenCalledWith(['../'], { relativeTo: route });
      expect(successSpy).toHaveBeenCalled();
    });

    it('should create conversation with attachments if the form is valid', () => {
      const event = 'send';
      const mockForm = {
        attachments: [{ documentId: '123', filename: 'test.doc' }],
        body: '<p>Test body</p>',
        subject: 'Test subject',
      };
      component.newConversationForm.setValue(mockForm);

      const messagingService = ngMocks.findInstance(MessagingService);
      const createSpy = jest.spyOn(messagingService, 'createNewConversation$');

      component.onActionClick(event);

      expect(component.formErrors.length).toEqual(0);
      expect(createSpy).toHaveBeenCalledWith(mockForm.body, mockForm.subject, ['123']);
    });

    it('should create conversation without attachments if attachments is null', () => {
      const event = 'send';
      const mockForm = {
        attachments: null,
        body: '<p>Test body</p>',
        subject: 'Test subject',
      };
      component.newConversationForm.setValue(mockForm);

      const messagingService = ngMocks.findInstance(MessagingService);
      const createSpy = jest.spyOn(messagingService, 'createNewConversation$');

      component.onActionClick(event);

      expect(component.formErrors.length).toEqual(0);
      expect(createSpy).toHaveBeenCalledWith(mockForm.body, mockForm.subject, []);
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      jest.restoreAllMocks();
      jest.clearAllMocks();
    });

    it('should handle error when loading conversations', () => {
      const event = 'send';
      const mockForm = {
        attachments: [],
        body: '<p>Test body</p>',
        subject: 'Test subject',
      };
      component.newConversationForm.setValue(mockForm);

      const messagingService = ngMocks.findInstance(MessagingService);
      const createSpy = jest.spyOn(messagingService, 'createNewConversation$').mockImplementation(() => throwError(() => new Error()));
      const router = ngMocks.findInstance(Router);
      const navigateSpy = jest.spyOn(router, 'navigate');
      const snackService = ngMocks.findInstance(NuverialSnackBarService);
      const errorSpy = jest.spyOn(snackService, 'notifyApplicationError');

      component.onActionClick(event);

      expect(component.formErrors.length).toEqual(0);
      expect(createSpy).toHaveBeenCalledWith(mockForm.body, mockForm.subject, []);
      expect(navigateSpy).not.toHaveBeenCalled();
      expect(errorSpy).toHaveBeenCalled();
    });
  });

  describe('dropHandler', () => {
    it('should upload documents', () => {
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

      const uploadDocumentsSpy = jest.spyOn(component.richTextEditorAttachmentComponent, 'uploadDocuments');
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault');

      fixture.componentInstance.dropHandler(event as DragEvent);
      fixture.detectChanges();

      expect(uploadDocumentsSpy).toHaveBeenCalledWith([file]);
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

      const uploadDocumentsSpy = jest.spyOn(component.richTextEditorAttachmentComponent, 'uploadDocuments');

      fixture.componentInstance.dropHandler(event as DragEvent);
      fixture.detectChanges();

      expect(uploadDocumentsSpy).not.toHaveBeenCalled();
    });

    it('should not add files if dataTransfer is undefined', () => {
      const dataTransfer = undefined;
      const event: Partial<DragEvent> = {
        dataTransfer,
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        target: null,
      };

      const uploadDocumentsSpy = jest.spyOn(component.richTextEditorAttachmentComponent, 'uploadDocuments');

      fixture.componentInstance.dropHandler(event as DragEvent);
      fixture.detectChanges();

      expect(uploadDocumentsSpy).not.toHaveBeenCalled();
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

      fixture.componentInstance.dragOverHandler(event as DragEvent);
      fixture.detectChanges();

      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });
});

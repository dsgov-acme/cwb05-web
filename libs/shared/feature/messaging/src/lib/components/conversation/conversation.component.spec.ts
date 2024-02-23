import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';

import { ChangeDetectorRef } from '@angular/core';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { ConversationMessageModel, ConversationMessageModelMock, ConversationMockModel, IConversationMessage } from '@dsg/shared/data-access/work-api';
import { DocumentFormService } from '@dsg/shared/feature/documents';
import { LoadingService, NuverialSnackBarService } from '@dsg/shared/ui/nuverial';
import { HttpTestingModule, PagingResponseModel } from '@dsg/shared/utils/http';
import { LoggingAdapter } from '@dsg/shared/utils/logging';
import { MockProvider, ngMocks } from 'ng-mocks';
import { BehaviorSubject, of } from 'rxjs';
import { MessagingService } from '../../services';
import { ConversationComponent } from './conversation.component';

window.HTMLElement.prototype.scrollIntoView = jest.fn();

jest.mock('rxjs', () => {
  const operators = jest.requireActual('rxjs');
  Object.defineProperty(operators, 'delay', {
    value: () => (s: any) => s,
    writable: false,
  });

  return operators;
});

const fileData = 'new file doc';
const fileName = 'file.doc';
const fileType = 'application/msword';
const file = new File([fileData], fileName, { type: fileType });

describe('ConversationComponent', () => {
  let component: ConversationComponent;
  let fixture: ComponentFixture<ConversationComponent>;
  const conversationId = '123-456-789';
  const paramMap = new BehaviorSubject(convertToParamMap({ conversationId }));

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConversationComponent, NoopAnimationsModule, MatSnackBarModule, HttpTestingModule],
      providers: [
        MockProvider(ActivatedRoute, {
          paramMap: paramMap,
        }),
        MockProvider(ChangeDetectorRef),
        MockProvider(DocumentFormService, {}),
        LoadingService,
        MockProvider(LoggingAdapter),
        MockProvider(MessagingService, {
          getConversationReplies$: jest.fn().mockImplementation(() =>
            of({
              conversation: ConversationMockModel,
              messages: [ConversationMessageModelMock],
              pagingMetadata: new PagingResponseModel(),
            }),
          ),
          replyToAConversation$: jest.fn().mockImplementation(() => of(ConversationMessageModelMock)),
        }),
      ],
    }).compileComponents();

    jest.useFakeTimers({ legacyFakeTimers: true });
    fixture = TestBed.createComponent(ConversationComponent);
    component = fixture.componentInstance;
    component.replying = true;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('trackByFn', async () => {
    const results = component.trackByFn(1);
    expect(results).toEqual(1);
  });

  it('should load message and replies', () => {
    const replies = fixture.debugElement.queryAll(By.css('.message'));
    expect(replies.length).toBe(2);
  });

  it('should reply to a conversation', () => {
    fixture.detectChanges();
    const messageService = ngMocks.findInstance(MessagingService);
    const replySpy = jest.spyOn(messageService, 'replyToAConversation$');
    const snackService = ngMocks.findInstance(NuverialSnackBarService);
    const successSpy = jest.spyOn(snackService, 'notifyApplicationSuccess');
    jest.spyOn(global, 'setTimeout');

    const testBody = '<p>Test</p>';
    component.onActionClick('reply');
    expect(component.actions).toBe(component['_replyActions']);
    const richText = fixture.debugElement.queryAll(By.css('.conversation__reply__message'));
    jest.runAllTimers();
    expect(setTimeout).toBeCalled();
    expect(richText).toBeTruthy();
    component.replyForm.setValue({
      body: testBody,
      attachments: [],
    });

    component.onActionClick('send');
    expect(replySpy).toHaveBeenCalledWith(conversationId, testBody, []);
    expect(successSpy).toHaveBeenCalled();
  });

  it('should create conversation with attachments if the form is valid', () => {
    fixture.detectChanges();
    const messageService = ngMocks.findInstance(MessagingService);
    const replySpy = jest.spyOn(messageService, 'replyToAConversation$');
    const snackService = ngMocks.findInstance(NuverialSnackBarService);
    const successSpy = jest.spyOn(snackService, 'notifyApplicationSuccess');
    jest.spyOn(global, 'setTimeout');

    const testBody = '<p>Test</p>';
    component.onActionClick('reply');
    expect(component.actions).toBe(component['_replyActions']);
    jest.runAllTimers();
    expect(setTimeout).toBeCalled();

    const mockForm = {
      attachments: [{ documentId: '123', filename: 'test.doc' }],
      body: '<p>Test</p>',
    };
    component.replyForm.setValue(mockForm);

    component.onActionClick('send');
    expect(replySpy).toHaveBeenCalledWith(conversationId, testBody, ['123']);
    expect(successSpy).toHaveBeenCalled();
  });

  it('should create conversation without attachments if attachments is null', () => {
    fixture.detectChanges();
    const messageService = ngMocks.findInstance(MessagingService);
    const replySpy = jest.spyOn(messageService, 'replyToAConversation$');
    const snackService = ngMocks.findInstance(NuverialSnackBarService);
    const successSpy = jest.spyOn(snackService, 'notifyApplicationSuccess');
    jest.spyOn(global, 'setTimeout');

    const testBody = '<p>Test</p>';
    component.onActionClick('reply');
    expect(component.actions).toBe(component['_replyActions']);
    jest.runAllTimers();
    expect(setTimeout).toBeCalled();

    const mockForm = {
      attachments: null,
      body: '<p>Test</p>',
    };
    component.replyForm.setValue(mockForm);

    component.onActionClick('send');
    expect(replySpy).toHaveBeenCalledWith(conversationId, testBody, []);
    expect(successSpy).toHaveBeenCalled();
  });

  it('should toggle the message collapse if total messages is more than 1', fakeAsync(() => {
    tick(100);
    fixture.detectChanges();
    const message = new ConversationMessageModel();
    expect(message.collapsed).toBeTruthy();
    component.toggleCollapseMessage(message);
    expect(message.collapsed).toBeFalsy();
  }));

  it('should not toggle the message if the conversation has more than 1 message', () => {
    component.conversation.totalMessages = 1;
    const message = new ConversationMessageModel();
    expect(message.collapsed).toBeTruthy();
    component.toggleCollapseMessage(message);
    expect(message.collapsed).toBeTruthy();
  });

  it('should toggle all message', () => {
    component.toggleAllMessages();
    expect(component.messagesExpanded).toBeTruthy();
    expect(component.toggleAllMessagesText).toBe('COLLAPSE ALL');
    expect(component.toggleAllMessagesIcon).toBe('unfold_less');
  });

  it('should load all messages', done => {
    component['_fetchMessages'].subscribe(() => {
      expect(component['_pagingRequestModel'].pageSize).toBe(ConversationMockModel.totalMessages);
      done();
    });
    component.loadAllMessages();
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      jest.resetAllMocks();
    });

    it('should display the error if the form is invalid', () => {
      const messageService = ngMocks.findInstance(MessagingService);
      const replySpy = jest.spyOn(messageService, 'replyToAConversation$');
      const formErrors = fixture.debugElement.queryAll(By.css('.conversation__reply__errors'));

      const testBody = '';
      component.onActionClick('reply');
      const richText = fixture.debugElement.queryAll(By.css('.conversation__reply__message'));
      expect(richText).toBeTruthy();
      component.replyForm.setValue({
        body: testBody,
        attachments: [],
      });

      component.onActionClick('send');
      expect(replySpy).not.toHaveBeenCalled();
      expect(component.formErrors.length).toBeTruthy();
      expect(formErrors).toBeTruthy();
    });

    it('should throw an error if there is no conversation id', () => {
      paramMap.next(convertToParamMap({}));
      fixture = TestBed.createComponent(ConversationComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      const messageService = ngMocks.findInstance(MessagingService);
      const replySpy = jest.spyOn(messageService, 'getConversationReplies$');
      const replies = fixture.debugElement.queryAll(By.css('.message'));

      expect(replySpy).not.toHaveBeenCalled();
      expect(replies.length).toBeFalsy();
    });
  });

  describe('attachment indicator', () => {
    it('should show attachment indicator if attachments > 0', () => {
      const attachmentsMock: IConversationMessage = {
        attachments: ['23241241', '124124121', '124414141'],
        body: '<p>test 2</p>',
        id: '9e0006f0-2a02-4aed-a7f0-f34d05dfb0c9',
        sender: {
          displayName: 'Test user2',
          userId: '8abfb88d-b933-48e6-abf5-1d1a1bc94d7b',
        },
        timestamp: '2023-01-30T01:06:07.524316Z',
      };
      const messageWithAttachments: ConversationMessageModel = new ConversationMessageModel(attachmentsMock);

      const newResponse = {
        conversation: ConversationMockModel,
        messages: [messageWithAttachments],
        pagingMetadata: new PagingResponseModel(),
      };
      const messageService = ngMocks.findInstance(MessagingService);
      jest.spyOn(messageService, 'getConversationReplies$').mockReturnValue(of(newResponse));

      fixture = TestBed.createComponent(ConversationComponent);
      component = fixture.componentInstance;
      component.messages$ = of([messageWithAttachments]);

      fixture.detectChanges();
      const indicator = fixture.debugElement.query(By.css('.message__attachment-indicator'));
      expect(indicator).toBeTruthy();
    });

    it('should not show attachment indicator if no attachments', () => {
      fixture = TestBed.createComponent(ConversationComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      const indicator = fixture.debugElement.queryAll(By.css('.message__attachment-indicator'));
      expect(indicator.length).toEqual(0);
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

      const richTextEditorAttachmentComponentMock = {
        uploadDocuments: jest.fn(() => {
          return;
        }),
      };
      component.richTextEditorAttachmentComponent = richTextEditorAttachmentComponentMock as any;
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

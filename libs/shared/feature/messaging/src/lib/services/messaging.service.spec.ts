import { HttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { UserMock } from '@dsg/shared/data-access/user-api';
import {
  ConversationMessageModel,
  ConversationMessageModelMock,
  ConversationMock,
  ConversationMockModel,
  ConversationWithRepliesModelMock,
  ConversationsPaginatedResponseMock,
  NewConversationModelMock,
  NewConversationResponseMock,
  TransactionMock,
  WorkApiRoutesService,
} from '@dsg/shared/data-access/work-api';
import { UserStateService } from '@dsg/shared/feature/app-state';
import { FormRendererService } from '@dsg/shared/feature/form-nuv';
import { Filter, PagingRequestModel } from '@dsg/shared/utils/http';
import { MockProvider, ngMocks } from 'ng-mocks';
import { of } from 'rxjs';
import { MessagingService } from './messaging.service';

describe('MessagingService', () => {
  let service: MessagingService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        MockProvider(HttpClient),
        MockProvider(WorkApiRoutesService, {
          createConversation$: jest.fn().mockImplementation(() => of(NewConversationResponseMock)),
          createNewMessageInConversation$: jest.fn().mockImplementation(() => of(ConversationMessageModelMock)),
          getConversationReplies$: jest.fn().mockImplementation(() => of(ConversationWithRepliesModelMock)),
          getConversations$: jest.fn().mockImplementation(() => of(ConversationsPaginatedResponseMock)),
        }),
        MockProvider(UserStateService, {
          user$: of(UserMock),
        }),
        MockProvider(FormRendererService, {
          transaction: TransactionMock,
        } as FormRendererService),
      ],
    });

    service = TestBed.inject(MessagingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize', () => {
    const testReferenceType = 'TEST';
    const testReferenceId = '123';

    service.initialize(testReferenceType, testReferenceId);

    expect(service['_referenceType'].getValue()).toBe(testReferenceType);
    expect(service['_referenceId'].getValue()).toBe(testReferenceId);
  });

  it('should cleanup', async () => {
    const testReferenceType = 'TEST';
    const testReferenceId = '123';

    service.initialize(testReferenceType, testReferenceId);

    expect(service['_referenceType'].getValue()).toBeTruthy();
    expect(service['_referenceId'].getValue()).toBeTruthy();

    service.cleanUp();

    expect(service['_referenceType'].getValue()).toBe('');
    expect(service['_referenceId'].getValue()).toBe('');
  });

  describe('getConversations$', () => {
    beforeEach(() => {
      service.cleanUp();
      const testReferenceType = 'TEST';
      const testReferenceId = '123';
      service.initialize(testReferenceType, testReferenceId);
    });

    it('should get conversations', done => {
      const filter: Filter[] = [
        {
          field: 'testField',
          value: 'test',
        },
      ];
      const expectedFilers: Filter[] = [
        {
          field: 'testField',
          value: 'test',
        },
        {
          field: 'referenceType',
          value: 'TEST',
        },
        {
          field: 'referenceId',
          value: '123',
        },
      ];
      const pagination = new PagingRequestModel();

      const workService = ngMocks.findInstance(WorkApiRoutesService);
      const workSpy = jest.spyOn(workService, 'getConversations$');

      service.getConversations$(filter, pagination).subscribe(response => {
        expect(workSpy).toBeCalledWith(expectedFilers, pagination);
        expect(response.items[0]).toEqual(ConversationMock);
        done();
      });
    });
  });

  describe('createNewConversation$', () => {
    it('should create a conversation', done => {
      service.initialize('TRANSACTION', TransactionMock.id);

      const messageBody = NewConversationModelMock.messageBody;
      const subject = NewConversationModelMock.subject;

      const workService = ngMocks.findInstance(WorkApiRoutesService);
      const workSpy = jest.spyOn(workService, 'createConversation$');

      service.createNewConversation$(messageBody, subject, []).subscribe(() => {
        expect(workSpy).toHaveBeenCalledWith(NewConversationModelMock);
        done();
      });
    });
  });

  describe('getConversationReplies$', () => {
    it('should get replies to a conversation', done => {
      const conversationId = '123-456';
      const pagination = new PagingRequestModel();

      service.getConversationReplies$(conversationId, pagination).subscribe(response => {
        expect(response.conversation).toEqual(ConversationMockModel);
        expect(response.messages).toEqual([ConversationMessageModelMock]);
        done();
      });
    });
  });

  describe('replyToAConversation$', () => {
    it('should create a new message in a conversation', done => {
      const conversationId = '123-456';
      const body = '<p>Test</p>';
      const expectedMessage = new ConversationMessageModel();
      expectedMessage.body = body;
      expectedMessage.attachments = [];

      const workService = ngMocks.findInstance(WorkApiRoutesService);
      const spy = jest.spyOn(workService, 'createNewMessageInConversation$');

      service.replyToAConversation$(conversationId, body, []).subscribe(() => {
        expect(spy).toHaveBeenCalledWith(conversationId, expectedMessage);
        done();
      });
    });

    it('should create a new message in a conversation with attachments', done => {
      const conversationId = '123-456';
      const body = '<p>Test</p>';
      const expectedMessage = new ConversationMessageModel();
      expectedMessage.body = body;
      expectedMessage.attachments = ['123'];

      const workService = ngMocks.findInstance(WorkApiRoutesService);
      const spy = jest.spyOn(workService, 'createNewMessageInConversation$');

      service.replyToAConversation$(conversationId, body, ['123']).subscribe(() => {
        expect(spy).toHaveBeenCalledWith(conversationId, expectedMessage);
        done();
      });
    });
  });
});

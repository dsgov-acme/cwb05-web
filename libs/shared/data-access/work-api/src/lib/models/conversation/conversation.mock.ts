import { PagingResponseModel } from '@dsg/shared/utils/http';
import { TransactionMock } from '../transaction/transaction.mock';
import { ConversationMessageModel, IConversationMessage, IConversationMessagesPaginationResponse } from './conversation-message.model';
import { ConversationModel, IConversation, IConversationsPaginationResponse } from './conversation.model';
import { INewConversation, INewConversationResponse, NewConversationModel } from './new-conversation.model';

export const ConversationMock: IConversation = {
  createdTimestamp: '2024-01-15T17:18:57.713274Z',
  id: 'fbf48451-99ba-446b-8c18-0caf788056c4',
  lastUpdatedTimestamp: '2024-01-15T17:18:57.713274Z',
  originalMessage: {
    attachments: [],
    body: '<b>Test body of test message</b>',
    id: 'f20b5eec-4d47-4a7b-9f5b-517685458170',
    sender: {
      displayName: 'Changed Legal Name',
      userId: '680f61b1-9225-4d88-92b2-3f3e695844a3',
    },
    timestamp: '2024-01-15T17:18:57.713774Z',
  },
  subject: 'Test Message',
  totalMessages: 2,
};

export const ConversationMockModel = new ConversationModel(ConversationMock);

export const ConversationsPaginatedResponseMock: IConversationsPaginationResponse<IConversation> = {
  items: [ConversationMock],
  pagingMetadata: new PagingResponseModel({
    nextPage: '',
    pageNumber: 1,
    pageSize: 10,
    totalCount: 200,
  }),
};

export const NewConversationMock: INewConversation = {
  entityReference: {
    entityId: TransactionMock.id,
    type: 'TRANSACTION',
  },
  message: {
    attachments: [],
    body: '<p>Create new message</p>',
  },
  subject: 'test Message create',
};

export const NewConversationModelMock: NewConversationModel = new NewConversationModel(NewConversationMock);

export const NewConversationResponseMock: INewConversationResponse = {
  createdBy: 'string',
  createdTimestamp: '2024-01-25T23:20:55.696Z',
  entityReference: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  lastUpdatedBy: 'string',
  lastUpdatedTimestamp: '2024-01-25T23:20:55.696Z',
  originalMessage: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  subject: 'string',
};

export const ConversationMessageMock: IConversationMessage = {
  attachments: [],
  body: '<p>test</p>',
  id: '9e0006f0-2a02-4aed-a7f0-f34d05dfb0c3',
  sender: {
    displayName: 'Test user',
    userId: '8abfb88d-b933-48e6-abf5-1d1a1bc94c5b',
  },
  timestamp: '2024-01-30T01:06:07.524316Z',
};

export const ConversationMessageModelMock = new ConversationMessageModel(ConversationMessageMock);

export const ConversationWithRepliesMock: IConversationMessagesPaginationResponse<IConversationMessage> = {
  ...ConversationMock,
  messages: [ConversationMessageMock],
  pagingMetadata: new PagingResponseModel({
    nextPage: '',
    pageNumber: 1,
    pageSize: 10,
    totalCount: 200,
  }),
};
export const ConversationWithRepliesModelMock: IConversationMessagesPaginationResponse<ConversationMessageModel> = {
  ...ConversationMock,
  messages: [new ConversationMessageModel(ConversationMessageMock)],
  pagingMetadata: new PagingResponseModel({
    nextPage: '',
    pageNumber: 1,
    pageSize: 10,
    totalCount: 200,
  }),
};

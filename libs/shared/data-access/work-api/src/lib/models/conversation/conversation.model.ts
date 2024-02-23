import { IPaginationResponse, SchemaModel } from '@dsg/shared/utils/http';
import { ConversationMessageModel, IConversationMessage } from './conversation-message.model';

export interface IConversation {
  id: string;
  subject: string;
  createdTimestamp: string;
  lastUpdatedTimestamp: string;
  totalMessages: number;
  originalMessage: IConversationMessage;
}

export interface IConversationsPaginationResponse<T> extends IPaginationResponse {
  items: T[];
}

export class ConversationModel implements SchemaModel<IConversation> {
  public id = '';
  public subject = '';
  public createdTimestamp = '';
  public lastUpdatedTimestamp = '';
  public totalMessages = 0;
  public originalMessage!: ConversationMessageModel;
  public createdByDisplayName = '';

  constructor(conversationSchema?: IConversation) {
    if (conversationSchema) {
      this.fromSchema(conversationSchema);
    }
  }

  public fromSchema(conversationSchema: IConversation): void {
    this.id = conversationSchema.id;
    this.subject = conversationSchema.subject;
    this.createdTimestamp = conversationSchema.createdTimestamp;
    this.lastUpdatedTimestamp = conversationSchema.lastUpdatedTimestamp;
    this.totalMessages = conversationSchema.totalMessages;
    this.originalMessage = new ConversationMessageModel(conversationSchema.originalMessage);
    this.createdByDisplayName = conversationSchema.originalMessage.sender.displayName;
  }
}

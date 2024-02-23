import { IPaginationResponse, SchemaModel } from '@dsg/shared/utils/http';
import { IConversation } from './conversation.model';

export interface IMessage {
  body: string;
  attachments: string[];
}

export interface IConversationSender {
  userId: string;
  displayName: string;
}

export interface IConversationMessage extends IMessage {
  id: string;
  sender: IConversationSender;
  timestamp: string;
  isOriginalMessage?: boolean;
}

export interface IConversationMessagesPaginationResponse<T> extends IPaginationResponse, IConversation {
  messages: T[];
}

export class ConversationMessageModel implements SchemaModel<IConversationMessage> {
  public id = '';
  public senderDisplayName = '';
  public timestamp = '';
  public body = '';
  public attachments: string[] = [];
  public collapsed = true;
  public isOriginalMessage = false;

  constructor(schema?: IConversationMessage) {
    if (schema) {
      this.fromSchema(schema);
    }
  }

  public get noFormatBody() {
    return this.body.replace(/(<([^<>]+)>)/gi, ' ').trim();
  }

  public fromSchema(schema: IConversationMessage): void {
    this.id = schema.id;
    this.senderDisplayName = schema.sender.displayName;
    this.timestamp = schema.timestamp;
    this.body = schema.body;
    this.attachments = schema.attachments;
    this.isOriginalMessage = !!schema.isOriginalMessage;
  }

  public toSchema(): Partial<IConversationMessage> {
    return {
      attachments: this.attachments,
      body: this.body,
    };
  }
}

import { SchemaModel } from '@dsg/shared/utils/http';
import { IMessage } from './conversation-message.model';

export interface IEntityReferecne {
  type: string;
  entityId: string;
}

export interface INewConversation {
  subject: string;
  message: IMessage;
  entityReference: IEntityReferecne;
}

export interface INewConversationResponse {
  id: string;
  subject: string;
  originalMessage: string;
  entityReference: string;
  createdBy: string;
  lastUpdatedBy: string;
  createdTimestamp: string;
  lastUpdatedTimestamp: string;
}

export class NewConversationModel implements SchemaModel<INewConversation> {
  public subject = '';
  public messageBody = '';
  public messageAttachments: string[] = [];
  public referenceType = '';
  public referenceId = '';

  constructor(newConversationSchema?: INewConversation) {
    if (newConversationSchema) {
      this.fromSchema(newConversationSchema);
    }
  }

  public fromSchema(newConversationSchema: INewConversation): void {
    this.subject = newConversationSchema.subject;
    this.messageBody = newConversationSchema.message.body;
    this.messageAttachments = newConversationSchema.message.attachments;
    this.referenceId = newConversationSchema.entityReference.entityId;
    this.referenceType = newConversationSchema.entityReference.type;
  }

  public toSchema(): INewConversation {
    return {
      entityReference: {
        entityId: this.referenceId,
        type: this.referenceType,
      },
      message: {
        attachments: this.messageAttachments,
        body: this.messageBody,
      },
      subject: this.subject,
    };
  }
}

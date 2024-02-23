import { Injectable } from '@angular/core';
import {
  ConversationMessageModel,
  ConversationModel,
  IConversation,
  IConversationsPaginationResponse,
  NewConversationModel,
  WorkApiRoutesService,
} from '@dsg/shared/data-access/work-api';
import { Filter, PagingRequestModel, PagingResponseModel } from '@dsg/shared/utils/http';
import { BehaviorSubject, Observable, map } from 'rxjs';

export interface ConversationMessages {
  conversation: ConversationModel;
  messages: ConversationMessageModel[];
  pagingMetadata: PagingResponseModel;
}

@Injectable({ providedIn: 'root' })
export class MessagingService {
  private readonly _referenceType: BehaviorSubject<string> = new BehaviorSubject<string>('');
  private readonly _referenceId: BehaviorSubject<string> = new BehaviorSubject<string>('');

  constructor(private readonly _workApiRoutesService: WorkApiRoutesService) {}

  public initialize(referenceType: string, referenceId: string) {
    this._referenceType.next(referenceType);
    this._referenceId.next(referenceId);
  }

  public getConversations$(filters: Filter[], pagingRequestModel: PagingRequestModel): Observable<IConversationsPaginationResponse<ConversationModel>> {
    const requestFilters: Filter[] = [
      ...filters,
      {
        field: 'referenceType',
        value: this._referenceType.getValue(),
      },
      {
        field: 'referenceId',
        value: this._referenceId.getValue(),
      },
    ];

    return this._workApiRoutesService.getConversations$(requestFilters, pagingRequestModel);
  }

  public getConversationReplies$(conversationId: string, pagingRequestModel?: PagingRequestModel): Observable<ConversationMessages> {
    return this._workApiRoutesService.getConversationReplies$(conversationId, pagingRequestModel).pipe(
      map(response => ({
        conversation: new ConversationModel(response as IConversation),
        messages: response.messages.filter(message => !message.isOriginalMessage),
        pagingMetadata: response.pagingMetadata,
      })),
    );
  }

  public createNewConversation$(messageBody: string, subject: string, attachments: string[]) {
    const newConversation = new NewConversationModel();

    newConversation.messageBody = messageBody;
    newConversation.subject = subject;
    newConversation.referenceId = this._referenceId.value;
    newConversation.referenceType = this._referenceType.value;
    newConversation.messageAttachments = attachments;

    return this._workApiRoutesService.createConversation$(newConversation);
  }

  public replyToAConversation$(conversationId: string, body: string, attachments: string[]): Observable<ConversationMessageModel> {
    const newMessage = new ConversationMessageModel();

    newMessage.attachments = attachments;
    newMessage.body = body;

    return this._workApiRoutesService.createNewMessageInConversation$(conversationId, newMessage);
  }

  public cleanUp() {
    this._referenceType.next('');
    this._referenceId.next('');
  }
}

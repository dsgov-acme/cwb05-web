import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewChild } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ConversationMessageModel, ConversationModel } from '@dsg/shared/data-access/work-api';
import { DocumentEntry, DocumentFormService, RichTextEditorAttachmentComponent } from '@dsg/shared/feature/documents';
import { FormRendererService } from '@dsg/shared/feature/form-nuv';
import {
  FooterAction,
  FormErrorsFromGroup,
  IFormError,
  LoadingService,
  MarkAllControlsAsTouched,
  NuverialButtonComponent,
  NuverialFooterActionsComponent,
  NuverialFormErrorsComponent,
  NuverialIconComponent,
  NuverialRichTextEditorComponent,
  NuverialRichTextViewerComponent,
  NuverialTagComponent,
  NuverialTimeElapsedPipe,
} from '@dsg/shared/ui/nuverial';
import { PagingRequestModel } from '@dsg/shared/utils/http';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Validators as NgxEditorValidators } from 'ngx-editor';
import { BehaviorSubject, Observable, combineLatest, delay, filter, map, of, switchMap, take, tap, throwError } from 'rxjs';
import { MessagingService } from '../../services';
import { AttachmentsListViewComponent } from '../attachments-list-view';

enum Actions {
  reply = 'reply',
  send = 'send',
  cancel = 'cancel',
}

@UntilDestroy()
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    NuverialRichTextViewerComponent,
    NuverialTagComponent,
    NuverialFooterActionsComponent,
    NuverialButtonComponent,
    NuverialIconComponent,
    ReactiveFormsModule,
    FormsModule,
    NuverialRichTextEditorComponent,
    NuverialFormErrorsComponent,
    NuverialTimeElapsedPipe,
    AttachmentsListViewComponent,
    RichTextEditorAttachmentComponent,
  ],
  selector: 'dsg-conversation',
  standalone: true,
  styleUrls: ['./conversation.component.scss'],
  templateUrl: './conversation.component.html',
})
export class ConversationComponent {
  @ViewChild(RichTextEditorAttachmentComponent) public richTextEditorAttachmentComponent!: RichTextEditorAttachmentComponent;

  public replying = false;
  public allMessagesLoaded = false;
  public conversation: ConversationModel = new ConversationModel();
  public messagesExpanded = false;
  public messages$: Observable<ConversationMessageModel[]>;

  // Order disabled to match the order of the form in the form errors component
  /* eslint-disable sort-keys */
  public replyForm = new FormGroup({
    body: new FormControl('', [NgxEditorValidators.required()]),
    attachments: new FormControl<DocumentEntry[]>([]),
  });
  public formErrors: IFormError[] = [];
  public formConfigs = {
    body: {
      id: 'reply-form-body',
      label: 'Message',
    },
    attachments: {
      id: 'conversation-form-attachments',
      label: 'Attachments',
    },
  };

  public attachmentNames: Record<string, Record<string, string>> = {};
  public attachmentSizes: Record<string, number> = {};

  private _conversationId = '';
  private readonly _fetchMessages: BehaviorSubject<void> = new BehaviorSubject<void>(undefined);
  private readonly _pagingRequestModel: PagingRequestModel = new PagingRequestModel({
    pageSize: 5,
    sortBy: 'timestamp',
    sortOrder: 'DESC',
  });
  private readonly _replies: BehaviorSubject<ConversationMessageModel[]> = new BehaviorSubject<ConversationMessageModel[]>([]);
  private readonly _expandMessages: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  private readonly _conversationAction: FooterAction[] = [
    {
      key: Actions.reply,
      uiClass: 'Primary',
      uiLabel: 'Reply',
    },
  ];
  private readonly _replyActions: FooterAction[] = [
    {
      key: Actions.send,
      uiClass: 'Primary',
      uiLabel: 'Send',
    },
    {
      key: Actions.cancel,
      uiClass: 'Secondary',
      uiLabel: 'Cancel',
    },
  ];

  constructor(
    private readonly _cdr: ChangeDetectorRef,

    private readonly _route: ActivatedRoute,

    private readonly _loadingService: LoadingService,

    private readonly _messagingService: MessagingService,
    private readonly _documentFormService: DocumentFormService,
    private readonly _formRendererService: FormRendererService,
  ) {
    this.messages$ = this._fetchMessages
      .asObservable()
      .pipe(
        delay(1), // This is needed to show the loading indicator
        switchMap(() => this._route.paramMap),
        tap(params => {
          this._conversationId = params.get('conversationId') ?? '';
        }),
        this._loadingService.switchMapWithLoading(() => {
          if (this._conversationId) {
            return this._messagingService.getConversationReplies$(this._conversationId, this._pagingRequestModel);
          }

          return throwError(() => new Error('No conversation id found'));
        }),
        tap(response => {
          this.conversation = response.conversation;
        }),
      )
      .pipe(
        filter(response => !!response),
        switchMap(response => combineLatest([this._replies, of(response)])),
        map(([replies, response]) => {
          let messages = response.messages;
          if (!this.allMessagesLoaded && response.messages.length >= 4) {
            messages = response.messages.slice(0, 2);
          }

          return [...replies, ...messages, response.conversation.originalMessage];
        }),
        tap(messages => {
          for (const message of messages) {
            message.attachments.forEach(attachment => {
              this._documentFormService
                .getDocumentById$(attachment)
                .pipe(
                  take(1),
                  tap(document => {
                    if (!this.attachmentNames[message.id]) {
                      this.attachmentNames[message.id] = {};
                    }
                    this.attachmentNames[message.id][attachment] = document.filename;
                    this.attachmentSizes[message.id] = Object.keys(this.attachmentNames[message.id]).length;
                    this._cdr.markForCheck();
                  }),
                )
                .subscribe();
            });
          }
        }),
        tap((replies: ConversationMessageModel[]) => {
          this._expandMessages
            .pipe(
              tap(expand => {
                if (expand) {
                  replies.forEach(reply => (reply.collapsed = false));
                } else if (replies.length) {
                  replies.forEach(reply => (reply.collapsed = true));
                  replies[0].collapsed = false;
                } else {
                  this.conversation.originalMessage.collapsed = false;
                }
              }),
              untilDestroyed(this),
            )
            .subscribe();
        }),
      );
  }

  public get actions() {
    return this.replying ? this._replyActions : this._conversationAction;
  }

  public get toggleAllMessagesText() {
    return this.messagesExpanded ? 'COLLAPSE ALL' : 'EXPAND ALL';
  }

  public get toggleAllMessagesIcon() {
    return this.messagesExpanded ? 'unfold_less' : 'unfold_more';
  }

  public get transactionId(): string {
    return this._formRendererService.transactionId;
  }

  public trackByFn(index: number): number {
    return index;
  }

  public onActionClick(event: string) {
    switch (event) {
      case Actions.reply:
        this._openReplyForm();
        break;
      case Actions.cancel:
        this.replyForm.reset();
        this.replying = false;
        break;
      case Actions.send:
        this._replyToConversation();
        break;
    }
  }

  public toggleCollapseMessage(message: ConversationMessageModel) {
    if (this.conversation.totalMessages > 1) {
      message.collapsed = !message.collapsed;
    }
  }

  public toggleAllMessages() {
    this.messagesExpanded = !this.messagesExpanded;
    if (!this.allMessagesLoaded) {
      this.loadAllMessages();
    }
    this._expandMessages.next(this.messagesExpanded);
  }

  public showMoreButton(element: HTMLElement): boolean {
    return element.offsetWidth < element.scrollWidth;
  }

  public loadAllMessages() {
    this.allMessagesLoaded = true;
    this._pagingRequestModel.pageSize = this.conversation.totalMessages + this._replies.value.length;
    this._fetchMessages.next();
    this._replies.next([]);
  }

  public dropHandler(event: DragEvent): void {
    event.preventDefault();

    const files = event.dataTransfer?.files;

    if (!files) return;

    this.richTextEditorAttachmentComponent.uploadDocuments(Array.from(files));
  }

  public dragOverHandler(event: DragEvent): void {
    event.preventDefault();
  }

  private _openReplyForm() {
    this.replying = true;
    setTimeout(() => {
      document.getElementById('reply-form')?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  }

  private _replyToConversation() {
    this.formErrors = [];

    if (!this.replyForm.valid) {
      this.formErrors = FormErrorsFromGroup(this.replyForm, this.formConfigs).filter(error => error.id !== 'conversation-form-attachments');
      MarkAllControlsAsTouched(this.replyForm);

      return;
    }

    const newReply = this.replyForm.value;
    const attachmentIds = newReply.attachments?.map((attachment: DocumentEntry) => attachment.documentId);
    this._messagingService
      .replyToAConversation$(this._conversationId, newReply.body ?? '', attachmentIds ?? [])
      .pipe(
        this._loadingService.withLoading({ errorNotification: 'Error sending message', successNotification: 'Message sent' }),
        filter(response => !!response),
        tap(message => {
          this._replies.next([message, ...this._replies.value]);
          this.onActionClick(Actions.cancel);
        }),
        take(1),
      )
      .subscribe();
  }
}

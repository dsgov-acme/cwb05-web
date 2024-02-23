import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewChild } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DocumentEntry, RichTextEditorAttachmentComponent } from '@dsg/shared/feature/documents';
import { FormRendererService } from '@dsg/shared/feature/form-nuv';
import {
  FooterAction,
  FormErrorsFromGroup,
  IFormError,
  MarkAllControlsAsTouched,
  NuverialButtonComponent,
  NuverialFileDragAndDropComponent,
  NuverialFooterActionsComponent,
  NuverialFormErrorsComponent,
  NuverialIconComponent,
  NuverialRichTextEditorComponent,
  NuverialSnackBarService,
  NuverialTextInputComponent,
} from '@dsg/shared/ui/nuverial';
import { Validators as NgxEditorValidators } from 'ngx-editor';
import { EMPTY, catchError, take, tap } from 'rxjs';
import { MessagingService } from '../../services';

enum Actions {
  send = 'send',
  cancel = 'cancel',
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NuverialTextInputComponent,
    NuverialRichTextEditorComponent,
    NuverialFooterActionsComponent,
    NuverialIconComponent,
    NuverialButtonComponent,
    NuverialFormErrorsComponent,
    RichTextEditorAttachmentComponent,
    NuverialFileDragAndDropComponent,
  ],
  selector: 'dsg-new-conversation',
  standalone: true,
  styleUrls: ['./new-conversation.component.scss'],
  templateUrl: './new-conversation.component.html',
})
export class NewConversationComponent {
  @ViewChild(RichTextEditorAttachmentComponent) public richTextEditorAttachmentComponent!: RichTextEditorAttachmentComponent;

  // Order disabled to match the order of the form in the form errors component
  /* eslint-disable sort-keys */
  public newConversationForm = new FormGroup({
    subject: new FormControl<string>('', [Validators.required]),
    body: new FormControl<string>('', [NgxEditorValidators.required()]),
    attachments: new FormControl<DocumentEntry[]>([]),
  });
  /* eslint-enable sort-keys */

  public formErrors: IFormError[] = [];
  public formConfigs = {
    attachments: {
      id: 'conversation-form-attachments',
      label: 'Attachments',
    },
    body: {
      id: 'conversation-form-body',
      label: 'Message',
    },
    subject: {
      id: 'conversation-form-subject',
      label: 'Subject',
    },
  };

  public actions: FooterAction[] = [
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
    private readonly _router: Router,
    private readonly _route: ActivatedRoute,
    private readonly _messagingService: MessagingService,
    private readonly _nuverialSnackBarService: NuverialSnackBarService,
    private readonly _cdr: ChangeDetectorRef,
    private readonly _formRendererService: FormRendererService,
  ) {}

  public get transactionId(): string {
    return this._formRendererService.transactionId;
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

  public onActionClick(event: string) {
    switch (event) {
      case Actions.send:
        this._createNewConversation();
        break;
      case Actions.cancel:
        this._router.navigate(['../'], { relativeTo: this._route });
        break;
    }
  }

  private _createNewConversation() {
    this.formErrors = [];

    if (!this.newConversationForm.valid) {
      // Don't show attachment errors, just prevent sending message when uploading
      this.formErrors = FormErrorsFromGroup(this.newConversationForm, this.formConfigs).filter(error => error.id !== 'conversation-form-attachments');
      MarkAllControlsAsTouched(this.newConversationForm);

      return;
    }

    const newConversation = this.newConversationForm.value;
    const attachmentIds = newConversation.attachments?.map((attachment: DocumentEntry) => attachment.documentId);

    this._messagingService
      .createNewConversation$(newConversation.body ?? '', newConversation.subject ?? '', attachmentIds ?? [])
      .pipe(
        tap(() => {
          this._nuverialSnackBarService.notifyApplicationSuccess('New conversation created');
          this._router.navigate(['../'], { relativeTo: this._route });
        }),
        catchError(() => {
          this._cdr.markForCheck();
          this._nuverialSnackBarService.notifyApplicationError();

          return EMPTY;
        }),
        take(1),
      )
      .subscribe();
  }
}

import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { DocumentFormService } from '@dsg/shared/feature/documents';
import { NuverialIconComponent } from '@dsg/shared/ui/nuverial';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NuverialIconComponent],
  selector: 'dsg-attachments-list-view',
  standalone: true,
  styleUrls: ['./attachments-list-view.component.scss'],
  templateUrl: './attachments-list-view.component.html',
})
export class AttachmentsListViewComponent {
  /**
   * List of attachment IDs
   */
  @Input() public attachments!: string[];

  /**
   * Names of attachments
   */
  @Input() public attachmentNames: Record<string, string> = {};

  constructor(private readonly _documentFormService: DocumentFormService) {}

  public trackByFn(index: number): number {
    return index;
  }

  public onClick(event: Event) {
    event.stopPropagation();
  }

  public downloadFile(event: Event, attachmentId: string): void {
    this._documentFormService.downloadDocument$(attachmentId, this.attachmentNames[attachmentId] || attachmentId).subscribe();
    event.stopPropagation();
  }
}

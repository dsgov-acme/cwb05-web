import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DocumentFormService, FileStatus, FileUploadBrowserComponent } from '@dsg/shared/feature/documents';
import { UntilDestroy } from '@ngneat/until-destroy';
import { take } from 'rxjs';
import { FormRendererService } from '../../../../services/form-renderer.service';
import { FormlyBaseComponent } from '../../../base';
import { FileUploadFieldProperties } from '../models/formly-file-upload.model';

interface DocumentEntry {
  documentId: string;
  filename: string;
}

@UntilDestroy()
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FileUploadBrowserComponent],
  selector: 'dsg-file-uploader',
  standalone: true,
  styleUrls: ['./file-uploader.component.scss'],
  templateUrl: './file-uploader.component.html',
})
export class FormlyFileUploaderComponent extends FormlyBaseComponent<FileUploadFieldProperties> {
  public loading = false;
  public fileStatus: Map<string, FileStatus> = new Map();
  public filePreview: Map<string, File> = new Map();

  constructor(private readonly _formRendererService: FormRendererService, private readonly _documentFormService: DocumentFormService) {
    super();
  }

  public get documentList(): DocumentEntry[] {
    if (!this.formControl.value) return [];

    if (this.field.props.multiple && Array.isArray(this.formControl.value)) {
      return this.formControl.value;
    } else {
      return [this.formControl.value];
    }
  }

  public get transactionId(): string {
    return this._formRendererService.transactionId;
  }

  public trackByFn(index: number): number {
    return index;
  }

  public openDocument(index: number) {
    const document = this.field.props.multiple ? this.formControl.value[index] : this.formControl.value;

    this._documentFormService.openDocument$(document.documentId).pipe(take(1)).subscribe();
  }
}

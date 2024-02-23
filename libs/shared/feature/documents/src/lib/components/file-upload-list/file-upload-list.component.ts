import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { NUVERIAL_FILE_UPLOAD_STATUS, NuverialDividerComponent, NuverialIconComponent } from '@dsg/shared/ui/nuverial';
import { map } from 'rxjs';
import { FileUploadService } from '../../services';
import { NuverialFileProcessorTooltipComponent } from '../file-processor-tooltip/file-processor-tooltip.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NuverialIconComponent, NuverialFileProcessorTooltipComponent, NuverialDividerComponent],
  selector: 'dsg-file-upload-list',
  standalone: true,
  styleUrls: ['./file-upload-list.component.scss'],
  templateUrl: './file-upload-list.component.html',
})
export class FileUploadListComponent {
  @Input()
  public mobile = false;

  @Output()
  public readonly removeFile = new EventEmitter<string>();

  @Output()
  public readonly stopUpload = new EventEmitter<string>();

  @Output()
  public readonly downloadFile = new EventEmitter<string>();

  public fileList$ = this._fileUploadService.fileStatus$.pipe(map(fileStatus => Array.from(fileStatus.values())));
  public statusOptions = NUVERIAL_FILE_UPLOAD_STATUS;

  constructor(private readonly _fileUploadService: FileUploadService) {}

  public onDownloadFile(name: string): void {
    this.downloadFile.emit(name);
  }

  public onStopUpload(name: string): void {
    this.stopUpload.emit(name);
  }

  public onRemoveFile(name: string): void {
    this.removeFile.emit(name);
  }

  public trackByFn(index: number): number {
    return index;
  }
}

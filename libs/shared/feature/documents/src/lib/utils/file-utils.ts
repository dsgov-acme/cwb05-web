import { NUVERIAL_FILE_UPLOAD_STATUS } from '@dsg/shared/ui/nuverial';
import { IProcessingStatus } from '../components';

export interface DocumentEntry {
  documentId: string;
  filename: string;
}

export interface FileStatus {
  name: string;
  uploadProgress: number;
  processingStatus: IProcessingStatus;
  status: string;
  statusMessage: string;
  errorCode?: number;
}

export function isNullOrEmpty(fileList: FileList | File[]): boolean {
  const files = Array.from(fileList);

  return !files || !files.length || files.reduce((acc, file) => acc || !file.size, false);
}

/**
 * Returns the status message based on the status
 */
export function getStatusMessage(status: string): string {
  switch (status) {
    case NUVERIAL_FILE_UPLOAD_STATUS.success:
      return 'Successful Upload';

    case NUVERIAL_FILE_UPLOAD_STATUS.pending:
      return '';

    case NUVERIAL_FILE_UPLOAD_STATUS.processing:
      return 'Analyzing your upload to ensure it meets requirements';

    case NUVERIAL_FILE_UPLOAD_STATUS.loading:
      return '';

    case NUVERIAL_FILE_UPLOAD_STATUS.failure:
      return 'Document issues detected';

    case NUVERIAL_FILE_UPLOAD_STATUS.unsupportedType:
      return 'File type not allowed';

    case NUVERIAL_FILE_UPLOAD_STATUS.failedAntivirusCheck:
      return 'Antivirus check failed';

    case NUVERIAL_FILE_UPLOAD_STATUS.sizeExceeded:
      return 'File is too large';

    default:
      return '';
  }
}

/**
 * Returns the file status from the error code
 */
export function getStatusFromCode(errorCode: number): string {
  if (errorCode === 415) {
    return NUVERIAL_FILE_UPLOAD_STATUS.unsupportedType;
  } else if (errorCode === 410) {
    return NUVERIAL_FILE_UPLOAD_STATUS.failedAntivirusCheck;
  }

  return '';
}

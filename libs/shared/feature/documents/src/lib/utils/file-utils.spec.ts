import { NUVERIAL_FILE_UPLOAD_STATUS } from '@dsg/shared/ui/nuverial';
import { getStatusFromCode, getStatusMessage, isNullOrEmpty } from './file-utils';

describe('file utils', () => {
  describe('isNullOrEmpty', () => {
    it('should return true for empty file list', () => {
      expect(isNullOrEmpty([])).toBe(true);
    });

    it('should return true if any file in the list has zero size', () => {
      const fileList = [
        new File([''], 'file1.txt', { type: 'text/plain' }),
        new File([''], 'file2.txt', { type: 'text/plain' }),
        new File([''], 'file3.txt', { type: 'text/plain' }),
      ];
      expect(isNullOrEmpty(fileList)).toBe(true);
    });

    it('should return false if all files in the list have non-zero size', () => {
      const fileList = [
        new File(['content'], 'file1.txt', { type: 'text/plain' }),
        new File(['content'], 'file2.txt', { type: 'text/plain' }),
        new File(['content'], 'file3.txt', { type: 'text/plain' }),
      ];
      expect(isNullOrEmpty(fileList)).toBe(false);
    });
  });

  describe('getStatusMessage', () => {
    it('should return "Successful Upload" when status is NUVERIAL_FILE_UPLOAD_STATUS.success', () => {
      const status = NUVERIAL_FILE_UPLOAD_STATUS.success;
      const message = getStatusMessage(status);
      expect(message).toEqual('Successful Upload');
    });

    it('should return an empty string when status is NUVERIAL_FILE_UPLOAD_STATUS.pending', () => {
      const status = NUVERIAL_FILE_UPLOAD_STATUS.pending;
      const message = getStatusMessage(status);
      expect(message).toEqual('');
    });

    it('should return "Analyzing your upload to ensure it meets requirements" when status is NUVERIAL_FILE_UPLOAD_STATUS.processing', () => {
      const status = NUVERIAL_FILE_UPLOAD_STATUS.processing;
      const message = getStatusMessage(status);
      expect(message).toEqual('Analyzing your upload to ensure it meets requirements');
    });

    it('should return an empty string when status is NUVERIAL_FILE_UPLOAD_STATUS.loading', () => {
      const status = NUVERIAL_FILE_UPLOAD_STATUS.loading;
      const message = getStatusMessage(status);
      expect(message).toEqual('');
    });

    it('should return "Document issues detected" when status is NUVERIAL_FILE_UPLOAD_STATUS.failure', () => {
      const status = NUVERIAL_FILE_UPLOAD_STATUS.failure;
      const message = getStatusMessage(status);
      expect(message).toEqual('Document issues detected');
    });

    it('should return "File type not allowed" when status is NUVERIAL_FILE_UPLOAD_STATUS.unsupportedType', () => {
      const status = NUVERIAL_FILE_UPLOAD_STATUS.unsupportedType;
      const message = getStatusMessage(status);
      expect(message).toEqual('File type not allowed');
    });

    it('should return "Antivirus check failed" when status is NUVERIAL_FILE_UPLOAD_STATUS.failedAntivirusCheck', () => {
      const status = NUVERIAL_FILE_UPLOAD_STATUS.failedAntivirusCheck;
      const message = getStatusMessage(status);
      expect(message).toEqual('Antivirus check failed');
    });

    it('should return "File is too large" when status is NUVERIAL_FILE_UPLOAD_STATUS.sizeExceeded', () => {
      const status = NUVERIAL_FILE_UPLOAD_STATUS.sizeExceeded;
      const message = getStatusMessage(status);
      expect(message).toEqual('File is too large');
    });

    it('should return an empty string for unknown status', () => {
      const status = 'unknown';
      const message = getStatusMessage(status);
      expect(message).toEqual('');
    });
  });

  describe('getStatusFromCode', () => {
    it('should return NUVERIAL_FILE_UPLOAD_STATUS.unsupportedType for 415', () => {
      const status = getStatusFromCode(415);
      expect(status).toEqual(NUVERIAL_FILE_UPLOAD_STATUS.unsupportedType);
    });

    it('should return NUVERIAL_FILE_UPLOAD_STATUS.failedAntivirusCheck for 410', () => {
      const status = getStatusFromCode(410);
      expect(status).toEqual(NUVERIAL_FILE_UPLOAD_STATUS.failedAntivirusCheck);
    });

    it('should return an empty string for unknown errorCode', () => {
      const errorCode = 900;
      const message = getStatusFromCode(errorCode);
      expect(message).toEqual('');
    });
  });
});

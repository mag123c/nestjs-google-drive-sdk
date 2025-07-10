import { Readable } from 'stream';
import {
  bufferToStream,
  validateFileName,
  getMimeTypeFromExtension,
  formatFileSize,
} from './file.utils';

describe('FileUtils', () => {
  describe('bufferToStream', () => {
    it('should convert Buffer to Readable stream', () => {
      const buffer = Buffer.from('test content');
      const stream = bufferToStream(buffer);

      expect(stream).toBeInstanceOf(Readable);
    });

    it('should create stream with correct content', async () => {
      const testData = 'Hello, World!';
      const buffer = Buffer.from(testData);
      const stream = bufferToStream(buffer);

      const chunks: Buffer[] = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
      }

      const result = Buffer.concat(chunks).toString();
      expect(result).toBe(testData);
    });
  });

  describe('validateFileName', () => {
    it('should return true for valid file names', () => {
      expect(validateFileName('document.pdf')).toBe(true);
      expect(validateFileName('my-file_name.txt')).toBe(true);
      expect(validateFileName('image (1).jpg')).toBe(true);
      expect(validateFileName('스크린샷.png')).toBe(true);
    });

    it('should return false for invalid file names', () => {
      expect(validateFileName('file<name>.txt')).toBe(false);
      expect(validateFileName('file>name.txt')).toBe(false);
      expect(validateFileName('file:name.txt')).toBe(false);
      expect(validateFileName('file"name.txt')).toBe(false);
      expect(validateFileName('file/name.txt')).toBe(false);
      expect(validateFileName('file\\name.txt')).toBe(false);
      expect(validateFileName('file|name.txt')).toBe(false);
      expect(validateFileName('file?name.txt')).toBe(false);
      expect(validateFileName('file*name.txt')).toBe(false);
    });

    it('should return false for empty or whitespace-only names', () => {
      expect(validateFileName('')).toBe(false);
      expect(validateFileName('   ')).toBe(false);
      expect(validateFileName('\t\n')).toBe(false);
    });
  });

  describe('getMimeTypeFromExtension', () => {
    it('should return correct MIME types for image files', () => {
      expect(getMimeTypeFromExtension('image.jpg')).toBe('image/jpeg');
      expect(getMimeTypeFromExtension('image.jpeg')).toBe('image/jpeg');
      expect(getMimeTypeFromExtension('image.png')).toBe('image/png');
      expect(getMimeTypeFromExtension('image.gif')).toBe('image/gif');
      expect(getMimeTypeFromExtension('image.webp')).toBe('image/webp');
    });

    it('should return correct MIME types for document files', () => {
      expect(getMimeTypeFromExtension('document.pdf')).toBe('application/pdf');
      expect(getMimeTypeFromExtension('document.doc')).toBe(
        'application/msword',
      );
      expect(getMimeTypeFromExtension('document.docx')).toBe(
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      );
      expect(getMimeTypeFromExtension('spreadsheet.xls')).toBe(
        'application/vnd.ms-excel',
      );
      expect(getMimeTypeFromExtension('spreadsheet.xlsx')).toBe(
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
    });

    it('should return correct MIME types for text files', () => {
      expect(getMimeTypeFromExtension('file.txt')).toBe('text/plain');
      expect(getMimeTypeFromExtension('data.csv')).toBe('text/csv');
      expect(getMimeTypeFromExtension('config.json')).toBe('application/json');
      expect(getMimeTypeFromExtension('data.xml')).toBe('application/xml');
    });

    it('should return correct MIME types for media files', () => {
      expect(getMimeTypeFromExtension('video.mp4')).toBe('video/mp4');
      expect(getMimeTypeFromExtension('video.avi')).toBe('video/x-msvideo');
      expect(getMimeTypeFromExtension('audio.mp3')).toBe('audio/mpeg');
      expect(getMimeTypeFromExtension('audio.wav')).toBe('audio/wav');
    });

    it('should handle case insensitive extensions', () => {
      expect(getMimeTypeFromExtension('IMAGE.JPG')).toBe('image/jpeg');
      expect(getMimeTypeFromExtension('Document.PDF')).toBe('application/pdf');
      expect(getMimeTypeFromExtension('File.TXT')).toBe('text/plain');
    });

    it('should return default MIME type for unknown extensions', () => {
      expect(getMimeTypeFromExtension('file.unknown')).toBe(
        'application/octet-stream',
      );
      expect(getMimeTypeFromExtension('file.xyz')).toBe(
        'application/octet-stream',
      );
    });

    it('should return default MIME type for files without extension', () => {
      expect(getMimeTypeFromExtension('filename')).toBe(
        'application/octet-stream',
      );
      expect(getMimeTypeFromExtension('')).toBe('application/octet-stream');
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
      expect(formatFileSize(500)).toBe('500 Bytes');
      expect(formatFileSize(999)).toBe('999 Bytes');
    });

    it('should format KB correctly', () => {
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1536)).toBe('1.5 KB');
      expect(formatFileSize(2048)).toBe('2 KB');
    });

    it('should format MB correctly', () => {
      expect(formatFileSize(1024 * 1024)).toBe('1 MB');
      expect(formatFileSize(1024 * 1024 * 1.5)).toBe('1.5 MB');
      expect(formatFileSize(1024 * 1024 * 10)).toBe('10 MB');
    });

    it('should format GB correctly', () => {
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
      expect(formatFileSize(1024 * 1024 * 1024 * 2.5)).toBe('2.5 GB');
    });

    it('should handle string input', () => {
      expect(formatFileSize('1024')).toBe('1 KB');
      expect(formatFileSize('2048')).toBe('2 KB');
    });

    it('should handle large numbers', () => {
      const tb = 1024 * 1024 * 1024 * 1024;
      expect(formatFileSize(tb)).toBe('1 TB');
      expect(formatFileSize(tb * 2)).toBe('2 TB');
    });
  });
});

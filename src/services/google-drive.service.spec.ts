import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { GoogleDriveService } from './google-drive.service';
import { GOOGLE_DRIVE_OPTIONS } from '../constants';
import { GoogleDriveModuleOptions } from '../interfaces/google-drive.interface';
import {
  FileUploadError,
  FileDownloadError,
  AuthenticationError,
} from '../errors/google-drive.error';

// Mock googleapis
jest.mock('googleapis', () => ({
  google: {
    auth: {
      OAuth2: jest.fn().mockImplementation(() => ({
        setCredentials: jest.fn(),
      })),
    },
    drive: jest.fn(),
  },
}));

describe('GoogleDriveService', () => {
  let service: GoogleDriveService;
  let mockDrive: any;

  const mockOptions: GoogleDriveModuleOptions = {
    clientId: 'test-client-id',
    clientSecret: 'test-client-secret',
    redirectUri: 'http://localhost:3000/callback',
    refreshToken: 'test-refresh-token',
  };

  beforeEach(async () => {
    const { google } = require('googleapis');
    mockDrive = {
      files: {
        create: jest.fn(),
        get: jest.fn(),
      },
      about: {
        get: jest.fn(),
      },
    };
    google.drive.mockReturnValue(mockDrive);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoogleDriveService,
        {
          provide: GOOGLE_DRIVE_OPTIONS,
          useValue: mockOptions,
        },
      ],
    }).compile();

    // Suppress logger output during tests
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'debug').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();

    service = module.get<GoogleDriveService>(GoogleDriveService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('uploadFile', () => {
    const mockFileResponse = {
      data: {
        id: 'test-file-id',
        name: 'test-file.txt',
        mimeType: 'text/plain',
        size: '1024',
        createdTime: '2023-01-01T00:00:00.000Z',
        modifiedTime: '2023-01-01T00:00:00.000Z',
      },
    };

    it('should upload a file successfully from Buffer', async () => {
      mockDrive.files.create.mockResolvedValue(mockFileResponse);

      const fileBuffer = Buffer.from('test file content');
      const options = {
        name: 'test-file.txt',
        mimeType: 'text/plain',
      };

      const result = await service.uploadFile(fileBuffer, options);

      expect(result).toEqual({
        ...mockFileResponse.data,
        downloadUrl: `https://drive.google.com/file/d/${mockFileResponse.data.id}/view`,
      });
      expect(mockDrive.files.create).toHaveBeenCalledWith({
        requestBody: {
          name: options.name,
          parents: undefined,
        },
        media: {
          mimeType: options.mimeType,
          body: expect.any(Object), // Readable stream
        },
        fields: 'id,name,mimeType,size,parents,createdTime,modifiedTime',
      });
    });

    it('should auto-detect MIME type when not provided', async () => {
      mockDrive.files.create.mockResolvedValue({
        data: { ...mockFileResponse.data, mimeType: 'application/pdf' },
      });

      const fileBuffer = Buffer.from('test content');
      const options = { name: 'test-file.pdf' };

      await service.uploadFile(fileBuffer, options);

      expect(mockDrive.files.create).toHaveBeenCalledWith(
        expect.objectContaining({
          media: expect.objectContaining({
            mimeType: 'application/pdf',
          }),
        }),
      );
    });

    it('should throw FileUploadError for invalid file name', async () => {
      const fileBuffer = Buffer.from('test content');
      const options = { name: 'invalid<file>name.txt' };

      await expect(service.uploadFile(fileBuffer, options)).rejects.toThrow(
        FileUploadError,
      );
      expect(mockDrive.files.create).not.toHaveBeenCalled();
    });

    it('should handle upload errors properly', async () => {
      const error = new Error('Upload failed');
      mockDrive.files.create.mockRejectedValue(error);

      const fileBuffer = Buffer.from('test content');
      const options = { name: 'test-file.txt' };

      await expect(service.uploadFile(fileBuffer, options)).rejects.toThrow(
        FileUploadError,
      );
    });
  });

  describe('downloadFile', () => {
    it('should download a file successfully', async () => {
      const mockStream = 'mock-readable-stream';
      mockDrive.files.get.mockResolvedValue({ data: mockStream });

      const result = await service.downloadFile('test-file-id');

      expect(result).toBe(mockStream);
      expect(mockDrive.files.get).toHaveBeenCalledWith(
        {
          fileId: 'test-file-id',
          alt: 'media',
        },
        { responseType: 'stream' },
      );
    });

    it('should throw FileDownloadError for empty file ID', async () => {
      await expect(service.downloadFile('')).rejects.toThrow(FileDownloadError);
      await expect(service.downloadFile('  ')).rejects.toThrow(
        FileDownloadError,
      );
    });

    it('should handle 404 error correctly', async () => {
      const error = { code: 404, message: 'File not found' };
      mockDrive.files.get.mockRejectedValue(error);

      await expect(service.downloadFile('non-existent-file')).rejects.toThrow(
        FileDownloadError,
      );
    });

    it('should handle 403 error as AuthenticationError', async () => {
      const error = { code: 403, message: 'Access denied' };
      mockDrive.files.get.mockRejectedValue(error);

      await expect(service.downloadFile('forbidden-file')).rejects.toThrow(
        AuthenticationError,
      );
    });
  });

  describe('getFileMetadata', () => {
    const mockMetadata = {
      id: 'test-file-id',
      name: 'test-file.txt',
      mimeType: 'text/plain',
      size: '1024',
      createdTime: '2023-01-01T00:00:00.000Z',
      modifiedTime: '2023-01-01T00:00:00.000Z',
    };

    it('should get file metadata successfully', async () => {
      mockDrive.files.get.mockResolvedValue({ data: mockMetadata });

      const result = await service.getFileMetadata('test-file-id');

      expect(result).toEqual(mockMetadata);
      expect(mockDrive.files.get).toHaveBeenCalledWith({
        fileId: 'test-file-id',
        fields: 'id,name,mimeType,size,parents,createdTime,modifiedTime',
      });
    });

    it('should throw error for empty file ID', async () => {
      await expect(service.getFileMetadata('')).rejects.toThrow(
        FileDownloadError,
      );
    });
  });

  describe('testConnection', () => {
    it('should return true for successful connection', async () => {
      mockDrive.about.get.mockResolvedValue({ data: { user: {} } });

      const result = await service.testConnection();

      expect(result).toBe(true);
      expect(mockDrive.about.get).toHaveBeenCalledWith({ fields: 'user' });
    });

    it('should return false for failed connection', async () => {
      mockDrive.about.get.mockRejectedValue(new Error('Connection failed'));

      const result = await service.testConnection();

      expect(result).toBe(false);
    });
  });
});

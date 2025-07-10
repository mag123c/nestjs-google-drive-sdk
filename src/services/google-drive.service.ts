import { Inject, Injectable, Logger } from '@nestjs/common';
import { google, drive_v3 } from 'googleapis';
import { Readable } from 'stream';

import {
    GoogleDriveModuleOptions,
    UploadFileOptions,
    FileMetadata,
    UploadResult,
    UserGoogleDriveCredentials,
    UserDriveOptions,
} from '../interfaces/google-drive.interface';
import {
    GOOGLE_DRIVE_OPTIONS,
    DRIVE_API_VERSION,
    DEFAULT_FILE_FIELDS,
} from '../constants';
import {
    FileUploadError,
    FileDownloadError,
    AuthenticationError,
    ConfigurationError,
} from '../errors/google-drive.error';
import {
    bufferToStream,
    validateFileName,
    getMimeTypeFromExtension,
} from '../utils/file.utils';

/**
 * Google Drive service for file upload and download operations
 */
@Injectable()
export class GoogleDriveService {
  private readonly logger = new Logger(GoogleDriveService.name);
  private drive!: drive_v3.Drive;

  constructor(
    @Inject(GOOGLE_DRIVE_OPTIONS)
    private readonly options: GoogleDriveModuleOptions,
  ) {
    this.initializeDrive();
  }

  /**
   * Initialize Google Drive API client
   */
  private initializeDrive(): void {
    try {
      const auth = new google.auth.OAuth2(
        this.options.clientId,
        this.options.clientSecret,
        this.options.redirectUri,
      );

      if (this.options.refreshToken) {
        auth.setCredentials({
          refresh_token: this.options.refreshToken,
          access_token: this.options.accessToken,
        });
      }

      this.drive = google.drive({
        version: DRIVE_API_VERSION,
        auth,
      }) as drive_v3.Drive;

      this.logger.log('Google Drive service initialized successfully');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown initialization error';
      this.logger.error(
        `Failed to initialize Google Drive service: ${message}`,
      );
      throw new ConfigurationError(message);
    }
  }

  /**
   * Upload a file to Google Drive
   * @param fileStream - File content as Readable stream or Buffer
   * @param options - Upload options including file name and metadata
   * @returns Promise<UploadResult> - Upload result with file metadata
   */
  async uploadFile(
    fileStream: Readable | Buffer,
    options: UploadFileOptions,
  ): Promise<UploadResult> {
    this.logger.debug(`Starting file upload: ${options.name}`);

    // Validate input
    if (!validateFileName(options.name)) {
      throw new FileUploadError('Invalid file name', options.name);
    }

    try {
      // Convert Buffer to stream if necessary
      const stream =
        fileStream instanceof Buffer ? bufferToStream(fileStream) : fileStream;

      // Auto-detect MIME type if not provided
      const mimeType =
        options.mimeType || getMimeTypeFromExtension(options.name);

      const media = {
        mimeType,
        body: stream,
      };

      const fileMetadata = {
        name: options.name,
        parents: options.parents,
      };

      this.logger.debug(`Uploading file with MIME type: ${mimeType}`);

      const response = await this.drive.files.create({
        requestBody: fileMetadata,
        media,
        fields: DEFAULT_FILE_FIELDS,
      });

      const result: UploadResult = {
        ...(response.data as FileMetadata),
        downloadUrl: `https://drive.google.com/file/d/${response.data.id}/view`,
      };

      this.logger.log(
        `File uploaded successfully: ${options.name} (ID: ${result.id})`,
      );
      return result;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown upload error';
      this.logger.error(`File upload failed for ${options.name}: ${message}`);
      throw new FileUploadError(
        message,
        options.name,
        error instanceof Error ? error : undefined,
      );
    }
  }

  /**
   * Download a file from Google Drive
   * @param fileId - Google Drive file ID
   * @returns Promise<Readable> - File content as readable stream
   */
  async downloadFile(fileId: string): Promise<Readable> {
    this.logger.debug(`Starting file download: ${fileId}`);

    if (!fileId || fileId.trim().length === 0) {
      throw new FileDownloadError('File ID is required', fileId);
    }

    try {
      const response = await this.drive.files.get(
        {
          fileId,
          alt: 'media',
        },
        { responseType: 'stream' },
      );

      this.logger.log(`File downloaded successfully: ${fileId}`);
      return response.data;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown download error';
      this.logger.error(`File download failed for ${fileId}: ${message}`);

      // Handle specific Google API errors
      if (error && typeof error === 'object' && 'code' in error) {
        switch ((error as any).code) {
          case 404:
            throw new FileDownloadError(
              'File not found',
              fileId,
              error instanceof Error ? error : undefined,
            );
          case 403:
            throw new AuthenticationError(
              'Access denied',
              error instanceof Error ? error : undefined,
            );
          default:
            throw new FileDownloadError(
              message,
              fileId,
              error instanceof Error ? error : undefined,
            );
        }
      }

      throw new FileDownloadError(
        message,
        fileId,
        error instanceof Error ? error : undefined,
      );
    }
  }

  /**
   * Get file metadata from Google Drive
   * @param fileId - Google Drive file ID
   * @returns Promise<FileMetadata> - File metadata
   */
  async getFileMetadata(fileId: string): Promise<FileMetadata> {
    this.logger.debug(`Getting file metadata: ${fileId}`);

    if (!fileId || fileId.trim().length === 0) {
      throw new FileDownloadError('File ID is required', fileId);
    }

    try {
      const response = await this.drive.files.get({
        fileId,
        fields: DEFAULT_FILE_FIELDS,
      });

      this.logger.debug(`File metadata retrieved: ${fileId}`);
      return response.data as FileMetadata;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to get file metadata for ${fileId}: ${message}`,
      );
      throw new FileDownloadError(
        message,
        fileId,
        error instanceof Error ? error : undefined,
      );
    }
  }

  /**
   * Test the connection to Google Drive API
   * @returns Promise<boolean> - True if connection is successful
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.drive.about.get({ fields: 'user' });
      this.logger.log('Google Drive connection test successful');
      return true;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Connection test failed';
      this.logger.error(`Google Drive connection test failed: ${message}`);
      return false;
    }
  }

  // ========================================
  // USER-SPECIFIC GOOGLE DRIVE METHODS
  // ========================================

  /**
   * Create a temporary Drive instance for a specific user
   * @private
   */
  private createUserDriveInstance(credentials: UserGoogleDriveCredentials): drive_v3.Drive {
    const auth = new google.auth.OAuth2(
      this.options.clientId,
      this.options.clientSecret,
      this.options.redirectUri,
    );

    auth.setCredentials({
      access_token: credentials.accessToken,
      refresh_token: credentials.refreshToken,
    });

    return google.drive({
      version: DRIVE_API_VERSION,
      auth,
    }) as drive_v3.Drive;
  }

  /**
   * Upload a file to user's personal Google Drive
   * @param fileStream - File content as Readable stream or Buffer
   * @param options - Upload options including file name and metadata
   * @param userOptions - User-specific credentials
   * @returns Promise<UploadResult> - Upload result with file metadata
   */
  async uploadFileToUserDrive(
    fileStream: Readable | Buffer,
    options: UploadFileOptions,
    userOptions: UserDriveOptions,
  ): Promise<UploadResult> {
    this.logger.debug(`Starting user file upload: ${options.name}`);

    // Validate input
    if (!validateFileName(options.name)) {
      throw new FileUploadError('Invalid file name', options.name);
    }

    try {
      const userDrive = this.createUserDriveInstance(userOptions.credentials);

      // Convert Buffer to stream if necessary
      const stream =
        fileStream instanceof Buffer ? bufferToStream(fileStream) : fileStream;

      // Auto-detect MIME type if not provided
      const mimeType =
        options.mimeType || getMimeTypeFromExtension(options.name);

      const media = {
        mimeType,
        body: stream,
      };

      const fileMetadata = {
        name: options.name,
        parents: options.parents,
      };

      this.logger.debug(`Uploading to user drive with MIME type: ${mimeType}`);

      const response = await userDrive.files.create({
        requestBody: fileMetadata,
        media,
        fields: DEFAULT_FILE_FIELDS,
      });

      const result: UploadResult = {
        ...(response.data as FileMetadata),
        downloadUrl: `https://drive.google.com/file/d/${response.data.id}/view`,
      };

      this.logger.log(
        `File uploaded to user drive successfully: ${options.name} (ID: ${result.id})`,
      );
      return result;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown upload error';
      this.logger.error(`User drive file upload failed for ${options.name}: ${message}`);
      throw new FileUploadError(
        message,
        options.name,
        error instanceof Error ? error : undefined,
      );
    }
  }

  /**
   * Download a file from user's personal Google Drive
   * @param fileId - Google Drive file ID
   * @param userOptions - User-specific credentials
   * @returns Promise<Readable> - File content as readable stream
   */
  async downloadFileFromUserDrive(fileId: string, userOptions: UserDriveOptions): Promise<Readable> {
    this.logger.debug(`Starting user file download: ${fileId}`);

    if (!fileId || fileId.trim().length === 0) {
      throw new FileDownloadError('File ID is required', fileId);
    }

    try {
      const userDrive = this.createUserDriveInstance(userOptions.credentials);

      const response = await userDrive.files.get(
        {
          fileId,
          alt: 'media',
        },
        { responseType: 'stream' },
      );

      this.logger.log(`File downloaded from user drive successfully: ${fileId}`);
      return response.data;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown download error';
      this.logger.error(`User drive file download failed for ${fileId}: ${message}`);

      // Handle specific Google API errors
      if (error && typeof error === 'object' && 'code' in error) {
        switch ((error as any).code) {
          case 404:
            throw new FileDownloadError(
              'File not found in user drive',
              fileId,
              error instanceof Error ? error : undefined,
            );
          case 403:
            throw new AuthenticationError(
              'Access denied to user drive',
              error instanceof Error ? error : undefined,
            );
          default:
            throw new FileDownloadError(
              message,
              fileId,
              error instanceof Error ? error : undefined,
            );
        }
      }

      throw new FileDownloadError(
        message,
        fileId,
        error instanceof Error ? error : undefined,
      );
    }
  }

  /**
   * Get file metadata from user's personal Google Drive
   * @param fileId - Google Drive file ID
   * @param userOptions - User-specific credentials
   * @returns Promise<FileMetadata> - File metadata
   */
  async getFileMetadataFromUserDrive(fileId: string, userOptions: UserDriveOptions): Promise<FileMetadata> {
    this.logger.debug(`Getting user file metadata: ${fileId}`);

    if (!fileId || fileId.trim().length === 0) {
      throw new FileDownloadError('File ID is required', fileId);
    }

    try {
      const userDrive = this.createUserDriveInstance(userOptions.credentials);

      const response = await userDrive.files.get({
        fileId,
        fields: DEFAULT_FILE_FIELDS,
      });

      this.logger.debug(`User file metadata retrieved: ${fileId}`);
      return response.data as FileMetadata;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to get user file metadata for ${fileId}: ${message}`,
      );
      throw new FileDownloadError(
        message,
        fileId,
        error instanceof Error ? error : undefined,
      );
    }
  }

  /**
   * Test the connection to user's personal Google Drive
   * @param userOptions - User-specific credentials
   * @returns Promise<boolean> - True if connection is successful
   */
  async testUserDriveConnection(userOptions: UserDriveOptions): Promise<boolean> {
    try {
      const userDrive = this.createUserDriveInstance(userOptions.credentials);
      await userDrive.about.get({ fields: 'user' });
      this.logger.log('User Google Drive connection test successful');
      return true;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'User connection test failed';
      this.logger.error(`User Google Drive connection test failed: ${message}`);
      return false;
    }
  }
}

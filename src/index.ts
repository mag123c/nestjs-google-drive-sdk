// Export interfaces
export {
  GoogleDriveModuleOptions,
  GoogleDriveModuleAsyncOptions,
  UploadFileOptions,
  FileMetadata,
  UploadResult,
  UserGoogleDriveCredentials,
  UserDriveOptions,
} from './interfaces';

// Export services  
export { GoogleDriveService } from './services/google-drive.service';

// Export module
export { GoogleDriveModule } from './google-drive.module';

// Export constants
export { GOOGLE_DRIVE_OPTIONS, DRIVE_API_VERSION, DEFAULT_FILE_FIELDS } from './constants';

// Export errors
export {
  GoogleDriveError,
  FileUploadError,
  FileDownloadError,
  AuthenticationError,
  ConfigurationError,
} from './errors/google-drive.error';

// Export utilities
export {
  bufferToStream,
  validateFileName,
  getMimeTypeFromExtension,
  formatFileSize,
} from './utils/file.utils';

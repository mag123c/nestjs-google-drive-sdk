/**
 * Base error class for Google Drive operations
 */
export class GoogleDriveError extends Error {
  public cause?: Error;

  constructor(
    message: string,
    public readonly code?: string,
    public readonly statusCode?: number,
  ) {
    super(message);
    this.name = 'GoogleDriveError';
    Object.setPrototypeOf(this, GoogleDriveError.prototype);
  }
}

/**
 * Error thrown when file upload fails
 */
export class FileUploadError extends GoogleDriveError {
  constructor(
    message: string,
    public readonly fileName?: string,
    cause?: Error,
  ) {
    super(`File upload failed: ${message}`, 'FILE_UPLOAD_ERROR');
    this.name = 'FileUploadError';
    this.cause = cause;
    Object.setPrototypeOf(this, FileUploadError.prototype);
  }
}

/**
 * Error thrown when file download fails
 */
export class FileDownloadError extends GoogleDriveError {
  constructor(
    message: string,
    public readonly fileId?: string,
    cause?: Error,
  ) {
    super(`File download failed: ${message}`, 'FILE_DOWNLOAD_ERROR');
    this.name = 'FileDownloadError';
    this.cause = cause;
    Object.setPrototypeOf(this, FileDownloadError.prototype);
  }
}

/**
 * Error thrown when authentication fails
 */
export class AuthenticationError extends GoogleDriveError {
  constructor(message: string, cause?: Error) {
    super(`Authentication failed: ${message}`, 'AUTHENTICATION_ERROR', 401);
    this.name = 'AuthenticationError';
    this.cause = cause;
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

/**
 * Error thrown when Google Drive service is not properly configured
 */
export class ConfigurationError extends GoogleDriveError {
  constructor(message: string) {
    super(`Configuration error: ${message}`, 'CONFIGURATION_ERROR', 500);
    this.name = 'ConfigurationError';
    Object.setPrototypeOf(this, ConfigurationError.prototype);
  }
}

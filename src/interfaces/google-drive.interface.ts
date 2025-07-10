import { ModuleMetadata } from '@nestjs/common';

/**
 * Configuration options for the Google Drive module
 */
export interface GoogleDriveModuleOptions {
  /** Google OAuth2 client ID */
  clientId: string;
  /** Google OAuth2 client secret */
  clientSecret: string;
  /** OAuth2 redirect URI */
  redirectUri: string;
  /** Refresh token for authentication (optional) */
  refreshToken?: string;
  /** Access token for authentication (optional) */
  accessToken?: string;
  /** OAuth2 scopes (defaults to drive scope) */
  scope?: string[];
}

/**
 * Async configuration options for the Google Drive module
 */
export interface GoogleDriveModuleAsyncOptions
  extends Pick<ModuleMetadata, 'imports'> {
  /** Factory function to create module options */
  useFactory: (
    ...args: any[]
  ) => Promise<GoogleDriveModuleOptions> | GoogleDriveModuleOptions;
  /** Injection tokens for the factory function */
  inject?: any[];
}

/**
 * Options for uploading a file to Google Drive
 */
export interface UploadFileOptions {
  /** Name of the file */
  name: string;
  /** Parent folder IDs (optional) */
  parents?: string[];
  /** MIME type of the file (optional, auto-detected if not provided) */
  mimeType?: string;
}

/**
 * File metadata returned by Google Drive API
 */
export interface FileMetadata {
  /** Unique file ID */
  id: string;
  /** File name */
  name: string;
  /** MIME type */
  mimeType: string;
  /** File size in bytes */
  size: string;
  /** Parent folder IDs */
  parents?: string[];
  /** Creation timestamp */
  createdTime: string;
  /** Last modification timestamp */
  modifiedTime: string;
}

/**
 * Upload result with file metadata
 */
export interface UploadResult extends FileMetadata {
  /** Direct download URL (if applicable) */
  downloadUrl?: string;
}

/**
 * User-specific Google Drive credentials for personal drive access
 */
export interface UserGoogleDriveCredentials {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
}

/**
 * Options for operations with user-specific credentials
 */
export interface UserDriveOptions {
  credentials: UserGoogleDriveCredentials;
}

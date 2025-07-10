/**
 * Injection token for Google Drive module options
 */
export const GOOGLE_DRIVE_OPTIONS = 'GOOGLE_DRIVE_OPTIONS';

/**
 * Default Google Drive API scopes
 */
export const DEFAULT_SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
] as const;

/**
 * Google Drive API version
 */
export const DRIVE_API_VERSION = 'v3' as const;

/**
 * Default file fields for metadata retrieval
 */
export const DEFAULT_FILE_FIELDS =
  'id,name,mimeType,size,parents,createdTime,modifiedTime' as const;

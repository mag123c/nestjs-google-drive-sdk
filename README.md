# NestJS Google Drive Module 📁

[![npm version](https://badge.fury.io/js/%40nestjs-community%2Fgoogle-drive.svg)](https://badge.fury.io/js/%40nestjs-community%2Fgoogle-drive)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A production-ready, type-safe Google Drive integration module for NestJS applications with comprehensive file management capabilities.

## 🎯 Current Implementation (v1.0.0)

### ✅ Implemented Features
- **File Upload**: Upload files from Buffer or Readable streams
- **File Download**: Download files as Readable streams  
- **File Metadata**: Get file information (name, size, MIME type, etc.)
- **Connection Test**: Verify Google Drive API connectivity
- **Auto MIME Detection**: Automatic MIME type detection from file extensions
- **File Validation**: Built-in file name validation
- **Error Handling**: Comprehensive error handling with custom error classes
- **TypeScript Support**: Full TypeScript support with type definitions

### 🚧 Not Implemented (Future Versions)
- File deletion
- Folder creation/management
- File sharing/permissions
- File listing/search
- Batch operations

## 🔧 Architecture

```
src/
├── interfaces/          # TypeScript interfaces and types
├── services/           # Core GoogleDriveService implementation
├── errors/             # Custom error classes
├── constants/          # Module constants and configuration
├── utils/              # Utility functions (validation, MIME detection, etc.)
├── google-drive.module.ts  # NestJS dynamic module
└── index.ts            # Main exports
```

This modular structure allows for easy extension and maintenance.

## 🚀 Quick Start

### Installation

```bash
# npm
npm install @nestjs-community/google-drive

# yarn  
yarn add @nestjs-community/google-drive

# pnpm (recommended)
pnpm add @nestjs-community/google-drive
```

### Basic Setup

```typescript
import { Module } from '@nestjs/common';
import { GoogleDriveModule } from '@nestjs-community/google-drive';

@Module({
  imports: [
    GoogleDriveModule.forRoot({
      credentials: {
        client_id: 'your-client-id',
        client_secret: 'your-client-secret',
        redirect_uris: ['http://localhost:3000/auth/google/callback'],
      },
      // Optional: Default folder ID for uploads
      defaultFolderId: 'your-default-folder-id',
    }),
  ],
})
export class AppModule {}
```

### 2. Use the Service

```typescript
import { Injectable } from '@nestjs/common';
import { GoogleDriveService } from '@nestjs-community/google-drive';
import { createReadStream } from 'fs';

@Injectable()
export class FileService {
  constructor(private readonly googleDriveService: GoogleDriveService) {}

  async uploadFile(filePath: string, fileName: string) {
    const fileStream = createReadStream(filePath);
    
    const result = await this.googleDriveService.uploadFile(fileStream, {
      name: fileName,
      mimeType: 'application/pdf', // Optional: auto-detected if not provided
    });
    
    console.log(`File uploaded: ${result.id}`);
    console.log(`Download URL: ${result.downloadUrl}`);
    return result;
  }

  async downloadFile(fileId: string) {
    const stream = await this.googleDriveService.downloadFile(fileId);
    return stream;
  }

  async getFileInfo(fileId: string) {
    const metadata = await this.googleDriveService.getFileMetadata(fileId);
    console.log(`File: ${metadata.name} (${metadata.size} bytes)`);
    return metadata;
  }

  async testConnection() {
    const isConnected = await this.googleDriveService.testConnection();
    console.log(`Google Drive connection: ${isConnected ? 'OK' : 'Failed'}`);
    return isConnected;
  }
}
```

## ⚙️ Configuration

### Synchronous Configuration

```typescript
GoogleDriveModule.forRoot({
  clientId: 'your-google-client-id',
  clientSecret: 'your-google-client-secret',
  redirectUri: 'your-redirect-uri',
  refreshToken: 'your-refresh-token',
  accessToken: 'your-access-token', // optional
  scope: ['https://www.googleapis.com/auth/drive.file'], // optional
})
```

### Async Configuration (Recommended)

```typescript
import { ConfigModule, ConfigService } from '@nestjs/config';

GoogleDriveModule.forRootAsync({
  imports: [ConfigModule],
  useFactory: async (configService: ConfigService) => ({
    clientId: configService.get('GOOGLE_CLIENT_ID'),
    clientSecret: configService.get('GOOGLE_CLIENT_SECRET'),
    redirectUri: configService.get('GOOGLE_REDIRECT_URI'),
    refreshToken: configService.get('GOOGLE_REFRESH_TOKEN'),
  }),
  inject: [ConfigService],
})
```

### Global Module

```typescript
// Make the module available globally
GoogleDriveModule.forRootGlobal({
  // ... configuration
})

// Or with async configuration
GoogleDriveModule.forRootAsyncGlobal({
  // ... async configuration
})
```

## 📋 API Reference

### GoogleDriveService

#### `uploadFile(fileStream, options): Promise<UploadResult>`

Upload a file to Google Drive.

```typescript
interface UploadFileOptions {
  name: string;           // File name
  parents?: string[];     // Parent folder IDs (optional)
  mimeType?: string;      // MIME type (auto-detected if not provided)
}

interface UploadResult {
  id: string;             // Google Drive file ID
  name: string;           // File name
  mimeType: string;       // MIME type
  size: string;           // File size in bytes
  downloadUrl: string;    // Direct download URL
  // ... other metadata
}
```

#### `downloadFile(fileId): Promise<Readable>`

Download a file from Google Drive as a readable stream.

#### `getFileMetadata(fileId): Promise<FileMetadata>`

Get file metadata including name, size, MIME type, creation/modification dates.

#### `testConnection(): Promise<boolean>`

Test connection to Google Drive API. Returns `true` if connected successfully.

## 🔧 Utility Functions

The module exports helpful utility functions:

```typescript
import { 
  validateFileName, 
  getMimeTypeFromExtension, 
  formatFileSize,
  bufferToStream 
} from '@nestjs-community/google-drive';

// Validate file name (checks for invalid characters)
const isValid = validateFileName('my-file.pdf'); // true

// Get MIME type from file extension
const mimeType = getMimeTypeFromExtension('document.pdf'); // 'application/pdf'

// Format file size in human-readable format
const formatted = formatFileSize(1048576); // '1 MB'

// Convert Buffer to Readable stream
const stream = bufferToStream(buffer);
```

## 🛡️ Error Handling

The module provides specific error classes:

```typescript
import { 
  FileUploadError, 
  FileDownloadError, 
  AuthenticationError,
  ConfigurationError 
} from '@nestjs-community/google-drive';

try {
  await googleDriveService.uploadFile(stream, options);
} catch (error) {
  if (error instanceof FileUploadError) {
    console.error('Upload failed:', error.message, error.fileName);
  } else if (error instanceof AuthenticationError) {
    console.error('Authentication failed:', error.message);
  } else if (error instanceof ConfigurationError) {
    console.error('Configuration error:', error.message);
  }
}
```

## 🧪 Testing

The module includes comprehensive tests. Run them with:

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## 🔗 Getting Google Drive Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Drive API
4. Create OAuth 2.0 Client ID credentials
5. Configure the OAuth consent screen
6. Get your client ID, client secret, and redirect URI
7. Generate a refresh token using the [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)

**Detailed guide**: [Google Drive API Quickstart](https://developers.google.com/drive/api/quickstart/nodejs)

## 📝 Examples

### Upload from Express Multer

```typescript
import { Controller, Post, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('files')
export class FilesController {
  constructor(private readonly googleDriveService: GoogleDriveService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    const result = await this.googleDriveService.uploadFile(file.buffer, {
      name: file.originalname,
      mimeType: file.mimetype,
    });
    
    return {
      success: true,
      fileId: result.id,
      downloadUrl: result.downloadUrl,
    };
  }
}
```

### Download to Express Response

```typescript
@Get('download/:fileId')
async downloadFile(
  @Param('fileId') fileId: string, 
  @Res() res: Response
) {
  try {
    const stream = await this.googleDriveService.downloadFile(fileId);
    const metadata = await this.googleDriveService.getFileMetadata(fileId);
    
    res.setHeader('Content-Type', metadata.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${metadata.name}"`);
    
    stream.pipe(res);
  } catch (error) {
    res.status(404).json({ error: 'File not found' });
  }
}
```

## 📈 Roadmap

### v1.1.0 (Planned)
- File deletion functionality
- Better error messages with more context

### v1.2.0 (Planned)
- Folder creation and management
- File listing with filtering

### v2.0.0 (Future)
- File sharing and permissions
- Batch operations
- Advanced search capabilities

## 🤝 Contributing

Contributions are welcome! This module is designed to be extensible:

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## 📄 License

MIT License - see the [LICENSE](LICENSE) file for details.

---

**Perfect for**: Simple file upload/download operations with Google Drive in NestJS applications.  
**Built with**: TypeScript, NestJS, Google APIs, comprehensive error handling and testing. 
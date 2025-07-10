import { DynamicModule, Module, Provider } from '@nestjs/common';
import {
  GoogleDriveModuleOptions,
  GoogleDriveModuleAsyncOptions,
} from './interfaces/google-drive.interface';
import { GoogleDriveService } from './services/google-drive.service';
import { GOOGLE_DRIVE_OPTIONS } from './constants';

/**
 * Google Drive dynamic module for NestJS
 * Provides file upload and download functionality for Google Drive
 */
@Module({})
export class GoogleDriveModule {
  /**
   * Register the module with synchronous configuration
   * @param options - Configuration options
   * @returns DynamicModule
   */
  static forRoot(options: GoogleDriveModuleOptions): DynamicModule {
    const optionsProvider: Provider = {
      provide: GOOGLE_DRIVE_OPTIONS,
      useValue: options,
    };

    return {
      module: GoogleDriveModule,
      providers: [optionsProvider, GoogleDriveService],
      exports: [GoogleDriveService],
      global: false,
    };
  }

  /**
   * Register the module with asynchronous configuration
   * @param options - Async configuration options
   * @returns DynamicModule
   */
  static forRootAsync(options: GoogleDriveModuleAsyncOptions): DynamicModule {
    const optionsProvider: Provider = {
      provide: GOOGLE_DRIVE_OPTIONS,
      useFactory: options.useFactory,
      inject: options.inject || [],
    };

    return {
      module: GoogleDriveModule,
      imports: options.imports || [],
      providers: [optionsProvider, GoogleDriveService],
      exports: [GoogleDriveService],
      global: false,
    };
  }

  /**
   * Register the module globally with synchronous configuration
   * @param options - Configuration options
   * @returns DynamicModule
   */
  static forRootGlobal(options: GoogleDriveModuleOptions): DynamicModule {
    return {
      ...this.forRoot(options),
      global: true,
    };
  }

  /**
   * Register the module globally with asynchronous configuration
   * @param options - Async configuration options
   * @returns DynamicModule
   */
  static forRootAsyncGlobal(
    options: GoogleDriveModuleAsyncOptions,
  ): DynamicModule {
    return {
      ...this.forRootAsync(options),
      global: true,
    };
  }
}

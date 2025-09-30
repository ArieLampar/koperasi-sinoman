import { v2 as cloudinary } from 'cloudinary';
import type { BaseIntegrationConfig, IntegrationResult } from './types';

export interface CloudinaryConfig extends BaseIntegrationConfig {
  cloudName: string;
  apiSecret: string;
}

export interface CloudinaryUploadOptions {
  public_id?: string;
  folder?: string;
  resource_type?: 'image' | 'video' | 'raw' | 'auto';
  format?: string;
  transformation?: Array<Record<string, unknown>>;
  tags?: string[];
}

export interface CloudinaryUploadResult {
  asset_id: string;
  public_id: string;
  version: number;
  version_id: string;
  signature: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
  created_at: string;
  tags: string[];
  bytes: number;
  type: string;
  etag: string;
  placeholder: boolean;
  url: string;
  secure_url: string;
  access_mode: string;
  original_filename: string;
}

export interface CloudinaryDeleteResult {
  deleted: Record<string, string>;
  deleted_counts: {
    [key: string]: number;
  };
}

export class CloudinaryIntegration {
  constructor(config: CloudinaryConfig) {
    cloudinary.config({
      cloud_name: config.cloudName,
      api_key: config.apiKey,
      api_secret: config.apiSecret,
    });
  }

  async uploadImage(
    file: string | Buffer,
    options?: CloudinaryUploadOptions
  ): IntegrationResult<CloudinaryUploadResult> {
    try {
      const result = await cloudinary.uploader.upload(file, {
        resource_type: 'image',
        ...options,
      });
      return {
        success: true,
        data: result as CloudinaryUploadResult,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async uploadVideo(
    file: string | Buffer,
    options?: CloudinaryUploadOptions
  ): IntegrationResult<CloudinaryUploadResult> {
    try {
      const result = await cloudinary.uploader.upload(file, {
        resource_type: 'video',
        ...options,
      });
      return {
        success: true,
        data: result as CloudinaryUploadResult,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async deleteAsset(publicId: string, resourceType: 'image' | 'video' | 'raw' = 'image'): IntegrationResult<CloudinaryDeleteResult> {
    try {
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
      });
      return {
        success: true,
        data: result as CloudinaryDeleteResult,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  generateImageUrl(publicId: string, transformations?: Array<Record<string, unknown>>): string {
    return cloudinary.url(publicId, {
      resource_type: 'image',
      transformation: transformations,
    });
  }

  generateVideoUrl(publicId: string, transformations?: Array<Record<string, unknown>>): string {
    return cloudinary.url(publicId, {
      resource_type: 'video',
      transformation: transformations,
    });
  }
}

export function createCloudinaryIntegration(config: CloudinaryConfig): CloudinaryIntegration {
  return new CloudinaryIntegration(config);
}
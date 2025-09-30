import axios, { type AxiosInstance } from 'axios';
import type { BaseIntegrationConfig, IntegrationResult } from './types';

export interface FontteConfig extends BaseIntegrationConfig {
  token: string;
  baseUrl?: string;
}

export interface FontteMessageRequest {
  target: string;
  message: string;
  countryCode?: string;
  delay?: number;
  schedule?: string;
}

export interface FontteMessageResponse {
  status: boolean;
  id: string;
  message: string;
  detail?: string;
}

export interface FontteDeviceInfo {
  device: string;
  name: string;
  status: string;
  phone: string;
  battery: number;
  quota: number;
}

export interface FontteIncomingMessage {
  device: string;
  sender: string;
  message: string;
  member: string;
  name: string;
  location: string;
}

export class FontteIntegration {
  private client: AxiosInstance;
  private token: string;

  constructor(config: FontteConfig) {
    this.token = config.token;
    this.client = axios.create({
      baseURL: config.baseUrl || 'https://api.fonnte.com',
      headers: {
        'Authorization': this.token,
        'Content-Type': 'application/json',
      },
    });
  }

  async sendMessage(request: FontteMessageRequest): IntegrationResult<FontteMessageResponse> {
    try {
      const response = await this.client.post('/send', request);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async sendBulkMessage(requests: FontteMessageRequest[]): IntegrationResult<FontteMessageResponse[]> {
    try {
      const promises = requests.map(request => this.sendMessage(request));
      const results = await Promise.allSettled(promises);

      const successResults: FontteMessageResponse[] = [];
      const errors: string[] = [];

      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.success) {
          successResults.push(result.value.data!);
        } else {
          const error = result.status === 'rejected'
            ? result.reason
            : result.value.error;
          errors.push(`Message ${index + 1}: ${error}`);
        }
      });

      if (errors.length > 0) {
        return {
          success: false,
          error: `Failed to send ${errors.length} messages: ${errors.join(', ')}`,
          data: successResults,
        };
      }

      return {
        success: true,
        data: successResults,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async getDeviceInfo(): IntegrationResult<FontteDeviceInfo> {
    try {
      const response = await this.client.post('/device');
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async getIncomingMessages(): IntegrationResult<FontteIncomingMessage[]> {
    try {
      const response = await this.client.post('/incoming');
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async validateToken(): IntegrationResult<{ valid: boolean }> {
    try {
      const deviceInfo = await this.getDeviceInfo();
      return {
        success: true,
        data: { valid: deviceInfo.success },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Token validation failed',
      };
    }
  }
}

export function createFontteIntegration(config: FontteConfig): FontteIntegration {
  return new FontteIntegration(config);
}
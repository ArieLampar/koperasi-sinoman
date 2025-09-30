import axios, { type AxiosInstance, type AxiosError } from 'axios';
import type { BaseIntegrationConfig, IntegrationResult } from '../types';

export interface FontteConfig extends BaseIntegrationConfig {
  token: string;
  baseUrl?: string;
  retryAttempts?: number;
  retryDelay?: number;
  queueProcessingInterval?: number;
}

export interface FontteMessageRequest {
  target: string;
  message: string;
  countryCode?: string;
  delay?: number;
  schedule?: string;
  file?: string;
  filename?: string;
  caption?: string;
  location?: {
    latitude: number;
    longitude: number;
    name?: string;
    address?: string;
  };
}

export interface FontteTemplateMessageRequest {
  target: string;
  template: string;
  variables?: string[];
  countryCode?: string;
  delay?: number;
  schedule?: string;
}

export interface FontteBulkMessageRequest {
  messages: FontteMessageRequest[];
  delay?: number;
  schedule?: string;
}

export interface FontteMessageResponse {
  status: boolean;
  id: string;
  message: string;
  detail?: string;
  queue?: number;
  process?: number;
}

export interface FontteDeviceInfo {
  device: string;
  name: string;
  status: 'connect' | 'disconnect' | 'scan' | 'loading';
  phone: string;
  battery: number;
  quota: number;
  expired: string;
  package: string;
}

export interface FontteIncomingMessage {
  device: string;
  sender: string;
  message: string;
  member: string;
  name: string;
  location: string;
  file?: string;
  filename?: string;
  extension?: string;
  size?: number;
  date: string;
}

export interface FontteWebhookData {
  device: string;
  sender: string;
  message: string;
  member: string;
  name: string;
  location: string;
  file?: string;
  filename?: string;
  extension?: string;
  size?: number;
  date: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'document' | 'location' | 'contact';
}

export interface FontteQueueItem {
  id: string;
  request: FontteMessageRequest | FontteTemplateMessageRequest;
  type: 'message' | 'template';
  attempts: number;
  maxAttempts: number;
  nextRetry: Date;
  createdAt: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
}

export interface FontteRetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

export class FontteIntegration {
  private client: AxiosInstance;
  private config: FontteConfig;
  private messageQueue: FontteQueueItem[] = [];
  private isProcessingQueue = false;
  private queueTimer?: NodeJS.Timeout;
  private retryConfig: FontteRetryConfig;

  constructor(config: FontteConfig) {
    this.config = {
      retryAttempts: 3,
      retryDelay: 1000,
      queueProcessingInterval: 5000,
      ...config,
    };

    this.retryConfig = {
      maxAttempts: this.config.retryAttempts!,
      baseDelay: this.config.retryDelay!,
      maxDelay: 30000,
      backoffMultiplier: 2,
    };

    this.client = axios.create({
      baseURL: config.baseUrl || 'https://api.fonnte.com',
      headers: {
        'Authorization': config.token,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    this.setupInterceptors();
    this.startQueueProcessor();
  }

  async sendMessage(request: FontteMessageRequest): IntegrationResult<FontteMessageResponse> {
    try {
      this.validateMessageRequest(request);

      const response = await this.client.post('/send', request);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: this.formatError(error),
      };
    }
  }

  async sendTemplateMessage(request: FontteTemplateMessageRequest): IntegrationResult<FontteMessageResponse> {
    try {
      this.validateTemplateRequest(request);

      const response = await this.client.post('/send-template', request);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: this.formatError(error),
      };
    }
  }

  async sendBulkMessage(request: FontteBulkMessageRequest): IntegrationResult<FontteMessageResponse[]> {
    try {
      if (!Array.isArray(request.messages) || request.messages.length === 0) {
        throw new Error('Messages array is required and cannot be empty');
      }

      const results: FontteMessageResponse[] = [];
      const errors: string[] = [];

      for (const message of request.messages) {
        try {
          const result = await this.sendMessage({
            ...message,
            delay: request.delay || message.delay,
            schedule: request.schedule || message.schedule,
          });

          if (result.success && result.data) {
            results.push(result.data);
          } else {
            errors.push(`Failed to send to ${message.target}: ${result.error}`);
          }
        } catch (error) {
          errors.push(`Failed to send to ${message.target}: ${this.formatError(error)}`);
        }

        if (request.delay) {
          await this.delay(request.delay);
        }
      }

      if (errors.length > 0) {
        return {
          success: false,
          error: `Failed to send ${errors.length} messages: ${errors.join(', ')}`,
          data: results,
        };
      }

      return {
        success: true,
        data: results,
      };
    } catch (error) {
      return {
        success: false,
        error: this.formatError(error),
      };
    }
  }

  queueMessage(request: FontteMessageRequest, maxAttempts?: number): string {
    const queueItem: FontteQueueItem = {
      id: this.generateId(),
      request,
      type: 'message',
      attempts: 0,
      maxAttempts: maxAttempts || this.retryConfig.maxAttempts,
      nextRetry: new Date(),
      createdAt: new Date(),
      status: 'pending',
    };

    this.messageQueue.push(queueItem);
    return queueItem.id;
  }

  queueTemplateMessage(request: FontteTemplateMessageRequest, maxAttempts?: number): string {
    const queueItem: FontteQueueItem = {
      id: this.generateId(),
      request,
      type: 'template',
      attempts: 0,
      maxAttempts: maxAttempts || this.retryConfig.maxAttempts,
      nextRetry: new Date(),
      createdAt: new Date(),
      status: 'pending',
    };

    this.messageQueue.push(queueItem);
    return queueItem.id;
  }

  getQueueStatus(): {
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    total: number;
  } {
    const stats = {
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      total: this.messageQueue.length,
    };

    this.messageQueue.forEach(item => {
      stats[item.status]++;
    });

    return stats;
  }

  clearQueue(): void {
    this.messageQueue = [];
  }

  removeFromQueue(id: string): boolean {
    const index = this.messageQueue.findIndex(item => item.id === id);
    if (index !== -1) {
      this.messageQueue.splice(index, 1);
      return true;
    }
    return false;
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
        error: this.formatError(error),
      };
    }
  }

  async getIncomingMessages(): IntegrationResult<FontteIncomingMessage[]> {
    try {
      const response = await this.client.post('/incoming');
      return {
        success: true,
        data: Array.isArray(response.data) ? response.data : [response.data],
      };
    } catch (error) {
      return {
        success: false,
        error: this.formatError(error),
      };
    }
  }

  async validateToken(): IntegrationResult<{ valid: boolean; device?: FontteDeviceInfo }> {
    try {
      const deviceInfo = await this.getDeviceInfo();
      return {
        success: true,
        data: {
          valid: deviceInfo.success,
          device: deviceInfo.data
        },
      };
    } catch (error) {
      return {
        success: false,
        error: 'Token validation failed',
        data: { valid: false },
      };
    }
  }

  handleWebhook(data: FontteWebhookData): IntegrationResult<{
    isValid: boolean;
    processedMessage: FontteIncomingMessage;
  }> {
    try {
      if (!this.validateWebhookData(data)) {
        return {
          success: false,
          error: 'Invalid webhook data',
          data: { isValid: false, processedMessage: data as FontteIncomingMessage },
        };
      }

      const processedMessage: FontteIncomingMessage = {
        device: data.device,
        sender: data.sender,
        message: data.message,
        member: data.member,
        name: data.name,
        location: data.location,
        file: data.file,
        filename: data.filename,
        extension: data.extension,
        size: data.size,
        date: data.date,
      };

      return {
        success: true,
        data: {
          isValid: true,
          processedMessage,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: this.formatError(error),
        data: { isValid: false, processedMessage: data as FontteIncomingMessage },
      };
    }
  }

  destroy(): void {
    if (this.queueTimer) {
      clearInterval(this.queueTimer);
    }
    this.isProcessingQueue = false;
  }

  private setupInterceptors(): void {
    this.client.interceptors.response.use(
      response => response,
      async (error: AxiosError) => {
        if (this.isRetryableError(error)) {
          const config = error.config as any;
          config._retryCount = config._retryCount || 0;

          if (config._retryCount < this.retryConfig.maxAttempts) {
            config._retryCount++;
            const delay = Math.min(
              this.retryConfig.baseDelay * Math.pow(this.retryConfig.backoffMultiplier, config._retryCount - 1),
              this.retryConfig.maxDelay
            );

            await this.delay(delay);
            return this.client.request(config);
          }
        }

        throw error;
      }
    );
  }

  private startQueueProcessor(): void {
    this.queueTimer = setInterval(() => {
      this.processQueue();
    }, this.config.queueProcessingInterval);
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue) return;

    this.isProcessingQueue = true;

    try {
      const now = new Date();
      const itemsToProcess = this.messageQueue.filter(
        item => item.status === 'pending' && item.nextRetry <= now
      );

      for (const item of itemsToProcess) {
        item.status = 'processing';
        item.attempts++;

        try {
          let result;
          if (item.type === 'message') {
            result = await this.sendMessage(item.request as FontteMessageRequest);
          } else {
            result = await this.sendTemplateMessage(item.request as FontteTemplateMessageRequest);
          }

          if (result.success) {
            item.status = 'completed';
          } else {
            throw new Error(result.error);
          }
        } catch (error) {
          item.error = this.formatError(error);

          if (item.attempts >= item.maxAttempts) {
            item.status = 'failed';
          } else {
            item.status = 'pending';
            item.nextRetry = new Date(
              now.getTime() +
              this.retryConfig.baseDelay * Math.pow(this.retryConfig.backoffMultiplier, item.attempts - 1)
            );
          }
        }
      }

      this.messageQueue = this.messageQueue.filter(
        item => ['pending', 'processing'].includes(item.status) ||
        (new Date().getTime() - item.createdAt.getTime()) < 24 * 60 * 60 * 1000
      );
    } finally {
      this.isProcessingQueue = false;
    }
  }

  private validateMessageRequest(request: FontteMessageRequest): void {
    if (!request.target?.trim()) {
      throw new Error('Target is required');
    }

    if (!request.message?.trim() && !request.file?.trim()) {
      throw new Error('Message or file is required');
    }

    if (request.target && !this.isValidPhoneNumber(request.target)) {
      throw new Error('Invalid phone number format');
    }
  }

  private validateTemplateRequest(request: FontteTemplateMessageRequest): void {
    if (!request.target?.trim()) {
      throw new Error('Target is required');
    }

    if (!request.template?.trim()) {
      throw new Error('Template is required');
    }

    if (request.target && !this.isValidPhoneNumber(request.target)) {
      throw new Error('Invalid phone number format');
    }
  }

  private validateWebhookData(data: FontteWebhookData): boolean {
    return !!(
      data.device &&
      data.sender &&
      data.message &&
      data.date
    );
  }

  private isValidPhoneNumber(phone: string): boolean {
    const phoneRegex = /^(\+?62|0)[0-9]{8,13}$/;
    return phoneRegex.test(phone.replace(/[^\d+]/g, ''));
  }

  private isRetryableError(error: AxiosError): boolean {
    if (!error.response) return true;

    const status = error.response.status;
    return status >= 500 || status === 429 || status === 408;
  }

  private formatError(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    if (typeof error === 'object' && error !== null) {
      const errorObj = error as any;
      if (errorObj.response?.data?.message) return errorObj.response.data.message;
      if (errorObj.response?.data?.error) return errorObj.response.data.error;
      if (errorObj.message) return errorObj.message;
      if (errorObj.response?.statusText) return errorObj.response.statusText;
    }

    return 'Unknown error occurred';
  }

  private generateId(): string {
    return `fonnte_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  formatPhoneNumber(phone: string, countryCode = '62'): string {
    let cleaned = phone.replace(/[^\d+]/g, '');

    if (cleaned.startsWith('0')) {
      cleaned = countryCode + cleaned.substring(1);
    } else if (!cleaned.startsWith('+') && !cleaned.startsWith(countryCode)) {
      cleaned = countryCode + cleaned;
    }

    return cleaned;
  }

  isDeviceConnected(deviceInfo: FontteDeviceInfo): boolean {
    return deviceInfo.status === 'connect';
  }

  hasQuotaRemaining(deviceInfo: FontteDeviceInfo): boolean {
    return deviceInfo.quota > 0;
  }
}

export function createFontteIntegration(config: FontteConfig): FontteIntegration {
  return new FontteIntegration(config);
}

export type {
  FontteConfig,
  FontteMessageRequest,
  FontteTemplateMessageRequest,
  FontteBulkMessageRequest,
  FontteMessageResponse,
  FontteDeviceInfo,
  FontteIncomingMessage,
  FontteWebhookData,
  FontteQueueItem,
  FontteRetryConfig,
};
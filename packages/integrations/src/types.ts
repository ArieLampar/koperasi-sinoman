export interface BaseIntegrationConfig {
  apiKey: string;
  environment?: 'production' | 'sandbox' | 'development';
}

export interface BaseIntegrationResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface BaseIntegrationError extends Error {
  code?: string | number;
  statusCode?: number;
  details?: unknown;
}

export type IntegrationResult<T> = Promise<BaseIntegrationResponse<T>>;
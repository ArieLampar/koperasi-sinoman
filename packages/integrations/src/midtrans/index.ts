import { CoreApi, Snap } from 'midtrans-client';
import type { BaseIntegrationConfig, IntegrationResult } from '../types';

export interface MidtransConfig extends BaseIntegrationConfig {
  serverKey: string;
  clientKey: string;
  isProduction?: boolean;
}

export interface MidtransCustomerDetails {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  billing_address?: {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    postal_code?: string;
    country_code?: string;
  };
  shipping_address?: {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    postal_code?: string;
    country_code?: string;
  };
}

export interface MidtransItemDetails {
  id: string;
  price: number;
  quantity: number;
  name: string;
  brand?: string;
  category?: string;
  merchant_name?: string;
}

export interface MidtransTransactionDetails {
  order_id: string;
  gross_amount: number;
}

export interface MidtransCreateTransactionRequest {
  transaction_details: MidtransTransactionDetails;
  customer_details?: MidtransCustomerDetails;
  item_details?: MidtransItemDetails[];
  credit_card?: {
    secure?: boolean;
    channel?: 'migs';
    bank?: string;
    installment?: {
      required?: boolean;
      terms?: {
        [bank: string]: number[];
      };
    };
    whitelist_bins?: string[];
  };
  bca_va?: {
    va_number?: string;
  };
  bni_va?: {
    va_number?: string;
  };
  bri_va?: {
    va_number?: string;
  };
  permata_va?: {
    va_number?: string;
    recipient_name?: string;
  };
  callbacks?: {
    finish?: string;
    error?: string;
    pending?: string;
  };
  expiry?: {
    start_time?: string;
    unit?: 'second' | 'minute' | 'hour' | 'day';
    duration?: number;
  };
  custom_field1?: string;
  custom_field2?: string;
  custom_field3?: string;
}

export interface MidtransSnapTokenResponse {
  token: string;
  redirect_url: string;
}

export interface MidtransTransactionStatus {
  transaction_time: string;
  transaction_status: 'capture' | 'settlement' | 'pending' | 'deny' | 'cancel' | 'expire' | 'failure' | 'refund' | 'partial_refund' | 'authorize';
  transaction_id: string;
  status_message: string;
  status_code: string;
  signature_key: string;
  payment_type: string;
  order_id: string;
  merchant_id: string;
  gross_amount: string;
  fraud_status: 'accept' | 'challenge' | 'deny';
  currency: string;
  settlement_time?: string;
  expiry_time?: string;
  finish_redirect_url?: string;
  error_redirect_url?: string;
  pending_redirect_url?: string;
  approval_code?: string;
  bank?: string;
  eci?: string;
  va_numbers?: Array<{
    bank: string;
    va_number: string;
  }>;
  biller_code?: string;
  bill_key?: string;
  pdf_url?: string;
  qr_string?: string;
}

export interface MidtransWebhookNotification {
  transaction_time: string;
  transaction_status: string;
  transaction_id: string;
  status_message: string;
  status_code: string;
  signature_key: string;
  payment_type: string;
  order_id: string;
  merchant_id: string;
  gross_amount: string;
  fraud_status: string;
  currency: string;
  settlement_time?: string;
  expiry_time?: string;
}

export interface MidtransRefundRequest {
  refund_key?: string;
  amount?: number;
  reason?: string;
}

export interface MidtransRefundResponse {
  status_code: string;
  status_message: string;
  transaction_id: string;
  order_id: string;
  gross_amount: string;
  refund_amount: string;
  refund_key: string;
  refund_chargeback_id: number;
  refund_charge_amount: string;
}

export class MidtransIntegration {
  private snap: Snap;
  private coreApi: CoreApi;
  private config: MidtransConfig;

  constructor(config: MidtransConfig) {
    this.config = config;

    const clientConfig = {
      isProduction: config.isProduction ?? false,
      serverKey: config.serverKey,
      clientKey: config.clientKey,
    };

    this.snap = new Snap(clientConfig);
    this.coreApi = new CoreApi(clientConfig);
  }

  async createPaymentToken(
    transactionRequest: MidtransCreateTransactionRequest
  ): IntegrationResult<MidtransSnapTokenResponse> {
    try {
      this.validateTransactionRequest(transactionRequest);

      const transaction = await this.snap.createTransaction(transactionRequest);
      return {
        success: true,
        data: transaction,
      };
    } catch (error) {
      return {
        success: false,
        error: this.formatError(error),
      };
    }
  }

  async getTransactionStatus(orderId: string): IntegrationResult<MidtransTransactionStatus> {
    try {
      if (!orderId?.trim()) {
        throw new Error('Order ID is required');
      }

      const status = await this.coreApi.transaction.status(orderId);
      return {
        success: true,
        data: status as MidtransTransactionStatus,
      };
    } catch (error) {
      return {
        success: false,
        error: this.formatError(error),
      };
    }
  }

  async cancelTransaction(orderId: string): IntegrationResult<MidtransTransactionStatus> {
    try {
      if (!orderId?.trim()) {
        throw new Error('Order ID is required');
      }

      const result = await this.coreApi.transaction.cancel(orderId);
      return {
        success: true,
        data: result as MidtransTransactionStatus,
      };
    } catch (error) {
      return {
        success: false,
        error: this.formatError(error),
      };
    }
  }

  async approveTransaction(orderId: string): IntegrationResult<MidtransTransactionStatus> {
    try {
      if (!orderId?.trim()) {
        throw new Error('Order ID is required');
      }

      const result = await this.coreApi.transaction.approve(orderId);
      return {
        success: true,
        data: result as MidtransTransactionStatus,
      };
    } catch (error) {
      return {
        success: false,
        error: this.formatError(error),
      };
    }
  }

  async denyTransaction(orderId: string): IntegrationResult<MidtransTransactionStatus> {
    try {
      if (!orderId?.trim()) {
        throw new Error('Order ID is required');
      }

      const result = await this.coreApi.transaction.deny(orderId);
      return {
        success: true,
        data: result as MidtransTransactionStatus,
      };
    } catch (error) {
      return {
        success: false,
        error: this.formatError(error),
      };
    }
  }

  async refundTransaction(
    orderId: string,
    refundRequest?: MidtransRefundRequest
  ): IntegrationResult<MidtransRefundResponse> {
    try {
      if (!orderId?.trim()) {
        throw new Error('Order ID is required');
      }

      const result = await this.coreApi.transaction.refund(orderId, refundRequest);
      return {
        success: true,
        data: result as MidtransRefundResponse,
      };
    } catch (error) {
      return {
        success: false,
        error: this.formatError(error),
      };
    }
  }

  async partialRefundTransaction(
    orderId: string,
    refundRequest: Required<Pick<MidtransRefundRequest, 'amount'>> & Omit<MidtransRefundRequest, 'amount'>
  ): IntegrationResult<MidtransRefundResponse> {
    try {
      if (!orderId?.trim()) {
        throw new Error('Order ID is required');
      }

      if (!refundRequest.amount || refundRequest.amount <= 0) {
        throw new Error('Refund amount must be greater than 0');
      }

      const result = await this.coreApi.transaction.refundDirect(orderId, refundRequest);
      return {
        success: true,
        data: result as MidtransRefundResponse,
      };
    } catch (error) {
      return {
        success: false,
        error: this.formatError(error),
      };
    }
  }

  verifySignatureKey(notification: MidtransWebhookNotification): boolean {
    try {
      const { order_id, status_code, gross_amount, signature_key } = notification;
      const serverKey = this.config.serverKey;

      const crypto = require('crypto');
      const hash = crypto
        .createHash('sha512')
        .update(order_id + status_code + gross_amount + serverKey)
        .digest('hex');

      return hash === signature_key;
    } catch (error) {
      return false;
    }
  }

  async handleCallback(notification: MidtransWebhookNotification): IntegrationResult<{
    isValid: boolean;
    transactionStatus: MidtransTransactionStatus | null;
  }> {
    try {
      const isValid = this.verifySignatureKey(notification);

      if (!isValid) {
        return {
          success: false,
          error: 'Invalid signature key',
          data: { isValid: false, transactionStatus: null },
        };
      }

      const statusResult = await this.getTransactionStatus(notification.order_id);

      return {
        success: true,
        data: {
          isValid: true,
          transactionStatus: statusResult.data || null,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: this.formatError(error),
        data: { isValid: false, transactionStatus: null },
      };
    }
  }

  private validateTransactionRequest(request: MidtransCreateTransactionRequest): void {
    if (!request.transaction_details?.order_id?.trim()) {
      throw new Error('Transaction order_id is required');
    }

    if (!request.transaction_details?.gross_amount || request.transaction_details.gross_amount <= 0) {
      throw new Error('Transaction gross_amount must be greater than 0');
    }

    if (request.item_details && Array.isArray(request.item_details)) {
      const totalItemAmount = request.item_details.reduce(
        (sum, item) => sum + (item.price * item.quantity), 0
      );

      if (Math.abs(totalItemAmount - request.transaction_details.gross_amount) > 0.01) {
        throw new Error('Total item amount must equal gross_amount');
      }
    }
  }

  private formatError(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    if (typeof error === 'object' && error !== null) {
      const errorObj = error as any;
      if (errorObj.message) return errorObj.message;
      if (errorObj.error_messages) return errorObj.error_messages.join(', ');
      if (errorObj.status_message) return errorObj.status_message;
    }

    return 'Unknown error occurred';
  }

  isTransactionSuccessful(status: MidtransTransactionStatus): boolean {
    return ['capture', 'settlement'].includes(status.transaction_status) &&
           status.fraud_status === 'accept';
  }

  isTransactionPending(status: MidtransTransactionStatus): boolean {
    return status.transaction_status === 'pending';
  }

  isTransactionFailed(status: MidtransTransactionStatus): boolean {
    return ['deny', 'cancel', 'expire', 'failure'].includes(status.transaction_status);
  }
}

export function createMidtransIntegration(config: MidtransConfig): MidtransIntegration {
  return new MidtransIntegration(config);
}

export type {
  MidtransConfig,
  MidtransCustomerDetails,
  MidtransItemDetails,
  MidtransTransactionDetails,
  MidtransCreateTransactionRequest,
  MidtransSnapTokenResponse,
  MidtransTransactionStatus,
  MidtransWebhookNotification,
  MidtransRefundRequest,
  MidtransRefundResponse,
};
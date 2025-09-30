import { CoreApi, Snap } from 'midtrans-client';
import type { BaseIntegrationConfig, IntegrationResult } from './types';

export interface MidtransConfig extends BaseIntegrationConfig {
  serverKey: string;
  clientKey: string;
  isProduction?: boolean;
}

export interface MidtransTransactionRequest {
  transaction_details: {
    order_id: string;
    gross_amount: number;
  };
  customer_details?: {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
  };
  item_details?: Array<{
    id: string;
    price: number;
    quantity: number;
    name: string;
  }>;
}

export interface MidtransTransactionResponse {
  token: string;
  redirect_url: string;
}

export interface MidtransTransactionStatus {
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
}

export class MidtransIntegration {
  private snap: Snap;
  private coreApi: CoreApi;

  constructor(config: MidtransConfig) {
    this.snap = new Snap({
      isProduction: config.isProduction ?? false,
      serverKey: config.serverKey,
      clientKey: config.clientKey,
    });

    this.coreApi = new CoreApi({
      isProduction: config.isProduction ?? false,
      serverKey: config.serverKey,
      clientKey: config.clientKey,
    });
  }

  async createTransaction(
    transactionDetails: MidtransTransactionRequest
  ): IntegrationResult<MidtransTransactionResponse> {
    try {
      const transaction = await this.snap.createTransaction(transactionDetails);
      return {
        success: true,
        data: transaction,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async getTransactionStatus(orderId: string): IntegrationResult<MidtransTransactionStatus> {
    try {
      const status = await this.coreApi.transaction.status(orderId);
      return {
        success: true,
        data: status,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async cancelTransaction(orderId: string): IntegrationResult<MidtransTransactionStatus> {
    try {
      const result = await this.coreApi.transaction.cancel(orderId);
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }
}

export function createMidtransIntegration(config: MidtransConfig): MidtransIntegration {
  return new MidtransIntegration(config);
}
import type {
  WelcomeMessageData,
  PaymentSuccessData,
  OTPMessageData,
  NotificationType,
} from './types';

const API_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

/**
 * Helper function to send WhatsApp notification
 */
export async function sendWhatsAppNotification(
  recipient: string,
  type: NotificationType,
  data: Record<string, any>,
  memberId?: string
): Promise<void> {
  try {
    const response = await fetch(`${API_URL}/api/whatsapp/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipient,
        type,
        data,
        memberId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Failed to send WhatsApp notification:', error);
      // Don't throw error - we don't want to break the main flow if notification fails
    }
  } catch (error) {
    console.error('Error sending WhatsApp notification:', error);
    // Silently fail - notification is not critical
  }
}

/**
 * Format Indonesian date
 */
export function formatIndonesianDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Jakarta',
  }).format(d);
}

/**
 * Send welcome message after successful registration
 */
export async function sendWelcomeMessage(
  phone: string,
  nama: string,
  nomorAnggota: string,
  memberId?: string
): Promise<void> {
  const data: WelcomeMessageData = {
    nama,
    nomorAnggota,
    tanggalBergabung: formatIndonesianDate(new Date()),
  };

  await sendWhatsAppNotification(phone, 'welcome', data, memberId);
}

/**
 * Send payment success message
 */
export async function sendPaymentSuccessMessage(
  phone: string,
  nama: string,
  orderId: string,
  type: string,
  amount: number,
  method: string,
  conditionalContent?: string,
  memberId?: string
): Promise<void> {
  const formattedAmount = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);

  const data: PaymentSuccessData = {
    nama,
    orderId,
    type,
    amount: formattedAmount,
    method,
    timestamp: formatIndonesianDate(new Date()),
    conditionalContent,
  };

  await sendWhatsAppNotification(phone, 'payment_success', data, memberId);
}

/**
 * Send OTP message
 */
export async function sendOTPMessage(
  phone: string,
  otpCode: string,
  memberId?: string
): Promise<void> {
  const data: OTPMessageData = {
    otpCode,
  };

  await sendWhatsAppNotification(phone, 'otp', data, memberId);
}
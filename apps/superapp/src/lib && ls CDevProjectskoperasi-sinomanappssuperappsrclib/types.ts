export type NotificationType =
  | 'welcome'
  | 'payment_success'
  | 'otp'
  | 'fit_challenge_reminder'
  | 'order_shipped'
  | 'bank_sampah_pickup'
  | 'referral_bonus'
  | 'savings_update';

export interface WhatsAppMessage {
  recipient: string;
  type: NotificationType;
  data: Record<string, any>;
  memberId?: string;
}

export interface WelcomeMessageData {
  nama: string;
  nomorAnggota: string;
  tanggalBergabung: string;
}

export interface PaymentSuccessData {
  nama: string;
  orderId: string;
  type: string;
  amount: string;
  method: string;
  timestamp: string;
  conditionalContent?: string;
}

export interface OTPMessageData {
  otpCode: string;
}

export interface FitChallengeReminderData {
  nama: string;
  jadwal: string;
  lokasi: string;
  tanggal: string;
}

export interface OrderShippedData {
  nama: string;
  orderId: string;
  trackingNumber: string;
  kurir: string;
  estimasi: string;
}

export interface BankSampahPickupData {
  nama: string;
  tanggal: string;
  waktu: string;
  alamat: string;
  jenisSampah: string;
}

export interface ReferralBonusData {
  nama: string;
  namaReferral: string;
  bonus: string;
  totalReferral: number;
}

export interface SavingsUpdateData {
  nama: string;
  jenisSimpanan: string;
  jumlah: string;
  saldo: string;
  tanggal: string;
}

export interface FonteResponse {
  status: boolean;
  message: string;
  detail?: string;
  id?: string;
}

export interface NotificationLog {
  id?: string;
  type: NotificationType;
  recipient: string;
  payload: Record<string, any>;
  status: 'pending' | 'sent' | 'failed' | 'retry';
  error?: string;
  retry_count: number;
  created_at?: Date;
  sent_at?: Date;
  member_id?: string;
}
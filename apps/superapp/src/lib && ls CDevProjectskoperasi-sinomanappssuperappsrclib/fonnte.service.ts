import { createClient } from '@supabase/supabase-js';
import type {
  WhatsAppMessage,
  WelcomeMessageData,
  PaymentSuccessData,
  OTPMessageData,
  FitChallengeReminderData,
  OrderShippedData,
  BankSampahPickupData,
  ReferralBonusData,
  SavingsUpdateData,
  FonteResponse,
  NotificationLog,
  NotificationType,
} from './types';

const FONNTE_API_URL = 'https://api.fonnte.com/send';
const FONNTE_TOKEN = process.env.FONNTE_TOKEN!;
const FONNTE_DEVICE = process.env.FONNTE_DEVICE!;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export class FontteService {
  private maxRetries = 3;
  private retryDelay = 2000; // 2 seconds

  /**
   * Format phone number to Indonesian format (62xxx)
   */
  private formatPhoneNumber(phone: string): string {
    // Remove all non-numeric characters
    let cleaned = phone.replace(/\D/g, '');

    // Handle different formats
    if (cleaned.startsWith('0')) {
      cleaned = '62' + cleaned.substring(1);
    } else if (cleaned.startsWith('8')) {
      cleaned = '62' + cleaned;
    } else if (!cleaned.startsWith('62')) {
      cleaned = '62' + cleaned;
    }

    return cleaned;
  }

  /**
   * Format currency to Indonesian format
   */
  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  }

  /**
   * Format date to Indonesian format
   */
  private formatDate(date: Date | string): string {
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
   * Log notification to database
   */
  private async logNotification(
    type: NotificationType,
    recipient: string,
    payload: Record<string, any>,
    memberId?: string
  ): Promise<string> {
    const { data, error } = await supabase
      .from('notification_logs')
      .insert({
        type,
        recipient,
        payload,
        status: 'pending',
        member_id: memberId,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Failed to log notification:', error);
      throw error;
    }

    return data.id;
  }

  /**
   * Update notification status
   */
  private async updateNotificationStatus(
    id: string,
    status: 'sent' | 'failed' | 'retry',
    error?: string
  ): Promise<void> {
    const updateData: any = {
      status,
      ...(status === 'sent' && { sent_at: new Date().toISOString() }),
      ...(error && { error }),
    };

    await supabase.from('notification_logs').update(updateData).eq('id', id);
  }

  /**
   * Send message via Fonnte API with retry mechanism
   */
  private async sendToFonnte(
    target: string,
    message: string,
    retryCount = 0
  ): Promise<FonteResponse> {
    try {
      const response = await fetch(FONNTE_API_URL, {
        method: 'POST',
        headers: {
          Authorization: FONNTE_TOKEN,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          target,
          message,
          countryCode: '62',
        }),
      });

      if (!response.ok) {
        throw new Error(`Fonnte API error: ${response.statusText}`);
      }

      const data: FonteResponse = await response.json();

      if (!data.status && retryCount < this.maxRetries) {
        console.log(`Retry ${retryCount + 1}/${this.maxRetries} for ${target}`);
        await new Promise((resolve) => setTimeout(resolve, this.retryDelay));
        return this.sendToFonnte(target, message, retryCount + 1);
      }

      return data;
    } catch (error) {
      if (retryCount < this.maxRetries) {
        console.log(`Retry ${retryCount + 1}/${this.maxRetries} after error for ${target}`);
        await new Promise((resolve) => setTimeout(resolve, this.retryDelay));
        return this.sendToFonnte(target, message, retryCount + 1);
      }
      throw error;
    }
  }

  /**
   * Main send method
   */
  async send(messageData: WhatsAppMessage): Promise<void> {
    const { recipient, type, data, memberId } = messageData;
    const formattedPhone = this.formatPhoneNumber(recipient);

    // Log to database
    const logId = await this.logNotification(type, formattedPhone, data, memberId);

    try {
      let message: string;

      switch (type) {
        case 'welcome':
          message = this.createWelcomeMessage(data as WelcomeMessageData);
          break;
        case 'payment_success':
          message = this.createPaymentSuccessMessage(data as PaymentSuccessData);
          break;
        case 'otp':
          message = this.createOTPMessage(data as OTPMessageData);
          break;
        case 'fit_challenge_reminder':
          message = this.createFitChallengeReminder(data as FitChallengeReminderData);
          break;
        case 'order_shipped':
          message = this.createOrderShippedMessage(data as OrderShippedData);
          break;
        case 'bank_sampah_pickup':
          message = this.createBankSampahPickupMessage(data as BankSampahPickupData);
          break;
        case 'referral_bonus':
          message = this.createReferralBonusMessage(data as ReferralBonusData);
          break;
        case 'savings_update':
          message = this.createSavingsUpdateMessage(data as SavingsUpdateData);
          break;
        default:
          throw new Error(`Unknown message type: ${type}`);
      }

      // Send via Fonnte
      const result = await this.sendToFonnte(formattedPhone, message);

      if (result.status) {
        await this.updateNotificationStatus(logId, 'sent');
        console.log(`Message sent successfully to ${formattedPhone}`);
      } else {
        await this.updateNotificationStatus(logId, 'failed', result.message);
        console.error(`Failed to send message to ${formattedPhone}: ${result.message}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.updateNotificationStatus(logId, 'failed', errorMessage);
      console.error(`Error sending message to ${formattedPhone}:`, error);
      throw error;
    }
  }

  // ========== MESSAGE TEMPLATES ==========

  private createWelcomeMessage(data: WelcomeMessageData): string {
    return `*Selamat datang di Keluarga Besar Koperasi Sinoman!*

Yth. Bapak/Ibu *${data.nama}*,

Kami dengan senang hati menyambut Anda sebagai anggota Koperasi Sinoman. Terima kasih atas kepercayaan yang telah diberikan kepada kami.

📋 *INFORMASI KEANGGOTAAN ANDA*

Nomor Anggota: *${data.nomorAnggota}*
Status: Aktif
Tanggal Bergabung: ${data.tanggalBergabung}

📱 *AKSES APLIKASI*
Silakan akses layanan kami melalui:
https://sinoman.vercel.app

🎁 *HAK ISTIMEWA ANGGOTA*

✅ Potongan harga khusus hingga 20%
✅ Program kesehatan Fit Challenge
✅ Akses investasi unit usaha koperasi
✅ Layanan bank sampah terintegrasi

Jika memerlukan bantuan, jangan ragu untuk menghubungi kami melalui aplikasi atau membalas pesan ini.

Hormat kami,
Tim Koperasi Sinoman
_"Sehat Bareng, Kaya Bareng, Bareng Sinoman"_`;
  }

  private createPaymentSuccessMessage(data: PaymentSuccessData): string {
    return `*Konfirmasi Pembayaran Berhasil*

Yth. Bapak/Ibu *${data.nama}*,

Pembayaran Anda telah kami terima dengan baik.

📑 *DETAIL TRANSAKSI*

Nomor Transaksi: *${data.orderId}*
Jenis Layanan: ${data.type}
Jumlah Pembayaran: *${data.amount}*
Metode Pembayaran: ${data.method}
Waktu Pembayaran: ${data.timestamp}
Status: *LUNAS* ✅

${data.conditionalContent || ''}

Bukti pembayaran dapat Anda akses melalui menu Riwayat Transaksi di aplikasi.

Terima kasih atas kepercayaan Anda.

Hormat kami,
Tim Koperasi Sinoman
_"Sehat Bareng, Kaya Bareng, Bareng Sinoman"_`;
  }

  private createOTPMessage(data: OTPMessageData): string {
    return `*Kode Verifikasi Koperasi Sinoman*

Kode OTP Anda: *${data.otpCode}*

⚠️ Mohon tidak membagikan kode ini kepada siapapun termasuk pihak yang mengatasnamakan Koperasi Sinoman.

Kode berlaku selama 5 menit.

Jika Anda tidak melakukan permintaan ini, silakan abaikan pesan ini dan segera hubungi kami.

Hormat kami,
Tim Koperasi Sinoman
_"Sehat Bareng, Kaya Bareng, Bareng Sinoman"_`;
  }

  private createFitChallengeReminder(data: FitChallengeReminderData): string {
    return `*Reminder: Fit Challenge Anda*

Yth. Bapak/Ibu *${data.nama}*,

Kami mengingatkan jadwal Fit Challenge Anda:

📅 *INFORMASI KEGIATAN*

Tanggal: ${data.tanggal}
Waktu: ${data.jadwal}
Lokasi: ${data.lokasi}

💪 Persiapkan diri Anda dan jangan lupa:
✅ Membawa botol minum
✅ Menggunakan pakaian olahraga yang nyaman
✅ Datang 15 menit lebih awal

Kami tunggu kehadiran Anda!

Hormat kami,
Tim Koperasi Sinoman
_"Sehat Bareng, Kaya Bareng, Bareng Sinoman"_`;
  }

  private createOrderShippedMessage(data: OrderShippedData): string {
    return `*Pesanan Anda Sedang Dikirim*

Yth. Bapak/Ibu *${data.nama}*,

Pesanan Anda telah dikirim dan sedang dalam perjalanan.

📦 *INFORMASI PENGIRIMAN*

Nomor Pesanan: *${data.orderId}*
Nomor Resi: *${data.trackingNumber}*
Kurir: ${data.kurir}
Estimasi Tiba: ${data.estimasi}

Anda dapat melacak paket Anda melalui aplikasi atau website kurir terkait.

Terima kasih atas kepercayaan Anda berbelanja di Koperasi Sinoman.

Hormat kami,
Tim Koperasi Sinoman
_"Sehat Bareng, Kaya Bareng, Bareng Sinoman"_`;
  }

  private createBankSampahPickupMessage(data: BankSampahPickupData): string {
    return `*Jadwal Penjemputan Bank Sampah*

Yth. Bapak/Ibu *${data.nama}*,

Penjemputan sampah Anda telah dijadwalkan.

🗓️ *INFORMASI PENJEMPUTAN*

Tanggal: ${data.tanggal}
Waktu: ${data.waktu}
Alamat: ${data.alamat}
Jenis Sampah: ${data.jenisSampah}

♻️ Mohon pastikan sampah sudah dipilah dan dikemas dengan rapi sesuai jenisnya.

Kontribusi Anda sangat berarti untuk lingkungan yang lebih bersih dan sehat!

Hormat kami,
Tim Bank Sampah Koperasi Sinoman
_"Sehat Bareng, Kaya Bareng, Bareng Sinoman"_`;
  }

  private createReferralBonusMessage(data: ReferralBonusData): string {
    return `*Selamat! Anda Mendapat Bonus Referral*

Yth. Bapak/Ibu *${data.nama}*,

Terima kasih telah mengajak ${data.namaReferral} bergabung dengan Koperasi Sinoman!

🎉 *INFORMASI BONUS*

Referral Berhasil: ${data.namaReferral}
Bonus Diterima: *${data.bonus}*
Total Referral Anda: ${data.totalReferral} orang

Bonus telah ditambahkan ke akun Anda dan dapat digunakan untuk transaksi di aplikasi.

Mari terus berbagi manfaat dengan mengajak lebih banyak kerabat bergabung!

Hormat kami,
Tim Koperasi Sinoman
_"Sehat Bareng, Kaya Bareng, Bareng Sinoman"_`;
  }

  private createSavingsUpdateMessage(data: SavingsUpdateData): string {
    return `*Update Simpanan Anda*

Yth. Bapak/Ibu *${data.nama}*,

Simpanan Anda telah diperbarui.

💰 *INFORMASI SIMPANAN*

Jenis Simpanan: ${data.jenisSimpanan}
Transaksi: ${data.jumlah}
Saldo Terkini: *${data.saldo}*
Tanggal: ${data.tanggal}

Terima kasih atas kepercayaan Anda menabung bersama Koperasi Sinoman.

Detail lengkap dapat dilihat di aplikasi pada menu Simpanan.

Hormat kami,
Tim Koperasi Sinoman
_"Sehat Bareng, Kaya Bareng, Bareng Sinoman"_`;
  }
}

export const fonteService = new FontteService();
# WhatsApp Integration - Fonnte API

Integrasi WhatsApp untuk Koperasi Sinoman menggunakan Fonnte API.

## Setup

### 1. Environment Variables

Tambahkan ke `.env.local`:

```bash
FONNTE_TOKEN=your-fonnte-token
FONNTE_DEVICE=your-whatsapp-number-with-62-prefix
```

### 2. Database Migration

Jalankan migration untuk membuat tabel `notification_logs`:

**Via Supabase SQL Editor** (Recommended):
1. Buka Supabase Studio: https://supabase.com/dashboard
2. Navigate ke project Anda
3. Klik **SQL Editor**
4. Copy & paste SQL dari file `supabase/migrations/20240930000001_notification_logs.sql`
5. Click **Run**

**Via CLI** (jika local database running):
```bash
pnpm supabase migration up
```

✅ **Migration sudah diperbaiki** untuk fix RLS policy error!

## Features

### Message Templates

1. **Welcome Message** - Dikirim setelah member berhasil register
2. **Payment Success** - Dikirim setelah pembayaran berhasil
3. **OTP** - Untuk kode verifikasi
4. **Fit Challenge Reminder** - Reminder untuk Fit Challenge
5. **Order Shipped** - Notifikasi pengiriman pesanan
6. **Bank Sampah Pickup** - Jadwal penjemputan sampah
7. **Referral Bonus** - Notifikasi bonus referral
8. **Savings Update** - Update simpanan

## Usage

### Send WhatsApp Notification via API

```typescript
// POST /api/whatsapp/send
const response = await fetch('/api/whatsapp/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    recipient: '081234567890',
    type: 'welcome',
    data: {
      nama: 'John Doe',
      nomorAnggota: 'SIN-2025-000001',
      tanggalBergabung: '1 Januari 2025, 10:00',
    },
    memberId: 'uuid-member-id', // optional
  }),
});
```

### Using Helper Functions

```typescript
import { sendWelcomeMessage, sendPaymentSuccessMessage } from '@/lib/whatsapp/helpers';

// Send welcome message
await sendWelcomeMessage(
  '081234567890',
  'John Doe',
  'SIN-2025-000001',
  'member-uuid'
);

// Send payment success
await sendPaymentSuccessMessage(
  '081234567890',
  'John Doe',
  'ORD-123456',
  'Pembelian Produk',
  150000,
  'bank_transfer',
  undefined, // optional conditional content
  'member-uuid'
);
```

### Using Service Directly

```typescript
import { fonteService } from '@/lib/whatsapp/fonnte.service';

await fonteService.send({
  recipient: '081234567890',
  type: 'otp',
  data: {
    otpCode: '123456',
  },
  memberId: 'member-uuid',
});
```

## Message Format Guidelines

- **Tone**: Formal tapi hangat, sopan, dan kekeluargaan
- **Format**: Menggunakan WhatsApp markdown (*bold*, _italic_)
- **Currency**: Format Indonesia (Rp 1.000.000)
- **Date**: Format Indonesia (1 Januari 2025, 10:00 WIB)
- **Phone**: Format 62xxx
- **Tagline**: Selalu sertakan "Sehat Bareng, Kaya Bareng, Bareng Sinoman"

## Integration Points

### 1. Registration Flow
File: `apps/superapp/src/app/auth/register/page.tsx`
- Otomatis memanggil `/api/auth/post-register` setelah registrasi berhasil
- Mengirim welcome message dengan info keanggotaan

### 2. Payment Webhook
File: `apps/superapp/src/app/api/marketplace/payment/midtrans/webhook/route.ts`
- Otomatis mengirim konfirmasi pembayaran setelah payment success
- Khusus Fit Challenge: include info jadwal dan persiapan

## Error Handling

- Retry mechanism: 3x dengan delay 2 detik
- Log ke database: semua notifikasi ter-track di `notification_logs`
- Graceful failure: tidak memblokir main flow jika notifikasi gagal

## Monitoring

Query untuk monitoring notifikasi:

```sql
-- Check notification status
SELECT
  type,
  status,
  COUNT(*) as total,
  COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent,
  COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed
FROM notification_logs
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY type, status;

-- Check failed notifications
SELECT *
FROM notification_logs
WHERE status = 'failed'
ORDER BY created_at DESC
LIMIT 10;
```

## Rate Limiting

Fonnte memiliki rate limiting. Service otomatis handle retry dengan delay untuk menghindari rate limit.

## Security

- Token disimpan di environment variables
- Semua log di-encrypt di database
- Nomor telepon di-format dan validate sebelum dikirim

## Support

Untuk bantuan dan troubleshooting:
- Documentation: https://fonnte.com/documentation
- Dashboard: https://fonnte.com/dashboard
- Customer Service: 24/7 via aplikasi
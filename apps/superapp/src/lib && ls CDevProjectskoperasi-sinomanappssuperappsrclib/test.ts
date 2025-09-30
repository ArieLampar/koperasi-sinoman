/**
 * Test Script untuk WhatsApp Integration
 *
 * Usage:
 * 1. Pastikan server Next.js running (pnpm dev)
 * 2. Run: npx tsx apps/superapp/lib/whatsapp/test.ts
 */

import { sendWhatsAppNotification } from './helpers';

const API_URL = 'http://localhost:3000';

async function testWelcomeMessage() {
  console.log('\n🧪 Testing Welcome Message...');

  try {
    const response = await fetch(`${API_URL}/api/whatsapp/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient: '082331052577', // Ganti dengan nomor test Anda
        type: 'welcome',
        data: {
          nama: 'Budi Santoso',
          nomorAnggota: 'SIN-2025-000001',
          tanggalBergabung: '30 September 2025, 10:30 WIB',
        },
      }),
    });

    const result = await response.json();
    console.log('✅ Welcome Message Result:', result);
  } catch (error) {
    console.error('❌ Welcome Message Error:', error);
  }
}

async function testPaymentSuccessMessage() {
  console.log('\n🧪 Testing Payment Success Message...');

  try {
    const response = await fetch(`${API_URL}/api/whatsapp/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient: '082331052577', // Ganti dengan nomor test Anda
        type: 'payment_success',
        data: {
          nama: 'Budi Santoso',
          orderId: 'ORD-2025-000123',
          type: 'Pembelian Produk',
          amount: 'Rp 150.000',
          method: 'Bank Transfer',
          timestamp: '30 September 2025, 11:00 WIB',
        },
      }),
    });

    const result = await response.json();
    console.log('✅ Payment Success Result:', result);
  } catch (error) {
    console.error('❌ Payment Success Error:', error);
  }
}

async function testFitChallengePayment() {
  console.log('\n🧪 Testing Fit Challenge Payment Message...');

  try {
    const conditionalContent = `
📅 *INFORMASI FIT CHALLENGE*

Terima kasih telah mendaftar! Detail jadwal dan lokasi akan dikirimkan melalui email dan WhatsApp H-2 sebelum acara.

Persiapkan diri Anda:
✅ Membawa botol minum
✅ Menggunakan pakaian olahraga
✅ Datang 15 menit lebih awal
`;

    const response = await fetch(`${API_URL}/api/whatsapp/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient: '082331052577', // Ganti dengan nomor test Anda
        type: 'payment_success',
        data: {
          nama: 'Budi Santoso',
          orderId: 'ORD-2025-000124',
          type: 'Pendaftaran Fit Challenge',
          amount: 'Rp 50.000',
          method: 'QRIS',
          timestamp: '30 September 2025, 11:15 WIB',
          conditionalContent,
        },
      }),
    });

    const result = await response.json();
    console.log('✅ Fit Challenge Payment Result:', result);
  } catch (error) {
    console.error('❌ Fit Challenge Payment Error:', error);
  }
}

async function testOTPMessage() {
  console.log('\n🧪 Testing OTP Message...');

  try {
    const response = await fetch(`${API_URL}/api/whatsapp/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient: '082331052577', // Ganti dengan nomor test Anda
        type: 'otp',
        data: {
          otpCode: '123456',
        },
      }),
    });

    const result = await response.json();
    console.log('✅ OTP Message Result:', result);
  } catch (error) {
    console.error('❌ OTP Message Error:', error);
  }
}

async function testAllMessages() {
  console.log('🚀 Starting WhatsApp Integration Tests...\n');
  console.log('📱 Test Number: 082331052577 (GANTI DENGAN NOMOR ANDA!)');
  console.log('⏰ Delay antar test: 3 detik untuk menghindari rate limit\n');

  await testWelcomeMessage();

  await new Promise(resolve => setTimeout(resolve, 3000));
  await testPaymentSuccessMessage();

  await new Promise(resolve => setTimeout(resolve, 3000));
  await testFitChallengePayment();

  await new Promise(resolve => setTimeout(resolve, 3000));
  await testOTPMessage();

  console.log('\n✨ All tests completed!');
  console.log('\n📊 Check your WhatsApp and database notification_logs table');
}

// Run all tests
testAllMessages().catch(console.error);
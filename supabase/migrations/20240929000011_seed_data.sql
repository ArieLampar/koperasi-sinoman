-- =====================================================
-- KOPERASI SINOMAN SUPERAPP - DATABASE SEEDING
-- =====================================================
-- Migration: 20240929000011_seed_data
-- Description: Insert initial data for testing and production

-- =====================================================
-- SAVINGS TYPES
-- =====================================================
INSERT INTO savings_types (name, code, description, minimum_amount, is_withdrawable, is_mandatory, interest_rate) VALUES
('Simpanan Pokok', 'POKOK', 'Simpanan pokok yang wajib dibayar saat menjadi anggota koperasi', 100000, false, true, 0.0),
('Simpanan Wajib', 'WAJIB', 'Simpanan wajib bulanan yang harus dibayar setiap anggota', 50000, false, true, 0.03),
('Simpanan Sukarela', 'SUKARELA', 'Simpanan sukarela yang dapat disetor dan ditarik kapan saja', 10000, true, false, 0.06),
('Simpanan Berjangka', 'BERJANGKA', 'Simpanan berjangka dengan jangka waktu tertentu dan bunga lebih tinggi', 1000000, false, false, 0.08)
;

-- =====================================================
-- TRANSACTION TYPES
-- =====================================================
INSERT INTO transaction_types (name, code, category, description) VALUES
-- Deposit transactions
('Setoran Tunai', 'DEPOSIT_CASH', 'deposit', 'Setoran simpanan secara tunai'),
('Setoran Transfer Bank', 'DEPOSIT_TRANSFER', 'deposit', 'Setoran simpanan melalui transfer bank'),
('Setoran Virtual Account', 'DEPOSIT_VA', 'deposit', 'Setoran simpanan melalui virtual account'),
('Setoran QRIS', 'DEPOSIT_QRIS', 'deposit', 'Setoran simpanan melalui QRIS'),

-- Withdrawal transactions
('Penarikan Tunai', 'WITHDRAWAL_CASH', 'withdrawal', 'Penarikan simpanan secara tunai'),
('Penarikan Transfer Bank', 'WITHDRAWAL_TRANSFER', 'withdrawal', 'Penarikan simpanan melalui transfer bank'),

-- Transfer transactions
('Transfer Antar Rekening', 'TRANSFER_INTERNAL', 'transfer', 'Transfer antara rekening simpanan anggota'),
('Transfer ke Bank', 'TRANSFER_EXTERNAL', 'transfer', 'Transfer dari rekening simpanan ke bank eksternal'),

-- Fee transactions
('Biaya Administrasi', 'FEE_ADMIN', 'fee', 'Biaya administrasi bulanan'),
('Biaya Transfer', 'FEE_TRANSFER', 'fee', 'Biaya untuk transfer ke bank eksternal'),
('Biaya Penarikan', 'FEE_WITHDRAWAL', 'fee', 'Biaya untuk penarikan simpanan'),

-- Interest transactions
('Bunga Simpanan', 'INTEREST_SAVINGS', 'interest', 'Bunga yang diterima dari simpanan'),
('Bunga Deposito', 'INTEREST_DEPOSIT', 'interest', 'Bunga yang diterima dari deposito berjangka'),

-- Bonus transactions
('Bonus Referral', 'BONUS_REFERRAL', 'bonus', 'Bonus dari referral anggota baru'),
('SHU (Sisa Hasil Usaha)', 'BONUS_SHU', 'bonus', 'Pembagian Sisa Hasil Usaha tahunan'),
('Bonus Loyalitas', 'BONUS_LOYALTY', 'bonus', 'Bonus untuk anggota loyal')
;

-- =====================================================
-- PRODUCT CATEGORIES
-- =====================================================
INSERT INTO product_categories (name, slug, description, is_active, sort_order) VALUES
('Elektronik', 'elektronik', 'Produk elektronik dan gadget', true, 1),
('Fashion', 'fashion', 'Pakaian dan aksesoris', true, 2),
('Rumah Tangga', 'rumah-tangga', 'Peralatan dan keperluan rumah tangga', true, 3),
('Makanan & Minuman', 'makanan-minuman', 'Produk makanan dan minuman', true, 4),
('Kesehatan & Kecantikan', 'kesehatan-kecantikan', 'Produk kesehatan dan kecantikan', true, 5),
('Olahraga', 'olahraga', 'Peralatan dan perlengkapan olahraga', true, 6),
('Otomotif', 'otomotif', 'Aksesoris dan spare part kendaraan', true, 7),
('Hobi & Koleksi', 'hobi-koleksi', 'Barang hobi dan koleksi', true, 8)
;

-- =====================================================
-- POINT RULES
-- =====================================================
INSERT INTO point_rules (name, activity_type, points_per_action, description, maximum_per_day, is_active) VALUES
('Bonus Pendaftaran', 'registration', 100, 'Bonus poin untuk pendaftaran anggota baru', 1, true),
('Bonus Referral', 'referral', 50, 'Bonus poin untuk mereferensikan anggota baru', 5, true),
('Setoran Simpanan', 'savings_deposit', 1, 'Poin per Rp 1,000 setoran simpanan', 100, true),
('Pembelian Marketplace', 'marketplace_purchase', 2, 'Poin per Rp 1,000 pembelian di marketplace', 200, true),
('Setoran Bank Sampah', 'bank_sampah_deposit', 10, 'Poin per kg sampah yang disetor', 50, true),
('Tantangan Fitness', 'fit_challenge_complete', 25, 'Poin untuk menyelesaikan tantangan fitness', 3, true),
('Check-in Harian', 'daily_checkin', 5, 'Poin untuk check-in harian di aplikasi', 1, true),
('Review Produk', 'review_product', 10, 'Poin untuk memberikan review produk', 10, true),
('Berbagi Sosial Media', 'share_social', 5, 'Poin untuk berbagi konten di media sosial', 5, true),
('Lengkapi Profil', 'complete_profile', 20, 'Poin untuk melengkapi profil anggota', 1, true)
;

-- =====================================================
-- REWARDS
-- =====================================================
INSERT INTO rewards (name, description, points_required, reward_type, value, is_active, stock_quantity) VALUES
('Voucher Belanja Rp 10,000', 'Voucher belanja untuk marketplace Koperasi Sinoman', 100, 'discount', 10000, true, 1000),
('Voucher Belanja Rp 25,000', 'Voucher belanja untuk marketplace Koperasi Sinoman', 250, 'discount', 25000, true, 500),
('Voucher Belanja Rp 50,000', 'Voucher belanja untuk marketplace Koperasi Sinoman', 500, 'discount', 50000, true, 200),
('Voucher Belanja Rp 100,000', 'Voucher belanja untuk marketplace Koperasi Sinoman', 1000, 'discount', 100000, true, 100),
('Cashback Rp 5,000', 'Cashback langsung ke saldo simpanan', 50, 'cashback', 5000, true, 2000),
('Cashback Rp 20,000', 'Cashback langsung ke saldo simpanan', 200, 'cashback', 20000, true, 500),
('Cashback Rp 50,000', 'Cashback langsung ke saldo simpanan', 500, 'cashback', 50000, true, 200),
('Free Shipping Service', 'Gratis ongkos kirim untuk 1 pembelian', 75, 'service', 0, true, 1000),
('Tumbler Koperasi Sinoman', 'Tumbler eksklusif dengan logo Koperasi Sinoman', 300, 'product', 0, true, 50),
('Tas Belanja Ramah Lingkungan', 'Tas belanja reusable dari bahan ramah lingkungan', 150, 'product', 0, true, 100)
;

-- =====================================================
-- BANK SAMPAH UNITS (Sample locations)
-- =====================================================
INSERT INTO bank_sampah_units (name, code, address, phone, manager_name, capacity_kg, status) VALUES
('Bank Sampah Ponorogo Utara', 'BSU001', 'Jl. Raya Ponorogo-Madiun Km 5, Ponorogo Utara', '08123456789', 'Budi Santoso', 1000.00, 'operational'),
('Bank Sampah Ponorogo Selatan', 'BSU002', 'Jl. Ahmad Yani No 45, Ponorogo Selatan', '08198765432', 'Siti Rahayu', 800.00, 'operational'),
('Bank Sampah Kecamatan Babadan', 'BSU003', 'Jl. Desa Babadan RT 02 RW 01, Babadan', '08567891234', 'Ahmad Wijaya', 500.00, 'planning')
;

-- =====================================================
-- NOTIFICATION TEMPLATES
-- =====================================================
INSERT INTO notification_templates (name, subject, content, type, is_active) VALUES
('welcome_member', 'Selamat Datang di Koperasi Sinoman!', 'Halo {member_name}, selamat datang di Koperasi Sinoman SuperApp! Anda telah berhasil terdaftar sebagai anggota. Nikmati berbagai layanan dan keuntungan menjadi anggota koperasi.', 'info', true),
('savings_deposit_success', 'Setoran Simpanan Berhasil', 'Setoran simpanan Anda sebesar Rp {amount} telah berhasil diproses. Saldo simpanan {savings_type} Anda sekarang Rp {balance}. Terima kasih!', 'success', true),
('savings_withdrawal_success', 'Penarikan Simpanan Berhasil', 'Penarikan simpanan Anda sebesar Rp {amount} telah berhasil diproses. Saldo simpanan {savings_type} Anda sekarang Rp {balance}.', 'success', true),
('order_confirmation', 'Pesanan Dikonfirmasi', 'Pesanan #{order_number} Anda telah dikonfirmasi dengan total Rp {total_amount}. Pesanan akan segera diproses untuk pengiriman.', 'info', true),
('order_shipped', 'Pesanan Dikirim', 'Pesanan #{order_number} Anda telah dikirim. Nomor resi: {tracking_number}. Cek status pengiriman di aplikasi.', 'info', true),
('points_earned', 'Poin Didapat!', 'Selamat! Anda mendapat {points} poin dari {activity}. Total poin Anda sekarang {total_points}. Tukarkan poin dengan hadiah menarik!', 'success', true),
('reward_redeemed', 'Hadiah Berhasil Ditukar', 'Selamat! Anda telah berhasil menukar {reward_name} dengan {points} poin. Hadiah akan segera diproses.', 'success', true),
('bank_sampah_investment', 'Investasi Bank Sampah Berhasil', 'Investasi Anda di {unit_name} sebesar Rp {amount} telah berhasil. Terima kasih telah berkontribusi untuk lingkungan!', 'success', true),
('fit_challenge_completed', 'Tantangan Fitness Selesai!', 'Selamat! Anda telah menyelesaikan tantangan {challenge_name}. Anda mendapat {points} poin sebagai reward!', 'success', true),
('monthly_statement', 'Laporan Bulanan', 'Laporan aktivitas dan saldo simpanan bulan {month} telah tersedia. Cek detail di aplikasi untuk melihat ringkasan transaksi Anda.', 'info', true)
;
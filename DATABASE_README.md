# Koperasi Sinoman Database Schema

Database lengkap untuk aplikasi **SINOMAN SUPERAPP** - platform digital koperasi terintegrasi dengan fitur simpanan, marketplace, fit challenge, dan bank sampah.

## 📊 Overview

Skema database ini dirancang untuk mendukung ekosistem digital koperasi yang melayani 60,000+ anggota dengan fitur:

- **Membership & KYC** - Manajemen anggota dengan verifikasi identitas
- **Savings System** - Simpanan Pokok, Wajib, Sukarela, dan Berjangka
- **E-Commerce** - Marketplace dengan special pricing untuk anggota
- **Fit Challenge** - Program kebugaran dengan tracking dan leaderboard
- **Bank Sampah** - Integrasi dengan sistem bank sampah
- **Points & Rewards** - Gamifikasi dengan sistem poin dan hadiah
- **Notifications** - Sistem notifikasi multi-channel
- **Analytics** - Dashboard dan laporan komprehensif

## 🗄️ Database Structure

### Core Tables (35 tables total)

#### **Authentication & Membership**
- `members` - Data utama anggota koperasi
- `member_documents` - Dokumen KYC
- `referrals` - Tracking program referral

#### **Savings & Financial**
- `savings_types` - Jenis simpanan (Pokok, Wajib, Sukarela, Berjangka)
- `savings_accounts` - Rekening simpanan anggota
- `time_deposits` - Detail simpanan berjangka
- `transactions` - Transaksi keuangan
- `transaction_types` - Jenis transaksi
- `shu_distributions` - Pembagian SHU (Sisa Hasil Usaha)
- `shu_allocations` - Alokasi SHU per anggota

#### **Marketplace & E-Commerce**
- `product_categories` - Kategori produk
- `sellers` - Penjual (koperasi, UMKM, individu)
- `products` - Katalog produk
- `product_variants` - Varian produk (ukuran, warna, dll)
- `shopping_carts` - Keranjang belanja
- `cart_items` - Item dalam keranjang
- `orders` - Pesanan
- `order_items` - Detail item pesanan

#### **Fit Challenge**
- `fit_challenges` - Program fit challenge
- `fit_participants` - Peserta program
- `fit_check_ins` - Check-in harian dan progress
- `fit_leaderboard` - Papan peringkat

#### **Bank Sampah Integration**
- `bank_sampah_units` - Unit bank sampah
- `bank_sampah_member_summary` - Ringkasan partisipasi anggota
- `bank_sampah_investments` - Investasi di unit bank sampah

#### **Points & Rewards**
- `point_rules` - Aturan perolehan poin
- `member_points` - Saldo poin anggota
- `point_transactions` - Transaksi poin
- `rewards` - Katalog hadiah
- `point_redemptions` - Penukaran poin

#### **System Management**
- `notifications` - Log notifikasi
- `notification_templates` - Template notifikasi
- `admin_users` - Pengguna admin
- `audit_logs` - Log audit sistem
- `system_settings` - Pengaturan sistem

## 🚀 Installation

### 1. Setup Supabase Project

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Initialize project
supabase init

# Link to your Supabase project
supabase link --project-ref YOUR_PROJECT_REF
```

### 2. Run Migrations

#### Option A: Run Complete Schema (Recommended for new setup)
```sql
-- Import the complete schema file to Supabase SQL Editor
-- File: supabase-schema.sql
```

#### Option B: Run Individual Migrations (Recommended for production)
```bash
# Run migrations in order
supabase db push
```

Migrations akan dijalankan secara berurutan:
1. `20240929000001_initial_schema.sql` - Core member tables
2. `20240929000002_savings_system.sql` - Sistem simpanan
3. `20240929000003_marketplace.sql` - E-commerce tables
4. `20240929000004_fit_challenge.sql` - Fit challenge system
5. `20240929000005_bank_sampah.sql` - Bank sampah integration
6. `20240929000006_points_rewards.sql` - Points & rewards system
7. `20240929000007_notifications_admin.sql` - Notifications & admin
8. `20240929000008_functions_triggers.sql` - Database functions
9. `20240929000009_rls_security.sql` - Row Level Security
10. `20240929000010_views_analytics.sql` - Analytics views

### 3. Verify Installation

```sql
-- Check if all tables are created
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Verify sample data
SELECT * FROM savings_types;
SELECT * FROM product_categories;
SELECT * FROM point_rules;
```

## 🔐 Security Features

### Row Level Security (RLS)
- **Enabled** pada semua tabel sensitif
- Members hanya bisa akses data mereka sendiri
- Admin access berdasarkan role dan permissions
- Public access untuk data umum (produk, kategori)

### Audit Trail
- Semua perubahan data penting dicatat di `audit_logs`
- Tracking user, action, old/new values
- IP address dan user agent logging

### Data Validation
- CHECK constraints untuk validasi data
- Foreign key relationships terjaga
- Enum values untuk status fields

## 📈 Key Features

### 1. Auto-Generated Numbers
- **Member Number**: `SIN-YYYY-XXXXXX`
- **Account Number**: `SA-YYYY-XXXXXX`
- **Order Number**: `ORD-YYYY-XXXXXX`
- **Transaction Reference**: `TXN-YYYY-XXXXXX`

### 2. Balance Management
- Automatic balance updates via triggers
- Transaction history dengan balance before/after
- Real-time balance calculation

### 3. Points System
- Automatic points calculation
- Expiry date tracking
- Multiple earning sources (referral, purchase, fitness, environmental)

### 4. Analytics Views
- `member_summary` - Ringkasan data anggota
- `product_performance` - Performa produk
- `fit_challenge_performance` - Performa program fitness
- `executive_dashboard` - Metrics untuk executive

## 🔧 Usage Examples

### 1. Register New Member
```sql
INSERT INTO members (
    auth_user_id, full_name, nik, email, phone,
    date_of_birth, gender, address
) VALUES (
    'auth-user-uuid',
    'John Doe',
    '1234567890123456',
    'john@example.com',
    '081234567890',
    '1990-01-01',
    'male',
    'Jl. Contoh No. 123, Ponorogo'
);
-- Member number akan auto-generate: SIN-2024-000001
```

### 2. Create Savings Account
```sql
INSERT INTO savings_accounts (member_id, savings_type_id)
SELECT
    m.id,
    st.id
FROM members m, savings_types st
WHERE m.member_number = 'SIN-2024-000001'
AND st.code = 'SP'; -- Simpanan Pokok
-- Account number akan auto-generate: SA-2024-000001
```

### 3. Process Transaction
```sql
INSERT INTO transactions (
    member_id, savings_account_id, transaction_type_id,
    amount, description, payment_method, payment_status
) VALUES (
    (SELECT id FROM members WHERE member_number = 'SIN-2024-000001'),
    (SELECT id FROM savings_accounts WHERE account_number = 'SA-2024-000001'),
    (SELECT id FROM transaction_types WHERE code = 'SP_DEPOSIT'),
    80000,
    'Setoran Simpanan Pokok',
    'bank_transfer',
    'completed'
);
-- Balance akan otomatis terupdate via trigger
```

### 4. Award Points
```sql
INSERT INTO point_transactions (
    member_id, transaction_type, points_amount,
    balance_before, balance_after, source_type, description
) VALUES (
    (SELECT id FROM members WHERE member_number = 'SIN-2024-000001'),
    'earned',
    1000,
    0,
    1000,
    'referral',
    'Bonus referral member baru'
);
-- Member points balance akan otomatis terupdate
```

## 📊 Analytics Queries

### Monthly Growth Report
```sql
SELECT
    month,
    new_members,
    cumulative_members
FROM monthly_member_growth
ORDER BY month DESC;
```

### Revenue Summary
```sql
SELECT
    month,
    category,
    total_amount
FROM monthly_financial_summary
WHERE month >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '12 months')
ORDER BY month DESC, total_amount DESC;
```

### Top Performing Products
```sql
SELECT
    name,
    category_name,
    total_quantity_sold,
    total_revenue
FROM product_performance
WHERE total_revenue > 0
ORDER BY total_revenue DESC
LIMIT 10;
```

### Executive Dashboard
```sql
SELECT * FROM executive_dashboard;
```

## 🔄 Integration Points

### 1. Bank Sampah App Integration
- Read-only sync via `bank_sampah_member_summary`
- API endpoints untuk update data dari Bank Sampah App
- Real-time points sync untuk environmental activities

### 2. Payment Gateway (Midtrans)
- `transactions.payment_reference` untuk tracking
- `orders.payment_reference` untuk e-commerce
- Webhook handling untuk status updates

### 3. WhatsApp Notifications (Fonnte)
- `notifications` table untuk tracking
- Template-based messaging via `notification_templates`

## 📝 Maintenance

### Regular Tasks
```sql
-- Clean up expired points
DELETE FROM point_transactions
WHERE expires_at < CURRENT_DATE - INTERVAL '30 days';

-- Archive old transactions (older than 2 years)
-- Implement archival strategy based on requirements

-- Update leaderboard rankings
-- Run weekly via cron job

-- Generate monthly reports
-- Automated via scheduled functions
```

### Backup Strategy
```bash
# Daily automated backups via Supabase
# Additional manual backups before major updates
supabase db dump > backup_$(date +%Y%m%d).sql
```

## 🚨 Troubleshooting

### Common Issues

1. **RLS Permission Denied**
   - Check if user is authenticated
   - Verify member record exists in `members` table
   - Check admin_users table for admin access

2. **Auto-generation Not Working**
   - Verify triggers are enabled
   - Check function permissions
   - Ensure proper UUID extension

3. **Balance Mismatch**
   - Check transaction triggers
   - Verify transaction_types categories
   - Recalculate balances if needed

### Support Queries

```sql
-- Check member account status
SELECT m.*, sa.balance
FROM members m
LEFT JOIN savings_accounts sa ON m.id = sa.member_id
WHERE m.member_number = 'SIN-2024-000001';

-- Verify transaction flow
SELECT t.*, tt.category, tt.name
FROM transactions t
JOIN transaction_types tt ON t.transaction_type_id = tt.id
WHERE t.member_id = (SELECT id FROM members WHERE member_number = 'SIN-2024-000001')
ORDER BY t.created_at DESC;

-- Check points balance
SELECT mp.*,
       (SELECT SUM(points_amount) FROM point_transactions pt
        WHERE pt.member_id = mp.member_id AND transaction_type = 'earned') as total_earned,
       (SELECT SUM(points_amount) FROM point_transactions pt
        WHERE pt.member_id = mp.member_id AND transaction_type = 'redeemed') as total_redeemed
FROM member_points mp
WHERE member_id = (SELECT id FROM members WHERE member_number = 'SIN-2024-000001');
```

## 📖 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Next.js Supabase Integration](https://supabase.com/docs/guides/getting-started/tutorials/with-nextjs)

---

**Koperasi Sinoman SuperApp Database Schema v1.0**
*Generated for supporting 60,000+ members digital cooperative ecosystem*
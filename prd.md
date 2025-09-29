# **Product Requirements Document (PRD)**

# **KOPERASI SINOMAN** 

**Platform Digital Koperasi Sinoman Ponorogo (Bahasa Indonesia)**

## **1. EXECUTIVE SUMMARY**

### **Visi Produk**

Membangun ekosistem digital terintegrasi untuk 60.000+ anggota koperasi
Ponorogo dengan prinsip **\"Sehat Bareng, Kaya Bareng, Bareng
Sinoman\"**

### **Objektif Utama**

1.  **Digitalisasi Koperasi** - Platform modern yang transparan

2.  **Peningkatan Kesehatan** - Program Fit Challenge terstruktur

3.  **Pemberdayaan Ekonomi** - Marketplace & unit usaha terintegrasi

4.  **Transparansi Total** - Real-time reporting semua transaksi

5.  **Skalabilitas** - Arsitektur microservices untuk 100.000 anggota

### **Success Metrics (Year 1)**

- 10.000 anggota aktif

- Rp 500 juta transaksi bulanan

- 60% Monthly Active Users

- 10 unit Bank Sampah operasional

- NPS Score \> 70

## **2. ARSITEKTUR SISTEM**

### **2.1 Technology Stack**

Main SuperApp:

Frontend:

\- Next.js 14 + TypeScript + Tailwind CSS

\- PWA (Phase 1) → React Native (Phase 2)

Backend:

\- Supabase (PostgreSQL + Auth)

\- Next.js API Routes

\- Redis Cache

Integration:

\- Midtrans Payment Gateway

\- Fonnte WhatsApp API

\- Cloudinary Storage

Connected Systems:

\- Bank Sampah Management System (Separate App)

\- Point of Sale (POS) untuk Toko Koperasi

\- Inventory Management System

Infrastructure:

\- Vercel Hosting

\- Sentry Monitoring

\- Shared Authentication Service

### **2.2 System Architecture**

┌──────────────────────────────────────────┐

│ SINOMAN ECOSYSTEM │

├──────────────────────────────────────────┤

│ │

│ ┌─────────────┐ ┌─────────────┐ │

│ │ SuperApp │ │ Bank Sampah │ │

│ │ (Main) │◄──►│ Mgmt App │ │

│ └─────────────┘ └─────────────┘ │

│ ▲ ▲ │

│ └────────┬──────────┘ │

│ ▼ │

│ ┌─────────────────┐ │

│ │ Shared Services │ │

│ │ - Auth (SSO) │ │

│ │ - Points API │ │

│ │ - Reports API │ │

│ └─────────────────┘ │

│ ▼ │

│ ┌─────────────────┐ │

│ │ Central Database│ │

│ │ (Supabase) │ │

│ └─────────────────┘ │

└──────────────────────────────────────────┘

## **3. MODUL UTAMA SUPERAPP**

### **3.1 Membership & Authentication**

**Features:**

- Multi-step registration dengan KYC

- Digital member card dengan QR Code

- Biometric & 2FA authentication

- Referral system

- Single Sign-On untuk semua layanan Sinoman

**Core Tables:**

- members - Data anggota lengkap

- member_documents - KYC documents

- referrals - Tracking referral

### **3.2 Savings Management (Simpanan)**

**Jenis Simpanan:**

1.  **Simpanan Pokok** (Rp 80.000)

    - Wajib sekali seumur hidup saat daftar

    - Tidak dapat ditarik selama menjadi anggota

    - Modal dasar koperasi

2.  **Simpanan Wajib** (Rp 10.000/bulan)

    - Setoran rutin bulanan yang diwajibkan

    - Tidak dapat ditarik selama menjadi anggota

    - Basis perhitungan SHU

3.  **Simpanan Sukarela\**

    - Fleksibel setor/tarik kapan saja

    - Mendapat bunga/bagi hasil

    - Minimum saldo Rp 10.000

4.  **Simpanan Berjangka** (Optional)

    - Tenor 3/6/12 bulan

    - Bunga kompetitif

    - Penalty early withdrawal

**Features:**

- Virtual Account untuk setiap anggota

- Auto-debit reminder

- Real-time balance

- Transaction history

- SHU calculation & distribution

### **3.3 Sinoman Fit Challenge**

**Program Structure:**

- Durasi: 8 minggu

- Batch: 100 peserta maksimal

- Biaya: Rp 600.000 (termasuk keanggotaan)

- Lokasi: Multiple gym locations

**Payment Breakdown:**

- Rp 400.000 → Program fee (trainer, venue, hadiah)

- Rp 80.000 → Simpanan Pokok

- Rp 120.000 → Simpanan Wajib (1 tahun)

**Features:**

- Initial & weekly body measurements

- Progress photo tracking

- Workout check-ins

- Nutrition plans & meal tracking

- Leaderboard & gamification

- Community support group

- Completion certificate

### **3.4 E-Commerce & Marketplace**

**Product Categories:**

- **Protein Package** - Telur, susu, daging (member price -20%)

- **Fresh Produce** - Sayuran organik dari petani mitra

- **UMKM Products** - Produk lokal Ponorogo

- **Koperasi Store** - Sembako dengan harga khusus

**Features:**

- Member vs public pricing

- Bulk order discount

- Pre-order system

- Delivery scheduling

- Seller dashboard untuk UMKM

- Inventory tracking

**Revenue Model:**

- Commission 3-5% dari non-koperasi products

- Direct margin 10-15% untuk produk koperasi

### **3.5 Bank Sampah Integration Module**

**Note:** Bank Sampah memiliki aplikasi operasional terpisah, SuperApp
hanya menampilkan:

**Member View Features:**

- Dashboard kontribusi sampah pribadi

- Points/rewards balance

- Environmental impact metrics

- Schedule pickup request

- Nearest bank sampah location

- Investment tracking (untuk investor)

**Data Integration:**

- Real-time sync points dari Bank Sampah App

- Aggregated environmental reports

- Financial performance per unit

- ROI tracking untuk investor

**Tidak Termasuk dalam SuperApp:**

- Weighing system

- Waste classification

- Maggot farming management

- B2B material sales

- Operational management

### **3.6 Investment & Monitoring Dashboard**

**For Regular Members:**

- SHU projection & history

- Savings growth chart

- Transaction summary

- Program participation

**For Investor Members:**

- Unit usaha performance (Bank Sampah, Toko, etc)

- ROI metrics per investment

- Monthly financial reports

- Dividend distribution tracking

### **3.7 Admin Dashboard**

**Modules:**

- Member management & KYC verification

- Savings administration

- Financial reporting & SHU calculation

- Program management (Fit Challenge)

- Integration monitoring

- System configuration

## **4. UNIT USAHA & INTEGRASI**

### **4.1 Unit Usaha Koperasi**

Internal Units (Managed by Koperasi):

1\. Toko Koperasi:

\- Physical store + online

\- Integrated inventory

\- Member pricing system

2\. Fit Challenge Program:

\- Multiple locations

\- Trainer management

\- Equipment rental

3\. Simpan Pinjam:

\- Productive loans only

\- Max 3x savings balance

\- Competitive interest

External Units (Separate Management):

1\. Bank Sampah Network:

\- Independent operations

\- Data integration via API

\- Franchise model

2\. Maggot Farming:

\- Partnership model

\- Supply chain integration

3\. UMKM Partners:

\- Marketplace sellers

\- Commission based

### **4.2 Integration Architecture**

Data Flow:

Bank Sampah App → API Gateway → SuperApp Dashboard

POS System → Inventory API → E-Commerce Module

Partner Systems → Webhook → Notification Service

Authentication:

Single Sign-On (SSO) across all Sinoman services

Role-based access (Member, Admin, Partner, Investor)

Payment Flow:

Centralized payment gateway (Midtrans)

Points wallet (cross-platform)

Settlement automation

## **5. REVENUE MODEL & PROJECTIONS**

### **5.1 Revenue Streams (Year 1 - 10K Members)**

  ---------------------------------------------------------------------------
  **Source**            **Amount/Year**   **%          **Notes**
                                          Revenue**    
  --------------------- ----------------- ------------ ----------------------
  Simpanan Pokok        Rp 800 Juta       15.4%        One-time, new members

  Simpanan Wajib        Rp 1.2 Miliar     23.1%        Monthly recurring

  Simpanan Sukarela     Rp 1.8 Miliar     34.6%        Est. 30% participation

  Fit Challenge         Rp 480 Juta       9.2%         1,200 participants

  E-Commerce            Rp 360 Juta       6.9%         Commission + margin

  Bank Sampah Network   Rp 300 Juta       5.8%         10 units franchise fee

  Loan Interest         Rp 180 Juta       3.5%         Productive loans only

  Others                Rp 80 Juta        1.5%         Admin fees, etc

  **TOTAL**             **Rp 5.2 Miliar** **100%**     
  ---------------------------------------------------------------------------

### **5.2 Operating Expenses**

  ------------------------------------------------------------------------
  **Category**                      **Amount/Year**      **% Revenue**
  --------------------------------- -------------------- -----------------
  Technology Infrastructure         Rp 120 Juta          2.3%

  Human Resources                   Rp 480 Juta          9.2%

  Program Operations                Rp 600 Juta          11.5%

  Marketing                         Rp 150 Juta          2.9%

  Bank Sampah Setup Fund            Rp 500 Juta          9.6%

  Admin & Others                    Rp 200 Juta          3.8%

  **TOTAL OPEX**                    **Rp 2.05 Miliar**   **39.4%**
  ------------------------------------------------------------------------

### **5.3 Financial Summary**

Year 1 Projection (10K Members):

Gross Revenue: Rp 5.2 Miliar

Operating Cost: Rp 2.05 Miliar

EBITDA: Rp 3.15 Miliar (60.6% margin)

SHU Distribution: Rp 400 Juta

Reinvestment: Rp 1.5 Miliar

Net Reserve: Rp 1.25 Miliar

5-Year Projection:

Members: 50,000

Revenue: Rp 30 Miliar/year

Bank Sampah Units: 50 locations

ROI: 340%

## **6. IMPLEMENTATION ROADMAP**

### **Phase 1: Core Platform (Week 1-8)**

**Target: 1,000 members**

- ✅ SuperApp MVP (auth, savings, dashboard)

- ✅ Payment gateway integration

- ✅ Basic admin panel

- ✅ Fit Challenge module

- ✅ WhatsApp notifications

### **Phase 2: Commerce & Integration (Month 3-4)**

**Target: 5,000 members**

- ✅ E-Commerce marketplace

- ✅ Bank Sampah API integration

- ✅ Investment dashboard

- ✅ Advanced reporting

- ✅ Referral program

### **Phase 3: Ecosystem Expansion (Month 5-6)**

**Target: 10,000 members**

- ✅ Mobile native apps

- ✅ 10 Bank Sampah units operational

- ✅ POS system integration

- ✅ B2B marketplace

- ✅ Loan management system

### **Phase 4: Scale & Optimize (Month 7-12)**

- ✅ AI/ML for credit scoring

- ✅ Automated operations

- ✅ Regional expansion ready

- ✅ White-label capabilities

- ✅ Advanced analytics

## **7. CRITICAL SUCCESS FACTORS**

### **Technical Requirements**

- **Performance**: \<2s load time, 99.9% uptime

- **Scalability**: Auto-scaling to 100K concurrent users

- **Security**: End-to-end encryption, 2FA, audit trails

- **Integration**: RESTful APIs, webhooks, real-time sync

- **Compliance**: Kemenkop UKM, OJK, data protection

### **Business Requirements**

- **User Adoption**: 60% MAU target

- **Financial Health**: 60%+ gross margin

- **Unit Economics**: CAC \< Rp 50,000, LTV \> Rp 500,000

- **Ecosystem Growth**: 10 Bank Sampah/year

- **Impact Metrics**: 80% health improvement, 100 ton waste/year

### **Risk Mitigation**

  -------------------------------------------------------------------------
  **Risk**              **Impact**   **Mitigation Strategy**
  --------------------- ------------ --------------------------------------
  Low adoption          High         Free trial, education, incentives

  Technical failure     High         Redundancy, monitoring, SLA

  Regulatory change     Medium       Legal compliance, buffer fund

  Competition           Medium       Unique value prop, fast execution

  Partner dependency    Low          Multiple partners, in-house capability
  -------------------------------------------------------------------------

## **8. UNIQUE VALUE PROPOSITION**

### **For Members**

✅ **All-in-One Platform** - Savings, shopping, health in one app ✅
**Transparent Finance** - Real-time tracking, clear SHU calculation ✅
**Member Benefits** - Cheaper prices, exclusive programs ✅
**Environmental Impact** - Contribute via Bank Sampah network ✅
**Investment Opportunity** - Participate in unit usaha growth

### **Competitive Advantages**

1.  **Integrated Ecosystem** - Not just savings, but complete lifestyle

2.  **Community-Driven** - Gotong royong spirit digitalized

3.  **Multi-Revenue Streams** - Sustainable business model

4.  **Scalable Architecture** - Microservices for easy expansion

5.  **Local Focus** - Deep understanding of Ponorogo needs

## **CONCLUSION**

SuperApp Sinoman transforms traditional cooperative into a digital
ecosystem with multiple integrated business units. The platform focuses
on core member services while seamlessly integrating with specialized
systems like Bank Sampah Management App, creating a comprehensive yet
modular architecture.

**Key Differentiator**: Hybrid approach combining centralized member
services with decentralized operational units, enabling both efficiency
and scalability.

**Next Steps:**

1.  Complete SuperApp MVP (8 weeks)

2.  Deploy Bank Sampah pilot unit with separate app

3.  Beta test with 100 founding members

4.  Iterate based on feedback

5.  Scale to 10,000 members and 10 Bank Sampah units in Year 1

**\"Sehat Bareng, Kaya Bareng, Bareng Sinoman\"**

*Version: 1.0\*
*Date: September 2025\*
*Prepared by: Koperasi Sinoman Technology Team*

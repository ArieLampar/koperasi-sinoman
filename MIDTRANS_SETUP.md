# Midtrans Payment Integration Setup

This guide explains how to set up Midtrans payment integration for the Koperasi Sinoman marketplace checkout process.

## Overview

The Midtrans integration enables secure payment processing for marketplace orders with the following features:

- **Multiple Payment Methods**: Credit card, bank transfer, e-wallets (GoPay, OVO, DANA, ShopeePay), and convenience store payments
- **Secure Payment Flow**: Server-side token generation and signature verification
- **Automatic Status Updates**: Real-time payment status updates via webhooks
- **Stock Management**: Automatic stock reduction on successful payments and restoration on failed payments
- **Order Tracking**: Complete order lifecycle management with payment integration

## Prerequisites

1. **Midtrans Account**: Register at [https://dashboard.midtrans.com/](https://dashboard.midtrans.com/)
2. **Database Setup**: Ensure marketplace tables are created (see migrations below)
3. **Environment Variables**: Configure Midtrans credentials

## Setup Instructions

### 1. Create Midtrans Account

1. Visit [Midtrans Dashboard](https://dashboard.midtrans.com/)
2. Register for a new account
3. Complete merchant verification
4. Access your credentials:
   - **Sandbox**: For development and testing
   - **Production**: For live payments

### 2. Get API Credentials

From your Midtrans dashboard:

#### Sandbox Credentials (Development)
```
Server Key: SB-Mid-server-xxxxxxxxxx
Client Key: SB-Mid-client-xxxxxxxxxx
```

#### Production Credentials (Live)
```
Server Key: Mid-server-xxxxxxxxxx
Client Key: Mid-client-xxxxxxxxxx
```

### 3. Configure Environment Variables

Create `.env.local` in your superapp directory:

```bash
# Copy from .env.example
cp apps/superapp/.env.example apps/superapp/.env.local
```

Update the Midtrans configuration:

```env
# ==============================================
# PAYMENT GATEWAY (Required for checkout)
# ==============================================
MIDTRANS_SERVER_KEY=SB-Mid-server-your-actual-sandbox-server-key
MIDTRANS_CLIENT_KEY=SB-Mid-client-your-actual-sandbox-client-key
MIDTRANS_IS_PRODUCTION=false

# Other required variables
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

### 4. Database Migration

Run the marketplace database migrations:

```bash
# Navigate to database package
cd packages/database

# Run migrations (adjust based on your setup)
pnpm run migrate

# Or apply manually:
# 1. Apply 002_marketplace_tables.sql
# 2. Apply 003_transaction_functions.sql
```

#### Key Tables Created:
- `marketplace_orders` - Order management with Midtrans integration fields
- `marketplace_order_items` - Order line items
- `marketplace_products` - Product catalog with stock management
- `marketplace_payment_logs` - Payment event tracking
- `marketplace_cart` - Persistent cart storage

### 5. Webhook Configuration

Configure Midtrans webhook in your dashboard:

1. Go to **Settings > Configuration** in Midtrans Dashboard
2. Set **Payment Notification URL**:
   ```
   https://yourdomain.com/api/marketplace/payment/midtrans/webhook
   ```
3. For development, use ngrok or similar:
   ```
   https://your-ngrok-url.ngrok.io/api/marketplace/payment/midtrans/webhook
   ```

## API Endpoints

The integration provides these endpoints:

### 1. Checkout API
**POST** `/api/marketplace/checkout`

Creates an order and generates payment token.

```typescript
interface CheckoutRequest {
  items: CheckoutItem[]
  shipping_address: ShippingAddress
  payment_method: string
  notes?: string
  voucher_code?: string
  use_member_discount?: boolean
}
```

### 2. Payment Token API
**POST** `/api/marketplace/payment/midtrans/token`

Generates Midtrans payment token for existing order.

### 3. Webhook API
**POST** `/api/marketplace/payment/midtrans/webhook`

Receives payment status updates from Midtrans.

## Payment Flow

1. **Checkout**: User initiates checkout with cart items
2. **Order Creation**: System creates order and reserves stock
3. **Token Generation**: Midtrans payment token is generated
4. **Payment Process**: User completes payment via Midtrans
5. **Webhook Notification**: Midtrans sends status update
6. **Order Update**: System updates order status and manages stock
7. **Confirmation**: User receives confirmation

## Testing

### Test Cards (Sandbox)

```
Success Payment:
Card Number: 4811 1111 1111 1114
Expiry: 01/25
CVV: 123

Failed Payment:
Card Number: 4911 1111 1111 1113
Expiry: 01/25
CVV: 123
```

### Test Process

1. **Start Development Server**:
   ```bash
   cd apps/superapp
   pnpm dev
   ```

2. **Test Checkout Flow**:
   - Add products to cart
   - Proceed to checkout
   - Complete shipping information
   - Choose payment method
   - Complete payment with test card

3. **Verify Webhook**:
   - Check webhook endpoint receives notifications
   - Verify order status updates correctly
   - Check stock adjustments

## Troubleshooting

### Common Issues

1. **"Payment token creation failed"**
   - Check Midtrans credentials in environment variables
   - Verify API key format (SB-Mid-server-xxx for sandbox)
   - Ensure internet connectivity

2. **"Order not found"**
   - Verify database migrations are applied
   - Check order creation in checkout process
   - Verify user authentication

3. **"Webhook signature invalid"**
   - Check webhook URL configuration in Midtrans dashboard
   - Verify server key matches between env and dashboard
   - Check webhook endpoint accessibility

4. **"Insufficient stock"**
   - Verify product stock in database
   - Check stock reduction functions
   - Ensure products are marked as 'active'

### Debug Mode

Enable debug logging by adding to environment:

```env
DEBUG=midtrans*
NODE_ENV=development
```

### Database Checks

Verify marketplace tables exist:

```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE 'marketplace_%';

-- Check order structure
\d marketplace_orders

-- Check recent orders
SELECT order_number, status, payment_status, total_amount
FROM marketplace_orders
ORDER BY created_at DESC
LIMIT 5;
```

## Security Considerations

1. **API Keys**: Never expose server keys in client-side code
2. **Webhook Verification**: Always verify webhook signatures
3. **HTTPS**: Use HTTPS in production for webhook endpoints
4. **Environment Variables**: Keep credentials in secure environment variables
5. **Database Access**: Use Row Level Security (RLS) for data protection

## Production Deployment

### Environment Updates

```env
MIDTRANS_SERVER_KEY=Mid-server-your-production-key
MIDTRANS_CLIENT_KEY=Mid-client-your-production-key
MIDTRANS_IS_PRODUCTION=true
NEXT_PUBLIC_APP_URL=https://your-production-domain.com
```

### Webhook Configuration

Update Midtrans dashboard with production webhook URL:
```
https://your-production-domain.com/api/marketplace/payment/midtrans/webhook
```

### Monitoring

Monitor these metrics:
- Payment success rate
- Webhook delivery success
- Order completion rate
- Stock synchronization accuracy

## Support

For Midtrans-specific issues:
- [Midtrans Documentation](https://docs.midtrans.com/)
- [Midtrans Support](https://support.midtrans.com/)

For integration issues:
- Check application logs
- Verify database state
- Test webhook connectivity
- Review API response codes
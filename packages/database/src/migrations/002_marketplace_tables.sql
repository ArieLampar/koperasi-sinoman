-- Migration: Marketplace Tables
-- Created: 2024-09-30T10:00:00.000Z
-- Description: Create marketplace tables with Midtrans payment integration support

-- =====================================================
-- UP MIGRATION
-- =====================================================

-- =====================================================
-- ENUMS
-- =====================================================

-- Product status
CREATE TYPE product_status AS ENUM ('draft', 'active', 'inactive', 'deleted');

-- Product condition
CREATE TYPE product_condition AS ENUM ('new', 'used', 'refurbished');

-- Order status
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned');

-- Payment status
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'expired', 'refunded');

-- Store status
CREATE TYPE store_status AS ENUM ('pending', 'active', 'suspended', 'closed');

-- =====================================================
-- MARKETPLACE TABLES
-- =====================================================

-- Categories table
CREATE TABLE marketplace_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    image_url TEXT,
    parent_id UUID REFERENCES marketplace_categories(id) ON DELETE SET NULL,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Stores table
CREATE TABLE marketplace_stores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    logo_url TEXT,
    banner_url TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    province VARCHAR(100),
    postal_code VARCHAR(10),
    status store_status NOT NULL DEFAULT 'pending',
    is_verified BOOLEAN DEFAULT false,
    verified_at TIMESTAMP WITH TIME ZONE,
    verified_by UUID REFERENCES members(id),
    total_products INTEGER DEFAULT 0,
    total_sales INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0.0,
    review_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Products table
CREATE TABLE marketplace_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES marketplace_stores(id) ON DELETE CASCADE,
    category_id UUID REFERENCES marketplace_categories(id) ON DELETE SET NULL,
    sku VARCHAR(100),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    description TEXT,
    short_description TEXT,
    price BIGINT NOT NULL, -- in cents/rupiah
    member_price BIGINT, -- special price for members
    compare_price BIGINT, -- original price for discounts
    cost_price BIGINT, -- cost for profit calculation
    weight DECIMAL(10,2) DEFAULT 0, -- in grams
    dimensions JSONB, -- {length, width, height} in cm
    images JSONB DEFAULT '[]', -- array of image URLs
    tags TEXT[],
    status product_status NOT NULL DEFAULT 'draft',
    condition product_condition NOT NULL DEFAULT 'new',
    stock INTEGER NOT NULL DEFAULT 0,
    min_order INTEGER DEFAULT 1,
    max_order INTEGER,
    is_featured BOOLEAN DEFAULT false,
    is_digital BOOLEAN DEFAULT false,
    requires_shipping BOOLEAN DEFAULT true,
    meta_title VARCHAR(255),
    meta_description TEXT,
    view_count INTEGER DEFAULT 0,
    sold_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    UNIQUE(store_id, slug)
);

-- Orders table
CREATE TABLE marketplace_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    status order_status NOT NULL DEFAULT 'pending',
    payment_status payment_status NOT NULL DEFAULT 'pending',
    payment_method VARCHAR(50),

    -- Pricing breakdown
    subtotal BIGINT NOT NULL DEFAULT 0,
    discount_amount BIGINT DEFAULT 0,
    shipping_cost BIGINT DEFAULT 0,
    service_fee BIGINT DEFAULT 0,
    payment_fee BIGINT DEFAULT 0,
    total_amount BIGINT NOT NULL,

    -- Shipping information
    shipping_address JSONB NOT NULL,
    tracking_number VARCHAR(100),
    shipped_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,

    -- Payment information
    voucher_code VARCHAR(50),
    notes TEXT,

    -- Midtrans integration fields
    midtrans_token TEXT,
    midtrans_redirect_url TEXT,
    midtrans_transaction_id VARCHAR(255),
    midtrans_payment_type VARCHAR(50),
    midtrans_transaction_time TIMESTAMP WITH TIME ZONE,
    midtrans_settlement_time TIMESTAMP WITH TIME ZONE,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Order items table
CREATE TABLE marketplace_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES marketplace_orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES marketplace_products(id) ON DELETE RESTRICT,
    store_id UUID NOT NULL REFERENCES marketplace_stores(id) ON DELETE RESTRICT,
    product_name VARCHAR(255) NOT NULL,
    product_sku VARCHAR(100),
    price BIGINT NOT NULL,
    quantity INTEGER NOT NULL,
    subtotal BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Cart table for persistent cart storage
CREATE TABLE marketplace_cart (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES marketplace_products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    UNIQUE(user_id, product_id)
);

-- Payment logs table for tracking all payment events
CREATE TABLE marketplace_payment_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES marketplace_orders(id) ON DELETE CASCADE,
    payment_method VARCHAR(50) NOT NULL,
    transaction_id VARCHAR(255),
    status VARCHAR(50) NOT NULL,
    amount BIGINT NOT NULL,
    gateway_response JSONB,
    raw_response JSONB,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Product reviews table
CREATE TABLE marketplace_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES marketplace_products(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    order_id UUID REFERENCES marketplace_orders(id) ON DELETE SET NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255),
    content TEXT,
    images JSONB DEFAULT '[]',
    is_verified BOOLEAN DEFAULT false,
    is_anonymous BOOLEAN DEFAULT false,
    helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    UNIQUE(product_id, user_id, order_id)
);

-- Wishlist table
CREATE TABLE marketplace_wishlist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES marketplace_products(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    UNIQUE(user_id, product_id)
);

-- Vouchers table
CREATE TABLE marketplace_vouchers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(20) NOT NULL, -- 'percentage', 'fixed'
    value DECIMAL(10,2) NOT NULL,
    min_order_amount BIGINT DEFAULT 0,
    max_discount_amount BIGINT,
    usage_limit INTEGER,
    used_count INTEGER DEFAULT 0,
    valid_from TIMESTAMP WITH TIME ZONE NOT NULL,
    valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    applicable_categories UUID[],
    applicable_products UUID[],
    member_types TEXT[], -- ['regular', 'premium', 'investor']
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Categories indexes
CREATE INDEX idx_marketplace_categories_parent_id ON marketplace_categories(parent_id);
CREATE INDEX idx_marketplace_categories_slug ON marketplace_categories(slug);
CREATE INDEX idx_marketplace_categories_active ON marketplace_categories(is_active);

-- Stores indexes
CREATE INDEX idx_marketplace_stores_owner_id ON marketplace_stores(owner_id);
CREATE INDEX idx_marketplace_stores_slug ON marketplace_stores(slug);
CREATE INDEX idx_marketplace_stores_status ON marketplace_stores(status);
CREATE INDEX idx_marketplace_stores_verified ON marketplace_stores(is_verified);

-- Products indexes
CREATE INDEX idx_marketplace_products_store_id ON marketplace_products(store_id);
CREATE INDEX idx_marketplace_products_category_id ON marketplace_products(category_id);
CREATE INDEX idx_marketplace_products_slug ON marketplace_products(slug);
CREATE INDEX idx_marketplace_products_status ON marketplace_products(status);
CREATE INDEX idx_marketplace_products_featured ON marketplace_products(is_featured);
CREATE INDEX idx_marketplace_products_price ON marketplace_products(price);
CREATE INDEX idx_marketplace_products_created_at ON marketplace_products(created_at DESC);

-- Orders indexes
CREATE INDEX idx_marketplace_orders_user_id ON marketplace_orders(user_id);
CREATE INDEX idx_marketplace_orders_order_number ON marketplace_orders(order_number);
CREATE INDEX idx_marketplace_orders_status ON marketplace_orders(status);
CREATE INDEX idx_marketplace_orders_payment_status ON marketplace_orders(payment_status);
CREATE INDEX idx_marketplace_orders_created_at ON marketplace_orders(created_at DESC);
CREATE INDEX idx_marketplace_orders_midtrans_transaction_id ON marketplace_orders(midtrans_transaction_id);

-- Order items indexes
CREATE INDEX idx_marketplace_order_items_order_id ON marketplace_order_items(order_id);
CREATE INDEX idx_marketplace_order_items_product_id ON marketplace_order_items(product_id);
CREATE INDEX idx_marketplace_order_items_store_id ON marketplace_order_items(store_id);

-- Cart indexes
CREATE INDEX idx_marketplace_cart_user_id ON marketplace_cart(user_id);
CREATE INDEX idx_marketplace_cart_product_id ON marketplace_cart(product_id);

-- Payment logs indexes
CREATE INDEX idx_marketplace_payment_logs_order_id ON marketplace_payment_logs(order_id);
CREATE INDEX idx_marketplace_payment_logs_transaction_id ON marketplace_payment_logs(transaction_id);
CREATE INDEX idx_marketplace_payment_logs_created_at ON marketplace_payment_logs(created_at DESC);

-- Reviews indexes
CREATE INDEX idx_marketplace_reviews_product_id ON marketplace_reviews(product_id);
CREATE INDEX idx_marketplace_reviews_user_id ON marketplace_reviews(user_id);
CREATE INDEX idx_marketplace_reviews_rating ON marketplace_reviews(rating);
CREATE INDEX idx_marketplace_reviews_verified ON marketplace_reviews(is_verified);

-- Wishlist indexes
CREATE INDEX idx_marketplace_wishlist_user_id ON marketplace_wishlist(user_id);
CREATE INDEX idx_marketplace_wishlist_product_id ON marketplace_wishlist(product_id);

-- Vouchers indexes
CREATE INDEX idx_marketplace_vouchers_code ON marketplace_vouchers(code);
CREATE INDEX idx_marketplace_vouchers_active ON marketplace_vouchers(is_active);
CREATE INDEX idx_marketplace_vouchers_valid_dates ON marketplace_vouchers(valid_from, valid_until);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to update product stock
CREATE OR REPLACE FUNCTION decrease_product_stock(
    product_id UUID,
    quantity INTEGER
) RETURNS VOID AS $$
BEGIN
    UPDATE marketplace_products
    SET stock = stock - quantity,
        updated_at = NOW()
    WHERE id = product_id
    AND stock >= quantity;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Insufficient stock or product not found';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to increase product stock
CREATE OR REPLACE FUNCTION increase_product_stock(
    product_id UUID,
    quantity INTEGER
) RETURNS VOID AS $$
BEGIN
    UPDATE marketplace_products
    SET stock = stock + quantity,
        updated_at = NOW()
    WHERE id = product_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Product not found';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate product rating
CREATE OR REPLACE FUNCTION update_product_rating(product_id UUID)
RETURNS VOID AS $$
DECLARE
    avg_rating DECIMAL(3,2);
    review_count INTEGER;
BEGIN
    SELECT AVG(rating), COUNT(*)
    INTO avg_rating, review_count
    FROM marketplace_reviews
    WHERE marketplace_reviews.product_id = update_product_rating.product_id
    AND is_verified = true;

    UPDATE marketplace_products
    SET rating = COALESCE(avg_rating, 0),
        review_count = review_count,
        updated_at = NOW()
    WHERE id = update_product_rating.product_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update store statistics
CREATE OR REPLACE FUNCTION update_store_stats(store_id UUID)
RETURNS VOID AS $$
DECLARE
    product_count INTEGER;
    total_sales INTEGER;
    avg_rating DECIMAL(3,2);
    review_count INTEGER;
BEGIN
    -- Count active products
    SELECT COUNT(*)
    INTO product_count
    FROM marketplace_products
    WHERE marketplace_products.store_id = update_store_stats.store_id
    AND status = 'active';

    -- Count total sales
    SELECT COUNT(*)
    INTO total_sales
    FROM marketplace_order_items oi
    JOIN marketplace_orders o ON oi.order_id = o.id
    WHERE oi.store_id = update_store_stats.store_id
    AND o.status = 'delivered';

    -- Calculate average rating
    SELECT AVG(r.rating), COUNT(r.rating)
    INTO avg_rating, review_count
    FROM marketplace_reviews r
    JOIN marketplace_products p ON r.product_id = p.id
    WHERE p.store_id = update_store_stats.store_id
    AND r.is_verified = true;

    UPDATE marketplace_stores
    SET total_products = product_count,
        total_sales = total_sales,
        rating = COALESCE(avg_rating, 0),
        review_count = review_count,
        updated_at = NOW()
    WHERE id = update_store_stats.store_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply timestamp triggers
CREATE TRIGGER update_marketplace_categories_updated_at BEFORE UPDATE ON marketplace_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_marketplace_stores_updated_at BEFORE UPDATE ON marketplace_stores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_marketplace_products_updated_at BEFORE UPDATE ON marketplace_products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_marketplace_orders_updated_at BEFORE UPDATE ON marketplace_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_marketplace_cart_updated_at BEFORE UPDATE ON marketplace_cart FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_marketplace_reviews_updated_at BEFORE UPDATE ON marketplace_reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_marketplace_vouchers_updated_at BEFORE UPDATE ON marketplace_vouchers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update product rating when review is added/updated
CREATE OR REPLACE FUNCTION trigger_update_product_rating()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        PERFORM update_product_rating(NEW.product_id);
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM update_product_rating(OLD.product_id);
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER marketplace_reviews_rating_trigger
    AFTER INSERT OR UPDATE OR DELETE ON marketplace_reviews
    FOR EACH ROW EXECUTE FUNCTION trigger_update_product_rating();

-- Trigger to update store stats when products or orders change
CREATE OR REPLACE FUNCTION trigger_update_store_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        PERFORM update_store_stats(NEW.store_id);
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM update_store_stats(OLD.store_id);
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER marketplace_products_store_stats_trigger
    AFTER INSERT OR UPDATE OR DELETE ON marketplace_products
    FOR EACH ROW EXECUTE FUNCTION trigger_update_store_stats();

CREATE TRIGGER marketplace_order_items_store_stats_trigger
    AFTER INSERT OR UPDATE OR DELETE ON marketplace_order_items
    FOR EACH ROW EXECUTE FUNCTION trigger_update_store_stats();

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE marketplace_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_cart ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_payment_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_vouchers ENABLE ROW LEVEL SECURITY;

-- Categories: Read access for everyone, write access for admins
CREATE POLICY "Categories are viewable by everyone" ON marketplace_categories FOR SELECT USING (true);
CREATE POLICY "Categories are manageable by admins" ON marketplace_categories FOR ALL USING (auth.jwt()->>'role' = 'admin');

-- Stores: Users can manage their own stores, admins can manage all
CREATE POLICY "Users can view active stores" ON marketplace_stores FOR SELECT USING (status = 'active' OR owner_id = auth.uid());
CREATE POLICY "Users can manage their own stores" ON marketplace_stores FOR ALL USING (owner_id = auth.uid());
CREATE POLICY "Admins can manage all stores" ON marketplace_stores FOR ALL USING (auth.jwt()->>'role' = 'admin');

-- Products: Users can manage their store products, everyone can view active products
CREATE POLICY "Users can view active products" ON marketplace_products FOR SELECT USING (
    status = 'active' OR
    store_id IN (SELECT id FROM marketplace_stores WHERE owner_id = auth.uid())
);
CREATE POLICY "Users can manage their store products" ON marketplace_products FOR ALL USING (
    store_id IN (SELECT id FROM marketplace_stores WHERE owner_id = auth.uid())
);
CREATE POLICY "Admins can manage all products" ON marketplace_products FOR ALL USING (auth.jwt()->>'role' = 'admin');

-- Orders: Users can only access their own orders
CREATE POLICY "Users can view their own orders" ON marketplace_orders FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create their own orders" ON marketplace_orders FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their own pending orders" ON marketplace_orders FOR UPDATE USING (user_id = auth.uid() AND status = 'pending');
CREATE POLICY "Admins can manage all orders" ON marketplace_orders FOR ALL USING (auth.jwt()->>'role' = 'admin');

-- Order items: Access through orders
CREATE POLICY "Users can view their order items" ON marketplace_order_items FOR SELECT USING (
    order_id IN (SELECT id FROM marketplace_orders WHERE user_id = auth.uid())
);
CREATE POLICY "Users can create their order items" ON marketplace_order_items FOR INSERT WITH CHECK (
    order_id IN (SELECT id FROM marketplace_orders WHERE user_id = auth.uid())
);
CREATE POLICY "Admins can manage all order items" ON marketplace_order_items FOR ALL USING (auth.jwt()->>'role' = 'admin');

-- Cart: Users can only access their own cart
CREATE POLICY "Users can manage their own cart" ON marketplace_cart FOR ALL USING (user_id = auth.uid());

-- Payment logs: Users can view their own payment logs
CREATE POLICY "Users can view their payment logs" ON marketplace_payment_logs FOR SELECT USING (
    order_id IN (SELECT id FROM marketplace_orders WHERE user_id = auth.uid())
);
CREATE POLICY "System can create payment logs" ON marketplace_payment_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can manage all payment logs" ON marketplace_payment_logs FOR ALL USING (auth.jwt()->>'role' = 'admin');

-- Reviews: Users can manage their own reviews, everyone can view verified reviews
CREATE POLICY "Users can view verified reviews" ON marketplace_reviews FOR SELECT USING (is_verified = true OR user_id = auth.uid());
CREATE POLICY "Users can manage their own reviews" ON marketplace_reviews FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Admins can manage all reviews" ON marketplace_reviews FOR ALL USING (auth.jwt()->>'role' = 'admin');

-- Wishlist: Users can only access their own wishlist
CREATE POLICY "Users can manage their own wishlist" ON marketplace_wishlist FOR ALL USING (user_id = auth.uid());

-- Vouchers: Everyone can view active vouchers, admins can manage
CREATE POLICY "Users can view active vouchers" ON marketplace_vouchers FOR SELECT USING (
    is_active = true AND
    valid_from <= NOW() AND
    valid_until >= NOW()
);
CREATE POLICY "Admins can manage all vouchers" ON marketplace_vouchers FOR ALL USING (auth.jwt()->>'role' = 'admin');

-- =====================================================
-- DOWN MIGRATION (commented out)
-- =====================================================

-- DROP TABLE IF EXISTS marketplace_vouchers CASCADE;
-- DROP TABLE IF EXISTS marketplace_wishlist CASCADE;
-- DROP TABLE IF EXISTS marketplace_reviews CASCADE;
-- DROP TABLE IF EXISTS marketplace_payment_logs CASCADE;
-- DROP TABLE IF EXISTS marketplace_cart CASCADE;
-- DROP TABLE IF EXISTS marketplace_order_items CASCADE;
-- DROP TABLE IF EXISTS marketplace_orders CASCADE;
-- DROP TABLE IF EXISTS marketplace_products CASCADE;
-- DROP TABLE IF EXISTS marketplace_stores CASCADE;
-- DROP TABLE IF EXISTS marketplace_categories CASCADE;

-- DROP TYPE IF EXISTS store_status CASCADE;
-- DROP TYPE IF EXISTS payment_status CASCADE;
-- DROP TYPE IF EXISTS order_status CASCADE;
-- DROP TYPE IF EXISTS product_condition CASCADE;
-- DROP TYPE IF EXISTS product_status CASCADE;
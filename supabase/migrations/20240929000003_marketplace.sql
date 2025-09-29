-- =====================================================
-- MARKETPLACE & E-COMMERCE MIGRATION
-- =====================================================
-- Migration: 20240929000003_marketplace
-- Description: Create marketplace and e-commerce tables

-- Product categories
CREATE TABLE product_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES product_categories(id),
    image_url TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sellers/vendors
CREATE TABLE sellers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID REFERENCES members(id),
    business_name VARCHAR(255) NOT NULL,
    business_type VARCHAR(50) CHECK (business_type IN ('koperasi', 'umkm', 'individual')),
    description TEXT,
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),

    -- Business documents
    business_license TEXT,
    tax_number VARCHAR(50),

    -- Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'rejected')),
    verified_at TIMESTAMP WITH TIME ZONE,

    -- Commission
    commission_rate DECIMAL(5,4) DEFAULT 0.05,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id UUID NOT NULL REFERENCES sellers(id),
    category_id UUID NOT NULL REFERENCES product_categories(id),

    -- Product details
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    short_description TEXT,

    -- Pricing
    price DECIMAL(15,2) NOT NULL,
    member_price DECIMAL(15,2),
    cost_price DECIMAL(15,2),

    -- Inventory
    sku VARCHAR(100),
    stock_quantity INTEGER DEFAULT 0,
    min_stock_level INTEGER DEFAULT 5,
    max_order_quantity INTEGER,

    -- Physical properties
    weight DECIMAL(10,3),
    dimensions JSON,

    -- Product images
    images JSON,

    -- SEO
    meta_title VARCHAR(255),
    meta_description TEXT,

    -- Status & settings
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'inactive', 'discontinued')),
    is_featured BOOLEAN DEFAULT false,
    is_digital BOOLEAN DEFAULT false,
    requires_shipping BOOLEAN DEFAULT true,

    -- Dates
    available_from TIMESTAMP WITH TIME ZONE,
    available_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Product variants
CREATE TABLE product_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    value VARCHAR(100) NOT NULL,
    price_adjustment DECIMAL(15,2) DEFAULT 0,
    stock_quantity INTEGER DEFAULT 0,
    sku VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shopping carts
CREATE TABLE shopping_carts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    session_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cart items
CREATE TABLE cart_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cart_id UUID NOT NULL REFERENCES shopping_carts(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    variant_id UUID REFERENCES product_variants(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price DECIMAL(15,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(cart_id, product_id, variant_id)
);

-- Orders
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID NOT NULL REFERENCES members(id),
    order_number VARCHAR(50) UNIQUE NOT NULL,

    -- Order totals
    subtotal DECIMAL(15,2) NOT NULL,
    shipping_cost DECIMAL(15,2) DEFAULT 0,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) NOT NULL,

    -- Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),

    -- Shipping details
    shipping_address JSON NOT NULL,
    shipping_method VARCHAR(50),
    tracking_number VARCHAR(100),

    -- Payment details
    payment_method VARCHAR(50),
    payment_reference TEXT,
    paid_at TIMESTAMP WITH TIME ZONE,

    -- Dates
    expected_delivery_date DATE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order items
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    variant_id UUID REFERENCES product_variants(id),
    seller_id UUID NOT NULL REFERENCES sellers(id),

    -- Product details at time of order
    product_name VARCHAR(255) NOT NULL,
    product_sku VARCHAR(100),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price DECIMAL(15,2) NOT NULL,
    total_price DECIMAL(15,2) NOT NULL,

    -- Commission
    commission_rate DECIMAL(5,4),
    commission_amount DECIMAL(15,2),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for marketplace
CREATE INDEX idx_products_seller_id ON products(seller_id);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_featured ON products(is_featured);
CREATE INDEX idx_orders_member_id ON orders(member_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);

-- Insert default product categories
INSERT INTO product_categories (name, slug, description) VALUES
('Protein Package', 'protein-package', 'Paket protein harian untuk anggota'),
('Fresh Produce', 'fresh-produce', 'Sayuran dan buah-buahan segar'),
('UMKM Products', 'umkm-products', 'Produk dari UMKM lokal Ponorogo'),
('Koperasi Store', 'koperasi-store', 'Sembako dan kebutuhan sehari-hari'),
('Health & Fitness', 'health-fitness', 'Produk kesehatan dan kebugaran');
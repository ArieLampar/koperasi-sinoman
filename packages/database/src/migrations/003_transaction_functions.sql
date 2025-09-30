-- Migration: Transaction Functions
-- Created: 2024-09-30T10:30:00.000Z
-- Description: Create transaction management functions for marketplace operations

-- =====================================================
-- UP MIGRATION
-- =====================================================

-- =====================================================
-- TRANSACTION MANAGEMENT FUNCTIONS
-- =====================================================

-- Function to begin a transaction (for explicit transaction control)
CREATE OR REPLACE FUNCTION begin_transaction()
RETURNS VOID AS $$
BEGIN
    -- This function is mainly for API consistency
    -- Actual transaction control happens at the application level
    -- But we can use this for logging or validation
    NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to commit a transaction
CREATE OR REPLACE FUNCTION commit_transaction()
RETURNS VOID AS $$
BEGIN
    -- This function is mainly for API consistency
    -- Actual transaction control happens at the application level
    NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to rollback a transaction
CREATE OR REPLACE FUNCTION rollback_transaction()
RETURNS VOID AS $$
BEGIN
    -- This function is mainly for API consistency
    -- Actual transaction control happens at the application level
    NULL;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STOCK MANAGEMENT FUNCTIONS (Enhanced)
-- =====================================================

-- Function to decrease product stock with validation
CREATE OR REPLACE FUNCTION decrease_product_stock(
    product_id UUID,
    quantity INTEGER
) RETURNS TABLE(
    success BOOLEAN,
    message TEXT,
    remaining_stock INTEGER
) AS $$
DECLARE
    current_stock INTEGER;
    new_stock INTEGER;
BEGIN
    -- Get current stock
    SELECT stock INTO current_stock
    FROM marketplace_products
    WHERE id = product_id
    AND status = 'active';

    -- Check if product exists
    IF current_stock IS NULL THEN
        RETURN QUERY SELECT FALSE, 'Product not found or inactive'::TEXT, 0;
        RETURN;
    END IF;

    -- Check if sufficient stock
    IF current_stock < quantity THEN
        RETURN QUERY SELECT FALSE, 'Insufficient stock'::TEXT, current_stock;
        RETURN;
    END IF;

    -- Calculate new stock
    new_stock := current_stock - quantity;

    -- Update stock
    UPDATE marketplace_products
    SET stock = new_stock,
        sold_count = sold_count + quantity,
        updated_at = NOW()
    WHERE id = product_id;

    RETURN QUERY SELECT TRUE, 'Stock updated successfully'::TEXT, new_stock;
END;
$$ LANGUAGE plpgsql;

-- Function to increase product stock
CREATE OR REPLACE FUNCTION increase_product_stock(
    product_id UUID,
    quantity INTEGER
) RETURNS TABLE(
    success BOOLEAN,
    message TEXT,
    new_stock INTEGER
) AS $$
DECLARE
    current_stock INTEGER;
    updated_stock INTEGER;
BEGIN
    -- Get current stock
    SELECT stock INTO current_stock
    FROM marketplace_products
    WHERE id = product_id;

    -- Check if product exists
    IF current_stock IS NULL THEN
        RETURN QUERY SELECT FALSE, 'Product not found'::TEXT, 0;
        RETURN;
    END IF;

    -- Calculate new stock
    updated_stock := current_stock + quantity;

    -- Update stock
    UPDATE marketplace_products
    SET stock = updated_stock,
        sold_count = GREATEST(0, sold_count - quantity),
        updated_at = NOW()
    WHERE id = product_id;

    RETURN QUERY SELECT TRUE, 'Stock updated successfully'::TEXT, updated_stock;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ORDER MANAGEMENT FUNCTIONS
-- =====================================================

-- Function to validate order items and calculate totals
CREATE OR REPLACE FUNCTION validate_order_items(
    items JSONB
) RETURNS TABLE(
    is_valid BOOLEAN,
    error_message TEXT,
    total_amount BIGINT,
    total_weight DECIMAL
) AS $$
DECLARE
    item JSONB;
    product_record RECORD;
    calculated_total BIGINT := 0;
    calculated_weight DECIMAL := 0;
BEGIN
    -- Loop through each item
    FOR item IN SELECT * FROM jsonb_array_elements(items)
    LOOP
        -- Get product details
        SELECT id, name, price, member_price, stock, weight, status
        INTO product_record
        FROM marketplace_products
        WHERE id = (item->>'product_id')::UUID;

        -- Check if product exists and is active
        IF product_record.id IS NULL THEN
            RETURN QUERY SELECT FALSE, ('Product not found: ' || (item->>'product_id'))::TEXT, 0::BIGINT, 0::DECIMAL;
            RETURN;
        END IF;

        IF product_record.status != 'active' THEN
            RETURN QUERY SELECT FALSE, ('Product not active: ' || product_record.name)::TEXT, 0::BIGINT, 0::DECIMAL;
            RETURN;
        END IF;

        -- Check stock availability
        IF product_record.stock < (item->>'quantity')::INTEGER THEN
            RETURN QUERY SELECT FALSE, ('Insufficient stock for: ' || product_record.name)::TEXT, 0::BIGINT, 0::DECIMAL;
            RETURN;
        END IF;

        -- Calculate totals
        calculated_total := calculated_total + (product_record.price * (item->>'quantity')::INTEGER);
        calculated_weight := calculated_weight + (COALESCE(product_record.weight, 500) * (item->>'quantity')::INTEGER);
    END LOOP;

    RETURN QUERY SELECT TRUE, 'Valid'::TEXT, calculated_total, calculated_weight;
END;
$$ LANGUAGE plpgsql;

-- Function to create order with items atomically
CREATE OR REPLACE FUNCTION create_marketplace_order(
    order_data JSONB,
    order_items JSONB
) RETURNS TABLE(
    success BOOLEAN,
    order_id UUID,
    order_number TEXT,
    message TEXT
) AS $$
DECLARE
    new_order_id UUID;
    new_order_number TEXT;
    item JSONB;
    stock_result RECORD;
BEGIN
    -- Generate order ID and number
    new_order_id := uuid_generate_v4();
    new_order_number := order_data->>'order_number';

    -- Create the order
    INSERT INTO marketplace_orders (
        id,
        order_number,
        user_id,
        status,
        payment_status,
        payment_method,
        subtotal,
        discount_amount,
        shipping_cost,
        service_fee,
        payment_fee,
        total_amount,
        shipping_address,
        notes,
        voucher_code
    ) VALUES (
        new_order_id,
        new_order_number,
        (order_data->>'user_id')::UUID,
        COALESCE(order_data->>'status', 'pending'),
        COALESCE(order_data->>'payment_status', 'pending'),
        order_data->>'payment_method',
        (order_data->>'subtotal')::BIGINT,
        COALESCE((order_data->>'discount_amount')::BIGINT, 0),
        COALESCE((order_data->>'shipping_cost')::BIGINT, 0),
        COALESCE((order_data->>'service_fee')::BIGINT, 0),
        COALESCE((order_data->>'payment_fee')::BIGINT, 0),
        (order_data->>'total_amount')::BIGINT,
        order_data->'shipping_address',
        order_data->>'notes',
        order_data->>'voucher_code'
    );

    -- Create order items and update stock
    FOR item IN SELECT * FROM jsonb_array_elements(order_items)
    LOOP
        -- Insert order item
        INSERT INTO marketplace_order_items (
            order_id,
            product_id,
            store_id,
            product_name,
            price,
            quantity,
            subtotal
        ) VALUES (
            new_order_id,
            (item->>'product_id')::UUID,
            (item->>'store_id')::UUID,
            item->>'product_name',
            (item->>'price')::BIGINT,
            (item->>'quantity')::INTEGER,
            (item->>'subtotal')::BIGINT
        );

        -- Decrease stock
        SELECT * INTO stock_result
        FROM decrease_product_stock(
            (item->>'product_id')::UUID,
            (item->>'quantity')::INTEGER
        );

        -- Check if stock update failed
        IF NOT stock_result.success THEN
            RAISE EXCEPTION 'Stock update failed: %', stock_result.message;
        END IF;
    END LOOP;

    RETURN QUERY SELECT TRUE, new_order_id, new_order_number, 'Order created successfully'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- MEMBER UTILITY FUNCTIONS
-- =====================================================

-- Function to check if user is an active member
CREATE OR REPLACE FUNCTION is_active_member(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    member_status membership_status;
BEGIN
    SELECT membership_status INTO member_status
    FROM members
    WHERE id = user_id;

    RETURN member_status = 'active';
END;
$$ LANGUAGE plpgsql;

-- Function to get member discount rate
CREATE OR REPLACE FUNCTION get_member_discount_rate(user_id UUID)
RETURNS DECIMAL AS $$
DECLARE
    member_type membership_type;
BEGIN
    SELECT membership_type INTO member_type
    FROM members
    WHERE id = user_id
    AND membership_status = 'active';

    CASE member_type
        WHEN 'premium' THEN RETURN 0.10; -- 10% discount
        WHEN 'investor' THEN RETURN 0.15; -- 15% discount
        WHEN 'regular' THEN RETURN 0.05; -- 5% discount
        ELSE RETURN 0.00;
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PAYMENT TRACKING FUNCTIONS
-- =====================================================

-- Function to log payment attempts
CREATE OR REPLACE FUNCTION log_payment_attempt(
    order_id UUID,
    payment_method TEXT,
    gateway TEXT,
    transaction_id TEXT DEFAULT NULL,
    amount BIGINT DEFAULT NULL,
    status TEXT DEFAULT 'initiated',
    response_data JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO marketplace_payment_logs (
        order_id,
        payment_method,
        transaction_id,
        status,
        amount,
        gateway_response,
        raw_response
    ) VALUES (
        order_id,
        payment_method,
        transaction_id,
        status,
        amount,
        response_data,
        response_data
    ) RETURNING id INTO log_id;

    RETURN log_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update payment status
CREATE OR REPLACE FUNCTION update_payment_status(
    order_number TEXT,
    new_status TEXT,
    transaction_id TEXT DEFAULT NULL,
    settlement_time TIMESTAMP DEFAULT NULL,
    gateway_response JSONB DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    order_id UUID;
    current_status TEXT;
BEGIN
    -- Get order details
    SELECT id, payment_status INTO order_id, current_status
    FROM marketplace_orders
    WHERE order_number = update_payment_status.order_number;

    IF order_id IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Update order payment status
    UPDATE marketplace_orders
    SET payment_status = new_status::payment_status,
        midtrans_transaction_id = COALESCE(transaction_id, midtrans_transaction_id),
        midtrans_settlement_time = COALESCE(settlement_time, midtrans_settlement_time),
        updated_at = NOW()
    WHERE id = order_id;

    -- Log the payment status change
    PERFORM log_payment_attempt(
        order_id,
        'midtrans',
        'midtrans',
        transaction_id,
        NULL,
        new_status,
        gateway_response
    );

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- CART MANAGEMENT FUNCTIONS
-- =====================================================

-- Function to sync cart with database
CREATE OR REPLACE FUNCTION sync_user_cart(
    user_id UUID,
    cart_items JSONB
) RETURNS TABLE(
    success BOOLEAN,
    message TEXT,
    synced_count INTEGER
) AS $$
DECLARE
    item JSONB;
    synced INTEGER := 0;
BEGIN
    -- Clear existing cart
    DELETE FROM marketplace_cart WHERE marketplace_cart.user_id = sync_user_cart.user_id;

    -- Insert new cart items
    FOR item IN SELECT * FROM jsonb_array_elements(cart_items)
    LOOP
        INSERT INTO marketplace_cart (user_id, product_id, quantity)
        VALUES (
            sync_user_cart.user_id,
            (item->>'product_id')::UUID,
            (item->>'quantity')::INTEGER
        ) ON CONFLICT (user_id, product_id)
        DO UPDATE SET
            quantity = EXCLUDED.quantity,
            updated_at = NOW();

        synced := synced + 1;
    END LOOP;

    RETURN QUERY SELECT TRUE, 'Cart synced successfully'::TEXT, synced;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ANALYTICS FUNCTIONS
-- =====================================================

-- Function to get marketplace statistics
CREATE OR REPLACE FUNCTION get_marketplace_stats(
    start_date TIMESTAMP DEFAULT NOW() - INTERVAL '30 days',
    end_date TIMESTAMP DEFAULT NOW()
) RETURNS TABLE(
    total_orders BIGINT,
    total_revenue BIGINT,
    avg_order_value DECIMAL,
    total_products BIGINT,
    active_stores BIGINT,
    pending_orders BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(o.id)::BIGINT as total_orders,
        COALESCE(SUM(o.total_amount), 0)::BIGINT as total_revenue,
        COALESCE(AVG(o.total_amount), 0)::DECIMAL as avg_order_value,
        (SELECT COUNT(*) FROM marketplace_products WHERE status = 'active')::BIGINT as total_products,
        (SELECT COUNT(*) FROM marketplace_stores WHERE status = 'active')::BIGINT as active_stores,
        (SELECT COUNT(*) FROM marketplace_orders WHERE status = 'pending')::BIGINT as pending_orders
    FROM marketplace_orders o
    WHERE o.created_at BETWEEN start_date AND end_date
    AND o.payment_status = 'paid';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- CLEANUP FUNCTIONS
-- =====================================================

-- Function to cleanup expired orders
CREATE OR REPLACE FUNCTION cleanup_expired_orders()
RETURNS INTEGER AS $$
DECLARE
    cleaned_count INTEGER;
BEGIN
    -- Update expired pending orders to cancelled
    UPDATE marketplace_orders
    SET status = 'cancelled',
        payment_status = 'expired',
        updated_at = NOW()
    WHERE status = 'pending'
    AND payment_status = 'pending'
    AND created_at < NOW() - INTERVAL '24 hours';

    GET DIAGNOSTICS cleaned_count = ROW_COUNT;

    -- Restore stock for cancelled orders
    INSERT INTO marketplace_cart (user_id, product_id, quantity)
    SELECT o.user_id, oi.product_id, oi.quantity
    FROM marketplace_orders o
    JOIN marketplace_order_items oi ON o.id = oi.order_id
    WHERE o.status = 'cancelled'
    AND o.updated_at >= NOW() - INTERVAL '1 hour'
    ON CONFLICT (user_id, product_id) DO UPDATE SET
        quantity = marketplace_cart.quantity + EXCLUDED.quantity,
        updated_at = NOW();

    RETURN cleaned_count;
END;
$$ LANGUAGE plpgsql;
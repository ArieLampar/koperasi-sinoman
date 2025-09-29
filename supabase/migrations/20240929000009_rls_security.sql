-- =====================================================
-- ROW LEVEL SECURITY (RLS) MIGRATION
-- =====================================================
-- Migration: 20240929000009_rls_security
-- Description: Enable Row Level Security and create access policies

-- Enable RLS on sensitive tables
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE fit_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE fit_check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- MEMBER ACCESS POLICIES
-- =====================================================

-- Members can only view and update their own profile
CREATE POLICY "Members can view own profile" ON members
    FOR SELECT USING (auth_user_id = auth.uid());

CREATE POLICY "Members can update own profile" ON members
    FOR UPDATE USING (auth_user_id = auth.uid());

-- Members can view their own documents
CREATE POLICY "Members can view own documents" ON member_documents
    FOR SELECT USING (
        member_id IN (
            SELECT id FROM members WHERE auth_user_id = auth.uid()
        )
    );

-- Members can insert their own documents
CREATE POLICY "Members can upload own documents" ON member_documents
    FOR INSERT WITH CHECK (
        member_id IN (
            SELECT id FROM members WHERE auth_user_id = auth.uid()
        )
    );

-- =====================================================
-- SAVINGS & FINANCIAL POLICIES
-- =====================================================

-- Members can only view their own savings accounts
CREATE POLICY "Members can view own savings" ON savings_accounts
    FOR SELECT USING (
        member_id IN (
            SELECT id FROM members WHERE auth_user_id = auth.uid()
        )
    );

-- Members can only view their own transactions
CREATE POLICY "Members can view own transactions" ON transactions
    FOR SELECT USING (
        member_id IN (
            SELECT id FROM members WHERE auth_user_id = auth.uid()
        )
    );

-- =====================================================
-- MARKETPLACE POLICIES
-- =====================================================

-- Members can view all products (public)
CREATE POLICY "Anyone can view active products" ON products
    FOR SELECT USING (status = 'active');

-- Members can view all product categories (public)
CREATE POLICY "Anyone can view active categories" ON product_categories
    FOR SELECT USING (is_active = true);

-- Members can only view their own orders
CREATE POLICY "Members can view own orders" ON orders
    FOR SELECT USING (
        member_id IN (
            SELECT id FROM members WHERE auth_user_id = auth.uid()
        )
    );

-- Members can only view their own order items
CREATE POLICY "Members can view own order items" ON order_items
    FOR SELECT USING (
        order_id IN (
            SELECT id FROM orders WHERE member_id IN (
                SELECT id FROM members WHERE auth_user_id = auth.uid()
            )
        )
    );

-- Members can manage their own shopping cart
CREATE POLICY "Members can manage own cart" ON shopping_carts
    FOR ALL USING (
        member_id IN (
            SELECT id FROM members WHERE auth_user_id = auth.uid()
        )
    );

-- Members can manage their own cart items
CREATE POLICY "Members can manage own cart items" ON cart_items
    FOR ALL USING (
        cart_id IN (
            SELECT id FROM shopping_carts WHERE member_id IN (
                SELECT id FROM members WHERE auth_user_id = auth.uid()
            )
        )
    );

-- =====================================================
-- FIT CHALLENGE POLICIES
-- =====================================================

-- Members can view all active fit challenges
CREATE POLICY "Anyone can view active challenges" ON fit_challenges
    FOR SELECT USING (status IN ('upcoming', 'registration_open', 'ongoing'));

-- Members can only view their own participation records
CREATE POLICY "Members can view own participation" ON fit_participants
    FOR SELECT USING (
        member_id IN (
            SELECT id FROM members WHERE auth_user_id = auth.uid()
        )
    );

-- Members can register themselves for challenges
CREATE POLICY "Members can register for challenges" ON fit_participants
    FOR INSERT WITH CHECK (
        member_id IN (
            SELECT id FROM members WHERE auth_user_id = auth.uid()
        )
    );

-- Members can only view and manage their own check-ins
CREATE POLICY "Members can manage own check-ins" ON fit_check_ins
    FOR ALL USING (
        participant_id IN (
            SELECT id FROM fit_participants WHERE member_id IN (
                SELECT id FROM members WHERE auth_user_id = auth.uid()
            )
        )
    );

-- =====================================================
-- POINTS & REWARDS POLICIES
-- =====================================================

-- Members can only view their own points balance
CREATE POLICY "Members can view own points" ON member_points
    FOR SELECT USING (
        member_id IN (
            SELECT id FROM members WHERE auth_user_id = auth.uid()
        )
    );

-- Members can only view their own point transactions
CREATE POLICY "Members can view own point transactions" ON point_transactions
    FOR SELECT USING (
        member_id IN (
            SELECT id FROM members WHERE auth_user_id = auth.uid()
        )
    );

-- Anyone can view active rewards
CREATE POLICY "Anyone can view active rewards" ON rewards
    FOR SELECT USING (is_active = true);

-- Members can redeem rewards (system will validate)
CREATE POLICY "Members can redeem rewards" ON point_redemptions
    FOR INSERT WITH CHECK (
        member_id IN (
            SELECT id FROM members WHERE auth_user_id = auth.uid()
        )
    );

-- Members can view their own redemptions
CREATE POLICY "Members can view own redemptions" ON point_redemptions
    FOR SELECT USING (
        member_id IN (
            SELECT id FROM members WHERE auth_user_id = auth.uid()
        )
    );

-- =====================================================
-- BANK SAMPAH POLICIES
-- =====================================================

-- Anyone can view active bank sampah units
CREATE POLICY "Anyone can view active units" ON bank_sampah_units
    FOR SELECT USING (status = 'operational');

-- Members can view their own bank sampah summary
CREATE POLICY "Members can view own bank sampah summary" ON bank_sampah_member_summary
    FOR SELECT USING (
        member_id IN (
            SELECT id FROM members WHERE auth_user_id = auth.uid()
        )
    );

-- Members can view their own investments
CREATE POLICY "Members can view own investments" ON bank_sampah_investments
    FOR SELECT USING (
        investor_id IN (
            SELECT id FROM members WHERE auth_user_id = auth.uid()
        )
    );

-- =====================================================
-- NOTIFICATION POLICIES
-- =====================================================

-- Members can only view their own notifications
CREATE POLICY "Members can view own notifications" ON notifications
    FOR SELECT USING (
        member_id IN (
            SELECT id FROM members WHERE auth_user_id = auth.uid()
        )
    );

-- Members can mark their own notifications as read
CREATE POLICY "Members can update own notifications" ON notifications
    FOR UPDATE USING (
        member_id IN (
            SELECT id FROM members WHERE auth_user_id = auth.uid()
        )
    );

-- =====================================================
-- ADMIN ACCESS POLICIES
-- =====================================================

-- Admin users can view all data
CREATE POLICY "Admins can view all members" ON members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_users au
            JOIN members m ON au.member_id = m.id
            WHERE m.auth_user_id = auth.uid()
            AND au.is_active = true
        )
    );

-- Admin users can update member data
CREATE POLICY "Admins can update members" ON members
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM admin_users au
            JOIN members m ON au.member_id = m.id
            WHERE m.auth_user_id = auth.uid()
            AND au.is_active = true
            AND au.role IN ('super_admin', 'admin', 'customer_service')
        )
    );

-- Finance admins can view all financial data
CREATE POLICY "Finance admins can view all transactions" ON transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_users au
            JOIN members m ON au.member_id = m.id
            WHERE m.auth_user_id = auth.uid()
            AND au.is_active = true
            AND au.role IN ('super_admin', 'admin', 'finance')
        )
    );

-- Finance admins can view all savings accounts
CREATE POLICY "Finance admins can view all savings" ON savings_accounts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_users au
            JOIN members m ON au.member_id = m.id
            WHERE m.auth_user_id = auth.uid()
            AND au.is_active = true
            AND au.role IN ('super_admin', 'admin', 'finance')
        )
    );

-- Managers can view all orders
CREATE POLICY "Managers can view all orders" ON orders
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_users au
            JOIN members m ON au.member_id = m.id
            WHERE m.auth_user_id = auth.uid()
            AND au.is_active = true
            AND au.role IN ('super_admin', 'admin', 'manager')
        )
    );

-- =====================================================
-- PUBLIC ACCESS POLICIES
-- =====================================================

-- Public access to product categories
CREATE POLICY "Public can view categories" ON product_categories
    FOR SELECT USING (true);

-- Public access to products
CREATE POLICY "Public can view products" ON products
    FOR SELECT USING (status = 'active');

-- Public access to sellers (basic info only)
CREATE POLICY "Public can view seller info" ON sellers
    FOR SELECT USING (status = 'active');

-- Grant permissions for app usage
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
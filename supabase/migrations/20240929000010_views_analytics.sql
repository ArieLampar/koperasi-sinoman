-- =====================================================
-- VIEWS & ANALYTICS MIGRATION
-- =====================================================
-- Migration: 20240929000010_views_analytics
-- Description: Create useful views for analytics and reporting

-- =====================================================
-- MEMBER ANALYTICS VIEWS
-- =====================================================

-- Member summary view with calculated fields
CREATE OR REPLACE VIEW member_summary AS
SELECT
    m.id,
    m.member_number,
    m.full_name,
    m.email,
    m.phone,
    m.membership_type,
    m.membership_status,
    m.join_date,
    m.kyc_status,

    -- Savings summary
    COALESCE(SUM(sa.balance), 0) as total_savings,
    COUNT(DISTINCT sa.id) as active_accounts,

    -- Transaction summary
    COUNT(DISTINCT t.id) as total_transactions,
    COALESCE(SUM(CASE WHEN tt.category = 'deposit' THEN t.amount ELSE 0 END), 0) as total_deposits,
    COALESCE(SUM(CASE WHEN tt.category = 'withdrawal' THEN t.amount ELSE 0 END), 0) as total_withdrawals,

    -- Points summary
    COALESCE(mp.total_points, 0) as total_points,
    COALESCE(mp.available_points, 0) as available_points,

    -- Order summary
    COUNT(DISTINCT o.id) as total_orders,
    COALESCE(SUM(o.total_amount), 0) as total_spent,

    -- Fit challenge participation
    COUNT(DISTINCT fp.id) as fit_challenges_joined,
    COUNT(CASE WHEN fp.status = 'completed' THEN 1 END) as fit_challenges_completed

FROM members m
LEFT JOIN savings_accounts sa ON m.id = sa.member_id AND sa.status = 'active'
LEFT JOIN transactions t ON m.id = t.member_id
LEFT JOIN transaction_types tt ON t.transaction_type_id = tt.id
LEFT JOIN member_points mp ON m.id = mp.member_id
LEFT JOIN orders o ON m.id = o.member_id AND o.status = 'completed'
LEFT JOIN fit_participants fp ON m.id = fp.member_id
GROUP BY m.id, m.member_number, m.full_name, m.email, m.phone,
         m.membership_type, m.membership_status, m.join_date, m.kyc_status,
         mp.total_points, mp.available_points;

-- Monthly member growth
CREATE OR REPLACE VIEW monthly_member_growth AS
SELECT
    DATE_TRUNC('month', join_date) as month,
    COUNT(*) as new_members,
    SUM(COUNT(*)) OVER (ORDER BY DATE_TRUNC('month', join_date)) as cumulative_members
FROM members
WHERE membership_status = 'active'
GROUP BY DATE_TRUNC('month', join_date)
ORDER BY month;

-- =====================================================
-- FINANCIAL ANALYTICS VIEWS
-- =====================================================

-- Monthly financial summary
CREATE OR REPLACE VIEW monthly_financial_summary AS
SELECT
    DATE_TRUNC('month', t.created_at) as month,
    tt.category,
    COUNT(*) as transaction_count,
    SUM(t.amount) as total_amount,
    AVG(t.amount) as average_amount
FROM transactions t
JOIN transaction_types tt ON t.transaction_type_id = tt.id
WHERE t.payment_status = 'completed'
GROUP BY DATE_TRUNC('month', t.created_at), tt.category
ORDER BY month DESC, tt.category;

-- Savings type performance
CREATE OR REPLACE VIEW savings_performance AS
SELECT
    st.name as savings_type,
    st.code,
    COUNT(DISTINCT sa.id) as total_accounts,
    COUNT(CASE WHEN sa.status = 'active' THEN 1 END) as active_accounts,
    SUM(sa.balance) as total_balance,
    AVG(sa.balance) as average_balance,
    MIN(sa.balance) as min_balance,
    MAX(sa.balance) as max_balance
FROM savings_types st
LEFT JOIN savings_accounts sa ON st.id = sa.savings_type_id
GROUP BY st.id, st.name, st.code
ORDER BY total_balance DESC;

-- =====================================================
-- MARKETPLACE ANALYTICS VIEWS
-- =====================================================

-- Product performance view
CREATE OR REPLACE VIEW product_performance AS
SELECT
    p.id,
    p.name,
    p.price,
    p.member_price,
    p.stock_quantity,
    pc.name as category_name,
    s.business_name as seller_name,

    -- Sales metrics
    COUNT(DISTINCT oi.id) as times_sold,
    COALESCE(SUM(oi.quantity), 0) as total_quantity_sold,
    COALESCE(SUM(oi.total_price), 0) as total_revenue,
    COALESCE(AVG(oi.price), 0) as average_selling_price,

    -- Last sale date
    MAX(o.created_at) as last_sale_date

FROM products p
LEFT JOIN product_categories pc ON p.category_id = pc.id
LEFT JOIN sellers s ON p.seller_id = s.id
LEFT JOIN order_items oi ON p.id = oi.product_id
LEFT JOIN orders o ON oi.order_id = o.id AND o.status = 'completed'
GROUP BY p.id, p.name, p.price, p.member_price, p.stock_quantity,
         pc.name, s.business_name
ORDER BY total_revenue DESC NULLS LAST;

-- Monthly marketplace revenue
CREATE OR REPLACE VIEW monthly_marketplace_revenue AS
SELECT
    DATE_TRUNC('month', o.created_at) as month,
    COUNT(DISTINCT o.id) as total_orders,
    SUM(o.total_amount) as total_revenue,
    AVG(o.total_amount) as average_order_value,
    COUNT(DISTINCT o.member_id) as unique_customers
FROM orders o
WHERE o.status = 'completed'
GROUP BY DATE_TRUNC('month', o.created_at)
ORDER BY month DESC;

-- =====================================================
-- FIT CHALLENGE ANALYTICS VIEWS
-- =====================================================

-- Fit challenge performance
CREATE OR REPLACE VIEW fit_challenge_performance AS
SELECT
    fc.id,
    fc.name,
    fc.start_date,
    fc.end_date,
    fc.status,
    fc.max_participants,

    -- Participation metrics
    COUNT(DISTINCT fp.id) as total_registrations,
    COUNT(CASE WHEN fp.status = 'active' THEN 1 END) as active_participants,
    COUNT(CASE WHEN fp.status = 'completed' THEN 1 END) as completed_participants,
    ROUND(COUNT(CASE WHEN fp.status = 'completed' THEN 1 END)::DECIMAL /
          NULLIF(COUNT(DISTINCT fp.id), 0) * 100, 2) as completion_rate,

    -- Revenue
    SUM(CASE WHEN fp.payment_status = 'paid' THEN fc.fee ELSE 0 END) as total_revenue,

    -- Average progress
    AVG(fp.final_score) as average_final_score

FROM fit_challenges fc
LEFT JOIN fit_participants fp ON fc.id = fp.challenge_id
GROUP BY fc.id, fc.name, fc.start_date, fc.end_date, fc.status,
         fc.max_participants
ORDER BY fc.start_date DESC;

-- Member fitness progress summary
CREATE OR REPLACE VIEW member_fitness_progress AS
SELECT
    m.id as member_id,
    m.full_name,
    COUNT(DISTINCT fp.id) as challenges_joined,
    COUNT(CASE WHEN fp.status = 'completed' THEN 1 END) as challenges_completed,
    AVG(fp.final_score) as average_score,
    SUM(CASE WHEN fci.workout_completed THEN 1 ELSE 0 END) as total_workouts,
    AVG(fci.mood_score) as average_mood,
    AVG(fci.energy_level) as average_energy
FROM members m
LEFT JOIN fit_participants fp ON m.id = fp.member_id
LEFT JOIN fit_check_ins fci ON fp.id = fci.participant_id
GROUP BY m.id, m.full_name
HAVING COUNT(DISTINCT fp.id) > 0
ORDER BY challenges_completed DESC, average_score DESC;

-- =====================================================
-- BANK SAMPAH ANALYTICS VIEWS
-- =====================================================

-- Bank Sampah unit performance
CREATE OR REPLACE VIEW bank_sampah_performance AS
SELECT
    bsu.id,
    bsu.name,
    bsu.code,
    bsu.status,
    bsu.investment_amount,
    bsu.monthly_revenue,
    bsu.monthly_expenses,

    -- Member participation
    COUNT(DISTINCT bsms.member_id) as total_members,
    SUM(bsms.total_weight_kg) as total_waste_kg,
    SUM(bsms.total_earnings) as total_member_earnings,
    AVG(bsms.total_weight_kg) as avg_weight_per_member,

    -- Environmental impact
    SUM(bsms.co2_saved_kg) as total_co2_saved,
    SUM(bsms.trees_equivalent) as total_trees_equivalent,

    -- Financial performance
    CASE
        WHEN bsu.investment_amount > 0 THEN
            ROUND((bsu.monthly_revenue - bsu.monthly_expenses) / bsu.investment_amount * 100, 2)
        ELSE NULL
    END as monthly_roi_percentage

FROM bank_sampah_units bsu
LEFT JOIN bank_sampah_member_summary bsms ON bsu.id = bsms.unit_id
GROUP BY bsu.id, bsu.name, bsu.code, bsu.status, bsu.investment_amount,
         bsu.monthly_revenue, bsu.monthly_expenses
ORDER BY total_waste_kg DESC NULLS LAST;

-- =====================================================
-- POINTS & REWARDS ANALYTICS VIEWS
-- =====================================================

-- Points earning and spending patterns
CREATE OR REPLACE VIEW points_analytics AS
SELECT
    DATE_TRUNC('month', pt.created_at) as month,
    pt.transaction_type,
    pt.source_type,
    COUNT(*) as transaction_count,
    SUM(pt.points_amount) as total_points,
    AVG(pt.points_amount) as average_points,
    COUNT(DISTINCT pt.member_id) as unique_members
FROM point_transactions pt
GROUP BY DATE_TRUNC('month', pt.created_at), pt.transaction_type, pt.source_type
ORDER BY month DESC, transaction_type, source_type;

-- Top point earners
CREATE OR REPLACE VIEW top_point_earners AS
SELECT
    m.id,
    m.member_number,
    m.full_name,
    mp.total_points,
    mp.available_points,
    mp.redeemed_points,

    -- Earning breakdown
    SUM(CASE WHEN pt.source_type = 'referral' THEN pt.points_amount ELSE 0 END) as referral_points,
    SUM(CASE WHEN pt.source_type = 'purchase' THEN pt.points_amount ELSE 0 END) as purchase_points,
    SUM(CASE WHEN pt.source_type = 'fit_checkin' THEN pt.points_amount ELSE 0 END) as fitness_points,
    SUM(CASE WHEN pt.source_type = 'bank_sampah' THEN pt.points_amount ELSE 0 END) as environmental_points

FROM members m
JOIN member_points mp ON m.id = mp.member_id
LEFT JOIN point_transactions pt ON m.id = pt.member_id AND pt.transaction_type = 'earned'
GROUP BY m.id, m.member_number, m.full_name, mp.total_points,
         mp.available_points, mp.redeemed_points
ORDER BY mp.total_points DESC
LIMIT 100;

-- =====================================================
-- EXECUTIVE DASHBOARD VIEW
-- =====================================================

-- Key metrics summary for executive dashboard
CREATE OR REPLACE VIEW executive_dashboard AS
SELECT
    -- Member metrics
    (SELECT COUNT(*) FROM members WHERE membership_status = 'active') as total_active_members,
    (SELECT COUNT(*) FROM members WHERE join_date >= CURRENT_DATE - INTERVAL '30 days') as new_members_this_month,

    -- Financial metrics
    (SELECT SUM(balance) FROM savings_accounts WHERE status = 'active') as total_savings_balance,
    (SELECT SUM(amount) FROM transactions t
     JOIN transaction_types tt ON t.transaction_type_id = tt.id
     WHERE tt.category = 'deposit' AND t.created_at >= CURRENT_DATE - INTERVAL '30 days'
     AND t.payment_status = 'completed') as deposits_this_month,

    -- Marketplace metrics
    (SELECT COUNT(*) FROM orders WHERE status = 'completed'
     AND created_at >= CURRENT_DATE - INTERVAL '30 days') as orders_this_month,
    (SELECT SUM(total_amount) FROM orders WHERE status = 'completed'
     AND created_at >= CURRENT_DATE - INTERVAL '30 days') as revenue_this_month,

    -- Fit Challenge metrics
    (SELECT COUNT(*) FROM fit_participants WHERE status = 'active') as active_fit_participants,
    (SELECT COUNT(*) FROM fit_challenges WHERE status = 'ongoing') as ongoing_challenges,

    -- Bank Sampah metrics
    (SELECT COUNT(*) FROM bank_sampah_units WHERE status = 'operational') as operational_units,
    (SELECT SUM(total_weight_kg) FROM bank_sampah_member_summary) as total_waste_processed,

    -- Points metrics
    (SELECT SUM(total_points) FROM member_points) as total_points_issued,
    (SELECT SUM(redeemed_points) FROM member_points) as total_points_redeemed;
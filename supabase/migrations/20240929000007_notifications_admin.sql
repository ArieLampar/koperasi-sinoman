-- =====================================================
-- NOTIFICATIONS & ADMIN SYSTEM MIGRATION
-- =====================================================
-- Migration: 20240929000007_notifications_admin
-- Description: Create notifications, admin, and system management tables

-- Notification templates
CREATE TABLE notification_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    subject VARCHAR(255),
    content TEXT NOT NULL,
    variables JSON,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sent notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID REFERENCES members(id),
    template_id UUID REFERENCES notification_templates(id),

    -- Notification details
    type VARCHAR(50) NOT NULL,
    subject VARCHAR(255),
    content TEXT NOT NULL,

    -- Delivery
    recipient_email VARCHAR(255),
    recipient_phone VARCHAR(20),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'read')),

    -- Tracking
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,

    -- Related data
    related_type VARCHAR(50),
    related_id UUID,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin users (extends members table)
CREATE TABLE admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID NOT NULL REFERENCES members(id) UNIQUE,
    role VARCHAR(50) NOT NULL CHECK (role IN ('super_admin', 'admin', 'finance', 'customer_service', 'manager')),
    permissions JSON,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System audit logs
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES members(id),

    -- Action details
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(100),
    record_id UUID,

    -- Changes
    old_values JSON,
    new_values JSON,

    -- Context
    ip_address INET,
    user_agent TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System settings
CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    type VARCHAR(20) DEFAULT 'string' CHECK (type IN ('string', 'number', 'boolean', 'json')),
    is_public BOOLEAN DEFAULT false,
    updated_by UUID REFERENCES members(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for notifications and admin
CREATE INDEX idx_notifications_member_id ON notifications(member_id);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- Insert system settings
INSERT INTO system_settings (key, value, description, type, is_public) VALUES
('app_name', 'Koperasi Sinoman', 'Nama aplikasi', 'string', true),
('app_version', '1.0.0', 'Versi aplikasi', 'string', true),
('maintenance_mode', 'false', 'Mode maintenance', 'boolean', false),
('referral_bonus_amount', '50000', 'Bonus referral dalam rupiah', 'number', false),
('max_loan_multiplier', '3', 'Maksimal pinjaman = simpanan x multiplier', 'number', false),
('shu_percentage', '15', 'Persentase SHU dari keuntungan', 'number', false);
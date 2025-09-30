-- Create notification_logs table for WhatsApp message tracking
CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  recipient VARCHAR(20) NOT NULL,
  payload JSONB NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  error TEXT,
  retry_count INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sent_at TIMESTAMP WITH TIME ZONE,
  member_id UUID REFERENCES members(id) ON DELETE SET NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_notification_recipient ON notification_logs(recipient);
CREATE INDEX IF NOT EXISTS idx_notification_status ON notification_logs(status);
CREATE INDEX IF NOT EXISTS idx_notification_created ON notification_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_member ON notification_logs(member_id);
CREATE INDEX IF NOT EXISTS idx_notification_type ON notification_logs(type);

-- Add RLS policies
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admin can view all notification logs" ON notification_logs;
DROP POLICY IF EXISTS "Members can view their own notifications" ON notification_logs;
DROP POLICY IF EXISTS "Service can insert notifications" ON notification_logs;
DROP POLICY IF EXISTS "Service can update notifications" ON notification_logs;

-- Admin can view all notification logs
CREATE POLICY "Admin can view all notification logs"
ON notification_logs FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_users au
    JOIN members m ON au.member_id = m.id
    WHERE m.auth_user_id = auth.uid()
    AND au.is_active = true
  )
);

-- Members can view their own notifications
CREATE POLICY "Members can view their own notifications"
ON notification_logs FOR SELECT
TO authenticated
USING (member_id = auth.uid());

-- Service role can insert notification logs
CREATE POLICY "Service can insert notifications"
ON notification_logs FOR INSERT
TO authenticated
WITH CHECK (true);

-- Service role can update notification status
CREATE POLICY "Service can update notifications"
ON notification_logs FOR UPDATE
TO authenticated
USING (true);

-- Add comment
COMMENT ON TABLE notification_logs IS 'Tracks all WhatsApp notifications sent via Fonnte API';
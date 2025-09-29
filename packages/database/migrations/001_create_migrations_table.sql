-- Migration: Create Migrations Table
-- Created: 2024-09-29T10:00:00.000Z
-- Description: Create migrations tracking table for database versioning

-- =====================================================
-- UP MIGRATION
-- =====================================================

-- Create migrations table to track applied migrations
CREATE TABLE IF NOT EXISTS migrations (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    checksum VARCHAR(64) NOT NULL,
    execution_time_ms INTEGER DEFAULT 0
);

-- Create index on executed_at for performance
CREATE INDEX IF NOT EXISTS idx_migrations_executed_at ON migrations(executed_at DESC);

-- Add comment
COMMENT ON TABLE migrations IS 'Tracks database migrations that have been applied';
COMMENT ON COLUMN migrations.id IS 'Unique migration identifier (timestamp_name)';
COMMENT ON COLUMN migrations.name IS 'Human-readable migration name';
COMMENT ON COLUMN migrations.executed_at IS 'When the migration was executed';
COMMENT ON COLUMN migrations.checksum IS 'SHA-256 checksum of migration content';
COMMENT ON COLUMN migrations.execution_time_ms IS 'Migration execution time in milliseconds';

-- =====================================================
-- DOWN MIGRATION (for rollback)
-- =====================================================

-- Drop migrations table
DROP TABLE IF EXISTS migrations;
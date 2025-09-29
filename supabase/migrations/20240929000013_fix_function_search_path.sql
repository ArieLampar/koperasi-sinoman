-- =====================================================
-- FIX FUNCTION SEARCH PATH SECURITY ISSUES
-- =====================================================
-- Migration: 20240929000013_fix_function_search_path
-- Description: Fix function search_path mutable security warnings

-- =====================================================
-- UPDATE UPDATED_AT FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =====================================================
-- MEMBER NUMBER GENERATION FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION generate_member_number()
RETURNS TRIGGER
SET search_path = public
AS $$
DECLARE
    next_num INTEGER;
    new_member_number VARCHAR(20);
BEGIN
    -- Get the next sequence number for this year
    SELECT COALESCE(
        MAX(CAST(SUBSTRING(member_number FROM 9) AS INTEGER)), 0
    ) + 1 INTO next_num
    FROM members
    WHERE member_number LIKE 'SIN-' || EXTRACT(YEAR FROM NOW()) || '-%';

    -- Format: SIN-YYYY-XXXXXX (6 digits, zero-padded)
    new_member_number := 'SIN-' || EXTRACT(YEAR FROM NOW()) || '-' || LPAD(next_num::TEXT, 6, '0');

    NEW.member_number := new_member_number;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =====================================================
-- ACCOUNT NUMBER GENERATION FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION generate_account_number()
RETURNS TRIGGER
SET search_path = public
AS $$
DECLARE
    next_num INTEGER;
    new_account_number VARCHAR(20);
BEGIN
    -- Get the next sequence number for this year
    SELECT COALESCE(
        MAX(CAST(SUBSTRING(account_number FROM 9) AS INTEGER)), 0
    ) + 1 INTO next_num
    FROM savings_accounts
    WHERE account_number LIKE 'SA-' || EXTRACT(YEAR FROM NOW()) || '-%';

    -- Format: SA-YYYY-XXXXXX (6 digits, zero-padded)
    new_account_number := 'SA-' || EXTRACT(YEAR FROM NOW()) || '-' || LPAD(next_num::TEXT, 6, '0');

    NEW.account_number := new_account_number;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =====================================================
-- ORDER NUMBER GENERATION FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER
SET search_path = public
AS $$
DECLARE
    next_num INTEGER;
    new_order_number VARCHAR(50);
BEGIN
    -- Get the next sequence number for this year
    SELECT COALESCE(
        MAX(CAST(SUBSTRING(order_number FROM 9) AS INTEGER)), 0
    ) + 1 INTO next_num
    FROM orders
    WHERE order_number LIKE 'ORD-' || EXTRACT(YEAR FROM NOW()) || '-%';

    -- Format: ORD-YYYY-XXXXXX (6 digits, zero-padded)
    new_order_number := 'ORD-' || EXTRACT(YEAR FROM NOW()) || '-' || LPAD(next_num::TEXT, 6, '0');

    NEW.order_number := new_order_number;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =====================================================
-- TRANSACTION REFERENCE GENERATION FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION generate_transaction_reference()
RETURNS TRIGGER
SET search_path = public
AS $$
DECLARE
    next_num INTEGER;
    new_reference VARCHAR(50);
BEGIN
    -- Get the next sequence number for this year
    SELECT COALESCE(
        MAX(CAST(SUBSTRING(reference_number FROM 9) AS INTEGER)), 0
    ) + 1 INTO next_num
    FROM transactions
    WHERE reference_number LIKE 'TXN-' || EXTRACT(YEAR FROM NOW()) || '-%';

    -- Format: TXN-YYYY-XXXXXX (6 digits, zero-padded)
    new_reference := 'TXN-' || EXTRACT(YEAR FROM NOW()) || '-' || LPAD(next_num::TEXT, 6, '0');

    NEW.reference_number := new_reference;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =====================================================
-- MEMBER POINTS BALANCE UPDATE FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION update_member_points_balance()
RETURNS TRIGGER
SET search_path = public
AS $$
BEGIN
    -- Update or insert member points balance
    INSERT INTO member_points (member_id, total_points, available_points, last_updated)
    VALUES (NEW.member_id, NEW.points_amount, NEW.points_amount, NOW())
    ON CONFLICT (member_id) DO UPDATE SET
        total_points = CASE
            WHEN NEW.transaction_type = 'earned' THEN member_points.total_points + NEW.points_amount
            WHEN NEW.transaction_type = 'redeemed' THEN member_points.total_points
            WHEN NEW.transaction_type = 'expired' THEN member_points.total_points
            ELSE member_points.total_points + NEW.points_amount
        END,
        available_points = CASE
            WHEN NEW.transaction_type = 'earned' THEN member_points.available_points + NEW.points_amount
            WHEN NEW.transaction_type = 'redeemed' THEN member_points.available_points - NEW.points_amount
            WHEN NEW.transaction_type = 'expired' THEN member_points.available_points - NEW.points_amount
            ELSE member_points.available_points
        END,
        redeemed_points = CASE
            WHEN NEW.transaction_type = 'redeemed' THEN member_points.redeemed_points + NEW.points_amount
            ELSE member_points.redeemed_points
        END,
        expired_points = CASE
            WHEN NEW.transaction_type = 'expired' THEN member_points.expired_points + NEW.points_amount
            ELSE member_points.expired_points
        END,
        last_updated = NOW();

    RETURN NEW;
END;
$$ language 'plpgsql';

-- =====================================================
-- SAVINGS BALANCE UPDATE FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION update_savings_balance()
RETURNS TRIGGER
SET search_path = public
AS $$
DECLARE
    account_record savings_accounts%ROWTYPE;
    new_balance DECIMAL(15,2);
    transaction_category TEXT;
BEGIN
    -- Get current account balance
    SELECT * INTO account_record FROM savings_accounts WHERE id = NEW.savings_account_id;

    -- Calculate new balance based on transaction type
    SELECT tt.category INTO transaction_category
    FROM transaction_types tt
    WHERE tt.id = NEW.transaction_type_id;

    IF transaction_category IN ('deposit', 'interest', 'bonus') THEN
        new_balance := account_record.balance + NEW.amount;
    ELSIF transaction_category IN ('withdrawal', 'fee') THEN
        new_balance := account_record.balance - NEW.amount;
    ELSE
        new_balance := account_record.balance;
    END IF;

    -- Set balance before and after
    NEW.balance_before := account_record.balance;
    NEW.balance_after := new_balance;

    -- Update account balance
    UPDATE savings_accounts
    SET balance = new_balance, updated_at = NOW()
    WHERE id = NEW.savings_account_id;

    RETURN NEW;
END;
$$ language 'plpgsql';

-- =====================================================
-- AUDIT LOG CREATION FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION create_audit_log()
RETURNS TRIGGER
SET search_path = public
AS $$
BEGIN
    -- Insert audit log for updates
    IF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_logs (
            user_id, action, table_name, record_id, old_values, new_values
        ) VALUES (
            COALESCE(NEW.updated_by, OLD.updated_by),
            'UPDATE',
            TG_TABLE_NAME,
            NEW.id,
            row_to_json(OLD),
            row_to_json(NEW)
        );
        RETURN NEW;
    -- Insert audit log for inserts
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs (
            user_id, action, table_name, record_id, new_values
        ) VALUES (
            NEW.created_by,
            'INSERT',
            TG_TABLE_NAME,
            NEW.id,
            row_to_json(NEW)
        );
        RETURN NEW;
    -- Insert audit log for deletes
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_logs (
            user_id, action, table_name, record_id, old_values
        ) VALUES (
            OLD.deleted_by,
            'DELETE',
            TG_TABLE_NAME,
            OLD.id,
            row_to_json(OLD)
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';
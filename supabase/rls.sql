-- ============================================================
-- MooMetrics: Row Level Security Policies
-- Run this AFTER schema.sql in the Supabase SQL Editor
-- ============================================================
-- Ensures multi-tenant SaaS isolation:
-- each user only sees their own farm data.

-- ============================================================
-- 1. PROFILES
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- ============================================================
-- 2. FARMS
-- ============================================================
ALTER TABLE farms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own farms"
    ON farms FOR SELECT
    USING (auth.uid() = owner_id AND is_deleted = FALSE);

CREATE POLICY "Users can create own farms"
    ON farms FOR INSERT
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own farms"
    ON farms FOR UPDATE
    USING (auth.uid() = owner_id)
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can soft-delete own farms"
    ON farms FOR UPDATE
    USING (auth.uid() = owner_id)
    WITH CHECK (auth.uid() = owner_id);

-- ============================================================
-- 3. ANIMALS
-- ============================================================
ALTER TABLE animals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own animals"
    ON animals FOR SELECT
    USING (auth.uid() = owner_id AND is_deleted = FALSE);

CREATE POLICY "Users can create own animals"
    ON animals FOR INSERT
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own animals"
    ON animals FOR UPDATE
    USING (auth.uid() = owner_id)
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can delete own animals"
    ON animals FOR DELETE
    USING (auth.uid() = owner_id);

-- ============================================================
-- 4. CROPS
-- ============================================================
ALTER TABLE crops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own crops"
    ON crops FOR SELECT
    USING (auth.uid() = owner_id AND is_deleted = FALSE);

CREATE POLICY "Users can create own crops"
    ON crops FOR INSERT
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own crops"
    ON crops FOR UPDATE
    USING (auth.uid() = owner_id)
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can delete own crops"
    ON crops FOR DELETE
    USING (auth.uid() = owner_id);

-- ============================================================
-- 5. TASKS
-- ============================================================
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tasks"
    ON tasks FOR SELECT
    USING (auth.uid() = owner_id AND is_deleted = FALSE);

CREATE POLICY "Users can create own tasks"
    ON tasks FOR INSERT
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own tasks"
    ON tasks FOR UPDATE
    USING (auth.uid() = owner_id)
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can delete own tasks"
    ON tasks FOR DELETE
    USING (auth.uid() = owner_id);

-- ============================================================
-- 6. EQUIPMENT
-- ============================================================
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own equipment"
    ON equipment FOR SELECT
    USING (auth.uid() = owner_id AND is_deleted = FALSE);

CREATE POLICY "Users can create own equipment"
    ON equipment FOR INSERT
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own equipment"
    ON equipment FOR UPDATE
    USING (auth.uid() = owner_id)
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can delete own equipment"
    ON equipment FOR DELETE
    USING (auth.uid() = owner_id);

-- ============================================================
-- 7. TRANSACTIONS
-- ============================================================
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
    ON transactions FOR SELECT
    USING (auth.uid() = owner_id AND is_deleted = FALSE);

CREATE POLICY "Users can create own transactions"
    ON transactions FOR INSERT
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own transactions"
    ON transactions FOR UPDATE
    USING (auth.uid() = owner_id)
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can delete own transactions"
    ON transactions FOR DELETE
    USING (auth.uid() = owner_id);

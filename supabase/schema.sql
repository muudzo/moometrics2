-- ============================================================
-- MooMetrics: Supabase PostgreSQL Schema
-- Run this FIRST in the Supabase SQL Editor
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. PROFILES (extends Supabase auth.users)
-- ============================================================
CREATE TABLE profiles (
    id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name   TEXT,
    avatar_url  TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email)
    );
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 2. FARMS
-- ============================================================
CREATE TABLE farms (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        TEXT NOT NULL,
    location    TEXT,
    owner_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    is_deleted  BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at  TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_farms_owner_id ON farms(owner_id);
CREATE INDEX idx_farms_not_deleted ON farms(owner_id) WHERE is_deleted = FALSE;

-- Auto-create a default farm on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_farm()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.farms (name, owner_id)
    VALUES ('My Farm', NEW.id);
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_farm
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user_farm();

-- ============================================================
-- 3. ANIMALS
-- ============================================================
CREATE TABLE animals (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tag_number          TEXT NOT NULL,
    type                TEXT NOT NULL CHECK (type IN ('Cow', 'Goat', 'Sheep', 'Pig', 'Other')),
    sex                 TEXT NOT NULL CHECK (sex IN ('Male', 'Female')),
    health_status       TEXT NOT NULL DEFAULT 'Healthy'
                        CHECK (health_status IN ('Healthy', 'Sick', 'Under Observation')),
    vaccination_status  TEXT NOT NULL DEFAULT 'Up to Date'
                        CHECK (vaccination_status IN ('Up to Date', 'Due', 'Not Vaccinated')),
    notes               TEXT,
    image_url           TEXT,
    farm_id             UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
    owner_id            UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    is_deleted          BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at          TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_animals_farm_id ON animals(farm_id);
CREATE INDEX idx_animals_owner_id ON animals(owner_id);
CREATE INDEX idx_animals_farm_tag ON animals(farm_id, tag_number);
CREATE INDEX idx_animals_not_deleted ON animals(farm_id) WHERE is_deleted = FALSE;

-- ============================================================
-- 4. CROPS
-- ============================================================
CREATE TABLE crops (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            TEXT NOT NULL,
    variety         TEXT,
    planting_date   DATE NOT NULL,
    harvest_date    DATE,
    status          TEXT NOT NULL DEFAULT 'Planted'
                    CHECK (status IN ('Planned', 'Planted', 'Growing', 'Harvested', 'Failed')),
    area_hectares   NUMERIC(10,2),
    notes           TEXT,
    farm_id         UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
    owner_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    is_deleted      BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_crops_farm_id ON crops(farm_id);
CREATE INDEX idx_crops_owner_id ON crops(owner_id);
CREATE INDEX idx_crops_not_deleted ON crops(farm_id) WHERE is_deleted = FALSE;

-- ============================================================
-- 5. TASKS
-- ============================================================
CREATE TABLE tasks (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title           TEXT NOT NULL,
    description     TEXT,
    priority        TEXT NOT NULL DEFAULT 'Medium'
                    CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
    status          TEXT NOT NULL DEFAULT 'Pending'
                    CHECK (status IN ('Pending', 'In Progress', 'Completed', 'Cancelled')),
    due_date        DATE,
    completed_at    TIMESTAMPTZ,
    category        TEXT DEFAULT 'General'
                    CHECK (category IN ('General', 'Livestock', 'Crops', 'Equipment', 'Finance')),
    farm_id         UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
    owner_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    is_deleted      BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tasks_farm_id ON tasks(farm_id);
CREATE INDEX idx_tasks_owner_id ON tasks(owner_id);
CREATE INDEX idx_tasks_status ON tasks(status) WHERE is_deleted = FALSE;
CREATE INDEX idx_tasks_due_date ON tasks(due_date) WHERE is_deleted = FALSE AND status != 'Completed';

-- ============================================================
-- 6. EQUIPMENT
-- ============================================================
CREATE TABLE equipment (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            TEXT NOT NULL,
    type            TEXT NOT NULL,
    status          TEXT NOT NULL DEFAULT 'Operational'
                    CHECK (status IN ('Operational', 'Needs Maintenance', 'Under Repair', 'Decommissioned')),
    purchase_date   DATE,
    last_service    DATE,
    next_service    DATE,
    notes           TEXT,
    farm_id         UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
    owner_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    is_deleted      BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_equipment_farm_id ON equipment(farm_id);
CREATE INDEX idx_equipment_owner_id ON equipment(owner_id);

-- ============================================================
-- 7. TRANSACTIONS (Finance)
-- ============================================================
CREATE TABLE transactions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type            TEXT NOT NULL CHECK (type IN ('Income', 'Expense')),
    category        TEXT NOT NULL,
    amount          NUMERIC(12,2) NOT NULL,
    description     TEXT,
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    farm_id         UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
    owner_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    is_deleted      BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_transactions_farm_id ON transactions(farm_id);
CREATE INDEX idx_transactions_owner_id ON transactions(owner_id);
CREATE INDEX idx_transactions_date ON transactions(transaction_date DESC) WHERE is_deleted = FALSE;

-- ============================================================
-- 8. GLOBAL updated_at TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Apply to all tables
CREATE TRIGGER set_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON farms
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON animals
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON crops
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON equipment
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

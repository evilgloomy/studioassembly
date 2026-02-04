-- =====================================================
-- MIGRATION 1: Add Caerhold roles to app_role enum
-- =====================================================
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'caerhold_admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'caerhold_editor';
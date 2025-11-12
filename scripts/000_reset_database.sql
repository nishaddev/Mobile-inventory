-- Script to reset database - removes all data and prepares for fresh setup
-- Run this first to clear any existing data

-- Disable foreign key checks temporarily
SET session_replication_role = replica;

-- Delete all data from tables in reverse order of dependencies
-- Use conditional statements to avoid errors when tables don't exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sales_transactions') THEN
    DELETE FROM public.sales_transactions;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'inventory') THEN
    DELETE FROM public.inventory;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'products') THEN
    DELETE FROM public.products;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'categories') THEN
    DELETE FROM public.categories;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'warehouses') THEN
    DELETE FROM public.warehouses;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    DELETE FROM public.profiles;
  END IF;
END $$;

-- Re-enable foreign key checks
SET session_replication_role = DEFAULT;

-- Reset auto-increment sequences if needed
-- (Not needed for UUID primary keys, but included for completeness)
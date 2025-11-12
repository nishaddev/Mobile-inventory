-- Script to remove reorder_level column from products table
-- This column is no longer needed in the application

-- Remove the reorder_level column from products table
ALTER TABLE public.products 
DROP COLUMN IF EXISTS reorder_level;
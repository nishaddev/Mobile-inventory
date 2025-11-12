-- Script to remove sku column from products table
-- This column is no longer needed in the application

-- Remove the sku column from products table
ALTER TABLE public.products 
DROP COLUMN IF EXISTS sku;
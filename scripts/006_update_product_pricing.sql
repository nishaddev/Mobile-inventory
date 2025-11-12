-- Script to update product pricing structure
-- This renames bulk_price to wholesale_price and ensures retail_price exists

-- First, check if bulk_price column exists and rename it to wholesale_price
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'bulk_price') THEN
    ALTER TABLE public.products RENAME COLUMN bulk_price TO wholesale_price;
  END IF;
END $$;

-- Add retail_price column if it doesn't exist
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS retail_price DECIMAL(10, 2);

-- Copy existing selling_price data to retail_price for backward compatibility
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'selling_price') THEN
    UPDATE public.products 
    SET retail_price = selling_price 
    WHERE retail_price IS NULL AND selling_price IS NOT NULL;
  END IF;
END $$;

-- Remove the old selling_price column
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'selling_price') THEN
    ALTER TABLE public.products 
    DROP COLUMN selling_price;
  END IF;
END $$;

-- Create a separate table for date-based pricing
CREATE TABLE IF NOT EXISTS public.product_pricing_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  wholesale_price DECIMAL(10, 2),
  retail_price DECIMAL(10, 2),
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_product_pricing_history_product_id ON public.product_pricing_history(product_id);
CREATE INDEX IF NOT EXISTS idx_product_pricing_history_effective_date ON public.product_pricing_history(effective_date);
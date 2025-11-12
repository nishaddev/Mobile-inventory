-- Script to add unit column and sales tracking columns to products table
-- This adds the unit column and columns to track sales

-- Add unit column to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS unit INTEGER DEFAULT 1;

-- Add sales tracking columns to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS wholesale_sold INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS retail_sold INTEGER DEFAULT 0;
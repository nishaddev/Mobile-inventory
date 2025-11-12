-- Script to add sales tracking tables
-- This adds tables to track wholesale and retail sales

-- Create a table for tracking sales transactions
CREATE TABLE IF NOT EXISTS public.sales_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('wholesale', 'retail')),
  quantity INTEGER NOT NULL DEFAULT 0,
  unit_price DECIMAL(10, 2) NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sales_transactions_product_id ON public.sales_transactions(product_id);
CREATE INDEX IF NOT EXISTS idx_sales_transactions_transaction_type ON public.sales_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_sales_transactions_transaction_date ON public.sales_transactions(transaction_date);

-- Enable Row Level Security
ALTER TABLE public.sales_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sales transactions
DROP POLICY IF EXISTS "sales_transactions_select_all" ON public.sales_transactions;
CREATE POLICY "sales_transactions_select_all"
  ON public.sales_transactions FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "sales_transactions_insert_staff" ON public.sales_transactions;
CREATE POLICY "sales_transactions_insert_staff"
  ON public.sales_transactions FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "sales_transactions_update_staff" ON public.sales_transactions;
CREATE POLICY "sales_transactions_update_staff"
  ON public.sales_transactions FOR UPDATE
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "sales_transactions_delete_admin" ON public.sales_transactions;
CREATE POLICY "sales_transactions_delete_admin"
  ON public.sales_transactions FOR DELETE
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
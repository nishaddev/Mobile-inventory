-- Script to fix inventory RLS policies to allow INSERT operations

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "inventory_insert_staff" ON public.inventory;

-- Add INSERT policy for inventory table
CREATE POLICY "inventory_insert_staff"
  ON public.inventory FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Also ensure the products table has proper INSERT permissions
DROP POLICY IF EXISTS "products_insert_admin" ON public.products;
CREATE POLICY "products_insert_admin"
  ON public.products FOR INSERT
  WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
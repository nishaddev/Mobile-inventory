'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, Package, Plus, Search, TrendingUp } from 'lucide-react'
import Link from 'next/link'

interface Product {
  id: string
  name: string
  wholesale_price?: number
  retail_price?: number
}

interface Warehouse {
  id: string
  name: string
  location: string
}

export default function SalesPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [formData, setFormData] = useState({
    productId: '',
    warehouseId: '',
    transactionType: 'retail',
    quantity: '',
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      setLoading(true)

      try {
        // Fetch products
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('id, name, wholesale_price, retail_price')
          .order('name')

        if (productsError) throw productsError

        // Fetch warehouses
        const { data: warehousesData, error: warehousesError } = await supabase
          .from('warehouses')
          .select('id, name, location')
          .order('name')

        if (warehousesError) throw warehousesError

        setProducts(productsData || [])
        setWarehouses(warehousesData || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    try {
      if (!formData.productId || !formData.warehouseId || !formData.quantity) {
        throw new Error('Please fill in all required fields')
      }

      const quantity = Number.parseInt(formData.quantity)
      if (isNaN(quantity) || quantity <= 0) {
        throw new Error('Quantity must be a positive number')
      }

      const supabase = createClient()
      
      // Get the product to determine the unit price
      const product = products.find(p => p.id === formData.productId)
      if (!product) {
        throw new Error('Product not found')
      }

      const unitPrice = formData.transactionType === 'wholesale' 
        ? (product.wholesale_price || 0) 
        : (product.retail_price || 0)
      
      const totalAmount = unitPrice * quantity

      // Get the user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Create the sales transaction
      const { error: insertError } = await supabase.from('sales_transactions').insert({
        product_id: formData.productId,
        transaction_type: formData.transactionType,
        quantity: quantity,
        unit_price: unitPrice,
        total_amount: totalAmount,
        created_by: user.id,
      })

      if (insertError) throw insertError

      // Update inventory
      const { data: inventoryData, error: inventoryError } = await supabase
        .from('inventory')
        .select('quantity_on_hand, quantity_reserved')
        .eq('product_id', formData.productId)
        .eq('warehouse_id', formData.warehouseId)
        .single()

      if (inventoryError) throw inventoryError

      if (inventoryData.quantity_on_hand < quantity) {
        throw new Error('Insufficient inventory for this transaction')
      }

      const { error: updateError } = await supabase
        .from('inventory')
        .update({
          quantity_on_hand: inventoryData.quantity_on_hand - quantity,
        })
        .eq('product_id', formData.productId)
        .eq('warehouse_id', formData.warehouseId)

      if (updateError) throw updateError

      setSuccess('Sale recorded successfully!')
      setFormData({
        productId: '',
        warehouseId: '',
        transactionType: 'retail',
        quantity: '',
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading sales data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Sales</h1>
            <p className="text-muted-foreground mt-2">Record product sales transactions</p>
          </div>
          <div className="flex gap-2">
            <Link href="/dashboard/products">
              <Button variant="outline" className="gap-2">
                <Package className="w-4 h-4" />
                Products
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex gap-3 rounded-lg bg-red-50 dark:bg-red-950 p-4 text-sm text-red-700 dark:text-red-200">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="flex gap-3 rounded-lg bg-green-50 dark:bg-green-950 p-4 text-sm text-green-700 dark:text-green-200">
          <TrendingUp className="w-5 h-5 shrink-0 mt-0.5" />
          <p>{success}</p>
        </div>
      )}

      {/* Sales Form */}
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Record New Sale</CardTitle>
          <CardDescription>Enter the details for a new sales transaction</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="productId">Product *</Label>
                <Select value={formData.productId} onValueChange={(value) => handleSelectChange("productId", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {products.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No products available. <Link href="/dashboard/products/new" className="text-primary hover:underline">Create one first</Link>.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="warehouseId">Warehouse *</Label>
                <Select value={formData.warehouseId} onValueChange={(value) => handleSelectChange("warehouseId", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a warehouse" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map((warehouse) => (
                      <SelectItem key={warehouse.id} value={warehouse.id}>
                        {warehouse.name} ({warehouse.location})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {warehouses.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No warehouses available.
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="transactionType">Transaction Type *</Label>
                <Select value={formData.transactionType} onValueChange={(value) => handleSelectChange("transactionType", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select transaction type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="retail">Retail</SelectItem>
                    <SelectItem value="wholesale">Wholesale</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity *</Label>
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  placeholder="0"
                  value={formData.quantity}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="flex gap-4 pt-6">
              <Button type="submit" className="flex-1 md:flex-none">
                <Plus className="w-4 h-4 mr-2" />
                Record Sale
              </Button>
              <Button type="button" variant="outline" className="flex-1 md:flex-none">
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
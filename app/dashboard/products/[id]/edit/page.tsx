"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, AlertCircle, Loader2 } from "lucide-react"
import Link from "next/link"

export default function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const router = useRouter()
  const supabase = createClient()
  const paramsPromise = params

  const [id, setId] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingForm, setIsLoadingForm] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [categories, setCategories] = useState<any[]>([])
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [productWarehouses, setProductWarehouses] = useState<any[]>([])
  const [newWarehouse, setNewWarehouse] = useState({ id: "", quantity: "" })

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    categoryId: "",
    purchasePrice: "",
    retailPrice: "",
    wholesalePrice: "",
    unit: "1",
  })

  useEffect(() => {
    const loadData = async () => {
      const { id: productId } = await paramsPromise
      setId(productId)

      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase.from("categories").select("id, name").order("name")

      if (categoriesError) {
        console.error("Error fetching categories:", categoriesError)
      }
      
      if (categoriesData) {
        setCategories(categoriesData)
      }

      // Fetch warehouses
      const { data: warehousesData, error: warehousesError } = await supabase.from("warehouses").select("id, name, location").order("name")

      if (warehousesError) {
        console.error("Error fetching warehouses:", warehousesError)
      }
      
      if (warehousesData) {
        setWarehouses(warehousesData)
      }

      // Fetch product
      const { data: product } = await supabase.from("products").select("*").eq("id", productId).single()

      if (product) {
        setFormData({
          name: product.name,
          description: product.description || "",
          categoryId: product.category_id,
          purchasePrice: product.purchase_price.toString(),
          retailPrice: product.retail_price?.toString() || "",
          wholesalePrice: product.wholesale_price?.toString() || "",
          unit: product.unit?.toString() || "1",
        })
      }

      // Fetch product's warehouse inventory data
      const { data: inventoryData, error: inventoryError } = await supabase
        .from("inventory")
        .select(`
          id,
          quantity_on_hand,
          warehouses (
            id,
            name
          )
        `)
        .eq("product_id", productId)

      if (inventoryError) {
        console.error("Error fetching inventory data:", inventoryError)
      }
      
      if (inventoryData) {
        setProductWarehouses(inventoryData)
      }

      setIsLoadingForm(false)
    }

    loadData()
  }, [paramsPromise])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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

  const handleWarehouseChange = (field: string, value: string) => {
    setNewWarehouse((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const addWarehouse = async () => {
    if (!newWarehouse.id || !newWarehouse.quantity) {
      setError("Please select a warehouse and enter a quantity")
      return
    }

    try {
      // Check if this warehouse is already assigned to the product
      const existing = productWarehouses.find(w => w.warehouses?.id === newWarehouse.id)
      if (existing) {
        setError("This warehouse is already assigned to this product")
        return
      }

      // Add new warehouse assignment
      const { data, error } = await supabase
        .from("inventory")
        .insert({
          product_id: id,
          warehouse_id: newWarehouse.id,
          quantity_on_hand: parseInt(newWarehouse.quantity),
          quantity_reserved: 0
        })
        .select(`
          id,
          quantity_on_hand,
          warehouses (
            id,
            name
          )
        `)
        .single()

      if (error) throw error

      setProductWarehouses([...productWarehouses, data])
      setNewWarehouse({ id: "", quantity: "" })
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add warehouse")
    }
  }

  const removeWarehouse = async (inventoryId: string) => {
    try {
      const { error } = await supabase
        .from("inventory")
        .delete()
        .eq("id", inventoryId)

      if (error) throw error

      setProductWarehouses(productWarehouses.filter(w => w.id !== inventoryId))
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove warehouse")
    }
  }

  const updateWarehouseQuantity = async (inventoryId: string, quantity: number) => {
    try {
      const { error } = await supabase
        .from("inventory")
        .update({ quantity_on_hand: quantity })
        .eq("id", inventoryId)

      if (error) throw error

      setProductWarehouses(productWarehouses.map(w => 
        w.id === inventoryId ? { ...w, quantity_on_hand: quantity } : w
      ))
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update quantity")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      if (
        !formData.name ||
        !formData.categoryId ||
        !formData.purchasePrice ||
        !formData.retailPrice ||
        !formData.unit
      ) {
        throw new Error("Please fill in all required fields")
      }

      const { error: updateError } = await supabase
        .from("products")
        .update({
          name: formData.name,
          description: formData.description,
          category_id: formData.categoryId,
          purchase_price: Number.parseFloat(formData.purchasePrice),
          retail_price: Number.parseFloat(formData.retailPrice),
          wholesale_price: formData.wholesalePrice ? Number.parseFloat(formData.wholesalePrice) : null,
          unit: Number.parseInt(formData.unit),
        })
        .eq("id", id)

      if (updateError) throw updateError

      router.push(`/dashboard/products/${id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoadingForm) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-8 p-4 md:p-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/products/${id}`}>
          <Button variant="outline" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Edit Product</h1>
          <p className="text-muted-foreground mt-2">Update product information</p>
        </div>
      </div>

      {/* Form Card */}
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Product Information</CardTitle>
          <CardDescription>Update the details for this product</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="flex gap-3 rounded-lg bg-red-50 dark:bg-red-950 p-4 text-sm text-red-700 dark:text-red-200">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="categoryId">Category *</Label>
                  <Link href="/dashboard/products/categories" className="text-sm text-primary hover:underline">
                    Manage Categories
                  </Link>
                </div>
                <Select value={formData.categoryId} onValueChange={(value) => handleSelectChange("categoryId", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {categories.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No categories available. <Link href="/dashboard/products/categories" className="text-primary hover:underline">Create one first</Link>.
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                name="name"
                placeholder="e.g., Premium Phone Case - iPhone 15"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                name="description"
                placeholder="Enter product description..."
                value={formData.description}
                onChange={handleChange}
                className="w-full min-h-20 px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="purchasePrice">Purchase Price ($) *</Label>
                <Input
                  id="purchasePrice"
                  name="purchasePrice"
                  type="number"
                  placeholder="0.00"
                  step="0.01"
                  value={formData.purchasePrice}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="retailPrice">Retail Price ($) *</Label>
                <Input
                  id="retailPrice"
                  name="retailPrice"
                  type="number"
                  placeholder="0.00"
                  step="0.01"
                  value={formData.retailPrice}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="wholesalePrice">Wholesale Price ($)</Label>
                <Input
                  id="wholesalePrice"
                  name="wholesalePrice"
                  type="number"
                  placeholder="0.00"
                  step="0.01"
                  value={formData.wholesalePrice}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">Unit</Label>
                <Input
                  id="unit"
                  name="unit"
                  type="number"
                  placeholder="1"
                  value={formData.unit}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Warehouse Management */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Warehouse Inventory</h3>
              
              {/* Add Warehouse Form */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="warehouseId">Warehouse</Label>
                  <Select value={newWarehouse.id} onValueChange={(value) => handleWarehouseChange("id", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a warehouse" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.map((warehouse) => (
                        <SelectItem key={warehouse.id} value={warehouse.id}>
                          {warehouse.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="warehouseQuantity">Quantity</Label>
                  <Input
                    id="warehouseQuantity"
                    type="number"
                    placeholder="0"
                    value={newWarehouse.quantity}
                    onChange={(e) => handleWarehouseChange("quantity", e.target.value)}
                  />
                </div>
                
                <div className="flex items-end">
                  <Button type="button" onClick={addWarehouse} className="w-full">
                    Add Warehouse
                  </Button>
                </div>
              </div>
              
              {/* Current Warehouses */}
              {productWarehouses.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="p-3 text-left">Warehouse</th>
                        <th className="p-3 text-left">Quantity</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productWarehouses.map((warehouse) => (
                        <tr key={warehouse.id} className="border-b border-muted">
                          <td className="p-3">{warehouse.warehouses?.name}</td>
                          <td className="p-3">
                            <Input
                              type="number"
                              value={warehouse.quantity_on_hand}
                              onChange={(e) => updateWarehouseQuantity(warehouse.id, parseInt(e.target.value) || 0)}
                              className="w-24"
                            />
                          </td>
                          <td className="p-3 text-right">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => removeWarehouse(warehouse.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              Remove
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="flex gap-4 pt-6">
              <Button type="submit" disabled={isLoading} className="flex-1 md:flex-none">
                {isLoading ? "Updating..." : "Update Product"}
              </Button>
              <Link href={`/dashboard/products/${id}`} className="flex-1 md:flex-none">
                <Button type="button" variant="outline" className="w-full bg-transparent">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useEffect } from "react"

export default function NewProductPage() {
  const router = useRouter()
  const supabase = createClient()

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [categories, setCategories] = useState<any[]>([])
  const [warehouses, setWarehouses] = useState<any[]>([])

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    categoryId: "",
    purchasePrice: "",
    retailPrice: "",
    wholesalePrice: "",
    quantity: "",
    unit: "1",
    warehouseId: "",
  })

  useEffect(() => {
    const fetchData = async () => {
      const [categoriesResponse, warehousesResponse] = await Promise.all([
        supabase.from("categories").select("id, name").order("name"),
        supabase.from("warehouses").select("id, name, location").order("name")
      ])

      if (categoriesResponse.data) {
        setCategories(categoriesResponse.data)
      }
      
      if (warehousesResponse.data) {
        setWarehouses(warehousesResponse.data)
      }
    }

    fetchData()
  }, [])

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      if (
        !formData.name ||
        !formData.categoryId ||
        !formData.warehouseId ||
        !formData.purchasePrice ||
        !formData.retailPrice ||
        !formData.quantity ||
        !formData.unit
      ) {
        throw new Error("Please fill in all required fields")
      }

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const { data: productData, error: insertError } = await supabase.from("products").insert({
        name: formData.name,
        description: formData.description,
        category_id: formData.categoryId,
        purchase_price: Number.parseFloat(formData.purchasePrice),
        retail_price: Number.parseFloat(formData.retailPrice),
        wholesale_price: formData.wholesalePrice ? Number.parseFloat(formData.wholesalePrice) : null,
        unit: Number.parseInt(formData.unit),
        created_by: user.id,
      }).select().single()

      if (insertError) throw insertError

      // Create inventory record for the selected warehouse
      const { error: inventoryError } = await supabase.from("inventory").insert({
        product_id: productData.id,
        warehouse_id: formData.warehouseId,
        quantity_on_hand: Number.parseInt(formData.quantity),
        quantity_reserved: 0
      })
      
      if (inventoryError) throw inventoryError

      router.push("/dashboard/products")
    } catch (err) {
      let errorMessage = "An error occurred";
      
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-8 p-4 md:p-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/products">
          <Button variant="outline" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Add New Product</h1>
          <p className="text-muted-foreground mt-2">Create a new product in your catalog</p>
        </div>
      </div>

      {/* Form Card */}
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Product Information</CardTitle>
          <CardDescription>Enter the details for your new product</CardDescription>
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
                    No warehouses available. <Link href="/dashboard/products/warehouses" className="text-primary hover:underline">Create one first</Link>.
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
                <Label htmlFor="quantity">Initial Quantity *</Label>
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

            <div className="flex gap-4 pt-6">
              <Button type="submit" disabled={isLoading} className="flex-1 md:flex-none">
                {isLoading ? "Creating..." : "Create Product"}
              </Button>
              <Link href="/dashboard/products" className="flex-1 md:flex-none">
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

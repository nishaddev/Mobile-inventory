"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"
import Link from "next/link"

interface InventoryItem {
  id: string
  quantity_on_hand: number
  quantity_reserved: number
  last_counted_at: string | null
  products: {
    id: string
    name: string
  } | null
  warehouses: {
    id: string
    name: string
    location: string
  } | null
}

export default function EditInventoryPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [inventoryItem, setInventoryItem] = useState<InventoryItem | null>(null)
  const [loading, setLoading] = useState(true)

  const [formData, setFormData] = useState({
    quantity_on_hand: 0,
    quantity_reserved: 0,
    last_counted_at: "",
  })

  useEffect(() => {
    if (params.id) {
      fetchInventoryItem()
    }
  }, [params.id])

  const fetchInventoryItem = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("inventory")
        .select(`
          id,
          quantity_on_hand,
          quantity_reserved,
          last_counted_at,
          products (
            id,
            name
          ),
          warehouses (
            id,
            name,
            location
          )
        `)
        .eq("id", params.id)
        .single()

      if (error) throw error

      // Transform the data
      const transformedData: InventoryItem = {
        id: data.id,
        quantity_on_hand: data.quantity_on_hand,
        quantity_reserved: data.quantity_reserved,
        last_counted_at: data.last_counted_at,
        products: data.products?.[0] ? {
          id: data.products[0].id,
          name: data.products[0].name
        } : null,
        warehouses: data.warehouses?.[0] ? {
          id: data.warehouses[0].id,
          name: data.warehouses[0].name,
          location: data.warehouses[0].location
        } : null
      }

      setInventoryItem(transformedData)
      setFormData({
        quantity_on_hand: data.quantity_on_hand,
        quantity_reserved: data.quantity_reserved,
        last_counted_at: data.last_counted_at ? data.last_counted_at.split('T')[0] : "",
      })
    } catch (err) {
      console.error("Error fetching inventory item:", err)
      setError("Failed to load inventory item")
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'quantity_on_hand' || name === 'quantity_reserved' ? Number(value) : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      if (!inventoryItem) {
        throw new Error("Inventory item not loaded")
      }

      const { error: updateError } = await supabase
        .from("inventory")
        .update({
          quantity_on_hand: formData.quantity_on_hand,
          quantity_reserved: formData.quantity_reserved,
          last_counted_at: formData.last_counted_at || null,
          updated_at: new Date(),
        })
        .eq("id", inventoryItem.id)

      if (updateError) throw updateError

      router.push(`/dashboard/inventory/${inventoryItem.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading inventory item...</p>
        </div>
      </div>
    )
  }

  if (error || !inventoryItem) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-3 max-w-md">
          <div className="w-12 h-12 mx-auto bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Error Loading Inventory</h3>
          <p className="text-muted-foreground">
            {error || "The inventory item you're trying to edit doesn't exist or you don't have permission to view it."}
          </p>
          <Button onClick={() => router.push("/dashboard/inventory")} className="mt-4">
            Back to Inventory
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 p-4 md:p-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/inventory/${inventoryItem.id}`}>
          <Button variant="outline">Back</Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Edit Inventory</h1>
          <p className="text-muted-foreground mt-2">Modify inventory details</p>
        </div>
      </div>

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Item</CardTitle>
          <CardDescription>Product and warehouse information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Product</p>
              <p className="font-semibold">{inventoryItem.products?.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Warehouse</p>
              <p className="font-semibold">{inventoryItem.warehouses?.name}</p>
              <p className="text-xs text-muted-foreground">{inventoryItem.warehouses?.location}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form Card */}
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Edit Inventory Details</CardTitle>
          <CardDescription>Update inventory quantities and information</CardDescription>
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
                <Label htmlFor="quantity_on_hand">Quantity On Hand *</Label>
                <Input
                  id="quantity_on_hand"
                  name="quantity_on_hand"
                  type="number"
                  value={formData.quantity_on_hand}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity_reserved">Quantity Reserved</Label>
                <Input
                  id="quantity_reserved"
                  name="quantity_reserved"
                  type="number"
                  value={formData.quantity_reserved}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="last_counted_at">Last Counted At</Label>
              <Input
                id="last_counted_at"
                name="last_counted_at"
                type="date"
                value={formData.last_counted_at}
                onChange={handleChange}
              />
            </div>

            <div className="flex gap-4 pt-6">
              <Button type="submit" disabled={isLoading} className="flex-1 md:flex-none">
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
              <Link href={`/dashboard/inventory/${inventoryItem.id}`} className="flex-1 md:flex-none">
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
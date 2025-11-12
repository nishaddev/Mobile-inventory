"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, Package, Warehouse, TrendingUp } from "lucide-react"

interface InventoryItem {
  id: string
  quantity_on_hand: number
  quantity_reserved: number
  last_counted_at: string | null
  created_at: string
  updated_at: string
  products: {
    id: string
    name: string
    description: string | null
    purchase_price: number
    retail_price: number
  } | null
  warehouses: {
    id: string
    name: string
    location: string
  } | null
}

export default function InventoryDetailPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  
  const [inventoryItem, setInventoryItem] = useState<InventoryItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
          created_at,
          updated_at,
          products (
            id,
            name,
            description,
            purchase_price,
            retail_price
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
        created_at: data.created_at,
        updated_at: data.updated_at,
        products: data.products?.[0] ? {
          id: data.products[0].id,
          name: data.products[0].name,
          description: data.products[0].description,
          purchase_price: data.products[0].purchase_price,
          retail_price: data.products[0].retail_price
        } : null,
        warehouses: data.warehouses?.[0] ? {
          id: data.warehouses[0].id,
          name: data.warehouses[0].name,
          location: data.warehouses[0].location
        } : null
      }

      setInventoryItem(transformedData)
    } catch (err) {
      console.error("Error fetching inventory item:", err)
      setError("Failed to load inventory item")
    } finally {
      setLoading(false)
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
            <Package className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Inventory Item Not Found</h3>
          <p className="text-muted-foreground">
            {error || "The inventory item you're looking for doesn't exist or you don't have permission to view it."}
          </p>
          <Button onClick={() => router.push("/dashboard/inventory")} className="mt-4">
            Back to Inventory
          </Button>
        </div>
      </div>
    )
  }

  const available = inventoryItem.quantity_on_hand - inventoryItem.quantity_reserved
  const isLowStock = false

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this inventory record? This action cannot be undone.")) {
      try {
        const { error } = await supabase
          .from("inventory")
          .delete()
          .eq("id", inventoryItem.id)

        if (error) throw error

        router.push("/dashboard/inventory")
      } catch (err) {
        console.error("Error deleting inventory item:", err)
        alert("Failed to delete inventory item")
      }
    }
  }

  return (
    <div className="space-y-8 p-4 md:p-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/inventory">
          <Button variant="outline" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Inventory Details</h1>
          <p className="text-muted-foreground mt-2">View detailed information for this inventory item</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Information */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Product Information</CardTitle>
            <CardDescription>Details about the product in this inventory</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <h3 className="text-xl font-semibold">{inventoryItem.products?.name}</h3>
                {inventoryItem.products?.description && (
                  <p className="text-muted-foreground mt-2">{inventoryItem.products.description}</p>
                )}
              </div>
              <Link href={`/dashboard/products/${inventoryItem.products?.id}`}>
                <Button variant="outline">View Product</Button>
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Purchase Price</p>
                <p className="text-lg font-semibold">${inventoryItem.products?.purchase_price.toFixed(2)}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Retail Price</p>
                <p className="text-lg font-semibold">${inventoryItem.products?.retail_price.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Warehouse Information */}
        <Card>
          <CardHeader>
            <CardTitle>Warehouse</CardTitle>
            <CardDescription>Location details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <Warehouse className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-semibold">{inventoryItem.warehouses?.name}</p>
                  <p className="text-sm text-muted-foreground">{inventoryItem.warehouses?.location}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stock Levels */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Stock Levels</CardTitle>
            <CardDescription>Current inventory status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <p className="text-sm font-medium">On Hand</p>
                </div>
                <p className="text-2xl font-bold">{inventoryItem.quantity_on_hand}</p>
              </div>
              
              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <p className="text-sm font-medium">Reserved</p>
                </div>
                <p className="text-2xl font-bold">{inventoryItem.quantity_reserved}</p>
              </div>
              
              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <p className="text-sm font-medium">Available</p>
                </div>
                <p className={`text-2xl font-bold`}>
                  {available}
                </p>
              </div>
              
              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Warehouse className="w-4 h-4 text-foreground" />
                  <p className="text-sm font-medium">Status</p>
                </div>
                <p className={`text-lg font-bold ${isLowStock ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'}`}>
                  {isLowStock ? 'Low Stock' : 'In Stock'}
                </p>
              </div>
            </div>
            
            <div className="flex justify-center gap-3 mt-6">
              <Link href={`/dashboard/inventory/${inventoryItem.id}/edit`}>
                <Button variant="outline" className="mr-2">Edit Details</Button>
              </Link>
              <Button variant="destructive" onClick={handleDelete}>Delete Inventory</Button>
            </div>
          </CardContent>
        </Card>

        {/* Metadata */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Metadata</CardTitle>
            <CardDescription>Inventory record information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="font-medium">
                  {new Date(inventoryItem.created_at).toLocaleDateString()}{' '}
                  {new Date(inventoryItem.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Updated</p>
                <p className="font-medium">
                  {new Date(inventoryItem.updated_at).toLocaleDateString()}{' '}
                  {new Date(inventoryItem.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Counted</p>
                <p className="font-medium">
                  {inventoryItem.last_counted_at 
                    ? `${new Date(inventoryItem.last_counted_at).toLocaleDateString()} ${new Date(inventoryItem.last_counted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                    : 'Never'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { Plus, Warehouse, AlertTriangle, TrendingUp, Search } from "lucide-react"

interface InventoryItem {
  id: string
  quantity_on_hand: number
  quantity_reserved: number
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

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [filteredInventory, setFilteredInventory] = useState<InventoryItem[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchInventory()
  }, [])

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredInventory(inventory)
    } else {
      const query = searchQuery.toLowerCase()
      setFilteredInventory(
        inventory.filter(
          (item) =>
            item.products?.name.toLowerCase().includes(query) ||
            item.warehouses?.name.toLowerCase().includes(query),
        ),
      )
    }
  }, [searchQuery, inventory])

  const fetchInventory = async () => {
    const supabase = createClient()
    setLoading(true)

    const { data, error } = await supabase
      .from("inventory")
      .select(`
        id,
        quantity_on_hand,
        quantity_reserved,
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
      .order("updated_at", { ascending: false })

    if (error) {
      console.error("Error fetching inventory:", error)
      setInventory([])
    } else {
      // Transform the data to match our InventoryItem interface
      const transformedData = data?.map((item: any) => ({
        ...item,
        products: item.products?.[0] || null,
        warehouses: item.warehouses?.[0] || null
      })) || []
      setInventory(transformedData)
    }
    setLoading(false)
  }

  // Calculate summary stats
  const totalUnitsOnHand = inventory?.reduce((sum, item) => sum + item.quantity_on_hand, 0) || 0
  const totalUnitsReserved = inventory?.reduce((sum, item) => sum + item.quantity_reserved, 0) || 0
  const lowStockItems = 0

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading inventory...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Inventory</h1>
          <p className="text-muted-foreground mt-2">Track stock levels across warehouses</p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Units On Hand</CardTitle>
            <Warehouse className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUnitsOnHand}</div>
            <p className="text-xs text-muted-foreground mt-1">Across all warehouses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Units Reserved</CardTitle>
            <TrendingUp className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUnitsReserved}</div>
            <p className="text-xs text-muted-foreground mt-1">Pending orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
            <AlertTriangle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowStockItems}</div>
            <p className="text-xs text-muted-foreground mt-1">Below reorder level</p>
          </CardContent>
        </Card>
      </div>

      {/* Search functionality */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by product name or warehouse..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle>Stock Levels by Warehouse</CardTitle>
          <CardDescription>
            {filteredInventory.length} of {inventory.length} inventory records
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredInventory && filteredInventory.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border">
                  <tr className="text-left">
                    <th className="pb-3 font-semibold text-foreground">Product</th>
                    <th className="pb-3 font-semibold text-foreground">Warehouse</th>
                    <th className="pb-3 font-semibold text-foreground text-right">On Hand</th>
                    <th className="pb-3 font-semibold text-foreground text-right">Available</th>
                    <th className="pb-3 font-semibold text-foreground pl-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInventory.map((item) => {
                    const available = item.quantity_on_hand - item.quantity_reserved

                    return (
                      <tr key={item.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                        <td className="py-3">
                          <Link
                            href={`/dashboard/products/${item.products?.id}`}
                            className="text-primary hover:underline font-medium"
                          >
                            {item.products?.name}
                          </Link>
                        </td>
                        <td className="py-3">
                          <div>
                            <p className="font-medium">{item.warehouses?.name}</p>
                            <p className="text-xs text-muted-foreground">{item.warehouses?.location}</p>
                          </div>
                        </td>
                        <td className="py-3 text-right font-semibold">{item.quantity_on_hand}</td>
                        <td className="py-3 text-right font-semibold text-green-600 dark:text-green-400">
                          {available}
                        </td>
                        <td className="py-3 pl-4">
                          <Link href={`/dashboard/inventory/${item.id}/edit`}>
                            <Button variant="ghost" size="sm">
                              Edit
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center">
              <Warehouse className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground">
                {inventory.length === 0 ? "No inventory records" : "No results match your search"}
              </h3>
              <p className="text-muted-foreground mt-2">
                {inventory.length === 0 ? "Create products to add inventory" : "Try adjusting your search filters"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

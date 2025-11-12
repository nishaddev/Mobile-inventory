import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, Warehouse, TrendingUp, AlertTriangle } from "lucide-react"
import { DashboardCharts } from "./components/dashboard-charts"

export const metadata = {
  title: "Dashboard - InventoryHub",
}

export default async function DashboardPage() {
  const supabase = await createClient()

  // Fetch data
  const { data: inventoryData } = await supabase.from("inventory").select("quantity_on_hand, quantity_reserved")
  const { data: productsData } = await supabase.from("products").select("id, retail_price, purchase_price")
  const { data: warehousesData } = await supabase.from("warehouses").select("id")

  const totalProducts = productsData?.length || 0
  const totalWarehouses = warehousesData?.length || 0
  const totalInventoryValue = inventoryData?.reduce((sum, item) => sum + (item.quantity_on_hand || 0), 0) || 0
  const totalInventoryReserved = inventoryData?.reduce((sum, item) => sum + (item.quantity_reserved || 0), 0) || 0

  // Calculate total inventory cost and value
  const totalCost = productsData?.reduce((sum, item) => sum + (item.purchase_price || 0), 0) || 0
  const totalRetail = productsData?.reduce((sum, item) => sum + (item.retail_price || 0), 0) || 0
  const profitMargin = totalCost > 0 ? (((totalRetail - totalCost) / totalCost) * 100).toFixed(1) : "0"

  return (
    <div className="flex-1 space-y-8 p-4 md:p-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400 bg-clip-text text-transparent">
          Dashboard
        </h1>
        <p className="text-muted-foreground mt-2">Welcome back! Here's your inventory overview.</p>
      </div>

      <DashboardCharts 
        totalInventoryValue={totalInventoryValue}
        totalInventoryReserved={totalInventoryReserved}
        totalProducts={totalProducts}
        totalWarehouses={totalWarehouses}
        totalCost={totalCost}
        totalRetail={totalRetail}
        profitMargin={profitMargin}
      />

      {/* Quick Actions */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-purple-500/10 to-blue-500/10">
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
          <CardDescription>Quick actions to manage your inventory</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="/dashboard/products"
              className="p-4 rounded-lg border border-transparent bg-card hover:border-primary hover:shadow-lg transition-all group cursor-pointer"
            >
              <Package className="w-6 h-6 mb-2 text-primary group-hover:scale-110 transition-transform" />
              <h3 className="font-semibold text-foreground">Add Products</h3>
              <p className="text-sm text-muted-foreground">Create and manage products</p>
            </a>
            <a
              href="/dashboard/inventory"
              className="p-4 rounded-lg border border-transparent bg-card hover:border-primary hover:shadow-lg transition-all group cursor-pointer"
            >
              <Warehouse className="w-6 h-6 mb-2 text-primary group-hover:scale-110 transition-transform" />
              <h3 className="font-semibold text-foreground">Update Inventory</h3>
              <p className="text-sm text-muted-foreground">Track stock levels</p>
            </a>
            <a
              href="/dashboard/analytics"
              className="p-4 rounded-lg border border-transparent bg-card hover:border-primary hover:shadow-lg transition-all group cursor-pointer"
            >
              <TrendingUp className="w-6 h-6 mb-2 text-primary group-hover:scale-110 transition-transform" />
              <h3 className="font-semibold text-foreground">View Analytics</h3>
              <p className="text-sm text-muted-foreground">See reports and insights</p>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

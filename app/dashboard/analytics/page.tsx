import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, TrendingUp, Package, Warehouse } from "lucide-react"

export const metadata = {
  title: "Analytics - InventoryHub",
}

export default async function AnalyticsPage() {
  const supabase = await createClient()

  // Fetch inventory analytics
  const { data: inventory } = await supabase.from("inventory").select(`
      id,
      quantity_on_hand,
      quantity_reserved,
      products (
        id,
        name,
        purchase_price,
        retail_price
      )
    `)

  // Calculate metrics
  const totalInventoryValue =
    inventory?.reduce((sum, item) => sum + (item.products?.[0]?.purchase_price || 0) * item.quantity_on_hand, 0) || 0

  const totalRetailValue =
    inventory?.reduce((sum, item) => sum + (item.products?.[0]?.retail_price || 0) * item.quantity_on_hand, 0) || 0

  const potentialProfit = totalRetailValue - totalInventoryValue

  return (
    <div className="space-y-8 p-4 md:p-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
        <p className="text-muted-foreground mt-2">Inventory insights and reports</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inventory Cost</CardTitle>
            <Package className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalInventoryValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">At cost price</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Retail Value</CardTitle>
            <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRetailValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">At selling price</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Potential Profit</CardTitle>
            <BarChart3 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">${potentialProfit.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">If all sold</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
            <Warehouse className="w-4 h-4 text-orange-600 dark:text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalRetailValue > 0 ? ((potentialProfit / totalRetailValue) * 100).toFixed(1) : "0"}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">Average margin</p>
          </CardContent>
        </Card>
      </div>

      {/* Transaction Summary */}
      
      {/* Transaction Type Breakdown */}
    </div>
  )
}

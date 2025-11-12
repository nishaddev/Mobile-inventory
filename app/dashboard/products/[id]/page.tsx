import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, Edit2 } from "lucide-react"

export const metadata = {
  title: "Product Details - InventoryHub",
}

export const dynamicParams = true

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const supabase = await createClient()
  const { id } = await params

  if (!id || id === "new") {
    notFound()
  }

  const { data: product } = await supabase
    .from("products")
    .select(`
      id,
      name,
      description,
      purchase_price,
      retail_price,
      wholesale_price,
      unit,
      wholesale_sold,
      retail_sold,
      created_at,
      category_id,
      categories (
        id,
        name
      )
    `)
    .eq("id", id)
    .single()

  if (!product) {
    notFound()
  }

  // Fetch inventory for this product across all warehouses
  const { data: inventoryData } = await supabase
    .from("inventory")
    .select(`
      id,
      quantity_on_hand,
      quantity_reserved,
      warehouses (
        id,
        name,
        location
      )
    `)
    .eq("product_id", id)

  const totalStock = inventoryData?.reduce((sum, item) => sum + item.quantity_on_hand, 0) || 0

  const profitMargin = product.retail_price ? (((product.retail_price - product.purchase_price) / product.purchase_price) * 100).toFixed(1) : "N/A"

  return (
    <div className="space-y-8 p-4 md:p-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/products">
          <Button variant="outline" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-foreground">{product.name}</h1>
          <p className="text-muted-foreground mt-2">SL No: {id}</p>
        </div>
        <Link href={`/dashboard/products/${id}/edit`}>
          <Button className="gap-2">
            <Edit2 className="w-4 h-4" />
            Edit
          </Button>
        </Link>
      </div>

      {/* Product Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Category</p>
              <p className="text-lg font-semibold">{product.categories?.[0]?.name || "Uncategorized"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Unit</p>
              <p className="text-lg font-mono font-semibold">{product.unit || 1}</p>
            </div>
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pricing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Purchase Price</p>
              <p className="text-lg font-semibold">${product.purchase_price.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Retail Price</p>
              <p className="text-lg font-semibold">${product.retail_price?.toFixed(2) || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Wholesale Price</p>
              <p className="text-lg font-semibold">${product.wholesale_price?.toFixed(2) || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Profit Margin</p>
              <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                {product.retail_price ? (((product.retail_price - product.purchase_price) / product.purchase_price) * 100).toFixed(1) : "N/A"}%
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Stock */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Stock Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Stock</p>
              <p className="text-lg font-semibold">{totalStock} units</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Stock Status</p>
              <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                In Stock
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Sales Tracking */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Sales Tracking</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Wholesale Sold</p>
              <p className="text-lg font-semibold">{product.wholesale_sold || 0} units</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Retail Sold</p>
              <p className="text-lg font-semibold">{product.retail_sold || 0} units</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Description */}
      {product.description && (
        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground">{product.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Warehouse Inventory */}
      <Card>
        <CardHeader>
          <CardTitle>Warehouse Inventory</CardTitle>
          <CardDescription>Stock levels across all warehouses</CardDescription>
        </CardHeader>
        <CardContent>
          {inventoryData && inventoryData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border">
                  <tr className="text-left">
                    <th className="pb-3 font-semibold">Warehouse</th>
                    <th className="pb-3 font-semibold">Location</th>
                    <th className="pb-3 font-semibold text-right">On Hand</th>
                    <th className="pb-3 font-semibold text-right">Reserved</th>
                    <th className="pb-3 font-semibold text-right">Available</th>
                  </tr>
                </thead>
                <tbody>
                  {inventoryData.map((inv: any) => (
                    <tr key={inv.id} className="border-b border-border">
                      <td className="py-3 font-medium">{inv.warehouses?.name}</td>
                      <td className="py-3 text-muted-foreground">{inv.warehouses?.location}</td>
                      <td className="py-3 text-right font-semibold">{inv.quantity_on_hand}</td>
                      <td className="py-3 text-right text-muted-foreground">{inv.quantity_reserved}</td>
                      <td className="py-3 text-right font-semibold text-green-600 dark:text-green-400">
                        {inv.quantity_on_hand - inv.quantity_reserved}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted-foreground">No inventory records found for this product.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

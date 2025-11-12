"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, Package, Plus, Edit2, Trash2, AlertCircle } from "lucide-react"
import Link from "next/link"

interface Product {
  id: string
  name: string
  description: string
  purchase_price: number
  wholesale_price?: number
  retail_price?: number
  unit: number
  created_at: string
  categories: { id: string; name: string } | null
  total_quantity: number
  wholesale_sold: number
  retail_sold: number
  warehouses: { id: string; name: string }[]
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchProducts()
  }, [])

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredProducts(products)
    } else {
      const query = searchQuery.toLowerCase()
      setFilteredProducts(
        products.filter(
          (p) =>
            p.name.toLowerCase().includes(query) ||
            p.categories?.name.toLowerCase().includes(query),
        ),
      )
    }
  }, [searchQuery, products])

  const fetchProducts = async () => {
    const supabase = createClient()
    setLoading(true)

    // First fetch products
    const { data: productsData, error: productsError } = await supabase
      .from("products")
      .select(`
        id,
        name,
        description,
        purchase_price,
        wholesale_price,
        retail_price,
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
      .order("created_at", { ascending: false })

    if (productsError) {
      console.error("Error fetching products:", productsError)
      setProducts([])
      setLoading(false)
      return
    }

    // For each product, fetch the total quantity from inventory and warehouse info
    const productsWithInventory = await Promise.all(
      productsData.map(async (product: any) => {
        // Fetch inventory data with warehouse info
        const { data: inventoryData, error: inventoryError } = await supabase
          .from("inventory")
          .select(`
            quantity_on_hand,
            warehouses (
              id,
              name
            )
          `)
          .eq("product_id", product.id)

        let totalQuantity = 0
        let warehouses: { id: string; name: string }[] = []
        
        if (!inventoryError && inventoryData) {
          totalQuantity = inventoryData.reduce((sum, item) => sum + item.quantity_on_hand, 0)
          warehouses = inventoryData
            .map((item: any) => item.warehouses)
            .filter((warehouse: any) => warehouse !== null)
        }

        // Fetch sales data for this product
        const { data: salesData, error: salesError } = await supabase
          .from("sales_transactions")
          .select("transaction_type, quantity")
          .eq("product_id", product.id)

        let wholesaleSold = 0
        let retailSold = 0
        
        if (!salesError && salesData) {
          wholesaleSold = salesData
            .filter((sale: any) => sale.transaction_type === 'wholesale')
            .reduce((sum, sale) => sum + sale.quantity, 0)
          
          retailSold = salesData
            .filter((sale: any) => sale.transaction_type === 'retail')
            .reduce((sum, sale) => sum + sale.quantity, 0)
        }

        return {
          ...product,
          total_quantity: totalQuantity,
          wholesale_sold: wholesaleSold,
          retail_sold: retailSold,
          categories: product.categories || null,
          warehouses: warehouses
        }
      })
    )

    setProducts(productsWithInventory)
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    try {
      const supabase = createClient()
      
      // First, delete all inventory records for this product
      const { error: inventoryDeleteError } = await supabase
        .from("inventory")
        .delete()
        .eq("product_id", id)
      
      if (inventoryDeleteError) throw inventoryDeleteError
      
      // Then delete the product itself
      const { error: productDeleteError } = await supabase
        .from("products")
        .delete()
        .eq("id", id)
      
      if (productDeleteError) {
        if (productDeleteError.message.includes("new row violates row-level security policy")) {
          throw new Error("You don't have permission to delete products. Only admin users can delete products.")
        }
        throw productDeleteError
      }
      
      // Remove the product from the state
      setProducts(products.filter(product => product.id !== id))
      setFilteredProducts(filteredProducts.filter(product => product.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete product")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading products...</p>
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
            <h1 className="text-3xl font-bold text-foreground">Products</h1>
            <p className="text-muted-foreground mt-2">Manage your mobile accessories inventory</p>
          </div>
          <div className="flex gap-2">
            <Link href="/dashboard/products/categories">
              <Button variant="outline" className="gap-2">
                <Package className="w-4 h-4" />
                Categories
              </Button>
            </Link>
            <Link href="/dashboard/products/new">
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Add Product
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

      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Product Catalog</CardTitle>
          <CardDescription>
            {filteredProducts.length} of {products.length} products
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredProducts && filteredProducts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border">
                  <tr className="text-left">
                    <th className="pb-3 font-semibold text-foreground">SL No.</th>
                    <th className="pb-3 font-semibold text-foreground">Date</th>
                    <th className="pb-3 font-semibold text-foreground">Product Name</th>
                    <th className="pb-3 font-semibold text-foreground">Category</th>
                    <th className="pb-3 font-semibold text-foreground">Warehouse</th>
                    <th className="pb-3 font-semibold text-foreground">Unit</th>
                    <th className="pb-3 font-semibold text-foreground">Purchase Price</th>
                    <th className="pb-3 font-semibold text-foreground">Wholesale Price</th>
                    <th className="pb-3 font-semibold text-foreground">Retail Price</th>
                    <th className="pb-3 font-semibold text-foreground">Quantity</th>
                    <th className="pb-3 font-semibold text-foreground">Wholesale</th>
                    <th className="pb-3 font-semibold text-foreground">Retail Sale</th>
                    <th className="pb-3 font-semibold text-foreground">Total Purchase</th>
                    <th className="pb-3 font-semibold text-foreground">Total Wholesale</th>
                    <th className="pb-3 font-semibold text-foreground">Total Retail</th>
                    <th className="pb-3 font-semibold text-foreground">Wholesale Profit</th>
                    <th className="pb-3 font-semibold text-foreground">Retail Profit</th>
                    <th className="pb-3 font-semibold text-foreground">Margin %</th>
                    <th className="pb-3 font-semibold text-foreground">Edit</th>
                    <th className="pb-3 font-semibold text-foreground">Delete</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product, index) => {
                    // Calculate all the required fields
                    const totalPurchase = product.purchase_price * product.total_quantity;
                    const totalWholesale = (product.wholesale_price || 0) * product.total_quantity;
                    const totalRetail = (product.retail_price || 0) * product.total_quantity;
                    const wholesaleProfit = ((product.wholesale_price || 0) - product.purchase_price) * product.total_quantity;
                    const retailProfit = ((product.retail_price || 0) - product.purchase_price) * product.total_quantity;
                    const marginPercent = product.retail_price ? 
                      (((product.retail_price - product.purchase_price) / product.retail_price) * 100) : 0;
                    
                    return (
                    <tr key={product.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                      <td className="py-3 text-muted-foreground font-mono text-xs">{index + 1}</td>
                      <td className="py-3 text-muted-foreground text-xs">
                        {new Date(product.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3">
                        <Link
                          href={`/dashboard/products/${product.id}`}
                          className="text-primary hover:underline font-medium"
                        >
                          {product.name}
                        </Link>
                      </td>
                      <td className="py-3 text-muted-foreground">{product.categories?.name || "Uncategorized"}</td>
                      <td className="py-3 text-muted-foreground">
                        {product.warehouses.map(w => w.name).join(", ") || "No warehouse"}
                      </td>
                      <td className="py-3">1</td>
                      <td className="py-3">${product.purchase_price.toFixed(2)}</td>
                      <td className="py-3 font-semibold">${product.wholesale_price?.toFixed(2) || "N/A"}</td>
                      <td className="py-3 font-semibold">${product.retail_price?.toFixed(2) || "N/A"}</td>
                      <td className="py-3">{product.total_quantity}</td>
                      <td className="py-3 font-semibold">{product.wholesale_sold}</td>
                      <td className="py-3 font-semibold">{product.retail_sold}</td>
                      <td className="py-3 font-semibold">${totalPurchase.toFixed(2)}</td>
                      <td className="py-3 font-semibold">${totalWholesale.toFixed(2)}</td>
                      <td className="py-3 font-semibold">${totalRetail.toFixed(2)}</td>
                      <td className="py-3 font-semibold">${wholesaleProfit.toFixed(2)}</td>
                      <td className="py-3 font-semibold">${retailProfit.toFixed(2)}</td>
                      <td className="py-3">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300 font-medium text-xs">
                          {marginPercent.toFixed(2)}%
                        </span>
                      </td>
                      <td className="py-3">
                        <Link href={`/dashboard/products/${product.id}/edit`}>
                          <Button variant="ghost" size="sm" className="gap-1">
                            <Edit2 className="w-4 h-4" />
                            <span className="hidden sm:inline">Edit</span>
                          </Button>
                        </Link>
                      </td>
                      <td className="py-3">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-destructive hover:text-destructive gap-1"
                          onClick={() => handleDelete(product.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="hidden sm:inline">Delete</span>
                        </Button>
                      </td>
                    </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center">
              <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground">
                {products.length === 0 ? "No products yet" : "No products match your search"}
              </h3>
              <p className="text-muted-foreground mt-2">
                {products.length === 0
                  ? "Create your first product to get started"
                  : "Try adjusting your search filters"}
              </p>
              {products.length === 0 && (
                <Link href="/dashboard/products/new" className="mt-4 inline-block">
                  <Button>Create Product</Button>
                </Link>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

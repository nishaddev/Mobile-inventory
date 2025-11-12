import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, Edit2, Trash2 } from "lucide-react"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

export const metadata = {
  title: "Warehouse Management - InventoryHub",
}

export default async function WarehouseManagementPage({
  searchParams
}: {
  searchParams: { message?: string }
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return redirect("/login")
  }

  // Check if user is admin
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  
  if (profile?.role !== "admin") {
    return redirect("/dashboard")
  }

  // Fetch warehouses
  const { data: warehouses, error } = await supabase
    .from("warehouses")
    .select("*")
    .order("created_at", { ascending: false })

  // Handle form submission for creating/updating warehouses
  const handleSubmit = async (formData: FormData) => {
    "use server"
    
    const supabase = await createClient()
    
    const id = formData.get("id") as string
    const name = formData.get("name") as string
    const location = formData.get("location") as string
    
    if (id) {
      // Update existing warehouse
      const { error } = await supabase
        .from("warehouses")
        .update({ name, location })
        .eq("id", id)
        
      if (error) {
        console.error("Error updating warehouse:", error)
        revalidatePath("/dashboard/inventory/warehouses", "page")
        return
      }
    } else {
      // Create new warehouse
      const { error } = await supabase
        .from("warehouses")
        .insert({ name, location, created_by: user.id })
        
      if (error) {
        console.error("Error creating warehouse:", error)
        revalidatePath("/dashboard/inventory/warehouses", "page")
        return
      }
    }
    
    revalidatePath("/dashboard/inventory/warehouses", "page")
  }

  // Handle warehouse deletion
  const handleDelete = async (formData: FormData) => {
    "use server"
    
    const supabase = await createClient()
    
    const id = formData.get("id") as string
    
    // Check if warehouse has any inventory items
    const { data: inventoryItems } = await supabase
      .from("inventory")
      .select("id")
      .eq("warehouse_id", id)
      .limit(1)
    
    if (inventoryItems && inventoryItems.length > 0) {
      console.error("Cannot delete warehouse with existing inventory items")
      revalidatePath("/dashboard/inventory/warehouses", "page")
      return
    }
    
    const { error } = await supabase
      .from("warehouses")
      .delete()
      .eq("id", id)
      
    if (error) {
      console.error("Error deleting warehouse:", error)
    }
    
    revalidatePath("/dashboard/inventory/warehouses", "page")
  }

  return (
    <div className="space-y-8 p-4 md:p-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Warehouse Management</h1>
        <p className="text-muted-foreground mt-2">Manage your warehouse locations and details</p>
        <p className="text-sm text-muted-foreground mt-2">
          Looking for product warehouse management? <a href="/dashboard/products/warehouses" className="text-primary hover:underline">Go to Product Warehouses</a>
        </p>
      </div>

      {/* Alert for messages */}
      {searchParams.message && (
        <Alert variant="default">
          <AlertDescription>{searchParams.message}</AlertDescription>
        </Alert>
      )}

      {/* Create Warehouse Form */}
      <Card>
        <CardHeader>
          <CardTitle>Create New Warehouse</CardTitle>
          <CardDescription>Add a new warehouse location to your inventory system</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-4">
            <input type="hidden" name="id" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Warehouse Name *</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="e.g., Main Warehouse, Distribution Center"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  name="location"
                  placeholder="e.g., New York, London"
                  required
                />
              </div>
            </div>
            <Button type="submit" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Warehouse
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Warehouses List */}
      <Card>
        <CardHeader>
          <CardTitle>Warehouses</CardTitle>
          <CardDescription>Manage all warehouse locations</CardDescription>
        </CardHeader>
        <CardContent>
          {warehouses && warehouses.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {warehouses.map((warehouse) => (
                  <TableRow key={warehouse.id}>
                    <TableCell className="font-medium">{warehouse.name}</TableCell>
                    <TableCell>{warehouse.location}</TableCell>
                    <TableCell>
                      {new Date(warehouse.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" className="bg-transparent">
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <form action={handleDelete}>
                          <input type="hidden" name="id" value={warehouse.id} />
                          <Button variant="outline" size="sm" className="bg-transparent">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </form>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No warehouses found. Create your first warehouse above.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
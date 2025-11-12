"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, Plus, Edit2, Trash2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface Warehouse {
  id: string
  name: string
  location: string | null
  created_at: string
}

export default function WarehousesPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null)
  
  const [formData, setFormData] = useState({
    name: "",
    location: ""
  })

  useEffect(() => {
    fetchWarehouses()
  }, [])

  const fetchWarehouses = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("warehouses")
        .select("*")
        .order("name")
      
      if (error) {
        // Provide more specific error messages
        if (error.message.includes("Could not find the table") && error.message.includes("warehouses")) {
          throw new Error("Warehouses table does not exist. Please run the database setup scripts in the Supabase dashboard.")
        }
        console.error("Error fetching warehouses:", error)
        throw error
      }
      
      setWarehouses(data || [])
    } catch (err) {
      console.error("Failed to fetch warehouses:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch warehouses. Please check the console for more details.")
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (!formData.name.trim()) {
        throw new Error("Warehouse name is required")
      }
      
      const { data, error } = await supabase
        .from("warehouses")
        .insert({
          name: formData.name,
          location: formData.location
        })
        .select()
        .single()
      
      if (error) {
        if (error.message.includes("duplicate key value violates unique constraint")) {
          throw new Error("A warehouse with this name already exists")
        }
        if (error.message.includes("new row violates row-level security policy")) {
          throw new Error("You don't have permission to create warehouses. Only admin users can create warehouses.")
        }
        throw error
      }
      
      setWarehouses([...warehouses, data])
      setFormData({ name: "", location: "" })
      setShowCreateForm(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create warehouse")
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (!editingWarehouse || !formData.name.trim()) {
        throw new Error("Warehouse name is required")
      }
      
      const { data, error } = await supabase
        .from("warehouses")
        .update({
          name: formData.name,
          location: formData.location
        })
        .eq("id", editingWarehouse.id)
        .select()
        .single()
      
      if (error) {
        if (error.message.includes("duplicate key value violates unique constraint")) {
          throw new Error("A warehouse with this name already exists")
        }
        if (error.message.includes("new row violates row-level security policy")) {
          throw new Error("You don't have permission to update warehouses. Only admin users can update warehouses.")
        }
        throw error
      }
      
      setWarehouses(warehouses.map(warehouse => warehouse.id === editingWarehouse.id ? data : warehouse))
      setFormData({ name: "", location: "" })
      setEditingWarehouse(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update warehouse")
    }
  }

  const handleDelete = async (id: string) => {
    try {
      // Check if warehouse is being used by any inventory items
      const { data: inventoryUsingWarehouse, error: checkError } = await supabase
        .from("inventory")
        .select("id")
        .eq("warehouse_id", id)
        .limit(1)
      
      if (checkError) throw checkError
      
      if (inventoryUsingWarehouse && inventoryUsingWarehouse.length > 0) {
        throw new Error("Cannot delete warehouse that is used by existing inventory items")
      }
      
      const { error } = await supabase
        .from("warehouses")
        .delete()
        .eq("id", id)
      
      if (error) {
        if (error.message.includes("new row violates row-level security policy")) {
          throw new Error("You don't have permission to delete warehouses. Only admin users can delete warehouses.")
        }
        throw error
      }
      
      setWarehouses(warehouses.filter(warehouse => warehouse.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete warehouse")
    }
  }

  const startEditing = (warehouse: Warehouse) => {
    setEditingWarehouse(warehouse)
    setFormData({
      name: warehouse.name,
      location: warehouse.location || ""
    })
  }

  const cancelEditing = () => {
    setEditingWarehouse(null)
    setFormData({ name: "", location: "" })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading warehouses...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Warehouses</h1>
          <p className="text-muted-foreground mt-2">Manage warehouse locations</p>
        </div>
        <Button onClick={() => setShowCreateForm(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Warehouse
        </Button>
      </div>

      {error && (
        <div className="flex gap-3 rounded-lg bg-red-50 dark:bg-red-950 p-4 text-sm text-red-700 dark:text-red-200">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {/* Create/Edit Form */}
      {(showCreateForm || editingWarehouse) && (
        <Card>
          <CardHeader>
            <CardTitle>{editingWarehouse ? "Edit Warehouse" : "Create New Warehouse"}</CardTitle>
            <CardDescription>
              {editingWarehouse 
                ? "Update the warehouse details" 
                : "Add a new warehouse location"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={editingWarehouse ? handleUpdate : handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Warehouse Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Main Warehouse"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="e.g., New York, London"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                />
              </div>
              
              <div className="flex gap-2">
                <Button type="submit">
                  {editingWarehouse ? "Update Warehouse" : "Create Warehouse"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={editingWarehouse ? cancelEditing : () => setShowCreateForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Warehouses Table */}
      <Card>
        <CardHeader>
          <CardTitle>Warehouse List</CardTitle>
          <CardDescription>
            {warehouses.length} {warehouses.length === 1 ? "warehouse" : "warehouses"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {warehouses.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border">
                  <tr className="text-left">
                    <th className="pb-3 font-semibold text-foreground">Name</th>
                    <th className="pb-3 font-semibold text-foreground">Location</th>
                    <th className="pb-3 font-semibold text-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {warehouses.map((warehouse) => (
                    <tr key={warehouse.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                      <td className="py-3 font-medium">{warehouse.name}</td>
                      <td className="py-3 text-muted-foreground">
                        {warehouse.location || "No location"}
                      </td>
                      <td className="py-3">
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="gap-1"
                            onClick={() => startEditing(warehouse)}
                          >
                            <Edit2 className="w-4 h-4" />
                            <span className="hidden sm:inline">Edit</span>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-destructive hover:text-destructive gap-1"
                            onClick={() => handleDelete(warehouse.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                            <span className="hidden sm:inline">Delete</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center">
              <h3 className="text-lg font-semibold text-foreground">No warehouses yet</h3>
              <p className="text-muted-foreground mt-2">
                Create your first warehouse to manage your inventory
              </p>
              <Button onClick={() => setShowCreateForm(true)} className="mt-4">
                Create Warehouse
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
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

interface Category {
  id: string
  name: string
  description: string | null
  created_at: string
}

export default function CategoriesPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  
  const [formData, setFormData] = useState({
    name: "",
    description: ""
  })

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name")
      
      if (error) {
        // Provide more specific error messages
        if (error.message.includes("Could not find the table") && error.message.includes("categories")) {
          throw new Error("Categories table does not exist. Please run the database setup scripts in the Supabase dashboard.")
        }
        console.error("Error fetching categories:", error)
        throw error
      }
      
      setCategories(data || [])
    } catch (err) {
      console.error("Failed to fetch categories:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch categories. Please check the console for more details.")
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (!formData.name.trim()) {
        throw new Error("Category name is required")
      }
      
      const { data, error } = await supabase
        .from("categories")
        .insert({
          name: formData.name,
          description: formData.description
        })
        .select()
        .single()
      
      if (error) {
        if (error.message.includes("duplicate key value violates unique constraint")) {
          throw new Error("A category with this name already exists")
        }
        if (error.message.includes("new row violates row-level security policy")) {
          throw new Error("You don't have permission to create categories. Only admin users can create categories.")
        }
        throw error
      }
      
      setCategories([...categories, data])
      setFormData({ name: "", description: "" })
      setShowCreateForm(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create category")
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (!editingCategory || !formData.name.trim()) {
        throw new Error("Category name is required")
      }
      
      const { data, error } = await supabase
        .from("categories")
        .update({
          name: formData.name,
          description: formData.description
        })
        .eq("id", editingCategory.id)
        .select()
        .single()
      
      if (error) {
        if (error.message.includes("duplicate key value violates unique constraint")) {
          throw new Error("A category with this name already exists")
        }
        if (error.message.includes("new row violates row-level security policy")) {
          throw new Error("You don't have permission to update categories. Only admin users can update categories.")
        }
        throw error
      }
      
      setCategories(categories.map(cat => cat.id === editingCategory.id ? data : cat))
      setFormData({ name: "", description: "" })
      setEditingCategory(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update category")
    }
  }

  const handleDelete = async (id: string) => {
    try {
      // Check if category is being used by any products
      const { data: productsUsingCategory, error: checkError } = await supabase
        .from("products")
        .select("id")
        .eq("category_id", id)
        .limit(1)
      
      if (checkError) throw checkError
      
      if (productsUsingCategory && productsUsingCategory.length > 0) {
        throw new Error("Cannot delete category that is used by existing products")
      }
      
      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", id)
      
      if (error) {
        if (error.message.includes("new row violates row-level security policy")) {
          throw new Error("You don't have permission to delete categories. Only admin users can delete categories.")
        }
        throw error
      }
      
      setCategories(categories.filter(cat => cat.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete category")
    }
  }

  const startEditing = (category: Category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      description: category.description || ""
    })
  }

  const cancelEditing = () => {
    setEditingCategory(null)
    setFormData({ name: "", description: "" })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading categories...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Categories</h1>
          <p className="text-muted-foreground mt-2">Manage product categories</p>
        </div>
        <Button onClick={() => setShowCreateForm(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Category
        </Button>
      </div>

      {error && (
        <div className="flex gap-3 rounded-lg bg-red-50 dark:bg-red-950 p-4 text-sm text-red-700 dark:text-red-200">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {/* Create/Edit Form */}
      {(showCreateForm || editingCategory) && (
        <Card>
          <CardHeader>
            <CardTitle>{editingCategory ? "Edit Category" : "Create New Category"}</CardTitle>
            <CardDescription>
              {editingCategory 
                ? "Update the category details" 
                : "Add a new category for your products"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={editingCategory ? handleUpdate : handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Category Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Phone Cases"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="Optional description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>
              
              <div className="flex gap-2">
                <Button type="submit">
                  {editingCategory ? "Update Category" : "Create Category"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={editingCategory ? cancelEditing : () => setShowCreateForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Categories Table */}
      <Card>
        <CardHeader>
          <CardTitle>Category List</CardTitle>
          <CardDescription>
            {categories.length} {categories.length === 1 ? "category" : "categories"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {categories.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border">
                  <tr className="text-left">
                    <th className="pb-3 font-semibold text-foreground">Name</th>
                    <th className="pb-3 font-semibold text-foreground">Description</th>
                    <th className="pb-3 font-semibold text-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((category) => (
                    <tr key={category.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                      <td className="py-3 font-medium">{category.name}</td>
                      <td className="py-3 text-muted-foreground">
                        {category.description || "No description"}
                      </td>
                      <td className="py-3">
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="gap-1"
                            onClick={() => startEditing(category)}
                          >
                            <Edit2 className="w-4 h-4" />
                            <span className="hidden sm:inline">Edit</span>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-destructive hover:text-destructive gap-1"
                            onClick={() => handleDelete(category.id)}
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
              <h3 className="text-lg font-semibold text-foreground">No categories yet</h3>
              <p className="text-muted-foreground mt-2">
                Create your first category to organize your products
              </p>
              <Button onClick={() => setShowCreateForm(true)} className="mt-4">
                Create Category
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
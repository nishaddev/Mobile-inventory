import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Building2, Users, Bell, Shield } from "lucide-react"
import Link from "next/link"

export const metadata = {
  title: "Settings - InventoryHub",
}

export default async function SettingsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user?.id).single()

  return (
    <div className="space-y-8 p-4 md:p-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-2">Manage your account and system settings</p>
      </div>

      {/* Account Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>Your profile details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="text-lg font-semibold">{user?.email}</p>
          </div>
          {profile?.full_name && (
            <div>
              <p className="text-sm text-muted-foreground">Full Name</p>
              <p className="text-lg font-semibold">{profile.full_name}</p>
            </div>
          )}
          <div>
            <p className="text-sm text-muted-foreground">Role</p>
            <p className="text-lg font-semibold capitalize">{profile?.role || "Not assigned"}</p>
          </div>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              <CardTitle>Warehouses</CardTitle>
            </div>
            <CardDescription>Manage warehouse locations</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">View and manage all warehouse locations and details.</p>
            <Button variant="outline" className="w-full bg-transparent" asChild>
              <Link href="/dashboard/inventory/warehouses">Manage Warehouses</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              <CardTitle>Product Warehouses</CardTitle>
            </div>
            <CardDescription>Manage product warehouse locations</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">View and manage warehouse locations for products.</p>
            <Button variant="outline" className="w-full bg-transparent" asChild>
              <Link href="/dashboard/products/warehouses">Manage Product Warehouses</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <CardTitle>Users</CardTitle>
            </div>
            <CardDescription>Manage team members</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">Add, remove, or modify user accounts and permissions.</p>
            <Button variant="outline" className="w-full bg-transparent">
              Manage Users
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              <CardTitle>Notifications</CardTitle>
            </div>
            <CardDescription>Configure alerts</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">Set up notifications for low stock and other events.</p>
            <Button variant="outline" className="w-full bg-transparent">
              Configure Alerts
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <CardTitle>Security</CardTitle>
            </div>
            <CardDescription>Manage security settings</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">Update password and security preferences.</p>
            <Button variant="outline" className="w-full bg-transparent">
              Security Settings
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* System Info */}
      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
          <CardDescription>InventoryHub system details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Version</p>
              <p className="text-lg font-semibold">1.0.0 (Phase 1)</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Environment</p>
              <p className="text-lg font-semibold">Production</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

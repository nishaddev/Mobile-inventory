import type React from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Sidebar } from "@/components/sidebar"

export const metadata = {
  title: "Dashboard - InventoryHub",
  description: "Inventory management dashboard",
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get user profile to display role
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  return (
    <div className="flex h-screen bg-background">
      <Sidebar userEmail={user.email} userRole={profile?.role} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}

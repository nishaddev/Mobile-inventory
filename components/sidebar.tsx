"use client"

import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { BarChart3, Package, Warehouse, Settings, LogOut, Menu, X, Home, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SidebarProps {
  userEmail?: string
  userRole?: string
}

export function Sidebar({ userEmail = "", userRole = "" }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth >= 768) {
        setIsOpen(true)
      }
    }

    window.addEventListener("resize", handleResize)
    handleResize()

    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  const menuItems = [
    { href: "/dashboard", icon: Home, label: "Dashboard" },
    { href: "/dashboard/products", icon: Package, label: "Products" },
    { href: "/dashboard/inventory", icon: Warehouse, label: "Inventory" },
    { href: "/dashboard/sales", icon: TrendingUp, label: "Sales" },
    { href: "/dashboard/analytics", icon: BarChart3, label: "Analytics" },
    { href: "/dashboard/settings", icon: Settings, label: "Settings" },
  ]

  return (
    <>
      {/* Mobile menu button */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <Button variant="outline" size="icon" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {/* Overlay for mobile */}
      {isOpen && isMobile && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsOpen(false)} />
      )}

      <aside
        className={`
          fixed md:static left-0 top-0 h-screen w-64 bg-gradient-to-b from-sidebar via-sidebar to-sidebar/95 border-r border-sidebar-border
          transition-transform duration-300 z-40 flex flex-col
          ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        {/* Header */}
        <div className="p-6 border-b border-sidebar-border bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          <h1 className="text-2xl font-black">InventoryHub</h1>
          <p className="text-xs text-sidebar-accent-foreground mt-1 font-semibold uppercase tracking-wider">
            Inventory Manager
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => isMobile && setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground hover:text-sidebar-accent-foreground transition-all duration-200 group"
              >
                <Icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* User info and logout */}
        <div className="border-t border-sidebar-border p-4 space-y-3 bg-gradient-to-t from-sidebar/50 to-transparent">
          <div className="text-sm">
            <p className="text-sidebar-accent-foreground text-xs font-semibold uppercase tracking-wider">
              Logged in as
            </p>
            <p className="text-sidebar-foreground font-bold truncate mt-1">{userEmail}</p>
            {userRole && (
              <p className="text-sidebar-accent-foreground text-xs capitalize mt-1 font-semibold">{userRole}</p>
            )}
          </div>
          <Button
            variant="outline"
            className="w-full justify-start gap-2 bg-transparent border-sidebar-border hover:bg-sidebar-accent/20 hover:text-sidebar-accent-foreground transition-all duration-200"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </aside>
    </>
  )
}

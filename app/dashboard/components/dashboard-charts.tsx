"use client"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, Warehouse, TrendingUp, AlertTriangle, ArrowUp, ArrowDown } from "lucide-react"

interface DashboardChartsProps {
  totalInventoryValue: number
  totalInventoryReserved: number
  totalProducts: number
  totalWarehouses: number
  totalCost: number
  totalRetail: number
  profitMargin: string
}

export function DashboardCharts({
  totalInventoryValue,
  totalInventoryReserved,
  totalProducts,
  totalWarehouses,
  totalCost,
  totalRetail,
  profitMargin
}: DashboardChartsProps) {
  // Prepare chart data
  const chartData = [
    { month: "Jan", inventory: 4000, reserved: 2400, sold: 2400 },
    { month: "Feb", inventory: 3000, reserved: 1398, sold: 2210 },
    { month: "Mar", inventory: 2000, reserved: 9800, sold: 2290 },
    { month: "Apr", inventory: 2780, reserved: 3908, sold: 2000 },
    { month: "May", inventory: 1890, reserved: 4800, sold: 2181 },
    { month: "Jun", inventory: 2390, reserved: 3800, sold: 2500 },
  ]

  const pieData = [
    { name: "In Stock", value: totalInventoryValue - totalInventoryReserved, fill: "#a855f7" },
    { name: "Reserved", value: totalInventoryReserved, fill: "#f97316" },
  ]

  const stats = [
    {
      title: "Total Products",
      value: totalProducts,
      icon: Package,
      change: "+2.5%",
      trend: "up",
      color: "from-purple-500 to-purple-600",
      textColor: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-100 dark:bg-purple-950",
    },
    {
      title: "Units in Stock",
      value: totalInventoryValue,
      icon: Warehouse,
      change: "+12.3%",
      trend: "up",
      color: "from-blue-500 to-blue-600",
      textColor: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-100 dark:bg-blue-950",
    },
    {
      title: "Total Warehouses",
      value: totalWarehouses,
      icon: TrendingUp,
      change: "0%",
      trend: "neutral",
      color: "from-cyan-500 to-cyan-600",
      textColor: "text-cyan-600 dark:text-cyan-400",
      bgColor: "bg-cyan-100 dark:bg-cyan-950",
    },
    {
      title: "Profit Margin",
      value: `${profitMargin}%`,
      icon: AlertTriangle,
      change: "+5.2%",
      trend: "up",
      color: "from-orange-500 to-orange-600",
      textColor: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-100 dark:bg-orange-950",
    },
  ]

  return (
    <>
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon
          const TrendIcon = stat.trend === "up" ? ArrowUp : stat.trend === "down" ? ArrowDown : null
          const trendColor =
            stat.trend === "up"
              ? "text-green-600 dark:text-green-400"
              : stat.trend === "down"
                ? "text-red-600 dark:text-red-400"
                : "text-gray-600 dark:text-gray-400"

          return (
            <Card
              key={stat.title}
              className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-card to-muted/20"
            >
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div>
                  <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="text-3xl font-bold">{stat.value}</div>
                    {TrendIcon && <TrendIcon className={`w-4 h-4 ${trendColor}`} />}
                    <span className={`text-xs font-semibold ${trendColor}`}>{stat.change}</span>
                  </div>
                </div>
                <div className={`rounded-lg p-3 bg-gradient-to-br ${stat.color}`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
              </CardHeader>
            </Card>
          )
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Line Chart */}
        <Card className="lg:col-span-2 border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Inventory Trends</CardTitle>
            <CardDescription>Last 6 months inventory movement</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />
                <XAxis dataKey="month" stroke="currentColor" opacity={0.5} />
                <YAxis stroke="currentColor" opacity={0.5} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="inventory" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="reserved" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pie Chart */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Stock Distribution</CardTitle>
            <CardDescription>In Stock vs Reserved</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
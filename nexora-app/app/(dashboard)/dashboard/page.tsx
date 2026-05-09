"use client";

import { useApp } from "@/lib/context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  getCurrentMonthExpenses,
  getTotalExpenses,
  getAverageDailySpending,
  getHighestCategory,
  getCategoryTotals,
  getMonthlyTotals,
  generateInsights,
  checkBudgetAlerts,
} from "@/lib/analytics";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  IndianRupee,
  Lightbulb,
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  gradient,
  index,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ElementType;
  gradient: string;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className="bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.05] transition-colors">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-white/40 mb-1">{title}</p>
              <p className="text-2xl font-bold text-white">{value}</p>
              <p className="text-xs text-white/30 mt-1">{subtitle}</p>
            </div>
            <div
              className={`p-2.5 rounded-xl bg-gradient-to-br ${gradient} shadow-lg`}
            >
              <Icon className="h-5 w-5 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1a1a1a] border border-white/10 rounded-lg p-3 shadow-xl">
        <p className="text-white/60 text-xs mb-1">{label}</p>
        <p className="text-white font-semibold">
          ₹{payload[0].value.toLocaleString("en-IN")}
        </p>
      </div>
    );
  }
  return null;
};

export default function DashboardPage() {
  const { user, expenses } = useApp();

  const currentMonth = getCurrentMonthExpenses(expenses);
  const totalSpent = getTotalExpenses(currentMonth);
  const avgDaily = getAverageDailySpending(currentMonth);
  const highestCategory = getHighestCategory(currentMonth);
  const remaining = (user?.monthlyBudget || 0) - totalSpent;
  const categoryTotals = getCategoryTotals(currentMonth);
  const monthlyTotals = getMonthlyTotals(expenses, 6);
  const insights = generateInsights(expenses);
  const alerts = checkBudgetAlerts(user?.monthlyBudget || 0, expenses);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          Welcome back, {user?.name?.split(" ")[0]}
        </h1>
        <p className="text-white/40 mt-1">
          Here&apos;s your financial overview for{" "}
          {format(new Date(), "MMMM yyyy")}
        </p>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`flex items-center gap-3 p-4 rounded-xl border ${
                alert.type === "exceeded"
                  ? "bg-red-500/[0.08] border-red-500/20 text-red-400"
                  : "bg-amber-500/[0.08] border-amber-500/20 text-amber-400"
              }`}
            >
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <span className="text-sm">{alert.message}</span>
            </div>
          ))}
        </motion.div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Expenses"
          value={`₹${totalSpent.toLocaleString("en-IN")}`}
          subtitle={`of ₹${(user?.monthlyBudget || 0).toLocaleString("en-IN")} budget`}
          icon={Wallet}
          gradient="from-indigo-500 to-purple-600"
          index={0}
        />
        <StatCard
          title="Highest Category"
          value={highestCategory}
          subtitle="this month"
          icon={TrendingUp}
          gradient="from-rose-500 to-pink-600"
          index={1}
        />
        <StatCard
          title="Daily Average"
          value={`₹${Math.round(avgDaily).toLocaleString("en-IN")}`}
          subtitle="per day this month"
          icon={IndianRupee}
          gradient="from-amber-500 to-orange-600"
          index={2}
        />
        <StatCard
          title="Remaining Budget"
          value={`₹${Math.abs(remaining).toLocaleString("en-IN")}`}
          subtitle={remaining >= 0 ? "left to spend" : "over budget"}
          icon={remaining >= 0 ? PiggyBank : TrendingDown}
          gradient={remaining >= 0 ? "from-emerald-500 to-teal-600" : "from-red-500 to-rose-600"}
          index={3}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Pie Chart */}
        <Card className="bg-white/[0.03] border-white/[0.06]">
          <CardHeader>
            <CardTitle className="text-lg text-white">
              Spending by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            {categoryTotals.length > 0 ? (
              <div className="flex flex-col md:flex-row items-center gap-6">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={categoryTotals}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={90}
                      dataKey="total"
                      nameKey="category"
                      stroke="none"
                    >
                      {categoryTotals.map((entry) => (
                        <Cell key={entry.category} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ payload }) =>
                        payload?.[0] ? (
                          <div className="bg-[#1a1a1a] border border-white/10 rounded-lg p-3 shadow-xl">
                            <p className="text-white/60 text-xs">{payload[0].name}</p>
                            <p className="text-white font-semibold">
                              ₹{Number(payload[0].value).toLocaleString("en-IN")}
                            </p>
                          </div>
                        ) : null
                      }
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-2 justify-center">
                  {categoryTotals.slice(0, 6).map((ct) => (
                    <Badge
                      key={ct.category}
                      variant="outline"
                      className="border-white/10 text-white/60 gap-1.5 py-1"
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: ct.color }}
                      />
                      {ct.category} {ct.percentage}%
                    </Badge>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-white/30">
                No expenses yet. Add your first expense!
              </div>
            )}
          </CardContent>
        </Card>

        {/* Monthly Trend Line Chart */}
        <Card className="bg-white/[0.03] border-white/[0.06]">
          <CardHeader>
            <CardTitle className="text-lg text-white">
              Monthly Spending Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyTotals.some((m) => m.total > 0) ? (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={monthlyTotals}>
                  <CartesianGrid stroke="#ffffff08" />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: "#ffffff40", fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#ffffff40", fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="#818cf8"
                    strokeWidth={2.5}
                    dot={{ fill: "#818cf8", r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-white/30">
                Trend data will appear as you track expenses
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Category Comparison Bar Chart */}
      <Card className="bg-white/[0.03] border-white/[0.06]">
        <CardHeader>
          <CardTitle className="text-lg text-white">
            Category Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          {categoryTotals.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={categoryTotals} barSize={32}>
                <CartesianGrid stroke="#ffffff08" vertical={false} />
                <XAxis
                  dataKey="category"
                  tick={{ fill: "#ffffff40", fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fill: "#ffffff40", fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                  {categoryTotals.map((entry) => (
                    <Cell key={entry.category} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-white/30">
              Add expenses to see category comparisons
            </div>
          )}
        </CardContent>
      </Card>

      {/* Insights */}
      {insights.length > 0 && (
        <Card className="bg-white/[0.03] border-white/[0.06]">
          <CardHeader>
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-amber-400" />
              Smart Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {insights.map((insight) => (
                <div
                  key={insight.id}
                  className={`flex items-start gap-3 p-3 rounded-xl ${
                    insight.type === "increase"
                      ? "bg-red-500/[0.06] border border-red-500/10"
                      : insight.type === "decrease"
                      ? "bg-green-500/[0.06] border border-green-500/10"
                      : insight.type === "warning"
                      ? "bg-amber-500/[0.06] border border-amber-500/10"
                      : "bg-indigo-500/[0.06] border border-indigo-500/10"
                  }`}
                >
                  {insight.type === "increase" ? (
                    <ArrowUpRight className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
                  ) : insight.type === "decrease" ? (
                    <ArrowDownRight className="h-4 w-4 text-green-400 mt-0.5 shrink-0" />
                  ) : (
                    <Lightbulb className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
                  )}
                  <span className="text-sm text-white/60">
                    {insight.message}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

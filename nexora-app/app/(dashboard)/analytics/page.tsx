"use client";

import { useApp } from "@/lib/context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  predictNextMonth,
  analyzeSavings,
  checkBudgetAlerts,
  generateInsights,
  getCategoryTotals,
  getCurrentMonthExpenses,
  getTotalExpenses,
} from "@/lib/analytics";
import { CATEGORY_COLORS, MonthlyPrediction } from "@/lib/types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  TrendingUp,
  PiggyBank,
  Lightbulb,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Sparkles,
  Brain,
  Shield,
} from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

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

export default function AnalyticsPage() {
  const { user, expenses } = useApp();
  const [prediction, setPrediction] = useState<MonthlyPrediction>(predictNextMonth(expenses));
  const [isMLPrediction, setIsMLPrediction] = useState(false);

  useEffect(() => {
    const fetchMLPrediction = async () => {
      if (!user?.monthlyIncome) return;

      // Calculate month_index: number of unique months with expenses
      const uniqueMonths = new Set(expenses.map(e => e.date.substring(0, 7)));
      const monthIndex = uniqueMonths.size;

      try {
        const response = await fetch('/api/predict', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ month_index: monthIndex, income: user.monthlyIncome }),
        });

        if (response.ok) {
          const data = await response.json();
          // Create prediction object with ML total and fallback categories
          const fallbackPrediction = predictNextMonth(expenses);
          setPrediction({
            month: fallbackPrediction.month,
            totalPredicted: Math.round(data.prediction),
            categoryBreakdown: fallbackPrediction.categoryBreakdown, // Keep category breakdown from current logic
          });
          setIsMLPrediction(true);
        }
      } catch (error) {
        console.error('ML prediction failed, using fallback:', error);
        setIsMLPrediction(false);
        // Keep the fallback prediction
      }
    };

    fetchMLPrediction();
  }, [user?.monthlyIncome, expenses]);

  const savings = analyzeSavings(user?.monthlyIncome || 0, expenses);
  const alerts = checkBudgetAlerts(user?.monthlyBudget || 0, expenses);
  const insights = generateInsights(expenses);
  const currentMonth = getCurrentMonthExpenses(expenses);
  const currentSpending = getTotalExpenses(currentMonth);

  const predictionData = Object.entries(prediction.categoryBreakdown)
    .map(([category, total]) => ({
      category,
      total,
      color: CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] || "#6b7280",
    }))
    .sort((a, b) => b.total - a.total);

  const budgetPercentage = user?.monthlyBudget
    ? Math.min(Math.round((currentSpending / user.monthlyBudget) * 100), 100)
    : 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <p className="text-white/40 mt-1">
          Predictions, savings analysis, and smart financial insights
        </p>
      </div>

      {/* Budget Status */}
      <Card className="bg-white/[0.03] border-white/[0.06]">
        <CardHeader>
          <CardTitle className="text-lg text-white flex items-center gap-2">
            <Shield className="h-5 w-5 text-indigo-400" />
            Budget Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/40">
              ₹{currentSpending.toLocaleString("en-IN")} of ₹
              {(user?.monthlyBudget || 0).toLocaleString("en-IN")}
            </span>
            <span className={`font-medium ${budgetPercentage >= 90 ? "text-red-400" : budgetPercentage >= 75 ? "text-amber-400" : "text-emerald-400"}`}>
              {budgetPercentage}%
            </span>
          </div>
          <Progress
            value={budgetPercentage}
            className="h-3 bg-white/[0.05]"
          />
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`flex items-center gap-3 p-3 rounded-xl text-sm ${
                alert.type === "exceeded"
                  ? "bg-red-500/[0.08] border border-red-500/20 text-red-400"
                  : "bg-amber-500/[0.08] border border-amber-500/20 text-amber-400"
              }`}
            >
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {alert.message}
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Next Month Prediction */}
        <Card className="bg-white/[0.03] border-white/[0.06]">
          <CardHeader>
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <Brain className="h-5 w-5 text-violet-400" />
              Next Month Prediction
              {isMLPrediction && (
                <Badge variant="secondary" className="bg-violet-500/20 text-violet-300 border-violet-500/30">
                  <Sparkles className="h-3 w-3 mr-1" />
                  AI Powered
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-xl bg-gradient-to-br from-violet-500/[0.1] to-purple-500/[0.05] border border-violet-500/[0.15]">
              <p className="text-sm text-white/40 mb-1">Predicted Spending for {prediction.month}</p>
              <p className="text-3xl font-bold text-white">
                ₹{prediction.totalPredicted.toLocaleString("en-IN")}
              </p>
            </div>
            {predictionData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={predictionData} barSize={24}>
                  <XAxis
                    dataKey="category"
                    tick={{ fill: "#ffffff40", fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis hide />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                    {predictionData.map((entry) => (
                      <Cell key={entry.category} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-white/30 py-8 text-sm">
                Add more expenses to see predictions
              </p>
            )}
          </CardContent>
        </Card>

        {/* Savings Analysis */}
        <Card className="bg-white/[0.03] border-white/[0.06]">
          <CardHeader>
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <PiggyBank className="h-5 w-5 text-emerald-400" />
              Savings Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <p className="text-xs text-white/40">Monthly Income</p>
                <p className="text-lg font-bold text-white">
                  ₹{savings.monthlyIncome.toLocaleString("en-IN")}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <p className="text-xs text-white/40">Current Spending</p>
                <p className="text-lg font-bold text-white">
                  ₹{savings.currentSpending.toLocaleString("en-IN")}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/[0.08] border border-emerald-500/[0.15]">
                <p className="text-xs text-emerald-400/60">Potential Savings</p>
                <p className="text-lg font-bold text-emerald-400">
                  ₹{savings.potentialSavings.toLocaleString("en-IN")}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <p className="text-xs text-white/40">Savings Rate</p>
                <p className="text-lg font-bold text-white">{savings.savingsRate}%</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/[0.08] to-teal-500/[0.05] border border-emerald-500/[0.1]">
              <p className="text-sm text-white/40 mb-1">Yearly Projected Savings</p>
              <p className="text-2xl font-bold text-emerald-400">
                ₹{savings.yearlyProjectedSavings.toLocaleString("en-IN")}
              </p>
            </div>

            {savings.suggestions.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-white/50 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                  Smart Suggestions
                </p>
                {savings.suggestions.map((s, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/50"
                  >
                    <Lightbulb className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
                    {s}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <Card className="bg-white/[0.03] border-white/[0.06]">
          <CardHeader>
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-amber-400" />
              Smart Financial Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {insights.map((insight, i) => (
                <motion.div
                  key={insight.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`flex items-start gap-3 p-4 rounded-xl ${
                    insight.type === "increase"
                      ? "bg-red-500/[0.06] border border-red-500/10"
                      : insight.type === "decrease"
                      ? "bg-green-500/[0.06] border border-green-500/10"
                      : "bg-indigo-500/[0.06] border border-indigo-500/10"
                  }`}
                >
                  {insight.type === "increase" ? (
                    <ArrowUpRight className="h-5 w-5 text-red-400 mt-0.5 shrink-0" />
                  ) : insight.type === "decrease" ? (
                    <ArrowDownRight className="h-5 w-5 text-green-400 mt-0.5 shrink-0" />
                  ) : (
                    <Lightbulb className="h-5 w-5 text-amber-400 mt-0.5 shrink-0" />
                  )}
                  <span className="text-sm text-white/60">{insight.message}</span>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

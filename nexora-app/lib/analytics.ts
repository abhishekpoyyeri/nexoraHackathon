import { startOfMonth, subMonths, format, parseISO, differenceInDays, differenceInMonths } from "date-fns";
import {
    Expense,
    ExpenseCategory,
    CategoryTotal,
    MonthlyTotal,
    MonthlyPrediction,
    FinancialInsight,
    BudgetAlert,
    CATEGORY_COLORS,
    SavingsGoal,
} from "./types";

// ── Category Totals ──
export function getCategoryTotals(expenses: Expense[]): CategoryTotal[] {
    const totals: Record<string, number> = {};
    let grandTotal = 0;

    for (const exp of expenses) {
        totals[exp.category] = (totals[exp.category] || 0) + exp.amount;
        grandTotal += exp.amount;
    }

    return Object.entries(totals)
        .map(([category, total]) => ({
            category: category as ExpenseCategory,
            total,
            percentage: grandTotal > 0 ? Math.round((total / grandTotal) * 100) : 0,
            color: CATEGORY_COLORS[category as ExpenseCategory] || "#6b7280",
        }))
        .sort((a, b) => b.total - a.total);
}

// ── Monthly Totals ──
export function getMonthlyTotals(expenses: Expense[], months: number = 6): MonthlyTotal[] {
    const result: MonthlyTotal[] = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
        const monthStart = startOfMonth(subMonths(now, i));
        const monthKey = format(monthStart, "yyyy-MM");
        const label = format(monthStart, "MMM yyyy");

        const total = expenses
            .filter((e) => e.date.startsWith(monthKey))
            .reduce((sum, e) => sum + e.amount, 0);

        result.push({ month: label, total });
    }

    return result;
}

// ── Current Month Stats ──
export function getCurrentMonthExpenses(expenses: Expense[]): Expense[] {
    const monthKey = format(new Date(), "yyyy-MM");
    return expenses.filter((e) => e.date.startsWith(monthKey));
}

export function getTotalExpenses(expenses: Expense[]): number {
    return expenses.reduce((sum, e) => sum + e.amount, 0);
}

export function getAverageDailySpending(expenses: Expense[]): number {
    if (expenses.length === 0) return 0;
    const dates = expenses.map((e) => parseISO(e.date));
    const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));
    const days = Math.max(differenceInDays(maxDate, minDate), 1);
    return getTotalExpenses(expenses) / days;
}

export function getHighestCategory(expenses: Expense[]): string {
    const totals = getCategoryTotals(expenses);
    return totals.length > 0 ? totals[0].category : "None";
}

// ── Predictions ──
export function predictNextMonth(expenses: Expense[]): MonthlyPrediction {
    const now = new Date();
    const nextMonth = format(subMonths(now, -1), "MMM yyyy");

    // Get last 3 months data
    const monthlyByCategory: Record<string, number[]> = {};

    for (let i = 1; i <= 3; i++) {
        const monthKey = format(subMonths(now, i), "yyyy-MM");
        const monthExpenses = expenses.filter((e) => e.date.startsWith(monthKey));
        const catTotals: Record<string, number> = {};

        for (const e of monthExpenses) {
            catTotals[e.category] = (catTotals[e.category] || 0) + e.amount;
        }

        for (const [cat, total] of Object.entries(catTotals)) {
            if (!monthlyByCategory[cat]) monthlyByCategory[cat] = [];
            monthlyByCategory[cat].push(total);
        }
    }

    const categoryBreakdown: Record<string, number> = {};
    let totalPredicted = 0;

    for (const [cat, values] of Object.entries(monthlyByCategory)) {
        // Weighted average: recent months weigh more
        const weights = values.length === 3 ? [0.5, 0.3, 0.2] : values.length === 2 ? [0.6, 0.4] : [1];
        let predicted = 0;
        for (let i = 0; i < values.length; i++) {
            predicted += values[i] * (weights[i] || 0);
        }
        predicted = Math.round(predicted);
        categoryBreakdown[cat] = predicted;
        totalPredicted += predicted;
    }

    // If no history, use current month extrapolated
    if (totalPredicted === 0) {
        const currentMonth = getCurrentMonthExpenses(expenses);
        const currentTotal = getTotalExpenses(currentMonth);
        const dayOfMonth = now.getDate();
        totalPredicted = Math.round((currentTotal / dayOfMonth) * 30);
        if (currentMonth.length > 0) {
            const catTotals = getCategoryTotals(currentMonth);
            for (const ct of catTotals) {
                categoryBreakdown[ct.category] = Math.round((ct.total / dayOfMonth) * 30);
            }
        }
    }

    return { month: nextMonth, totalPredicted, categoryBreakdown };
}

// ── Savings Analysis ──
export function analyzeSavings(monthlyIncome: number, expenses: Expense[]) {
    const currentMonth = getCurrentMonthExpenses(expenses);
    const currentSpending = getTotalExpenses(currentMonth);
    const potentialSavings = monthlyIncome - currentSpending;
    const savingsRate = monthlyIncome > 0 ? Math.round((potentialSavings / monthlyIncome) * 100) : 0;

    const categoryTotals = getCategoryTotals(currentMonth);
    const suggestions: string[] = [];

    // Suggest reductions for top categories
    for (const ct of categoryTotals.slice(0, 3)) {
        const reduction = Math.round(ct.total * 0.15);
        const yearlySaving = reduction * 12;
        suggestions.push(
            `Reduce ${ct.category} spending by ₹${reduction.toLocaleString("en-IN")}/month to save ₹${yearlySaving.toLocaleString("en-IN")}/year.`
        );
    }

    return {
        monthlyIncome,
        currentSpending,
        potentialSavings,
        savingsRate,
        suggestions,
        yearlyProjectedSavings: potentialSavings * 12,
    };
}

// ── Budget Alerts ──
export function checkBudgetAlerts(monthlyBudget: number, expenses: Expense[]): BudgetAlert[] {
    if (monthlyBudget <= 0) return [];

    const currentMonth = getCurrentMonthExpenses(expenses);
    const totalSpent = getTotalExpenses(currentMonth);
    const percentage = Math.round((totalSpent / monthlyBudget) * 100);
    const alerts: BudgetAlert[] = [];

    if (percentage >= 100) {
        const exceeded = totalSpent - monthlyBudget;
        alerts.push({
            id: "exceeded",
            type: "exceeded",
            message: `You exceeded your monthly budget by ₹${exceeded.toLocaleString("en-IN")}!`,
            percentage,
            date: new Date().toISOString(),
        });
    } else if (percentage >= 90) {
        alerts.push({
            id: "warning-90",
            type: "warning",
            message: `Warning: You have reached ${percentage}% of your monthly spending limit.`,
            percentage,
            date: new Date().toISOString(),
        });
    } else if (percentage >= 75) {
        alerts.push({
            id: "warning-75",
            type: "warning",
            message: `Heads up: You've used ${percentage}% of your monthly budget.`,
            percentage,
            date: new Date().toISOString(),
        });
    }

    return alerts;
}

// ── Financial Insights ──
export function generateInsights(expenses: Expense[]): FinancialInsight[] {
    const insights: FinancialInsight[] = [];
    const now = new Date();

    const currentMonthKey = format(now, "yyyy-MM");
    const lastMonthKey = format(subMonths(now, 1), "yyyy-MM");

    const currentExpenses = expenses.filter((e) => e.date.startsWith(currentMonthKey));
    const lastExpenses = expenses.filter((e) => e.date.startsWith(lastMonthKey));

    const currentByCategory: Record<string, number> = {};
    const lastByCategory: Record<string, number> = {};

    for (const e of currentExpenses) {
        currentByCategory[e.category] = (currentByCategory[e.category] || 0) + e.amount;
    }
    for (const e of lastExpenses) {
        lastByCategory[e.category] = (lastByCategory[e.category] || 0) + e.amount;
    }

    // Compare categories
    for (const [cat, currentTotal] of Object.entries(currentByCategory)) {
        const lastTotal = lastByCategory[cat] || 0;
        if (lastTotal > 0) {
            const change = Math.round(((currentTotal - lastTotal) / lastTotal) * 100);
            if (change > 15) {
                insights.push({
                    id: `increase-${cat}`,
                    type: "increase",
                    message: `Your ${cat} expenses increased by ${change}% this month.`,
                    category: cat as ExpenseCategory,
                    percentage: change,
                });
            } else if (change < -15) {
                insights.push({
                    id: `decrease-${cat}`,
                    type: "decrease",
                    message: `Great! ${cat} spending decreased by ${Math.abs(change)}% compared to last month.`,
                    category: cat as ExpenseCategory,
                    percentage: Math.abs(change),
                });
            }
        }
    }

    // Top spending insight
    const catTotals = getCategoryTotals(currentExpenses);
    if (catTotals.length > 0) {
        insights.push({
            id: "top-category",
            type: "tip",
            message: `${catTotals[0].category} is your highest spending category at ${catTotals[0].percentage}% of total expenses.`,
            category: catTotals[0].category,
        });
    }

    // Average daily
    if (currentExpenses.length > 5) {
        const avgDaily = getAverageDailySpending(currentExpenses);
        insights.push({
            id: "daily-avg",
            type: "tip",
            message: `Your average daily spending this month is ₹${Math.round(avgDaily).toLocaleString("en-IN")}.`,
        });
    }

    return insights;
}

// ── Goal Analysis ──
export function analyzeGoal(goal: SavingsGoal) {
    const remaining = goal.targetAmount - goal.savedAmount;
    const progress = Math.round((goal.savedAmount / goal.targetAmount) * 100);
    const monthsLeft = Math.max(
        differenceInMonths(parseISO(goal.deadline), new Date()),
        1
    );
    const requiredMonthly = Math.round(remaining / monthsLeft);

    return { remaining, progress, monthsLeft, requiredMonthly };
}

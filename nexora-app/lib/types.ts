export interface User {
    id: string;
    name: string;
    email: string;
    monthlyIncome: number;
    monthlyBudget: number;
    createdAt: string;
}

export type ExpenseCategory =
    | "Food"
    | "Transport"
    | "Shopping"
    | "Entertainment"
    | "Bills"
    | "Health"
    | "Education"
    | "Travel"
    | "Groceries"
    | "Rent"
    | "Subscriptions"
    | "Other";

export type PaymentMethod =
    | "Cash"
    | "Credit Card"
    | "Debit Card"
    | "UPI"
    | "Net Banking"
    | "Wallet";

export interface Expense {
    id: string;
    userId: string;
    amount: number;
    category: ExpenseCategory;
    description: string;
    merchant: string;
    date: string;
    paymentMethod: PaymentMethod;
    createdAt: string;
}

export interface SavingsGoal {
    id: string;
    userId: string;
    name: string;
    targetAmount: number;
    savedAmount: number;
    deadline: string;
    createdAt: string;
}

export interface BudgetAlert {
    id: string;
    type: "warning" | "exceeded";
    message: string;
    percentage: number;
    date: string;
}

export interface FinancialInsight {
    id: string;
    type: "increase" | "decrease" | "warning" | "tip";
    message: string;
    category?: ExpenseCategory;
    percentage?: number;
}

export interface MonthlyPrediction {
    month: string;
    totalPredicted: number;
    categoryBreakdown: Record<string, number>;
}

export interface CategoryTotal {
    category: ExpenseCategory;
    total: number;
    percentage: number;
    color: string;
}

export interface MonthlyTotal {
    month: string;
    total: number;
}

export const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
    Food: "#f97316",
    Transport: "#3b82f6",
    Shopping: "#ec4899",
    Entertainment: "#a855f7",
    Bills: "#ef4444",
    Health: "#10b981",
    Education: "#06b6d4",
    Travel: "#f59e0b",
    Groceries: "#84cc16",
    Rent: "#6366f1",
    Subscriptions: "#14b8a6",
    Other: "#6b7280",
};

export const ALL_CATEGORIES: ExpenseCategory[] = [
    "Food",
    "Transport",
    "Shopping",
    "Entertainment",
    "Bills",
    "Health",
    "Education",
    "Travel",
    "Groceries",
    "Rent",
    "Subscriptions",
    "Other",
];

export const ALL_PAYMENT_METHODS: PaymentMethod[] = [
    "Cash",
    "Credit Card",
    "Debit Card",
    "UPI",
    "Net Banking",
    "Wallet",
];

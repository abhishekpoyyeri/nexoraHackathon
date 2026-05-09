import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    deleteDoc,
    query,
    orderBy,
} from "firebase/firestore";
import { db } from "./firebase";
import { User, Expense, SavingsGoal } from "./types";

// ── Users ──
export async function createUser(user: User): Promise<void> {
    await setDoc(doc(db, "users", user.id), {
        name: user.name,
        email: user.email,
        monthlyIncome: user.monthlyIncome,
        monthlyBudget: user.monthlyBudget,
        createdAt: user.createdAt,
    });
}

export async function getUser(userId: string): Promise<User | null> {
    const snap = await getDoc(doc(db, "users", userId));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as User;
}

export async function updateUser(updated: User): Promise<void> {
    const { id, ...data } = updated;
    await updateDoc(doc(db, "users", id), data);
}

// ── Expenses ──
export async function getExpenses(userId: string): Promise<Expense[]> {
    const q = query(
        collection(db, "users", userId, "expenses"),
        orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, userId, ...d.data() } as Expense));
}

export async function addExpense(expense: Expense): Promise<void> {
    await setDoc(doc(db, "users", expense.userId, "expenses", expense.id), {
        amount: expense.amount,
        category: expense.category,
        description: expense.description,
        merchant: expense.merchant,
        date: expense.date,
        paymentMethod: expense.paymentMethod,
        createdAt: expense.createdAt,
    });
}

export async function updateExpense(updated: Expense): Promise<void> {
    const { id, userId, ...data } = updated;
    await updateDoc(doc(db, "users", userId, "expenses", id), data);
}

export async function deleteExpense(userId: string, expenseId: string): Promise<void> {
    await deleteDoc(doc(db, "users", userId, "expenses", expenseId));
}

// ── Goals ──
export async function getGoals(userId: string): Promise<SavingsGoal[]> {
    const q = query(
        collection(db, "users", userId, "goals"),
        orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, userId, ...d.data() } as SavingsGoal));
}

export async function addGoal(goal: SavingsGoal): Promise<void> {
    await setDoc(doc(db, "users", goal.userId, "goals", goal.id), {
        name: goal.name,
        targetAmount: goal.targetAmount,
        savedAmount: goal.savedAmount,
        deadline: goal.deadline,
        createdAt: goal.createdAt,
    });
}

export async function updateGoal(updated: SavingsGoal): Promise<void> {
    const { id, userId, ...data } = updated;
    await updateDoc(doc(db, "users", userId, "goals", id), data);
}

export async function deleteGoal(userId: string, goalId: string): Promise<void> {
    await deleteDoc(doc(db, "users", userId, "goals", goalId));
}

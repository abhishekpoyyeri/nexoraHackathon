"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
} from "firebase/auth";
import { auth } from "./firebase";
import { User, Expense, SavingsGoal } from "./types";
import * as storage from "./storage";

interface AppState {
    user: User | null;
    expenses: Expense[];
    goals: SavingsGoal[];
    isLoading: boolean;
}

interface AppContextValue extends AppState {
    login: (email: string, password: string) => Promise<boolean>;
    register: (data: { name: string; email: string; password: string; monthlyIncome: number; monthlyBudget: number }) => Promise<boolean>;
    logout: () => Promise<void>;
    refreshExpenses: () => Promise<void>;
    refreshGoals: () => Promise<void>;
    updateUserProfile: (updates: Partial<User>) => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<AppState>({
        user: null,
        expenses: [],
        goals: [],
        isLoading: true,
    });

    // Listen to Firebase Auth state
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                const user = await storage.getUser(firebaseUser.uid);
                if (user) {
                    const [expenses, goals] = await Promise.all([
                        storage.getExpenses(user.id),
                        storage.getGoals(user.id),
                    ]);
                    setState({ user, expenses, goals, isLoading: false });
                } else {
                    setState((s) => ({ ...s, isLoading: false }));
                }
            } else {
                setState({ user: null, expenses: [], goals: [], isLoading: false });
            }
        });
        return () => unsubscribe();
    }, []);

    const refreshExpenses = useCallback(async () => {
        if (state.user) {
            const expenses = await storage.getExpenses(state.user.id);
            setState((s) => ({ ...s, expenses }));
        }
    }, [state.user]);

    const refreshGoals = useCallback(async () => {
        if (state.user) {
            const goals = await storage.getGoals(state.user.id);
            setState((s) => ({ ...s, goals }));
        }
    }, [state.user]);

    const login = async (email: string, password: string): Promise<boolean> => {
        try {
            const cred = await signInWithEmailAndPassword(auth, email, password);
            const user = await storage.getUser(cred.user.uid);
            if (user) {
                const [expenses, goals] = await Promise.all([
                    storage.getExpenses(user.id),
                    storage.getGoals(user.id),
                ]);
                setState({ user, expenses, goals, isLoading: false });
                return true;
            }
            return false;
        } catch {
            return false;
        }
    };

    const register = async (data: {
        name: string;
        email: string;
        password: string;
        monthlyIncome: number;
        monthlyBudget: number;
    }): Promise<boolean> => {
        try {
            const cred = await createUserWithEmailAndPassword(auth, data.email, data.password);
            const user: User = {
                id: cred.user.uid,
                name: data.name,
                email: data.email,
                monthlyIncome: data.monthlyIncome,
                monthlyBudget: data.monthlyBudget,
                createdAt: new Date().toISOString(),
            };
            await storage.createUser(user);
            setState({ user, expenses: [], goals: [], isLoading: false });
            return true;
        } catch {
            return false;
        }
    };

    const logout = async () => {
        await signOut(auth);
        setState({ user: null, expenses: [], goals: [], isLoading: false });
    };

    const updateUserProfile = async (updates: Partial<User>) => {
        if (!state.user) return;
        const updated = { ...state.user, ...updates };
        await storage.updateUser(updated);
        setState((s) => ({ ...s, user: updated }));
    };

    return (
        <AppContext.Provider
            value={{
                ...state,
                login,
                register,
                logout,
                refreshExpenses,
                refreshGoals,
                updateUserProfile,
            }}
        >
            {children}
        </AppContext.Provider>
    );
}

export function useApp() {
    const context = useContext(AppContext);
    if (!context) throw new Error("useApp must be used within AppProvider");
    return context;
}

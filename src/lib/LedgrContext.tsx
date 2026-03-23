import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Expense, Budget, ExpenseCategory, autoCategorize } from './store';

interface LedgrContextType {
  expenses: Expense[];
  budget: Budget;
  isLoaded: boolean;
  addExpense: (expense: Omit<Expense, 'id' | 'date' | 'category'> & { category?: ExpenseCategory, date?: string }) => Promise<void>;
  updateBudget: (newBudget: Budget) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  updateExpense: (updatedExpense: Expense) => Promise<void>;
}

const DEFAULT_BUDGET: Budget = {
  total: 50000,
  categories: {
    Food: 15000,
    Transport: 8000,
    Bills: 15000,
    Shopping: 7000,
    Grocery: 10000,
    Health: 3000,
    Other: 2000,
  }
};

const LedgrContext = createContext<LedgrContextType | undefined>(undefined);

export const LedgrProvider = ({ children }: { children: ReactNode }) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budget, setBudget] = useState<Budget>(DEFAULT_BUDGET);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const savedExpenses = await AsyncStorage.getItem('ledgr_expenses');
        const savedBudget = await AsyncStorage.getItem('ledgr_budget');
        if (savedExpenses) setExpenses(JSON.parse(savedExpenses));
        if (savedBudget) {
          const parsed = JSON.parse(savedBudget);
          setBudget({
            ...DEFAULT_BUDGET,
            ...parsed,
            categories: { ...DEFAULT_BUDGET.categories, ...parsed.categories }
          });
        }
      } catch (e) {
        console.error("Failed to load ledgr data", e);
      }
      setIsLoaded(true);
    };
    loadData();
  }, []);

  const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2);

  const addExpense = async (expense: Omit<Expense, 'id' | 'date' | 'category'> & { category?: ExpenseCategory, date?: string }) => {
    const finalCategory = expense.category || autoCategorize(expense.name);
    const newExpense: Expense = {
      ...expense,
      category: finalCategory,
      id: generateId(),
      date: expense.date || new Date().toISOString(),
    };
    
    const updated = [newExpense, ...expenses];
    setExpenses(updated);
    await AsyncStorage.setItem('ledgr_expenses', JSON.stringify(updated));
  };

  const updateBudget = async (newBudget: Budget) => {
    setBudget(newBudget);
    await AsyncStorage.setItem('ledgr_budget', JSON.stringify(newBudget));
  };

  const deleteExpense = async (id: string) => {
    const updated = expenses.filter(e => e.id !== id);
    setExpenses(updated);
    await AsyncStorage.setItem('ledgr_expenses', JSON.stringify(updated));
  };

  const updateExpense = async (updatedExpense: Expense) => {
    const updated = expenses.map(e => e.id === updatedExpense.id ? updatedExpense : e);
    setExpenses(updated);
    await AsyncStorage.setItem('ledgr_expenses', JSON.stringify(updated));
  };

  return (
    <LedgrContext.Provider value={{ expenses, budget, isLoaded, addExpense, updateBudget, deleteExpense, updateExpense }}>
      {children}
    </LedgrContext.Provider>
  );
};

export const useLedgr = () => {
  const context = useContext(LedgrContext);
  if (context === undefined) {
    throw new Error('useLedgr must be used within a LedgrProvider');
  }
  return context;
};

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Expense, Budget, ExpenseCategory, autoCategorize, Bill, DEFAULT_CATEGORIES } from './store';
import { addDays, isBefore, isAfter, startOfDay } from 'date-fns';

interface LedgrContextType {
  expenses: Expense[];
  budget: Budget;
  isLoaded: boolean;
  addExpense: (expense: Omit<Expense, 'id' | 'date' | 'category'> & { category?: ExpenseCategory, date?: string }) => Promise<void>;
  updateBudget: (newBudget: Budget) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  updateExpense: (updatedExpense: Expense) => Promise<void>;
  bills: Bill[];
  addBill: (bill: Omit<Bill, 'id'>) => Promise<void>;
  updateBill: (updatedBill: Bill) => Promise<void>;
  deleteBill: (id: string) => Promise<void>;
  isBillDueSoon: boolean;
  addCategory: (name: string) => Promise<void>;
  allCategories: ExpenseCategory[];
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
  const [bills, setBills] = useState<Bill[]>([]);
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const allCategories = [...DEFAULT_CATEGORIES, ...customCategories];

  useEffect(() => {
    const loadData = async () => {
      try {
        const savedExpenses = await AsyncStorage.getItem('ledgr_expenses');
        const savedBudget = await AsyncStorage.getItem('ledgr_budget');
        const savedBills = await AsyncStorage.getItem('ledgr_bills');
        const savedCustomCats = await AsyncStorage.getItem('ledgr_custom_cats');

        if (savedExpenses) setExpenses(JSON.parse(savedExpenses));
        if (savedBills) setBills(JSON.parse(savedBills));
        if (savedCustomCats) setCustomCategories(JSON.parse(savedCustomCats));

        if (savedBudget) {
          const parsed = JSON.parse(savedBudget);
          // Merge parsed categories with DEFAULT_BUDGET categories to ensure new defaults/customs exist
          const mergedCategories = { ...DEFAULT_BUDGET.categories, ...parsed.categories };
          setBudget({
            ...DEFAULT_BUDGET,
            ...parsed,
            categories: mergedCategories
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

  const addBill = async (bill: Omit<Bill, 'id'>) => {
    const newBill = { ...bill, id: generateId() };
    const updated = [newBill, ...bills];
    setBills(updated);
    await AsyncStorage.setItem('ledgr_bills', JSON.stringify(updated));
  };

  const updateBill = async (updatedBill: Bill) => {
    const updated = bills.map(b => b.id === updatedBill.id ? updatedBill : b);
    setBills(updated);
    await AsyncStorage.setItem('ledgr_bills', JSON.stringify(updated));
  };

  const deleteBill = async (id: string) => {
    const updated = bills.filter(b => b.id !== id);
    setBills(updated);
    await AsyncStorage.setItem('ledgr_bills', JSON.stringify(updated));
  };

  const addCategory = async (name: string) => {
    if (!name || allCategories.includes(name)) return;
    const updated = [...customCategories, name];
    setCustomCategories(updated);
    await AsyncStorage.setItem('ledgr_custom_cats', JSON.stringify(updated));
    
    // Also initialize budget for this category
    const updatedBudget = {
      ...budget,
      categories: { ...budget.categories, [name]: 0 }
    };
    setBudget(updatedBudget);
    await AsyncStorage.setItem('ledgr_budget', JSON.stringify(updatedBudget));
  };

  const isBillDueSoon = bills.some(bill => {
    if (bill.isPaid) return false;
    const dueDate = startOfDay(new Date(bill.dueDate));
    const today = startOfDay(new Date());
    const threeDaysFromNow = addDays(today, 3);
    return isBefore(dueDate, threeDaysFromNow);
  });

  return (
    <LedgrContext.Provider value={{ 
      expenses, budget, isLoaded, addExpense, updateBudget, deleteExpense, updateExpense,
      bills, addBill, updateBill, deleteBill, isBillDueSoon, addCategory, allCategories
    }}>
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

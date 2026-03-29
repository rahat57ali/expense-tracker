import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Expense, Budget, ExpenseCategory, autoCategorize, Bill, DEFAULT_CATEGORIES, RolloverRecoveryState } from './store';
import { addDays, isBefore, startOfDay, format } from 'date-fns';

export interface MonthEndData {
  prevMonth: string;
  totalBudget: number;
  totalSpent: number;
  remaining: number;
  recoveryState?: RolloverRecoveryState;
}

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
  deleteCategory: (name: string) => Promise<void>;
  allCategories: ExpenseCategory[];
  monthEndData: MonthEndData | null;
  resolveMonthEnd: (rolloverAmount: number, updatedBudget?: Budget) => Promise<void>;
  saveRolloverRecovery: (state: RolloverRecoveryState | null) => Promise<void>;
  reloadBudgetState: () => Promise<void>;
  showDevTools: boolean;
  toggleDevTools: () => Promise<boolean>;
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
  const [activeCategories, setActiveCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [monthEndData, setMonthEndData] = useState<MonthEndData | null>(null);
  const [showDevTools, setShowDevTools] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const allCategories = activeCategories; // alias for provider consistency

  const reloadBudgetState = async () => {
    try {
      const savedExpenses = await AsyncStorage.getItem('ledgr_expenses');
      const savedBudget = await AsyncStorage.getItem('ledgr_budget');
      const savedBills = await AsyncStorage.getItem('ledgr_bills');
      const savedCategories = await AsyncStorage.getItem('ledgr_categories');
      const savedCustomCats = await AsyncStorage.getItem('ledgr_custom_cats');
      const savedDevTools = await AsyncStorage.getItem('ledgr_dev_tools');
      
      if (savedDevTools) setShowDevTools(JSON.parse(savedDevTools));
      if (savedExpenses) setExpenses(JSON.parse(savedExpenses));
      if (savedBills) setBills(JSON.parse(savedBills));

      // Migration logic for categories
      if (savedCategories) {
        setActiveCategories(JSON.parse(savedCategories));
      } else if (savedCustomCats) {
        const combined = [...DEFAULT_CATEGORIES, ...JSON.parse(savedCustomCats)];
        const unique = Array.from(new Set(combined));
        setActiveCategories(unique);
        await AsyncStorage.setItem('ledgr_categories', JSON.stringify(unique));
      } else {
        setActiveCategories(DEFAULT_CATEGORIES);
      }

      const currentMonth = format(new Date(), 'yyyy-MM');
      if (savedBudget) {
        const parsed = JSON.parse(savedBudget);
        const mergedCategories = { ...DEFAULT_BUDGET.categories, ...parsed.categories };
        let finalBudget = {
          ...DEFAULT_BUDGET,
          ...parsed,
          categories: mergedCategories
        };

        // Month End Detection Logic
        if (parsed.budgetMonth && parsed.budgetMonth !== currentMonth) {
          const prevMonth = parsed.budgetMonth;
          
          // Calculate spent in prevMonth using parsed expenses
          const expensesList: Expense[] = savedExpenses ? JSON.parse(savedExpenses) : [];
          const spent = expensesList
            .filter(e => e.date.startsWith(prevMonth))
            .reduce((sum, e) => sum + e.amount, 0);
            
          const remaining = finalBudget.total - spent;
          
          const rawRecovery = await AsyncStorage.getItem('ledgr_rollover_recovery');
          let recoveryState: RolloverRecoveryState | undefined = undefined;
          if (rawRecovery) {
            recoveryState = JSON.parse(rawRecovery);
          }
          
          setMonthEndData({
            prevMonth,
            totalBudget: finalBudget.total,
            totalSpent: spent,
            remaining,
            recoveryState
          });
        } else if (!parsed.budgetMonth) {
          finalBudget.budgetMonth = currentMonth;
          await AsyncStorage.setItem('ledgr_budget', JSON.stringify(finalBudget));
        }

        setBudget(finalBudget);
      } else {
        const initialBudget = { ...DEFAULT_BUDGET, budgetMonth: currentMonth };
        setBudget(initialBudget);
        await AsyncStorage.setItem('ledgr_budget', JSON.stringify(initialBudget));
      }
    } catch (e) {
      console.error("Failed to load ledgr data", e);
    }
    setIsLoaded(true);
  };

  useEffect(() => {
    reloadBudgetState();
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
    const updated = [...activeCategories, name];
    setActiveCategories(updated);
    await AsyncStorage.setItem('ledgr_categories', JSON.stringify(updated));
    
    // Also initialize budget for this category
    const updatedBudget = {
      ...budget,
      categories: { ...budget.categories, [name]: 0 }
    };
    setBudget(updatedBudget);
    await AsyncStorage.setItem('ledgr_budget', JSON.stringify(updatedBudget));
  };

  const deleteCategory = async (name: string) => {
    if (DEFAULT_CATEGORIES.includes(name)) return;
    if (activeCategories.length <= 1) return;

    // 1. Update active categories
    const newCategories = activeCategories.filter(c => c !== name);
    setActiveCategories(newCategories);
    await AsyncStorage.setItem('ledgr_categories', JSON.stringify(newCategories));

    // 2. Remove from budget config
    const newBudgetCats = { ...budget.categories };
    delete newBudgetCats[name];
    const updatedBudget = { ...budget, categories: newBudgetCats };
    setBudget(updatedBudget);
    await AsyncStorage.setItem('ledgr_budget', JSON.stringify(updatedBudget));
    
    // Note: We deliberately do NOT remap expenses or bills.
    // This allows historical data to retain the original category name (Soft-Delete).
  };

  const isBillDueSoon = bills.some(bill => {
    if (bill.isPaid) return false;
    const dueDate = startOfDay(new Date(bill.dueDate));
    const today = startOfDay(new Date());
    const threeDaysFromNow = addDays(today, 3);
    return isBefore(dueDate, threeDaysFromNow);
  });

  const resolveMonthEnd = async (rolloverAmount: number, updatedBudget?: Budget) => {
    if (!monthEndData) return;
    
    const finalBudgetConfig = updatedBudget ? updatedBudget : budget;
    const newTotal = finalBudgetConfig.total + rolloverAmount;
    const currentMonth = format(new Date(), 'yyyy-MM');
    const newBudgetObj = { ...finalBudgetConfig, total: newTotal, budgetMonth: currentMonth };
    
    setBudget(newBudgetObj);
    await AsyncStorage.setItem('ledgr_budget', JSON.stringify(newBudgetObj));
    await AsyncStorage.removeItem('ledgr_rollover_recovery');
    setMonthEndData(null);
  };

  const saveRolloverRecovery = async (state: RolloverRecoveryState | null) => {
    if (state) {
      await AsyncStorage.setItem('ledgr_rollover_recovery', JSON.stringify(state));
    } else {
      await AsyncStorage.removeItem('ledgr_rollover_recovery');
    }
  };
  
  const toggleDevTools = async () => {
    const newState = !showDevTools;
    setShowDevTools(newState);
    await AsyncStorage.setItem('ledgr_dev_tools', JSON.stringify(newState));
    return newState;
  };

  return (
    <LedgrContext.Provider value={{ 
      expenses, budget, isLoaded, addExpense, updateBudget, deleteExpense, updateExpense,
      bills, addBill, updateBill, deleteBill, isBillDueSoon, addCategory, deleteCategory, allCategories,
      monthEndData, resolveMonthEnd, saveRolloverRecovery, reloadBudgetState,
      showDevTools, toggleDevTools
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

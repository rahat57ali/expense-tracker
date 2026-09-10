import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Expense, Budget, ExpenseCategory, autoCategorize, Bill, DEFAULT_CATEGORIES, RolloverRecoveryState, BudgetAddition } from './store';
import { addDays, isBefore, startOfDay, format } from 'date-fns';

export interface MonthEndData {
  prevMonth: string;
  totalBudget: number;
  totalSpent: number;
  remaining: number;
  recoveryState?: RolloverRecoveryState;
  isReviewMode?: boolean;
  budgetSnapshot?: Budget;
}


interface LedgrContextType {
  expenses: Expense[];
  budget: Budget;
  effectiveBudget: Budget;
  budgetHistory: Record<string, Budget>;
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
  moveCategoryUp: (name: string) => Promise<void>;
  moveCategoryDown: (name: string) => Promise<void>;
  allCategories: ExpenseCategory[];
  budgetAdditions: BudgetAddition[];
  addBudgetAddition: (addition: Omit<BudgetAddition, 'id' | 'createdAt'>) => Promise<void>;
  deleteBudgetAddition: (id: string) => Promise<void>;
  currentMonthAdditions: BudgetAddition[];
  totalAdditionsThisMonth: number;
  monthEndData: MonthEndData | null;
  resolveMonthEnd: (rolloverAmount: number, updatedBudget?: Budget) => Promise<void>;
  saveRolloverRecovery: (state: RolloverRecoveryState | null) => Promise<void>;
  reloadBudgetState: () => Promise<void>;
  showDevTools: boolean;
  toggleDevTools: () => Promise<boolean>;
  importExpenses: (newExpenses: Expense[]) => Promise<void>;
  simulateRollover: () => Promise<void>;
  showMonthSummary: (monthStr: string) => void;
  dismissMonthSummary: () => void;
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
  const [budgetHistory, setBudgetHistory] = useState<Record<string, Budget>>({});
  const [bills, setBills] = useState<Bill[]>([]);
  const [budgetAdditions, setBudgetAdditions] = useState<BudgetAddition[]>([]);
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
      const savedHistory = await AsyncStorage.getItem('ledgr_budget_history');
      const savedAdditions = await AsyncStorage.getItem('ledgr_budget_additions');
      
      const historyObj = savedHistory ? JSON.parse(savedHistory) : {};
      
      if (savedAdditions) setBudgetAdditions(JSON.parse(savedAdditions));
      if (savedDevTools) setShowDevTools(JSON.parse(savedDevTools));
      if (savedExpenses) {
        const parsedExpenses = JSON.parse(savedExpenses);
        parsedExpenses.sort((a: Expense, b: Expense) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setExpenses(parsedExpenses);
      }
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
            .filter(e => format(new Date(e.date), 'yyyy-MM') === prevMonth)
            .reduce((sum, e) => sum + e.amount, 0);
            
          const remaining = finalBudget.total - spent;
          
          const rawRecovery = await AsyncStorage.getItem('ledgr_rollover_recovery');
          let recoveryState: RolloverRecoveryState | undefined = undefined;
          if (rawRecovery) {
            recoveryState = JSON.parse(rawRecovery);
          }
          
          const historicalBudget = historyObj[prevMonth] || finalBudget;
          
          setMonthEndData({
            prevMonth,
            totalBudget: historicalBudget.total,
            totalSpent: spent,
            remaining: historicalBudget.total - spent,
            recoveryState,
            budgetSnapshot: historicalBudget
          });
        } else if (!parsed.budgetMonth) {
          finalBudget.budgetMonth = currentMonth;
          await AsyncStorage.setItem('ledgr_budget', JSON.stringify(finalBudget));
        }

        if (finalBudget.budgetMonth && !historyObj[finalBudget.budgetMonth]) {
          historyObj[finalBudget.budgetMonth] = finalBudget;
          setBudgetHistory(historyObj);
          await AsyncStorage.setItem('ledgr_budget_history', JSON.stringify(historyObj));
        } else {
          setBudgetHistory(historyObj);
        }

        setBudget(finalBudget);
      } else {
        const initialBudget = { ...DEFAULT_BUDGET, budgetMonth: currentMonth };
        setBudget(initialBudget);
        await AsyncStorage.setItem('ledgr_budget', JSON.stringify(initialBudget));
        
        historyObj[currentMonth] = initialBudget;
        setBudgetHistory(historyObj);
        await AsyncStorage.setItem('ledgr_budget_history', JSON.stringify(historyObj));
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
      date: expense.date || format(new Date(), "yyyy-MM-dd'T'HH:mm:ss"),
      createdAt: new Date().toISOString(),
    };
    
    const updated = [newExpense, ...expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setExpenses(updated);
    await AsyncStorage.setItem('ledgr_expenses', JSON.stringify(updated));
  };

  const updateBudget = async (newBudget: Budget) => {
    const currentMonth = format(new Date(), 'yyyy-MM');
    const updated = { ...newBudget, budgetMonth: currentMonth };
    setBudget(updated);
    await AsyncStorage.setItem('ledgr_budget', JSON.stringify(updated));

    // Keep history in sync
    const newHistory = { ...budgetHistory, [currentMonth]: updated };
    setBudgetHistory(newHistory);
    await AsyncStorage.setItem('ledgr_budget_history', JSON.stringify(newHistory));
  };

  const addBudgetAddition = async (addition: Omit<BudgetAddition, 'id' | 'createdAt'>) => {
    const newAddition: BudgetAddition = {
      ...addition,
      id: generateId(),
      date: addition.date || format(new Date(), 'yyyy-MM-dd'),
      createdAt: new Date().toISOString(),
    };
    const updated = [newAddition, ...budgetAdditions];
    setBudgetAdditions(updated);
    await AsyncStorage.setItem('ledgr_budget_additions', JSON.stringify(updated));
  };

  const deleteBudgetAddition = async (id: string) => {
    const updated = budgetAdditions.filter(a => a.id !== id);
    setBudgetAdditions(updated);
    await AsyncStorage.setItem('ledgr_budget_additions', JSON.stringify(updated));
  };

  const activeMonth = budget.budgetMonth || format(new Date(), 'yyyy-MM');

  const currentMonthAdditions = useMemo(() => {
    return budgetAdditions.filter(a => {
      try {
        return format(new Date(a.date), 'yyyy-MM') === activeMonth;
      } catch {
        return false;
      }
    });
  }, [budgetAdditions, activeMonth]);

  const totalAdditionsThisMonth = useMemo(() => {
    return currentMonthAdditions.reduce((sum, a) => sum + a.amount, 0);
  }, [currentMonthAdditions]);

  const effectiveBudget = useMemo<Budget>(() => {
    const categoryAdditions: Record<string, number> = {};
    currentMonthAdditions.forEach(a => {
      if (a.targetCategory) {
        categoryAdditions[a.targetCategory] = (categoryAdditions[a.targetCategory] || 0) + a.amount;
      }
    });

    const effectiveCategories: Record<string, number> = { ...budget.categories };
    Object.keys(categoryAdditions).forEach(cat => {
      effectiveCategories[cat] = (effectiveCategories[cat] || 0) + categoryAdditions[cat];
    });

    return {
      ...budget,
      total: budget.total + totalAdditionsThisMonth,
      categories: effectiveCategories,
    };
  }, [budget, currentMonthAdditions, totalAdditionsThisMonth]);

  const deleteExpense = async (id: string) => {
    const updated = expenses.filter(e => e.id !== id);
    setExpenses(updated);
    await AsyncStorage.setItem('ledgr_expenses', JSON.stringify(updated));
  };

  const updateExpense = async (updatedExpense: Expense) => {
    const updated = expenses.map(e => e.id === updatedExpense.id ? updatedExpense : e).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
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
    const trimmed = name.trim();
    if (!trimmed || activeCategories.some(c => c.toLowerCase() === trimmed.toLowerCase())) return;
    const updated = [...activeCategories, trimmed];
    setActiveCategories(updated);
    await AsyncStorage.setItem('ledgr_categories', JSON.stringify(updated));
    
    // Also initialize budget for this category
    const updatedBudget = {
      ...budget,
      categories: { ...budget.categories, [trimmed]: 0 }
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

  const moveCategoryUp = async (name: string) => {
    const idx = activeCategories.indexOf(name);
    if (idx > 0) {
      const newCategories = [...activeCategories];
      [newCategories[idx - 1], newCategories[idx]] = [newCategories[idx], newCategories[idx - 1]];
      setActiveCategories(newCategories);
      await AsyncStorage.setItem('ledgr_categories', JSON.stringify(newCategories));
    }
  };

  const moveCategoryDown = async (name: string) => {
    const idx = activeCategories.indexOf(name);
    if (idx > -1 && idx < activeCategories.length - 1) {
      const newCategories = [...activeCategories];
      [newCategories[idx + 1], newCategories[idx]] = [newCategories[idx], newCategories[idx + 1]];
      setActiveCategories(newCategories);
      await AsyncStorage.setItem('ledgr_categories', JSON.stringify(newCategories));
    }
  };

  const isBillDueSoon = bills.some(bill => {
    if (bill.isPaused) return false;
    if (bill.isPaid) return false;
    const currentMonth = format(new Date(), 'yyyy-MM');
    if (bill.lastPaidDate && format(new Date(bill.lastPaidDate), 'yyyy-MM') === currentMonth) {
      return false;
    }
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
    // Snapshot what the budget was before we transition to the new total
    const oldMonth = monthEndData.prevMonth || format(new Date(), 'yyyy-MM');
    const newHistory = { ...budgetHistory, [oldMonth]: budget }; 
    newHistory[currentMonth] = newBudgetObj;
    
    setBudgetHistory(newHistory);
    await AsyncStorage.setItem('ledgr_budget_history', JSON.stringify(newHistory));

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

  const importExpenses = async (newExpenses: Expense[]) => {
    const updated = [...newExpenses, ...expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setExpenses(updated);
    await AsyncStorage.setItem('ledgr_expenses', JSON.stringify(updated));
  };

  const simulateRollover = async () => {
    const currentMonth = format(new Date(), 'yyyy-MM');
    const spent = expenses
      .filter(e => format(new Date(e.date), 'yyyy-MM') === currentMonth)
      .reduce((sum, e) => sum + e.amount, 0);
    
    setMonthEndData({
      prevMonth: currentMonth,
      totalBudget: effectiveBudget.total,
      totalSpent: spent,
      remaining: effectiveBudget.total - spent,
      budgetSnapshot: effectiveBudget
    });
  };

  const showMonthSummary = (monthStr: string) => {
    const historicalSnapshot = budgetHistory[monthStr];
    
    const spent = expenses
      .filter(e => format(new Date(e.date), 'yyyy-MM') === monthStr)
      .reduce((sum, e) => sum + e.amount, 0);
    
    setMonthEndData({
      prevMonth: monthStr,
      totalBudget: historicalSnapshot ? historicalSnapshot.total : 0,
      totalSpent: spent,
      remaining: historicalSnapshot ? historicalSnapshot.total - spent : -spent,
      isReviewMode: true,
      budgetSnapshot: historicalSnapshot
    });
  };

  const dismissMonthSummary = () => {
    setMonthEndData(null);
  };

  return (
    <LedgrContext.Provider value={{ 
      expenses, budget, effectiveBudget, budgetHistory, isLoaded, addExpense, updateBudget, deleteExpense, updateExpense,
      bills, addBill, updateBill, deleteBill, isBillDueSoon, addCategory, deleteCategory, moveCategoryUp, moveCategoryDown, allCategories,
      budgetAdditions, addBudgetAddition, deleteBudgetAddition, currentMonthAdditions, totalAdditionsThisMonth,
      monthEndData, resolveMonthEnd, saveRolloverRecovery, reloadBudgetState,
      showDevTools, toggleDevTools, importExpenses, simulateRollover, showMonthSummary, dismissMonthSummary
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

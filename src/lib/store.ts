import AsyncStorage from '@react-native-async-storage/async-storage';

export type ExpenseCategory = string;

export const DEFAULT_CATEGORIES: ExpenseCategory[] = ['Food', 'Grocery', 'Transport', 'Bills', 'Shopping', 'Health', 'Other'];

export interface Expense {
  id: string;
  name: string;
  amount: number;
  category: ExpenseCategory;
  date: string;
  notes?: string;
}

export interface Bill {
  id: string;
  name: string;
  amount: number;
  dueDate: string; // ISO date for next occurrence
  category: ExpenseCategory;
  isPaid?: boolean;
}

export interface Budget {
  total: number;
  categories: Record<ExpenseCategory, number>;
}

export function autoCategorize(name: string): ExpenseCategory {
  const lower = name.toLowerCase();
  if (lower.match(/uber|taxi|metro|train|bus|fuel|gas|lyft|careem/)) return 'Transport';
  if (lower.match(/grocery|supermarket|mart|store|milk|bread|eggs|fruits|vegetables/)) return 'Grocery';
  if (lower.match(/kfc|mcdonald|coffee|starbucks|food|lunch|dinner|restaurant|bakery/)) return 'Food';
  if (lower.match(/electric|water|internet|bill|rent|utility|wapda|ptcl/)) return 'Bills';
  if (lower.match(/amazon|mall|clothes|shopping|shoes|daraz|outfitters/)) return 'Shopping';
  if (lower.match(/pharmacy|doctor|hospital|medicine|clinic|chughtai/)) return 'Health';
  return 'Other';
}

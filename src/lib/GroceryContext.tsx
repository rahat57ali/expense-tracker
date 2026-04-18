import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { GroceryList, GroceryItem, ExpenseCategory } from './store';
import { useLedgr } from './LedgrContext';

const STORAGE_KEY = 'ledgr_grocery_lists';
const PHOTO_DIR = `${FileSystem.documentDirectory || ''}grocery_photos/`;

interface GroceryContextType {
  lists: GroceryList[];
  isLoaded: boolean;
  createList: (title: string) => Promise<GroceryList>;
  updateList: (list: GroceryList) => Promise<void>;
  deleteList: (id: string) => Promise<void>;
  addItem: (listId: string, item: Omit<GroceryItem, 'id'>) => Promise<void>;
  updateItem: (listId: string, item: GroceryItem) => Promise<void>;
  removeItem: (listId: string, itemId: string) => Promise<void>;
  toggleBought: (listId: string, itemId: string) => Promise<void>;
  addPhoto: (listId: string, uri: string) => Promise<void>;
  removePhoto: (listId: string, photoUri: string) => Promise<void>;
  markComplete: (id: string) => Promise<void>;
  clearCompletedLists: () => Promise<void>;
  getStorageSize: () => Promise<number>;
  logAsExpenses: (listId: string) => Promise<void>;
}

const GroceryContext = createContext<GroceryContextType | undefined>(undefined);

export const GroceryProvider = ({ children }: { children: ReactNode }) => {
  const [lists, setLists] = useState<GroceryList[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const { addExpense } = useLedgr();

  // Ensure photo directory exists
  useEffect(() => {
    (async () => {
      const dirInfo = await FileSystem.getInfoAsync(PHOTO_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(PHOTO_DIR, { intermediates: true });
      }
    })();
  }, []);

  // Load lists from AsyncStorage
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setLists(JSON.parse(raw));
      } catch (e) {
        console.error('Failed to load grocery lists', e);
      }
      setIsLoaded(true);
    })();
  }, []);

  const persist = useCallback(async (updated: GroceryList[]) => {
    setLists(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }, []);

  const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2);

  const createList = async (title: string): Promise<GroceryList> => {
    const newList: GroceryList = {
      id: generateId(),
      title,
      createdAt: new Date().toISOString(),
      status: 'active',
      items: [],
      photoUris: [],
    };
    const updated = [newList, ...lists];
    await persist(updated);
    return newList;
  };

  const updateList = async (list: GroceryList) => {
    const updated = lists.map(l => l.id === list.id ? list : l);
    await persist(updated);
  };

  const deleteList = async (id: string) => {
    const list = lists.find(l => l.id === id);
    if (list) {
      // Delete associated photos from disk
      for (const uri of list.photoUris) {
        try {
          const info = await FileSystem.getInfoAsync(uri);
          if (info.exists) await FileSystem.deleteAsync(uri);
        } catch (_) {}
      }
    }
    const updated = lists.filter(l => l.id !== id);
    await persist(updated);
  };

  const addItem = async (listId: string, item: Omit<GroceryItem, 'id'>) => {
    const newItem: GroceryItem = { ...item, id: generateId() };
    const updated = lists.map(l => {
      if (l.id === listId) return { ...l, items: [...l.items, newItem] };
      return l;
    });
    await persist(updated);
  };

  const updateItem = async (listId: string, item: GroceryItem) => {
    const updated = lists.map(l => {
      if (l.id === listId) {
        return { ...l, items: l.items.map(i => i.id === item.id ? item : i) };
      }
      return l;
    });
    await persist(updated);
  };

  const removeItem = async (listId: string, itemId: string) => {
    const updated = lists.map(l => {
      if (l.id === listId) {
        return { ...l, items: l.items.filter(i => i.id !== itemId) };
      }
      return l;
    });
    await persist(updated);
  };

  const toggleBought = async (listId: string, itemId: string) => {
    const updated = lists.map(l => {
      if (l.id === listId) {
        return {
          ...l,
          items: l.items.map(i => i.id === itemId ? { ...i, isBought: !i.isBought } : i),
        };
      }
      return l;
    });
    await persist(updated);
  };

  const addPhoto = async (listId: string, sourceUri: string) => {
    const filename = `${listId}_${Date.now()}.jpg`;
    const destUri = PHOTO_DIR + filename;
    await FileSystem.copyAsync({ from: sourceUri, to: destUri });
    const updated = lists.map(l => {
      if (l.id === listId) return { ...l, photoUris: [...l.photoUris, destUri] };
      return l;
    });
    await persist(updated);
  };

  const removePhoto = async (listId: string, photoUri: string) => {
    try {
      const info = await FileSystem.getInfoAsync(photoUri);
      if (info.exists) await FileSystem.deleteAsync(photoUri);
    } catch (_) {}
    const updated = lists.map(l => {
      if (l.id === listId) return { ...l, photoUris: l.photoUris.filter(u => u !== photoUri) };
      return l;
    });
    await persist(updated);
  };

  const markComplete = async (id: string) => {
    const updated = lists.map(l => l.id === id ? { ...l, status: 'complete' as const } : l);
    await persist(updated);
  };

  const clearCompletedLists = async () => {
    const completed = lists.filter(l => l.status === 'complete');
    for (const list of completed) {
      for (const uri of list.photoUris) {
        try {
          const info = await FileSystem.getInfoAsync(uri);
          if (info.exists) await FileSystem.deleteAsync(uri);
        } catch (_) {}
      }
    }
    const updated = lists.filter(l => l.status !== 'complete');
    await persist(updated);
  };

  const getStorageSize = async (): Promise<number> => {
    let totalBytes = 0;
    // JSON data size
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) totalBytes += new Blob([raw]).size;
    // Photo files size
    for (const list of lists) {
      for (const uri of list.photoUris) {
        try {
          const info = await FileSystem.getInfoAsync(uri);
          if (info.exists && 'size' in info) totalBytes += (info as any).size || 0;
        } catch (_) {}
      }
    }
    return totalBytes;
  };

  const logAsExpenses = async (listId: string) => {
    const list = lists.find(l => l.id === listId);
    if (!list) return;
    const boughtItems = list.items.filter(i => i.isBought && i.estimatedPrice > 0);
    // Group by category
    const grouped: Record<string, { total: number; names: string[] }> = {};
    for (const item of boughtItems) {
      const cat = item.category;
      if (!grouped[cat]) grouped[cat] = { total: 0, names: [] };
      grouped[cat].total += item.estimatedPrice * item.quantity;
      grouped[cat].names.push(item.name);
    }
    // Create one expense per category
    for (const [cat, data] of Object.entries(grouped)) {
      const name = data.names.length <= 2
        ? data.names.join(', ')
        : `${data.names.slice(0, 2).join(', ')} +${data.names.length - 2} more`;
      await addExpense({
        name: `Grocery: ${name}`,
        amount: data.total,
        category: cat as ExpenseCategory,
        date: new Date().toISOString(),
      });
    }
  };

  return (
    <GroceryContext.Provider value={{
      lists, isLoaded, createList, updateList, deleteList,
      addItem, updateItem, removeItem, toggleBought,
      addPhoto, removePhoto, markComplete, clearCompletedLists,
      getStorageSize, logAsExpenses,
    }}>
      {children}
    </GroceryContext.Provider>
  );
};

export const useGrocery = () => {
  const context = useContext(GroceryContext);
  if (context === undefined) {
    throw new Error('useGrocery must be used within a GroceryProvider');
  }
  return context;
};

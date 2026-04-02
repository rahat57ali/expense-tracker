import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Platform } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLedgr } from '../lib/LedgrContext';
import { ExpenseCategory, Budget, DEFAULT_CATEGORIES } from '../lib/store';
import { Coffee, Car, Home as HomeIcon, ShoppingBag, Heart, MoreHorizontal, ShoppingBasket, PlusCircle, Pencil, Trash2 } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSnackbar } from '../components/Snackbar';
import DeleteCategoryModal from '../components/DeleteCategoryModal';
import { exportExpensesToXLSX, importExpensesFromFile } from '../lib/dateUtils';
import { Download, Upload } from 'lucide-react-native';

const CATEGORY_ICONS: Record<ExpenseCategory, any> = {
  Food: Coffee,
  Transport: Car,
  Bills: HomeIcon,
  Shopping: ShoppingBag,
  Grocery: ShoppingBasket,
  Health: Heart,
  Other: MoreHorizontal,
};



export default function SettingsScreen() {
  const { budget, updateBudget, isLoaded, expenses, allCategories, addCategory, deleteCategory, reloadBudgetState, showDevTools, importExpenses, simulateRollover } = useLedgr();
  const { showSnackbar } = useSnackbar();
  const [localBudget, setLocalBudget] = useState<Budget>(budget);
  const [newCatName, setNewCatName] = useState('');
  const [isAddingCat, setIsAddingCat] = useState(false);
  
  // Delete Category Modal State
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (isLoaded) {
      setLocalBudget(budget);
    }
  }, [budget, isLoaded]);

  const totalAllocated = useMemo(() =>
    Object.values(localBudget.categories).reduce((sum, val) => sum + val, 0),
    [localBudget.categories]);

  const unallocated = localBudget.total - totalAllocated;
  const isOverAllocated = unallocated < 0;

  const handleSaveBudget = () => {
    updateBudget(localBudget);
    showSnackbar('Budget configuration saved!', 'success');
  };

  const handleCatChange = (cat: ExpenseCategory, val: string) => {
    const num = parseInt(val) || 0;
    setLocalBudget(prev => ({
      ...prev,
      categories: { ...prev.categories, [cat]: num }
    }));
  };

  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const handleExport = async () => {
    if (expenses.length === 0) {
      showSnackbar('No expenses to export', 'info');
      return;
    }
    
    setIsExporting(true);
    const success = await exportExpensesToXLSX(expenses);
    setIsExporting(false);
    
    if (success) {
      showSnackbar('Data exported successfully', 'success');
    }
  };

  const handleImport = async () => {
    setIsImporting(true);
    const result = await importExpensesFromFile(expenses);
    setIsImporting(false);

    if (result && result.expenses && result.expenses.length > 0) {
      await importExpenses(result.expenses);
      showSnackbar(`${result.imported} expenses imported, ${result.skipped} rows skipped`, 'success');
    } else if (result) {
      showSnackbar(`No new expenses to import (${result.skipped} duplicates/invalid skipped)`, 'info');
    }
  };

  const handleAddCategory = () => {
    if (!newCatName.trim()) return;
    addCategory(newCatName.trim());
    setNewCatName('');
    setIsAddingCat(false);
    showSnackbar('Category added!', 'success');
  };

  const handleDeleteCategory = (cat: string) => {
    setCategoryToDelete(cat);
    setIsDeleteModalVisible(true);
  };

  const confirmDeleteCategory = async () => {
    if (!categoryToDelete) return;
    const catName = categoryToDelete;
    
    // Close modal first for smooth UX
    setIsDeleteModalVisible(false);
    setCategoryToDelete(null);

    await deleteCategory(catName);
    showSnackbar(`Category "${catName}" deleted`, 'success');
  };

  if (!isLoaded) return <View style={styles.container} />;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAwareScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        extraScrollHeight={100}
        enableOnAndroid={true}
        keyboardShouldPersistTaps="handled"
      >

        <View style={styles.header}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.brandName}>LEDGR</Text>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>Manage your profile & data</Text>
        </View>

        {/* Budget Configuration Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Budget Configuration</Text>
          <Text style={styles.sectionSubtitle}>Define your monthly spending limits</Text>
        </View>

        <View style={styles.budgetMainCard}>
          <View style={styles.allocationHeader}>
            <Text style={styles.allocationLabel}>TOTAL MONTHLY BUDGET</Text>
            <View style={[styles.allocationPill, isOverAllocated ? styles.pillDanger : styles.pillSuccess]}>
              <Text style={[styles.pillText, isOverAllocated ? styles.pillTextDanger : styles.pillTextSuccess]}>
                {isOverAllocated ? 'OVER-ALLOCATED' : 'ALLOCATED'}
              </Text>
            </View>
          </View>

          <View style={styles.totalInputWrapper}>
            <View style={styles.totalInputRow}>
              <Text style={styles.totalCurrency}>PKR</Text>
              <TextInput
                style={styles.totalInput}
                keyboardType="numeric"
                value={localBudget.total.toString()}
                onChangeText={(val) => setLocalBudget(p => ({ ...p, total: parseInt(val) || 0 }))}
              />
              <Pencil size={20} color="#00F0FF" style={{ marginLeft: 12 }} />
            </View>
          </View>

          <View style={styles.allocationBarContainer}>
            <View style={styles.allocationBarBg}>
              <View
                style={[
                  styles.allocationBarFill,
                  { width: `${Math.min(100, (totalAllocated / localBudget.total) * 100)}%` },
                  isOverAllocated && styles.allocationBarFillDanger
                ]}
              />
            </View>
            <View style={styles.allocationStats}>
              <Text style={styles.statText}>Allocated: PKR {totalAllocated.toLocaleString()}</Text>
              <Text style={[styles.statValue, isOverAllocated && styles.textDanger]}>
                {isOverAllocated ? `Exceeded by: PKR ${Math.abs(unallocated).toLocaleString()}` : `Remaining: PKR ${unallocated.toLocaleString()}`}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.catGridHeader}>
          <Text style={styles.catSectionLabel}>CATEGORY ALLOCATION</Text>
          <TouchableOpacity style={styles.addCatBtnSmall} onPress={() => setIsAddingCat(true)}>
            <PlusCircle size={14} color="#00F0FF" />
            <Text style={styles.addCatBtnTextSmall}>NEW</Text>
          </TouchableOpacity>
        </View>

        {isAddingCat && (
          <View style={styles.quickAddCat}>
            <TextInput
              style={styles.quickAddInput}
              placeholder="Category Name"
              placeholderTextColor="#606060"
              value={newCatName}
              onChangeText={setNewCatName}
              autoFocus
            />
            <TouchableOpacity style={styles.quickAddDone} onPress={handleAddCategory}>
              <Text style={styles.quickAddDoneText}>ADD</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAddCancel} onPress={() => setIsAddingCat(false)}>
              <Text style={styles.quickAddCancelText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.catBudgetGrid}>
          {allCategories.map(cat => {
            const Icon = CATEGORY_ICONS[cat as ExpenseCategory] || MoreHorizontal;
            const amount = localBudget.categories[cat] || 0;
            const percentage = localBudget.total > 0 ? ((amount / localBudget.total) * 100).toFixed(1) : '0.0';

            return (
              <View key={cat} style={styles.modernCatCard}>
                <View style={styles.catCardHeader}>
                  <View style={styles.catIconBox}>
                    <Icon color="#00F0FF" size={14} />
                  </View>
                  <Text style={styles.catName} numberOfLines={1}>{cat}</Text>
                  
                  {!DEFAULT_CATEGORIES.includes(cat) && (
                    <TouchableOpacity 
                      style={styles.deleteCatBtn} 
                      onPress={() => handleDeleteCategory(cat)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Trash2 size={12} color="#EF4444" opacity={0.6} />
                    </TouchableOpacity>
                  )}
                  
                  <Text style={styles.catPercent}>{percentage}%</Text>
                </View>
                <View style={styles.catInputContainer}>
                  <Text style={styles.catInputCurrency}>PKR</Text>
                  <TextInput
                    style={styles.catInput}
                    keyboardType="numeric"
                    value={amount.toString()}
                    onChangeText={(val) => handleCatChange(cat, val)}
                  />
                </View>
              </View>
            );
          })}
        </View>

        <TouchableOpacity
          style={[styles.mainSaveButton, { opacity: (JSON.stringify(localBudget) !== JSON.stringify(budget)) ? 1 : 0.6 }]}
          onPress={handleSaveBudget}
          disabled={JSON.stringify(localBudget) === JSON.stringify(budget)}
        >
          <Text style={styles.mainSaveText}>Update Budget Configuration</Text>
        </TouchableOpacity>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Data Management</Text>
          <Text style={styles.sectionSubtitle}>Backup and restore your local records</Text>
        </View>

        <View style={styles.dataCard}>
          <TouchableOpacity 
            style={styles.dataAction} 
            onPress={handleExport}
            disabled={isExporting}
          >
            <View style={[styles.dataIconBox, { backgroundColor: 'rgba(0, 240, 255, 0.1)' }]}>
              <Download color="#00F0FF" size={20} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.dataActionTitle}>Export data to Excel</Text>
              <Text style={styles.dataActionSub}>Share your history as a .xlsx file</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.dataDivider} />

          <TouchableOpacity 
            style={styles.dataAction} 
            onPress={handleImport}
            disabled={isImporting}
          >
            <View style={[styles.dataIconBox, { backgroundColor: 'rgba(138, 43, 226, 0.1)' }]}>
              <Upload color="#8A2BE2" size={20} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.dataActionTitle}>Import from Excel / CSV</Text>
              <Text style={styles.dataActionSub}>Append .xlsx or .csv records</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* ========== DEV ONLY - Remove before release ========== */}
        {showDevTools && (
          <View style={styles.devSection}>
            <Text style={styles.devHeader}>🛠 DEV TOOLS</Text>
            
            <TouchableOpacity 
              style={styles.devBtn} 
              onPress={async () => {
                await simulateRollover();
                showSnackbar('Simulated Month Rollover', 'success');
              }}
            >
              <Text style={styles.devBtnText}>Simulate Month Rollover</Text>
            </TouchableOpacity>



            <TouchableOpacity 
              style={styles.devBtn} 
              onPress={async () => {
                const keys = await AsyncStorage.getAllKeys();
                console.log('--- AsyncStorage Keys ---');
                for (const key of keys) {
                  const val = await AsyncStorage.getItem(key);
                  console.log(`${key}:`, val);
                }
                showSnackbar('Logged to Console', 'success');
              }}
            >
              <Text style={styles.devBtnText}>Log AsyncStorage Data</Text>
            </TouchableOpacity>
          </View>
        )}
        {/* ====================================================== */}
        {/* ====================================================== */}

      </KeyboardAwareScrollView>

      <DeleteCategoryModal
        visible={isDeleteModalVisible}
        onClose={() => setIsDeleteModalVisible(false)}
        onConfirm={confirmDeleteCategory}
        categoryName={categoryToDelete || ''}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  scrollContent: { padding: 24, paddingBottom: 120 },
  header: { marginBottom: 32, marginTop: 10, alignItems: 'center' },
  logo: { width: 36, height: 36, marginBottom: 8 },
  brandName: { fontFamily: 'Outfit_800ExtraBold', color: '#FFFFFF', fontSize: 12, letterSpacing: 4, marginBottom: 12 },
  title: { fontFamily: 'Outfit_800ExtraBold', fontSize: 36, color: '#FFFFFF' },
  subtitle: { fontFamily: 'Inter_500Medium', fontSize: 14, color: '#D1D1D1', marginTop: 4 },

  sectionHeader: { marginBottom: 16, marginTop: 24 },
  sectionTitle: { fontFamily: 'Outfit_600SemiBold', fontSize: 20, color: '#FFFFFF' },
  sectionSubtitle: { fontFamily: 'Inter_500Medium', fontSize: 12, color: '#949494', marginTop: 2 },

  formCard: { backgroundColor: 'rgba(20,20,20,0.95)', padding: 20, borderRadius: 28, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', marginBottom: 20 },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0A0A0A', borderRadius: 12, height: 50, paddingHorizontal: 16, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  inputText: { flex: 1, color: '#FFFFFF', fontFamily: 'Inter_500Medium', fontSize: 14 },
  currencyPrefix: { fontFamily: 'Inter_700Bold', color: '#00F0FF', fontSize: 12, marginRight: 12 },

  dateSelector: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', marginBottom: 16 },
  dateText: { color: '#FFFFFF', fontFamily: 'Inter_500Medium', fontSize: 14 },

  labelSmall: { color: '#949494', fontSize: 9, fontFamily: 'Inter_700Bold', letterSpacing: 1, marginBottom: 10 },
  catRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, gap: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  catPillActive: { backgroundColor: '#00F0FF', borderColor: '#00F0FF' },
  catPillText: { color: '#D1D1D1', fontSize: 11, fontFamily: 'Inter_500Medium' },
  catPillTextActive: { color: '#0A0A0A', fontFamily: 'Inter_700Bold' },

  recordButton: { backgroundColor: '#00F0FF', height: 50, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 24 },
  recordButtonText: { color: '#0A0A0A', fontFamily: 'Outfit_800ExtraBold', fontSize: 14 },

  miniSaveBtn: { backgroundColor: '#8A2BE2', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
  miniSaveBtnText: { color: '#FFFFFF', fontFamily: 'Inter_700Bold', fontSize: 12 },

  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginVertical: 32 },

  budgetMainCard: { backgroundColor: 'rgba(20,20,20,0.95)', padding: 24, borderRadius: 32, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', marginBottom: 24 },
  allocationHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  allocationLabel: { color: '#949494', fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 1.5 },
  totalInputWrapper: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 20, paddingHorizontal: 20, paddingVertical: 16, marginTop: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', minHeight: 74, justifyContent: 'center' },
  totalInputRow: { flexDirection: 'row', alignItems: 'center' },
  totalCurrency: { color: '#00F0FF', fontSize: 18, fontFamily: 'Outfit_600SemiBold', marginRight: 12 },
  totalInput: { color: '#FFFFFF', fontSize: 22, fontFamily: 'Outfit_600SemiBold', flex: 1, height: 48, padding: 0, textAlignVertical: 'center' },

  allocationPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1 },
  pillSuccess: { backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.2)' },
  pillDanger: { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.2)' },
  pillText: { fontSize: 9, fontFamily: 'Inter_700Bold', letterSpacing: 1 },
  pillTextSuccess: { color: '#10B981' },
  pillTextDanger: { color: '#EF4444' },

  allocationBarContainer: { marginTop: 12 },
  allocationBarBg: { height: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden' },
  allocationBarFill: { height: '100%', backgroundColor: '#8A2BE2' },
  allocationBarFillDanger: { backgroundColor: '#EF4444' },
  allocationStats: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  statText: { color: '#949494', fontSize: 11, fontFamily: 'Inter_500Medium' },
  statValue: { color: '#D1D1D1', fontSize: 11, fontFamily: 'Inter_700Bold' },
  textDanger: { color: '#EF4444' },

  catSectionLabel: { color: '#949494', fontSize: 10, fontFamily: 'Inter_800ExtraBold', letterSpacing: 2 },
  catGridHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  addCatBtnSmall: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0, 240, 255, 0.1)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, gap: 4 },
  addCatBtnTextSmall: { color: '#00F0FF', fontSize: 10, fontFamily: 'Outfit_800ExtraBold' },

  quickAddCat: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1A1A1A', padding: 8, borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: '#333', gap: 8 },
  quickAddInput: { flex: 1, color: '#FFFFFF', fontFamily: 'Inter_500Medium', fontSize: 14, paddingHorizontal: 8 },
  quickAddDone: { backgroundColor: '#00F0FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  quickAddDoneText: { color: '#000', fontSize: 10, fontFamily: 'Outfit_800ExtraBold' },
  quickAddCancel: { padding: 4 },
  quickAddCancelText: { color: '#949494', fontSize: 14 },

  catBudgetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 40 },
  modernCatCard: { width: '48.5%', backgroundColor: '#141414', padding: 12, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  catCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  catIconBox: { width: 24, height: 24, borderRadius: 8, backgroundColor: 'rgba(0, 240, 255, 0.05)', alignItems: 'center', justifyContent: 'center' },
  catName: { color: '#D1D1D1', fontFamily: 'Inter_700Bold', fontSize: 10, textTransform: 'uppercase', flex: 1 },
  catPercent: { color: '#00F0FF', fontFamily: 'Inter_800ExtraBold', fontSize: 9 },
  catInputContainer: { flexDirection: 'row', alignItems: 'baseline', backgroundColor: 'rgba(0,0,0,0.3)', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 12 },
  catInputCurrency: { color: '#949494', fontSize: 10, fontFamily: 'Inter_700Bold', marginRight: 6 },
  catInput: { color: '#FFFFFF', fontFamily: 'Outfit_600SemiBold', fontSize: 14, flex: 1 },
  deleteCatBtn: { padding: 4, marginRight: 4 },

  mainSaveButton: { backgroundColor: '#FFFFFF', borderRadius: 24, height: 64, alignItems: 'center', justifyContent: 'center', marginBottom: 40 },
  mainSaveText: { color: '#0A0A0A', fontFamily: 'Outfit_800ExtraBold', fontSize: 13, letterSpacing: 0.5 },

  dataCard: { 
    backgroundColor: 'rgba(20,20,20,0.95)', 
    borderRadius: 28, 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden'
  },
  dataAction: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 16, 
    gap: 16 
  },
  dataIconBox: { 
    width: 44, 
    height: 44, 
    borderRadius: 12, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  dataActionTitle: { 
    fontFamily: 'Outfit_600SemiBold', 
    fontSize: 16, 
    color: '#FFFFFF' 
  },
  dataActionSub: { 
    fontFamily: 'Inter_500Medium', 
    fontSize: 11, 
    color: '#949494', 
    marginTop: 2 
  },
  dataDivider: { 
    height: 1, 
    backgroundColor: 'rgba(255,255,255,0.05)', 
    marginHorizontal: 16 
  },

  devSection: { marginTop: 20, padding: 20, backgroundColor: 'rgba(239, 68, 68, 0.05)', borderRadius: 24, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.2)' },
  devHeader: { color: '#EF4444', fontFamily: 'Outfit_800ExtraBold', fontSize: 16, marginBottom: 16, textAlign: 'center', letterSpacing: 2 },
  devBtn: { backgroundColor: '#EF4444', padding: 12, borderRadius: 12, alignItems: 'center', marginBottom: 10 },
  devBtnText: { color: '#0A0A0A', fontFamily: 'Inter_700Bold', fontSize: 13, letterSpacing: 1 }
});

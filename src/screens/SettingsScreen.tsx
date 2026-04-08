import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Switch, Keyboard } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLedgr } from '../lib/LedgrContext';
import { useTheme, useThemeColors } from '../lib/ThemeContext';
import { ExpenseCategory, Budget, DEFAULT_CATEGORIES } from '../lib/store';
import { Coffee, Car, Home as HomeIcon, ShoppingBag, Heart, MoreHorizontal, ShoppingBasket, PlusCircle, Pencil, Trash2, Sun, Moon } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSnackbar } from '../components/Snackbar';
import DeleteCategoryModal from '../components/DeleteCategoryModal';
import { exportExpensesToXLSX, importExpensesFromFile } from '../lib/dateUtils';
import { Download, Upload, Share } from 'lucide-react-native';

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
  const { colors, isDark, toggleTheme } = useTheme();
  const [localBudget, setLocalBudget] = useState<Budget>(budget);
  const [newCatName, setNewCatName] = useState('');
  const [isAddingCat, setIsAddingCat] = useState(false);

  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);

  const budgetRef = useRef<TextInput>(null);
  const categoryRefs = useRef<Record<string, TextInput | null>>({});

  useEffect(() => {
    if (isLoaded) setLocalBudget(budget);
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
    setLocalBudget(prev => ({ ...prev, categories: { ...prev.categories, [cat]: num } }));
  };

  const [isExporting, setIsExporting] = useState<false | 'download' | 'share'>(false);
  const [isImporting, setIsImporting] = useState(false);

  const handleExport = async (action: 'download' | 'share') => {
    if (expenses.length === 0) { showSnackbar('No expenses to export', 'info'); return; }
    setIsExporting(action);
    const success = await exportExpensesToXLSX(expenses, action);
    setIsExporting(false);
    if (success) showSnackbar(`Data ${action === 'download' ? 'downloaded' : 'shared'} successfully`, 'success');
  };

  const handleImport = async () => {
    setIsImporting(true);
    const result = await importExpensesFromFile(expenses);
    setIsImporting(false);
    
    if (result) {
      if (result.imported > 0) {
        await importExpenses(result.expenses);
        let msg = `${result.imported} expenses imported.`;
        if (result.formatSkipped) msg += ` ${result.formatSkipped} formatting errors skipped.`;
        if (result.duplicateSkipped) msg += ` ${result.duplicateSkipped} duplicates skipped.`;
        showSnackbar(msg, 'success');
      } else if (result.formatSkipped > 0 || result.duplicateSkipped > 0) {
        let reasons = [];
        if (result.formatSkipped > 0) reasons.push(`${result.formatSkipped} rows had invalid formatting`);
        if (result.duplicateSkipped > 0) reasons.push(`${result.duplicateSkipped} rows were exact duplicates`);
        showSnackbar(`Import failed: ${reasons.join(' and ')}. No new entries added.`, 'error');
      } else {
        showSnackbar('Selected file was entirely empty or unreadable.', 'info');
      }
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
    setIsDeleteModalVisible(false);
    setCategoryToDelete(null);
    await deleteCategory(catName);
    showSnackbar(`Category "${catName}" deleted`, 'success');
  };

  if (!isLoaded) return <View style={[styles.container, { backgroundColor: colors.background }]} />;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <KeyboardAwareScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        extraScrollHeight={100}
        enableOnAndroid={true}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
          <Text style={[styles.brandName, { color: colors.textTertiary }]}>LEDGR</Text>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Settings</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Manage your profile & data</Text>
        </View>

        {/* Appearance Settings */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Appearance</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textTertiary }]}>Customize look and feel</Text>
        </View>

        <View style={[styles.dataCard, { backgroundColor: colors.card, borderColor: colors.cardBorder, marginBottom: 24 }]}>
          <View style={styles.dataAction}>
            <View style={[styles.dataIconBox, { backgroundColor: isDark ? colors.purpleBg : colors.accentBg }]}>
              {isDark ? <Moon color={isDark ? colors.purple : colors.accent} size={20} /> : <Sun color={colors.accent} size={20} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.dataActionTitle, { color: colors.textPrimary }]}>Dark Mode</Text>
              <Text style={[styles.dataActionSub, { color: colors.textTertiary }]}>
                {isDark ? 'Turn off for light mode' : 'Turn on for dark mode'}
              </Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.switchTrackFalse, true: colors.switchTrackTrue }}
              thumbColor="#FFFFFF"
              ios_backgroundColor={colors.switchTrackFalse}
            />
          </View>
        </View>

        {/* Budget Configuration Section */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Budget Configuration</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textTertiary }]}>Define your monthly spending limits</Text>
        </View>

        <View style={[styles.budgetMainCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.allocationHeader}>
            <Text style={[styles.allocationLabel, { color: colors.textTertiary }]}>TOTAL MONTHLY BUDGET</Text>
            <View style={[styles.allocationPill, isOverAllocated ? styles.pillDanger : styles.pillSuccess]}>
              <Text style={[styles.pillText, isOverAllocated ? styles.pillTextDanger : styles.pillTextSuccess]}>
                {isOverAllocated ? 'OVER-ALLOCATED' : 'ALLOCATED'}
              </Text>
            </View>
          </View>

          <View style={[styles.totalInputWrapper, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
            <View style={styles.totalInputRow}>
              <Text style={[styles.totalCurrency, { color: colors.accent }]}>PKR</Text>
              <TextInput
                ref={budgetRef}
                style={[styles.totalInput, { color: colors.textPrimary }]}
                keyboardType="numeric"
                value={localBudget.total.toString()}
                onChangeText={(val) => setLocalBudget(p => ({ ...p, total: parseInt(val) || 0 }))}
                returnKeyType="next"
                onSubmitEditing={() => {
                  if (allCategories.length > 0) {
                    categoryRefs.current[allCategories[0]]?.focus();
                  }
                }}
              />
              <Pencil size={20} color={colors.accent} style={{ marginLeft: 12 }} />
            </View>
          </View>

          <View style={styles.allocationBarContainer}>
            <View style={[styles.allocationBarBg, { backgroundColor: colors.divider }]}>
              <View style={[styles.allocationBarFill, { width: `${Math.min(100, (totalAllocated / localBudget.total) * 100)}%`, backgroundColor: colors.purple }, isOverAllocated && styles.allocationBarFillDanger]} />
            </View>
            <View style={styles.allocationStats}>
              <Text style={[styles.statText, { color: colors.textTertiary }]}>Allocated: PKR {totalAllocated.toLocaleString()}</Text>
              <Text style={[styles.statValue, { color: colors.textSecondary }, isOverAllocated && { color: colors.danger }]}>
                {isOverAllocated ? `Exceeded by: PKR ${Math.abs(unallocated).toLocaleString()}` : `Remaining: PKR ${unallocated.toLocaleString()}`}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.catGridHeader}>
          <Text style={[styles.catSectionLabel, { color: colors.textTertiary }]}>CATEGORY ALLOCATION</Text>
          <TouchableOpacity style={[styles.addCatBtnSmall, { backgroundColor: colors.accentBg }]} onPress={() => setIsAddingCat(true)}>
            <PlusCircle size={14} color={colors.accent} />
            <Text style={[styles.addCatBtnTextSmall, { color: colors.accent }]}>NEW</Text>
          </TouchableOpacity>
        </View>

        {isAddingCat && (
          <View style={[styles.quickAddCat, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
            <TextInput
              style={[styles.quickAddInput, { color: colors.textPrimary }]}
              placeholder="Category Name"
              placeholderTextColor={colors.textMuted}
              value={newCatName}
              onChangeText={setNewCatName}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={() => {
                Keyboard.dismiss();
              }}
            />
            <TouchableOpacity style={[styles.quickAddDone, { backgroundColor: colors.accent }]} onPress={handleAddCategory}>
              <Text style={[styles.quickAddDoneText, { color: colors.background }]}>ADD</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAddCancel} onPress={() => setIsAddingCat(false)}>
              <Text style={[styles.quickAddCancelText, { color: colors.textTertiary }]}>✕</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.catBudgetGrid}>
          {allCategories.map((cat, index) => {
            const Icon = CATEGORY_ICONS[cat as ExpenseCategory] || MoreHorizontal;
            const amount = localBudget.categories[cat] || 0;
            const percentage = localBudget.total > 0 ? ((amount / localBudget.total) * 100).toFixed(1) : '0.0';

            return (
              <View key={cat} style={[styles.modernCatCard, { backgroundColor: colors.surface, borderColor: colors.cardBorderSubtle }]}>
                <View style={styles.catCardHeader}>
                  <View style={[styles.catIconBox, { backgroundColor: colors.accentBg }]}>
                    <Icon color={colors.accent} size={14} />
                  </View>
                  <Text style={[styles.catName, { color: colors.textSecondary }]} numberOfLines={1}>{cat}</Text>

                  {!DEFAULT_CATEGORIES.includes(cat) && (
                    <TouchableOpacity style={styles.deleteCatBtn} onPress={() => handleDeleteCategory(cat)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                      <Trash2 size={12} color={colors.danger} opacity={0.6} />
                    </TouchableOpacity>
                  )}

                  <Text style={[styles.catPercent, { color: colors.accent }]}>{percentage}%</Text>
                </View>
                <View style={[styles.catInputContainer, { backgroundColor: colors.innerCardBg }]}>
                  <Text style={[styles.catInputCurrency, { color: colors.textTertiary }]}>PKR</Text>
                  <TextInput
                    ref={el => { categoryRefs.current[cat] = el; }}
                    style={[styles.catInput, { color: colors.textPrimary }]}
                    keyboardType="numeric"
                    value={amount.toString()}
                    onChangeText={(val) => handleCatChange(cat, val)}
                    returnKeyType={index === allCategories.length - 1 ? 'done' : 'next'}
                    onSubmitEditing={() => {
                      if (index < allCategories.length - 1) {
                        categoryRefs.current[allCategories[index + 1]]?.focus();
                      } else {
                        Keyboard.dismiss();
                      }
                    }}
                  />
                </View>
              </View>
            );
          })}
        </View>

        <TouchableOpacity
          style={[styles.mainSaveButton, { backgroundColor: colors.saveBtnBg, opacity: (JSON.stringify(localBudget) !== JSON.stringify(budget)) ? 1 : 0.6 }]}
          onPress={handleSaveBudget}
          disabled={JSON.stringify(localBudget) === JSON.stringify(budget)}
        >
          <Text style={[styles.mainSaveText, { color: colors.saveBtnText }]}>Update Budget Configuration</Text>
        </TouchableOpacity>

        {/* Data Management */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Data Management</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textTertiary }]}>Backup and restore your local records</Text>
        </View>

        <View style={[styles.dataCard, { backgroundColor: colors.card, borderColor: colors.cardBorder, marginBottom: 12 }]}>
          <View style={[styles.dataAction, { paddingBottom: 12 }]}>
            <View style={[styles.dataIconBox, { backgroundColor: colors.accentBg }]}>
              <Download color={colors.accent} size={20} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.dataActionTitle, { color: colors.textPrimary }]}>Export Data</Text>
              <Text style={[styles.dataActionSub, { color: colors.textTertiary, lineHeight: 16 }]}>Backup your transaction history as a standard .xlsx spreadsheet.</Text>
            </View>
          </View>
          
          <View style={styles.exportBtnRow}>
             <TouchableOpacity style={[styles.smallActionBtn, { backgroundColor: colors.surface, borderColor: colors.cardBorderSubtle }]} onPress={() => handleExport('download')} disabled={isExporting !== false}>
               <Download size={14} color={colors.textPrimary} />
               <Text style={[styles.smallActionText, { color: colors.textPrimary }]}>Download</Text>
             </TouchableOpacity>
             
             <TouchableOpacity style={[styles.smallActionBtn, { backgroundColor: colors.surface, borderColor: colors.cardBorderSubtle }]} onPress={() => handleExport('share')} disabled={isExporting !== false}>
               <Share size={14} color={colors.textPrimary} />
               <Text style={[styles.smallActionText, { color: colors.textPrimary }]}>Share</Text>
             </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.dataCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <TouchableOpacity style={styles.dataAction} onPress={handleImport} disabled={isImporting}>
            <View style={[styles.dataIconBox, { backgroundColor: colors.purpleBg }]}>
              <Upload color={colors.purple} size={20} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.dataActionTitle, { color: colors.textPrimary }]}>Import from Excel / CSV</Text>
              <Text style={[styles.dataActionSub, { color: colors.textTertiary }]}>Append .xlsx or .csv records</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* DEV TOOLS */}
        {showDevTools && (
          <View style={styles.devSection}>
            <Text style={styles.devHeader}>🛠 DEV TOOLS</Text>
            <TouchableOpacity style={styles.devBtn} onPress={async () => { await simulateRollover(); showSnackbar('Simulated Month Rollover', 'success'); }}>
              <Text style={styles.devBtnText}>Simulate Month Rollover</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.devBtn} onPress={async () => {
              const keys = await AsyncStorage.getAllKeys();
              for (const key of keys) { const val = await AsyncStorage.getItem(key); console.log(`${key}:`, val); }
              showSnackbar('Logged to Console', 'success');
            }}>
              <Text style={styles.devBtnText}>Log AsyncStorage Data</Text>
            </TouchableOpacity>
          </View>
        )}

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
  container: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 120 },
  header: { marginBottom: 32, marginTop: 10, alignItems: 'center' },
  logo: { width: 36, height: 36, marginBottom: 8 },
  brandName: { fontFamily: 'Outfit_800ExtraBold', fontSize: 12, letterSpacing: 4, marginBottom: 12 },
  title: { fontFamily: 'Outfit_800ExtraBold', fontSize: 36 },
  subtitle: { fontFamily: 'Inter_500Medium', fontSize: 14, marginTop: 4 },

  sectionHeader: { marginBottom: 16, marginTop: 24 },
  sectionTitle: { fontFamily: 'Outfit_600SemiBold', fontSize: 20 },
  sectionSubtitle: { fontFamily: 'Inter_500Medium', fontSize: 12, marginTop: 2 },

  budgetMainCard: { padding: 24, borderRadius: 32, borderWidth: 1, marginBottom: 24 },
  allocationHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  allocationLabel: { fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 1.5 },
  totalInputWrapper: { borderRadius: 20, paddingHorizontal: 20, paddingVertical: 16, marginTop: 4, borderWidth: 1, minHeight: 74, justifyContent: 'center' },
  totalInputRow: { flexDirection: 'row', alignItems: 'center' },
  totalCurrency: { fontSize: 18, fontFamily: 'Outfit_600SemiBold', marginRight: 12 },
  totalInput: { fontSize: 22, fontFamily: 'Outfit_600SemiBold', flex: 1, height: 48, padding: 0, textAlignVertical: 'center' },

  allocationPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1 },
  pillSuccess: { backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.2)' },
  pillDanger: { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.2)' },
  pillText: { fontSize: 9, fontFamily: 'Inter_700Bold', letterSpacing: 1 },
  pillTextSuccess: { color: '#10B981' },
  pillTextDanger: { color: '#EF4444' },

  allocationBarContainer: { marginTop: 12 },
  allocationBarBg: { height: 8, borderRadius: 4, overflow: 'hidden' },
  allocationBarFill: { height: '100%' },
  allocationBarFillDanger: { backgroundColor: '#EF4444' },
  allocationStats: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  statText: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  statValue: { fontSize: 11, fontFamily: 'Inter_700Bold' },

  catSectionLabel: { fontSize: 10, fontFamily: 'Inter_800ExtraBold', letterSpacing: 2 },
  catGridHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  addCatBtnSmall: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, gap: 4 },
  addCatBtnTextSmall: { fontSize: 10, fontFamily: 'Outfit_800ExtraBold' },

  quickAddCat: { flexDirection: 'row', alignItems: 'center', padding: 8, borderRadius: 16, marginBottom: 16, borderWidth: 1, gap: 8 },
  quickAddInput: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 14, paddingHorizontal: 8 },
  quickAddDone: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  quickAddDoneText: { fontSize: 10, fontFamily: 'Outfit_800ExtraBold' },
  quickAddCancel: { padding: 4 },
  quickAddCancelText: { fontSize: 14 },

  catBudgetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 40 },
  modernCatCard: { width: '48.5%', padding: 12, borderRadius: 20, borderWidth: 1 },
  catCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  catIconBox: { width: 24, height: 24, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  catName: { fontFamily: 'Inter_700Bold', fontSize: 10, textTransform: 'uppercase', flex: 1 },
  catPercent: { fontFamily: 'Inter_800ExtraBold', fontSize: 9 },
  catInputContainer: { flexDirection: 'row', alignItems: 'baseline', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 12 },
  catInputCurrency: { fontSize: 10, fontFamily: 'Inter_700Bold', marginRight: 6 },
  catInput: { fontFamily: 'Outfit_600SemiBold', fontSize: 14, flex: 1 },
  deleteCatBtn: { padding: 4, marginRight: 4 },

  mainSaveButton: { borderRadius: 24, height: 64, alignItems: 'center', justifyContent: 'center', marginBottom: 40 },
  mainSaveText: { fontFamily: 'Outfit_800ExtraBold', fontSize: 13, letterSpacing: 0.5 },

  dataCard: { borderRadius: 28, borderWidth: 1, overflow: 'hidden' },
  dataAction: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 16 },
  exportBtnRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, paddingBottom: 16, paddingTop: 4, marginLeft: 60 },
  smallActionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 12, borderWidth: 1, gap: 6 },
  smallActionText: { fontFamily: 'Outfit_600SemiBold', fontSize: 13 },
  dataIconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  dataActionTitle: { fontFamily: 'Outfit_600SemiBold', fontSize: 16 },
  dataActionSub: { fontFamily: 'Inter_500Medium', fontSize: 11, marginTop: 2 },
  dataDivider: { height: 1, marginHorizontal: 16 },

  devSection: { marginTop: 20, padding: 20, backgroundColor: 'rgba(239, 68, 68, 0.05)', borderRadius: 24, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.2)' },
  devHeader: { color: '#EF4444', fontFamily: 'Outfit_800ExtraBold', fontSize: 16, marginBottom: 16, textAlign: 'center', letterSpacing: 2 },
  devBtn: { backgroundColor: '#EF4444', padding: 12, borderRadius: 12, alignItems: 'center', marginBottom: 10 },
  devBtnText: { color: '#0A0A0A', fontFamily: 'Inter_700Bold', fontSize: 13, letterSpacing: 1 }
});
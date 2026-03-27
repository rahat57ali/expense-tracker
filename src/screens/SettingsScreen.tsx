import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image, Platform } from 'react-native';
// Remove Slider import
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLedgr } from '../lib/LedgrContext';
import { ExpenseCategory, Budget, autoCategorize, DEFAULT_CATEGORIES } from '../lib/store';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Coffee, Car, Home as HomeIcon, ShoppingBag, Heart, MoreHorizontal, ShoppingBasket, Calendar, PlusCircle, Pencil, Trash2 } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSnackbar } from '../components/Snackbar';

const CATEGORY_ICONS: Record<ExpenseCategory, any> = {
  Food: Coffee,
  Transport: Car,
  Bills: HomeIcon,
  Shopping: ShoppingBag,
  Grocery: ShoppingBasket,
  Health: Heart,
  Other: MoreHorizontal,
};

const CATEGORIES: ExpenseCategory[] = ['Food', 'Grocery', 'Transport', 'Bills', 'Shopping', 'Health', 'Other'];

const PAKISTANI_PRESETS: Record<ExpenseCategory, number> = {
  Food: 25,
  Bills: 20,
  Grocery: 15,
  Transport: 10,
  Shopping: 15,
  Health: 5,
  Other: 10
};

// Dimensions width unused now for sliders

export default function SettingsScreen() {
  const { budget, updateBudget, addExpense, isLoaded, allCategories, addCategory, deleteCategory } = useLedgr();
  const { showSnackbar } = useSnackbar();
  const [localBudget, setLocalBudget] = useState<Budget>(budget);
  const [newCatName, setNewCatName] = useState('');
  const [isAddingCat, setIsAddingCat] = useState(false);

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

  const handleAddCategory = () => {
    if (!newCatName.trim()) return;
    addCategory(newCatName.trim());
    setNewCatName('');
    setIsAddingCat(false);
    showSnackbar('Category added!', 'success');
  };

  const handleDeleteCategory = (cat: string) => {
    Alert.alert(
      "Delete Category",
      `Are you sure you want to delete "${cat}"? All related expenses will be moved to "Other".`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: async () => {
            await deleteCategory(cat);
            showSnackbar(`Category "${cat}" deleted`, 'success');
          }
        }
      ]
    );
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

      </KeyboardAwareScrollView>
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
  subtitle: { fontFamily: 'Inter_500Medium', fontSize: 14, color: '#A0A0A0', marginTop: 4 },

  sectionHeader: { marginBottom: 16, marginTop: 24 },
  sectionTitle: { fontFamily: 'Outfit_600SemiBold', fontSize: 20, color: '#FFFFFF' },
  sectionSubtitle: { fontFamily: 'Inter_500Medium', fontSize: 12, color: '#606060', marginTop: 2 },

  formCard: { backgroundColor: 'rgba(20,20,20,0.95)', padding: 20, borderRadius: 28, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', marginBottom: 20 },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0A0A0A', borderRadius: 12, height: 50, paddingHorizontal: 16, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  inputText: { flex: 1, color: '#FFFFFF', fontFamily: 'Inter_500Medium', fontSize: 14 },
  currencyPrefix: { fontFamily: 'Inter_700Bold', color: '#00F0FF', fontSize: 12, marginRight: 12 },

  dateSelector: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', marginBottom: 16 },
  dateText: { color: '#FFFFFF', fontFamily: 'Inter_500Medium', fontSize: 14 },

  labelSmall: { color: '#606060', fontSize: 9, fontFamily: 'Inter_700Bold', letterSpacing: 1, marginBottom: 10 },
  catRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, gap: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  catPillActive: { backgroundColor: '#00F0FF', borderColor: '#00F0FF' },
  catPillText: { color: '#A0A0A0', fontSize: 11, fontFamily: 'Inter_500Medium' },
  catPillTextActive: { color: '#0A0A0A', fontFamily: 'Inter_700Bold' },

  recordButton: { backgroundColor: '#00F0FF', height: 50, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 24 },
  recordButtonText: { color: '#0A0A0A', fontFamily: 'Outfit_800ExtraBold', fontSize: 14 },

  miniSaveBtn: { backgroundColor: '#8A2BE2', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
  miniSaveBtnText: { color: '#FFFFFF', fontFamily: 'Inter_700Bold', fontSize: 12 },

  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginVertical: 32 },

  budgetMainCard: { backgroundColor: 'rgba(20,20,20,0.95)', padding: 24, borderRadius: 32, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', marginBottom: 24 },
  allocationHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  allocationLabel: { color: '#606060', fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 1.5 },
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
  statText: { color: '#606060', fontSize: 11, fontFamily: 'Inter_500Medium' },
  statValue: { color: '#A0A0A0', fontSize: 11, fontFamily: 'Inter_700Bold' },
  textDanger: { color: '#EF4444' },

  catSectionLabel: { color: '#606060', fontSize: 10, fontFamily: 'Inter_800ExtraBold', letterSpacing: 2 },
  catGridHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  addCatBtnSmall: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0, 240, 255, 0.1)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, gap: 4 },
  addCatBtnTextSmall: { color: '#00F0FF', fontSize: 10, fontFamily: 'Outfit_800ExtraBold' },

  quickAddCat: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1A1A1A', padding: 8, borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: '#333', gap: 8 },
  quickAddInput: { flex: 1, color: '#FFFFFF', fontFamily: 'Inter_500Medium', fontSize: 14, paddingHorizontal: 8 },
  quickAddDone: { backgroundColor: '#00F0FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  quickAddDoneText: { color: '#000', fontSize: 10, fontFamily: 'Outfit_800ExtraBold' },
  quickAddCancel: { padding: 4 },
  quickAddCancelText: { color: '#606060', fontSize: 14 },

  catBudgetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 40 },
  modernCatCard: { width: '48.5%', backgroundColor: '#141414', padding: 12, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  catCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  catIconBox: { width: 24, height: 24, borderRadius: 8, backgroundColor: 'rgba(0, 240, 255, 0.05)', alignItems: 'center', justifyContent: 'center' },
  catName: { color: '#A0A0A0', fontFamily: 'Inter_700Bold', fontSize: 10, textTransform: 'uppercase', flex: 1 },
  catPercent: { color: '#00F0FF', fontFamily: 'Inter_800ExtraBold', fontSize: 9 },
  catInputContainer: { flexDirection: 'row', alignItems: 'baseline', backgroundColor: 'rgba(0,0,0,0.3)', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 12 },
  catInputCurrency: { color: '#606060', fontSize: 10, fontFamily: 'Inter_700Bold', marginRight: 6 },
  catInput: { color: '#FFFFFF', fontFamily: 'Outfit_600SemiBold', fontSize: 14, flex: 1 },
  deleteCatBtn: { padding: 4, marginRight: 4 },

  mainSaveButton: { backgroundColor: '#FFFFFF', borderRadius: 24, height: 64, alignItems: 'center', justifyContent: 'center', marginBottom: 40 },
  mainSaveText: { color: '#000000', fontFamily: 'Outfit_800ExtraBold', fontSize: 16 },
});

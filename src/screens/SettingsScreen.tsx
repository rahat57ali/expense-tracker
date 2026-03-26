import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image, Platform } from 'react-native';
// Remove Slider import
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLedgr } from '../lib/LedgrContext';
import { ExpenseCategory, Budget, autoCategorize } from '../lib/store';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Coffee, Car, Home as HomeIcon, ShoppingBag, Heart, MoreHorizontal, ShoppingBasket, Calendar, PlusCircle, Pencil } from 'lucide-react-native';
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
  const { budget, updateBudget, addExpense, isLoaded } = useLedgr();
  const { showSnackbar } = useSnackbar();
  const [localBudget, setLocalBudget] = useState<Budget>(budget);

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
            <View style={{ flex: 1 }}>
              <Text style={styles.allocationLabel}>TOTAL MONTHLY BUDGET</Text>
              <View style={styles.totalInputWrapper}>
                <View style={styles.totalInputRow}>
                  <Text style={styles.totalCurrency}>PKR</Text>
                  <TextInput
                    style={styles.totalInput}
                    keyboardType="numeric"
                    value={localBudget.total.toString()}
                    onChangeText={(val) => setLocalBudget(p => ({ ...p, total: parseInt(val) || 0 }))}
                  />
                  <Pencil size={18} color="rgba(0, 240, 255, 0.4)" style={{ marginLeft: 12 }} />
                </View>
              </View>
            </View>
            <View style={[styles.allocationPill, isOverAllocated ? styles.pillDanger : styles.pillSuccess]}>
               <Text style={[styles.pillText, isOverAllocated ? styles.pillTextDanger : styles.pillTextSuccess]}>
                 {isOverAllocated ? 'OVER-ALLOCATED' : 'ALLOCATED'}
               </Text>
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

        <Text style={styles.catSectionLabel}>CATEGORY ALLOCATION</Text>
        <View style={styles.catBudgetGrid}>
          {CATEGORIES.map(cat => {
            const Icon = CATEGORY_ICONS[cat];
            const amount = localBudget.categories[cat];
            const percentage = localBudget.total > 0 ? ((amount / localBudget.total) * 100).toFixed(1) : '0.0';
            
            return (
              <View key={cat} style={styles.modernCatCard}>
                <View style={styles.catCardHeader}>
                  <View style={styles.catIconBox}>
                    <Icon color="#00F0FF" size={16} />
                  </View>
                  <Text style={styles.catName}>{cat}</Text>
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
  allocationHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  allocationLabel: { color: '#606060', fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 1.5, marginBottom: 8 },
  totalInputWrapper: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, padding: 12, marginTop: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  totalInputRow: { flexDirection: 'row', alignItems: 'center' },
  totalCurrency: { color: '#00F0FF', fontSize: 16, fontFamily: 'Inter_700Bold', marginRight: 12 },
  totalInput: { color: '#FFFFFF', fontSize: 32, fontFamily: 'Outfit_300Light', flex: 1 },
  
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

  catSectionLabel: { color: '#404040', fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 1.5, marginBottom: 16, marginTop: 8 },
  catBudgetGrid: { gap: 12, marginBottom: 32 },
  modernCatCard: { backgroundColor: '#111111', padding: 16, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  catCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  catIconBox: { width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(0, 240, 255, 0.05)', alignItems: 'center', justifyContent: 'center' },
  catName: { flex: 1, color: '#FFFFFF', fontSize: 15, fontFamily: 'Outfit_600SemiBold' },
  catPercent: { color: '#606060', fontSize: 11, fontFamily: 'Inter_700Bold' },
  catInputContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(0,0,0,0.3)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.03)' },
  catInputCurrency: { color: 'rgba(160,160,160,0.4)', fontSize: 12, fontFamily: 'Inter_500Medium' },
  catInput: { flex: 1, color: '#FFFFFF', fontSize: 18, fontFamily: 'Outfit_300Light' },

  mainSaveButton: { backgroundColor: '#FFFFFF', height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 40 },
  mainSaveText: { color: '#0A0A0A', fontSize: 15, fontFamily: 'Outfit_800ExtraBold' }
});

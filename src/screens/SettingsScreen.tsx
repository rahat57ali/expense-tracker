import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image, Platform, Dimensions } from 'react-native';
import Slider from '@react-native-community/slider';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLedgr } from '../lib/LedgrContext';
import { ExpenseCategory, Budget, autoCategorize } from '../lib/store';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Coffee, Car, Home as HomeIcon, ShoppingBag, Heart, MoreHorizontal, ShoppingBasket, Calendar, PlusCircle } from 'lucide-react-native';
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

const { width } = Dimensions.get('window');

export default function SettingsScreen() {
  const { budget, updateBudget, addExpense, isLoaded } = useLedgr();
  const { showSnackbar } = useSnackbar();
  const [localBudget, setLocalBudget] = useState<Budget>(budget);
  
  // Historical Entry State
  const [histDesc, setHistDesc] = useState('');
  const [histAmount, setHistAmount] = useState('');
  const [histCategory, setHistCategory] = useState<ExpenseCategory | null>(null);
  const [histDate, setHistDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const histAmountRef = React.useRef<TextInput>(null);

  // Wizard State
  const [wizardStep, setWizardStep] = useState(0); // 0: Settings Home, 1: Set Total, 2: Allocate
  const [tempTotal, setTempTotal] = useState('');
  const [tempPercs, setTempPercs] = useState<Record<ExpenseCategory, number>>(PAKISTANI_PRESETS);

  useEffect(() => {
    if (isLoaded) {
      setLocalBudget(budget);
      setTempTotal(budget.total.toString());
      // Calculate percentages from existing budget if available
      if (budget.total > 0) {
        const percs = { ...PAKISTANI_PRESETS };
        CATEGORIES.forEach(cat => {
          percs[cat] = Math.round((budget.categories[cat] / budget.total) * 100);
        });
        setTempPercs(percs);
      }
    }
  }, [budget, isLoaded]);

  const totalAllocated = useMemo(() => 
    Object.values(localBudget.categories).reduce((sum, val) => sum + val, 0),
  [localBudget.categories]);

  const wizardAllocatedPerc = useMemo(() => 
    Object.values(tempPercs).reduce((sum, val) => sum + val, 0),
  [tempPercs]);

  const handleSaveBudget = () => {
    const newTotal = parseInt(tempTotal) || 0;
    const newCategories = { ...budget.categories };
    
    CATEGORIES.forEach(cat => {
      newCategories[cat] = Math.round((tempPercs[cat] / 100) * newTotal);
    });

    updateBudget({
      total: newTotal,
      categories: newCategories
    });
    
    setWizardStep(0);
    showSnackbar('Budget configuration saved!', 'success');
  };

  const handleCatChange = (cat: ExpenseCategory, val: string) => {
    const num = parseInt(val) || 0;
    setLocalBudget(prev => ({
      ...prev,
      categories: { ...prev.categories, [cat]: num }
    }));
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setHistDate(selectedDate);
    }
  };

  const handleRecordHistorical = async () => {
    if (!histDesc || !histAmount) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    const amt = parseFloat(histAmount);
    if (isNaN(amt) || amt <= 0) return;

    await addExpense({
      name: histDesc,
      amount: amt,
      category: histCategory || autoCategorize(histDesc),
      date: histDate.toISOString()
    });

    setHistDesc('');
    setHistAmount('');
    setHistCategory(null);
    setHistDate(new Date());
    showSnackbar('Historical transaction recorded!', 'success');
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

        {/* Historical Data Entry Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Historical Data Entry</Text>
          <Text style={styles.sectionSubtitle}>Backdate a past transaction</Text>
        </View>

        <View style={styles.formCard}>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.inputText}
              placeholder="Description (e.g. Flight 2024)"
              placeholderTextColor="rgba(160,160,160,0.4)"
              value={histDesc}
              onChangeText={setHistDesc}
              returnKeyType="next"
              onSubmitEditing={() => histAmountRef.current?.focus()}
              blurOnSubmit={false}
            />
          </View>
          
          <View style={styles.inputRow}>
            <Text style={styles.currencyPrefix}>PKR</Text>
            <TextInput
              ref={histAmountRef}
              style={styles.inputText}
              placeholder="0.00"
              placeholderTextColor="rgba(160,160,160,0.4)"
              keyboardType="numeric"
              value={histAmount}
              onChangeText={setHistAmount}
              returnKeyType="done"
              onSubmitEditing={handleRecordHistorical}
            />
          </View>

          <TouchableOpacity style={styles.dateSelector} onPress={() => setShowDatePicker(true)}>
            <Calendar size={18} color="#00F0FF" />
            <Text style={styles.dateText}>Date: {histDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</Text>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={histDate}
              mode="date"
              display="default"
              onChange={onDateChange}
              maximumDate={new Date()}
            />
          )}

          <Text style={styles.labelSmall}>SELECT CATEGORY</Text>
          <View style={{ marginHorizontal: -20 }}>
            <View style={{ paddingHorizontal: 20 }}>
              <View style={styles.catRow}>
                {CATEGORIES.map(cat => {
                  const Icon = CATEGORY_ICONS[cat];
                  const isSelected = histCategory === cat;
                  return (
                    <TouchableOpacity 
                      key={cat} 
                      style={[styles.catPill, isSelected && styles.catPillActive]} 
                      onPress={() => setHistCategory(cat)}
                    >
                      <Icon color={isSelected ? "#0A0A0A" : "#A0A0A0"} size={14} />
                      <Text style={[styles.catPillText, isSelected && styles.catPillTextActive]}>{cat}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.recordButton} onPress={handleRecordHistorical}>
            <Text style={styles.recordButtonText}>Record Past Expense</Text>
            <PlusCircle color="#0A0A0A" size={18} />
          </TouchableOpacity>
        </View>

        {/* Action Button for Budget */}
        <View style={{ position: 'absolute', top: 24, right: 24, zIndex: 10 }}>
           <TouchableOpacity 
             style={[styles.miniSaveBtn, { opacity: (JSON.stringify(localBudget) !== JSON.stringify(budget)) ? 1 : 0.5 }]} 
             onPress={handleSaveBudget}
             disabled={JSON.stringify(localBudget) === JSON.stringify(budget)}
           >
             <Text style={styles.miniSaveBtnText}>Save</Text>
           </TouchableOpacity>
        </View>

        {wizardStep === 0 && (
          <>
            {/* Historical Data Entry Section */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
            </View>

            <View style={styles.formCard}>
              <TouchableOpacity 
                style={styles.wizardStartCard} 
                onPress={() => setWizardStep(1)}
              >
                <LinearGradient colors={['#8A2BE2', '#4B0082']} style={styles.wizardGradient}>
                  <View style={styles.wizardInfo}>
                    <Text style={styles.wizardTitle}>Guided Budget Setup</Text>
                    <Text style={styles.wizardSub}>Recalculate your monthly limits with sliders</Text>
                  </View>
                  <PlusCircle color="#FFFFFF" size={24} />
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.divider} />

              <Text style={styles.labelSmall}>OR BACKDATE A TRANSACTION</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.inputText}
                  placeholder="Description (e.g. Flight 2024)"
                  placeholderTextColor="rgba(160,160,160,0.4)"
                  value={histDesc}
                  onChangeText={setHistDesc}
                  returnKeyType="next"
                  onSubmitEditing={() => histAmountRef.current?.focus()}
                  blurOnSubmit={false}
                />
              </View>
              
              <View style={styles.inputRow}>
                <Text style={styles.currencyPrefix}>PKR</Text>
                <TextInput
                  ref={histAmountRef}
                  style={styles.inputText}
                  placeholder="0.00"
                  placeholderTextColor="rgba(160,160,160,0.4)"
                  keyboardType="numeric"
                  value={histAmount}
                  onChangeText={setHistAmount}
                  returnKeyType="done"
                  onSubmitEditing={handleRecordHistorical}
                />
              </View>

              <TouchableOpacity style={styles.dateSelector} onPress={() => setShowDatePicker(true)}>
                <Calendar size={18} color="#00F0FF" />
                <Text style={styles.dateText}>Date: {histDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</Text>
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={histDate}
                  mode="date"
                  display="default"
                  onChange={onDateChange}
                  maximumDate={new Date()}
                />
              )}

              <Text style={styles.labelSmall}>SELECT CATEGORY</Text>
              <View style={styles.catRow}>
                {CATEGORIES.map(cat => {
                  const Icon = CATEGORY_ICONS[cat];
                  const isSelected = histCategory === cat;
                  return (
                    <TouchableOpacity 
                      key={cat} 
                      style={[styles.catPill, isSelected && styles.catPillActive]} 
                      onPress={() => setHistCategory(cat)}
                    >
                      <Icon color={isSelected ? "#0A0A0A" : "#A0A0A0"} size={14} />
                      <Text style={[styles.catPillText, isSelected && styles.catPillTextActive]}>{cat}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity style={styles.recordButton} onPress={handleRecordHistorical}>
                <Text style={styles.recordButtonText}>Record Past Expense</Text>
                <PlusCircle color="#0A0A0A" size={18} />
              </TouchableOpacity>
            </View>
          </>
        )}

        {wizardStep === 1 && (
          <View style={styles.wizardLayout}>
            <Text style={styles.wizardStepLabel}>STEP 1 OF 2</Text>
            <Text style={styles.wizardBigTitle}>Total monthly budget</Text>
            <Text style={styles.wizardBigSub}>How much PKR are you planning to spend this month in total?</Text>
            
            <View style={styles.bigInputContainer}>
              <Text style={styles.bigCurrency}>PKR</Text>
              <TextInput
                style={styles.bigInput}
                keyboardType="numeric"
                value={tempTotal}
                onChangeText={setTempTotal}
                placeholder="0"
                placeholderTextColor="rgba(255,255,255,0.1)"
                autoFocus
              />
            </View>

            <View style={styles.wizardActions}>
              <TouchableOpacity style={styles.backBtn} onPress={() => setWizardStep(0)}>
                <Text style={styles.backBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.nextBtn, !tempTotal && { opacity: 0.5 }]} 
                onPress={() => tempTotal && setWizardStep(2)}
                disabled={!tempTotal}
              >
                <Text style={styles.nextBtnText}>Allocation</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {wizardStep === 2 && (
          <View style={styles.wizardLayout}>
            <View style={styles.allocationHeaderFixed}>
               <Text style={styles.wizardStepLabel}>STEP 2 OF 2</Text>
               <View style={styles.allocationHeaderRow}>
                 <View>
                   <Text style={[styles.allocTotal, wizardAllocatedPerc > 100 && { color: '#EF4444' }]}>
                     {wizardAllocatedPerc}% Allocated
                   </Text>
                   <Text style={styles.allocSub}>
                     {wizardAllocatedPerc === 100 ? 'Perfect balance' : `${Math.abs(100 - wizardAllocatedPerc)}% ${wizardAllocatedPerc > 100 ? 'excess' : 'remaining'}`}
                   </Text>
                 </View>
                 <View style={styles.allocMainAmt}>
                    <Text style={styles.allocAmtLabel}>TOTAL</Text>
                    <Text style={styles.allocAmtValue}>PKR {parseInt(tempTotal).toLocaleString()}</Text>
                 </View>
               </View>
               <View style={styles.allocBarBg}>
                  <View 
                    style={[
                      styles.allocBarFill, 
                      { width: `${Math.min(100, wizardAllocatedPerc)}%` },
                      wizardAllocatedPerc > 100 && { backgroundColor: '#EF4444' }
                    ]} 
                  />
               </View>
            </View>

            <View style={styles.slidersList}>
              {CATEGORIES.map(cat => {
                const Icon = CATEGORY_ICONS[cat];
                const percentage = tempPercs[cat];
                const pkrAmount = Math.round((percentage / 100) * (parseInt(tempTotal) || 0));

                return (
                  <View key={cat} style={styles.sliderCard}>
                    <View style={styles.sliderHeader}>
                      <View style={styles.catInfoRow}>
                        <View style={styles.miniIconBox}>
                           <Icon color="#00F0FF" size={14} />
                        </View>
                        <Text style={styles.catNameText}>{cat}</Text>
                      </View>
                      <View style={styles.valRow}>
                        <Text style={styles.percVal}>{percentage}%</Text>
                        <Text style={styles.pkrVal}>PKR {pkrAmount.toLocaleString()}</Text>
                      </View>
                    </View>
                    <Slider
                      style={{ width: '100%', height: 40 }}
                      minimumValue={0}
                      maximumValue={100}
                      step={1}
                      value={percentage}
                      onValueChange={(val) => setTempPercs(prev => ({ ...prev, [cat]: val }))}
                      minimumTrackTintColor="#8A2BE2"
                      maximumTrackTintColor="rgba(255,255,255,0.1)"
                      thumbTintColor="#FFFFFF"
                    />
                  </View>
                );
              })}
            </View>

            <View style={styles.wizardActions}>
              <TouchableOpacity style={styles.backBtn} onPress={() => setWizardStep(1)}>
                <Text style={styles.backBtnText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.saveBtnFull, wizardAllocatedPerc > 100 && { opacity: 0.5 }]} 
                onPress={handleSaveBudget}
                disabled={wizardAllocatedPerc > 100}
              >
                <Text style={styles.saveBtnText}>Save Configuration</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

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

  wizardStartCard: { borderRadius: 20, overflow: 'hidden', marginBottom: 20 },
  wizardGradient: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 16 },
  wizardInfo: { flex: 1 },
  wizardTitle: { color: '#FFFFFF', fontSize: 18, fontFamily: 'Outfit_600SemiBold' },
  wizardSub: { color: 'rgba(255,255,10,0.7)', fontSize: 12, fontFamily: 'Inter_500Medium', marginTop: 2 },

  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginVertical: 20 },

  wizardLayout: { marginTop: 20 },
  wizardStepLabel: { color: '#8A2BE2', fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 2, marginBottom: 16 },
  wizardBigTitle: { color: '#FFFFFF', fontSize: 28, fontFamily: 'Outfit_700Bold' },
  wizardBigSub: { color: '#606060', fontSize: 14, fontFamily: 'Inter_500Medium', marginTop: 8, lineHeight: 22 },
  
  bigInputContainer: { flexDirection: 'row', alignItems: 'baseline', marginTop: 40, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)', paddingBottom: 10 },
  bigCurrency: { color: '#8A2BE2', fontSize: 20, fontFamily: 'Inter_700Bold', marginRight: 12 },
  bigInput: { color: '#FFFFFF', fontSize: 48, fontFamily: 'Outfit_300Light', flex: 1 },

  allocationHeaderFixed: { backgroundColor: '#0A0A0A', paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)', marginBottom: 20 },
  allocationHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 15 },
  allocTotal: { color: '#FFFFFF', fontSize: 24, fontFamily: 'Outfit_600SemiBold' },
  allocSub: { color: '#606060', fontSize: 12, fontFamily: 'Inter_500Medium', marginTop: 4 },
  allocMainAmt: { alignItems: 'flex-end' },
  allocAmtLabel: { color: '#404040', fontSize: 9, fontFamily: 'Inter_700Bold' },
  allocAmtValue: { color: '#FFFFFF', fontSize: 16, fontFamily: 'Outfit_400Regular' },
  allocBarBg: { height: 6, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' },
  allocBarFill: { height: '100%', backgroundColor: '#00F0FF' },

  slidersList: { gap: 20, marginBottom: 40 },
  sliderCard: { backgroundColor: 'rgba(255,255,255,0.02)', padding: 16, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  sliderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  catInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  miniIconBox: { width: 28, height: 28, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' },
  catNameText: { color: '#FFFFFF', fontSize: 14, fontFamily: 'Outfit_600SemiBold' },
  valRow: { alignItems: 'flex-end' },
  percVal: { color: '#00F0FF', fontSize: 16, fontFamily: 'Outfit_700Bold' },
  pkrVal: { color: '#606060', fontSize: 11, fontFamily: 'Inter_500Medium' },

  wizardActions: { flexDirection: 'row', gap: 16, marginTop: 40 },
  backBtn: { flex: 1, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.03)' },
  backBtnText: { color: '#A0A0A0', fontSize: 15, fontFamily: 'Inter_700Bold' },
  nextBtn: { flex: 2, height: 56, borderRadius: 28, backgroundColor: '#8A2BE2', alignItems: 'center', justifyContent: 'center' },
  nextBtnText: { color: '#FFFFFF', fontSize: 15, fontFamily: 'Outfit_800ExtraBold' },
  saveBtnFull: { flex: 2, height: 56, borderRadius: 28, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { color: '#0A0A0A', fontSize: 15, fontFamily: 'Outfit_800ExtraBold' },

  budgetMainCard: { backgroundColor: 'rgba(20,20,20,0.95)', padding: 24, borderRadius: 32, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', marginBottom: 24 },
  allocationHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  allocationLabel: { color: '#606060', fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 1.5, marginBottom: 8 },
  totalInputRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  totalCurrency: { color: '#A0A0A0', fontSize: 16, fontFamily: 'Inter_500Medium' },
  totalInput: { color: '#FFFFFF', fontSize: 32, fontFamily: 'Outfit_300Light' },
  
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

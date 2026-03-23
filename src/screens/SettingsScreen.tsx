import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image, Platform } from 'react-native';
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

  useEffect(() => {
    if (isLoaded) setLocalBudget(budget);
  }, [budget, isLoaded]);

  const handleSaveBudget = () => {
    updateBudget(localBudget);
    showSnackbar('Budget updated successfully!', 'success');
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

        {/* Budget Setup Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Budget Configuration</Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.label}>TOTAL MONTHLY BUDGET</Text>
          <View style={styles.inputWrap}>
            <Text style={styles.currency}>PKR</Text>
            <TextInput
              style={styles.inputTotal}
              keyboardType="numeric"
              value={localBudget.total.toString()}
              onChangeText={(val) => setLocalBudget(p => ({ ...p, total: parseInt(val) || 0 }))}
            />
          </View>

          <View style={styles.divider} />
          <Text style={styles.label}>CATEGORY LIMITS</Text>
          <View style={styles.catGrid}>
            {(Object.keys(localBudget.categories) as ExpenseCategory[]).map(cat => (
              <View key={cat} style={styles.catInputWrap}>
                 <Text style={styles.catLabel}>{cat}</Text>
                 <View style={styles.inputWrapSmall}>
                   <Text style={styles.currencySmall}>PKR</Text>
                   <TextInput
                     style={styles.inputCat}
                     keyboardType="numeric"
                     value={localBudget.categories[cat].toString()}
                     onChangeText={(val) => handleCatChange(cat, val)}
                   />
                 </View>
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={handleSaveBudget}>
             <Text style={styles.saveText}>Save Configuration</Text>
          </TouchableOpacity>
        </View>

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

  label: { color: '#A0A0A0', fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 1, marginBottom: 12 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(10,10,10,0.5)', padding: 14, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', marginBottom: 24 },
  currency: { color: '#A0A0A0', fontFamily: 'Inter_500Medium', marginRight: 12 },
  inputTotal: { flex: 1, color: '#FFFFFF', fontFamily: 'Outfit_400Regular', fontSize: 20 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginBottom: 24 },
  catGrid: { gap: 12, marginBottom: 24 },
  catInputWrap: { flexDirection: 'column', gap: 6 },
  catLabel: { color: '#FFFFFF', fontSize: 13, fontFamily: 'Inter_500Medium' },
  inputWrapSmall: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(10,10,10,0.5)', padding: 10, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  currencySmall: { color: 'rgba(160,160,160,0.5)', fontFamily: 'Inter_500Medium', fontSize: 11, marginRight: 8 },
  inputCat: { flex: 1, color: '#FFFFFF', fontFamily: 'Outfit_400Regular', fontSize: 15 },
  saveButton: { backgroundColor: '#FFFFFF', paddingVertical: 14, borderRadius: 100, alignItems: 'center', marginTop: 24 },
  saveText: { color: '#0A0A0A', fontFamily: 'Outfit_800ExtraBold', fontSize: 15 },
});

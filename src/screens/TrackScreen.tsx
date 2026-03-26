import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Platform, ScrollView } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useLedgr } from '../lib/LedgrContext';
import { ExpenseCategory, autoCategorize } from '../lib/store';
import { Search, Coffee, Car, Home as HomeIcon, ShoppingBag, Heart, MoreHorizontal, Plus, ShoppingBasket, Calendar } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSnackbar } from '../components/Snackbar';
import EditExpenseModal from '../components/EditExpenseModal';
import { Expense } from '../lib/store';

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

export default function TrackScreen() {
  const { expenses, budget, addExpense, isLoaded, allCategories } = useLedgr();
  const { showSnackbar } = useSnackbar();
  const [desc, setDesc] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory | null>(null);
  const [expenseDate, setExpenseDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);

  const amountRef = useRef<TextInput>(null);

  const handleAdd = () => {
    if (!desc || !amountStr) return;
    const amt = parseFloat(amountStr);
    if (isNaN(amt) || amt <= 0) return;
    
    addExpense({ 
      name: desc, 
      amount: amt, 
      category: selectedCategory || autoCategorize(desc),
      date: expenseDate.toISOString()
    });
    setDesc('');
    setAmountStr('');
    setSelectedCategory(null);
    setExpenseDate(new Date());
    showSnackbar('Expense added!', 'success');
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) setExpenseDate(selectedDate);
  };

  const handleEditPress = (expense: Expense) => {
    setEditingExpense(expense);
    setIsEditModalVisible(true);
  };

  const getCategoryStatus = (cat: ExpenseCategory) => {
    const limit = budget.categories[cat] || 0;
    const spent = expenses.filter(e => e.category === cat).reduce((sum, e) => sum + e.amount, 0);
    const remaining = limit - spent;
    return { spent, limit, remaining, isOver: spent > limit };
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={[styles.glow, { bottom: -100, left: -50, backgroundColor: 'rgba(0, 240, 255, 0.15)' }]} />
      <View style={[styles.glow, { bottom: -100, right: -50, backgroundColor: 'rgba(138, 43, 226, 0.15)' }]} />

      <KeyboardAwareScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false} 
        keyboardShouldPersistTaps="handled"
        extraScrollHeight={100}
        enableOnAndroid={true}
      >
        
        <View style={styles.header}>
          <Image 
            source={require('../../assets/logo.png')} 
            style={styles.logo} 
            resizeMode="contain" 
          />
          <Text style={styles.brandName}>LEDGR</Text>
          <View style={styles.tagContainer}>
            <Text style={styles.tagText}>SMART EXPENSE TRACKING</Text>
          </View>
          <Text style={styles.title}>Track Any</Text>
          <Text style={[styles.title, { color: '#00F0FF' }]}>Expense</Text>
        </View>

        <View style={styles.inputCard}>
          <View style={styles.inputRow}>
            <Search color="#A0A0A0" size={18} style={{ marginRight: 12 }} />
            <TextInput
              style={styles.inputDesc}
              placeholder="Description (e.g. Lunch)"
              placeholderTextColor="rgba(160,160,160,0.4)"
              value={desc}
              onChangeText={setDesc}
              returnKeyType="next"
              onSubmitEditing={() => amountRef.current?.focus()}
              blurOnSubmit={false}
            />
          </View>
          
          <View style={styles.inputRow}>
            <Text style={styles.currencyPrefix}>PKR</Text>
            <TextInput
              ref={amountRef}
              style={styles.inputAmount}
              placeholder="0.00"
              placeholderTextColor="rgba(160,160,160,0.4)"
              keyboardType="numeric"
              value={amountStr}
              onChangeText={setAmountStr}
              returnKeyType="done"
              onSubmitEditing={handleAdd}
            />
          </View>

          <TouchableOpacity style={styles.dateSelector} onPress={() => setShowDatePicker(true)}>
            <View style={styles.dateContent}>
              <Calendar size={18} color="#00F0FF" />
              <Text style={styles.dateText}>
                {expenseDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
              </Text>
            </View>
            <View style={styles.dateLabelBox}>
               <Text style={styles.dateLabelText}>{expenseDate.toDateString() === new Date().toDateString() ? 'TODAY' : 'CUSTOM DATE'}</Text>
            </View>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={expenseDate}
              mode="date"
              display="default"
              onChange={onDateChange}
              maximumDate={new Date()}
            />
          )}

          <View style={styles.sectionLabelRow}>
            <Text style={styles.sectionLabel}>Select Category</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll} contentContainerStyle={styles.catScrollContent}>
            <View style={styles.catRow}>
              {allCategories.map(cat => {
                const Icon = CATEGORY_ICONS[cat] || MoreHorizontal;
                const isSelected = selectedCategory === cat;
                const { remaining, isOver } = getCategoryStatus(cat);
                return (
                  <TouchableOpacity 
                    key={cat} 
                    style={[styles.miniCatPill, isSelected && styles.miniCatPillActive]} 
                    onPress={() => setSelectedCategory(cat)}
                  >
                    <Icon color={isSelected ? "#0A0A0A" : "#A0A0A0"} size={14} />
                    <View>
                      <Text style={[styles.miniCatText, isSelected && styles.miniCatTextActive]}>{cat}</Text>
                      <Text style={[styles.miniCatSubtext, isOver && { color: '#EF4444' }, isSelected && { color: 'rgba(10,10,10,0.6)' }]}>
                        PKR {remaining.toLocaleString()}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          <TouchableOpacity 
            style={[styles.bigAddButton, (!desc || !amountStr) && styles.addButtonDisabled]} 
            onPress={handleAdd}
            disabled={!desc || !amountStr}
          >
            <Text style={styles.addBtnLabel}>Add Expense</Text>
            <Plus color="#0A0A0A" size={20} strokeWidth={3} />
          </TouchableOpacity>
        </View>

        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Recent History</Text>
          <Text style={styles.listCount}>{expenses.length} total</Text>
        </View>

        <View style={styles.expensesList}>
          {expenses.slice(0, 10).map((expense) => {
            const Icon = CATEGORY_ICONS[expense.category];
            const { isOver } = getCategoryStatus(expense.category);
            return (
              <TouchableOpacity 
                key={expense.id} 
                onPress={() => handleEditPress(expense)}
              >
                <LinearGradient 
                  colors={['rgba(25,25,25,0.7)', 'rgba(15,15,15,0.8)']} 
                  style={styles.strip}
                >
                  <View style={styles.stripLeft}>
                    <View style={[styles.stripIconBox, isOver && styles.iconBoxDanger]}>
                      <Icon color={isOver ? "#EF4444" : "#FFFFFF"} size={16} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.stripName}>{expense.name}</Text>
                      <Text style={styles.stripCat}>{expense.category}</Text>
                    </View>
                  </View>

                  <View style={styles.stripRight}>
                    <Text style={[styles.stripAmount, isOver && styles.textDanger]}>
                      <Text style={styles.pkSmall}>PKR </Text>{expense.amount.toLocaleString()}
                    </Text>
                    <Text style={styles.stripDate}>{new Date(expense.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            );
          })}
        </View>

      </KeyboardAwareScrollView>

      <EditExpenseModal 
        visible={isEditModalVisible}
        onClose={() => setIsEditModalVisible(false)}
        expense={editingExpense}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  glow: { position: 'absolute', width: 300, height: 300, borderRadius: 150 },
  scrollContent: { padding: 24, paddingBottom: 120 },
  header: { alignItems: 'center', marginBottom: 32, marginTop: 10 },
  logo: { width: 36, height: 36, marginBottom: 8 },
  brandName: { fontFamily: 'Outfit_800ExtraBold', color: '#FFFFFF', fontSize: 12, letterSpacing: 4, marginBottom: 16 },
  tagContainer: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.05)', marginBottom: 16 },
  tagText: { fontFamily: 'Inter_700Bold', fontSize: 10, color: '#A0A0A0', letterSpacing: 1.5 },
  title: { fontFamily: 'Outfit_800ExtraBold', fontSize: 44, color: '#FFFFFF', lineHeight: 48 },
  
  inputCard: { backgroundColor: '#141414', borderRadius: 28, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', marginBottom: 40 },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0A0A0A', borderRadius: 16, height: 54, paddingHorizontal: 16, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  inputDesc: { flex: 1, color: '#FFFFFF', fontFamily: 'Inter_500Medium', fontSize: 16 },
  currencyPrefix: { fontFamily: 'Inter_700Bold', color: '#00F0FF', fontSize: 12, marginRight: 12 },
  inputAmount: { flex: 1, color: '#FFFFFF', fontFamily: 'Outfit_600SemiBold', fontSize: 20 },
  sectionLabel: { color: '#A0A0A0', fontSize: 11, fontFamily: 'Inter_700Bold', letterSpacing: 1, marginBottom: 12, marginTop: 8 },
  catScroll: { marginHorizontal: -20 },
  catScrollContent: { paddingHorizontal: 20, paddingRight: 40 },
  catRow: { flexDirection: 'row', gap: 8 },
  miniCatPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10, gap: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  miniCatPillActive: { backgroundColor: '#FFFFFF', borderColor: '#FFFFFF' },
  miniCatText: { color: '#A0A0A0', fontSize: 13, fontFamily: 'Inter_500Medium' },
  miniCatTextActive: { color: '#0A0A0A', fontFamily: 'Inter_700Bold' },
  miniCatSubtext: { color: '#606060', fontSize: 9, fontFamily: 'Inter_700Bold' },
  
  dateSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, height: 54, paddingHorizontal: 16, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  dateContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dateText: { color: '#FFFFFF', fontFamily: 'Inter_500Medium', fontSize: 14 },
  dateLabelBox: { backgroundColor: 'rgba(0, 240, 255, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  dateLabelText: { color: '#00F0FF', fontSize: 8, fontFamily: 'Inter_800ExtraBold', letterSpacing: 0.5 },

  sectionLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, marginTop: 8 },
  smartHint: { backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  smartHintText: { color: '#A0A0A0', fontSize: 10, fontFamily: 'Inter_700Bold' },

  bigAddButton: { backgroundColor: '#FFFFFF', borderRadius: 16, height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 24 },
  addBtnLabel: { color: '#0A0A0A', fontFamily: 'Outfit_800ExtraBold', fontSize: 16 },
  addButtonDisabled: { opacity: 0.3 },

  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16, paddingHorizontal: 4 },
  listTitle: { fontFamily: 'Outfit_600SemiBold', fontSize: 20, color: '#FFFFFF' },
  listCount: { fontFamily: 'Inter_500Medium', fontSize: 12, color: '#A0A0A0' },
  
  expensesList: { gap: 10 },
  strip: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderRadius: 18, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.1)' },
  stripLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  stripIconBox: { width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' },
  iconBoxDanger: { backgroundColor: 'rgba(239, 68, 68, 0.1)' },
  stripName: { color: '#FFFFFF', fontFamily: 'Inter_500Medium', fontSize: 14, marginBottom: 1 },
  stripCat: { color: '#606060', fontFamily: 'Inter_700Bold', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  stripRight: { alignItems: 'flex-end' },
  stripAmount: { color: '#FFFFFF', fontFamily: 'Outfit_600SemiBold', fontSize: 16 },
  pkSmall: { fontSize: 10, color: '#A0A0A0' },
  stripDate: { color: '#606060', fontFamily: 'Inter_500Medium', fontSize: 10, marginTop: 2 },
  textDanger: { color: '#EF4444' }
});

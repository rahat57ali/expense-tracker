import React, { useState, useRef, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Platform, ScrollView } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useLedgr } from '../lib/LedgrContext';
import { ExpenseCategory, Expense, autoCategorize } from '../lib/store';
import { Coffee, Car, Home as HomeIcon, ShoppingBag, Heart, MoreHorizontal, Plus, ShoppingBasket, Calendar, Pencil, TrendingUp, TrendingDown } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSnackbar } from '../components/Snackbar';
import EditExpenseModal from '../components/EditExpenseModal';


const CATEGORY_ICONS: Record<ExpenseCategory, any> = {
  Food: Coffee,
  Transport: Car,
  Bills: HomeIcon,
  Shopping: ShoppingBag,
  Grocery: ShoppingBasket,
  Health: Heart,
  Other: MoreHorizontal,
};

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

  const MOTIVATIONAL_PROMPT = useMemo(() => {
    const prompts = [
      "Let's see where the money went 👀",
      "You showed up. That already counts.",
      "Quick log. Clear mind. Let's go.",
      "Your wallet called. It needs you.",
      "Don't let today's expenses become tomorrow's mystery.",
      "A minute now saves stress later.",
      "You're doing better than you think. Keep logging.",
      "New day, fresh start. Let's track it.",
      "Got something to add? Let's do it.",
      "The best time to log was earlier. Second best? Right now."
    ];
    return prompts[Math.floor(Math.random() * prompts.length)];
  }, []);

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const thisMonthSpent = expenses
    .filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((sum, e) => sum + e.amount, 0);

  const lastMonthSpent = expenses
    .filter(e => {
      const d = new Date(e.date);
      const m = currentMonth === 0 ? 11 : currentMonth - 1;
      const y = currentMonth === 0 ? currentYear - 1 : currentYear;
      return d.getMonth() === m && d.getFullYear() === y;
    })
    .reduce((sum, e) => sum + e.amount, 0);

  const budgetUsage = budget.total > 0 ? (thisMonthSpent / budget.total) : 0;
  const isOverBudget = thisMonthSpent > budget.total;

  let insight = "First month tracking!";
  let insightColor = '#00F0FF';
  let InsightIcon = TrendingUp;

  if (lastMonthSpent > 0) {
    const diff = ((thisMonthSpent - lastMonthSpent) / lastMonthSpent) * 100;
    insight = `${Math.abs(Math.round(diff))}% ${diff > 0 ? 'more' : 'less'} than last month`;
    insightColor = diff > 0 ? '#EF4444' : '#10B981';
    InsightIcon = diff > 0 ? TrendingUp : TrendingDown;
  }

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
          <View style={styles.headerTop}>
            <Image 
              source={require('../../assets/logo.png')} 
              style={styles.logoSmall} 
              resizeMode="contain" 
            />
            <Text style={styles.brandNameSmall}>LEDGR</Text>
          </View>
          <Text style={styles.greetingText} numberOfLines={2}>
            {MOTIVATIONAL_PROMPT}
          </Text>
          
          <LinearGradient 
            colors={['rgba(30,30,30,0.8)', 'rgba(10,10,10,0.95)']} 
            style={styles.summaryCard}
          >
            <View style={styles.summaryRow}>
              <View>
                <Text style={styles.summaryLabel}>SPENT THIS MONTH</Text>
                <View style={styles.summaryAmountRow}>
                  <Text style={styles.summaryCurrency}>PKR</Text>
                  <Text style={styles.summaryAmount}>{thisMonthSpent.toLocaleString()}</Text>
                </View>
              </View>
              <View style={[styles.insightPill, { backgroundColor: `${insightColor}15` }]}>
                <InsightIcon color={insightColor} size={12} style={{ marginRight: 4 }} />
                <Text style={[styles.insightText, { color: insightColor }]}>{insight}</Text>
              </View>
            </View>

            <View style={styles.usageContainer}>
              <View style={styles.usageHeader}>
                <Text style={styles.usageLabel}>Budget Usage</Text>
                <Text style={[styles.usagePercent, isOverBudget && { color: '#EF4444' }]}>
                  {Math.round(budgetUsage * 100)}%
                </Text>
              </View>
              <View style={styles.usageBarBg}>
                <View style={[
                  styles.usageBarFill, 
                  { width: `${Math.min(100, budgetUsage * 100)}%` },
                  isOverBudget && { backgroundColor: '#EF4444' }
                ]} />
              </View>
            </View>
          </LinearGradient>
        </View>

        <View style={styles.inputCard}>
          <View style={styles.inputRow}>
            <Pencil color="#A0A0A0" size={18} style={{ marginRight: 12 }} />
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
            <View style={styles.scrollHint}>
              <Text style={styles.scrollHintText}>Scroll for more ›</Text>
            </View>
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
          {expenses.length > 0 && (() => {
            const exp = expenses[0];
            const desc = exp.name.replace(/^Paid:\s*/i, '');
            return (
              <View style={styles.latestChipRow}>
                <Text style={styles.latestChipLabel}>LAST</Text>
                <View style={styles.latestChipCat}>
                  <Text style={styles.latestChipCatText}>{exp.category.toUpperCase()}</Text>
                </View>
                <Text style={styles.latestChipDesc} numberOfLines={1}>{desc}</Text>
                <Text style={styles.latestChipAmount}>PKR {exp.amount.toLocaleString()}</Text>
              </View>
            );
          })()}

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
  scrollContent: { padding: 16, paddingBottom: 20 },
  header: { marginBottom: 12, marginTop: 10 },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  logoSmall: { width: 20, height: 20 },
  brandNameSmall: { fontFamily: 'Outfit_800ExtraBold', color: '#606060', fontSize: 10, letterSpacing: 4 },
  greetingText: { fontFamily: 'Outfit_600SemiBold', fontSize: 18, color: '#FFFFFF', marginBottom: 8 },
  
  summaryCard: { borderRadius: 20, padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', marginTop: 2 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  summaryLabel: { color: '#606060', fontSize: 9, fontFamily: 'Inter_700Bold', letterSpacing: 1 },
  summaryAmountRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 4 },
  summaryCurrency: { color: '#606060', fontSize: 12, fontFamily: 'Outfit_400Regular' },
  summaryAmount: { color: '#FFFFFF', fontSize: 22, fontFamily: 'Outfit_600SemiBold' },
  insightPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  insightText: { fontSize: 10, fontFamily: 'Inter_700Bold' },
  usageContainer: { marginTop: 4 },
  usageHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  usageLabel: { color: '#A0A0A0', fontSize: 10, fontFamily: 'Inter_500Medium' },
  usagePercent: { color: '#00F0FF', fontSize: 11, fontFamily: 'Outfit_700Bold' },
  usageBarBg: { height: 4, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' },
  usageBarFill: { height: '100%', backgroundColor: '#00F0FF', borderRadius: 2 },


  
  inputCard: { backgroundColor: '#141414', borderRadius: 28, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', marginBottom: 10 },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0A0A0A', borderRadius: 16, height: 50, paddingHorizontal: 16, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  inputDesc: { flex: 1, color: '#FFFFFF', fontFamily: 'Inter_500Medium', fontSize: 16, padding: 0 },
  currencyPrefix: { fontFamily: 'Inter_700Bold', color: '#00F0FF', fontSize: 12, marginRight: 12 },
  inputAmount: { flex: 1, color: '#FFFFFF', fontFamily: 'Outfit_600SemiBold', fontSize: 20, padding: 0 },
  sectionLabel: { color: '#A0A0A0', fontSize: 11, fontFamily: 'Inter_700Bold', letterSpacing: 1, marginBottom: 6, marginTop: 4 },
  catScroll: { marginHorizontal: -16 },
  catScrollContent: { paddingHorizontal: 16, paddingRight: 40 },
  catRow: { flexDirection: 'row', gap: 8 },
  miniCatPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8, gap: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  miniCatPillActive: { backgroundColor: '#FFFFFF', borderColor: '#FFFFFF' },
  miniCatText: { color: '#A0A0A0', fontSize: 13, fontFamily: 'Inter_500Medium' },
  miniCatTextActive: { color: '#0A0A0A', fontFamily: 'Inter_700Bold' },
  miniCatSubtext: { color: '#606060', fontSize: 9, fontFamily: 'Inter_700Bold' },
  
  dateSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, height: 50, paddingHorizontal: 16, marginBottom: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  dateContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dateText: { color: '#FFFFFF', fontFamily: 'Inter_500Medium', fontSize: 14 },
  dateLabelBox: { backgroundColor: 'rgba(0, 240, 255, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  dateLabelText: { color: '#00F0FF', fontSize: 8, fontFamily: 'Inter_800ExtraBold', letterSpacing: 0.5 },

  sectionLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, marginTop: 4 },

  scrollHint: { backgroundColor: 'rgba(255,255,255,0.03)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  scrollHintText: { color: '#A0A0A0', fontSize: 9, fontFamily: 'Inter_500Medium' },

  bigAddButton: { backgroundColor: '#FFFFFF', borderRadius: 16, height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 10 },
  addBtnLabel: { color: '#0A0A0A', fontFamily: 'Outfit_800ExtraBold', fontSize: 16 },
  addButtonDisabled: { opacity: 0.3 },

  latestChipRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, backgroundColor: 'rgba(0, 240, 255, 0.05)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(0, 240, 255, 0.15)' },
  latestChipLabel: { color: '#606060', fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1, marginRight: 8 },
  latestChipCat: { backgroundColor: 'rgba(0, 240, 255, 0.1)', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6, marginRight: 8 },
  latestChipCatText: { color: '#00F0FF', fontFamily: 'Inter_700Bold', fontSize: 9, letterSpacing: 0.5 },
  latestChipDesc: { flex: 1, color: '#E0E0E0', fontFamily: 'Inter_500Medium', fontSize: 13, marginRight: 8 },
  latestChipAmount: { color: '#00F0FF', fontFamily: 'Outfit_600SemiBold', fontSize: 14 },
  textDanger: { color: '#EF4444' }
});

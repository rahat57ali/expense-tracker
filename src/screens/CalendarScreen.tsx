import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Calendar } from 'react-native-calendars';
import { useLedgr } from '../lib/LedgrContext';
import { format, parse, addMonths, addYears, addWeeks, differenceInDays, startOfDay } from 'date-fns';
import { 
  Coffee, Car, Home as HomeIcon, ShoppingBag, Heart, MoreHorizontal, 
  ShoppingBasket, CreditCard, Zap, Flame, Globe, Clock, CheckCircle2, RefreshCw 
} from 'lucide-react-native';
import { ExpenseCategory, Expense, Bill } from '../lib/store';
import { LinearGradient } from 'expo-linear-gradient';
import EditExpenseModal from '../components/EditExpenseModal';
import BillPaymentModal from '../components/BillPaymentModal';
import { useSnackbar } from '../components/Snackbar';
import { useTheme } from '../lib/ThemeContext';

const CATEGORY_ICONS: Record<ExpenseCategory, any> = {
  Food: Coffee,
  Transport: Car,
  Bills: HomeIcon,
  Shopping: ShoppingBag,
  Grocery: ShoppingBasket,
  Health: Heart,
  Other: MoreHorizontal,
};

export default function CalendarScreen() {
  const { expenses, budget, isLoaded, bills, updateBill, addExpense } = useLedgr();
  const { showSnackbar } = useSnackbar();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [selectedBillToPay, setSelectedBillToPay] = useState<Bill | null>(null);
  const [isBillPayModalVisible, setIsBillPayModalVisible] = useState(false);

  const currentMonthStr = format(new Date(), 'yyyy-MM');

  const markedDates = useMemo(() => {
    const marks: any = {};
    
    // Map expenses
    expenses.forEach(e => {
      const dateStr = format(new Date(e.date), 'yyyy-MM-dd');
      if (!marks[dateStr]) marks[dateStr] = { dots: [] };
      if (!marks[dateStr].dots.some((d: any) => d.key === 'expense')) {
        marks[dateStr].dots.push({ key: 'expense', color: colors.accent });
      }
    });

    // Map bills due
    bills.forEach(b => {
      if (b.isPaused) return;
      const dateStr = format(new Date(b.dueDate), 'yyyy-MM-dd');
      if (!marks[dateStr]) marks[dateStr] = { dots: [] };
      if (!marks[dateStr].dots.some((d: any) => d.key === 'bill')) {
        marks[dateStr].dots.push({ key: 'bill', color: colors.purple });
      }
    });
    
    // Handle selected date
    if (!marks[selectedDate]) {
      marks[selectedDate] = { dots: [] };
    }
    marks[selectedDate] = {
      ...marks[selectedDate],
      selected: true,
      selectedColor: colors.accent + '33',
      selectedTextColor: colors.accent
    };
    
    return marks;
  }, [expenses, bills, selectedDate, colors]);

  const dailyExpenses = useMemo(() => {
    return expenses.filter(e => format(new Date(e.date), 'yyyy-MM-dd') === selectedDate);
  }, [expenses, selectedDate]);

  const dailyBills = useMemo(() => {
    return bills.filter(b => {
      if (b.isPaused) return false;
      return format(new Date(b.dueDate), 'yyyy-MM-dd') === selectedDate;
    });
  }, [bills, selectedDate]);

  const totalDaily = dailyExpenses.reduce((sum, e) => sum + e.amount, 0);

  const getCategoryStatus = (cat: ExpenseCategory) => {
    const limit = budget.categories[cat] || 0;
    const spent = expenses.filter(e => e.category === cat).reduce((sum, e) => sum + e.amount, 0);
    return { isOver: spent > limit };
  };

  const handlePayBillFromCalendar = (bill: Bill) => {
    setSelectedBillToPay(bill);
    setIsBillPayModalVisible(true);
  };

  const handleConfirmCalendarPayment = async (amount: number) => {
    if (!selectedBillToPay) return;

    await addExpense({
      name: `Paid: ${selectedBillToPay.name}`,
      amount,
      category: selectedBillToPay.category || 'Bills',
      date: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss")
    });

    const currentDue = new Date(selectedBillToPay.dueDate);
    let nextDue: Date;
    switch (selectedBillToPay.frequency) {
      case 'yearly': nextDue = addYears(currentDue, 1); break;
      case 'quarterly': nextDue = addMonths(currentDue, 3); break;
      case 'weekly': nextDue = addWeeks(currentDue, 1); break;
      case 'one-time': nextDue = currentDue; break;
      case 'monthly':
      default:
        nextDue = addMonths(currentDue, 1);
        break;
    }

    await updateBill({
      ...selectedBillToPay,
      dueDate: format(nextDue, "yyyy-MM-dd'T'HH:mm:ss"),
      lastPaidDate: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss"),
      lastPaidAmount: amount,
      isPaid: selectedBillToPay.frequency === 'one-time'
    });

    setIsBillPayModalVisible(false);
    showSnackbar(`Paid ${selectedBillToPay.name} - PKR ${amount.toLocaleString()}`);
  };

  if (!isLoaded) return <View style={[styles.container, { backgroundColor: colors.background }]} />;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView 
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerTopLeft}>
              <Image source={require('../../assets/logo.png')} style={styles.logoSmall} resizeMode="contain" />
              <Text style={[styles.brandNameSmall, { color: colors.textTertiary }]}>LEDGR</Text>
            </View>
            <Text style={[styles.headerTitleSmall, { color: colors.textPrimary }]}>Calendar</Text>
          </View>
        </View>

        <View style={[styles.calendarContainer, { borderBottomColor: colors.divider }]}>
          <Calendar
            key={isDark ? 'dark-mode' : 'light-mode'}
            markingType={'multi-dot'}
            theme={{
              backgroundColor: colors.calendarBg,
              calendarBackground: colors.calendarBg,
              textSectionTitleColor: colors.textTertiary,
              selectedDayBackgroundColor: colors.calendarSelectedBg,
              selectedDayTextColor: colors.calendarSelectedText,
              todayTextColor: colors.calendarTodayText,
              dayTextColor: colors.calendarDayText,
              textDisabledColor: colors.calendarDisabledText,
              dotColor: colors.calendarSelectedText,
              selectedDotColor: colors.calendarSelectedText,
              arrowColor: colors.calendarTodayText,
              monthTextColor: colors.textPrimary,
              indicatorColor: colors.calendarTodayText,
              textDayFontFamily: 'Inter_500Medium',
              textMonthFontFamily: 'Outfit_600SemiBold',
              textDayHeaderFontFamily: 'Inter_700Bold',
              textDayFontSize: 14,
              textMonthFontSize: 18,
              textDayHeaderFontSize: 12
            }}
            markedDates={markedDates}
            onDayPress={(day: any) => setSelectedDate(day.dateString)}
          />
        </View>

        {/* Legend for Calendar Dots */}
        <View style={styles.calendarLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.accent }]} />
            <Text style={[styles.legendLabel, { color: colors.textTertiary }]}>Expense</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.purple }]} />
            <Text style={[styles.legendLabel, { color: colors.textTertiary }]}>Bill Due</Text>
          </View>
        </View>

        {/* Bills Due On This Day Section */}
        {dailyBills.length > 0 && (
          <View style={styles.dayBillsSection}>
            <View style={styles.sectionHeaderRow}>
              <Clock color={colors.purple} size={14} style={{ marginRight: 6 }} />
              <Text style={[styles.dayBillsTitle, { color: colors.purple }]}>
                BILLS DUE ON THIS DAY ({dailyBills.length})
              </Text>
            </View>
            {dailyBills.map(bill => {
              const isSettled =
                (bill.frequency === 'one-time' && bill.isPaid) ||
                (bill.lastPaidDate && format(new Date(bill.lastPaidDate), 'yyyy-MM') === currentMonthStr);

              return (
                <LinearGradient
                  key={bill.id}
                  colors={isSettled ? [`${colors.success}10`, colors.gradientEnd] : [`${colors.purple}15`, colors.gradientEnd]}
                  style={[styles.billStrip, { borderColor: isSettled ? `${colors.success}30` : `${colors.purple}40` }]}
                >
                  <View style={styles.billStripLeft}>
                    <View style={[styles.billIconCircle, { backgroundColor: isSettled ? `${colors.success}20` : `${colors.purple}20` }]}>
                      <CreditCard color={isSettled ? colors.success : colors.purple} size={16} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.billStripName, { color: colors.textPrimary }]}>{bill.name}</Text>
                      <Text style={[styles.billStripCategory, { color: colors.textTertiary }]}>
                        {bill.category} {bill.frequency ? `• ${bill.frequency}` : ''}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.billStripRight}>
                    <Text style={[styles.billStripAmount, { color: colors.textPrimary }]}>
                      PKR {bill.amount.toLocaleString()}
                    </Text>
                    {isSettled ? (
                      <View style={styles.settledBadge}>
                        <CheckCircle2 color={colors.success} size={12} style={{ marginRight: 4 }} />
                        <Text style={[styles.settledText, { color: colors.success }]}>Settled</Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={[styles.payNowBtn, { backgroundColor: colors.purple }]}
                        onPress={() => handlePayBillFromCalendar(bill)}
                      >
                        <RefreshCw color="#FFFFFF" size={10} style={{ marginRight: 4 }} />
                        <Text style={styles.payNowText}>Pay Now</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </LinearGradient>
              );
            })}
          </View>
        )}

        <View style={styles.detailsHeader}>
          <View>
            <Text style={[styles.detailsDate, { color: colors.textPrimary }]}>{format(parse(selectedDate, 'yyyy-MM-dd', new Date()), 'MMMM do, yyyy')}</Text>
            <Text style={[styles.detailsCount, { color: colors.textSecondary }]}>{dailyExpenses.length} transactions</Text>
          </View>
          <View style={[styles.totalBadge, { backgroundColor: colors.accentBg, borderColor: colors.accent + '33' }]}>
            <Text style={[styles.totalBadgeText, { color: colors.accent }]}>PKR {totalDaily.toLocaleString()}</Text>
          </View>
        </View>
        {dailyExpenses.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>No expenses for this day</Text>
          </View>
        ) : (
          dailyExpenses.map((expense) => {
            const Icon = CATEGORY_ICONS[expense.category as ExpenseCategory] || MoreHorizontal;
            const { isOver } = getCategoryStatus(expense.category as ExpenseCategory);

            return (
              <TouchableOpacity 
                key={expense.id}
                onPress={() => {
                  setEditingExpense(expense);
                  setIsEditModalVisible(true);
                }}
              >
                <LinearGradient 
                  colors={[colors.gradientStart, colors.gradientEnd] as const} 
                  style={[styles.strip, { borderColor: colors.cardBorderSubtle }]}
                >
                  <View style={styles.stripLeft}>
                    <View style={[styles.stripIconBox, { backgroundColor: colors.closeBtnBg }, isOver && { backgroundColor: `${colors.danger}15` }]}>
                      <Icon color={isOver ? colors.danger : colors.textPrimary} size={16} />
                    </View>
                    <View style={{ flex: 1, marginRight: 12 }}>
                      <Text style={[styles.expenseName, { color: colors.textPrimary }]} numberOfLines={2}>{expense.name}</Text>
                      <Text style={[styles.stripCat, { color: colors.textSecondary }]}>{expense.category}</Text>
                    </View>
                  </View>

                  <View style={styles.stripRight}>
                    <Text 
                      style={[styles.stripAmount, { color: colors.textPrimary }]} 
                      numberOfLines={1} 
                      adjustsFontSizeToFit
                    >
                      <Text style={[styles.pkSmall, { color: colors.textTertiary }]}>PKR </Text>{expense.amount.toLocaleString()}
                    </Text>
                    <Text style={[styles.stripDate, { color: colors.textTertiary }]}>Record</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      <EditExpenseModal 
        visible={isEditModalVisible}
        onClose={() => setIsEditModalVisible(false)}
        expense={editingExpense}
      />

      <BillPaymentModal
        visible={isBillPayModalVisible}
        bill={selectedBillToPay}
        onClose={() => setIsBillPayModalVisible(false)}
        onConfirm={handleConfirmCalendarPayment}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { marginBottom: 0 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  headerTopLeft: { flexDirection: 'row', alignItems: 'center' },
  headerDivider: { width: 1, height: 12, marginHorizontal: 12, opacity: 0.3 },
  headerTitleSmall: { fontFamily: 'Outfit_600SemiBold', fontSize: 13, letterSpacing: 1, textTransform: 'uppercase', opacity: 0.8 },
  logoSmall: { width: 18, height: 18, marginRight: 10 },
  brandNameSmall: { fontFamily: 'Outfit_800ExtraBold', fontSize: 10, letterSpacing: 2 },
  subtitle: { fontFamily: 'Inter_500Medium', fontSize: 13, marginTop: 2 },
  
  calendarContainer: { marginHorizontal: 16, borderRadius: 24, paddingBottom: 16, borderBottomWidth: 1 },
  
  calendarLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginTop: 10,
    marginBottom: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  legendLabel: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
  },

  dayBillsSection: {
    marginTop: 16,
    marginBottom: 4,
    gap: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    paddingLeft: 4,
  },
  dayBillsTitle: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1.2,
  },
  billStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  billStripLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 10,
  },
  billIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  billStripName: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 14,
  },
  billStripCategory: {
    fontFamily: 'Inter_500Medium',
    fontSize: 10,
    textTransform: 'capitalize',
    marginTop: 1,
  },
  billStripRight: {
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  billStripAmount: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 14,
    marginBottom: 4,
  },
  settledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settledText: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
  },
  payNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  payNowText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
  },

  detailsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 4, paddingVertical: 16 },
  detailsDate: { fontFamily: 'Outfit_600SemiBold', fontSize: 18 },
  detailsCount: { fontFamily: 'Inter_500Medium', fontSize: 12, marginTop: 2 },
  totalBadge: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 100, borderWidth: 1 },
  totalBadgeText: { fontFamily: 'Outfit_600SemiBold', fontSize: 14 },

  scrollContent: { paddingHorizontal: 20, paddingTop: 8 },
  strip: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderRadius: 18, borderWidth: 1, marginBottom: 10 },
  stripLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  stripIconBox: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  expenseName: { fontFamily: 'Inter_500Medium', fontSize: 14, marginBottom: 1 },
  stripCat: { fontFamily: 'Inter_700Bold', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  stripRight: { alignItems: 'flex-end', minWidth: 90, flexShrink: 0 },
  stripAmount: { fontFamily: 'Outfit_600SemiBold', fontSize: 16, textAlign: 'right' },
  pkSmall: { fontSize: 10 },
  stripDate: { fontFamily: 'Inter_500Medium', fontSize: 10, marginTop: 2 },
  
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 40 },
  emptyText: { fontFamily: 'Inter_500Medium', fontSize: 16 }
});
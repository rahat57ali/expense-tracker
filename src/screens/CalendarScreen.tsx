import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar } from 'react-native-calendars';
import { useLedgr } from '../lib/LedgrContext';
import { format } from 'date-fns';
import { Coffee, Car, Home as HomeIcon, ShoppingBag, Heart, MoreHorizontal, ShoppingBasket } from 'lucide-react-native';
import { ExpenseCategory, Expense } from '../lib/store';
import { LinearGradient } from 'expo-linear-gradient';
import EditExpenseModal from '../components/EditExpenseModal';
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
  const { expenses, budget, isLoaded } = useLedgr();
  const { colors, isDark } = useTheme();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);

  const markedDates = useMemo(() => {
    const marks: any = {};
    expenses.forEach(e => {
      const dateStr = format(new Date(e.date), 'yyyy-MM-dd');
      if (!marks[dateStr]) {
        marks[dateStr] = { marked: true, dotColor: colors.accent };
      }
    });
    
    if (marks[selectedDate]) {
      marks[selectedDate] = { 
        ...marks[selectedDate], 
        selected: true, 
        selectedColor: colors.accent + '33',
        selectedTextColor: colors.accent
      };
    } else {
      marks[selectedDate] = { 
        selected: true, 
        selectedColor: colors.divider,
        selectedTextColor: colors.textPrimary
      };
    }
    
    return marks;
  }, [expenses, selectedDate, colors]);

  const dailyExpenses = useMemo(() => {
    return expenses.filter(e => format(new Date(e.date), 'yyyy-MM-dd') === selectedDate);
  }, [expenses, selectedDate]);

  const totalDaily = dailyExpenses.reduce((sum, e) => sum + e.amount, 0);

  const getCategoryStatus = (cat: ExpenseCategory) => {
    const limit = budget.categories[cat] || 0;
    const spent = expenses.filter(e => e.category === cat).reduce((sum, e) => sum + e.amount, 0);
    return { isOver: spent > limit };
  };

  if (!isLoaded) return <View style={[styles.container, { backgroundColor: colors.background }]} />;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
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

        <View style={styles.detailsHeader}>
          <View>
            <Text style={[styles.detailsDate, { color: colors.textPrimary }]}>{format(new Date(selectedDate), 'MMMM do, yyyy')}</Text>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { marginBottom: 12 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  headerTopLeft: { flexDirection: 'row', alignItems: 'center' },
  headerDivider: { width: 1, height: 12, marginHorizontal: 12, opacity: 0.3 },
  headerTitleSmall: { fontFamily: 'Outfit_600SemiBold', fontSize: 13, letterSpacing: 1, textTransform: 'uppercase', opacity: 0.8 },
  logoSmall: { width: 18, height: 18, marginRight: 10 },
  brandNameSmall: { fontFamily: 'Outfit_800ExtraBold', fontSize: 10, letterSpacing: 2 },
  subtitle: { fontFamily: 'Inter_500Medium', fontSize: 13, marginTop: 2 },
  
  calendarContainer: { marginHorizontal: 16, borderRadius: 24, paddingBottom: 16, borderBottomWidth: 1 },
  
  detailsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 20 },
  detailsDate: { fontFamily: 'Outfit_600SemiBold', fontSize: 18 },
  detailsCount: { fontFamily: 'Inter_500Medium', fontSize: 12, marginTop: 2 },
  totalBadge: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 100, borderWidth: 1 },
  totalBadgeText: { fontFamily: 'Outfit_600SemiBold', fontSize: 14 },

  scrollContent: { paddingHorizontal: 20, paddingBottom: 110, paddingTop: 8 },
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
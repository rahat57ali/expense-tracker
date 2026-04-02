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
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);

  const markedDates = useMemo(() => {
    const marks: any = {};
    expenses.forEach(e => {
      const dateStr = format(new Date(e.date), 'yyyy-MM-dd');
      if (!marks[dateStr]) {
        marks[dateStr] = { marked: true, dotColor: '#00F0FF' };
      }
    });
    
    if (marks[selectedDate]) {
      marks[selectedDate] = { 
        ...marks[selectedDate], 
        selected: true, 
        selectedColor: 'rgba(0, 240, 255, 0.2)',
        selectedTextColor: '#00F0FF'
      };
    } else {
      marks[selectedDate] = { 
        selected: true, 
        selectedColor: 'rgba(255, 255, 255, 0.1)',
        selectedTextColor: '#FFFFFF'
      };
    }
    
    return marks;
  }, [expenses, selectedDate]);

  const dailyExpenses = useMemo(() => {
    return expenses.filter(e => format(new Date(e.date), 'yyyy-MM-dd') === selectedDate);
  }, [expenses, selectedDate]);

  const totalDaily = dailyExpenses.reduce((sum, e) => sum + e.amount, 0);

  const getCategoryStatus = (cat: ExpenseCategory) => {
    const limit = budget.categories[cat] || 0;
    const spent = expenses.filter(e => e.category === cat).reduce((sum, e) => sum + e.amount, 0);
    return { isOver: spent > limit };
  };

  if (!isLoaded) return <View style={styles.container} />;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Image 
          source={require('../../assets/logo.png')} 
          style={styles.logo} 
          resizeMode="contain" 
        />
        <Text style={styles.brandName}>LEDGR</Text>
        <Text style={styles.headerTitle}>Expense Calendar</Text>
        <Text style={styles.headerSubtitle}>Track your daily spending</Text>
      </View>

      <View style={styles.calendarContainer}>
        <Calendar
          theme={{
            backgroundColor: '#0A0A0A',
            calendarBackground: '#0A0A0A',
            textSectionTitleColor: '#949494',
            selectedDayBackgroundColor: '#00F0FF',
            selectedDayTextColor: '#0A0A0A',
            todayTextColor: '#00F0FF',
            dayTextColor: '#FFFFFF',
            textDisabledColor: '#303030',
            dotColor: '#00F0FF',
            selectedDotColor: '#0A0A0A',
            arrowColor: '#00F0FF',
            monthTextColor: '#FFFFFF',
            indicatorColor: '#00F0FF',
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
          <Text style={styles.detailsDate}>{format(new Date(selectedDate), 'MMMM do, yyyy')}</Text>
          <Text style={styles.detailsCount}>{dailyExpenses.length} transactions</Text>
        </View>
        <View style={styles.totalBadge}>
          <Text style={styles.totalBadgeText}>PKR {totalDaily.toLocaleString()}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {dailyExpenses.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No expenses for this day</Text>
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
                  colors={['rgba(25,25,25,0.7)', 'rgba(15,15,15,0.8)']} 
                  style={styles.strip}
                >
                  <View style={styles.stripLeft}>
                    <View style={[styles.stripIconBox, isOver && styles.iconBoxDanger]}>
                      <Icon color={isOver ? "#EF4444" : "#FFFFFF"} size={16} />
                    </View>
                    <View style={{ flex: 1, marginRight: 12 }}>
                      <Text style={styles.expenseName} numberOfLines={2}>{expense.name}</Text>
                      <Text style={styles.stripCat}>{expense.category}</Text>
                    </View>
                  </View>

                  <View style={styles.stripRight}>
                    <Text 
                      style={styles.stripAmount} 
                      numberOfLines={1} 
                      adjustsFontSizeToFit
                    >
                      <Text style={styles.pkSmall}>PKR </Text>{expense.amount.toLocaleString()}
                    </Text>
                    <Text style={styles.stripDate}>Record</Text>
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
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  header: { padding: 24, paddingBottom: 16, alignItems: 'center' },
  logo: { width: 36, height: 36, marginBottom: 8 },
  brandName: { fontFamily: 'Outfit_800ExtraBold', color: '#FFFFFF', fontSize: 12, letterSpacing: 4, marginBottom: 12 },
  headerTitle: { fontFamily: 'Outfit_800ExtraBold', fontSize: 28, color: '#FFFFFF' },
  headerSubtitle: { fontFamily: 'Inter_500Medium', fontSize: 14, color: '#949494', marginTop: 4 },
  
  calendarContainer: { marginHorizontal: 16, backgroundColor: '#0A0A0A', borderRadius: 24, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  
  detailsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 20 },
  detailsDate: { color: '#FFFFFF', fontFamily: 'Outfit_600SemiBold', fontSize: 18 },
  detailsCount: { color: '#949494', fontFamily: 'Inter_500Medium', fontSize: 12, marginTop: 2 },
  totalBadge: { backgroundColor: 'rgba(0, 240, 255, 0.1)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 100, borderWidth: 1, borderColor: 'rgba(0, 240, 255, 0.2)' },
  totalBadgeText: { color: '#00F0FF', fontFamily: 'Outfit_600SemiBold', fontSize: 14 },

  scrollContent: { paddingHorizontal: 24, paddingBottom: 120 },
  strip: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderRadius: 18, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.1)', marginBottom: 10 },
  stripLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  stripIconBox: { width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' },
  iconBoxDanger: { backgroundColor: 'rgba(239, 68, 68, 0.1)' },
  expenseName: { color: '#FFFFFF', fontFamily: 'Inter_500Medium', fontSize: 14, marginBottom: 1 },
  stripCat: { color: '#949494', fontFamily: 'Inter_700Bold', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  stripRight: { alignItems: 'flex-end', minWidth: 90, flexShrink: 0 },
  stripAmount: { color: '#FFFFFF', fontFamily: 'Outfit_600SemiBold', fontSize: 16, textAlign: 'right' },
  pkSmall: { fontSize: 10, color: '#A0A0A0' },
  stripDate: { color: '#949494', fontFamily: 'Inter_500Medium', fontSize: 10, marginTop: 2 },
  
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 40 },
  emptyText: { color: '#949494', fontFamily: 'Inter_500Medium', fontSize: 16 }
});

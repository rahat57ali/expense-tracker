import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, FlatList, TextInput, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { ArrowLeft, Search, ArrowUpDown, MoreHorizontal, Coffee, Car, Home as HomeIcon, ShoppingBag, Heart, ShoppingBasket, Calendar as CalendarIcon, X } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLedgr } from '../lib/LedgrContext';
import { useThemeColors } from '../lib/ThemeContext';
import { ExpenseCategory, Expense } from '../lib/store';
import { isToday, isThisWeek, isThisMonth, isWithinInterval, startOfDay, endOfDay, format } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import { Calendar } from 'react-native-calendars';

const CATEGORY_ICONS: Record<ExpenseCategory, any> = {
  Food: Coffee,
  Transport: Car,
  Bills: HomeIcon,
  Shopping: ShoppingBag,
  Grocery: ShoppingBasket,
  Health: Heart,
  Other: MoreHorizontal,
};

type FilterTab = 'All' | 'Today' | 'This Week' | 'This Month' | 'Custom';
type SortOption = 'Date Desc' | 'Date Asc' | 'Amount Desc' | 'Amount Asc';

interface TransactionsModalProps {
  visible: boolean;
  onClose: () => void;
  onEditExpense: (expense: Expense) => void;
}

export default function TransactionsModal({ visible, onClose, onEditExpense }: TransactionsModalProps) {
  const { expenses } = useLedgr();
  const colors = useThemeColors();

  const [activeTab, setActiveTab] = useState<FilterTab>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('Date Desc');
  const [showSortMenu, setShowSortMenu] = useState(false);

  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);
  const [customStartDate, setCustomStartDate] = useState<string | null>(null);
  const [customEndDate, setCustomEndDate] = useState<string | null>(null);

  const handleTabPress = (tab: FilterTab) => {
    setActiveTab(tab);
    if (tab === 'Custom') {
      setIsDatePickerVisible(true);
    } else {
      setCustomStartDate(null);
      setCustomEndDate(null);
    }
  };

  const handleDayPress = (day: any) => {
    if (!customStartDate || (customStartDate && customEndDate)) {
      setCustomStartDate(day.dateString);
      setCustomEndDate(null);
    } else {
      const d1 = new Date(customStartDate);
      const d2 = new Date(day.dateString);
      if (d2 < d1) {
        setCustomStartDate(day.dateString);
        setCustomEndDate(customStartDate);
      } else {
        setCustomEndDate(day.dateString);
      }
      setTimeout(() => setIsDatePickerVisible(false), 300);
    }
  };

  const markedDates: any = {};
  if (customStartDate) {
    markedDates[customStartDate] = { startingDay: true, color: colors.accent, textColor: colors.background };
  }
  if (customEndDate) {
    markedDates[customEndDate] = { endingDay: true, color: colors.accent, textColor: colors.background };
  }
  if (customStartDate && customEndDate) {
    const end = new Date(customEndDate);
    let curr = new Date(customStartDate);
    curr.setDate(curr.getDate() + 1);
    while (curr < end) {
      markedDates[format(curr, 'yyyy-MM-dd')] = { color: colors.accentBg, textColor: colors.accent };
      curr.setDate(curr.getDate() + 1);
    }
  }

  const filteredAndSortedExpenses = useMemo(() => {
    let result = [...expenses];

    // 1. Filter by Tab
    if (activeTab === 'Today') {
      result = result.filter(e => isToday(new Date(e.date)));
    } else if (activeTab === 'This Week') {
      result = result.filter(e => isThisWeek(new Date(e.date)));
    } else if (activeTab === 'This Month') {
      result = result.filter(e => isThisMonth(new Date(e.date)));
    } else if (activeTab === 'Custom' && customStartDate && customEndDate) {
      const start = startOfDay(new Date(customStartDate));
      const end = endOfDay(new Date(customEndDate));
      result = result.filter(e => isWithinInterval(new Date(e.date), { start, end }));
    }

    // 2. Filter by Search Query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(e => 
        e.name.toLowerCase().includes(query) || 
        e.category.toLowerCase().includes(query)
      );
    }

    // 3. Sort
    result.sort((a, b) => {
      if (sortOption === 'Date Desc') return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (sortOption === 'Date Asc') return new Date(a.date).getTime() - new Date(b.date).getTime();
      if (sortOption === 'Amount Desc') return b.amount - a.amount;
      if (sortOption === 'Amount Asc') return a.amount - b.amount;
      return 0;
    });

    return result;
  }, [expenses, activeTab, searchQuery, sortOption, customStartDate, customEndDate]);

  const totalAmount = useMemo(() => filteredAndSortedExpenses.reduce((s, e) => s + e.amount, 0), [filteredAndSortedExpenses]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.divider }]}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <ArrowLeft color={colors.textPrimary} size={24} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Transactions</Text>
          <View style={{ width: 24 }} />
        </View>

        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          
          {/* Filtering Context */}
          <View style={[styles.filterSection, { backgroundColor: colors.surface, borderBottomColor: colors.divider }]}>
            
            {/* Search and Sort Row */}
            <View style={styles.searchRow}>
              <View style={[styles.searchBox, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
                <Search color={colors.textMuted} size={18} />
                <TextInput
                  style={[styles.searchInput, { color: colors.textPrimary }]}
                  placeholder="Search name or category..."
                  placeholderTextColor={colors.textMuted}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => { setSearchQuery(''); Keyboard.dismiss(); }}>
                    <X color={colors.textMuted} size={16} />
                  </TouchableOpacity>
                )}
              </View>
              <TouchableOpacity 
                style={[styles.sortButton, { backgroundColor: showSortMenu ? colors.accentBg : colors.inputBg, borderColor: showSortMenu ? colors.accent : colors.inputBorder }]} 
                onPress={() => setShowSortMenu(!showSortMenu)}
              >
                <ArrowUpDown color={showSortMenu ? colors.accent : colors.textPrimary} size={20} />
              </TouchableOpacity>
            </View>

            {/* Sort Menu Dropdown Overlay (Absolute inside container) */}
            {showSortMenu && (
              <View style={[styles.sortMenu, { backgroundColor: colors.surface, borderColor: colors.divider }]}>
                {(['Date Desc', 'Date Asc', 'Amount Desc', 'Amount Asc'] as SortOption[]).map(opt => (
                  <TouchableOpacity 
                    key={opt}
                    style={styles.sortOptionRow} 
                    onPress={() => { setSortOption(opt); setShowSortMenu(false); }}
                  >
                    <Text style={[styles.sortOptionText, { color: sortOption === opt ? colors.accent : colors.textSecondary }]}>
                      {opt}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Tabs */}
            <View style={styles.tabsContainer}>
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={['All', 'Today', 'This Week', 'This Month', 'Custom'] as FilterTab[]}
                keyExtractor={item => item}
                contentContainerStyle={styles.tabsList}
                renderItem={({ item }) => {
                  const isActive = activeTab === item;
                  return (
                    <TouchableOpacity
                      style={[
                        styles.tabPill, 
                        { backgroundColor: isActive ? colors.accent : colors.closeBtnBg }
                      ]}
                      onPress={() => handleTabPress(item)}
                    >
                      {item === 'Custom' && customStartDate && customEndDate ? (
                        <Text style={[styles.tabText, { color: isActive ? colors.background : colors.textSecondary }]}>
                          {format(new Date(customStartDate), 'MMM d')} - {format(new Date(customEndDate), 'MMM d')}
                        </Text>
                      ) : (
                        <Text style={[styles.tabText, { color: isActive ? colors.background : colors.textSecondary }]}>
                          {item}
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                }}
              />
            </View>
          </View>

          {/* List and Totals */}
          <View style={styles.summaryBanner}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
              {filteredAndSortedExpenses.length} Transactions
            </Text>
            <Text style={[styles.summaryTotal, { color: colors.textPrimary }]}>
              PKR {totalAmount.toLocaleString()}
            </Text>
          </View>

          <FlatList
            data={filteredAndSortedExpenses}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item: expense }) => {
              const Icon = CATEGORY_ICONS[expense.category as ExpenseCategory] || MoreHorizontal;
              const d = new Date(expense.date);
              
              return (
                <TouchableOpacity onPress={() => onEditExpense(expense)}>
                  <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={[styles.transactionCard, { borderColor: colors.cardBorderSubtle }]}>
                    <View style={[styles.iconBox, { backgroundColor: colors.pillBg, borderColor: colors.cardBorder }]}>
                      <Icon color={colors.iconDefault} size={18} />
                    </View>
                    <View style={styles.txMiddle}>
                      <Text style={[styles.txName, { color: colors.textPrimary }]} numberOfLines={1}>{expense.name}</Text>
                      <View style={styles.txSubRow}>
                        <Text style={[styles.txCat, { color: colors.textSecondary }]}>{expense.category}</Text>
                        <View style={[styles.dot, { backgroundColor: colors.textMuted }]} />
                        <Text style={[styles.txTime, { color: colors.textTertiary }]}>{format(d, 'MMM d, h:mm a')}</Text>
                      </View>
                    </View>
                    <View style={styles.txRight}>
                      <Text style={[styles.txAmount, { color: colors.textPrimary }]}>
                        {Number(expense.amount).toLocaleString()}
                      </Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={[styles.emptyText, { color: colors.textTertiary }]}>No transactions found.</Text>
              </View>
            }
          />
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Date Picker Modal */}
      <Modal visible={isDatePickerVisible} transparent animationType="fade">
        <View style={[styles.dateOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.dateModalContainer, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
            <Text style={[styles.dateTitle, { color: colors.textPrimary }]}>Select Date Range</Text>
            <Calendar
              markingType="period"
              markedDates={markedDates}
              onDayPress={handleDayPress}
              theme={{
                backgroundColor: colors.surface,
                calendarBackground: colors.surface,
                textSectionTitleColor: colors.textTertiary,
                todayTextColor: colors.accent,
                dayTextColor: colors.textPrimary,
                textDisabledColor: colors.textMuted,
                monthTextColor: colors.textPrimary,
                arrowColor: colors.accent,
                textDayFontFamily: 'Inter_500Medium',
                textMonthFontFamily: 'Outfit_600SemiBold',
                textDayHeaderFontFamily: 'Inter_700Bold',
              }}
            />
            <TouchableOpacity style={[styles.dateCloseBtn, { backgroundColor: colors.closeBtnBg }]} onPress={() => setIsDatePickerVisible(false)}>
              <Text style={[styles.dateCloseBtnText, { color: colors.textPrimary }]}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: { padding: 4 },
  headerTitle: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 18,
  },
  filterSection: {
    paddingTop: 12,
    paddingBottom: 4,
    borderBottomWidth: 1,
    zIndex: 10,
  },
  searchRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
  },
  sortButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sortMenu: {
    position: 'absolute',
    top: 60,
    right: 16,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 8,
    zIndex: 100,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  sortOptionRow: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  sortOptionText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
  },
  tabsContainer: {
    marginBottom: 8,
  },
  tabsList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tabPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  tabText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
  },
  summaryBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  summaryLabel: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 14,
  },
  summaryTotal: {
    fontFamily: 'Outfit_800ExtraBold',
    fontSize: 18,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 12,
  },
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginRight: 12,
  },
  txMiddle: { flex: 1, marginRight: 12 },
  txName: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    marginBottom: 4,
  },
  txSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  txCat: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    marginHorizontal: 6,
  },
  txTime: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
  },
  txRight: { alignItems: 'flex-end' },
  txAmount: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
  },
  dateOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dateModalContainer: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    overflow: 'hidden',
  },
  dateTitle: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 18,
    marginBottom: 16,
    textAlign: 'center',
  },
  dateCloseBtn: {
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  dateCloseBtnText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
  },
});

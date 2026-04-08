import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, LayoutAnimation, Platform, UIManager, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLedgr } from '../lib/LedgrContext';
import { useThemeColors } from '../lib/ThemeContext';
import { ExpenseCategory } from '../lib/store';
import { 
  Coffee, Car, Home as HomeIcon, ShoppingBag, Heart, MoreHorizontal, 
  ChevronDown, ChevronUp, Calendar, ShoppingBasket, PieChart, 
  ChevronLeft, ChevronRight 
} from 'lucide-react-native';
import { format } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const CATEGORY_ICONS: Record<ExpenseCategory, any> = {
  Food: Coffee,
  Transport: Car,
  Bills: HomeIcon,
  Shopping: ShoppingBag,
  Grocery: ShoppingBasket,
  Health: Heart,
  Other: MoreHorizontal,
};

const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  Food: '#F59E0B',
  Transport: '#3B82F6',
  Bills: '#10B981',
  Shopping: '#EC4899',
  Grocery: '#2DD4BF',
  Health: '#EF4444',
  Other: '#6B7280',
};

export default function SummaryScreen() {
  const { expenses, isLoaded, showMonthSummary, budgetHistory } = useLedgr();
  const colors = useThemeColors();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [expandedCategory, setExpandedCategory] = useState<ExpenseCategory | null>(null);

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });
  }, [expenses, selectedMonth, selectedYear]);

  const categoryData = useMemo(() => {
    const counts: Record<string, { total: number, items: typeof expenses }> = {};
    filteredExpenses.forEach(e => {
      if (!counts[e.category]) counts[e.category] = { total: 0, items: [] };
      counts[e.category].total += e.amount;
      counts[e.category].items.push(e);
    });
    return Object.entries(counts).sort((a, b) => b[1].total - a[1].total);
  }, [filteredExpenses]);

  const totalMonthly = useMemo(() =>
    filteredExpenses.reduce((sum, e) => sum + e.amount, 0),
    [filteredExpenses]);

  const toggleCategory = (cat: ExpenseCategory) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedCategory(expandedCategory === cat ? null : cat);
  };

  const changeMonth = (delta: number) => {
    let newMonth = selectedMonth + delta;
    let newYear = selectedYear;
    if (newMonth < 0) { newMonth = 11; newYear--; }
    else if (newMonth > 11) { newMonth = 0; newYear++; }
    setSelectedMonth(newMonth);
    setSelectedYear(newYear);
    setExpandedCategory(null);
  };

  if (!isLoaded) return <View style={[styles.container, { backgroundColor: colors.background }]} />;

  const monthStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;
  const currentMonthStr = new Date().toISOString().substring(0, 7);
  // Insights should be accessible if there are any recorded expenses or if it's the current active month
  const isInsightsAvailable = filteredExpenses.length > 0 || monthStr === currentMonthStr;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.header, { backgroundColor: colors.background }]}>
          <View style={styles.headerTop}>
            <View style={styles.headerTopLeft}>
              <Image source={require('../../assets/logo.png')} style={styles.logoSmall} resizeMode="contain" />
              <Text style={[styles.brandNameSmall, { color: colors.textTertiary }]}>LEDGR</Text>
            </View>
            {isInsightsAvailable && (
              <TouchableOpacity 
                style={[styles.headerActionBtn, { backgroundColor: colors.surface, borderColor: colors.cardBorderSubtle }]}
                onPress={() => showMonthSummary(monthStr)}
              >
                <PieChart size={18} color={colors.accent} />
              </TouchableOpacity>
            )}
          </View>
          
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Summary</Text>
            
            <View style={[styles.monthPicker, { borderColor: colors.cardBorderSubtle, backgroundColor: colors.surface }]}>
              <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.pickerBtnSmall}>
                <ChevronLeft size={16} color={colors.accent} />
              </TouchableOpacity>
              <View style={styles.monthLabelSmall}>
                <Text style={[styles.monthTextSmall, { color: colors.textPrimary }]}>{format(new Date(selectedYear, selectedMonth), 'MMM yy')}</Text>
              </View>
              <TouchableOpacity onPress={() => changeMonth(1)} style={styles.pickerBtnSmall}>
                <ChevronRight size={16} color={colors.accent} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.totalCardContainer}>
          <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={[styles.totalCard, { borderColor: colors.cardBorder }]}>
            <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>TOTAL SPENT</Text>
            <Text style={[styles.totalValue, { color: colors.textPrimary }]}>PKR {totalMonthly.toLocaleString()}</Text>
            <View style={[styles.progressBarBg, { backgroundColor: colors.divider }]}>
              <View style={[styles.progressBarFill, { width: '100%', backgroundColor: colors.accent }]} />
            </View>
          </LinearGradient>
        </View>
        {categoryData.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>No expenses for this month</Text>
          </View>
        ) : (
          categoryData.map(([cat, data]) => {
            const Icon = CATEGORY_ICONS[cat as ExpenseCategory] || MoreHorizontal;
            const catColor = CATEGORY_COLORS[cat as ExpenseCategory] || '#6B7280';
            const isExpanded = expandedCategory === cat;
            const percentage = totalMonthly > 0 ? (data.total / totalMonthly) * 100 : 0;

            return (
              <View key={cat} style={[styles.categoryContainer, { backgroundColor: colors.surface, borderColor: colors.cardBorderSubtle }]}>
                <TouchableOpacity
                  style={styles.categoryHeader}
                  onPress={() => toggleCategory(cat as ExpenseCategory)}
                  activeOpacity={0.7}
                >
                  <View style={styles.catLeft}>
                    <View style={[styles.catIconBox, { backgroundColor: `${catColor}20` }]}>
                      <Icon color={catColor} size={20} />
                    </View>
                    <View>
                      <Text style={[styles.catName, { color: colors.textPrimary }]}>{cat}</Text>
                      <Text style={[styles.catPercentage, { color: colors.textTertiary }]}>{percentage.toFixed(1)}% of total</Text>
                    </View>
                  </View>
                  <View style={styles.catRight}>
                    <Text style={[styles.catTotal, { color: colors.textPrimary }]}>PKR {data.total.toLocaleString()}</Text>
                    {isExpanded ? <ChevronUp size={20} color={colors.textTertiary} /> : <ChevronDown size={20} color={colors.textTertiary} />}
                  </View>
                </TouchableOpacity>

                {isExpanded && (
                  <View style={[styles.detailsList, { backgroundColor: colors.innerCardBg }]}>
                    {data.items.map((item, idx) => (
                      <View key={item.id} style={[styles.detailItem, { borderBottomColor: colors.divider }, idx === data.items.length - 1 && { borderBottomWidth: 0 }]}>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.detailName, { color: colors.textSecondary }]}>{item.name}</Text>
                          <Text style={[styles.detailDate, { color: colors.textTertiary }]}>{new Date(item.date).toLocaleDateString()}</Text>
                        </View>
                        <Text style={[styles.detailAmount, { color: colors.textPrimary }]}>PKR {item.amount.toLocaleString()}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { marginBottom: 20 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  headerTopLeft: { flexDirection: 'row', alignItems: 'center' },
  logoSmall: { width: 18, height: 18, marginRight: 10 },
  brandNameSmall: { fontFamily: 'Outfit_800ExtraBold', fontSize: 10, letterSpacing: 2 },
  headerActionBtn: { width: 36, height: 36, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  title: { fontFamily: 'Outfit_800ExtraBold', fontSize: 32 },
  
  monthPicker: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, padding: 2 },
  pickerBtnSmall: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  monthLabelSmall: { paddingHorizontal: 4 },
  monthTextSmall: { fontFamily: 'Outfit_600SemiBold', fontSize: 13, textTransform: 'uppercase' },

  monthLabel: { paddingHorizontal: 10 },
  monthText: { fontFamily: 'Inter_500Medium', fontSize: 16 },

  totalCardContainer: { paddingHorizontal: 24, marginBottom: 24 },
  totalCard: { padding: 24, borderRadius: 24, borderWidth: 1 },
  totalLabel: { fontSize: 12, fontFamily: 'Inter_700Bold', letterSpacing: 1, marginBottom: 8 },
  totalValue: { fontSize: 32, fontFamily: 'Outfit_600SemiBold' },
  progressBarBg: { height: 6, borderRadius: 3, marginTop: 16, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 3 },

  scrollContent: { paddingHorizontal: 20, paddingBottom: 110, paddingTop: 8 },
  categoryContainer: { borderRadius: 20, marginBottom: 12, overflow: 'hidden', borderWidth: 1 },
  categoryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  catLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  catIconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  catName: { fontFamily: 'Outfit_600SemiBold', fontSize: 18 },
  catPercentage: { fontFamily: 'Inter_500Medium', fontSize: 12 },
  catRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  catTotal: { fontFamily: 'Outfit_400Regular', fontSize: 18 },

  detailsList: { paddingHorizontal: 16, paddingBottom: 8 },
  detailItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
  detailName: { fontFamily: 'Inter_500Medium', fontSize: 14 },
  detailDate: { fontFamily: 'Inter_500Medium', fontSize: 11, marginTop: 2 },
  detailAmount: { fontFamily: 'Outfit_400Regular', fontSize: 14 },

  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 40 },
  emptyText: { fontFamily: 'Inter_500Medium', fontSize: 16 }
});
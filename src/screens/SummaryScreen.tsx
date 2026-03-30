import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, LayoutAnimation, Platform, UIManager, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLedgr } from '../lib/LedgrContext';
import { ExpenseCategory } from '../lib/store';
import { Coffee, Car, Home as HomeIcon, ShoppingBag, Heart, MoreHorizontal, ChevronDown, ChevronUp, Calendar, ShoppingBasket } from 'lucide-react-native';
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
  const { expenses, budget, isLoaded } = useLedgr();
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

  const insights = useMemo(() => {
    if (filteredExpenses.length === 0) return [];

    const total = totalMonthly;
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    
    // 1. Top Category
    const topCat = categoryData[0];
    const topCatInsight = {
      id: 'top-cat',
      title: 'Top Category',
      value: topCat ? topCat[0] : 'None',
      sub: topCat ? `${((topCat[1].total / total) * 100).toFixed(0)}% of spend` : 'No data',
      score: 100,
      eligible: !!topCat,
      icon: topCat ? CATEGORY_ICONS[topCat[0] as ExpenseCategory] : MoreHorizontal,
      color: topCat ? CATEGORY_COLORS[topCat[0] as ExpenseCategory] : '#6B7280'
    };

    // 2. Biggest Expense
    const sortedByAmt = [...filteredExpenses].sort((a,b) => b.amount - a.amount);
    const biggest = sortedByAmt[0];
    const biggestInsight = {
      id: 'biggest-expense',
      title: 'Biggest Hit',
      value: biggest ? `PKR ${biggest.amount.toLocaleString()}` : '0',
      sub: biggest ? (biggest.name.length > 15 ? biggest.name.substring(0, 15) + '...' : biggest.name) : 'No expenses',
      score: 95,
      eligible: !!biggest,
      icon: ShoppingBasket,
      color: '#EF4444'
    };

    // 3. No-Spend Days
    const spentDays = new Set(filteredExpenses.map(e => new Date(e.date).getDate()));
    const noSpendCount = daysInMonth - spentDays.size;
    const noSpendInsight = {
      id: 'no-spend',
      title: 'No-Spend Days',
      value: `${noSpendCount} Days`,
      sub: noSpendCount >= 5 ? '🧘 Great restraint!' : 'Keep trying!',
      score: (noSpendCount / daysInMonth) * 100,
      eligible: noSpendCount >= 5,
      icon: Calendar,
      color: '#10B981'
    };

    // 4. Spending Velocity
    const firstHalfSpend = filteredExpenses
      .filter(e => new Date(e.date).getDate() <= 15)
      .reduce((sum, e) => sum + e.amount, 0);
    const velocity = total > 0 ? (firstHalfSpend / total) * 100 : 0;
    const velocityInsight = {
      id: 'velocity',
      title: 'Spend Velocity',
      value: `${velocity.toFixed(0)}%`,
      sub: velocity > 65 ? 'Fast start!' : velocity < 35 ? 'Slow burner' : 'Steady pace',
      score: Math.abs(50 - velocity) * 2,
      eligible: total > 0 && (velocity > 65 || velocity < 35),
      icon: Car,
      color: '#3B82F6'
    };

    // 5. Category Overshoot
    let biggestOvershoot = { cat: '', pct: 0 };
    Object.entries(budget.categories).forEach(([cat, limit]) => {
      const spent = (categoryData.find(c => c[0] === cat)?.[1] as any)?.total || 0;
      if (limit > 0 && spent > limit) {
        const overshoot = ((spent - limit) / limit) * 100;
        if (overshoot > biggestOvershoot.pct) {
          biggestOvershoot = { cat, pct: overshoot };
        }
      }
    });
    const overshootInsight = {
      id: 'overshoot',
      title: 'Overshoot',
      value: biggestOvershoot.cat || 'None',
      sub: biggestOvershoot.cat ? `${biggestOvershoot.pct.toFixed(0)}% over budget` : 'Safe zone',
      score: biggestOvershoot.pct,
      eligible: biggestOvershoot.pct > 50,
      icon: Heart,
      color: '#EF4444'
    };

    // 6. Single Day Damage
    const dayTotals: Record<number, number> = {};
    filteredExpenses.forEach(e => {
      const d = new Date(e.date).getDate();
      dayTotals[d] = (dayTotals[d] || 0) + e.amount;
    });
    const maxDayEntry = Object.entries(dayTotals).sort((a,b) => b[1] - a[1])[0];
    const maxDayPct = maxDayEntry && total > 0 ? (maxDayEntry[1] / total) * 100 : 0;
    const damageInsight = {
      id: 'damage',
      title: 'Day Damage',
      value: `${maxDayPct.toFixed(0)}%`,
      sub: `Spent on Day ${maxDayEntry?.[0]}`,
      score: maxDayPct * 4,
      eligible: maxDayPct > 20,
      icon: ShoppingBag,
      color: '#EC4899'
    };

    // 7. Most Frequent
    const frequencies: Record<string, number> = {};
    filteredExpenses.forEach(e => {
      const name = e.name.trim().toLowerCase();
      frequencies[name] = (frequencies[name] || 0) + 1;
    });
    const mostFreq = Object.entries(frequencies).sort((a,b) => b[1] - a[1])[0];
    const freqInsight = {
      id: 'frequency',
      title: 'Habit Alert',
      value: mostFreq ? `${mostFreq[1]}x` : '0',
      sub: mostFreq ? (mostFreq[0].length > 15 ? mostFreq[0].substring(0, 15) + '...' : mostFreq[0]) : 'None',
      score: (mostFreq?.[1] || 0) * 4,
      eligible: (mostFreq?.[1] || 0) >= 5,
      icon: Coffee,
      color: '#2DD4BF'
    };

    const allInsights = [topCatInsight, biggestInsight, noSpendInsight, velocityInsight, overshootInsight, damageInsight, freqInsight];
    
    // Selection Logic
    // Step 1: Tier 1 (Fixed)
    const selected = [topCatInsight, biggestInsight];
    
    // Step 2: Tier 2 (Eligible)
    const pool = allInsights.filter(i => !selected.some(s => s.id === i.id) && i.eligible)
      .sort((a,b) => b.score - a.score);
    
    selected.push(...pool);
    
    // Step 3: Tier 3 (Fillers) if < 4
    if (selected.length < 4) {
       const priorityFillers = ['no-spend', 'frequency'];
       for (const id of priorityFillers) {
          const found = allInsights.find(i => i.id === id && !selected.some(s => s.id === i.id));
          if (found && selected.length < 4) selected.push(found);
       }
       // Ultimate fallback
       if (selected.length < 4) {
          const rest = allInsights.filter(i => !selected.some(s => s.id === i.id))
            .sort((a,b) => b.score - a.score);
          selected.push(...rest.slice(0, 4 - selected.length));
       }
    }

    return selected.slice(0, 4);
  }, [filteredExpenses, budget, categoryData, totalMonthly, selectedMonth, selectedYear]);

  const toggleCategory = (cat: ExpenseCategory) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedCategory(expandedCategory === cat ? null : cat);
  };

  const changeMonth = (delta: number) => {
    let newMonth = selectedMonth + delta;
    let newYear = selectedYear;
    if (newMonth < 0) {
      newMonth = 11;
      newYear--;
    } else if (newMonth > 11) {
      newMonth = 0;
      newYear++;
    }
    setSelectedMonth(newMonth);
    setSelectedYear(newYear);
    setExpandedCategory(null);
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
        <Text style={styles.headerTitle}>Monthly Insights</Text>
        <View style={styles.monthPicker}>
          <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.pickerBtn}>
            <Text style={styles.pickerBtnText}>{"<"}</Text>
          </TouchableOpacity>
          <View style={styles.monthDisplay}>
            <Calendar size={16} color="#00F0FF" />
            <Text style={styles.monthText}>{monthNames[selectedMonth]} {selectedYear}</Text>
          </View>
          <TouchableOpacity onPress={() => changeMonth(1)} style={styles.pickerBtn}>
            <Text style={styles.pickerBtnText}>{">"}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.totalCardContainer}>
        <LinearGradient colors={['#1A1A1A', '#0A0A0A']} style={styles.totalCard}>
          <Text style={styles.totalLabel}>TOTAL SPENT</Text>
          <Text style={styles.totalValue}>PKR {totalMonthly.toLocaleString()}</Text>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: '100%' }]} />
          </View>
        </LinearGradient>
      </View>

      <View style={styles.insightsGrid}>
        {insights.map((insight) => (
          <View key={insight.id} style={styles.insightCard}>
            <View style={styles.insightHeader}>
              <View style={[styles.insightIconBox, { backgroundColor: `${insight.color}15` }]}>
                <insight.icon color={insight.color} size={16} />
              </View>
              <Text style={styles.insightTitle}>{insight.title}</Text>
            </View>
            <Text style={styles.insightValue} numberOfLines={1}>{insight.value}</Text>
            <Text style={styles.insightSub} numberOfLines={1}>{insight.sub}</Text>
          </View>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {categoryData.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No expenses for this month</Text>
          </View>
        ) : (
          categoryData.map(([cat, data]) => {
            const Icon = CATEGORY_ICONS[cat as ExpenseCategory] || MoreHorizontal;
            const catColor = CATEGORY_COLORS[cat as ExpenseCategory] || '#6B7280';
            const isExpanded = expandedCategory === cat;
            const percentage = totalMonthly > 0 ? (data.total / totalMonthly) * 100 : 0;
            
            return (
              <View key={cat} style={styles.categoryContainer}>
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
                      <Text style={styles.catName}>{cat}</Text>
                      <Text style={styles.catPercentage}>{percentage.toFixed(1)}% of total</Text>
                    </View>
                  </View>
                  <View style={styles.catRight}>
                    <Text style={styles.catTotal}>PKR {data.total.toLocaleString()}</Text>
                    {isExpanded ? <ChevronUp size={20} color="#606060" /> : <ChevronDown size={20} color="#606060" />}
                  </View>
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.detailsList}>
                    {data.items.map((item, idx) => (
                      <View key={item.id} style={[styles.detailItem, idx === data.items.length - 1 && { borderBottomWidth: 0 }]}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.detailName}>{item.name}</Text>
                          <Text style={styles.detailDate}>{new Date(item.date).toLocaleDateString()}</Text>
                        </View>
                        <Text style={styles.detailAmount}>PKR {item.amount.toLocaleString()}</Text>
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
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  header: { padding: 24, paddingBottom: 16, alignItems: 'center' },
  logo: { width: 36, height: 36, marginBottom: 8 },
  brandName: { fontFamily: 'Outfit_800ExtraBold', color: '#FFFFFF', fontSize: 12, letterSpacing: 4, marginBottom: 12 },
  headerTitle: { fontFamily: 'Outfit_800ExtraBold', fontSize: 28, color: '#FFFFFF', marginBottom: 16 },
  monthPicker: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#141414', borderRadius: 16, padding: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  pickerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  pickerBtnText: { color: '#00F0FF', fontSize: 20, fontFamily: 'Outfit_600SemiBold' },
  monthDisplay: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  monthText: { color: '#FFFFFF', fontFamily: 'Inter_500Medium', fontSize: 16 },
  
  totalCardContainer: { paddingHorizontal: 24, marginBottom: 24 },
  totalCard: { padding: 24, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  totalLabel: { color: '#A0A0A0', fontSize: 12, fontFamily: 'Inter_700Bold', letterSpacing: 1, marginBottom: 8 },
  totalValue: { color: '#FFFFFF', fontSize: 32, fontFamily: 'Outfit_600SemiBold' },
  progressBarBg: { height: 6, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 3, marginTop: 16, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#00F0FF', borderRadius: 3 },

  scrollContent: { paddingHorizontal: 24, paddingBottom: 100 },
  categoryContainer: { backgroundColor: '#141414', borderRadius: 20, marginBottom: 12, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  categoryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  catLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  catIconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  catName: { color: '#FFFFFF', fontFamily: 'Outfit_600SemiBold', fontSize: 18 },
  catPercentage: { color: '#606060', fontFamily: 'Inter_500Medium', fontSize: 12 },
  catRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  catTotal: { color: '#FFFFFF', fontFamily: 'Outfit_400Regular', fontSize: 18 },

  detailsList: { backgroundColor: 'rgba(0,0,0,0.2)', paddingHorizontal: 16, paddingBottom: 8 },
  detailItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.03)' },
  detailName: { color: '#E0E0E0', fontFamily: 'Inter_500Medium', fontSize: 14 },
  detailDate: { color: '#606060', fontFamily: 'Inter_500Medium', fontSize: 11, marginTop: 2 },
  detailAmount: { color: '#FFFFFF', fontFamily: 'Outfit_400Regular', fontSize: 14 },

  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 40 },
  emptyText: { color: '#606060', fontFamily: 'Inter_500Medium', fontSize: 16 },

  insightsGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    paddingHorizontal: 16, 
    marginHorizontal: 8,
    marginBottom: 24,
    gap: 8 
  },
  insightCard: { 
    width: '48%', 
    backgroundColor: '#141414', 
    borderRadius: 20, 
    padding: 16, 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center'
  },
  insightHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  insightIconBox: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  insightTitle: { color: '#606060', fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 0.5 },
  insightValue: { color: '#FFFFFF', fontSize: 18, fontFamily: 'Outfit_600SemiBold' },
  insightSub: { color: '#A0A0A0', fontSize: 10, fontFamily: 'Inter_500Medium', marginTop: 4 }
});

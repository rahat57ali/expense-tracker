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
  const { expenses, isLoaded } = useLedgr();
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
        <Text style={styles.headerTitle}>Monthly Summary</Text>
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
  emptyText: { color: '#606060', fontFamily: 'Inter_500Medium', fontSize: 16 }
});

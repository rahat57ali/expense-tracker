import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useLedgr } from '../lib/LedgrContext';
import { ExpenseCategory, Expense } from '../lib/store';
import { Wallet, Target, TrendingUp, Coffee, Car, Home as HomeIcon, ShoppingBag, Heart, MoreHorizontal, AlertCircle, ShoppingBasket, CheckCircle2, Minus, Info, TrendingDown } from 'lucide-react-native';
import EditExpenseModal from '../components/EditExpenseModal';
import DailyDetailModal from '../components/DailyDetailModal';

const CATEGORY_ICONS: Record<ExpenseCategory, any> = {
  Food: Coffee,
  Transport: Car,
  Bills: HomeIcon,
  Shopping: ShoppingBag,
  Grocery: ShoppingBasket,
  Health: Heart,
  Other: MoreHorizontal,
};

export default function DashboardScreen() {
  const { expenses, budget, isLoaded, allCategories } = useLedgr();
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isDailyDetailVisible, setIsDailyDetailVisible] = useState(false);

  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const remainingBudget = budget.total - totalSpent;
  
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysLeft = daysInMonth - now.getDate() + 1;
  const dailyAllowance = Math.max(0, remainingBudget / daysLeft);
  
  const dailyTarget = budget.total / daysInMonth;
  const ratio = dailyAllowance / dailyTarget;

  const getDailyStatus = () => {
    if (ratio >= 1.5) return { 
      label: 'COMFORTABLE', 
      color: '#10B981', 
      bgColor: 'rgba(16, 185, 129, 0.1)',
      description: "You're spending significantly less than your planned daily average. You have breathing room for miscellaneous costs.",
      threshold: ">= 1.5x target",
      icon: CheckCircle2
    };
    if (ratio >= 1.0) return { 
      label: 'ON TRACK', 
      color: '#F59E0B', 
      bgColor: 'rgba(245, 158, 11, 0.1)',
      description: "Your daily spending is perfectly aligned with your monthly budget goal. Keep maintaining this pace.",
      threshold: "1.0x to 1.5x target",
      icon: TrendingUp
    };
    if (ratio >= 0.6) return { 
      label: 'TIGHT', 
      color: '#F97316', 
      bgColor: 'rgba(249, 115, 22, 0.1)',
      description: "You're slightly below your daily target. It's time to prioritize essential spending only to finish the month on budget.",
      threshold: "0.6x to 1.0x target",
      icon: Minus
    };
    if (ratio >= 0.3) return { 
      label: 'CRITICAL', 
      color: '#EF4444', 
      bgColor: 'rgba(239, 68, 68, 0.1)',
      description: "Your available daily budget is very low. High alert! Immediate reduction in non-essential spending is required.",
      threshold: "0.3x to 0.6x target",
      icon: AlertCircle
    };
    return { 
      label: 'OVERSPENT', 
      color: '#7F1D1D', 
      bgColor: 'rgba(127, 29, 29, 0.2)',
      description: "You have exceeded your sustainable daily limit. Every rupee spent now contributes to a monthly deficit.",
      threshold: "< 0.3x target",
      icon: TrendingDown
    };
  };

  const dailyStatus = getDailyStatus();
  
  const categoryTotals: Record<string, number> = {};
  expenses.forEach(e => {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
  });
  

  const biggestCategory = Object.entries(categoryTotals).sort((a,b) => b[1] - a[1])[0] || ['None', 0];
  const isOverspent = remainingBudget < 0;

  if (!isLoaded) return <View style={styles.container} />;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.header}>
          <Image 
            source={require('../../assets/logo.png')} 
            style={styles.logo} 
            resizeMode="contain" 
          />
          <Text style={styles.brandName}>LEDGR</Text>
          <Text style={styles.title}>Overview</Text>
          <Text style={styles.subtitle}>Your real-time financial health</Text>
        </View>

        <View style={styles.kpiGrid}>
          {/* TOTAL BUDGET */}
          <View style={styles.kpiCardSmall}>
            <View style={styles.kpiIconBox}><Target color="#A0A0A0" size={16} opacity={0.5}/></View>
            <Text style={styles.kpiLabel}>BUDGET</Text>
            <View style={styles.kpiValueStack}>
              <Text style={styles.kpiCurrencySmall}>PKR</Text>
              <Text style={styles.kpiValueSmall} numberOfLines={1} adjustsFontSizeToFit>{budget.total.toLocaleString()}</Text>
            </View>
          </View>

          {/* TOTAL SPENT */}
          <View style={styles.kpiCardSmall}>
            <View style={styles.kpiIconBox}><Wallet color="#00F0FF" size={16} opacity={0.5}/></View>
            <Text style={styles.kpiLabel}>SPENT</Text>
            <View style={styles.kpiValueStack}>
              <Text style={styles.kpiCurrencySmall}>PKR</Text>
              <Text style={styles.kpiValueSmall} numberOfLines={1} adjustsFontSizeToFit>{totalSpent.toLocaleString()}</Text>
            </View>
          </View>

          {/* REMAINING */}
          <View style={styles.kpiCardSmall}>
            <View style={styles.kpiIconBox}><TrendingUp color="#8A2BE2" size={16} opacity={0.5}/></View>
            <Text style={styles.kpiLabel}>REMAINING</Text>
            <View style={styles.kpiValueStack}>
              <Text style={styles.kpiCurrencySmall}>PKR</Text>
              <Text style={styles.kpiValueSmall} numberOfLines={1} adjustsFontSizeToFit>{remainingBudget.toLocaleString()}</Text>
            </View>
          </View>
        </View>

        <View style={styles.kpiGrid}>
          {/* Daily Allowance KPI */}
          <View style={[styles.kpiCard, { width: '100%' }]}>
            <View style={styles.kpiRowSplit}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <Text style={styles.kpiLabel} numberOfLines={1} adjustsFontSizeToFit>DAILY ALLOWANCE ({daysLeft} DAYS LEFT)</Text>
                <View style={styles.kpiValueRow}>
                  <Text style={styles.kpiCurrency}>PKR</Text>
                  <Text style={styles.kpiValueLarge} numberOfLines={1} adjustsFontSizeToFit>{Math.floor(dailyAllowance).toLocaleString()}</Text>
                </View>
              </View>
              <TouchableOpacity 
                style={[styles.badge, { backgroundColor: dailyStatus.bgColor, borderColor: dailyStatus.color, flexShrink: 0 }]}
                onPress={() => setIsDailyDetailVisible(true)}
              >
                <Text style={[styles.badgeText, { color: dailyStatus.color }]} numberOfLines={1} adjustsFontSizeToFit>
                  {dailyStatus.label}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Category Remaining</Text>
          <Text style={styles.sectionSubtitle}>Budgets per category</Text>
        </View>

        <View style={styles.catBudgetGrid}>
          {allCategories.map(cat => {
            const Icon = CATEGORY_ICONS[cat as ExpenseCategory] || MoreHorizontal;
            const spent = categoryTotals[cat] || 0;
            const limit = budget.categories[cat] || 0;
            const remaining = limit - spent;
            const isOver = remaining < 0;
            const progress = Math.min(1, spent / (limit || 1));

            return (
              <View key={cat} style={styles.catBudgetCard}>
                <View style={styles.catCardTop}>
                  <View style={[styles.catIconBox, isOver && styles.catIconBoxDanger]}>
                    <Icon color={isOver ? "#EF4444" : "#FFFFFF"} size={16} />
                  </View>
                  <Text style={styles.catCardName}>{cat}</Text>
                </View>
                
                <Text style={[styles.catRemaining, isOver && styles.textDanger]}>
                  PKR {Math.abs(remaining).toLocaleString()}
                </Text>
                <Text style={styles.catRemainingLabel}>{isOver ? 'OVER LIMIT' : 'REMAINING'}</Text>
                
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${progress * 100}%` }, isOver && styles.progressBarFillDanger]} />
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
        </View>

        <View style={styles.expensesList}>
          {expenses.slice(0, 10).map((expense) => {
            const Icon = CATEGORY_ICONS[expense.category as ExpenseCategory] || MoreHorizontal;
            return (
              <TouchableOpacity 
                key={expense.id} 
                onPress={() => {
                  setEditingExpense(expense);
                  setIsEditModalVisible(true);
                }}
              >
                <LinearGradient colors={['rgba(25,25,25,0.9)', 'rgba(15,15,15,1)']} style={styles.listCard}>
                  <View style={styles.listCardRow}>
                    <View style={styles.airlineGroup}>
                      <View style={styles.iconBox}>
                        <Icon color="#FFFFFF" size={18} />
                      </View>
                      <View style={{ flex: 1, marginRight: 12 }}>
                        <Text style={styles.expenseName} numberOfLines={2}>{expense.name}</Text>
                        <Text style={styles.expenseCat}>{expense.category}</Text>
                      </View>
                    </View>
                    <View style={styles.listRight}>
                      <Text 
                        style={styles.listAmount} 
                        numberOfLines={1} 
                        adjustsFontSizeToFit
                      >
                        PKR {expense.amount.toLocaleString()}
                      </Text>
                      <Text style={styles.listDate}>{new Date(expense.date).toLocaleDateString()}</Text>
                    </View>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            );
          })}
        </View>

      </ScrollView>

      <EditExpenseModal 
        visible={isEditModalVisible}
        onClose={() => setIsEditModalVisible(false)}
        expense={editingExpense}
      />

      <DailyDetailModal
        visible={isDailyDetailVisible}
        onClose={() => setIsDailyDetailVisible(false)}
        data={{
          dailyTarget,
          dailyRemaining: dailyAllowance,
          ratio,
          daysLeft,
          status: dailyStatus
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  scrollContent: { padding: 24, paddingBottom: 120 },
  header: { alignItems: 'center', marginBottom: 32, marginTop: 10 },
  logo: { width: 36, height: 36, marginBottom: 8 },
  brandName: { fontFamily: 'Outfit_800ExtraBold', color: '#FFFFFF', fontSize: 12, letterSpacing: 4, marginBottom: 12 },
  title: { fontFamily: 'Outfit_800ExtraBold', fontSize: 36, color: '#FFFFFF' },
  subtitle: { fontFamily: 'Inter_500Medium', fontSize: 14, color: '#A0A0A0', marginTop: 4 },
  
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  kpiCard: { minHeight: 110, flex: 1, minWidth: '45%', backgroundColor: 'rgba(20,20,20,0.95)', padding: 20, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', position: 'relative', overflow: 'hidden' },
  kpiCardSmall: { minHeight: 100, flex: 1, minWidth: '30%', backgroundColor: 'rgba(20,20,20,0.95)', padding: 14, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', position: 'relative', overflow: 'hidden' },
  kpiIconBox: { position: 'absolute', top: 14, right: 14 },
  kpiLabel: { color: '#A0A0A0', fontSize: 9, fontFamily: 'Inter_700Bold', letterSpacing: 1, marginBottom: 8 },
  kpiValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 4 },
  kpiValueStack: { marginTop: 4 },
  kpiCurrency: { color: '#606060', fontSize: 10, fontFamily: 'Inter_500Medium' },
  kpiCurrencySmall: { color: '#606060', fontSize: 8, fontFamily: 'Inter_700Bold', marginBottom: 2 },
  kpiValue: { color: '#FFFFFF', fontSize: 28, fontFamily: 'Outfit_300Light' },
  kpiValueSmall: { color: '#FFFFFF', fontSize: 20, fontFamily: 'Outfit_300Light', flex: 1 },
  kpiRowSplit: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  kpiValueLarge: { color: '#FFFFFF', fontSize: 36, fontFamily: 'Outfit_300Light' },
  
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1 },
  badgeText: { fontFamily: 'Outfit_800ExtraBold', fontSize: 10, letterSpacing: 1 },


  sectionHeader: { marginBottom: 16, marginTop: 8 },
  sectionTitle: { fontFamily: 'Outfit_600SemiBold', fontSize: 20, color: '#FFFFFF' },
  sectionSubtitle: { fontFamily: 'Inter_500Medium', fontSize: 12, color: '#606060', marginTop: 2 },

  catBudgetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 40 },
  catBudgetCard: { width: '48%', backgroundColor: '#141414', padding: 16, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  catCardTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  catIconBox: { width: 28, height: 28, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' },
  catIconBoxDanger: { backgroundColor: 'rgba(239, 68, 68, 0.1)' },
  catCardName: { color: '#A0A0A0', fontFamily: 'Inter_700Bold', fontSize: 10, textTransform: 'uppercase' },
  catRemaining: { color: '#FFFFFF', fontFamily: 'Outfit_600SemiBold', fontSize: 18 },
  catRemainingLabel: { color: '#606060', fontFamily: 'Inter_700Bold', fontSize: 9, marginTop: 2, letterSpacing: 0.5 },
  textDanger: { color: '#EF4444' },
  
  progressBarBg: { height: 4, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 2, marginTop: 12, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#00F0FF', borderRadius: 2 },
  progressBarFillDanger: { backgroundColor: '#EF4444' },

  expensesList: { gap: 12 },
  listCard: { borderRadius: 20, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  listCardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  airlineGroup: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  iconBox: { width: 36, height: 36, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  expenseName: { color: '#FFFFFF', fontFamily: 'Outfit_600SemiBold', fontSize: 16 },
  expenseCat: { color: '#A0A0A0', fontFamily: 'Inter_500Medium', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 },
  listRight: { alignItems: 'flex-end', minWidth: 100, flexShrink: 0 },
  listAmount: { color: '#FFFFFF', fontFamily: 'Outfit_400Regular', fontSize: 18, textAlign: 'right' },
  listDate: { color: '#A0A0A0', fontFamily: 'Inter_500Medium', fontSize: 10, marginTop: 2 },
});

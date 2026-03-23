import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useLedgr } from '../lib/LedgrContext';
import { ExpenseCategory, Expense } from '../lib/store';
import { Wallet, Target, TrendingUp, Coffee, Car, Home as HomeIcon, ShoppingBag, Heart, MoreHorizontal, AlertCircle, ShoppingBasket } from 'lucide-react-native';
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

export default function DashboardScreen() {
  const { expenses, budget, isLoaded } = useLedgr();
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);

  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const remainingBudget = budget.total - totalSpent;
  
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysLeft = daysInMonth - now.getDate() + 1;
  const dailyAllowance = Math.max(0, remainingBudget / daysLeft);
  
  const categoryTotals: Record<string, number> = {};
  expenses.forEach(e => {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
  });
  
  const categories = Object.keys(CATEGORY_ICONS) as ExpenseCategory[];
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
          <Text style={styles.title}>Dashboard</Text>
          <Text style={styles.subtitle}>Your real-time financial health</Text>
        </View>

        <View style={styles.kpiGrid}>
          {/* Main KPI: Spent */}
          <View style={styles.kpiCard}>
            <View style={styles.kpiIconBox}><Wallet color="#00F0FF" size={20} opacity={0.5}/></View>
            <Text style={styles.kpiLabel}>TOTAL SPENT</Text>
            <View style={styles.kpiValueRow}>
              <Text style={styles.kpiCurrency}>PKR</Text>
              <Text style={styles.kpiValue}>{totalSpent.toLocaleString()}</Text>
            </View>
          </View>

          {/* Main KPI: Remaining */}
          <View style={styles.kpiCard}>
            <View style={styles.kpiIconBox}><Target color="#8A2BE2" size={20} opacity={0.5}/></View>
            <Text style={styles.kpiLabel}>REMAINING</Text>
            <View style={styles.kpiValueRow}>
              <Text style={styles.kpiCurrency}>PKR</Text>
              <Text style={styles.kpiValue}>{remainingBudget.toLocaleString()}</Text>
            </View>
          </View>

          {/* Daily Allowance KPI */}
          <View style={[styles.kpiCard, { width: '100%' }]}>
            <View style={styles.kpiRowSplit}>
              <View>
                <Text style={styles.kpiLabel}>DAILY ALLOWANCE ({daysLeft} DAYS LEFT)</Text>
                <View style={styles.kpiValueRow}>
                  <Text style={styles.kpiCurrency}>PKR</Text>
                  <Text style={styles.kpiValueLarge}>{Math.floor(dailyAllowance).toLocaleString()}</Text>
                </View>
              </View>
              <View style={[styles.badge, isOverspent ? styles.badgeDanger : styles.badgeSuccess]}>
                <Text style={[styles.badgeText, isOverspent ? styles.badgeTextDanger : styles.badgeTextSuccess]}>
                  {isOverspent ? 'REDUCE SPENDING' : 'HEALTHY LIMIT'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Category Remaining</Text>
          <Text style={styles.sectionSubtitle}>Budgets per category</Text>
        </View>

        <View style={styles.catBudgetGrid}>
          {categories.map(cat => {
            const Icon = CATEGORY_ICONS[cat];
            const spent = categoryTotals[cat] || 0;
            const limit = budget.categories[cat] || 0;
            const remaining = limit - spent;
            const isOver = remaining < 0;
            const progress = Math.min(1, spent / limit);

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
            const Icon = CATEGORY_ICONS[expense.category];
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  scrollContent: { padding: 24, paddingBottom: 120 },
  header: { marginBottom: 32, marginTop: 10, alignItems: 'center' },
  logo: { width: 36, height: 36, marginBottom: 8 },
  brandName: { fontFamily: 'Outfit_800ExtraBold', color: '#FFFFFF', fontSize: 12, letterSpacing: 4, marginBottom: 12 },
  title: { fontFamily: 'Outfit_800ExtraBold', fontSize: 36, color: '#FFFFFF' },
  subtitle: { fontFamily: 'Inter_500Medium', fontSize: 14, color: '#A0A0A0', marginTop: 4 },
  
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 40 },
  kpiCard: { minHeight: 110, flex: 1, minWidth: '45%', backgroundColor: 'rgba(20,20,20,0.95)', padding: 20, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', position: 'relative', overflow: 'hidden' },
  kpiIconBox: { position: 'absolute', top: 20, right: 20 },
  kpiLabel: { color: '#A0A0A0', fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 1, marginBottom: 8 },
  kpiValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  kpiCurrency: { color: '#A0A0A0', fontSize: 12, fontFamily: 'Inter_500Medium' },
  kpiValue: { color: '#FFFFFF', fontSize: 28, fontFamily: 'Outfit_300Light' },
  kpiRowSplit: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  kpiValueLarge: { color: '#FFFFFF', fontSize: 36, fontFamily: 'Outfit_300Light' },
  
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1 },
  badgeSuccess: { backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.2)' },
  badgeDanger: { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.2)' },
  badgeText: { fontFamily: 'Outfit_800ExtraBold', fontSize: 10, letterSpacing: 1 },
  badgeTextSuccess: { color: '#10B981' },
  badgeTextDanger: { color: '#EF4444' },

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

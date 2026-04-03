import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useLedgr } from '../lib/LedgrContext';
import { useThemeColors } from '../lib/ThemeContext';
import { ExpenseCategory, Expense } from '../lib/store';
import { Wallet, Target, TrendingUp, Coffee, Car, Home as HomeIcon, ShoppingBag, Heart, MoreHorizontal, AlertCircle, ShoppingBasket, CheckCircle2, Minus, Info, TrendingDown } from 'lucide-react-native';
import EditExpenseModal from '../components/EditExpenseModal';
import DailyDetailModal from '../components/DailyDetailModal';
import { getDaysRemainingInMonth } from '../lib/dateUtils';

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
  const colors = useThemeColors();
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isDailyDetailVisible, setIsDailyDetailVisible] = useState(false);

  const currentMonthExpenses = React.useMemo(() => {
    const activeMonth = budget.budgetMonth || new Date().toISOString().slice(0, 7);
    return expenses.filter(e => e.date.startsWith(activeMonth));
  }, [expenses, budget.budgetMonth]);

  const totalSpent = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const remainingBudget = budget.total - totalSpent;

  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysLeft = getDaysRemainingInMonth();
  const dailyAllowance = Math.max(0, remainingBudget / daysLeft);

  const dailyTarget = budget.total / daysInMonth;
  const ratio = dailyAllowance / dailyTarget;

  const getDailyStatus = () => {
    if (ratio >= 1.5) return {
      label: 'COMFORTABLE',
      color: colors.success,
      bgColor: colors.successBg,
      description: "You're spending significantly less than your planned daily average. You have breathing room for miscellaneous costs.",
      threshold: ">= 1.5x target",
      icon: CheckCircle2
    };
    if (ratio >= 1.0) return {
      label: 'ON TRACK',
      color: colors.warning,
      bgColor: colors.warningBg,
      description: "Your daily spending is perfectly aligned with your monthly budget goal. Keep maintaining this pace.",
      threshold: "1.0x to 1.5x target",
      icon: TrendingUp
    };
    if (ratio >= 0.6) return {
      label: 'TIGHT',
      color: colors.warning,
      bgColor: colors.warningBg,
      description: "You're slightly below your daily target. It's time to prioritize essential spending only to finish the month on budget.",
      threshold: "0.6x to 1.0x target",
      icon: Minus
    };
    if (ratio >= 0.3) return {
      label: 'CRITICAL',
      color: colors.danger,
      bgColor: colors.dangerBg,
      description: "Your available daily budget is very low. High alert! Immediate reduction in non-essential spending is required.",
      threshold: "0.3x to 0.6x target",
      icon: AlertCircle
    };
    return {
      label: 'OVERSPENT',
      color: colors.danger,
      bgColor: colors.dangerBg,
      description: "You have exceeded your sustainable daily limit. Every rupee spent now contributes to a monthly deficit.",
      threshold: "< 0.3x target",
      icon: TrendingDown
    };
  };

  const dailyStatus = getDailyStatus();

  const categoryTotals: Record<string, number> = {};
  currentMonthExpenses.forEach(e => {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
  });

  const isOverspent = remainingBudget < 0;

  if (!isLoaded) return <View style={[styles.container, { backgroundColor: colors.background }]} />;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={[styles.brandName, { color: colors.textTertiary }]}>LEDGR</Text>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Overview</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Your real-time financial health</Text>
        </View>

        <View style={styles.kpiGrid}>
          <View style={[styles.kpiCardSmall, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={styles.kpiIconBox}><Target color={colors.iconMuted} size={16} opacity={0.5} /></View>
            <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>BUDGET</Text>
            <View style={styles.kpiValueStack}>
              <Text style={[styles.kpiCurrencySmall, { color: colors.textTertiary }]}>PKR</Text>
              <Text style={[styles.kpiValueSmall, { color: colors.textPrimary }]} numberOfLines={1} adjustsFontSizeToFit>{budget.total.toLocaleString()}</Text>
            </View>
          </View>

          <View style={[styles.kpiCardSmall, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={styles.kpiIconBox}><Wallet color={colors.accent} size={16} opacity={0.5} /></View>
            <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>SPENT</Text>
            <View style={styles.kpiValueStack}>
              <Text style={[styles.kpiCurrencySmall, { color: colors.textTertiary }]}>PKR</Text>
              <Text style={[styles.kpiValueSmall, { color: colors.textPrimary }]} numberOfLines={1} adjustsFontSizeToFit>{totalSpent.toLocaleString()}</Text>
            </View>
          </View>

          <View style={[styles.kpiCardSmall, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={styles.kpiIconBox}><TrendingUp color={colors.purple} size={16} opacity={0.5} /></View>
            <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>REMAINING</Text>
            <View style={styles.kpiValueStack}>
              <Text style={[styles.kpiCurrencySmall, { color: colors.textTertiary }]}>PKR</Text>
              <Text style={[styles.kpiValueSmall, { color: colors.textPrimary }]} numberOfLines={1} adjustsFontSizeToFit>{remainingBudget.toLocaleString()}</Text>
            </View>
          </View>
        </View>

        <View style={styles.kpiGrid}>
          <View style={[styles.kpiCard, { width: '100%', backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={styles.kpiRowSplit}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <Text style={[styles.kpiLabel, { color: colors.textSecondary }]} numberOfLines={1} adjustsFontSizeToFit>DAILY ALLOWANCE ({daysLeft} DAYS LEFT)</Text>
                <View style={styles.kpiValueRow}>
                  <Text style={[styles.kpiCurrency, { color: colors.textTertiary }]}>PKR</Text>
                  <Text style={[styles.kpiValueLarge, { color: colors.textPrimary }]} numberOfLines={1} adjustsFontSizeToFit>{Math.floor(dailyAllowance).toLocaleString()}</Text>
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
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Category Remaining</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textTertiary }]}>Budgets per category</Text>
        </View>

        <View style={styles.catBudgetGrid}>
          {allCategories.map(cat => {
            const Icon = CATEGORY_ICONS[cat as ExpenseCategory] || MoreHorizontal;
            const spent = categoryTotals[cat] || 0;
            const limit = budget.categories[cat] || 0;
            const remaining = limit - spent;
            const isOver = remaining < 0;
            const progress = Math.min(1, spent / (limit || 1));
            const percentUsed = limit > 0 ? Math.round((spent / limit) * 100) : 0;

            return (
              <View key={cat} style={[styles.catBudgetCard, { backgroundColor: colors.surface, borderColor: colors.cardBorderSubtle }]}>
                <View style={styles.catCardTop}>
                  <View style={[styles.catIconBox, { backgroundColor: colors.pillBg }, isOver && styles.catIconBoxDanger]}>
                    <Icon color={isOver ? colors.danger : colors.iconDefault} size={16} />
                  </View>
                  <Text style={[styles.catCardName, { color: colors.textSecondary }]}>{cat}</Text>
                </View>

                <Text style={[styles.catRemaining, { color: colors.textPrimary }, isOver && { color: colors.danger }]}>
                  PKR {Math.abs(remaining).toLocaleString()}
                </Text>
                <View style={styles.catMetaRow}>
                  <Text style={[styles.catRemainingLabel, { color: colors.textTertiary }]}>{isOver ? 'OVER LIMIT' : 'REMAINING'}</Text>
                  <Text style={[styles.catPercentLabel, { color: isOver ? colors.danger : colors.accent }]}>{percentUsed}%</Text>
                </View>

                <View style={[styles.progressBarBg, { backgroundColor: colors.divider }]}>
                  <View style={[styles.progressBarFill, { width: `${progress * 100}%`, backgroundColor: colors.accent }, isOver && { backgroundColor: colors.danger }]} />
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Recent Transactions</Text>
        </View>

        <View style={styles.expensesList}>
          {currentMonthExpenses.slice(0, 10).map((expense) => {
            const Icon = CATEGORY_ICONS[expense.category as ExpenseCategory] || MoreHorizontal;
            return (
              <TouchableOpacity
                key={expense.id}
                onPress={() => {
                  setEditingExpense(expense);
                  setIsEditModalVisible(true);
                }}
              >
                <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={[styles.listCard, { borderColor: colors.cardBorderSubtle }]}>
                  <View style={styles.listCardRow}>
                    <View style={styles.airlineGroup}>
                      <View style={[styles.iconBox, { backgroundColor: colors.pillBg, borderColor: colors.cardBorder }]}>
                        <Icon color={colors.iconDefault} size={18} />
                      </View>
                      <View style={{ flex: 1, marginRight: 12 }}>
                        <Text style={[styles.expenseName, { color: colors.textPrimary }]} numberOfLines={2}>{expense.name}</Text>
                        <Text style={[styles.expenseCat, { color: colors.textSecondary }]}>{expense.category}</Text>
                      </View>
                    </View>
                    <View style={styles.listRight}>
                      <Text style={[styles.listAmount, { color: colors.textPrimary }]} numberOfLines={1} adjustsFontSizeToFit>
                        PKR {expense.amount.toLocaleString()}
                      </Text>
                      <Text style={[styles.listDate, { color: colors.textSecondary }]}>{new Date(expense.date).toLocaleDateString()}</Text>
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
  container: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 120 },
  header: { alignItems: 'center', marginBottom: 32, marginTop: 10 },
  logo: { width: 36, height: 36, marginBottom: 8 },
  brandName: { fontFamily: 'Outfit_800ExtraBold', fontSize: 12, letterSpacing: 4, marginBottom: 12 },
  title: { fontFamily: 'Outfit_800ExtraBold', fontSize: 36 },
  subtitle: { fontFamily: 'Inter_500Medium', fontSize: 14, marginTop: 4 },

  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  kpiCard: { minHeight: 110, flex: 1, minWidth: '45%', padding: 20, borderRadius: 24, borderWidth: 1, position: 'relative', overflow: 'hidden' },
  kpiCardSmall: { minHeight: 100, flex: 1, minWidth: '30%', padding: 14, borderRadius: 20, borderWidth: 1, position: 'relative', overflow: 'hidden' },
  kpiIconBox: { position: 'absolute', top: 14, right: 14 },
  kpiLabel: { fontSize: 9, fontFamily: 'Inter_700Bold', letterSpacing: 1, marginBottom: 8 },
  kpiValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 4 },
  kpiValueStack: { marginTop: 4 },
  kpiCurrency: { fontSize: 10, fontFamily: 'Inter_500Medium' },
  kpiCurrencySmall: { fontSize: 8, fontFamily: 'Inter_700Bold', marginBottom: 2 },
  kpiValueSmall: { fontSize: 20, fontFamily: 'Outfit_300Light', flex: 1 },
  kpiRowSplit: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  kpiValueLarge: { fontSize: 36, fontFamily: 'Outfit_300Light' },

  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1 },
  badgeText: { fontFamily: 'Outfit_800ExtraBold', fontSize: 10, letterSpacing: 1 },

  sectionHeader: { marginBottom: 16, marginTop: 8 },
  sectionTitle: { fontFamily: 'Outfit_600SemiBold', fontSize: 20 },
  sectionSubtitle: { fontFamily: 'Inter_500Medium', fontSize: 12, marginTop: 2 },

  catBudgetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 40 },
  catBudgetCard: { width: '48%', padding: 16, borderRadius: 20, borderWidth: 1 },
  catCardTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  catIconBox: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  catIconBoxDanger: { backgroundColor: 'rgba(239, 68, 68, 0.1)' },
  catCardName: { fontFamily: 'Inter_700Bold', fontSize: 10, textTransform: 'uppercase' },
  catRemaining: { fontFamily: 'Outfit_600SemiBold', fontSize: 18 },
  catRemainingLabel: { fontFamily: 'Inter_700Bold', fontSize: 9, letterSpacing: 0.5 },
  catMetaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 },
  catPercentLabel: { fontFamily: 'Inter_800ExtraBold', fontSize: 9, letterSpacing: 0.5 },

  progressBarBg: { height: 4, borderRadius: 2, marginTop: 12, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 2 },

  expensesList: { gap: 12 },
  listCard: { borderRadius: 20, padding: 16, borderWidth: 1 },
  listCardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  airlineGroup: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  iconBox: { width: 36, height: 36, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  expenseName: { fontFamily: 'Outfit_600SemiBold', fontSize: 16 },
  expenseCat: { fontFamily: 'Inter_500Medium', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 },
  listRight: { alignItems: 'flex-end', minWidth: 100, flexShrink: 0 },
  listAmount: { fontFamily: 'Outfit_400Regular', fontSize: 18, textAlign: 'right' },
  listDate: { fontFamily: 'Inter_500Medium', fontSize: 10, marginTop: 2 },
});
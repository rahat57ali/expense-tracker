import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, G, Path } from 'react-native-svg';
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Coins,
  Flame,
  PieChart,
  Repeat2,
  Sparkles,
  TrendingUp,
} from 'lucide-react-native';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  getDate,
  isSameMonth,
  startOfMonth,
} from 'date-fns';
import { useLedgr } from '../lib/LedgrContext';
import { Expense } from '../lib/store';
import { useThemeColors } from '../lib/ThemeContext';
import { useResponsiveLayout } from '../lib/layout';
import ScreenLayout from '../components/ScreenLayout';
import PageHeader from '../components/PageHeader';
import SectionHeader from '../components/SectionHeader';
import EditExpenseModal from '../components/EditExpenseModal';

const CATEGORY_COLORS: Record<string, string> = {
  Food: '#FFD700',
  Dining: '#FFD700',
  Grocery: '#10B981',
  Transport: '#3B82F6',
  Bills: '#EF4444',
  Utilities: '#EF4444',
  Shopping: '#8A2BE2',
  Health: '#EC4899',
  Other: '#949494',
};

const DISCRETIONARY_CATEGORIES = ['Food', 'Dining'];
const ESSENTIAL_CATEGORIES = ['Grocery', 'Transport', 'Bills', 'Utilities', 'Health'];

type ItemAggregate = {
  key: string;
  label: string;
  amount: number;
  frequency: number;
  expenses: Expense[];
};

function normalizeExpenseName(name: string) {
  return name
    .replace(/^paid:\s*/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function getCategoryColor(category: string, fallback: string) {
  return CATEGORY_COLORS[category] || fallback;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export default function SummaryScreen() {
  const { expenses, budget, budgetHistory, allCategories, isLoaded, updateBudget } = useLedgr();
  const colors = useThemeColors();
  const { pagePadding, contentMaxWidth, isDesktop, isTablet, sectionGap } = useResponsiveLayout();

  const [selectedMonth, setSelectedMonth] = useState(() => startOfMonth(new Date()));
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);
  const [budgetInputs, setBudgetInputs] = useState<Record<string, string>>({});
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);

  const monthKey = format(selectedMonth, 'yyyy-MM');
  const isCurrentMonth = isSameMonth(selectedMonth, new Date());

  const monthExpenses = useMemo(
    () => expenses.filter(expense => format(new Date(expense.date), 'yyyy-MM') === monthKey),
    [expenses, monthKey]
  );

  const allCategoryNames = useMemo(() => {
    const set = new Set<string>([
      ...allCategories,
      ...Object.keys(budget.categories),
      ...Object.keys(budgetHistory[monthKey]?.categories || {}),
      ...monthExpenses.map(expense => expense.category),
    ]);
    return Array.from(set);
  }, [allCategories, budget.categories, budgetHistory, monthExpenses, monthKey]);

  const monthBudget = useMemo(() => {
    const snapshot = isCurrentMonth ? budget : budgetHistory[monthKey];
    const categoryLimits = allCategoryNames.reduce<Record<string, number>>((acc, category) => {
      acc[category] = snapshot?.categories?.[category] ?? budget.categories[category] ?? 0;
      return acc;
    }, {});

    return {
      total: snapshot?.total ?? budget.total,
      categories: categoryLimits,
    };
  }, [allCategoryNames, budget, budgetHistory, isCurrentMonth, monthKey]);

  useEffect(() => {
    setBudgetInputs(
      Object.fromEntries(
        allCategoryNames.map(category => [category, String(monthBudget.categories[category] ?? 0)])
      )
    );
  }, [allCategoryNames, monthBudget.categories, monthKey]);

  const totalSpent = monthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const monthDays = eachDayOfInterval({
    start: startOfMonth(selectedMonth),
    end: endOfMonth(selectedMonth),
  });
  const daysInMonth = monthDays.length;
  const elapsedDays = isCurrentMonth ? clamp(new Date().getDate(), 1, daysInMonth) : daysInMonth;
  const avgDailySpend = totalSpent / elapsedDays;
  const projectedTotal = avgDailySpend * daysInMonth;
  const projectionDelta = projectedTotal - monthBudget.total;

  const categoryTotals = useMemo(() => {
    return allCategoryNames.reduce<Record<string, number>>((acc, category) => {
      acc[category] = monthExpenses
        .filter(expense => expense.category === category)
        .reduce((sum, expense) => sum + expense.amount, 0);
      return acc;
    }, {});
  }, [allCategoryNames, monthExpenses]);

  const categoryBreakdown = useMemo(() => {
    return allCategoryNames
      .map(category => ({
        category,
        amount: categoryTotals[category] || 0,
        color: getCategoryColor(category, colors.accent),
      }))
      .filter(item => item.amount > 0)
      .sort((a, b) => b.amount - a.amount);
  }, [allCategoryNames, categoryTotals, colors.accent]);

  const donutSelection = selectedCategory && categoryTotals[selectedCategory] > 0
    ? selectedCategory
    : categoryBreakdown[0]?.category || null;

  const dailyBreakdown = useMemo(() => {
    return monthDays.map(day => {
      const dayKey = format(day, 'yyyy-MM-dd');
      const dayExpenses = monthExpenses.filter(expense => format(new Date(expense.date), 'yyyy-MM-dd') === dayKey);
      return {
        day,
        dayKey,
        total: dayExpenses.reduce((sum, expense) => sum + expense.amount, 0),
        expenses: dayExpenses,
      };
    });
  }, [monthDays, monthExpenses]);

  useEffect(() => {
    const highestDay = [...dailyBreakdown].sort((a, b) => b.total - a.total)[0];
    setSelectedDayKey(highestDay?.dayKey || null);
  }, [dailyBreakdown]);

  const selectedDay = dailyBreakdown.find(day => day.dayKey === selectedDayKey) || dailyBreakdown[0];
  const maxDailySpend = Math.max(...dailyBreakdown.map(day => day.total), 1);

  const topItems = useMemo(() => {
    const map = new Map<string, ItemAggregate>();

    monthExpenses.forEach(expense => {
      const key = normalizeExpenseName(expense.name).toLowerCase();
      if (!key) return;

      const current = map.get(key);
      if (current) {
        current.amount += expense.amount;
        current.frequency += 1;
        current.expenses.push(expense);
      } else {
        map.set(key, {
          key,
          label: normalizeExpenseName(expense.name),
          amount: expense.amount,
          frequency: 1,
          expenses: [expense],
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => b.amount - a.amount);
  }, [monthExpenses]);

  const repeatPurchases = topItems.filter(item => item.frequency > 1);

  const foodSpend = monthExpenses
    .filter(expense => DISCRETIONARY_CATEGORIES.includes(expense.category))
    .reduce((sum, expense) => sum + expense.amount, 0);
  const essentialSpend = monthExpenses
    .filter(expense => ESSENTIAL_CATEGORIES.includes(expense.category))
    .reduce((sum, expense) => sum + expense.amount, 0);
  const ratioTotal = foodSpend + essentialSpend;
  const foodRatio = ratioTotal > 0 ? foodSpend / ratioTotal : 0;

  const topDays = [...dailyBreakdown]
    .filter(day => day.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, 3);

  const weekLabels = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'];
  const weekCategoryChart = useMemo(() => {
    return weekLabels.map((label, index) => {
      const startDay = index * 7 + 1;
      const endDay = Math.min(startDay + 6, daysInMonth);
      const matchingDays = dailyBreakdown.filter(day => {
        const date = getDate(day.day);
        return date >= startDay && date <= endDay;
      });

      const categorySpend = allCategoryNames.reduce<Record<string, number>>((acc, category) => {
        acc[category] = matchingDays.reduce((sum, day) => {
          const subtotal = day.expenses
            .filter(expense => expense.category === category)
            .reduce((expenseSum, expense) => expenseSum + expense.amount, 0);
          return sum + subtotal;
        }, 0);
        return acc;
      }, {});

      return {
        label,
        startDay,
        endDay,
        categorySpend,
      };
    });
  }, [allCategoryNames, dailyBreakdown, daysInMonth]);

  const weekCategories = useMemo(() => {
    return categoryBreakdown.slice(0, 4).map(item => item.category);
  }, [categoryBreakdown]);
  const maxWeeklySpend = Math.max(
    ...weekCategoryChart.flatMap(week => weekCategories.map(category => week.categorySpend[category] || 0)),
    1
  );

  const smartSuggestions = useMemo(() => {
    const suggestions: string[] = [];

    const overspentCategories = allCategoryNames
      .map(category => {
        const spent = categoryTotals[category] || 0;
        const limit = monthBudget.categories[category] || 0;
        return { category, spent, limit, overBy: spent - limit };
      })
      .filter(item => item.limit > 0 && item.overBy > 0)
      .sort((a, b) => b.overBy - a.overBy);

    if (overspentCategories[0]) {
      suggestions.push(
        `${overspentCategories[0].category} is already over budget by PKR ${overspentCategories[0].overBy.toLocaleString()}.`
      );
    }

    if (repeatPurchases[0]) {
      suggestions.push(
        `${repeatPurchases[0].label} was bought ${repeatPurchases[0].frequency} times this month for PKR ${repeatPurchases[0].amount.toLocaleString()} in total.`
      );
    }

    if (topDays[0]) {
      suggestions.push(
        `${format(topDays[0].day, 'MMM d')} was your priciest day at PKR ${topDays[0].total.toLocaleString()}, worth reviewing for one-off spikes.`
      );
    }

    if (projectionDelta > 0) {
      suggestions.push(
        `At the current pace, month-end spend is projected around PKR ${Math.round(projectedTotal).toLocaleString()}, which is PKR ${Math.round(projectionDelta).toLocaleString()} above budget.`
      );
    } else if (totalSpent > 0) {
      suggestions.push(
        `Your current pace projects to PKR ${Math.round(projectedTotal).toLocaleString()}, leaving room under the monthly target if spending stays steady.`
      );
    }

    if (foodRatio > 0.45 && ratioTotal > 0) {
      suggestions.push(
        `Food and dining make up ${Math.round(foodRatio * 100)}% of tracked essentials versus discretionary spend, so meal planning could free up room quickly.`
      );
    }

    return suggestions.slice(0, 5);
  }, [
    allCategoryNames,
    categoryTotals,
    foodRatio,
    monthBudget.categories,
    projectedTotal,
    projectionDelta,
    ratioTotal,
    repeatPurchases,
    topDays,
    totalSpent,
  ]);

  const handleMonthShift = (direction: -1 | 1) => {
    setSelectedMonth(current => startOfMonth(addMonths(current, direction)));
    setSelectedCategory(null);
  };

  const handleBudgetCommit = async (category: string) => {
    if (!isCurrentMonth) return;
    const parsedValue = Number.parseFloat((budgetInputs[category] || '0').replace(/,/g, ''));
    const nextValue = Number.isFinite(parsedValue) ? Math.max(0, parsedValue) : 0;

    const nextCategories = {
      ...budget.categories,
      [category]: nextValue,
    };

    setBudgetInputs(current => ({ ...current, [category]: String(nextValue) }));
    await updateBudget({
      ...budget,
      categories: nextCategories,
    });
  };

  const chartLinePath = useMemo(() => {
    const width = Math.max((dailyBreakdown.length - 1) * 16, 1);
    const height = 90;
    const points = dailyBreakdown.map((entry, index) => {
      const x = index * 16;
      const y = height - (entry.total / maxDailySpend) * 70 - 8;
      return `${index === 0 ? 'M' : 'L'} ${x} ${Number.isFinite(y) ? y : height - 8}`;
    });
    return { width, height, path: points.join(' ') };
  }, [dailyBreakdown, maxDailySpend]);

  if (!isLoaded) {
    return <View style={[styles.container, { backgroundColor: colors.background }]} />;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 24, paddingHorizontal: pagePadding, gap: sectionGap },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <ScreenLayout maxWidth={contentMaxWidth}>
          <PageHeader
            title="Insights"
            subtitle="A deeper monthly view of where money is going, what is repeating, and where your budget pace is heading."
          />

          <LinearGradient
            colors={[colors.gradientStart, colors.gradientEnd] as const}
            style={[styles.monthStrip, { borderColor: colors.cardBorderSubtle }]}
          >
            <View>
              <Text style={[styles.eyebrow, { color: colors.textTertiary }]}>Selected month</Text>
              <Text style={[styles.monthTitle, { color: colors.textPrimary }]}>{format(selectedMonth, 'MMMM yyyy')}</Text>
            </View>
            <View style={styles.monthActions}>
              <TouchableOpacity
                style={[styles.iconButton, { backgroundColor: colors.pillBg, borderColor: colors.cardBorder }]}
                onPress={() => handleMonthShift(-1)}
              >
                <ChevronLeft color={colors.textPrimary} size={18} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.iconButton, { backgroundColor: colors.pillBg, borderColor: colors.cardBorder }]}
                onPress={() => {
                  setSelectedMonth(startOfMonth(new Date()));
                  setSelectedCategory(null);
                }}
              >
                <CalendarDays color={colors.accent} size={17} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.iconButton, { backgroundColor: colors.pillBg, borderColor: colors.cardBorder }]}
                onPress={() => handleMonthShift(1)}
              >
                <ChevronRight color={colors.textPrimary} size={18} />
              </TouchableOpacity>
            </View>
          </LinearGradient>

          <View style={[styles.statsGrid, isDesktop && styles.statsGridDesktop]}>
            <LinearGradient colors={[colors.gradientStart, colors.gradientEnd] as const} style={[styles.statCard, { borderColor: colors.cardBorderSubtle }]}>
              <View style={[styles.statIcon, { backgroundColor: colors.accentBg }]}><Coins color={colors.accent} size={16} /></View>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Monthly spend</Text>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>PKR {Math.round(totalSpent).toLocaleString()}</Text>
            </LinearGradient>
            <LinearGradient colors={[colors.gradientStart, colors.gradientEnd] as const} style={[styles.statCard, { borderColor: colors.cardBorderSubtle }]}>
              <View style={[styles.statIcon, { backgroundColor: colors.blueBg }]}><TrendingUp color={colors.blue} size={16} /></View>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Avg daily</Text>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>PKR {Math.round(avgDailySpend).toLocaleString()}</Text>
            </LinearGradient>
            <LinearGradient colors={[colors.gradientStart, colors.gradientEnd] as const} style={[styles.statCard, { borderColor: colors.cardBorderSubtle }]}>
              <View style={[styles.statIcon, { backgroundColor: projectionDelta > 0 ? colors.dangerBg : colors.successBg }]}>
                <ArrowRight color={projectionDelta > 0 ? colors.danger : colors.success} size={16} />
              </View>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Projected total</Text>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>PKR {Math.round(projectedTotal).toLocaleString()}</Text>
            </LinearGradient>
          </View>

          <View style={[styles.twoColumn, isDesktop && styles.twoColumnDesktop]}>
            <View style={styles.primaryColumn}>
              <SectionHeader title="Category Breakdown" subtitle="Tap a segment or row to focus a spending category." />
              <LinearGradient
                colors={[colors.gradientStart, colors.gradientEnd] as const}
                style={[styles.analyticsCard, { borderColor: colors.cardBorderSubtle }]}
              >
                <View style={[styles.breakdownLayout, (isTablet || isDesktop) && styles.breakdownLayoutWide]}>
                  <View style={styles.donutWrap}>
                    <Svg width={190} height={190} viewBox="0 0 120 120">
                      <G rotation="-90" origin="60, 60">
                        {categoryBreakdown.length === 0 ? (
                          <Circle cx="60" cy="60" r="42" stroke={colors.divider} strokeWidth="16" fill="none" />
                        ) : (
                          (() => {
                            let cumulative = 0;
                            return categoryBreakdown.map(item => {
                              const fraction = item.amount / totalSpent;
                              const circumference = 2 * Math.PI * 42;
                              const dash = fraction * circumference;
                              const offset = -cumulative * circumference;
                              cumulative += fraction;
                              const isActive = donutSelection === item.category;
                              return (
                                <Circle
                                  key={item.category}
                                  cx="60"
                                  cy="60"
                                  r="42"
                                  stroke={item.color}
                                  strokeWidth={isActive ? 18 : 14}
                                  strokeDasharray={`${dash} ${circumference}`}
                                  strokeDashoffset={offset}
                                  fill="none"
                                  strokeLinecap="round"
                                  opacity={isActive ? 1 : 0.78}
                                />
                              );
                            });
                          })()
                        )}
                      </G>
                    </Svg>
                    <View style={styles.donutCenter}>
                      <PieChart color={colors.textTertiary} size={18} />
                      <Text style={[styles.donutCenterLabel, { color: colors.textTertiary }]}>Tracked</Text>
                      <Text style={[styles.donutCenterValue, { color: colors.textPrimary }]}>{categoryBreakdown.length}</Text>
                    </View>
                  </View>

                  <View style={styles.breakdownList}>
                    {categoryBreakdown.length === 0 ? (
                      <Text style={[styles.emptyText, { color: colors.textTertiary }]}>No expense data for this month yet.</Text>
                    ) : (
                      categoryBreakdown.map(item => {
                        const isActive = donutSelection === item.category;
                        return (
                          <TouchableOpacity
                            key={item.category}
                            style={[
                              styles.breakdownRow,
                              { backgroundColor: colors.innerCardBg, borderColor: colors.cardBorderSubtle },
                              isActive && { borderColor: item.color, backgroundColor: `${item.color}18` },
                            ]}
                            onPress={() => setSelectedCategory(item.category)}
                          >
                            <View style={[styles.colorDot, { backgroundColor: item.color }]} />
                            <View style={{ flex: 1 }}>
                              <Text style={[styles.breakdownName, { color: colors.textPrimary }]}>{item.category}</Text>
                              <Text style={[styles.breakdownMeta, { color: colors.textSecondary }]}>
                                {Math.round((item.amount / totalSpent) * 100)}% of monthly spend
                              </Text>
                            </View>
                            <Text style={[styles.breakdownAmount, { color: colors.textPrimary }]}>PKR {Math.round(item.amount).toLocaleString()}</Text>
                          </TouchableOpacity>
                        );
                      })
                    )}
                  </View>
                </View>
              </LinearGradient>

              <SectionHeader title="Daily Spend Trend" subtitle="Touch a day to inspect spikes and transaction detail." />
              <LinearGradient
                colors={[colors.gradientStart, colors.gradientEnd] as const}
                style={[styles.analyticsCard, { borderColor: colors.cardBorderSubtle }]}
              >
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chartScroller}>
                  <View>
                    <Svg width={chartLinePath.width + 20} height={chartLinePath.height + 10}>
                      <Path d={chartLinePath.path} stroke={colors.accent} strokeWidth="3" fill="none" />
                    </Svg>
                    <View style={styles.dailyBarsRow}>
                      {dailyBreakdown.map(entry => {
                        const isActive = entry.dayKey === selectedDay?.dayKey;
                        const height = 24 + (entry.total / maxDailySpend) * 88;
                        return (
                          <TouchableOpacity
                            key={entry.dayKey}
                            style={styles.dailyBarTouch}
                            onPress={() => setSelectedDayKey(entry.dayKey)}
                          >
                            <View
                              style={[
                                styles.dailyBar,
                                {
                                  height,
                                  backgroundColor: isActive ? colors.accent : colors.pillBg,
                                  borderColor: isActive ? colors.accent : colors.cardBorderSubtle,
                                },
                              ]}
                            />
                            <Text style={[styles.dailyBarLabel, { color: isActive ? colors.textPrimary : colors.textTertiary }]}>
                              {format(entry.day, 'd')}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                </ScrollView>

                {selectedDay ? (
                  <View style={[styles.detailPanel, { backgroundColor: colors.innerCardBg, borderColor: colors.cardBorderSubtle }]}>
                    <View style={styles.detailPanelHeader}>
                      <View>
                        <Text style={[styles.detailTitle, { color: colors.textPrimary }]}>{format(selectedDay.day, 'EEEE, MMM d')}</Text>
                        <Text style={[styles.detailSubtitle, { color: colors.textSecondary }]}>
                          PKR {Math.round(selectedDay.total).toLocaleString()} across {selectedDay.expenses.length} purchases
                        </Text>
                      </View>
                      <View style={[styles.dayBadge, { backgroundColor: colors.accentBg, borderColor: colors.accent + '33' }]}>
                        <Text style={[styles.dayBadgeText, { color: colors.accent }]}>Peak check</Text>
                      </View>
                    </View>
                    <View style={styles.detailList}>
                      {selectedDay.expenses.slice(0, 4).map(expense => (
                        <TouchableOpacity
                          key={expense.id}
                          style={styles.detailRow}
                          onPress={() => {
                            setEditingExpense(expense);
                            setIsEditModalVisible(true);
                          }}
                        >
                          <Text style={[styles.detailExpenseName, { color: colors.textPrimary }]} numberOfLines={1}>{expense.name}</Text>
                          <Text style={[styles.detailExpenseAmount, { color: colors.textSecondary }]}>PKR {expense.amount.toLocaleString()}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                ) : null}
              </LinearGradient>

              <SectionHeader title="Top Spending Items" subtitle="Highest cumulative spend, with repeat frequency included." />
              <LinearGradient
                colors={[colors.gradientStart, colors.gradientEnd] as const}
                style={[styles.analyticsCard, { borderColor: colors.cardBorderSubtle }]}
              >
                <View style={styles.rankList}>
                  {topItems.slice(0, 6).map((item, index) => (
                    <View key={item.key} style={[styles.rankRow, { borderBottomColor: colors.divider }]}>
                      <View style={[styles.rankBadge, { backgroundColor: colors.pillBg }]}>
                        <Text style={[styles.rankBadgeText, { color: colors.textPrimary }]}>{index + 1}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.rankTitle, { color: colors.textPrimary }]} numberOfLines={1}>{item.label}</Text>
                        <Text style={[styles.rankMeta, { color: colors.textSecondary }]}>
                          {item.frequency} purchase{item.frequency === 1 ? '' : 's'}
                        </Text>
                      </View>
                      <Text style={[styles.rankValue, { color: colors.textPrimary }]}>PKR {Math.round(item.amount).toLocaleString()}</Text>
                    </View>
                  ))}
                  {topItems.length === 0 ? <Text style={[styles.emptyText, { color: colors.textTertiary }]}>No transactions available for ranking.</Text> : null}
                </View>
              </LinearGradient>

              <SectionHeader title="Repeat Purchase Analyzer" subtitle="Repeated buys that may be worth consolidating or buying in bulk." />
              <LinearGradient
                colors={[colors.gradientStart, colors.gradientEnd] as const}
                style={[styles.analyticsCard, { borderColor: colors.cardBorderSubtle }]}
              >
                <View style={styles.repeatList}>
                  {repeatPurchases.slice(0, 6).map(item => {
                    const shouldSuggestBulk = item.frequency >= 3 || item.amount >= avgDailySpend * 2;
                    return (
                      <View key={item.key} style={[styles.repeatRow, { backgroundColor: colors.innerCardBg, borderColor: colors.cardBorderSubtle }]}>
                        <View style={[styles.repeatIcon, { backgroundColor: colors.purpleBg }]}>
                          <Repeat2 color={colors.purple} size={16} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.repeatTitle, { color: colors.textPrimary }]} numberOfLines={1}>{item.label}</Text>
                          <Text style={[styles.repeatMeta, { color: colors.textSecondary }]}>
                            {item.frequency} repeats, PKR {Math.round(item.amount).toLocaleString()} total
                          </Text>
                          {shouldSuggestBulk ? (
                            <Text style={[styles.repeatHint, { color: colors.warning }]}>Bulk-buy candidate based on frequency and cumulative cost.</Text>
                          ) : null}
                        </View>
                      </View>
                    );
                  })}
                  {repeatPurchases.length === 0 ? (
                    <Text style={[styles.emptyText, { color: colors.textTertiary }]}>Nothing repeated more than once this month.</Text>
                  ) : null}
                </View>
              </LinearGradient>
            </View>

            <View style={styles.secondaryColumn}>
              <SectionHeader
                title="Budget vs Actual"
                subtitle={isCurrentMonth ? 'Inline category limits save to the current month budget.' : 'Past months show the saved snapshot limits.'}
              />
              <LinearGradient
                colors={[colors.gradientStart, colors.gradientEnd] as const}
                style={[styles.analyticsCard, { borderColor: colors.cardBorderSubtle }]}
              >
                <View style={styles.budgetList}>
                  {allCategoryNames.map(category => {
                    const spent = categoryTotals[category] || 0;
                    const limit = monthBudget.categories[category] || 0;
                    const progress = limit > 0 ? Math.min(spent / limit, 1) : 0;
                    const overspent = limit > 0 && spent > limit;

                    return (
                      <View key={category} style={[styles.budgetRow, { borderBottomColor: colors.divider }]}>
                        <View style={styles.budgetRowTop}>
                          <View>
                            <Text style={[styles.budgetCategory, { color: colors.textPrimary }]}>{category}</Text>
                            <Text style={[styles.budgetMeta, { color: overspent ? colors.danger : colors.textSecondary }]}>
                              PKR {Math.round(spent).toLocaleString()} / {Math.round(limit).toLocaleString()}
                            </Text>
                          </View>
                          <TextInput
                            value={budgetInputs[category] || '0'}
                            onChangeText={value => setBudgetInputs(current => ({ ...current, [category]: value.replace(/[^\d.]/g, '') }))}
                            onBlur={() => handleBudgetCommit(category)}
                            editable={isCurrentMonth}
                            keyboardType="numeric"
                            placeholder="0"
                            placeholderTextColor={colors.textMuted}
                            style={[
                              styles.budgetInput,
                              {
                                color: isCurrentMonth ? colors.textPrimary : colors.textTertiary,
                                backgroundColor: colors.inputBg,
                                borderColor: colors.inputBorder,
                              },
                            ]}
                          />
                        </View>
                        <View style={[styles.progressTrack, { backgroundColor: colors.divider }]}>
                          <View
                            style={[
                              styles.progressFill,
                              {
                                width: `${Math.max(progress * 100, spent > 0 && limit === 0 ? 100 : 0)}%`,
                                backgroundColor: overspent ? colors.danger : getCategoryColor(category, colors.accent),
                              },
                            ]}
                          />
                        </View>
                      </View>
                    );
                  })}
                </View>
              </LinearGradient>

              <SectionHeader title="Avg Daily + Projection" subtitle="How this month is pacing relative to your target." />
              <LinearGradient
                colors={[colors.gradientStart, colors.gradientEnd] as const}
                style={[styles.analyticsCard, { borderColor: colors.cardBorderSubtle }]}
              >
                <View style={styles.projectionCard}>
                  <View style={[styles.projectionMetric, { backgroundColor: colors.innerCardBg, borderColor: colors.cardBorderSubtle }]}>
                    <Text style={[styles.projectionLabel, { color: colors.textSecondary }]}>Average daily spend</Text>
                    <Text style={[styles.projectionValue, { color: colors.textPrimary }]}>PKR {Math.round(avgDailySpend).toLocaleString()}</Text>
                  </View>
                  <View style={[styles.projectionMetric, { backgroundColor: colors.innerCardBg, borderColor: colors.cardBorderSubtle }]}>
                    <Text style={[styles.projectionLabel, { color: colors.textSecondary }]}>Month-end projection</Text>
                    <Text style={[styles.projectionValue, { color: colors.textPrimary }]}>PKR {Math.round(projectedTotal).toLocaleString()}</Text>
                  </View>
                </View>
                <View style={[styles.calloutBox, { backgroundColor: projectionDelta > 0 ? colors.dangerBg : colors.successBg, borderColor: projectionDelta > 0 ? `${colors.danger}40` : `${colors.success}40` }]}>
                  <Text style={[styles.calloutText, { color: projectionDelta > 0 ? colors.danger : colors.success }]}>
                    {projectionDelta > 0
                      ? `Projected to exceed budget by PKR ${Math.round(projectionDelta).toLocaleString()}.`
                      : `Projected to land PKR ${Math.round(Math.abs(projectionDelta)).toLocaleString()} under budget.`}
                  </Text>
                </View>
              </LinearGradient>

              <SectionHeader title="Food vs Essential Ratio" subtitle="Discretionary food spend compared with core household categories." />
              <LinearGradient
                colors={[colors.gradientStart, colors.gradientEnd] as const}
                style={[styles.analyticsCard, { borderColor: colors.cardBorderSubtle }]}
              >
                <View style={[styles.splitBar, { backgroundColor: colors.divider }]}>
                  <View style={[styles.splitFillLeft, { flex: foodRatio || 0.001, backgroundColor: '#FFD700' }]} />
                  <View style={[styles.splitFillRight, { flex: 1 - foodRatio || 0.001, backgroundColor: colors.accent }]} />
                </View>
                <View style={styles.ratioMetaRow}>
                  <View style={styles.ratioMetaItem}>
                    <Text style={[styles.ratioLabel, { color: colors.textSecondary }]}>Food & Dining</Text>
                    <Text style={[styles.ratioValue, { color: colors.textPrimary }]}>PKR {Math.round(foodSpend).toLocaleString()}</Text>
                  </View>
                  <View style={styles.ratioMetaItem}>
                    <Text style={[styles.ratioLabel, { color: colors.textSecondary }]}>Essentials</Text>
                    <Text style={[styles.ratioValue, { color: colors.textPrimary }]}>PKR {Math.round(essentialSpend).toLocaleString()}</Text>
                  </View>
                </View>
              </LinearGradient>

              <SectionHeader title="Most Expensive Days" subtitle="The top three daily spikes and what drove them." />
              <LinearGradient
                colors={[colors.gradientStart, colors.gradientEnd] as const}
                style={[styles.analyticsCard, { borderColor: colors.cardBorderSubtle }]}
              >
                <View style={styles.topDaysList}>
                  {topDays.map(day => (
                    <View key={day.dayKey} style={[styles.topDayCard, { backgroundColor: colors.innerCardBg, borderColor: colors.cardBorderSubtle }]}>
                      <View style={styles.topDayHeader}>
                        <View>
                          <Text style={[styles.topDayTitle, { color: colors.textPrimary }]}>{format(day.day, 'MMM d')}</Text>
                          <Text style={[styles.topDayMeta, { color: colors.textSecondary }]}>PKR {Math.round(day.total).toLocaleString()}</Text>
                        </View>
                        <View style={[styles.topDayBadge, { backgroundColor: colors.warningBg }]}>
                          <Flame color={colors.warning} size={14} />
                        </View>
                      </View>
                      <View style={styles.topDayItems}>
                        {day.expenses.slice(0, 3).map(expense => (
                          <TouchableOpacity
                            key={expense.id}
                            style={styles.topDayItemRow}
                            onPress={() => {
                              setEditingExpense(expense);
                              setIsEditModalVisible(true);
                            }}
                          >
                            <Text style={[styles.topDayItemName, { color: colors.textPrimary }]} numberOfLines={1}>{expense.name}</Text>
                            <Text style={[styles.topDayItemAmount, { color: colors.textSecondary }]}>PKR {expense.amount.toLocaleString()}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  ))}
                  {topDays.length === 0 ? <Text style={[styles.emptyText, { color: colors.textTertiary }]}>No standout days available yet.</Text> : null}
                </View>
              </LinearGradient>

              <SectionHeader title="Week-over-Week Comparison" subtitle="Grouped spend bars by week and category." />
              <LinearGradient
                colors={[colors.gradientStart, colors.gradientEnd] as const}
                style={[styles.analyticsCard, { borderColor: colors.cardBorderSubtle }]}
              >
                <View style={styles.legendRow}>
                  {weekCategories.map(category => (
                    <TouchableOpacity
                      key={category}
                      style={[
                        styles.legendPill,
                        { backgroundColor: selectedCategory === category ? `${getCategoryColor(category, colors.accent)}18` : colors.pillBg, borderColor: colors.cardBorderSubtle },
                      ]}
                      onPress={() => setSelectedCategory(current => (current === category ? null : category))}
                    >
                      <View style={[styles.legendDot, { backgroundColor: getCategoryColor(category, colors.accent) }]} />
                      <Text style={[styles.legendText, { color: colors.textSecondary }]}>{category}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.weekChartWrap}>
                    {weekCategoryChart.map(week => (
                      <View key={week.label} style={styles.weekGroup}>
                        <View style={styles.weekBars}>
                          {weekCategories.map(category => {
                            const amount = week.categorySpend[category] || 0;
                            const isMuted = !!selectedCategory && selectedCategory !== category;
                            const barHeight = 22 + (amount / maxWeeklySpend) * 88;
                            return (
                              <View key={category} style={styles.weekBarCol}>
                                <View
                                  style={[
                                    styles.weekBar,
                                    {
                                      height: barHeight,
                                      backgroundColor: getCategoryColor(category, colors.accent),
                                      opacity: isMuted ? 0.28 : 1,
                                    },
                                  ]}
                                />
                              </View>
                            );
                          })}
                        </View>
                        <Text style={[styles.weekLabel, { color: colors.textSecondary }]}>{week.label}</Text>
                        <Text style={[styles.weekRange, { color: colors.textTertiary }]}>{week.startDay}-{week.endDay}</Text>
                      </View>
                    ))}
                  </View>
                </ScrollView>
              </LinearGradient>

              <SectionHeader title="Smart Suggestions" subtitle="Plain-language prompts generated from this month's actual data." />
              <LinearGradient
                colors={[colors.gradientStart, colors.gradientEnd] as const}
                style={[styles.analyticsCard, { borderColor: colors.cardBorderSubtle }]}
              >
                <View style={styles.suggestionList}>
                  {smartSuggestions.map((suggestion, index) => (
                    <View key={`${index}-${suggestion}`} style={[styles.suggestionRow, { backgroundColor: colors.innerCardBg, borderColor: colors.cardBorderSubtle }]}>
                      <View style={[styles.suggestionIcon, { backgroundColor: colors.accentBg }]}>
                        <Sparkles color={colors.accent} size={15} />
                      </View>
                      <Text style={[styles.suggestionText, { color: colors.textSecondary }]}>{suggestion}</Text>
                    </View>
                  ))}
                  {smartSuggestions.length === 0 ? (
                    <View style={[styles.suggestionRow, { backgroundColor: colors.innerCardBg, borderColor: colors.cardBorderSubtle }]}>
                      <View style={[styles.suggestionIcon, { backgroundColor: colors.warningBg }]}>
                        <AlertTriangle color={colors.warning} size={15} />
                      </View>
                      <Text style={[styles.suggestionText, { color: colors.textSecondary }]}>Add a few expenses this month to unlock automated suggestions.</Text>
                    </View>
                  ) : null}
                </View>
              </LinearGradient>
            </View>
          </View>
        </ScreenLayout>
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
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 8,
  },
  monthStrip: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 16,
  },
  eyebrow: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  monthTitle: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 24,
    marginTop: 6,
  },
  monthActions: {
    flexDirection: 'row',
    gap: 10,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  statsGridDesktop: {
    flexWrap: 'nowrap',
  },
  statCard: {
    flex: 1,
    minWidth: 210,
    borderRadius: 22,
    borderWidth: 1,
    padding: 18,
    gap: 10,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  statValue: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 24,
    lineHeight: 30,
  },
  twoColumn: {
    gap: 16,
  },
  twoColumnDesktop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  primaryColumn: {
    flex: 1.1,
  },
  secondaryColumn: {
    flex: 0.9,
  },
  analyticsCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    marginBottom: 10,
  },
  breakdownLayout: {
    gap: 18,
  },
  breakdownLayoutWide: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  donutWrap: {
    width: 190,
    height: 190,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  donutCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  donutCenterLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
  },
  donutCenterValue: {
    fontFamily: 'Outfit_800ExtraBold',
    fontSize: 24,
  },
  breakdownList: {
    flex: 1,
    gap: 10,
  },
  breakdownRow: {
    minHeight: 62,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  breakdownName: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 15,
  },
  breakdownMeta: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    marginTop: 3,
  },
  breakdownAmount: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 16,
  },
  chartScroller: {
    paddingBottom: 8,
  },
  dailyBarsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 4,
  },
  dailyBarTouch: {
    alignItems: 'center',
    width: 24,
  },
  dailyBar: {
    width: 18,
    borderRadius: 9,
    borderWidth: 1,
  },
  dailyBarLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 10,
    marginTop: 8,
  },
  detailPanel: {
    marginTop: 18,
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
  },
  detailPanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  detailTitle: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 16,
  },
  detailSubtitle: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    marginTop: 3,
  },
  dayBadge: {
    borderRadius: 100,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  dayBadgeText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
  },
  detailList: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  detailExpenseName: {
    flex: 1,
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
  },
  detailExpenseAmount: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 14,
  },
  rankList: {
    gap: 4,
  },
  rankRow: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  rankBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankBadgeText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
  },
  rankTitle: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 15,
  },
  rankMeta: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    marginTop: 2,
  },
  rankValue: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 16,
  },
  repeatList: {
    gap: 10,
  },
  repeatRow: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  repeatIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  repeatTitle: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 15,
  },
  repeatMeta: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    marginTop: 4,
  },
  repeatHint: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    marginTop: 6,
  },
  budgetList: {
    gap: 10,
  },
  budgetRow: {
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  budgetRowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  budgetCategory: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 15,
  },
  budgetMeta: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    marginTop: 3,
  },
  budgetInput: {
    width: 96,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
    textAlign: 'right',
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  projectionCard: {
    gap: 10,
  },
  projectionMetric: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
  },
  projectionLabel: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  projectionValue: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 22,
  },
  calloutBox: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    marginTop: 12,
  },
  calloutText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
    lineHeight: 18,
  },
  splitBar: {
    height: 18,
    borderRadius: 999,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  splitFillLeft: {
    height: '100%',
  },
  splitFillRight: {
    height: '100%',
  },
  ratioMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 16,
  },
  ratioMetaItem: {
    flex: 1,
  },
  ratioLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    marginBottom: 5,
  },
  ratioValue: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 18,
  },
  topDaysList: {
    gap: 10,
  },
  topDayCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
  },
  topDayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  topDayTitle: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 16,
  },
  topDayMeta: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    marginTop: 3,
  },
  topDayBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topDayItems: {
    gap: 8,
  },
  topDayItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  topDayItemName: {
    flex: 1,
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
  },
  topDayItemAmount: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 13,
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  legendPill: {
    minHeight: 38,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
  },
  weekChartWrap: {
    flexDirection: 'row',
    gap: 16,
    paddingRight: 8,
  },
  weekGroup: {
    alignItems: 'center',
    minWidth: 92,
  },
  weekBars: {
    height: 120,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    marginBottom: 10,
  },
  weekBarCol: {
    width: 12,
    justifyContent: 'flex-end',
  },
  weekBar: {
    width: 12,
    borderRadius: 8,
  },
  weekLabel: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
  },
  weekRange: {
    fontFamily: 'Inter_500Medium',
    fontSize: 10,
    marginTop: 2,
  },
  suggestionList: {
    gap: 10,
  },
  suggestionRow: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  suggestionIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionText: {
    flex: 1,
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    lineHeight: 20,
  },
  emptyText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    lineHeight: 20,
  },
});

import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  TextInput,
  StatusBar,
  Dimensions
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Calendar as CalendarIcon, ArrowRightCircle, Trash2, CheckCircle2, 
  Settings as SettingsIcon, AlertCircle, Pencil, MoreHorizontal, 
  TrendingUp, X, ChevronLeft, ChevronRight,
  Coffee, Car, Home as HomeIcon, ShoppingBag, Heart, ShoppingBasket
} from 'lucide-react-native';
import { useLedgr } from '../lib/LedgrContext';
import { Budget, ExpenseCategory } from '../lib/store';
import { useThemeColors } from '../lib/ThemeContext';

const CATEGORY_ICONS: Record<string, any> = {
  Food: Coffee,
  Transport: Car,
  Bills: HomeIcon,
  Shopping: ShoppingBag,
  Grocery: ShoppingBasket,
  Health: Heart,
  Other: MoreHorizontal,
};

const CATEGORY_COLORS: Record<string, string> = {
  Food: '#F59E0B',
  Transport: '#3B82F6',
  Bills: '#10B981',
  Shopping: '#EC4899',
  Grocery: '#2DD4BF',
  Health: '#EF4444',
  Other: '#6B7280',
};

export default function MonthEndModal({ visible, data }: { visible: boolean; data: any }) {
  const { resolveMonthEnd, saveRolloverRecovery, budget, budgetHistory, expenses, dismissMonthSummary, showMonthSummary } = useLedgr();
  const navigation = useNavigation<any>();
  const colors = useThemeColors();

  const hasBudget = data?.isReviewMode ? !!data?.budgetSnapshot : true;
  const currentBudget = data?.budgetSnapshot || budget;

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [rolloverCache, setRolloverCache] = useState<number>(0);
  
  const [localTotal, setLocalTotal] = useState<number>(currentBudget.total);

  useEffect(() => {
    if (visible && data) {
      if (data.recoveryState) {
        setStep(data.recoveryState.step);
        setRolloverCache(data.recoveryState.rolloverAmount);
      } else if (data.remaining <= 0) {
        setStep(2);
        setRolloverCache(0);
      } else {
        setStep(1);
        setRolloverCache(0);
      }
      setLocalTotal(currentBudget.total);
    }
  }, [visible, data, currentBudget]);

  const handleStep1Surplus = async (amount: number) => {
    setRolloverCache(amount);
    await saveRolloverRecovery({ step: 2, rolloverAmount: amount });
    setStep(2);
  };

  const handleKeepSame = async () => {
    await resolveMonthEnd(rolloverCache);
  };

  const handleUpdate = async () => {
    await saveRolloverRecovery({ step: 3, rolloverAmount: rolloverCache });
    setStep(3);
  };

  const prevMonth = data?.prevMonth || '';
  const totalBudget = data?.totalBudget || 0;
  const totalSpent = data?.totalSpent || 0;
  const remaining = data?.remaining || 0;
  const isOverspent = remaining <= 0;
  
  const dateObj = prevMonth ? new Date(prevMonth + '-02') : new Date();
  const monthName = dateObj.toLocaleString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();
  const shortMonthName = dateObj.toLocaleString('en-US', { month: 'long' });
  const yearStr = dateObj.getFullYear().toString();
  const daysInMonth = new Date(dateObj.getFullYear(), dateObj.getMonth() + 1, 0).getDate();

  const availableMonths = useMemo(() => {
    return [...new Set(expenses.map(e => e.date.substring(0, 7)))].sort();
  }, [expenses]);

  const handleMonthSwitch = (delta: number) => {
    if (!data?.isReviewMode || availableMonths.length === 0) return;
    const currentIndex = availableMonths.indexOf(prevMonth);
    if (currentIndex === -1) return;
    let newIndex = currentIndex + delta;
    if (newIndex < 0) newIndex = availableMonths.length - 1;
    if (newIndex >= availableMonths.length) newIndex = 0;
    
    showMonthSummary(availableMonths[newIndex]);
  };

  const prevMonthExpenses = useMemo(() => {
    if (!prevMonth) return [];
    return expenses.filter((e: any) => {
      const d = new Date(e.date);
      return d.toISOString().startsWith(prevMonth);
    });
  }, [expenses, prevMonth]);

  // Category breakdown data — bar reflects budget consumption per category
  const categoryBreakdown = useMemo(() => {
    if (prevMonthExpenses.length === 0) return [];
    const catMap: Record<string, number> = {};
    prevMonthExpenses.forEach((e: any) => {
      catMap[e.category] = (catMap[e.category] || 0) + e.amount;
    });
    return Object.entries(catMap)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, amount]) => {
        const allocated = currentBudget.categories?.[cat] || 0;
        const budgetUsagePct = allocated > 0 ? (amount / allocated) * 100 : 0;
        return {
          category: cat,
          amount,
          budgetUsagePct,
          isOver: amount > allocated && allocated > 0,
        };
      });
  }, [prevMonthExpenses, totalSpent, currentBudget]);

  const insights = useMemo(() => {
    if (prevMonthExpenses.length === 0) return [];
    const total = totalSpent;
    const categoryDataMap: Record<string, { total: number }> = {};
    prevMonthExpenses.forEach((e: any) => {
        if (!categoryDataMap[e.category]) categoryDataMap[e.category] = { total: 0 };
        categoryDataMap[e.category].total += e.amount;
    });
    const categoryData = Object.entries(categoryDataMap).sort((a, b) => b[1].total - a[1].total);

    const topCat = categoryData[0];
    const topCatInsight = { id: 'top-cat', title: 'Top Category', value: topCat ? topCat[0] : 'None', sub: topCat ? `${((topCat[1].total / total) * 100).toFixed(0)}% of spend` : 'No data', score: 100, eligible: !!topCat, icon: TrendingUp, color: colors.accent };

    const sortedByAmt = [...prevMonthExpenses].sort((a: any, b: any) => b.amount - a.amount);
    const biggest = sortedByAmt[0];
    const biggestInsight = { id: 'biggest-expense', title: 'Biggest Hit', value: biggest ? `PKR ${biggest.amount.toLocaleString()}` : '0', sub: biggest ? (biggest.name.length > 15 ? biggest.name.substring(0, 15) + '...' : biggest.name) : 'No expenses', score: 95, eligible: !!biggest, icon: AlertCircle, color: colors.danger };

    const spentDays = new Set(prevMonthExpenses.map((e: any) => new Date(e.date).getDate()));
    const noSpendCount = daysInMonth - spentDays.size;
    const noSpendInsight = { id: 'no-spend', title: 'No-Spend Days', value: `${noSpendCount} Days`, sub: noSpendCount >= 5 ? '🧘 Great restraint!' : 'Keep trying!', score: (noSpendCount / daysInMonth) * 100, eligible: noSpendCount >= 5, icon: CalendarIcon, color: colors.success };

    const firstHalfSpend = prevMonthExpenses.filter((e: any) => new Date(e.date).getDate() <= 15).reduce((sum: number, e: any) => sum + e.amount, 0);
    const velocity = total > 0 ? (firstHalfSpend / total) * 100 : 0;
    const velocityInsight = { id: 'velocity', title: 'Spend Velocity', value: `${velocity.toFixed(0)}%`, sub: velocity > 65 ? 'Fast start!' : velocity < 35 ? 'Slow burner' : 'Steady pace', score: Math.abs(50 - velocity) * 2, eligible: total > 0 && (velocity > 65 || velocity < 35), icon: ArrowRightCircle, color: colors.blue };

    const overshootInsight = (() => {
      let maxOvershootCat = null;
      let maxOvershootAmt = 0;
      if (hasBudget) {
        Object.keys(categoryDataMap).forEach(cat => {
          const budgeted = currentBudget.categories[cat] || 0;
          const spent = categoryDataMap[cat].total;
          if (spent > budgeted && (spent - budgeted) > maxOvershootAmt) {
            maxOvershootAmt = spent - budgeted;
            maxOvershootCat = cat;
          }
        });
      }
      return { 
        id: 'overshoot', 
        title: 'Category Overrun', 
        value: maxOvershootCat || 'None', 
        sub: maxOvershootCat ? `+PKR ${maxOvershootAmt.toLocaleString()}` : 'Kept to limits', 
        score: maxOvershootAmt > 0 ? 80 : 0, 
        eligible: maxOvershootAmt > 0, 
        icon: AlertCircle, 
        color: colors.danger 
      };
    })();

    const damageInsight = (() => {
      const dailySpends: Record<number, number> = {};
      prevMonthExpenses.forEach((e: any) => {
        const day = new Date(e.date).getDate();
        dailySpends[day] = (dailySpends[day] || 0) + e.amount;
      });
      const sortedDays = Object.entries(dailySpends).sort((a, b) => b[1] - a[1]);
      const worstDay = sortedDays[0];
      const worstDayPercent = worstDay && total > 0 ? (worstDay[1] / total) * 100 : 0;
      
      return {
        id: 'damage',
        title: 'Spike Day',
        value: worstDay ? `Day ${worstDay[0]}` : 'None',
        sub: worstDayPercent > 0 ? `${worstDayPercent.toFixed(0)}% in 24h` : 'No spikes',
        score: worstDayPercent > 15 ? worstDayPercent * 2 : 0,
        eligible: worstDayPercent > 15,
        icon: AlertCircle,
        color: colors.purple
      };
    })();

    const freqInsight = (() => {
      const catFreq: Record<string, number> = {};
      prevMonthExpenses.forEach((e: any) => {
        catFreq[e.category] = (catFreq[e.category] || 0) + 1;
      });
      const sortedFreq = Object.entries(catFreq).sort((a, b) => b[1] - a[1]);
      const freqCat = sortedFreq[0];
      
      return {
        id: 'frequency',
        title: 'High Frequency',
        value: freqCat ? freqCat[0] : 'None',
        sub: freqCat ? `${freqCat[1]} transactions` : 'No data',
        score: freqCat && freqCat[1] > 10 ? freqCat[1] * 4 : 0,
        eligible: freqCat ? freqCat[1] > 10 : false,
        icon: TrendingUp,
        color: colors.accent
      };
    })();

    const allInsights = [topCatInsight, biggestInsight, noSpendInsight, velocityInsight, overshootInsight, damageInsight, freqInsight];
    
    // Ensure we always have at least top category and biggest expense to fall back on if nothing else is eligible
    topCatInsight.eligible = true;
    biggestInsight.eligible = true;

    // Filter to eligible ones, then sort by score descending
    const eligibleInsights = allInsights.filter(i => i.eligible).sort((a, b) => b.score - a.score);
    
    return eligibleInsights.slice(0, 4);
  }, [prevMonthExpenses, totalSpent, daysInMonth, currentBudget, hasBudget, colors]);

  const handleFinalSave = async () => {
    const updatedBudget = { ...budget, total: localTotal };
    await resolveMonthEnd(rolloverCache, updatedBudget);
    navigation.navigate('Settings');
  };

  if (!data) return null;

  const budgetUsage = hasBudget && totalBudget > 0 ? totalSpent / totalBudget : 0;

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={dismissMonthSummary}>
      <SafeAreaView style={[styles.fullScreen, { backgroundColor: colors.background }]} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={[styles.closeBtn, { backgroundColor: colors.closeBtnBg }]}
            onPress={dismissMonthSummary}
          >
            <X color={colors.textSecondary} size={20} />
          </TouchableOpacity>

          {data?.isReviewMode ? (
            <View style={styles.monthNavRow}>
              <TouchableOpacity 
                onPress={() => handleMonthSwitch(-1)} 
                style={[styles.monthNavBtn, { backgroundColor: colors.surface, borderColor: colors.cardBorderSubtle }]}
              >
                <ChevronLeft size={18} color={colors.textPrimary} />
              </TouchableOpacity>
              <View style={styles.monthTitleBlock}>
                <Text style={[styles.monthTitle, { color: colors.textPrimary }]}>{shortMonthName}</Text>
                <Text style={[styles.yearTitle, { color: colors.textTertiary }]}>{yearStr}</Text>
              </View>
              <TouchableOpacity 
                onPress={() => handleMonthSwitch(1)} 
                style={[styles.monthNavBtn, { backgroundColor: colors.surface, borderColor: colors.cardBorderSubtle }]}
              >
                <ChevronRight size={18} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.monthNavRow}>
              <View style={styles.monthTitleBlock}>
                <Text style={[styles.monthTitle, { color: colors.textPrimary }]}>
                  {step === 3 ? "Next Month's Budget" : shortMonthName}
                </Text>
                {step !== 3 && <Text style={[styles.yearTitle, { color: colors.textTertiary }]}>{yearStr}</Text>}
              </View>
            </View>
          )}

          <View style={{ width: 36 }} />
        </View>

        <KeyboardAwareScrollView 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          extraScrollHeight={120}
          enableOnAndroid={true}
          keyboardOpeningTime={0}
        >
          {prevMonthExpenses.length === 0 ? (
            <View style={styles.emptyContainer}>
              <AlertCircle color={colors.textTertiary} size={48} />
              <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>
                No Data for {monthName}
              </Text>
              <Text style={[styles.emptySub, { color: colors.textTertiary }]}>
                No expenses have been recorded for this month.
              </Text>

              {!data?.isReviewMode && (
                <View style={[styles.actionGrid, { marginTop: 32, width: '100%' }]}>
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.accent }]} onPress={() => handleStep1Surplus(remaining)}>
                    <ArrowRightCircle color={colors.background} size={20} />
                    <View style={styles.actionTextContainer}>
                      <Text style={[styles.actionTitle, { color: colors.background }]}>Roll Over</Text>
                      <Text style={[styles.actionSub, { color: colors.background, opacity: 0.7 }]}>Add to next month's budget</Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.closeBtnBg, borderWidth: 1, borderColor: colors.cardBorder }]} onPress={() => handleStep1Surplus(0)}>
                    <Trash2 color={colors.textPrimary} size={20} />
                    <View style={styles.actionTextContainer}>
                      <Text style={[styles.actionTitle, { color: colors.textPrimary }]}>Discard</Text>
                      <Text style={[styles.actionSub, { color: colors.textSecondary }]}>Start fresh with base budget</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ) : (
            <>
              {step !== 3 && (
                <>
                  {/* Budget / Spent / Left — prominent card */}
                  <LinearGradient 
                    colors={[colors.gradientStart, colors.gradientEnd]} 
                    style={[styles.budgetCard, { borderColor: colors.cardBorder }]}
                  >
                    <View style={styles.budgetCardRow}>
                      <View style={styles.budgetStatBlock}>
                        <Text style={[styles.budgetStatLabel, { color: colors.textTertiary }]}>BUDGET</Text>
                        <Text style={[styles.budgetStatValue, { color: colors.textPrimary }]}>
                          {hasBudget ? `PKR ${totalBudget.toLocaleString()}` : '--'}
                        </Text>
                      </View>
                      <View style={[styles.budgetStatDivider, { backgroundColor: colors.divider }]} />
                      <View style={styles.budgetStatBlock}>
                        <Text style={[styles.budgetStatLabel, { color: colors.textTertiary }]}>SPENT</Text>
                        <Text style={[styles.budgetStatValue, { color: colors.textPrimary }]}>
                          PKR {totalSpent.toLocaleString()}
                        </Text>
                      </View>
                      <View style={[styles.budgetStatDivider, { backgroundColor: colors.divider }]} />
                      <View style={styles.budgetStatBlock}>
                        <Text style={[styles.budgetStatLabel, { color: hasBudget ? (isOverspent ? colors.danger : colors.textTertiary) : colors.textTertiary }]}>
                          {hasBudget ? (isOverspent ? 'DEFICIT' : 'LEFT') : 'BALANCE'}
                        </Text>
                        <Text style={[styles.budgetStatValue, { color: hasBudget ? (isOverspent ? colors.danger : colors.accent) : colors.textPrimary }]}>
                          {hasBudget ? `PKR ${Math.abs(remaining).toLocaleString()}` : '--'}
                        </Text>
                      </View>
                    </View>
                    {hasBudget && (
                      <View style={[styles.budgetProgressBg, { backgroundColor: colors.divider }]}>
                        <View style={[
                          styles.budgetProgressFill, 
                          { 
                            width: `${Math.min(100, budgetUsage * 100)}%`, 
                            backgroundColor: isOverspent ? colors.danger : colors.accent 
                          }
                        ]} />
                      </View>
                    )}
                  </LinearGradient>

                  {/* Category Breakdown */}
                  {categoryBreakdown.length > 0 && (
                    <View style={styles.sectionBlock}>
                      <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>CATEGORY BREAKDOWN</Text>
                      <View style={[styles.breakdownCard, { backgroundColor: colors.surface, borderColor: colors.cardBorderSubtle }]}>
                        {categoryBreakdown.map((item, index) => {
                          const Icon = CATEGORY_ICONS[item.category] || MoreHorizontal;
                          const catColor = CATEGORY_COLORS[item.category] || '#6B7280';
                          const barPct = Math.min(100, item.budgetUsagePct);
                          const barColor = item.isOver ? colors.danger : catColor;
                          return (
                            <View key={item.category} style={[styles.breakdownRow, index < categoryBreakdown.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.divider + '30' }]}>
                              <View style={[styles.breakdownIconBox, { backgroundColor: `${catColor}15` }]}>
                                <Icon color={catColor} size={18} />
                              </View>
                              <View style={styles.breakdownInfo}>
                                <Text style={[styles.breakdownCatName, { color: colors.textPrimary }]}>{item.category}</Text>
                                <View style={styles.breakdownBarRow}>
                                  <View style={[styles.breakdownBarBg, { backgroundColor: colors.divider }]}>
                                    <View style={[styles.breakdownBarFill, { width: `${barPct}%`, backgroundColor: barColor }]} />
                                  </View>
                                  <Text style={[styles.breakdownBarLabel, { color: item.isOver ? colors.danger : colors.textTertiary }]}>
                                    {item.budgetUsagePct.toFixed(0)}%
                                  </Text>
                                </View>
                              </View>
                              <Text style={[styles.breakdownAmount, { color: colors.textPrimary }]}>
                                PKR {item.amount.toLocaleString()}
                              </Text>
                            </View>
                          );
                        })}
                      </View>
                    </View>
                  )}
                </>
              )}

              {(step === 1 || data?.isReviewMode) && (
                <View style={styles.stepContainer}>
                  {(!isOverspent || data?.isReviewMode) && insights.length > 0 && (
                    <View style={styles.sectionBlock}>
                      <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>MONTHLY INSIGHTS</Text>
                      <View style={styles.insightsGrid}>
                        {insights.map((insight) => (
                          <View key={insight.id} style={[styles.insightCell, { backgroundColor: colors.surface, borderColor: colors.cardBorderSubtle }]}>
                            <View style={[styles.insightAccent, { backgroundColor: insight.color }]} />
                            <View style={styles.insightCellInner}>
                              <View style={styles.insightTopRow}>
                                <Text style={[styles.insightTitle, { color: colors.textTertiary }]}>{insight.title}</Text>
                                <View style={[styles.insightIconCircle, { backgroundColor: `${insight.color}18` }]}>
                                  <insight.icon color={insight.color} size={12} />
                                </View>
                              </View>
                              <Text style={[styles.insightValue, { color: colors.textPrimary }]} numberOfLines={1} adjustsFontSizeToFit>{insight.value}</Text>
                              <Text style={[styles.insightSub, { color: colors.textTertiary }]}>{insight.sub}</Text>
                            </View>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {!data?.isReviewMode && !isOverspent && (
                    <>
                      <Text style={[styles.promptText, { color: colors.textPrimary }]}>
                        What would you like to do with your PKR {remaining.toLocaleString()} remaining?
                      </Text>
                      <View style={styles.actionGrid}>
                        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.accent }]} onPress={() => handleStep1Surplus(remaining)}>
                          <ArrowRightCircle color={colors.background} size={20} />
                          <View style={styles.actionTextContainer}>
                            <Text style={[styles.actionTitle, { color: colors.background }]}>Roll Over</Text>
                            <Text style={[styles.actionSub, { color: colors.background, opacity: 0.7 }]}>Add to next month's budget</Text>
                          </View>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.closeBtnBg, borderWidth: 1, borderColor: colors.cardBorder }]} onPress={() => handleStep1Surplus(0)}>
                          <Trash2 color={colors.textPrimary} size={20} />
                          <View style={styles.actionTextContainer}>
                            <Text style={[styles.actionTitle, { color: colors.textPrimary }]}>Discard</Text>
                            <Text style={[styles.actionSub, { color: colors.textSecondary }]}>Start fresh with base budget</Text>
                          </View>
                        </TouchableOpacity>
                      </View>
                    </>
                  )}
                  {data?.isReviewMode && (
                    <Text style={[styles.disclaimerText, { color: colors.textTertiary }]}>
                      Viewing historical insights. Budgets and rollovers cannot be modified from this view.
                    </Text>
                  )}
                </View>
              )}

              {step === 2 && !data?.isReviewMode && (
                <View style={styles.stepContainer}>
                  {isOverspent && (
                    <View style={[styles.deficitNotice, { backgroundColor: colors.danger + '15' }]}>
                      <AlertCircle color={colors.danger} size={20} />
                      <Text style={[styles.deficitNoticeText, { color: colors.danger }]}>
                        You overspent by PKR {Math.abs(remaining).toLocaleString()} last month.
                      </Text>
                    </View>
                  )}
                  <Text style={[styles.promptText, { color: colors.textPrimary }]}>Use the same budget for next month or set a new one?</Text>
                  <View style={styles.actionGrid}>
                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.success }]} onPress={handleKeepSame}>
                      <CheckCircle2 color={colors.background} size={20} />
                      <View style={styles.actionTextContainer}>
                        <Text style={[styles.actionTitle, { color: colors.background }]}>Keep Same</Text>
                        <Text style={[styles.actionSub, { color: colors.background, opacity: 0.7 }]}>Use existing base budget</Text>
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.closeBtnBg, borderWidth: 1, borderColor: colors.cardBorder }]} onPress={handleUpdate}>
                      <SettingsIcon color={colors.textPrimary} size={20} />
                      <View style={styles.actionTextContainer}>
                        <Text style={[styles.actionTitle, { color: colors.textPrimary }]}>Update</Text>
                        <Text style={[styles.actionSub, { color: colors.textSecondary }]}>Change base budget allocation</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {step === 3 && !data?.isReviewMode && (
                <View style={styles.stepContainer}>
                  <Text style={[styles.promptText, { color: colors.textPrimary }]}>Set your new base budget for the month</Text>
                  <View style={[styles.budgetMainCard, { backgroundColor: colors.innerCardBg, borderColor: colors.divider }]}>
                    <View style={styles.allocationHeader}>
                      <Text style={[styles.allocationLabel, { color: colors.textTertiary }]}>BASE MONTHLY BUDGET</Text>
                    </View>
                    <View style={[styles.totalInputWrapper, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
                      <View style={styles.totalInputRow}>
                        <Text style={[styles.totalCurrency, { color: colors.accent }]}>PKR</Text>
                        <TextInput
                          style={[styles.totalInput, { color: colors.textPrimary }]}
                          keyboardType="numeric"
                          value={localTotal.toString()}
                          onChangeText={(val) => setLocalTotal(parseInt(val) || 0)}
                        />
                        <Pencil size={20} color={colors.accent} style={{ marginLeft: 12 }} />
                      </View>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[styles.mainSaveButton, { backgroundColor: colors.saveBtnBg, opacity: localTotal > 0 ? 1 : 0.6 }]}
                    onPress={handleFinalSave}
                    disabled={localTotal <= 0}
                  >
                    <Text style={[styles.mainSaveText, { color: colors.saveBtnText }]}>Save & Allocate Categories</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
        </KeyboardAwareScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fullScreen: { flex: 1 },
  
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 16, 
    paddingVertical: 8 
  },
  closeBtn: { 
    width: 32, 
    height: 32, 
    borderRadius: 16, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  monthNavRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12 
  },
  monthNavBtn: { 
    width: 32, 
    height: 32, 
    borderRadius: 10, 
    borderWidth: 1, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  monthTitleBlock: { alignItems: 'center' },
  monthTitle: { fontFamily: 'Outfit_800ExtraBold', fontSize: 18 },
  yearTitle: { fontFamily: 'Inter_500Medium', fontSize: 10, marginTop: -1 },

  scrollContent: { paddingHorizontal: 16, paddingBottom: 16, flexGrow: 1 },

  // Empty state
  emptyContainer: { alignItems: 'center', paddingVertical: 40 },
  emptyTitle: { fontFamily: 'Outfit_600SemiBold', fontSize: 16, marginTop: 12, textAlign: 'center' },
  emptySub: { fontFamily: 'Inter_500Medium', fontSize: 12, marginTop: 6, textAlign: 'center', paddingHorizontal: 20 },

  // Budget summary card
  budgetCard: { 
    borderRadius: 16, 
    padding: 14, 
    borderWidth: 1, 
    marginBottom: 12 
  },
  budgetCardRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 10 
  },
  budgetStatBlock: { flex: 1, alignItems: 'center' },
  budgetStatLabel: { fontFamily: 'Inter_700Bold', fontSize: 9, letterSpacing: 0.8, marginBottom: 2 },
  budgetStatValue: { fontFamily: 'Outfit_600SemiBold', fontSize: 14 },
  budgetStatDivider: { width: 1, height: 22, opacity: 0.3 },
  budgetProgressBg: { height: 3, borderRadius: 2, overflow: 'hidden' },
  budgetProgressFill: { height: '100%', borderRadius: 2 },

  // Section
  sectionBlock: { marginBottom: 10 },
  sectionLabel: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.5, marginBottom: 6, marginLeft: 2 },

  // Category breakdown — readable, properly sized
  breakdownCard: { borderRadius: 16, paddingHorizontal: 12, paddingVertical: 4, borderWidth: 1 },
  breakdownRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  breakdownIconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  breakdownInfo: { flex: 1, marginRight: 10 },
  breakdownCatName: { fontFamily: 'Outfit_600SemiBold', fontSize: 14, marginBottom: 4 },
  breakdownBarRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  breakdownBarBg: { flex: 1, height: 5, borderRadius: 3, overflow: 'hidden' },
  breakdownBarFill: { height: '100%', borderRadius: 3 },
  breakdownBarLabel: { fontFamily: 'Inter_700Bold', fontSize: 10, minWidth: 30, textAlign: 'right' },
  breakdownAmount: { fontFamily: 'Outfit_700Bold', fontSize: 14 },

  // Insights 2x2 grid — premium card layout
  insightsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  insightCell: { 
    width: '48%', 
    borderRadius: 14, 
    borderWidth: 1,
    overflow: 'hidden',
    flexDirection: 'row'
  },
  insightAccent: { width: 4 },
  insightCellInner: { 
    flex: 1, 
    paddingVertical: 12, 
    paddingHorizontal: 11, 
    justifyContent: 'center' 
  },
  insightTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  insightIconCircle: { width: 22, height: 22, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  insightTitle: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 0.5, textTransform: 'uppercase' },
  insightValue: { fontFamily: 'Outfit_800ExtraBold', fontSize: 19, marginBottom: 2 },
  insightSub: { fontFamily: 'Inter_500Medium', fontSize: 10, lineHeight: 14 },
  
  // Steps
  stepContainer: { marginTop: 2 },
  promptText: { fontFamily: 'Outfit_600SemiBold', fontSize: 13, lineHeight: 18, marginBottom: 10, textAlign: 'center' },
  
  actionGrid: { gap: 8 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 16, gap: 10 },
  actionTextContainer: { flex: 1 },
  actionTitle: { fontFamily: 'Outfit_800ExtraBold', fontSize: 13 },
  actionSub: { fontFamily: 'Inter_500Medium', fontSize: 9, marginTop: 1 },
  
  deficitNotice: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 12, padding: 10, borderRadius: 12 },
  deficitNoticeText: { fontFamily: 'Inter_700Bold', fontSize: 12 },

  disclaimerText: { fontFamily: 'Inter_500Medium', fontSize: 10, textAlign: 'center', marginTop: 12, paddingHorizontal: 12 },

  budgetMainCard: { padding: 12, borderRadius: 16, borderWidth: 1, marginBottom: 14 },
  allocationHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  allocationLabel: { fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 1.5 },
  totalInputWrapper: { borderRadius: 16, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, minHeight: 52, justifyContent: 'center' },
  totalInputRow: { flexDirection: 'row', alignItems: 'center' },
  totalCurrency: { fontSize: 14, fontFamily: 'Outfit_600SemiBold', marginRight: 10 },
  totalInput: { fontSize: 18, fontFamily: 'Outfit_600SemiBold', flex: 1, height: 36, padding: 0, textAlignVertical: 'center' },
  
  mainSaveButton: { borderRadius: 16, height: 48, alignItems: 'center', justifyContent: 'center', marginTop: 6, marginBottom: 12 },
  mainSaveText: { fontFamily: 'Outfit_800ExtraBold', fontSize: 14 }
});
import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  TextInput 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { LinearGradient } from 'expo-linear-gradient';
import { Calendar as CalendarIcon, ArrowRightCircle, Trash2, CheckCircle2, Settings as SettingsIcon, AlertCircle, Pencil, MoreHorizontal, TrendingUp, X } from 'lucide-react-native';
import { useLedgr } from '../lib/LedgrContext';
import { Budget } from '../lib/store';
import { useThemeColors } from '../lib/ThemeContext';

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

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <View style={styles.container}>
          <LinearGradient
            colors={[colors.modalGradientStart, colors.modalGradientEnd] as const}
            style={[styles.modalContent, { borderColor: colors.cardBorder }]}
          >
            <View style={styles.header}>
              {data?.isReviewMode ? (
                <View style={[styles.titleRow, { flex: 1, justifyContent: 'center' }]}>
                  <TouchableOpacity onPress={() => handleMonthSwitch(-1)} style={{ padding: 8 }}>
                    <Text style={{ color: colors.accent, fontFamily: 'Outfit_800ExtraBold', fontSize: 16 }}>{"<"}</Text>
                  </TouchableOpacity>
                  <CalendarIcon color={colors.accent} size={20} />
                  <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
                    {monthName}
                  </Text>
                  <TouchableOpacity onPress={() => handleMonthSwitch(1)} style={{ padding: 8 }}>
                    <Text style={{ color: colors.accent, fontFamily: 'Outfit_800ExtraBold', fontSize: 16 }}>{">"}</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.titleRow}>
                  <CalendarIcon color={colors.accent} size={20} />
                  <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
                    {step === 3 ? "Next Month's Budget" : "Month Summary"}
                  </Text>
                </View>
              )}
              <TouchableOpacity 
                style={{ position: 'absolute', right: 0, padding: 4 }}
                onPress={dismissMonthSummary}
              >
                <X color={colors.textTertiary} size={24} />
              </TouchableOpacity>
            </View>

            <KeyboardAwareScrollView 
              showsVerticalScrollIndicator={false} 
              style={{ flexShrink: 1 }}
              contentContainerStyle={{ paddingBottom: 16 }}
            >
              {prevMonthExpenses.length === 0 ? (
                <View style={[styles.stepContainer, { alignItems: 'center', paddingVertical: 40 }]}>
                    <AlertCircle color={colors.textTertiary} size={48} />
                    <Text style={{ fontFamily: 'Outfit_600SemiBold', fontSize: 18, color: colors.textSecondary, marginTop: 16, textAlign: 'center' }}>
                      No Data for {monthName}
                    </Text>
                    <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 14, color: colors.textTertiary, marginTop: 8, textAlign: 'center', paddingHorizontal: 20 }}>
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
                      <View style={[styles.statusBanner, isOverspent ? { backgroundColor: colors.dangerBg, borderColor: colors.danger + '30' } : { backgroundColor: colors.accentBg, borderColor: colors.accent + '30' }]}>
                        <View style={styles.bannerLeft}>
                          <Text style={[styles.statusLabel, { color: isOverspent ? colors.danger : colors.accent }]}>{monthName}</Text>
                          <Text style={[styles.statusThreshold, { color: colors.textTertiary }]}>Monthly Recap</Text>
                        </View>
                      </View>

                      <View style={[styles.statsOverview, { backgroundColor: colors.surface, borderColor: colors.cardBorderSubtle }]}>
                        <View style={styles.statBox}>
                          <Text style={[styles.statBoxLabel, { color: colors.textTertiary }]}>BUDGET</Text>
                          <Text style={[styles.statBoxValue, { color: colors.textPrimary }]}>{hasBudget ? `PKR ${totalBudget.toLocaleString()}` : '--'}</Text>
                        </View>
                        <View style={[styles.statBoxDivider, { backgroundColor: colors.divider }]} />
                        <View style={styles.statBox}>
                          <Text style={[styles.statBoxLabel, { color: colors.textTertiary }]}>SPENT</Text>
                          <Text style={[styles.statBoxValue, { color: colors.textPrimary }]}>PKR {totalSpent.toLocaleString()}</Text>
                        </View>
                        <View style={[styles.statBoxDivider, { backgroundColor: colors.divider }]} />
                        <View style={styles.statBox}>
                          <Text style={[styles.statBoxLabel, { color: hasBudget ? (isOverspent ? colors.danger : colors.textTertiary) : colors.textTertiary }]}>
                            {hasBudget ? (isOverspent ? 'DEFICIT' : 'LEFT') : 'BALANCE'}
                          </Text>
                          <Text style={[styles.statBoxValue, { color: hasBudget ? (isOverspent ? colors.danger : colors.accent) : colors.textPrimary }]}>
                            {hasBudget ? `PKR ${Math.abs(remaining).toLocaleString()}` : '--'}
                          </Text>
                        </View>
                      </View>
                    </>
                  )}

                  {(step === 1 || data?.isReviewMode) && (
                    <View style={[styles.stepContainer, data?.isReviewMode && { marginTop: 12 }]}>
                        {(!isOverspent || data?.isReviewMode) && (
                          <View style={[styles.insightsSection, { backgroundColor: colors.innerCardBg, borderColor: colors.divider }]}>
                            <Text style={[styles.insightHeader, { color: colors.textTertiary }]}>MONTHLY INSIGHTS</Text>
                            {insights.map((insight) => (
                              <View key={insight.id} style={styles.insightRow}>
                                <View style={[styles.insightIconCircle, { backgroundColor: `${insight.color}15` }]}>
                                  <insight.icon color={insight.color} size={14} />
                                </View>
                                <View style={styles.insightContent}>
                                  <Text style={[styles.insightTitle, { color: colors.textPrimary }]}>{insight.title}</Text>
                                  <Text style={[styles.insightValue, { color: colors.textSecondary }]}>
                                    {insight.value} — {insight.sub}
                                  </Text>
                                </View>
                              </View>
                            ))}
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
                        <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.textTertiary, textAlign: 'center', marginTop: 16, marginBottom: 8, paddingHorizontal: 16 }}>
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
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  container: { width: '100%', maxHeight: '95%' },
  modalContent: { borderRadius: 32, padding: 20, borderWidth: 1, flexShrink: 1 },
  header: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerTitle: { fontFamily: 'Outfit_700Bold', fontSize: 16 },
  
  statusBanner: { padding: 10, borderRadius: 16, borderWidth: 1, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bannerLeft: { flex: 1 },
  statusLabel: { fontFamily: 'Outfit_800ExtraBold', fontSize: 18, letterSpacing: 1 },
  statusThreshold: { fontFamily: 'Inter_500Medium', fontSize: 10, marginTop: 2 },
  
  statsOverview: { flexDirection: 'row', borderRadius: 16, padding: 12, marginBottom: 12, borderWidth: 1, justifyContent: 'space-between', alignItems: 'center' },
  statBox: { flex: 1, alignItems: 'center' },
  statBoxLabel: { fontFamily: 'Inter_700Bold', fontSize: 8, letterSpacing: 0.5, marginBottom: 2 },
  statBoxValue: { fontFamily: 'Outfit_600SemiBold', fontSize: 13 },
  statBoxDivider: { width: 1, height: 16 },

  insightsSection: { marginBottom: 12, borderRadius: 20, padding: 12, borderWidth: 1 },
  insightHeader: { fontFamily: 'Inter_700Bold', fontSize: 9, letterSpacing: 1.5, marginBottom: 10 },
  insightRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  insightIconCircle: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  insightContent: { flex: 1 },
  insightTitle: { fontFamily: 'Outfit_600SemiBold', fontSize: 13 },
  insightValue: { fontFamily: 'Inter_500Medium', fontSize: 11, lineHeight: 16, marginTop: 1 },
  
  stepContainer: { marginTop: 0 },
  promptText: { fontFamily: 'Outfit_600SemiBold', fontSize: 14, lineHeight: 20, marginBottom: 8, textAlign: 'center' },
  
  actionGrid: { gap: 8 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 20, gap: 10 },
  actionTextContainer: { flex: 1 },
  actionTitle: { fontFamily: 'Outfit_800ExtraBold', fontSize: 14 },
  actionSub: { fontFamily: 'Inter_500Medium', fontSize: 9, marginTop: 1 },
  
  deficitNotice: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 20, padding: 12, borderRadius: 16 },
  deficitNoticeText: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },

  budgetMainCard: { padding: 16, borderRadius: 24, borderWidth: 1, marginBottom: 20 },
  allocationHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  allocationLabel: { fontSize: 9, fontFamily: 'Inter_700Bold', letterSpacing: 1.5 },
  totalInputWrapper: { borderRadius: 20, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, minHeight: 64, justifyContent: 'center' },
  totalInputRow: { flexDirection: 'row', alignItems: 'center' },
  totalCurrency: { fontSize: 16, fontFamily: 'Outfit_600SemiBold', marginRight: 12 },
  totalInput: { fontSize: 20, fontFamily: 'Outfit_600SemiBold', flex: 1, height: 40, padding: 0, textAlignVertical: 'center' },
  
  mainSaveButton: { borderRadius: 20, height: 56, alignItems: 'center', justifyContent: 'center', marginTop: 8, marginBottom: 16 },
  mainSaveText: { fontFamily: 'Outfit_800ExtraBold', fontSize: 16 }
});
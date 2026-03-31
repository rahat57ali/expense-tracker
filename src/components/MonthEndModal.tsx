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
import { Calendar as CalendarIcon, ArrowRightCircle, Trash2, CheckCircle2, Settings as SettingsIcon, AlertCircle, Pencil, MoreHorizontal, TrendingUp } from 'lucide-react-native';
import { useLedgr } from '../lib/LedgrContext';
import { Budget } from '../lib/store';

export default function MonthEndModal({ visible, data }: { visible: boolean; data: any }) {
  const { resolveMonthEnd, saveRolloverRecovery, budget, expenses } = useLedgr();
  const navigation = useNavigation<any>();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [rolloverCache, setRolloverCache] = useState<number>(0);
  
  const [localTotal, setLocalTotal] = useState<number>(budget.total);

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
      // Always pull the active budget total
      setLocalTotal(budget.total);
    }
  }, [visible, data, budget]);

  // Step 1 Handlers
  const handleStep1Surplus = async (amount: number) => {
    setRolloverCache(amount);
    await saveRolloverRecovery({ step: 2, rolloverAmount: amount });
    setStep(2);
  };

  // Step 2 Handlers
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
    
    // Category Data
    const categoryDataMap: Record<string, { total: number }> = {};
    prevMonthExpenses.forEach((e: any) => {
        if (!categoryDataMap[e.category]) categoryDataMap[e.category] = { total: 0 };
        categoryDataMap[e.category].total += e.amount;
    });
    const categoryData = Object.entries(categoryDataMap).sort((a, b) => b[1].total - a[1].total);

    // 1. Top Category
    const topCat = categoryData[0];
    const topCatInsight = {
      id: 'top-cat',
      title: 'Top Category',
      value: topCat ? topCat[0] : 'None',
      sub: topCat ? `${((topCat[1].total / total) * 100).toFixed(0)}% of spend` : 'No data',
      score: 100,
      eligible: !!topCat,
      icon: TrendingUp,
      color: '#00F0FF'
    };

    // 2. Biggest Expense
    const sortedByAmt = [...prevMonthExpenses].sort((a: any, b: any) => b.amount - a.amount);
    const biggest = sortedByAmt[0];
    const biggestInsight = {
      id: 'biggest-expense',
      title: 'Biggest Hit',
      value: biggest ? `PKR ${biggest.amount.toLocaleString()}` : '0',
      sub: biggest ? (biggest.name.length > 15 ? biggest.name.substring(0, 15) + '...' : biggest.name) : 'No expenses',
      score: 95,
      eligible: !!biggest,
      icon: AlertCircle,
      color: '#EF4444'
    };

    // 3. No-Spend Days
    const spentDays = new Set(prevMonthExpenses.map((e: any) => new Date(e.date).getDate()));
    const noSpendCount = daysInMonth - spentDays.size;
    const noSpendInsight = {
      id: 'no-spend',
      title: 'No-Spend Days',
      value: `${noSpendCount} Days`,
      sub: noSpendCount >= 5 ? '🧘 Great restraint!' : 'Keep trying!',
      score: (noSpendCount / daysInMonth) * 100,
      eligible: noSpendCount >= 5,
      icon: CalendarIcon,
      color: '#10B981'
    };

    // 4. Spending Velocity
    const firstHalfSpend = prevMonthExpenses
      .filter((e: any) => new Date(e.date).getDate() <= 15)
      .reduce((sum: number, e: any) => sum + e.amount, 0);
    const velocity = total > 0 ? (firstHalfSpend / total) * 100 : 0;
    const velocityInsight = {
      id: 'velocity',
      title: 'Spend Velocity',
      value: `${velocity.toFixed(0)}%`,
      sub: velocity > 65 ? 'Fast start!' : velocity < 35 ? 'Slow burner' : 'Steady pace',
      score: Math.abs(50 - velocity) * 2,
      eligible: total > 0 && (velocity > 65 || velocity < 35),
      icon: ArrowRightCircle,
      color: '#3B82F6'
    };

    // 5. Category Overshoot
    let biggestOvershoot = { cat: '', pct: 0 };
    Object.entries(budget.categories).forEach(([cat, limit]) => {
      const limitNum = limit as number;
      const spent = (categoryDataMap[cat])?.total || 0;
      if (limitNum > 0 && spent > limitNum) {
        const overshoot = ((spent - limitNum) / limitNum) * 100;
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
      icon: AlertCircle,
      color: '#EF4444'
    };

    // 6. Single Day Damage
    const dayTotals: Record<number, number> = {};
    prevMonthExpenses.forEach((e: any) => {
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
      icon: AlertCircle,
      color: '#EC4899'
    };

    // 7. Most Frequent
    const frequencies: Record<string, number> = {};
    prevMonthExpenses.forEach((e: any) => {
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
      icon: CheckCircle2,
      color: '#2DD4BF'
    };

    const allInsights = [topCatInsight, biggestInsight, noSpendInsight, velocityInsight, overshootInsight, damageInsight, freqInsight];
    
    const selected = [topCatInsight, biggestInsight];
    const pool = allInsights.filter(i => !selected.some(s => s.id === i.id) && i.eligible)
      .sort((a,b) => b.score - a.score);
    
    selected.push(...pool);
    
    if (selected.length < 4) {
       const priorityFillers = ['no-spend', 'frequency'];
       for (const id of priorityFillers) {
          const found = allInsights.find(i => i.id === id && !selected.some(s => s.id === i.id));
          if (found && selected.length < 4) selected.push(found);
       }
       if (selected.length < 4) {
          const rest = allInsights.filter(i => !selected.some(s => s.id === i.id))
            .sort((a,b) => b.score - a.score);
          selected.push(...rest.slice(0, 4 - selected.length));
       }
    }

    return selected.slice(0, 4);
  }, [prevMonthExpenses, totalSpent, daysInMonth, budget]);

  const handleFinalSave = async () => {
    // Preserve existing categories, just update total
    const updatedBudget = { ...budget, total: localTotal };
    await resolveMonthEnd(rolloverCache, updatedBudget);
    navigation.navigate('Settings');
  };

  if (!data) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <LinearGradient colors={['#1A1A1A', '#0A0A0A']} style={styles.modalContent}>
            
            <View style={styles.header}>
              <View style={styles.titleRow}>
                <CalendarIcon color="#00F0FF" size={20} />
                <Text style={styles.headerTitle}>
                  {step === 3 ? "Next Month's Budget" : "Month Summary"}
                </Text>
              </View>
            </View>

            <KeyboardAwareScrollView 
              showsVerticalScrollIndicator={false} 
              style={{ flexShrink: 1 }}
              contentContainerStyle={{ paddingBottom: 16 }}
            >
              
              {/* Common Header: Month & Stats (Hidden in Step 3 for space) */}
              {step !== 3 && (() => {
                return (
                  <>
                    <View style={[styles.statusBanner, isOverspent && styles.statusBannerOverspent]}>
                      <View style={styles.bannerLeft}>
                        <Text style={[styles.statusLabel, isOverspent && styles.statusLabelOverspent]}>{monthName}</Text>
                        <Text style={styles.statusThreshold}>Monthly Recap</Text>
                      </View>
                    </View>

                    <View style={styles.statsOverview}>
                      <View style={styles.statBox}>
                        <Text style={styles.statBoxLabel}>BUDGET</Text>
                        <Text style={styles.statBoxValue}>PKR {totalBudget.toLocaleString()}</Text>
                      </View>
                      <View style={styles.statBoxDivider} />
                      <View style={styles.statBox}>
                        <Text style={styles.statBoxLabel}>SPENT</Text>
                        <Text style={styles.statBoxValue}>PKR {totalSpent.toLocaleString()}</Text>
                      </View>
                      <View style={styles.statBoxDivider} />
                      <View style={[styles.statBox]}>
                        <Text style={[styles.statBoxLabel, isOverspent && { color: '#EF4444' }]}>
                          {isOverspent ? 'DEFICIT' : 'LEFT'}
                        </Text>
                        <Text style={[styles.statBoxValue, { color: isOverspent ? '#EF4444' : '#00F0FF' }]}>
                          PKR {Math.abs(remaining).toLocaleString()}
                        </Text>
                      </View>
                    </View>
                  </>
                );
              })()}

              {/* STEP 1 */}
              {step === 1 && !isOverspent && (
                <View style={styles.stepContainer}>
                    <View style={styles.insightsSection}>
                      <Text style={styles.insightHeader}>MONTHLY INSIGHTS</Text>
                      
                      {insights.length > 0 ? (
                        <>
                          {insights.map((insight) => (
                            <View key={insight.id} style={styles.insightRow}>
                              <View style={[styles.insightIconCircle, { backgroundColor: `${insight.color}15` }]}>
                                <insight.icon color={insight.color} size={14} />
                              </View>
                              <View style={styles.insightContent}>
                                <Text style={styles.insightTitle}>{insight.title}</Text>
                                <Text style={styles.insightValue}>
                                  {insight.value} — {insight.sub}
                                </Text>
                              </View>
                            </View>
                          ))}
                        </>
                      ) : (
                        <View style={styles.emptyInsights}>
                          <MoreHorizontal color="#606060" size={32} />
                          <Text style={styles.emptyInsightsText}>No active spending days recorded</Text>
                        </View>
                      )}
                    </View>

                  <Text style={styles.promptText}>
                    What would you like to do with your PKR {remaining.toLocaleString()} remaining?
                  </Text>
                  <View style={styles.actionGrid}>
                    <TouchableOpacity style={[styles.actionBtn, styles.btnRollOver]} onPress={() => handleStep1Surplus(remaining)}>
                      <ArrowRightCircle color="#0A0A0A" size={20} />
                      <View style={styles.actionTextContainer}>
                        <Text style={styles.actionTitleObj_dark}>Roll Over</Text>
                        <Text style={styles.actionSub_dark}>Add to next month's budget</Text>
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionBtn, styles.btnDiscard]} onPress={() => handleStep1Surplus(0)}>
                      <Trash2 color="#FFFFFF" size={20} />
                      <View style={styles.actionTextContainer}>
                        <Text style={styles.actionTitleObj_light}>Discard</Text>
                        <Text style={styles.actionSub_light}>Start fresh with base budget</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* STEP 2 */}
              {step === 2 && (
                <View style={styles.stepContainer}>
                  {isOverspent && (
                    <View style={styles.deficitNotice}>
                      <AlertCircle color="#EF4444" size={20} />
                      <Text style={styles.deficitNoticeText}>
                        You overspent by PKR {Math.abs(remaining).toLocaleString()} last month.
                      </Text>
                    </View>
                  )}

                  <Text style={styles.promptText}>
                    Use the same budget for next month or set a new one?
                  </Text>
                  
                  {isOverspent && (
                    <Text style={styles.nudgeText}>
                      Consider increasing your budget based on last month's spending.
                    </Text>
                  )}

                  <View style={styles.actionGrid}>
                    <TouchableOpacity style={[styles.actionBtn, styles.btnKeep]} onPress={handleKeepSame}>
                      <CheckCircle2 color="#0A0A0A" size={20} />
                      <View style={styles.actionTextContainer}>
                        <Text style={styles.actionTitleObj_dark}>Keep Same</Text>
                        <Text style={styles.actionSub_dark}>Use existing base budget</Text>
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.actionBtn, styles.btnUpdate]} onPress={handleUpdate}>
                      <SettingsIcon color="#FFFFFF" size={20} />
                      <View style={styles.actionTextContainer}>
                        <Text style={styles.actionTitleObj_light}>Update</Text>
                        <Text style={styles.actionSub_light}>Change base budget allocation</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* STEP 3 */}
              {step === 3 && (
                <View style={styles.stepContainer}>
                  <Text style={styles.promptText}>Set your new base budget for the month</Text>
                  
                  <View style={styles.budgetMainCard}>
                    <View style={styles.allocationHeader}>
                      <Text style={styles.allocationLabel}>BASE MONTHLY BUDGET</Text>
                    </View>

                    <View style={styles.totalInputWrapper}>
                      <View style={styles.totalInputRow}>
                        <Text style={styles.totalCurrency}>PKR</Text>
                        <TextInput
                          style={styles.totalInput}
                          keyboardType="numeric"
                          value={localTotal.toString()}
                          onChangeText={(val) => setLocalTotal(parseInt(val) || 0)}
                        />
                        <Pencil size={20} color="#00F0FF" style={{ marginLeft: 12 }} />
                      </View>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[styles.mainSaveButton, { opacity: localTotal > 0 ? 1 : 0.6 }]}
                    onPress={handleFinalSave}
                    disabled={localTotal <= 0}
                  >
                    <Text style={styles.mainSaveText}>Save & Allocate Categories</Text>
                  </TouchableOpacity>

                </View>
              )}

            </KeyboardAwareScrollView>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  container: { width: '100%', maxHeight: '95%' },
  modalContent: { borderRadius: 32, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', flexShrink: 1 },
  header: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerTitle: { color: '#FFFFFF', fontFamily: 'Outfit_700Bold', fontSize: 16 },
  
  statusBanner: { padding: 10, borderRadius: 16, borderWidth: 1, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(0, 240, 255, 0.05)', borderColor: 'rgba(0, 240, 255, 0.2)' },
  statusBannerOverspent: { backgroundColor: 'rgba(239, 68, 68, 0.05)', borderColor: 'rgba(239, 68, 68, 0.2)' },
  bannerLeft: { flex: 1 },
  statusLabel: { fontFamily: 'Outfit_800ExtraBold', color: '#00F0FF', fontSize: 18, letterSpacing: 1 },
  statusLabelOverspent: { color: '#EF4444' },
  statusThreshold: { color: '#606060', fontFamily: 'Inter_500Medium', fontSize: 10, marginTop: 2 },
  
  statsOverview: { 
    flexDirection: 'row', 
    backgroundColor: 'rgba(255,255,255,0.03)', 
    borderRadius: 16, 
    padding: 12, 
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  statBox: { flex: 1, alignItems: 'center' },
  statBoxLabel: { color: '#606060', fontFamily: 'Inter_700Bold', fontSize: 8, letterSpacing: 0.5, marginBottom: 2 },
  statBoxValue: { color: '#FFFFFF', fontFamily: 'Outfit_600SemiBold', fontSize: 13 },
  statBoxDivider: { width: 1, height: 16, backgroundColor: 'rgba(255,255,255,0.1)' },

  insightsSection: { marginBottom: 12, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 20, padding: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  insightHeader: { color: '#A0A0A0', fontFamily: 'Inter_700Bold', fontSize: 9, letterSpacing: 1.5, marginBottom: 10 },
  insightRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  insightIconCircle: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  insightContent: { flex: 1 },
  insightTitle: { color: '#FFFFFF', fontFamily: 'Outfit_600SemiBold', fontSize: 13 },
  insightValue: { color: '#A0A0A0', fontFamily: 'Inter_500Medium', fontSize: 11, lineHeight: 16, marginTop: 1 },
  
  emptyInsights: { alignItems: 'center', paddingVertical: 12 },
  emptyInsightsText: { color: '#606060', fontFamily: 'Inter_600SemiBold', fontSize: 13, marginTop: 8 },

  stepContainer: { marginTop: 0 },
  promptText: { color: '#FFFFFF', fontFamily: 'Outfit_600SemiBold', fontSize: 14, lineHeight: 20, marginBottom: 8, textAlign: 'center' },
  nudgeText: { color: '#A0A0A0', fontFamily: 'Inter_500Medium', fontSize: 11, textAlign: 'center', marginBottom: 12, fontStyle: 'italic' },
  
  actionGrid: { gap: 8 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 20, gap: 10 },
  btnRollOver: { backgroundColor: '#00F0FF' },
  btnDiscard: { backgroundColor: '#262626', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  btnKeep: { backgroundColor: '#10B981' },
  btnUpdate: { backgroundColor: '#262626', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  
  deficitNotice: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 20, backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: 12, borderRadius: 16 },
  deficitNoticeText: { color: '#EF4444', fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  
  actionTextContainer: { flex: 1 },
  actionTitleObj_dark: { color: '#0A0A0A', fontFamily: 'Outfit_800ExtraBold', fontSize: 14 },
  actionSub_dark: { color: 'rgba(0,0,0,0.6)', fontFamily: 'Inter_500Medium', fontSize: 9, marginTop: 1 },
  actionTitleObj_light: { color: '#FFFFFF', fontFamily: 'Outfit_800ExtraBold', fontSize: 14 },
  actionSub_light: { color: '#A0A0A0', fontFamily: 'Inter_500Medium', fontSize: 9, marginTop: 1 },

  // Step 3 Styles
  budgetMainCard: { backgroundColor: 'rgba(20,20,20,0.95)', padding: 16, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', marginBottom: 20 },
  allocationHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  allocationLabel: { color: '#606060', fontSize: 9, fontFamily: 'Inter_700Bold', letterSpacing: 1.5 },
  totalInputWrapper: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', minHeight: 64, justifyContent: 'center' },
  totalInputRow: { flexDirection: 'row', alignItems: 'center' },
  totalCurrency: { color: '#00F0FF', fontSize: 16, fontFamily: 'Outfit_600SemiBold', marginRight: 12 },
  totalInput: { color: '#FFFFFF', fontSize: 20, fontFamily: 'Outfit_600SemiBold', flex: 1, height: 40, padding: 0, textAlignVertical: 'center' },
  
  mainSaveButton: { backgroundColor: '#FFFFFF', borderRadius: 20, height: 56, alignItems: 'center', justifyContent: 'center', marginTop: 8, marginBottom: 16 },
  mainSaveText: { color: '#0A0A0A', fontFamily: 'Outfit_800ExtraBold', fontSize: 16 }
});

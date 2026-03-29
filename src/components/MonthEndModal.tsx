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

  if (!data) return null;

  const { prevMonth, totalBudget, totalSpent, remaining } = data;
  const isOverspent = remaining <= 0;
  
  const dateObj = new Date(prevMonth + '-02');
  const monthName = dateObj.toLocaleString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();

  const handleFinalSave = async () => {
    // Preserve existing categories, just update total
    const updatedBudget = { ...budget, total: localTotal };
    await resolveMonthEnd(rolloverCache, updatedBudget);
    navigation.navigate('Settings');
  };

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

            <KeyboardAwareScrollView showsVerticalScrollIndicator={false} style={{ flexShrink: 1 }}>
              
              {/* Common Header: Month & Stats (Hidden in Step 3 for space) */}
              {step !== 3 && (() => {
                // Calculation Logic
                const prevMonthExpenses = expenses.filter((e: any) => {
                  const d = new Date(e.date);
                  return d.toISOString().startsWith(prevMonth);
                });

                // 1. Top Spending Category
                const catTotals: Record<string, number> = {};
                prevMonthExpenses.forEach((e: any) => {
                  catTotals[e.category] = (catTotals[e.category] || 0) + e.amount;
                });
                let topCat = "N/A";
                let topCatAmount = 0;
                Object.entries(catTotals).forEach(([cat, amt]) => {
                  if (amt > topCatAmount) {
                    topCatAmount = amt;
                    topCat = cat;
                  }
                });
                const topCatPercent = totalSpent > 0 ? Math.round((topCatAmount / totalSpent) * 100) : 0;

                // 2. Budget Health Score (Active days only)
                const daysInMonth = new Date(dateObj.getFullYear(), dateObj.getMonth() + 1, 0).getDate();
                const dailyBudget = totalBudget / daysInMonth;
                const dailySpend: Record<string, number> = {};
                prevMonthExpenses.forEach((e: any) => {
                  const day = e.date.split('T')[0];
                  dailySpend[day] = (dailySpend[day] || 0) + e.amount;
                });
                const activeDays = Object.keys(dailySpend).length;
                const underBudgetDays = Object.values(dailySpend).filter((amt: any) => amt <= dailyBudget).length;

                // 3. Biggest Single Expense
                let biggestExpense = prevMonthExpenses.length > 0 
                  ? prevMonthExpenses.reduce((prev: any, current: any) => (prev.amount > current.amount) ? prev : current)
                  : null;

                return (
                  <>
                    <View style={[styles.statusBanner, isOverspent && styles.statusBannerOverspent]}>
                      <View style={styles.bannerLeft}>
                        <Text style={[styles.statusLabel, isOverspent && styles.statusLabelOverspent]}>{monthName}</Text>
                        <Text style={styles.statusThreshold}>Monthly Recap</Text>
                      </View>
                      <View style={styles.compactStats}>
                        <View style={styles.compactStatItem}>
                          <Text style={styles.compactStatLabel}>SPENT</Text>
                          <Text style={styles.compactStatValue}>PKR {totalSpent.toLocaleString()}</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.compactStatItem}>
                          <Text style={[styles.compactStatLabel, isOverspent && { color: '#EF4444' }]}>
                            {isOverspent ? 'DEFICIT' : 'LEFT'}
                          </Text>
                          <Text style={[styles.compactStatValue, { color: isOverspent ? '#EF4444' : '#00F0FF' }]}>
                            PKR {Math.abs(remaining).toLocaleString()}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.insightsSection}>
                      <Text style={styles.insightHeader}>MONTHLY INSIGHTS</Text>
                      
                      {prevMonthExpenses.length > 0 ? (
                        <>
                          <View style={styles.insightRow}>
                            <View style={styles.insightIconCircle}>
                              <TrendingUp color="#00F0FF" size={14} />
                            </View>
                            <View style={styles.insightContent}>
                              <Text style={styles.insightTitle}>Top Spending Category</Text>
                              <Text style={styles.insightValue}>
                                {topCat} was your biggest expense — PKR {topCatAmount.toLocaleString()} ({topCatPercent}% of total)
                              </Text>
                            </View>
                          </View>

                          <View style={styles.insightRow}>
                            <View style={[styles.insightIconCircle, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                              <CheckCircle2 color="#10B981" size={14} />
                            </View>
                            <View style={styles.insightContent}>
                              <Text style={styles.insightTitle}>Budget Health Score</Text>
                              <Text style={styles.insightValue}>
                                You stayed under budget for {underBudgetDays} out of {activeDays} active spending days.
                              </Text>
                            </View>
                          </View>

                          <View style={styles.insightRow}>
                            <View style={[styles.insightIconCircle, { backgroundColor: 'rgba(255, 255, 255, 0.05)' }]}>
                              <AlertCircle color="#A0A0A0" size={14} />
                            </View>
                            <View style={styles.insightContent}>
                              <Text style={styles.insightTitle}>Biggest Single Expense</Text>
                              <Text style={styles.insightValue}>
                                Largest transaction: {biggestExpense?.name} · PKR {biggestExpense?.amount.toLocaleString()}
                              </Text>
                            </View>
                          </View>
                        </>
                      ) : (
                        <View style={styles.emptyInsights}>
                          <MoreHorizontal color="#606060" size={32} />
                          <Text style={styles.emptyInsightsText}>No active spending days recorded</Text>
                        </View>
                      )}
                    </View>
                  </>
                );
              })()}

              {/* STEP 1 */}
              {step === 1 && !isOverspent && (
                <View style={styles.stepContainer}>
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
  header: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerTitle: { color: '#FFFFFF', fontFamily: 'Outfit_700Bold', fontSize: 18 },
  
  statusBanner: { padding: 16, borderRadius: 20, borderWidth: 1, marginBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(0, 240, 255, 0.05)', borderColor: 'rgba(0, 240, 255, 0.2)' },
  statusBannerOverspent: { backgroundColor: 'rgba(239, 68, 68, 0.05)', borderColor: 'rgba(239, 68, 68, 0.2)' },
  bannerLeft: { flex: 1 },
  statusLabel: { fontFamily: 'Outfit_800ExtraBold', color: '#00F0FF', fontSize: 20, letterSpacing: 1 },
  statusLabelOverspent: { color: '#EF4444' },
  statusThreshold: { color: '#606060', fontFamily: 'Inter_500Medium', fontSize: 10, marginTop: 2 },
  
  compactStats: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  compactStatItem: { alignItems: 'flex-end' },
  compactStatLabel: { color: '#606060', fontFamily: 'Inter_700Bold', fontSize: 9, letterSpacing: 0.5 },
  compactStatValue: { color: '#FFFFFF', fontFamily: 'Outfit_600SemiBold', fontSize: 14, marginTop: 2 },
  statDivider: { width: 1, height: 24, backgroundColor: 'rgba(255,255,255,0.1)' },

  insightsSection: { marginBottom: 20, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 24, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  insightHeader: { color: '#A0A0A0', fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.5, marginBottom: 16 },
  insightRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  insightIconCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0, 240, 255, 0.1)', alignItems: 'center', justifyContent: 'center' },
  insightContent: { flex: 1 },
  insightTitle: { color: '#FFFFFF', fontFamily: 'Outfit_600SemiBold', fontSize: 14 },
  insightValue: { color: '#A0A0A0', fontFamily: 'Inter_500Medium', fontSize: 12, lineHeight: 18, marginTop: 2 },
  
  emptyInsights: { alignItems: 'center', paddingVertical: 12 },
  emptyInsightsText: { color: '#606060', fontFamily: 'Inter_600SemiBold', fontSize: 13, marginTop: 8 },

  stepContainer: { marginTop: 0 },
  promptText: { color: '#FFFFFF', fontFamily: 'Outfit_600SemiBold', fontSize: 15, lineHeight: 22, marginBottom: 12, textAlign: 'center' },
  nudgeText: { color: '#A0A0A0', fontFamily: 'Inter_500Medium', fontSize: 12, textAlign: 'center', marginBottom: 16, fontStyle: 'italic' },
  
  actionGrid: { gap: 10 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 20, gap: 12 },
  btnRollOver: { backgroundColor: '#00F0FF' },
  btnDiscard: { backgroundColor: '#262626', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  btnKeep: { backgroundColor: '#10B981' },
  btnUpdate: { backgroundColor: '#262626', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  
  deficitNotice: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 20, backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: 12, borderRadius: 16 },
  deficitNoticeText: { color: '#EF4444', fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  
  actionTextContainer: { flex: 1 },
  actionTitleObj_dark: { color: '#0A0A0A', fontFamily: 'Outfit_800ExtraBold', fontSize: 15 },
  actionSub_dark: { color: 'rgba(0,0,0,0.6)', fontFamily: 'Inter_500Medium', fontSize: 10, marginTop: 2 },
  actionTitleObj_light: { color: '#FFFFFF', fontFamily: 'Outfit_800ExtraBold', fontSize: 15 },
  actionSub_light: { color: '#A0A0A0', fontFamily: 'Inter_500Medium', fontSize: 10, marginTop: 2 },

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

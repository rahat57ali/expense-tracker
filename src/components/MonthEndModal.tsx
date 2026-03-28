import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  TextInput 
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { LinearGradient } from 'expo-linear-gradient';
import { Calendar as CalendarIcon, ArrowRightCircle, Trash2, CheckCircle2, Settings as SettingsIcon, AlertCircle, Pencil, MoreHorizontal } from 'lucide-react-native';
import { useLedgr } from '../lib/LedgrContext';
import { Budget, ExpenseCategory, DEFAULT_CATEGORIES } from '../lib/store';
import { Coffee, Car, Home as HomeIcon, ShoppingBag, Heart, ShoppingBasket } from 'lucide-react-native';

const CATEGORY_ICONS: Record<ExpenseCategory, any> = {
  Food: Coffee,
  Transport: Car,
  Bills: HomeIcon,
  Shopping: ShoppingBag,
  Grocery: ShoppingBasket,
  Health: Heart,
  Other: MoreHorizontal,
};

export default function MonthEndModal({ visible, data }: { visible: boolean; data: any }) {
  const { resolveMonthEnd, saveRolloverRecovery, budget, allCategories } = useLedgr();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [rolloverCache, setRolloverCache] = useState<number>(0);
  
  // Step 3 state
  const [localBudget, setLocalBudget] = useState<Budget>(budget);

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
      // Always pull the active budget (which is previous month's locked config)
      setLocalBudget(budget);
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

  // Step 3 Handlers
  const totalAllocated = useMemo(() =>
    Object.values(localBudget.categories).reduce((sum, val) => sum + val, 0),
    [localBudget.categories]);

  const unallocated = localBudget.total - totalAllocated;
  const isOverAllocated = unallocated < 0;

  if (!data) return null;

  const { prevMonth, totalBudget, totalSpent, remaining } = data;
  const isOverspent = remaining <= 0;
  
  const dateObj = new Date(prevMonth + '-02');
  const monthName = dateObj.toLocaleString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();

  const handleCatChange = (cat: ExpenseCategory, val: string) => {
    const num = parseInt(val) || 0;
    setLocalBudget(prev => ({
      ...prev,
      categories: { ...prev.categories, [cat]: num }
    }));
  };

  const handleFinalSave = async () => {
    await resolveMonthEnd(rolloverCache, localBudget);
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
              {step !== 3 && (
                <>
                  <View style={[styles.statusBanner, isOverspent && styles.statusBannerOverspent]}>
                    <Text style={[styles.statusLabel, isOverspent && styles.statusLabelOverspent]}>{monthName}</Text>
                    <Text style={styles.statusThreshold}>A new month has started</Text>
                  </View>

                  <View style={styles.statsGrid}>
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>BUDGET</Text>
                      <Text style={styles.statValue}>PKR {totalBudget.toLocaleString()}</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>SPENT</Text>
                      <Text style={styles.statValue}>PKR {totalSpent.toLocaleString()}</Text>
                    </View>
                    <View style={[styles.statItem, isOverspent ? styles.statItemDeficit : styles.statItemHighlight]}>
                      <Text style={[styles.statLabel, { color: isOverspent ? '#EF4444' : '#00F0FF' }]}>
                        {isOverspent ? 'DEFICIT' : 'REMAINING'}
                      </Text>
                      <Text style={[styles.statValue, { color: isOverspent ? '#EF4444' : '#00F0FF' }]}>
                        PKR {Math.abs(remaining).toLocaleString()}
                      </Text>
                    </View>
                  </View>
                </>
              )}

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
                  <Text style={styles.promptText}>Adjust your base budget categories to start fresh</Text>
                  
                  <View style={styles.budgetMainCard}>
                    <View style={styles.allocationHeader}>
                      <Text style={styles.allocationLabel}>BASE MONTHLY BUDGET</Text>
                      <View style={[styles.allocationPill, isOverAllocated ? styles.pillDanger : styles.pillSuccess]}>
                        <Text style={[styles.pillText, isOverAllocated ? styles.pillTextDanger : styles.pillTextSuccess]}>
                          {isOverAllocated ? 'OVER-ALLOCATED' : 'ALLOCATED'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.totalInputWrapper}>
                      <View style={styles.totalInputRow}>
                        <Text style={styles.totalCurrency}>PKR</Text>
                        <TextInput
                          style={styles.totalInput}
                          keyboardType="numeric"
                          value={localBudget.total.toString()}
                          onChangeText={(val) => setLocalBudget(p => ({ ...p, total: parseInt(val) || 0 }))}
                        />
                        <Pencil size={20} color="#00F0FF" style={{ marginLeft: 12 }} />
                      </View>
                    </View>

                    <View style={styles.allocationBarContainer}>
                      <View style={styles.allocationBarBg}>
                        <View
                          style={[
                            styles.allocationBarFill,
                            { width: `${Math.min(100, localBudget.total > 0 ? (totalAllocated / localBudget.total) * 100 : 0)}%` },
                            isOverAllocated && styles.allocationBarFillDanger
                          ]}
                        />
                      </View>
                      <View style={styles.allocationStats}>
                        <Text style={styles.statText}>Allocated: PKR {totalAllocated.toLocaleString()}</Text>
                        <Text style={[styles.allocStatValue, isOverAllocated && styles.textDanger]}>
                          {isOverAllocated ? `Exceeded: PKR ${Math.abs(unallocated).toLocaleString()}` : `Remaining: PKR ${unallocated.toLocaleString()}`}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.catBudgetGrid}>
                    {allCategories.map(cat => {
                      const Icon = CATEGORY_ICONS[cat as ExpenseCategory] || MoreHorizontal;
                      const amount = localBudget.categories[cat] || 0;
                      const percentage = localBudget.total > 0 ? ((amount / localBudget.total) * 100).toFixed(1) : '0.0';

                      return (
                        <View key={cat} style={styles.modernCatCard}>
                          <View style={styles.catCardHeader}>
                            <View style={styles.catIconBox}>
                              <Icon color="#00F0FF" size={14} />
                            </View>
                            <Text style={styles.catName} numberOfLines={1}>{cat}</Text>
                            <Text style={styles.catPercent}>{percentage}%</Text>
                          </View>
                          <View style={styles.catInputContainer}>
                            <Text style={styles.catInputCurrency}>PKR</Text>
                            <TextInput
                              style={styles.catInput}
                              keyboardType="numeric"
                              value={amount.toString()}
                              onChangeText={(val) => handleCatChange(cat as ExpenseCategory, val)}
                            />
                          </View>
                        </View>
                      );
                    })}
                  </View>

                  <TouchableOpacity
                    style={[styles.mainSaveButton, { opacity: isOverAllocated ? 0.6 : 1 }]}
                    onPress={handleFinalSave}
                    disabled={isOverAllocated}
                  >
                    <Text style={styles.mainSaveText}>Finalize & Start Month</Text>
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
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  container: { width: '100%', maxHeight: '95%' },
  modalContent: { borderRadius: 32, padding: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', flexShrink: 1 },
  header: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerTitle: { color: '#FFFFFF', fontFamily: 'Outfit_700Bold', fontSize: 20 },
  
  statusBanner: { padding: 16, borderRadius: 20, borderWidth: 1, marginBottom: 24, alignItems: 'center', backgroundColor: 'rgba(0, 240, 255, 0.05)', borderColor: 'rgba(0, 240, 255, 0.2)' },
  statusBannerOverspent: { backgroundColor: 'rgba(239, 68, 68, 0.05)', borderColor: 'rgba(239, 68, 68, 0.2)' },
  statusLabel: { fontFamily: 'Outfit_800ExtraBold', color: '#00F0FF', fontSize: 24, letterSpacing: 2 },
  statusLabelOverspent: { color: '#EF4444' },
  statusThreshold: { color: '#A0A0A0', fontFamily: 'Inter_500Medium', fontSize: 12, marginTop: 4 },
  
  statsGrid: { gap: 12, marginBottom: 24 },
  statItem: { padding: 16, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statItemHighlight: { backgroundColor: 'rgba(0, 240, 255, 0.03)', borderColor: 'rgba(0, 240, 255, 0.1)' },
  statItemDeficit: { backgroundColor: 'rgba(239, 68, 68, 0.03)', borderColor: 'rgba(239, 68, 68, 0.1)' },
  statLabel: { color: '#606060', fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 1 },
  statValue: { color: '#FFFFFF', fontFamily: 'Outfit_600SemiBold', fontSize: 18 },
  
  stepContainer: { marginTop: 8 },
  promptText: { color: '#FFFFFF', fontFamily: 'Inter_600SemiBold', fontSize: 15, lineHeight: 22, marginBottom: 16, textAlign: 'center' },
  nudgeText: { color: '#A0A0A0', fontFamily: 'Inter_500Medium', fontSize: 13, textAlign: 'center', marginBottom: 20, fontStyle: 'italic' },
  
  actionGrid: { gap: 12 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, gap: 16 },
  btnRollOver: { backgroundColor: '#00F0FF' },
  btnDiscard: { backgroundColor: '#262626', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  btnKeep: { backgroundColor: '#10B981' },
  btnUpdate: { backgroundColor: '#262626', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  
  deficitNotice: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 24, backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: 16, borderRadius: 16 },
  deficitNoticeText: { color: '#EF4444', fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  
  actionTextContainer: { flex: 1 },
  actionTitleObj_dark: { color: '#0A0A0A', fontFamily: 'Outfit_800ExtraBold', fontSize: 16 },
  actionSub_dark: { color: 'rgba(0,0,0,0.6)', fontFamily: 'Inter_500Medium', fontSize: 11, marginTop: 2 },
  actionTitleObj_light: { color: '#FFFFFF', fontFamily: 'Outfit_800ExtraBold', fontSize: 16 },
  actionSub_light: { color: '#A0A0A0', fontFamily: 'Inter_500Medium', fontSize: 11, marginTop: 2 },

  // Step 3 Styles
  budgetMainCard: { backgroundColor: 'rgba(20,20,20,0.95)', padding: 20, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', marginBottom: 24 },
  allocationHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  allocationLabel: { color: '#606060', fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 1.5 },
  totalInputWrapper: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 20, paddingHorizontal: 20, paddingVertical: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', minHeight: 74, justifyContent: 'center' },
  totalInputRow: { flexDirection: 'row', alignItems: 'center' },
  totalCurrency: { color: '#00F0FF', fontSize: 18, fontFamily: 'Outfit_600SemiBold', marginRight: 12 },
  totalInput: { color: '#FFFFFF', fontSize: 22, fontFamily: 'Outfit_600SemiBold', flex: 1, height: 48, padding: 0, textAlignVertical: 'center' },
  
  allocationBarContainer: { marginTop: 20 },
  allocationBarBg: { height: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden' },
  allocationBarFill: { height: '100%', backgroundColor: '#00F0FF', borderRadius: 4 },
  allocationBarFillDanger: { backgroundColor: '#EF4444' },
  allocationStats: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  statText: { color: '#A0A0A0', fontFamily: 'Inter_500Medium', fontSize: 12 },
  allocStatValue: { color: '#FFFFFF', fontFamily: 'Outfit_600SemiBold', fontSize: 12 },
  textDanger: { color: '#EF4444' },
  
  allocationPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1 },
  pillSuccess: { backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.2)' },
  pillDanger: { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.2)' },
  pillText: { fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 1 },
  pillTextSuccess: { color: '#10B981' },
  pillTextDanger: { color: '#EF4444' },
  
  catBudgetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  modernCatCard: { width: '48%', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  catCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  catIconBox: { width: 28, height: 28, borderRadius: 8, backgroundColor: 'rgba(0, 240, 255, 0.1)', alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  catName: { color: '#FFFFFF', fontFamily: 'Inter_600SemiBold', fontSize: 13, flex: 1 },
  catPercent: { color: '#606060', fontFamily: 'Inter_700Bold', fontSize: 10 },
  catInputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, paddingHorizontal: 12, height: 44, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  catInputCurrency: { color: '#606060', fontSize: 10, fontFamily: 'Inter_700Bold', marginRight: 6 },
  catInput: { color: '#FFFFFF', fontSize: 16, fontFamily: 'Outfit_600SemiBold', flex: 1, padding: 0, textAlignVertical: 'center' },
  
  mainSaveButton: { backgroundColor: '#FFFFFF', borderRadius: 20, height: 60, alignItems: 'center', justifyContent: 'center', marginTop: 10, marginBottom: 20 },
  mainSaveText: { color: '#0A0A0A', fontFamily: 'Outfit_800ExtraBold', fontSize: 16 }
});

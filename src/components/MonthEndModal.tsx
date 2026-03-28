import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  ScrollView 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Calendar as CalendarIcon, ArrowRightCircle, Trash2, CheckCircle2, Settings as SettingsIcon, AlertCircle } from 'lucide-react-native';
import { MonthEndData } from '../lib/LedgrContext';

interface MonthEndModalProps {
  visible: boolean;
  data: MonthEndData | null;
  onResolve: (rolloverAmount: number, requestUpdate: boolean) => void;
}

export default function MonthEndModal({ visible, data, onResolve }: MonthEndModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [rolloverCache, setRolloverCache] = useState<number>(0);

  useEffect(() => {
    if (visible && data) {
      setStep(1);
      setRolloverCache(0);
    }
  }, [visible, data]);

  if (!data) return null;

  const { prevMonth, totalBudget, totalSpent, remaining } = data;
  
  // Convert '2026-03' to 'MARCH 2026'
  const dateObj = new Date(prevMonth + '-02');
  const monthName = dateObj.toLocaleString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();
  const isOverspent = remaining <= 0;

  const handleStep1Surplus = (amount: number) => {
    setRolloverCache(amount);
    setStep(2);
  };

  const handleStep1Deficit = () => {
    setRolloverCache(0);
    setStep(2);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <LinearGradient colors={['#1A1A1A', '#0A0A0A']} style={styles.modalContent}>
            
            <View style={styles.header}>
              <View style={styles.titleRow}>
                <CalendarIcon color="#00F0FF" size={20} />
                <Text style={styles.headerTitle}>Month Summary</Text>
              </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ flexShrink: 1 }}>
              
              {/* Common Header: Month & Stats */}
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

              {/* STEP 1 */}
              {step === 1 && (
                <View style={styles.stepContainer}>
                  {!isOverspent ? (
                    <>
                      <Text style={styles.promptText}>
                        What would you like to do with your PKR {remaining.toLocaleString()} remaining?
                      </Text>
                      <View style={styles.actionGrid}>
                        <TouchableOpacity style={[styles.actionBtn, styles.btnRollOver]} onPress={() => handleStep1Surplus(remaining)}>
                          <ArrowRightCircle color="#000" size={20} />
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
                    </>
                  ) : (
                    <>
                      <View style={styles.deficitNotice}>
                        <AlertCircle color="#EF4444" size={20} />
                        <Text style={styles.deficitNoticeText}>
                          You overspent by PKR {Math.abs(remaining).toLocaleString()} last month.
                        </Text>
                      </View>
                      <TouchableOpacity style={[styles.actionBtn, styles.btnContinue]} onPress={handleStep1Deficit}>
                        <Text style={styles.btnContinueText}>Continue</Text>
                        <ArrowRightCircle color="#0A0A0A" size={20} />
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              )}

              {/* STEP 2 */}
              {step === 2 && (
                <View style={styles.stepContainer}>
                  <Text style={styles.promptText}>
                    Use the same budget for next month or set a new one?
                  </Text>
                  
                  {isOverspent && (
                    <Text style={styles.nudgeText}>
                      Consider increasing your budget based on last month's spending.
                    </Text>
                  )}

                  <View style={styles.actionGrid}>
                    <TouchableOpacity style={[styles.actionBtn, styles.btnKeep]} onPress={() => onResolve(rolloverCache, false)}>
                      <CheckCircle2 color="#0A0A0A" size={20} />
                      <View style={styles.actionTextContainer}>
                        <Text style={styles.actionTitleObj_dark}>Keep Same</Text>
                        <Text style={styles.actionSub_dark}>Use existing base budget</Text>
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.actionBtn, styles.btnUpdate]} onPress={() => onResolve(rolloverCache, true)}>
                      <SettingsIcon color="#FFFFFF" size={20} />
                      <View style={styles.actionTextContainer}>
                        <Text style={styles.actionTitleObj_light}>Update</Text>
                        <Text style={styles.actionSub_light}>Change base budget allocation</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

            </ScrollView>
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
  
  btnContinue: { backgroundColor: '#FFFFFF', justifyContent: 'center', gap: 10 },
  btnContinueText: { color: '#0A0A0A', fontFamily: 'Outfit_800ExtraBold', fontSize: 16 },
  
  actionTextContainer: { flex: 1 },
  actionTitleObj_dark: { color: '#0A0A0A', fontFamily: 'Outfit_800ExtraBold', fontSize: 16 },
  actionSub_dark: { color: 'rgba(0,0,0,0.6)', fontFamily: 'Inter_500Medium', fontSize: 11, marginTop: 2 },
  actionTitleObj_light: { color: '#FFFFFF', fontFamily: 'Outfit_800ExtraBold', fontSize: 16 },
  actionSub_light: { color: '#A0A0A0', fontFamily: 'Inter_500Medium', fontSize: 11, marginTop: 2 }
});

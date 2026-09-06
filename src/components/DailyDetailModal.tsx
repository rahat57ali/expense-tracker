import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  ScrollView 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Info, TrendingDown, TrendingUp, Minus, AlertCircle, CheckCircle2, ShieldCheck, CreditCard } from 'lucide-react-native';
import { useThemeColors } from '../lib/ThemeContext';

interface DailyDetailModalProps {
  visible: boolean;
  onClose: () => void;
  data: {
    dailyTarget: number;
    dailyRemaining: number;
    ratio: number;
    daysLeft: number;
    unpaidBills?: number;
    safeAllowance?: number;
    totalRemaining?: number;
    status: {
      label: string;
      color: string;
      bgColor: string;
      description: string;
      threshold: string;
      icon: any;
    };
  };
}

export default function DailyDetailModal({ visible, onClose, data }: DailyDetailModalProps) {
  const { dailyTarget, dailyRemaining, ratio, daysLeft, status, unpaidBills = 0, safeAllowance, totalRemaining = 0 } = data;
  const colors = useThemeColors();
  const StatusIcon = status.icon;

  const safePool = Math.max(0, totalRemaining - unpaidBills);
  const effectiveSafeAllowance = safeAllowance !== undefined ? safeAllowance : dailyRemaining;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <View style={styles.container}>
          <LinearGradient
            colors={[colors.modalGradientStart, colors.modalGradientEnd] as const}
            style={[styles.modalContent, { borderColor: colors.cardBorder }]}
          >
            <View style={styles.header}>
              <View style={styles.titleRow}>
                <Info color={colors.accent} size={20} />
                <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Budget Intelligence</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.closeBtnBg }]}>
                <X color={colors.textSecondary} size={20} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ flexShrink: 1 }}>
              <View style={[styles.statusBanner, { backgroundColor: status.bgColor, borderColor: status.color }]}>
                <StatusIcon color={status.color} size={24} />
                <View style={styles.statusTextContainer}>
                  <Text style={[styles.statusLabel, { color: status.color }]}>{status.label}</Text>
                  <Text style={[styles.statusThreshold, { color: colors.textTertiary }]}>{status.threshold}</Text>
                </View>
              </View>

              <Text style={[styles.descriptionText, { color: colors.textPrimary }]}>{status.description}</Text>

              {/* Safe-to-Spend Breakdown (Phase 3 Integration) */}
              {unpaidBills > 0 && (
                <View style={[styles.safeSpendCard, { backgroundColor: colors.surface, borderColor: colors.cardBorderSubtle }]}>
                  <View style={styles.safeSpendHeader}>
                    <ShieldCheck color={colors.accent} size={18} style={{ marginRight: 8 }} />
                    <Text style={[styles.safeSpendTitle, { color: colors.textPrimary }]}>SAFE-TO-SPEND CALCULATION</Text>
                  </View>

                  <View style={styles.calcRow}>
                    <Text style={[styles.calcLabel, { color: colors.textSecondary }]}>Remaining Monthly Budget</Text>
                    <Text style={[styles.calcValue, { color: colors.textPrimary }]}>PKR {totalRemaining.toLocaleString()}</Text>
                  </View>

                  <View style={styles.calcRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <CreditCard color={colors.warning} size={13} style={{ marginRight: 6 }} />
                      <Text style={[styles.calcLabel, { color: colors.warning }]}>Held for Pending Bills</Text>
                    </View>
                    <Text style={[styles.calcValue, { color: colors.warning }]}>- PKR {unpaidBills.toLocaleString()}</Text>
                  </View>

                  <View style={[styles.calcDivider, { backgroundColor: colors.divider }]} />

                  <View style={styles.calcRow}>
                    <Text style={[styles.calcLabelBold, { color: colors.textPrimary }]}>Safe Discretionary Pool</Text>
                    <Text style={[styles.calcValueBold, { color: colors.accent }]}>PKR {safePool.toLocaleString()}</Text>
                  </View>

                  <View style={[styles.safeResultBox, { backgroundColor: `${colors.accent}15`, borderColor: `${colors.accent}30` }]}>
                    <Text style={[styles.safeResultLabel, { color: colors.textSecondary }]}>
                      Divided by {daysLeft} days remaining:
                    </Text>
                    <Text style={[styles.safeResultAmount, { color: colors.accent }]}>
                      PKR {Math.floor(effectiveSafeAllowance).toLocaleString()} / day
                    </Text>
                  </View>
                </View>
              )}

              <View style={[styles.legendContainer, { backgroundColor: colors.surface, borderColor: colors.cardBorderSubtle }]}>
                <Text style={[styles.legendHeader, { color: colors.textTertiary }]}>ALL STATUS LEVELS</Text>
                
                <View style={[styles.legendRow, { borderBottomColor: colors.cardBorderSubtle }]}>
                  <View style={styles.legendLeft}>
                    <CheckCircle2 color={colors.success} size={16} />
                    <Text style={[styles.legendLabel, { color: colors.success }]}>COMFORTABLE</Text>
                  </View>
                  <Text style={[styles.legendDesc, { color: colors.textSecondary }]}>Spending significantly less than planned daily average</Text>
                </View>

                <View style={[styles.legendRow, { borderBottomColor: colors.cardBorderSubtle }]}>
                  <View style={styles.legendLeft}>
                    <TrendingUp color={colors.warning} size={16} />
                    <Text style={[styles.legendLabel, { color: colors.warning }]}>ON TRACK</Text>
                  </View>
                  <Text style={[styles.legendDesc, { color: colors.textSecondary }]}>Spending aligned perfectly with your monthly goal</Text>
                </View>

                <View style={[styles.legendRow, { borderBottomColor: colors.cardBorderSubtle }]}>
                  <View style={styles.legendLeft}>
                    <Minus color={colors.warning} size={16} />
                    <Text style={[styles.legendLabel, { color: colors.warning }]}>TIGHT</Text>
                  </View>
                  <Text style={[styles.legendDesc, { color: colors.textSecondary }]}>Below target. Time to prioritize essential spending</Text>
                </View>

                <View style={[styles.legendRow, { borderBottomColor: colors.cardBorderSubtle }]}>
                  <View style={styles.legendLeft}>
                    <AlertCircle color={colors.danger} size={16} />
                    <Text style={[styles.legendLabel, { color: colors.danger }]}>CRITICAL</Text>
                  </View>
                  <Text style={[styles.legendDesc, { color: colors.textSecondary }]}>High alert! Immediate reduction in spending required</Text>
                </View>

                <View style={[styles.legendRow, { borderBottomWidth: 0 }]}>
                  <View style={styles.legendLeft}>
                    <TrendingDown color={colors.danger} size={16} />
                    <Text style={[styles.legendLabel, { color: colors.danger }]}>OVERSPENT</Text>
                  </View>
                  <Text style={[styles.legendDesc, { color: colors.textSecondary }]}>Sustained limit exceeded. Adding to monthly deficit</Text>
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity style={[styles.doneBtn, { backgroundColor: colors.saveBtnBg }]} onPress={onClose}>
              <Text style={[styles.doneText, { color: colors.saveBtnText }]}>Understood</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  container: { width: '100%', maxHeight: '90%' },
  modalContent: { borderRadius: 32, padding: 24, borderWidth: 1, flexShrink: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerTitle: { fontFamily: 'Outfit_700Bold', fontSize: 20 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  
  statusBanner: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, borderWidth: 1, marginBottom: 16, gap: 16 },
  statusTextContainer: { flex: 1 },
  statusLabel: { fontFamily: 'Outfit_800ExtraBold', fontSize: 18, letterSpacing: 1 },
  statusThreshold: { fontFamily: 'Inter_500Medium', fontSize: 11, marginTop: 2 },
  
  descriptionText: { fontFamily: 'Inter_500Medium', fontSize: 15, lineHeight: 22, marginBottom: 20 },
  
  safeSpendCard: { borderRadius: 18, borderWidth: 1, padding: 16, marginBottom: 20 },
  safeSpendHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  safeSpendTitle: { fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 1 },
  calcRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 4 },
  calcLabel: { fontFamily: 'Inter_500Medium', fontSize: 13 },
  calcValue: { fontFamily: 'Outfit_600SemiBold', fontSize: 14 },
  calcDivider: { height: 1, marginVertical: 8 },
  calcLabelBold: { fontFamily: 'Outfit_700Bold', fontSize: 13 },
  calcValueBold: { fontFamily: 'Outfit_800ExtraBold', fontSize: 15 },
  safeResultBox: { marginTop: 12, padding: 12, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  safeResultLabel: { fontFamily: 'Inter_500Medium', fontSize: 11, marginBottom: 2 },
  safeResultAmount: { fontFamily: 'Outfit_800ExtraBold', fontSize: 18 },

  legendContainer: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 8 },
  legendHeader: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1, marginBottom: 12 },
  legendRow: { flexDirection: 'column', paddingVertical: 12, borderBottomWidth: 1 },
  legendLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  legendLabel: { fontFamily: 'Outfit_700Bold', fontSize: 14, letterSpacing: 0.5 },
  legendDesc: { fontFamily: 'Inter_500Medium', fontSize: 12, lineHeight: 18 },
  
  doneBtn: { height: 50, borderRadius: 100, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  doneText: { fontFamily: 'Outfit_800ExtraBold', fontSize: 15 }
});
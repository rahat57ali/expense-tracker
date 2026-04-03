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
import { X, Info, TrendingDown, TrendingUp, Minus, AlertCircle, CheckCircle2 } from 'lucide-react-native';
import { useThemeColors } from '../lib/ThemeContext';

interface DailyDetailModalProps {
  visible: boolean;
  onClose: () => void;
  data: {
    dailyTarget: number;
    dailyRemaining: number;
    ratio: number;
    daysLeft: number;
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
  const { dailyTarget, dailyRemaining, ratio, daysLeft, status } = data;
  const colors = useThemeColors();
  const StatusIcon = status.icon;

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
                  <Text style={[styles.statusThreshold, { color: colors.textTertiary }]}>Threshold: {status.threshold}</Text>
                </View>
              </View>

              <Text style={[styles.descriptionText, { color: colors.textPrimary }]}>{status.description}</Text>

              <View style={styles.statsGrid}>
                <View style={[styles.statItem, { backgroundColor: colors.surface, borderColor: colors.cardBorderSubtle }]}>
                  <Text style={[styles.statLabel, { color: colors.textTertiary }]}>MONTHLY TARGET (DAILY)</Text>
                  <Text style={[styles.statValue, { color: colors.textPrimary }]}>PKR {Math.floor(dailyTarget).toLocaleString()}</Text>
                  <Text style={[styles.statSub, { color: colors.textMuted }]}>Total Budget / Days in Month</Text>
                </View>

                <View style={[styles.statItem, styles.statItemHighlight, { backgroundColor: colors.accentBg, borderColor: colors.accentMuted + '40' }]}>
                  <Text style={[styles.statLabel, { color: colors.accent }]}>CURRENT ALLOWANCE</Text>
                  <Text style={[styles.statValue, { color: colors.textPrimary }]}>PKR {Math.floor(dailyRemaining).toLocaleString()}</Text>
                  <Text style={[styles.statSub, { color: colors.accentMuted }]}>Remaining / {daysLeft} Days Left</Text>
                </View>

                <View style={[styles.statItem, { backgroundColor: colors.surface, borderColor: colors.cardBorderSubtle }]}>
                  <Text style={[styles.statLabel, { color: colors.textTertiary }]}>SPENDING RATIO</Text>
                  <Text style={[styles.statValue, { color: status.color }]}>{ratio.toFixed(2)}x</Text>
                  <Text style={[styles.statSub, { color: colors.textMuted }]}>How much more you can spend than target</Text>
                </View>
              </View>

              <View style={[styles.infoBox, { backgroundColor: colors.innerCardBg }]}>
                <AlertCircle color={colors.textTertiary} size={16} />
                <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                  A ratio above 1.0 means you have more daily budget remaining than your initial monthly plan. Below 1.0 means you should tighten your belt for the remaining {daysLeft} days.
                </Text>
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
  
  descriptionText: { fontFamily: 'Inter_500Medium', fontSize: 14, lineHeight: 22, marginBottom: 24 },
  
  statsGrid: { gap: 12, marginBottom: 24 },
  statItem: { padding: 16, borderRadius: 16, borderWidth: 1 },
  statItemHighlight: { },
  statLabel: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1, marginBottom: 4 },
  statValue: { fontFamily: 'Outfit_600SemiBold', fontSize: 22 },
  statSub: { fontFamily: 'Inter_500Medium', fontSize: 10, marginTop: 4 },
  
  infoBox: { flexDirection: 'row', padding: 16, borderRadius: 16, gap: 12, alignItems: 'flex-start' },
  infoText: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 12, lineHeight: 18 },
  
  doneBtn: { height: 50, borderRadius: 100, alignItems: 'center', justifyContent: 'center', marginTop: 24 },
  doneText: { fontFamily: 'Outfit_800ExtraBold', fontSize: 15 }
});
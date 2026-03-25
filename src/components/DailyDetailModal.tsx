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
  const StatusIcon = status.icon;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <LinearGradient
            colors={['#1A1A1A', '#0A0A0A']}
            style={styles.modalContent}
          >
            <View style={styles.header}>
              <View style={styles.titleRow}>
                <Info color="#00F0FF" size={20} />
                <Text style={styles.headerTitle}>Budget Intelligence</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <X color="#A0A0A0" size={20} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ flexShrink: 1 }}>
              <View style={[styles.statusBanner, { backgroundColor: status.bgColor, borderColor: status.color }]}>
                <StatusIcon color={status.color} size={24} />
                <View style={styles.statusTextContainer}>
                  <Text style={[styles.statusLabel, { color: status.color }]}>{status.label}</Text>
                  <Text style={styles.statusThreshold}>Threshold: {status.threshold}</Text>
                </View>
              </View>

              <Text style={styles.descriptionText}>{status.description}</Text>

              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>MONTHLY TARGET (DAILY)</Text>
                  <Text style={styles.statValue}>PKR {Math.floor(dailyTarget).toLocaleString()}</Text>
                  <Text style={styles.statSub}>Total Budget / Days in Month</Text>
                </View>

                <View style={[styles.statItem, styles.statItemHighlight]}>
                  <Text style={[styles.statLabel, { color: '#00F0FF' }]}>CURRENT ALLOWANCE</Text>
                  <Text style={styles.statValue}>PKR {Math.floor(dailyRemaining).toLocaleString()}</Text>
                  <Text style={styles.statSub}>Remaining / {daysLeft} Days Left</Text>
                </View>

                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>SPENDING RATIO</Text>
                  <Text style={[styles.statValue, { color: status.color }]}>{ratio.toFixed(2)}x</Text>
                  <Text style={styles.statSub}>How much more you can spend than target</Text>
                </View>
              </View>

              <View style={styles.infoBox}>
                <AlertCircle color="#606060" size={16} />
                <Text style={styles.infoText}>
                  A ratio above 1.0 means you have more daily budget remaining than your initial monthly plan. Below 1.0 means you should tighten your belt for the remaining {daysLeft} days.
                </Text>
              </View>
            </ScrollView>

            <TouchableOpacity style={styles.doneBtn} onPress={onClose}>
              <Text style={styles.doneText}>Understood</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  container: { width: '100%', maxHeight: '90%' },
  modalContent: { borderRadius: 32, padding: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', flexShrink: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerTitle: { color: '#FFFFFF', fontFamily: 'Outfit_700Bold', fontSize: 20 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' },
  
  statusBanner: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, borderWidth: 1, marginBottom: 16, gap: 16 },
  statusTextContainer: { flex: 1 },
  statusLabel: { fontFamily: 'Outfit_800ExtraBold', fontSize: 18, letterSpacing: 1 },
  statusThreshold: { color: '#A0A0A0', fontFamily: 'Inter_500Medium', fontSize: 11, marginTop: 2 },
  
  descriptionText: { color: '#FFFFFF', fontFamily: 'Inter_500Medium', fontSize: 14, lineHeight: 22, marginBottom: 24 },
  
  statsGrid: { gap: 12, marginBottom: 24 },
  statItem: { padding: 16, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  statItemHighlight: { backgroundColor: 'rgba(0, 240, 255, 0.03)', borderColor: 'rgba(0, 240, 255, 0.1)' },
  statLabel: { color: '#606060', fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1, marginBottom: 4 },
  statValue: { color: '#FFFFFF', fontFamily: 'Outfit_600SemiBold', fontSize: 22 },
  statSub: { color: '#404040', fontFamily: 'Inter_500Medium', fontSize: 10, marginTop: 4 },
  
  infoBox: { flexDirection: 'row', padding: 16, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, gap: 12, alignItems: 'flex-start' },
  infoText: { flex: 1, color: '#606060', fontFamily: 'Inter_500Medium', fontSize: 12, lineHeight: 18 },
  
  doneBtn: { backgroundColor: '#FFFFFF', height: 50, borderRadius: 100, alignItems: 'center', justifyContent: 'center', marginTop: 24 },
  doneText: { color: '#0A0A0A', fontFamily: 'Outfit_800ExtraBold', fontSize: 15 }
});

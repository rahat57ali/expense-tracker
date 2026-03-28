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
import { Calendar as CalendarIcon, ArrowRightCircle, PiggyBank, RotateCcw } from 'lucide-react-native';
import { MonthEndData } from '../lib/LedgrContext';

interface MonthEndModalProps {
  visible: boolean;
  data: MonthEndData | null;
  onRollOver: () => void;
  onSave: () => void;
  onReset: () => void;
}

export default function MonthEndModal({ visible, data, onRollOver, onSave, onReset }: MonthEndModalProps) {
  if (!data) return null;

  const { prevMonth, totalBudget, totalSpent, remaining } = data;
  
  // Convert '2026-03' to 'MARCH 2026'
  const dateObj = new Date(prevMonth + '-02'); // Append day to avoid timezone issues
  const monthName = dateObj.toLocaleString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <LinearGradient
            colors={['#1A1A1A', '#0A0A0A']}
            style={styles.modalContent}
          >
            <View style={styles.header}>
              <View style={styles.titleRow}>
                <CalendarIcon color="#00F0FF" size={20} />
                <Text style={styles.headerTitle}>Month Summary</Text>
              </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ flexShrink: 1 }}>
              <View style={styles.statusBanner}>
                <Text style={styles.statusLabel}>{monthName}</Text>
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

                <View style={[styles.statItem, styles.statItemHighlight]}>
                  <Text style={[styles.statLabel, { color: '#00F0FF' }]}>REMAINING</Text>
                  <Text style={[styles.statValue, { color: '#00F0FF' }]}>PKR {remaining.toLocaleString()}</Text>
                </View>
              </View>

              <Text style={styles.promptText}>
                You stayed under budget! How would you like to handle the remaining amount?
              </Text>

              <View style={styles.actionGrid}>
                <TouchableOpacity style={[styles.actionBtn, styles.btnRollOver]} onPress={onRollOver}>
                  <ArrowRightCircle color="#000" size={20} />
                  <View style={styles.actionTextContainer}>
                    <Text style={styles.actionTitleObj_dark}>Roll Over</Text>
                    <Text style={styles.actionSub_dark}>Add to this month's budget</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.actionBtn, styles.btnSave]} onPress={onSave}>
                  <PiggyBank color="#000" size={20} />
                  <View style={styles.actionTextContainer}>
                    <Text style={styles.actionTitleObj_dark}>Save It</Text>
                    <Text style={styles.actionSub_dark}>Log as savings entry</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.actionBtn, styles.btnReset]} onPress={onReset}>
                  <RotateCcw color="#FFFFFF" size={20} />
                  <View style={styles.actionTextContainer}>
                    <Text style={styles.actionTitleObj_light}>Reset</Text>
                    <Text style={styles.actionSub_light}>Start fresh with base budget</Text>
                  </View>
                </TouchableOpacity>
              </View>

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
  statusLabel: { fontFamily: 'Outfit_800ExtraBold', color: '#00F0FF', fontSize: 24, letterSpacing: 2 },
  statusThreshold: { color: '#A0A0A0', fontFamily: 'Inter_500Medium', fontSize: 12, marginTop: 4 },
  
  statsGrid: { gap: 12, marginBottom: 24 },
  statItem: { padding: 16, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statItemHighlight: { backgroundColor: 'rgba(0, 240, 255, 0.03)', borderColor: 'rgba(0, 240, 255, 0.1)' },
  statLabel: { color: '#606060', fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 1 },
  statValue: { color: '#FFFFFF', fontFamily: 'Outfit_600SemiBold', fontSize: 18 },
  
  promptText: { color: '#FFFFFF', fontFamily: 'Inter_500Medium', fontSize: 14, lineHeight: 22, marginBottom: 20, textAlign: 'center' },
  
  actionGrid: { gap: 12 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, gap: 16 },
  btnRollOver: { backgroundColor: '#00F0FF' },
  btnSave: { backgroundColor: '#10B981' },
  btnReset: { backgroundColor: '#262626', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  
  actionTextContainer: { flex: 1 },
  actionTitleObj_dark: { color: '#0A0A0A', fontFamily: 'Outfit_800ExtraBold', fontSize: 16 },
  actionSub_dark: { color: 'rgba(0,0,0,0.6)', fontFamily: 'Inter_500Medium', fontSize: 11, marginTop: 2 },
  actionTitleObj_light: { color: '#FFFFFF', fontFamily: 'Outfit_800ExtraBold', fontSize: 16 },
  actionSub_light: { color: '#A0A0A0', fontFamily: 'Inter_500Medium', fontSize: 11, marginTop: 2 }
});

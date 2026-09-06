import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Keyboard
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { X, CheckCircle2, Copy, Repeat, Hash } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { useThemeColors } from '../lib/ThemeContext';
import { useSnackbar } from './Snackbar';
import { Bill } from '../lib/store';

interface BillPaymentModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (amount: number) => void;
  bill: Bill | null;
}

export default function BillPaymentModal({ visible, onClose, onConfirm, bill }: BillPaymentModalProps) {
  const colors = useThemeColors();
  const { showSnackbar } = useSnackbar();
  const [amount, setAmount] = useState('');

  useEffect(() => {
    if (bill) {
      setAmount(bill.amount.toString());
    }
  }, [bill, visible]);

  if (!bill) return null;

  const handleCopyConsumerNumber = async () => {
    if (bill.consumerNumber) {
      await Clipboard.setStringAsync(bill.consumerNumber);
      showSnackbar(`Copied Reference #${bill.consumerNumber}`);
    }
  };

  const handleConfirm = () => {
    const parsedAmount = parseFloat(amount);
    if (!isNaN(parsedAmount) && parsedAmount > 0) {
      onConfirm(parsedAmount);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <View style={styles.container}>
            <LinearGradient colors={[colors.modalGradientStart, colors.modalGradientEnd] as const} style={[styles.modalContent, { borderColor: colors.cardBorder }]}>
              <View style={styles.header}>
                <View style={styles.headerLeft}>
                  <View style={styles.headerMetaRow}>
                    <Text style={[styles.headerLabel, { color: colors.textTertiary }]}>CONFIRM PAYMENT</Text>
                    {bill.frequency && (
                      <View style={[styles.freqBadge, { backgroundColor: `${colors.purple}20`, borderColor: `${colors.purple}40` }]}>
                        <Repeat color={colors.purple} size={10} style={{ marginRight: 4 }} />
                        <Text style={[styles.freqBadgeText, { color: colors.purple }]}>{bill.frequency.toUpperCase()}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.billName, { color: colors.textPrimary }]} numberOfLines={1}>{bill.name}</Text>
                </View>
                <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.closeBtnBg }]}>
                  <X color={colors.textSecondary} size={20} />
                </TouchableOpacity>
              </View>

              {bill.consumerNumber ? (
                <TouchableOpacity 
                  style={[styles.refChip, { backgroundColor: colors.surface, borderColor: colors.cardBorderSubtle }]}
                  onPress={handleCopyConsumerNumber}
                  activeOpacity={0.7}
                >
                  <View style={styles.refLeft}>
                    <Hash color={colors.accent} size={14} style={{ marginRight: 6 }} />
                    <Text style={[styles.refLabel, { color: colors.textTertiary }]}>REF / ACC:</Text>
                    <Text style={[styles.refValue, { color: colors.textPrimary }]} numberOfLines={1}>{bill.consumerNumber}</Text>
                  </View>
                  <View style={[styles.copyIconBtn, { backgroundColor: `${colors.accent}15` }]}>
                    <Copy color={colors.accent} size={12} style={{ marginRight: 4 }} />
                    <Text style={[styles.copyBtnText, { color: colors.accent }]}>Copy</Text>
                  </View>
                </TouchableOpacity>
              ) : null}

              <View style={styles.inputSection}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>PAYMENT AMOUNT</Text>
                <View style={[styles.inputWrapper, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
                  <Text style={[styles.currencyPrefix, { color: colors.accent }]}>PKR</Text>
                  <TextInput
                    style={[styles.amountInput, { color: colors.textPrimary }]}
                    value={amount}
                    onChangeText={setAmount}
                    onBlur={() => {
                      if (!amount.trim()) setAmount('');
                    }}
                    keyboardType="numeric"
                    placeholder="0.0"
                    placeholderTextColor={colors.textMuted}
                    autoFocus
                    returnKeyType="done"
                    onSubmitEditing={() => Keyboard.dismiss()}
                  />
                </View>
              </View>

              <View style={styles.actions}>
                <TouchableOpacity style={[styles.cancelBtn, { backgroundColor: colors.closeBtnBg }]} onPress={onClose}>
                  <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.confirmBtn, { backgroundColor: colors.saveBtnBg }]} onPress={handleConfirm}>
                  <CheckCircle2 color={colors.saveBtnText} size={18} style={{ marginRight: 8 }} />
                  <Text style={[styles.confirmText, { color: colors.saveBtnText }]}>Confirm Payment</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  keyboardView: { width: '100%' },
  container: { width: '100%' },
  modalContent: { 
    borderTopLeftRadius: 32, 
    borderTopRightRadius: 32, 
    padding: 24, 
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    borderTopWidth: 1, 
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start', 
    marginBottom: 24 
  },
  headerLeft: { flex: 1 },
  headerMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  headerLabel: { 
    fontFamily: 'Inter_700Bold', 
    fontSize: 10, 
    letterSpacing: 1.5, 
  },
  freqBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  freqBadgeText: {
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.5,
  },
  billName: { 
    fontFamily: 'Outfit_800ExtraBold', 
    fontSize: 24 
  },
  refChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 20,
  },
  refLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  refLabel: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.5,
    marginRight: 6,
  },
  refValue: {
    fontSize: 13,
    fontFamily: 'Outfit_600SemiBold',
    flex: 1,
  },
  copyIconBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  copyBtnText: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
  },
  closeBtn: { 
    width: 36, 
    height: 36, 
    borderRadius: 18, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  inputSection: { marginBottom: 32 },
  inputLabel: { 
    fontFamily: 'Inter_700Bold', 
    fontSize: 10, 
    letterSpacing: 1, 
    marginBottom: 12 
  },
  inputWrapper: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    borderRadius: 20, 
    paddingHorizontal: 20, 
    paddingVertical: 16, 
    borderWidth: 1, 
  },
  currencyPrefix: { 
    fontFamily: 'Outfit_600SemiBold', 
    fontSize: 18, 
    marginRight: 12 
  },
  amountInput: { 
    fontFamily: 'Outfit_600SemiBold', 
    fontSize: 24, 
    flex: 1, 
    padding: 0 
  },
  actions: { flexDirection: 'row', gap: 12 },
  cancelBtn: { 
    flex: 1, 
    height: 56, 
    borderRadius: 16, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  cancelText: { 
    fontFamily: 'Outfit_700Bold', 
    fontSize: 16 
  },
  confirmBtn: { 
    flex: 2, 
    height: 56, 
    borderRadius: 16, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  confirmText: { 
    fontFamily: 'Outfit_800ExtraBold', 
    fontSize: 16 
  }
});
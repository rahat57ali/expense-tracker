import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  TextInput,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { X, CheckCircle2 } from 'lucide-react-native';
import { useThemeColors } from '../lib/ThemeContext';
import { Bill } from '../lib/store';

interface BillPaymentModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (amount: number) => void;
  bill: Bill | null;
}

export default function BillPaymentModal({ visible, onClose, onConfirm, bill }: BillPaymentModalProps) {
  const colors = useThemeColors();
  const [amount, setAmount] = useState('');

  useEffect(() => {
    if (bill) {
      setAmount(bill.amount.toString());
    }
  }, [bill, visible]);

  if (!bill) return null;

  const handleConfirm = () => {
    const parsedAmount = parseFloat(amount);
    if (!isNaN(parsedAmount) && parsedAmount > 0) {
      onConfirm(parsedAmount);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <View style={styles.container}>
            <LinearGradient colors={[colors.modalGradientStart, colors.modalGradientEnd] as const} style={[styles.modalContent, { borderColor: colors.cardBorder }]}>
              <View style={styles.header}>
                <View style={styles.headerLeft}>
                  <Text style={[styles.headerLabel, { color: colors.textTertiary }]}>CONFIRM PAYMENT</Text>
                  <Text style={[styles.billName, { color: colors.textPrimary }]} numberOfLines={1}>{bill.name}</Text>
                </View>
                <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.closeBtnBg }]}>
                  <X color={colors.textSecondary} size={20} />
                </TouchableOpacity>
              </View>

              <View style={styles.inputSection}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>PAYMENT AMOUNT</Text>
                <View style={[styles.inputWrapper, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
                  <Text style={[styles.currencyPrefix, { color: colors.accent }]}>PKR</Text>
                  <TextInput
                    style={[styles.amountInput, { color: colors.textPrimary }]}
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="numeric"
                    placeholder="0.00"
                    placeholderTextColor={colors.textMuted}
                    autoFocus
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
  headerLabel: { 
    fontFamily: 'Inter_700Bold', 
    fontSize: 10, 
    letterSpacing: 1.5, 
    marginBottom: 4 
  },
  billName: { 
    fontFamily: 'Outfit_800ExtraBold', 
    fontSize: 24 
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
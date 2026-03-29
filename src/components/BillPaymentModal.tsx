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
import { Bill } from '../lib/store';

interface BillPaymentModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (amount: number) => void;
  bill: Bill | null;
}

export default function BillPaymentModal({ visible, onClose, onConfirm, bill }: BillPaymentModalProps) {
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
      <View style={styles.overlay}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <View style={styles.container}>
            <LinearGradient colors={['#1A1A1A', '#0A0A0A']} style={styles.modalContent}>
              <View style={styles.header}>
                <View style={styles.headerLeft}>
                  <Text style={styles.headerLabel}>CONFIRM PAYMENT</Text>
                  <Text style={styles.billName} numberOfLines={1}>{bill.name}</Text>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                  <X color="#A0A0A0" size={20} />
                </TouchableOpacity>
              </View>

              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>PAYMENT AMOUNT</Text>
                <View style={styles.inputWrapper}>
                  <Text style={styles.currencyPrefix}>PKR</Text>
                  <TextInput
                    style={styles.amountInput}
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="numeric"
                    placeholder="0.00"
                    placeholderTextColor="rgba(255,255,255,0.1)"
                    autoFocus
                  />
                </View>
              </View>

              <View style={styles.actions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
                  <CheckCircle2 color="#0A0A0A" size={18} style={{ marginRight: 8 }} />
                  <Text style={styles.confirmText}>Confirm Payment</Text>
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
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  keyboardView: { width: '100%' },
  container: { width: '100%' },
  modalContent: { 
    borderTopLeftRadius: 32, 
    borderTopRightRadius: 32, 
    padding: 24, 
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    borderTopWidth: 1, 
    borderColor: 'rgba(255,255,255,0.1)' 
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start', 
    marginBottom: 24 
  },
  headerLeft: { flex: 1 },
  headerLabel: { 
    color: '#606060', 
    fontFamily: 'Inter_700Bold', 
    fontSize: 10, 
    letterSpacing: 1.5, 
    marginBottom: 4 
  },
  billName: { 
    color: '#FFFFFF', 
    fontFamily: 'Outfit_800ExtraBold', 
    fontSize: 24 
  },
  closeBtn: { 
    width: 36, 
    height: 36, 
    borderRadius: 18, 
    backgroundColor: 'rgba(255,255,255,0.05)', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  inputSection: { marginBottom: 32 },
  inputLabel: { 
    color: '#A0A0A0', 
    fontFamily: 'Inter_700Bold', 
    fontSize: 10, 
    letterSpacing: 1, 
    marginBottom: 12 
  },
  inputWrapper: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(255,255,255,0.03)', 
    borderRadius: 20, 
    paddingHorizontal: 20, 
    paddingVertical: 16, 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.08)' 
  },
  currencyPrefix: { 
    color: '#00F0FF', 
    fontFamily: 'Outfit_600SemiBold', 
    fontSize: 18, 
    marginRight: 12 
  },
  amountInput: { 
    color: '#FFFFFF', 
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
    backgroundColor: 'rgba(255,255,255,0.05)', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  cancelText: { 
    color: '#A0A0A0', 
    fontFamily: 'Outfit_700Bold', 
    fontSize: 16 
  },
  confirmBtn: { 
    flex: 2, 
    height: 56, 
    borderRadius: 16, 
    backgroundColor: '#FFFFFF', 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  confirmText: { 
    color: '#0A0A0A', 
    fontFamily: 'Outfit_800ExtraBold', 
    fontSize: 16 
  }
});

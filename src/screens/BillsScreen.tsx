import React, { useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Modal, 
  TextInput,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  CreditCard, 
  Plus, 
  Calendar as CalendarIcon, 
  ArrowLeft, 
  Clock, 
  AlertCircle, 
  RefreshCw,
  Trash2,
  Check,
  X,
  Music,
  Tv,
  Zap,
  Flame,
  Globe,
  Home as HomeIcon
} from 'lucide-react-native';
import { useLedgr } from '../lib/LedgrContext';
import { Bill, autoCategorize } from '../lib/store';
import { format, differenceInDays, addDays, isBefore, startOfDay } from 'date-fns';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSnackbar } from '../components/Snackbar';
import BillPaymentModal from '../components/BillPaymentModal';

const SUGGESTIONS = [
  { name: 'Electricity', icon: Zap, color: '#F59E0B' },
  { name: 'Gas', icon: Flame, color: '#F97316' },
  { name: 'Internet', icon: Globe, color: '#00F0FF' },
  { name: 'Rent', icon: HomeIcon, color: '#8A2BE2' },
  { name: 'Subscription', icon: CreditCard, color: '#FF007F' },
];

export default function BillsScreen() {
  const { bills, addBill, updateBill, deleteBill, addExpense } = useLedgr();
  const { showSnackbar } = useSnackbar();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Bill Payment Modal State
  const [isPayModalVisible, setIsPayModalVisible] = useState(false);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);

  // Inline Delete State
  const [deletingBillId, setDeletingBillId] = useState<string | null>(null);

  const handleAddBill = async () => {
    if (!name || !amount) {
      showSnackbar('Please enter name and amount', 'error');
      return;
    }
    
    await addBill({
      name,
      amount: parseFloat(amount),
      dueDate: date.toISOString(),
      category: 'Bills',
      isPaid: false
    });
    
    setName('');
    setAmount('');
    setDate(new Date());
    setIsModalVisible(false);
    showSnackbar('Bill added successfully');
  };

  const handlePayBill = (bill: Bill) => {
    setSelectedBill(bill);
    setIsPayModalVisible(true);
  };

  const handleConfirmPayment = async (amount: number) => {
    if (!selectedBill) return;

    // Record as expense
    await addExpense({
      name: `Paid: ${selectedBill.name}`,
      amount: amount,
      category: 'Bills',
      date: new Date().toISOString()
    });

    // Update bill - increment by exactly 30 days
    const nextDueDate = addDays(new Date(selectedBill.dueDate), 30);
    await updateBill({
      ...selectedBill,
      dueDate: nextDueDate.toISOString(),
      isPaid: false // Reset paid status for the next cycle
    });

    setIsPayModalVisible(false);
    showSnackbar(`Paid ${selectedBill.name} - PKR ${amount.toLocaleString()}`);
  };

  const getBillStatus = (dueDateStr: string) => {
    const today = startOfDay(new Date());
    const dueDate = startOfDay(new Date(dueDateStr));
    const diff = differenceInDays(dueDate, today);

    if (diff < 0) return { label: `Overdue by ${Math.abs(diff)}d`, color: '#EF4444', level: 'overdue' };
    if (diff === 0) return { label: 'Due Today', color: '#F97316', level: 'urgent' };
    if (diff <= 3) return { label: `Due in ${diff}d`, color: '#FBBF24', level: 'warning' };
    return { label: `Due in ${diff}d`, color: '#606060', level: 'normal' };
  };

  const getBillIcon = (name: string) => {
    const suggestion = SUGGESTIONS.find(s => s.name.toLowerCase() === name.toLowerCase());
    if (suggestion) return suggestion.icon;
    
    // Fallback logic for custom names
    const lower = name.toLowerCase();
    if (lower.includes('electric') || lower.includes('light') || lower.includes('wapda')) return Zap;
    if (lower.includes('gas')) return Flame;
    if (lower.includes('internet') || lower.includes('wifi') || lower.includes('ptcl')) return Globe;
    if (lower.includes('rent') || lower.includes('house')) return HomeIcon;
    if (lower.includes('spotify') || lower.includes('music')) return Music;
    if (lower.includes('netflix') || lower.includes('tv') || lower.includes('youtube')) return Tv;
    return CreditCard;
  };

  const totalCommitted = useMemo(() => bills.reduce((sum, b) => sum + b.amount, 0), [bills]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Bills</Text>
          <Text style={styles.subtitle}>Subscriptions & Recurring</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>COMMITTED</Text>
            <Text style={styles.summaryValue}>PKR {totalCommitted.toLocaleString()}</Text>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={() => setIsModalVisible(true)}>
            <Plus color="#FFFFFF" size={24} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
      >
        <TouchableOpacity 
          activeOpacity={1} 
          onPress={() => setDeletingBillId(null)}
          style={{ flex: 1 }}
        >
        {bills.length === 0 ? (
          <View style={styles.emptyState}>
            <CreditCard color="rgba(255,255,255,0.05)" size={80} style={{ marginBottom: 20 }} />
            <Text style={styles.emptyTitle}>No bills yet</Text>
            <Text style={styles.emptySub}>Add your recurring subscriptions or utility bills to stay on track.</Text>
          </View>
        ) : (
          <View style={styles.billsList}>
            {bills.sort((a,b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()).map(bill => {
              const status = getBillStatus(bill.dueDate);
              const BillIcon = getBillIcon(bill.name);
              const isUrgent = status.level !== 'normal';

              return (
                <LinearGradient 
                  key={bill.id}
                  colors={['rgba(25,25,25,0.8)', 'rgba(15,15,15,0.9)']} 
                  style={[styles.billCard, { borderColor: status.level === 'overdue' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255,255,255,0.05)' }]}
                >
                  <View style={styles.billRow}>
                    <View style={styles.billMain}>
                      <View style={[styles.iconCircle, { borderColor: isUrgent ? `${status.color}30` : 'rgba(255,255,255,0.05)' }]}>
                        <BillIcon color={isUrgent ? status.color : "#00F0FF"} size={18} />
                      </View>
                      <View>
                        <Text style={styles.billName}>{bill.name}</Text>
                        <Text style={[styles.billStatus, { color: status.color }]}>{status.label}</Text>
                      </View>
                    </View>
                    <View style={styles.billAmountContainer}>
                      <Text style={styles.billAmount}>PKR {bill.amount.toLocaleString()}</Text>
                      <Text style={styles.billDate}>{format(new Date(bill.dueDate), 'MMM dd')}</Text>
                    </View>
                  </View>

                    <View style={styles.cardActions}>
                      <TouchableOpacity 
                        style={[styles.payBtn, !isUrgent && styles.payBtnSubtle]} 
                        onPress={() => handlePayBill(bill)}
                      >
                        <RefreshCw color={isUrgent ? "#FFFFFF" : "#606060"} size={12} style={{ marginRight: 6 }} />
                        <Text style={[styles.payBtnText, !isUrgent && styles.payBtnTextSubtle]}>Paid & Renew</Text>
                      </TouchableOpacity>
                      
                      <View style={styles.actionRight}>
                        {deletingBillId === bill.id ? (
                          <View style={styles.confirmDeleteContainer}>
                            <TouchableOpacity 
                              style={[styles.miniActionBtn, styles.confirmAction]} 
                              onPress={(e) => {
                                deleteBill(bill.id);
                                setDeletingBillId(null);
                              }}
                            >
                              <Check color="#FFFFFF" size={12} />
                            </TouchableOpacity>
                            <TouchableOpacity 
                              style={[styles.miniActionBtn, styles.cancelAction]} 
                              onPress={() => setDeletingBillId(null)}
                            >
                              <X color="#FFFFFF" size={12} />
                            </TouchableOpacity>
                          </View>
                        ) : (
                          <TouchableOpacity 
                            style={styles.deleteBtn} 
                            onPress={() => setDeletingBillId(bill.id)}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                          >
                            <Trash2 color="#404040" size={16} />
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                </LinearGradient>
              );
            })}
          </View>
        )}

        <View style={styles.suggestionsHeader}>
          <Text style={styles.suggestionsTitle}>Quick Add</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestionsScroll}>
          {SUGGESTIONS.map(s => (
            <TouchableOpacity 
              key={s.name} 
              style={styles.suggestionCard}
              onPress={() => {
                setName(s.name);
                setIsModalVisible(true);
              }}
            >
              <View style={[styles.suggestionIcon, { backgroundColor: `${s.color}20` }]}>
                <s.icon color={s.color} size={20} />
              </View>
              <Text style={styles.suggestionName}>{s.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={isModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <LinearGradient colors={['#1A1A1A', '#0A0A0A']} style={styles.modalInner}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add Recurring Bill</Text>
                <TouchableOpacity onPress={() => setIsModalVisible(false)} style={styles.closeBtn}>
                  <Text style={{ color: '#A0A0A0' }}>Close</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>BILL NAME</Text>
                <TextInput 
                  style={styles.input} 
                  value={name} 
                  onChangeText={setName} 
                  placeholder="e.g. Netflix" 
                  placeholderTextColor="#404040"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>AMOUNT (PKR)</Text>
                <TextInput 
                  style={styles.input} 
                  value={amount} 
                  onChangeText={setAmount} 
                  keyboardType="numeric" 
                  placeholder="0.00" 
                  placeholderTextColor="#404040"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>NEXT DUE DATE</Text>
                <TouchableOpacity style={styles.dateSelector} onPress={() => setShowDatePicker(true)}>
                  <CalendarIcon color="#00F0FF" size={18} style={{ marginRight: 10 }} />
                  <Text style={styles.dateText}>{format(date, 'MMMM dd, yyyy')}</Text>
                </TouchableOpacity>
              </View>

              {showDatePicker && (
                <DateTimePicker
                  value={date}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(false);
                    if (selectedDate) setDate(selectedDate);
                  }}
                />
              )}

              <TouchableOpacity style={styles.saveButton} onPress={handleAddBill}>
                <Text style={styles.saveButtonText}>Add Bill</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </View>
      </Modal>
      <BillPaymentModal
        visible={isPayModalVisible}
        bill={selectedBill}
        onClose={() => setIsPayModalVisible(false)}
        onConfirm={handleConfirmPayment}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, paddingBottom: 15 },
  title: { fontSize: 32, fontFamily: 'Outfit_800ExtraBold', color: '#FFFFFF' },
  subtitle: { fontSize: 13, fontFamily: 'Inter_500Medium', color: '#606060', marginTop: 4 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  summaryBox: { alignItems: 'flex-end', paddingRight: 4 },
  summaryLabel: { color: '#404040', fontSize: 8, fontFamily: 'Inter_700Bold', letterSpacing: 1.5 },
  summaryValue: { color: '#00F0FF', fontSize: 13, fontFamily: 'Outfit_600SemiBold' },
  addButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#8A2BE2', alignItems: 'center', justifyContent: 'center' },
  
  scrollContent: { padding: 24, paddingBottom: 120 },
  emptyState: { alignItems: 'center', marginTop: 60, paddingHorizontal: 40 },
  emptyTitle: { color: '#FFFFFF', fontSize: 18, fontFamily: 'Outfit_600SemiBold', marginBottom: 8 },
  emptySub: { color: '#606060', fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 20 },
  
  billsList: { gap: 12 },
  billCard: { borderRadius: 20, padding: 16, borderWidth: 1 },
  billRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  billMain: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconCircle: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255, 255, 255, 0.03)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  billName: { color: '#FFFFFF', fontSize: 16, fontFamily: 'Outfit_600SemiBold' },
  billStatus: { fontSize: 10, fontFamily: 'Inter_700Bold', marginTop: 2, letterSpacing: 0.5 },
  billAmountContainer: { alignItems: 'flex-end' },
  billAmount: { color: '#FFFFFF', fontSize: 22, fontFamily: 'Outfit_300Light' },
  billDate: { color: '#A0A0A0', fontSize: 10, fontFamily: 'Inter_500Medium', marginTop: 2 },
  
  cardActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.02)' },
  payBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.08)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  payBtnSubtle: { backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(255,255,255,0.03)' },
  payBtnText: { color: '#FFFFFF', fontSize: 11, fontFamily: 'Inter_700Bold' },
  payBtnTextSubtle: { color: '#606060' },
  deleteBtn: { padding: 4, width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  
  actionRight: { width: 62, alignItems: 'flex-end', justifyContent: 'center' },
  confirmDeleteContainer: { flexDirection: 'row', gap: 6 },
  miniActionBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmAction: { backgroundColor: '#10B981' },
  cancelAction: { backgroundColor: '#EF4444' },
  
  suggestionsHeader: { marginTop: 32, marginBottom: 12 },
  suggestionsTitle: { color: '#A0A0A0', fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 1.5 },
  suggestionsScroll: { gap: 10 },
  suggestionCard: { width: 90, backgroundColor: '#111111', padding: 12, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.03)' },
  suggestionIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  suggestionName: { color: '#606060', fontSize: 10, fontFamily: 'Inter_500Medium', textAlign: 'center' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'flex-end' },
  modalContent: { height: '75%' },
  modalInner: { flex: 1, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 },
  modalTitle: { color: '#FFFFFF', fontSize: 24, fontFamily: 'Outfit_800ExtraBold' },
  closeBtn: { padding: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12 },
  inputGroup: { marginBottom: 20 },
  label: { color: '#A0A0A0', fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 1.5, marginBottom: 8 },
  input: { backgroundColor: 'rgba(255,255,255,0.02)', height: 50, borderRadius: 14, paddingHorizontal: 16, color: '#FFFFFF', fontSize: 16, fontFamily: 'Inter_500Medium', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  dateSelector: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.02)', height: 50, borderRadius: 14, paddingHorizontal: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  dateText: { color: '#FFFFFF', fontSize: 16, fontFamily: 'Inter_500Medium' },
  saveButton: { backgroundColor: '#FFFFFF', height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  saveButtonText: { color: '#000000', fontSize: 16, fontFamily: 'Outfit_800ExtraBold' }
});

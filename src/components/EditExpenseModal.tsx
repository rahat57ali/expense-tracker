import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Modal, 
  Platform, 
  ScrollView
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  X, 
  Trash2, 
  Calendar as CalendarIcon, 
  Coffee, 
  Car, 
  Home as HomeIcon, 
  ShoppingBag, 
  Heart, 
  MoreHorizontal, 
  ShoppingBasket,
  Check
} from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLedgr } from '../lib/LedgrContext';
import { Expense, ExpenseCategory } from '../lib/store';
import { useSnackbar } from './Snackbar';

interface EditExpenseModalProps {
  visible: boolean;
  onClose: () => void;
  expense: Expense | null;
}

const CATEGORY_ICONS: Record<ExpenseCategory, any> = {
  Food: Coffee,
  Transport: Car,
  Bills: HomeIcon,
  Shopping: ShoppingBag,
  Grocery: ShoppingBasket,
  Health: Heart,
  Other: MoreHorizontal,
};



export default function EditExpenseModal({ visible, onClose, expense }: EditExpenseModalProps) {
  const { updateExpense, deleteExpense, allCategories } = useLedgr();
  const { showSnackbar } = useSnackbar();
  
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Other');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const amountRef = useRef<TextInput>(null);

  useEffect(() => {
    if (expense) {
      setName(expense.name);
      setAmount(expense.amount.toString());
      setCategory(expense.category);
      setDate(new Date(expense.date));
      setShowDeleteConfirm(false);
    }
  }, [expense, visible]);

  const handleUpdate = async () => {
    if (!expense || !name || !amount) return;
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) return;

    await updateExpense({
      ...expense,
      name,
      amount: amt,
      category,
      date: date.toISOString(),
    });

    showSnackbar('Expense updated successfully!', 'success');
    onClose();
  };

  const handleDelete = async () => {
    if (!expense) return;
    await deleteExpense(expense.id);
    showSnackbar('Expense removed.', 'success');
    onClose();
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) setDate(selectedDate);
  };

  if (!expense) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
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
              <View>
                <Text style={styles.headerTitle}>Edit Transaction</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <X color="#A0A0A0" size={20} />
              </TouchableOpacity>
            </View>

            <KeyboardAwareScrollView 
              showsVerticalScrollIndicator={false}
              extraScrollHeight={20}
              keyboardShouldPersistTaps="handled"
              scrollEnabled={true}
            >
              <View style={styles.form}>
                <Text style={styles.label}>DESCRIPTION</Text>
                <View style={styles.inputRow}>
                  <TextInput
                    style={[styles.input, { padding: 0 }]}
                    value={name}
                    onChangeText={setName}
                    placeholder="E.g. Starbucks Coffee"
                    placeholderTextColor="#404040"
                    returnKeyType="next"
                    onSubmitEditing={() => amountRef.current?.focus()}
                  />
                </View>

                <Text style={styles.label}>AMOUNT (PKR)</Text>
                <View style={styles.inputRow}>
                  <TextInput
                    ref={amountRef}
                    style={[styles.inputAmount, { padding: 0 }]}
                    value={amount}
                    onChangeText={setAmount}
                    placeholder="0.00"
                    placeholderTextColor="#404040"
                    keyboardType="numeric"
                    returnKeyType="done"
                  />
                </View>

                <Text style={styles.label}>TRANSACTION DATE</Text>
                <TouchableOpacity 
                  style={styles.dateSelector} 
                  onPress={() => setShowDatePicker(true)}
                >
                  <CalendarIcon color="#00F0FF" size={18} />
                  <Text style={styles.dateText}>{date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</Text>
                </TouchableOpacity>

                {showDatePicker && (
                  <DateTimePicker
                    value={date}
                    mode="date"
                    display="default"
                    onChange={onDateChange}
                    maximumDate={new Date()}
                  />
                )}

                <Text style={styles.label}>CATEGORY</Text>
                <View style={styles.catGrid}>
                  {(allCategories.includes(category) ? allCategories : [category, ...allCategories]).map((cat) => {
                    const Icon = CATEGORY_ICONS[cat as ExpenseCategory] || MoreHorizontal;
                    const isSelected = category === cat;
                    return (
                      <TouchableOpacity
                        key={cat}
                        style={[styles.catPill, isSelected && styles.catPillActive]}
                        onPress={() => setCategory(cat)}
                      >
                        <Icon color={isSelected ? "#0A0A0A" : "#606060"} size={14} />
                        <Text style={[styles.catPillText, isSelected && styles.catPillTextActive]}>{cat}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <View style={styles.actions}>
                  {!showDeleteConfirm ? (
                    <>
                      <TouchableOpacity style={styles.deleteBtn} onPress={() => setShowDeleteConfirm(true)}>
                        <Trash2 color="#EF4444" size={18} />
                        <Text style={styles.deleteText}>Delete</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity style={styles.saveBtn} onPress={handleUpdate}>
                        <Text style={styles.saveText}>Save Changes</Text>
                        <Check color="#0A0A0A" size={18} strokeWidth={3} />
                      </TouchableOpacity>
                    </>
                  ) : (
                    <>
                      <TouchableOpacity style={[styles.deleteBtn, { backgroundColor: '#EF4444', borderColor: '#EF4444' }]} onPress={handleDelete}>
                        <Check color="#FFFFFF" size={18} strokeWidth={3} />
                        <Text style={[styles.deleteText, { color: '#FFFFFF' }]}>Confirm</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity style={[styles.saveBtn, { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }]} onPress={() => setShowDeleteConfirm(false)}>
                        <Text style={[styles.saveText, { color: '#A0A0A0' }]}>Cancel</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>
            </KeyboardAwareScrollView>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  container: { height: '68%', width: '100%' },
  modalContent: { flex: 1, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 16, paddingBottom: 5, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  headerTitle: { color: '#FFFFFF', fontFamily: 'Outfit_800ExtraBold', fontSize: 24 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' },
  
  form: { gap: 10 },
  label: { color: '#A0A0A0', fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.5, marginBottom: 2 },
  inputRow: { backgroundColor: '#020202', borderRadius: 16, height: 50, paddingHorizontal: 16, justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  input: { color: '#FFFFFF', fontFamily: 'Inter_500Medium', fontSize: 16 },
  inputAmount: { color: '#FFFFFF', fontFamily: 'Outfit_600SemiBold', fontSize: 20 },
  
  dateSelector: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(0, 240, 255, 0.05)', height: 50, paddingHorizontal: 16, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(0, 240, 255, 0.2)' },
  dateText: { color: '#FFFFFF', fontFamily: 'Inter_500Medium', fontSize: 16 },
  
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catPill: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: '#020202', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  catPillActive: { backgroundColor: '#00F0FF', borderColor: '#00F0FF' },
  catPillText: { color: '#606060', fontFamily: 'Inter_500Medium', fontSize: 13 },
  catPillTextActive: { color: '#0A0A0A', fontFamily: 'Inter_700Bold' },
  
  actions: { flexDirection: 'row', gap: 16, marginTop: 10, paddingBottom: 30 },
  deleteBtn: { flex: 1, height: 52, borderRadius: 16, backgroundColor: 'rgba(239, 68, 68, 0.08)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.2)' },
  deleteText: { color: '#EF4444', fontFamily: 'Outfit_800ExtraBold', fontSize: 16 },
  saveBtn: { flex: 2, height: 52, borderRadius: 16, backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  saveText: { color: '#0A0A0A', fontFamily: 'Outfit_800ExtraBold', fontSize: 16 },
});

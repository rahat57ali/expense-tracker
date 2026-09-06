import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Switch,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  X, Calendar as CalendarIcon, Check, Trash2, Repeat, Tag,
  Hash, FileText, PauseCircle, PlayCircle
} from 'lucide-react-native';
import { useThemeColors } from '../lib/ThemeContext';
import { Bill, BillFrequency, ExpenseCategory, autoCategorize } from '../lib/store';
import { format } from 'date-fns';
import DateTimePicker from '@react-native-community/datetimepicker';

interface AddEditBillModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (billData: Omit<Bill, 'id'> | Bill) => void;
  onDelete?: (billId: string) => void;
  bill?: Bill | null;
  initialName?: string;
  categories: ExpenseCategory[];
}

const FREQUENCIES: { label: string; value: BillFrequency }[] = [
  { label: 'Monthly', value: 'monthly' },
  { label: 'Yearly', value: 'yearly' },
  { label: 'Quarterly', value: 'quarterly' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'One-time', value: 'one-time' },
];

export default function AddEditBillModal({
  visible,
  onClose,
  onSave,
  onDelete,
  bill,
  initialName = '',
  categories,
}: AddEditBillModalProps) {
  const colors = useThemeColors();
  const isEditing = !!bill;

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date());
  const [category, setCategory] = useState<ExpenseCategory>('Bills');
  const [frequency, setFrequency] = useState<BillFrequency>('monthly');
  const [consumerNumber, setConsumerNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [isPaused, setIsPaused] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const amountInputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      if (bill) {
        setName(bill.name);
        setAmount(bill.amount.toString());
        setDate(new Date(bill.dueDate));
        setCategory(bill.category || 'Bills');
        setFrequency(bill.frequency || 'monthly');
        setConsumerNumber(bill.consumerNumber || '');
        setNotes(bill.notes || '');
        setIsPaused(!!bill.isPaused);
      } else {
        setName(initialName);
        setAmount('');
        setDate(new Date());
        setCategory(initialName ? autoCategorize(initialName) : 'Bills');
        setFrequency('monthly');
        setConsumerNumber('');
        setNotes('');
        setIsPaused(false);
      }
      setIsDeleting(false);
    }
  }, [visible, bill, initialName]);

  const handleNameChange = (text: string) => {
    setName(text);
    if (!isEditing && text.trim() && category === 'Bills') {
      const suggested = autoCategorize(text);
      if (suggested && suggested !== 'Other') {
        setCategory(suggested);
      }
    }
  };

  const handleSave = () => {
    const trimmedName = name.trim();
    const parsedAmount = parseFloat(amount);

    if (!trimmedName) {
      Alert.alert('Missing Name', 'Please enter a bill name.');
      return;
    }
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount.');
      return;
    }

    const payload: any = {
      name: trimmedName,
      amount: parsedAmount,
      dueDate: format(date, "yyyy-MM-dd'T'HH:mm:ss"),
      category: category || 'Bills',
      frequency,
      consumerNumber: consumerNumber.trim() || undefined,
      notes: notes.trim() || undefined,
      isPaused,
    };

    if (isEditing && bill) {
      onSave({
        ...bill,
        ...payload,
      });
    } else {
      payload.isPaid = false;
      onSave(payload);
    }
    onClose();
  };

  const handleDelete = () => {
    if (!bill || !onDelete) return;
    onDelete(bill.id);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardAvoid}
        >
          <View style={styles.modalContent}>
            <LinearGradient
              colors={[colors.modalGradientStart, colors.modalGradientEnd]}
              style={styles.modalInner}
            >
              {/* Header */}
              <View style={styles.modalHeader}>
                <View>
                  <Text style={[styles.modalHeaderSubtitle, { color: colors.textSecondary }]}>
                    {isEditing ? 'UPDATE COMMITMENT' : 'NEW RECURRING BILL'}
                  </Text>
                  <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                    {isEditing ? 'Edit Bill' : 'Add Recurring Bill'}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={onClose}
                  style={[styles.closeBtn, { backgroundColor: colors.closeBtnBg }]}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <X color={colors.textSecondary} size={20} />
                </TouchableOpacity>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollBody}
                keyboardShouldPersistTaps="handled"
              >
                {/* Bill Name */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>BILL NAME</Text>
                  <TextInput
                    style={[
                      styles.input,
                      { backgroundColor: colors.inputBg, color: colors.textPrimary, borderColor: colors.inputBorder }
                    ]}
                    value={name}
                    onChangeText={handleNameChange}
                    placeholder="e.g. LESCO Electricity, Netflix"
                    placeholderTextColor={colors.textMuted}
                    returnKeyType="next"
                    onSubmitEditing={() => amountInputRef.current?.focus()}
                  />
                </View>

                {/* Amount */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>AMOUNT (PKR)</Text>
                  <TextInput
                    ref={amountInputRef}
                    style={[
                      styles.input,
                      { backgroundColor: colors.inputBg, color: colors.textPrimary, borderColor: colors.inputBorder }
                    ]}
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="numeric"
                    placeholder="0.00"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>

                {/* Due Date */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>NEXT DUE DATE</Text>
                  <TouchableOpacity
                    style={[
                      styles.dateSelector,
                      { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }
                    ]}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <CalendarIcon color={colors.accent} size={18} style={{ marginRight: 10 }} />
                    <Text style={[styles.dateText, { color: colors.textPrimary }]}>
                      {format(date, 'MMMM dd, yyyy')}
                    </Text>
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

                {/* Frequency / Recurrence */}
                <View style={styles.inputGroup}>
                  <View style={styles.labelRow}>
                    <Repeat color={colors.textSecondary} size={13} style={{ marginRight: 6 }} />
                    <Text style={[styles.label, { color: colors.textSecondary, marginBottom: 0 }]}>
                      BILLING CYCLE
                    </Text>
                  </View>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.chipsRow}
                  >
                    {FREQUENCIES.map(f => {
                      const isSelected = frequency === f.value;
                      return (
                        <TouchableOpacity
                          key={f.value}
                          onPress={() => setFrequency(f.value)}
                          style={[
                            styles.chip,
                            {
                              backgroundColor: isSelected ? colors.purple : colors.pillBg,
                              borderColor: isSelected ? colors.purple : colors.cardBorderSubtle,
                            }
                          ]}
                        >
                          <Text
                            style={[
                              styles.chipText,
                              { color: isSelected ? '#FFFFFF' : colors.textSecondary }
                            ]}
                          >
                            {f.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>

                {/* Consumer / Reference ID */}
                <View style={styles.inputGroup}>
                  <View style={styles.labelRow}>
                    <Hash color={colors.textSecondary} size={13} style={{ marginRight: 6 }} />
                    <Text style={[styles.label, { color: colors.textSecondary, marginBottom: 0 }]}>
                      CONSUMER / REFERENCE # (OPTIONAL)
                    </Text>
                  </View>
                  <TextInput
                    style={[
                      styles.input,
                      { backgroundColor: colors.inputBg, color: colors.textPrimary, borderColor: colors.inputBorder }
                    ]}
                    value={consumerNumber}
                    onChangeText={setConsumerNumber}
                    placeholder="e.g. 14-digit Ref or Account ID for 1-tap copy"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="default"
                  />
                </View>

                {/* Category Picker */}
                <View style={styles.inputGroup}>
                  <View style={styles.labelRow}>
                    <Tag color={colors.textSecondary} size={13} style={{ marginRight: 6 }} />
                    <Text style={[styles.label, { color: colors.textSecondary, marginBottom: 0 }]}>
                      CATEGORY
                    </Text>
                  </View>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.chipsRow}
                  >
                    {categories.map(cat => {
                      const isSelected = category === cat;
                      return (
                        <TouchableOpacity
                          key={cat}
                          onPress={() => setCategory(cat)}
                          style={[
                            styles.chip,
                            {
                              backgroundColor: isSelected ? colors.accent : colors.pillBg,
                              borderColor: isSelected ? colors.accent : colors.cardBorderSubtle,
                            }
                          ]}
                        >
                          <Text
                            style={[
                              styles.chipText,
                              { color: isSelected ? '#000000' : colors.textSecondary }
                            ]}
                          >
                            {cat}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>

                {/* Notes */}
                <View style={styles.inputGroup}>
                  <View style={styles.labelRow}>
                    <FileText color={colors.textSecondary} size={13} style={{ marginRight: 6 }} />
                    <Text style={[styles.label, { color: colors.textSecondary, marginBottom: 0 }]}>
                      NOTES (OPTIONAL)
                    </Text>
                  </View>
                  <TextInput
                    style={[
                      styles.inputMultiline,
                      { backgroundColor: colors.inputBg, color: colors.textPrimary, borderColor: colors.inputBorder }
                    ]}
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="e.g. Card used, login link, package details"
                    placeholderTextColor={colors.textMuted}
                    multiline
                    numberOfLines={2}
                  />
                </View>

                {/* Pause / Resume Toggle (Edit Mode) */}
                {isEditing && (
                  <View
                    style={[
                      styles.pauseToggleCard,
                      { backgroundColor: colors.surface, borderColor: colors.cardBorderSubtle }
                    ]}
                  >
                    <View style={styles.pauseToggleInfo}>
                      {isPaused ? (
                        <PauseCircle color={colors.warning} size={20} style={{ marginRight: 10 }} />
                      ) : (
                        <PlayCircle color={colors.success} size={20} style={{ marginRight: 10 }} />
                      )}
                      <View>
                        <Text style={[styles.pauseToggleTitle, { color: colors.textPrimary }]}>
                          {isPaused ? 'Subscription Paused' : 'Active Subscription'}
                        </Text>
                        <Text style={[styles.pauseToggleDesc, { color: colors.textTertiary }]}>
                          {isPaused
                            ? 'Paused bills will not trigger alerts or count toward active monthly commitment.'
                            : 'Active and tracked in your monthly commitments.'}
                        </Text>
                      </View>
                    </View>
                    <Switch
                      value={!isPaused}
                      onValueChange={val => setIsPaused(!val)}
                      trackColor={{ false: colors.divider, true: colors.purple }}
                      thumbColor="#FFFFFF"
                    />
                  </View>
                )}

                {/* Action Buttons */}
                <View style={styles.actionContainer}>
                  <TouchableOpacity
                    style={[styles.saveButton, { backgroundColor: colors.saveBtnBg }]}
                    onPress={handleSave}
                    activeOpacity={0.8}
                  >
                    <Check color={colors.saveBtnText} size={20} style={{ marginRight: 8 }} />
                    <Text style={[styles.saveButtonText, { color: colors.saveBtnText }]}>
                      {isEditing ? 'Save Changes' : 'Add Bill'}
                    </Text>
                  </TouchableOpacity>

                  {isEditing && onDelete && (
                    <View style={styles.deleteSection}>
                      {isDeleting ? (
                        <View style={styles.deleteConfirmRow}>
                          <Text style={[styles.deleteConfirmText, { color: colors.danger }]}>
                            Delete this bill?
                          </Text>
                          <View style={styles.deleteConfirmBtns}>
                            <TouchableOpacity
                              style={[styles.deleteConfirmBtn, { backgroundColor: colors.danger }]}
                              onPress={handleDelete}
                            >
                              <Text style={styles.deleteConfirmBtnText}>Delete</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[styles.deleteCancelBtn, { backgroundColor: colors.closeBtnBg }]}
                              onPress={() => setIsDeleting(false)}
                            >
                              <Text style={[styles.deleteCancelBtnText, { color: colors.textSecondary }]}>
                                Cancel
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={styles.deleteTriggerBtn}
                          onPress={() => setIsDeleting(true)}
                        >
                          <Trash2 color={colors.danger} size={16} style={{ marginRight: 6 }} />
                          <Text style={[styles.deleteTriggerText, { color: colors.danger }]}>
                            Delete Bill
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </View>
              </ScrollView>
            </LinearGradient>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  keyboardAvoid: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    height: '85%',
  },
  modalInner: {
    flex: 1,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 20,
    paddingHorizontal: 24,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  modalHeaderSubtitle: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 22,
    fontFamily: 'Outfit_800ExtraBold',
  },
  closeBtn: {
    padding: 8,
    borderRadius: 12,
  },
  scrollBody: {
    paddingBottom: 30,
  },
  inputGroup: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    borderWidth: 1,
  },
  inputMultiline: {
    minHeight: 64,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    borderWidth: 1,
    textAlignVertical: 'top',
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
  },
  dateText: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  pauseToggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  pauseToggleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  pauseToggleTitle: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 2,
  },
  pauseToggleDesc: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    lineHeight: 15,
  },
  actionContainer: {
    marginTop: 10,
  },
  saveButton: {
    height: 52,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontSize: 15,
    fontFamily: 'Outfit_700Bold',
  },
  deleteSection: {
    marginTop: 16,
    alignItems: 'center',
  },
  deleteTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  deleteTriggerText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  deleteConfirmRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  deleteConfirmText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  deleteConfirmBtns: {
    flexDirection: 'row',
    gap: 8,
  },
  deleteConfirmBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  deleteConfirmBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
  },
  deleteCancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  deleteCancelBtnText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
});

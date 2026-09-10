import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import { X, Sparkles, Gift, Briefcase, RotateCcw, Zap, Tag, MoreHorizontal, Coffee, Car, Home as HomeIcon, ShoppingBag, Heart, ShoppingBasket } from 'lucide-react-native';
import { useLedgr } from '../lib/LedgrContext';
import { useTheme } from '../lib/ThemeContext';
import { useSnackbar } from './Snackbar';
import { ExpenseCategory } from '../lib/store';

interface AddToBudgetModalProps {
  visible: boolean;
  onClose: () => void;
}

const CATEGORY_ICONS: Record<string, any> = {
  Food: Coffee,
  Transport: Car,
  Bills: HomeIcon,
  Shopping: ShoppingBag,
  Grocery: ShoppingBasket,
  Health: Heart,
  Other: MoreHorizontal,
};

const PRESET_AMOUNTS = [1000, 5000, 10000, 25000];

const REASON_PRESETS = [
  { label: 'Bonus', icon: Sparkles },
  { label: 'Freelance', icon: Briefcase },
  { label: 'Gift', icon: Gift },
  { label: 'Refund', icon: RotateCcw },
  { label: 'Side Gig', icon: Zap },
  { label: 'Other', icon: Tag },
];

export default function AddToBudgetModal({ visible, onClose }: AddToBudgetModalProps) {
  const { colors, isDark } = useTheme();
  const { allCategories, addBudgetAddition, budget } = useLedgr();
  const { showSnackbar } = useSnackbar();

  const [amountStr, setAmountStr] = useState('');
  const [targetType, setTargetType] = useState<'overall' | 'category'>('overall');
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory>(allCategories[0] || 'Food');
  const [selectedReason, setSelectedReason] = useState('Bonus');
  const [customReason, setCustomReason] = useState('');

  useEffect(() => {
    if (visible) {
      setAmountStr('');
      setTargetType('overall');
      setSelectedCategory(allCategories[0] || 'Food');
      setSelectedReason('Bonus');
      setCustomReason('');
    }
  }, [visible, allCategories]);

  const parsedAmount = parseInt(amountStr.replace(/[^0-9]/g, ''), 10) || 0;

  const handleQuickAddAmount = (addValue: number) => {
    const current = parsedAmount;
    const nextVal = current + addValue;
    setAmountStr(nextVal.toString());
  };

  const handleSave = async () => {
    if (parsedAmount <= 0) {
      showSnackbar('Please enter a valid amount', 'error');
      return;
    }

    const finalReason = selectedReason === 'Other' && customReason.trim()
      ? customReason.trim()
      : selectedReason;

    await addBudgetAddition({
      amount: parsedAmount,
      reason: finalReason,
      targetCategory: targetType === 'category' ? selectedCategory : undefined,
      date: new Date().toISOString().split('T')[0],
    });

    const targetLabel = targetType === 'category' ? selectedCategory : 'Overall Budget';
    showSnackbar(`Added PKR ${parsedAmount.toLocaleString()} to ${targetLabel}!`, 'success');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.overlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.sheetContainer}
          >
            <View style={[styles.sheet, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              {/* Header */}
              <View style={styles.sheetHeader}>
                <View>
                  <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>Add to Budget</Text>
                  <Text style={[styles.sheetSubtitle, { color: colors.textTertiary }]}>
                    Received extra money mid-month? Add it here.
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.closeBtn, { backgroundColor: colors.surface }]}
                  onPress={onClose}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <X size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: 16 }}
              >
                {/* Amount Input */}
                <View style={[styles.inputBox, { backgroundColor: colors.surface, borderColor: colors.inputBorder }]}>
                  <Text style={[styles.currencyPrefix, { color: colors.accent }]}>PKR</Text>
                  <TextInput
                    style={[styles.amountInput, { color: colors.textPrimary }]}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={colors.textMuted}
                    value={amountStr}
                    onChangeText={val => setAmountStr(val.replace(/[^0-9]/g, ''))}
                    autoFocus
                  />
                </View>

                {/* Quick Add Chips */}
                <View style={styles.chipsRow}>
                  {PRESET_AMOUNTS.map(amt => (
                    <TouchableOpacity
                      key={amt}
                      style={[styles.quickChip, { backgroundColor: colors.surface, borderColor: colors.cardBorderSubtle }]}
                      onPress={() => handleQuickAddAmount(amt)}
                    >
                      <Text style={[styles.quickChipText, { color: colors.accent }]}>
                        +{amt >= 1000 ? `${amt / 1000}k` : amt}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Where to add: Overall vs Category */}
                <Text style={[styles.fieldLabel, { color: colors.textTertiary }]}>WHERE SHOULD THIS GO?</Text>
                <View style={[styles.targetToggle, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
                  <TouchableOpacity
                    style={[
                      styles.toggleOption,
                      targetType === 'overall' && { backgroundColor: colors.accentBg }
                    ]}
                    onPress={() => setTargetType('overall')}
                  >
                    <Text style={[
                      styles.toggleOptionText,
                      { color: targetType === 'overall' ? colors.accent : colors.textTertiary }
                    ]}>
                      Overall Monthly Budget
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.toggleOption,
                      targetType === 'category' && { backgroundColor: colors.accentBg }
                    ]}
                    onPress={() => setTargetType('category')}
                  >
                    <Text style={[
                      styles.toggleOptionText,
                      { color: targetType === 'category' ? colors.accent : colors.textTertiary }
                    ]}>
                      Specific Category
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Category Picker (if category selected) */}
                {targetType === 'category' && (
                  <View style={styles.categoryPickerSection}>
                    <Text style={[styles.fieldLabel, { color: colors.textTertiary, marginTop: 12 }]}>
                      SELECT CATEGORY
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catScroll}>
                      {allCategories.map(cat => {
                        const Icon = CATEGORY_ICONS[cat] || MoreHorizontal;
                        const isSelected = selectedCategory === cat;
                        return (
                          <TouchableOpacity
                            key={cat}
                            style={[
                              styles.catChip,
                              { backgroundColor: colors.surface, borderColor: colors.cardBorderSubtle },
                              isSelected && { backgroundColor: colors.accentBg, borderColor: colors.accent }
                            ]}
                            onPress={() => setSelectedCategory(cat)}
                          >
                            <Icon size={14} color={isSelected ? colors.accent : colors.textSecondary} />
                            <Text style={[
                              styles.catChipText,
                              { color: isSelected ? colors.accent : colors.textSecondary }
                            ]}>
                              {cat}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                )}

                {/* Reason Chips */}
                <Text style={[styles.fieldLabel, { color: colors.textTertiary, marginTop: 16 }]}>
                  REASON / SOURCE
                </Text>
                <View style={styles.reasonsGrid}>
                  {REASON_PRESETS.map(preset => {
                    const Icon = preset.icon;
                    const isSelected = selectedReason === preset.label;
                    return (
                      <TouchableOpacity
                        key={preset.label}
                        style={[
                          styles.reasonChip,
                          { backgroundColor: colors.surface, borderColor: colors.cardBorderSubtle },
                          isSelected && { backgroundColor: colors.accentBg, borderColor: colors.accent }
                        ]}
                        onPress={() => setSelectedReason(preset.label)}
                      >
                        <Icon size={13} color={isSelected ? colors.accent : colors.textSecondary} />
                        <Text style={[
                          styles.reasonChipText,
                          { color: isSelected ? colors.accent : colors.textSecondary }
                        ]}>
                          {preset.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Custom Note input if 'Other' selected */}
                {selectedReason === 'Other' && (
                  <TextInput
                    style={[styles.customReasonInput, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.inputBorder }]}
                    placeholder="E.g., Tax refund, sold old monitor..."
                    placeholderTextColor={colors.textMuted}
                    value={customReason}
                    onChangeText={setCustomReason}
                  />
                )}

                {/* Live Impact Preview */}
                {parsedAmount > 0 && (
                  <View style={[styles.previewCard, { backgroundColor: colors.accentBg, borderColor: `${colors.accent}30` }]}>
                    <Text style={[styles.previewTitle, { color: colors.accent }]}>✨ Budget Impact</Text>
                    <Text style={[styles.previewText, { color: colors.textSecondary }]}>
                      {targetType === 'overall'
                        ? `Total budget increases from PKR ${budget.total.toLocaleString()} to PKR ${(budget.total + parsedAmount).toLocaleString()}.`
                        : `${selectedCategory} limit increases from PKR ${(budget.categories[selectedCategory] || 0).toLocaleString()} to PKR ${((budget.categories[selectedCategory] || 0) + parsedAmount).toLocaleString()}.`}
                    </Text>
                  </View>
                )}

                {/* Submit Button */}
                <TouchableOpacity
                  style={[
                    styles.submitBtn,
                    { backgroundColor: colors.accent, opacity: parsedAmount > 0 ? 1 : 0.5 }
                  ]}
                  onPress={handleSave}
                  disabled={parsedAmount <= 0}
                >
                  <Text style={[styles.submitBtnText, { color: '#0A0A0A' }]}>
                    {parsedAmount > 0 ? `Add PKR ${parsedAmount.toLocaleString()} to Budget` : 'Enter Amount'}
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    width: '100%',
    maxHeight: '90%',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  sheetTitle: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 20,
  },
  sheetSubtitle: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 10,
  },
  currencyPrefix: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 18,
    marginRight: 10,
  },
  amountInput: {
    flex: 1,
    fontFamily: 'Outfit_700Bold',
    fontSize: 24,
    padding: 0,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 18,
  },
  quickChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  quickChipText: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 12,
  },
  fieldLabel: {
    fontFamily: 'Inter_700Bold',
    fontSize: 9,
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  targetToggle: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 4,
    marginBottom: 12,
  },
  toggleOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  toggleOptionText: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 12,
  },
  categoryPickerSection: {
    marginBottom: 8,
  },
  catScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  catChipText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
  },
  reasonsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  reasonChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  reasonChipText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
  },
  customReasonInput: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    marginBottom: 12,
  },
  previewCard: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 6,
    marginBottom: 16,
  },
  previewTitle: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 12,
    marginBottom: 4,
  },
  previewText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    lineHeight: 17,
  },
  submitBtn: {
    borderRadius: 16,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  submitBtnText: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 15,
  },
});

import React from 'react';
import { Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useThemeColors } from '../lib/ThemeContext';

interface CrossPlatformDatePickerProps {
  value: Date;
  visible: boolean;
  onClose: () => void;
  onChange: (_event: any, selectedDate?: Date) => void;
  maximumDate?: Date;
}

export default function CrossPlatformDatePicker({
  value,
  visible,
  onClose,
  onChange,
  maximumDate,
}: CrossPlatformDatePickerProps) {
  const colors = useThemeColors();
  const [draftValue, setDraftValue] = React.useState(value.toISOString().slice(0, 10));

  React.useEffect(() => {
    setDraftValue(value.toISOString().slice(0, 10));
  }, [value, visible]);

  if (!visible) return null;

  const handleConfirm = () => {
    const parsed = new Date(draftValue);
    if (!isNaN(parsed.getTime())) {
      onChange(null, maximumDate && parsed > maximumDate ? maximumDate : parsed);
    } else {
      onClose();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Select date</Text>
          <TextInput
            value={draftValue}
            onChangeText={setDraftValue}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.textMuted}
            style={[styles.input, { color: colors.textPrimary, backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}
          />
          <View style={styles.actions}>
            <TouchableOpacity style={[styles.button, { backgroundColor: colors.closeBtnBg }]} onPress={onClose}>
              <Text style={[styles.buttonText, { color: colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, { backgroundColor: colors.saveBtnBg }]} onPress={handleConfirm}>
              <Text style={[styles.buttonText, { color: colors.saveBtnText }]}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
  },
  title: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 18,
    marginBottom: 12,
  },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  button: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 14,
  },
});

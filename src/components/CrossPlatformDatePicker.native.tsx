import React from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';

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
  if (!visible) return null;

  return (
    <DateTimePicker
      value={value}
      mode="date"
      display="default"
      onValueChange={(event, date) => onChange(event, date)}
      onDismiss={onClose}
      maximumDate={maximumDate}
    />
  );
}

import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ViewStyle } from 'react-native';
import { useThemeColors } from '../lib/ThemeContext';
import { LucideIcon } from 'lucide-react-native';

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel?: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: 'default' | 'danger' | 'success';
  Icon?: LucideIcon;
  iconColor?: string;
}

export default function CustomAlert({
  visible,
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmVariant = 'default',
  Icon,
  iconColor,
}: CustomAlertProps) {
  const colors = useThemeColors();

  const getConfirmStyle = (): ViewStyle => {
    switch (confirmVariant) {
      case 'danger': return { backgroundColor: colors.danger };
      case 'success': return { backgroundColor: colors.success };
      default: return { backgroundColor: colors.accent };
    }
  };

  const getConfirmText = () => {
    return colors.background; // On solid accent/danger/success, background (black/white) works best
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
          {Icon && (
            <View style={[styles.iconContainer, { backgroundColor: (iconColor || colors.accent) + '15' }]}>
              <Icon color={iconColor || colors.accent} size={28} />
            </View>
          )}
          
          <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
          <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>
          
          <View style={styles.actions}>
            {onCancel && (
              <TouchableOpacity 
                style={[styles.btn, styles.cancelBtn, { borderColor: colors.divider }]} 
                onPress={onCancel}
              >
                <Text style={[styles.btnText, { color: colors.textSecondary }]}>{cancelLabel}</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={[styles.btn, getConfirmStyle()]} 
              onPress={onConfirm}
            >
              <Text style={[styles.btnText, { color: getConfirmText() }]}>{confirmLabel}</Text>
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
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modal: {
    width: '100%',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    alignItems: 'center',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  btn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtn: {
    borderWidth: 1,
  },
  btnText: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 15,
  },
});

import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity,
  ScrollView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AlertCircle, Info, X } from 'lucide-react-native';
import { useThemeColors } from '../lib/ThemeContext';

interface DeleteCategoryModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  categoryName: string;
}

export default function DeleteCategoryModal({ 
  visible, 
  onClose, 
  onConfirm, 
  categoryName
}: DeleteCategoryModalProps) {
  const colors = useThemeColors();

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <View style={styles.container}>
          <LinearGradient
            colors={[colors.modalGradientStart, colors.modalGradientEnd] as const}
            style={[styles.modalContent, { borderColor: colors.cardBorder }]}
          >
            <View style={styles.header}>
              <View style={styles.titleRow}>
                <AlertCircle color={colors.danger} size={20} />
                <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Confirm Deletion</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.closeBtnBg }]}>
                <X color={colors.textSecondary} size={20} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ flexShrink: 1 }}>
              <Text style={[styles.descriptionText, { color: colors.textPrimary }]}>
                <Text style={[styles.highlight, { color: colors.accent }]}>"{categoryName}"</Text> will be removed from your active categories. Your past expenses and stats will stay under their original category.
              </Text>

              <View style={[styles.infoBox, { backgroundColor: colors.innerCardBg }]}>
                <Info color={colors.textTertiary} size={16} />
                <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                  This only affects new entries — historical data remains unchanged.
                </Text>
              </View>
            </ScrollView>

            <View style={styles.actions}>
              <TouchableOpacity style={[styles.cancelBtn, { backgroundColor: colors.closeBtnBg, borderColor: colors.cardBorderSubtle }]} onPress={onClose}>
                <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={[styles.deleteBtn, { backgroundColor: colors.danger }]} onPress={onConfirm}>
                <Text style={[styles.deleteText, { color: '#FFFFFF' }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
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
    padding: 24 
  },
  container: { 
    width: '100%', 
    maxHeight: '90%' 
  },
  modalContent: { 
    borderRadius: 32, 
    padding: 24, 
    borderWidth: 1, 
    flexShrink: 1 
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 24 
  },
  titleRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 10 
  },
  headerTitle: { 
    fontFamily: 'Outfit_700Bold', 
    fontSize: 20 
  },
  closeBtn: { 
    width: 36, 
    height: 36, 
    borderRadius: 18, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  
  descriptionText: { 
    fontFamily: 'Inter_500Medium', 
    fontSize: 14, 
    lineHeight: 22, 
    marginBottom: 24 
  },
  highlight: {
    fontFamily: 'Inter_700Bold',
  },
  
  infoBox: { 
    flexDirection: 'row', 
    padding: 16, 
    borderRadius: 16, 
    gap: 12, 
    alignItems: 'flex-start' 
  },
  infoText: { 
    flex: 1, 
    fontFamily: 'Inter_500Medium', 
    fontSize: 12, 
    lineHeight: 18 
  },
  
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24
  },
  cancelBtn: { 
    flex: 1,
    height: 50, 
    borderRadius: 100, 
    alignItems: 'center', 
    justifyContent: 'center',
    borderWidth: 1,
  },
  cancelText: { 
    fontFamily: 'Outfit_600SemiBold', 
    fontSize: 15 
  },
  deleteBtn: { 
    flex: 2,
    height: 50, 
    borderRadius: 100, 
    alignItems: 'center', 
    justifyContent: 'center'
  },
  deleteText: { 
    fontFamily: 'Outfit_800ExtraBold', 
    fontSize: 15 
  }
});
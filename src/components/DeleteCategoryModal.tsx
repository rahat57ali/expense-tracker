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
  return (
    <Modal
      visible={visible}
      animationType="fade"
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
              <View style={styles.titleRow}>
                <AlertCircle color="#EF4444" size={20} />
                <Text style={styles.headerTitle}>Confirm Deletion</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <X color="#A0A0A0" size={20} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ flexShrink: 1 }}>
              <Text style={styles.descriptionText}>
                <Text style={styles.highlight}>"{categoryName}"</Text> will be removed from your active categories. Your past expenses and stats will stay under their original category.
              </Text>

              <View style={styles.infoBox}>
                <Info color="#606060" size={16} />
                <Text style={styles.infoText}>
                  This only affects new entries — historical data remains unchanged.
                </Text>
              </View>
            </ScrollView>

            <View style={styles.actions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.deleteBtn} onPress={onConfirm}>
                <Text style={styles.deleteText}>Delete</Text>
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
    backgroundColor: 'rgba(0,0,0,0.9)', 
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
    borderColor: 'rgba(255,255,255,0.1)', 
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
    color: '#FFFFFF', 
    fontFamily: 'Outfit_700Bold', 
    fontSize: 20 
  },
  closeBtn: { 
    width: 36, 
    height: 36, 
    borderRadius: 18, 
    backgroundColor: 'rgba(255,255,255,0.05)', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  

  
  descriptionText: { 
    color: '#FFFFFF', 
    fontFamily: 'Inter_500Medium', 
    fontSize: 14, 
    lineHeight: 22, 
    marginBottom: 24 
  },
  highlight: {
    fontFamily: 'Inter_700Bold',
    color: '#00F0FF'
  },
  
  infoBox: { 
    flexDirection: 'row', 
    padding: 16, 
    backgroundColor: 'rgba(255,255,255,0.03)', 
    borderRadius: 16, 
    gap: 12, 
    alignItems: 'flex-start' 
  },
  infoText: { 
    flex: 1, 
    color: '#606060', 
    fontFamily: 'Inter_500Medium', 
    fontSize: 12, 
    lineHeight: 18 
  },
  infoHighlight: {
    color: '#A0A0A0',
    fontFamily: 'Inter_700Bold'
  },
  
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24
  },
  cancelBtn: { 
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.03)', 
    height: 50, 
    borderRadius: 100, 
    alignItems: 'center', 
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)'
  },
  cancelText: { 
    color: '#A0A0A0', 
    fontFamily: 'Outfit_600SemiBold', 
    fontSize: 15 
  },
  deleteBtn: { 
    flex: 2,
    backgroundColor: '#EF4444', 
    height: 50, 
    borderRadius: 100, 
    alignItems: 'center', 
    justifyContent: 'center'
  },
  deleteText: { 
    color: '#FFFFFF', 
    fontFamily: 'Outfit_800ExtraBold', 
    fontSize: 15 
  }
});

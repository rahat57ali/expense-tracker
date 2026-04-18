import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity, Image, Dimensions, Alert
} from 'react-native';
import { X, Trash2, ChevronLeft, ChevronRight, Receipt } from 'lucide-react-native';
import { useThemeColors } from '../../lib/ThemeContext';
import CustomAlert from '../CustomAlert';

interface Props {
  visible: boolean;
  photos: string[];
  initialIndex: number;
  onClose: () => void;
  onDelete: (uri: string) => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function GroceryPhotoViewer({ visible, photos, initialIndex, onClose, onDelete }: Props) {
  const colors = useThemeColors();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [alertVisible, setAlertVisible] = useState(false);

  const currentPhoto = photos[currentIndex];

  if (!currentPhoto) return null;

  const handleDelete = () => {
    setAlertVisible(true);
  };

  const confirmDelete = () => {
    setAlertVisible(false);
    onDelete(currentPhoto);
    if (photos.length <= 1) {
      onClose();
    } else if (currentIndex >= photos.length - 1) {
      setCurrentIndex(Math.max(0, currentIndex - 1));
    }
  };

  const goNext = () => {
    if (currentIndex < photos.length - 1) setCurrentIndex(currentIndex + 1);
  };

  const goPrev = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  return (
    <Modal visible={visible} animationType="fade" transparent={true} onRequestClose={onClose}>
      <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.95)' }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.closeBtnBg }]}>
            <X color="#FFFFFF" size={22} />
          </TouchableOpacity>
          <Text style={styles.counter}>{currentIndex + 1} / {photos.length}</Text>
          <TouchableOpacity onPress={handleDelete} style={[styles.deleteBtn, { backgroundColor: colors.dangerBg }]}>
            <Trash2 color={colors.danger} size={18} />
          </TouchableOpacity>
        </View>

        {/* Image */}
        <View style={styles.imageContainer}>
          {currentIndex > 0 && (
            <TouchableOpacity style={[styles.navBtn, styles.navLeft]} onPress={goPrev}>
              <ChevronLeft color="#FFFFFF" size={28} />
            </TouchableOpacity>
          )}
          <Image
            source={{ uri: currentPhoto }}
            style={styles.image}
            resizeMode="contain"
          />
          {currentIndex < photos.length - 1 && (
            <TouchableOpacity style={[styles.navBtn, styles.navRight]} onPress={goNext}>
              <ChevronRight color="#FFFFFF" size={28} />
            </TouchableOpacity>
          )}
        </View>
      </View>
      <CustomAlert
        visible={alertVisible}
        title="Delete Photo"
        message="Are you sure you want to delete this receipt photo?"
        confirmLabel="Delete"
        confirmVariant="danger"
        Icon={Trash2}
        onConfirm={confirmDelete}
        onCancel={() => setAlertVisible(false)}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counter: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: '#FFFFFF',
  },
  deleteBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: SCREEN_WIDTH - 32,
    height: SCREEN_HEIGHT * 0.7,
  },
  navBtn: {
    position: 'absolute',
    zIndex: 10,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLeft: { left: 16 },
  navRight: { right: 16 },
});

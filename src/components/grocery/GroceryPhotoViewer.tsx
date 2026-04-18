import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform
} from 'react-native';
import ImageView from 'react-native-image-viewing';
import { X, Trash2 } from 'lucide-react-native';
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
  const [currentIndex, setCurrentIndex] = React.useState(initialIndex);
  const [alertVisible, setAlertVisible] = React.useState(false);

  // Sync index when viewer opens or initialIndex changes
  React.useEffect(() => {
    if (visible) {
      setCurrentIndex(initialIndex);
    }
  }, [visible, initialIndex]);

  const images = React.useMemo(() => photos.map(uri => ({ uri })), [photos]);
  const currentPhoto = photos[currentIndex];

  if (photos.length === 0) return null;

  const handleDelete = () => {
    setAlertVisible(true);
  };

  const confirmDelete = () => {
    setAlertVisible(false);
    onDelete(currentPhoto);
    if (photos.length <= 1) {
      onClose();
    } else {
      // Library handle internal index but we keep state for header/delete logic
      if (currentIndex >= photos.length - 1) {
        setCurrentIndex(Math.max(0, currentIndex - 1));
      }
    }
  };

  const HeaderComponent = ({ imageIndex }: { imageIndex: number }) => {
    // Sync external state for delete logic if needed, though library handles display
    React.useEffect(() => {
      setCurrentIndex(imageIndex);
    }, [imageIndex]);

    return (
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
          <X color="#FFFFFF" size={22} />
        </TouchableOpacity>
        <Text style={styles.counter}>{imageIndex + 1} / {photos.length}</Text>
        <TouchableOpacity onPress={handleDelete} style={[styles.deleteBtn, { backgroundColor: 'rgba(239, 68, 68, 0.2)' }]}>
          <Trash2 color="#EF4444" size={18} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <>
      <ImageView
        images={images}
        imageIndex={currentIndex}
        visible={visible}
        onRequestClose={onClose}
        HeaderComponent={HeaderComponent}
        swipeToCloseEnabled={true}
        doubleTapToZoomEnabled={true}
      />
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
    </>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 12,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counter: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  deleteBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

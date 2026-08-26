import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import ImageView from 'react-native-image-viewing';
import { X, Trash2 } from 'lucide-react-native';
import CustomAlert from '../CustomAlert';

interface Props {
  visible: boolean;
  photos: string[];
  initialIndex: number;
  onClose: () => void;
  onDelete: (uri: string) => void;
}

export default function GroceryPhotoViewer({ visible, photos, initialIndex, onClose, onDelete }: Props) {
  const [currentIndex, setCurrentIndex] = React.useState(initialIndex);
  const [alertVisible, setAlertVisible] = React.useState(false);

  React.useEffect(() => {
    if (visible) setCurrentIndex(initialIndex);
  }, [visible, initialIndex]);

  const images = React.useMemo(() => photos.map(uri => ({ uri })), [photos]);
  const currentPhoto = photos[currentIndex];

  if (photos.length === 0) return null;

  const confirmDelete = () => {
    setAlertVisible(false);
    onDelete(currentPhoto);
    if (photos.length <= 1) {
      onClose();
    } else if (currentIndex >= photos.length - 1) {
      setCurrentIndex(Math.max(0, currentIndex - 1));
    }
  };

  const HeaderComponent = ({ imageIndex }: { imageIndex: number }) => {
    React.useEffect(() => {
      setCurrentIndex(imageIndex);
    }, [imageIndex]);

    return (
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <X color="#FFFFFF" size={22} />
        </TouchableOpacity>
        <Text style={styles.counter}>{imageIndex + 1} / {photos.length}</Text>
        <TouchableOpacity onPress={() => setAlertVisible(true)} style={styles.deleteBtn}>
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
        swipeToCloseEnabled
        doubleTapToZoomEnabled
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
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  counter: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  deleteBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
});

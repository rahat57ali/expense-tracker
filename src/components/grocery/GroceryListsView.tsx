import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, FlatList } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { Plus, ShoppingBasket, Camera, Check, ClipboardList } from 'lucide-react-native';
import { useThemeColors } from '../../lib/ThemeContext';
import { useGrocery } from '../../lib/GroceryContext';
import { GroceryList } from '../../lib/store';
import GroceryListDetailModal from './GroceryListDetailModal';

interface Props {
  scrollContainerStyle?: any;
}

export default function GroceryListsView({ scrollContainerStyle }: Props) {
  const colors = useThemeColors();
  const { lists, createList, addPhoto } = useGrocery();
  const [showCreateInput, setShowCreateInput] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [selectedList, setSelectedList] = useState<GroceryList | null>(null);
  const [isDetailVisible, setIsDetailVisible] = useState(false);

  const activeLists = lists.filter(l => l.status === 'active');
  const completedLists = lists.filter(l => l.status === 'complete');

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    const created = await createList(newTitle.trim());
    setNewTitle('');
    setShowCreateInput(false);
    setSelectedList(created);
    setIsDetailVisible(true);
  };
  
  const handleAddPhoto = async (listId: string) => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Camera access is required to take receipt photos.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!result.canceled && result.assets[0]) {
      await addPhoto(listId, result.assets[0].uri);
      Alert.alert('Success', 'Receipt photo captured');
    }
  };

  const openList = (list: GroceryList) => {
    setSelectedList(list);
    setIsDetailVisible(true);
  };

  const renderListCard = (list: GroceryList) => {
    const totalItems = list.items.length;
    const boughtItems = list.items.filter(i => i.isBought).length;
    const isComplete = list.status === 'complete';
    const hasPhotos = list.photoUris.length > 0;

    return (
      <TouchableOpacity
        key={list.id}
        onPress={() => openList(list)}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          style={[
            styles.listCard,
            { borderColor: colors.cardBorderSubtle },
            isComplete && { 
              backgroundColor: colors.successBg, 
              borderColor: colors.success + '40',
            }
          ]}
        >
          <View style={styles.cardMain}>
            <View style={[styles.cardIconBox, { backgroundColor: isComplete ? colors.successBg : colors.accentBg }]}>
              {isComplete
                ? <Check color={colors.success} size={20} />
                : <ShoppingBasket color={colors.accent} size={20} />
              }
            </View>
            
            <View style={styles.cardCenter}>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]} numberOfLines={1}>{list.title}</Text>
              <Text style={[styles.cardDate, { color: colors.textTertiary }]}>
                {new Date(list.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
              </Text>
            </View>

            <View style={styles.cardRight}>
              <View style={styles.cardStatsColumn}>
                <Text style={[styles.statValue, { color: isComplete ? colors.success : colors.accent }]}>
                  {boughtItems}/{totalItems}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textTertiary }]}>BOUGHT</Text>
              </View>

              {isComplete ? (
                <TouchableOpacity 
                  style={[styles.cameraActionBtn, { backgroundColor: colors.accentBg }]}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleAddPhoto(list.id);
                  }}
                >
                  <Camera color={colors.accent} size={18} />
                </TouchableOpacity>
              ) : null}
              
              {hasPhotos && !isComplete && (
                <View style={[styles.photoBadge, { backgroundColor: colors.purpleBg }]}>
                  <Camera color={colors.purple} size={12} />
                  <Text style={[styles.photoBadgeText, { color: colors.purple }]}>{list.photoUris.length}</Text>
                </View>
              )}
            </View>
          </View>

          <View style={[styles.progressBarBg, { backgroundColor: colors.divider, height: 4, marginTop: 12 }]}>
            <View style={[
              styles.progressBarFill,
              {
                width: totalItems > 0 ? `${(boughtItems / totalItems) * 100}%` : '0%',
                backgroundColor: isComplete ? colors.success : colors.accent
              }
            ]} />
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Create new list input */}
      {showCreateInput ? (
        <View style={[styles.createCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
          <TextInput
            style={[styles.createInput, { color: colors.textPrimary, backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}
            placeholder="List name (e.g. Weekly Groceries)"
            placeholderTextColor={colors.textMuted}
            value={newTitle}
            onChangeText={setNewTitle}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleCreate}
          />
          <View style={styles.createActions}>
            <TouchableOpacity
              style={[styles.createBtn, { backgroundColor: colors.closeBtnBg }]}
              onPress={() => { setShowCreateInput(false); setNewTitle(''); }}
            >
              <Text style={[styles.createBtnText, { color: colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.createBtn, { backgroundColor: colors.saveBtnBg, opacity: newTitle.trim() ? 1 : 0.4 }]}
              onPress={handleCreate}
              disabled={!newTitle.trim()}
            >
              <Text style={[styles.createBtnText, { color: colors.saveBtnText }]}>Create</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.surface, borderColor: colors.cardBorderSubtle }]}
          onPress={() => setShowCreateInput(true)}
          activeOpacity={0.7}
        >
          <Plus color={colors.accent} size={20} />
          <Text style={[styles.addBtnText, { color: colors.accent }]}>New Grocery List</Text>
        </TouchableOpacity>
      )}

      {/* Active Lists */}
      {activeLists.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>ACTIVE</Text>
          {activeLists.map(renderListCard)}
        </View>
      )}

      {/* Completed Lists */}
      {completedLists.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>COMPLETED</Text>
          {completedLists.map(renderListCard)}
        </View>
      )}

      {/* Empty State */}
      {lists.length === 0 && !showCreateInput && (
        <View style={styles.emptyState}>
          <ClipboardList color={colors.textMuted} size={48} />
          <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>No grocery lists yet</Text>
          <Text style={[styles.emptySub, { color: colors.textTertiary }]}>Tap the button above to create your first list</Text>
        </View>
      )}

      {/* Detail Modal */}
      <GroceryListDetailModal
        visible={isDetailVisible}
        listId={selectedList?.id || null}
        onClose={() => {
          setIsDetailVisible(false);
          setSelectedList(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: 20 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 56,
    borderRadius: 18,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    marginBottom: 20,
  },
  addBtnText: { fontFamily: 'Outfit_700Bold', fontSize: 15 },
  createCard: {
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  createInput: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    borderRadius: 16,
    height: 52,
    paddingHorizontal: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  createActions: { flexDirection: 'row', gap: 12 },
  createBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createBtnText: { fontFamily: 'Outfit_700Bold', fontSize: 15 },
  section: { marginBottom: 12 },
  sectionLabel: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 10,
    letterSpacing: 2,
    marginBottom: 12,
    marginTop: 8,
    opacity: 0.6,
  },
  listCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  cardMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardCenter: { flex: 1 },
  cardTitle: { fontFamily: 'Outfit_700Bold', fontSize: 16 },
  cardDate: { fontFamily: 'Inter_600SemiBold', fontSize: 10, marginTop: 2, opacity: 0.6 },
  cardRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardStatsColumn: { alignItems: 'flex-end', minWidth: 60 },
  statValue: { fontFamily: 'Outfit_800ExtraBold', fontSize: 18, lineHeight: 20 },
  statLabel: { fontFamily: 'Inter_800ExtraBold', fontSize: 8, letterSpacing: 0.5 },
  cameraActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  photoBadgeText: { fontFamily: 'Inter_800ExtraBold', fontSize: 9 },
  progressBarBg: { height: 4, borderRadius: 2, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 2 },
  emptyState: { alignItems: 'center', paddingTop: 80 },
  emptyTitle: { fontFamily: 'Outfit_700Bold', fontSize: 20, marginTop: 20 },
  emptySub: { fontFamily: 'Inter_500Medium', fontSize: 14, marginTop: 8, textAlign: 'center', paddingHorizontal: 40, lineHeight: 20 },
});

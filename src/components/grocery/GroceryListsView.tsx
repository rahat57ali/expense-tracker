import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, FlatList
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
  const { lists, createList } = useGrocery();
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
          <View style={styles.cardTop}>
            <View style={[styles.cardIconBox, { backgroundColor: isComplete ? colors.successBg : colors.accentBg }]}>
              {isComplete
                ? <Check color={colors.success} size={20} />
                : <ShoppingBasket color={colors.accent} size={20} />
              }
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]} numberOfLines={1}>{list.title}</Text>
              <Text style={[styles.cardDate, { color: colors.textTertiary }]}>
                {new Date(list.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
              </Text>
            </View>
            <View style={styles.cardMeta}>
              {hasPhotos && (
                <View style={[styles.photoBadge, { backgroundColor: colors.purpleBg }]}>
                  <Camera color={colors.purple} size={12} />
                  <Text style={[styles.photoBadgeText, { color: colors.purple }]}>{list.photoUris.length}</Text>
                </View>
              )}
            </View>
          </View>
          <View style={styles.cardBottom}>
            <View style={[styles.progressBarBg, { backgroundColor: colors.divider }]}>
              <View style={[
                styles.progressBarFill,
                {
                  width: totalItems > 0 ? `${(boughtItems / totalItems) * 100}%` : '0%',
                  backgroundColor: isComplete ? colors.success : colors.accent
                }
              ]} />
            </View>
            <View style={styles.cardStats}>
              <Text style={[styles.statText, { color: colors.textTertiary }]}>
                {totalItems} {totalItems === 1 ? 'item' : 'items'}
              </Text>
              <Text style={[styles.statText, { color: isComplete ? colors.success : colors.accent }]}>
                {boughtItems} of {totalItems} bought
              </Text>
            </View>
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
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    marginBottom: 12,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 14,
  },
  cardIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { fontFamily: 'Outfit_700Bold', fontSize: 18 },
  cardDate: { fontFamily: 'Inter_600SemiBold', fontSize: 11, marginTop: 2, opacity: 0.7 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  photoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  photoBadgeText: { fontFamily: 'Inter_800ExtraBold', fontSize: 10 },
  cardBottom: { gap: 10 },
  progressBarBg: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 3 },
  cardStats: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statText: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  emptyState: { alignItems: 'center', paddingTop: 80 },
  emptyTitle: { fontFamily: 'Outfit_700Bold', fontSize: 20, marginTop: 20 },
  emptySub: { fontFamily: 'Inter_500Medium', fontSize: 14, marginTop: 8, textAlign: 'center', paddingHorizontal: 40, lineHeight: 20 },
});

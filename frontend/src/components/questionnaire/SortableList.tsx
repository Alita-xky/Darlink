import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';
import { Stickers, Colors } from '@/constants/theme';

export type SortableItem = { key: string; label: string };

type Props = {
  items: SortableItem[];
  onChange: (next: SortableItem[]) => void;
};

export function SortableList({ items, onChange }: Props) {
  const renderItem = ({ item, drag, isActive, getIndex }: RenderItemParams<SortableItem>) => (
    <ScaleDecorator>
      <View
        style={[styles.row, isActive && styles.rowActive]}
        onTouchStart={drag}
      >
        <Text style={styles.rank}>{(getIndex() ?? 0) + 1}</Text>
        <Text style={styles.label}>{item.label}</Text>
        <Text style={styles.handle}>⋮⋮</Text>
      </View>
    </ScaleDecorator>
  );

  return (
    <DraggableFlatList
      data={items}
      keyExtractor={(it) => it.key}
      renderItem={renderItem}
      onDragEnd={({ data }) => onChange(data)}
      activationDistance={6}
    />
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Stickers.cream.bg,
    borderColor: Stickers.cream.edge,
    borderWidth: 3,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginVertical: 4,
    gap: 12,
  },
  rowActive: { backgroundColor: Stickers.peach.bg, borderColor: Stickers.peach.edge },
  rank: { fontSize: 18, fontWeight: '800', color: Colors.text, width: 24, textAlign: 'center' },
  label: { flex: 1, fontSize: 15, color: Colors.text },
  handle: { fontSize: 18, color: Colors.textMuted },
});

import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Stickers, StickerPalette, Radii, Shadows } from '@/constants/theme';

type Props = {
  palette?: StickerPalette;
  rotation?: number;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
};

export function StickerCard({ palette = 'cream', rotation = 0, style, children }: Props) {
  const colors = Stickers[palette];
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.bg,
          borderColor: colors.edge,
          transform: [{ rotate: `${rotation}deg` }],
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 4,
    borderRadius: Radii.lg,
    padding: 16,
    ...Shadows.sticker,
  },
});

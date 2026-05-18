import React, { useEffect } from 'react';
import { StyleProp, StyleSheet, Text, TextStyle, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Colors, Stickers, StickerPalette } from '@/constants/theme';
import { PressableScale } from '@/src/components/PressableScale';

type Props = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  palette?: StickerPalette;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

export function StickerChip({ label, selected = false, onPress, palette = 'cream', style, textStyle }: Props) {
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    if (selected) {
      rotation.value = withSpring(5, { damping: 8 });
      scale.value = withSpring(1.05, { damping: 8 });
    } else {
      rotation.value = withSpring(0, { damping: 12 });
      scale.value = withSpring(1, { damping: 12 });
    }
  }, [selected, rotation, scale]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }, { scale: scale.value }],
  }));

  const colors = Stickers[palette];

  return (
    <PressableScale
      onPress={() => {
        Haptics.selectionAsync();
        onPress?.();
      }}
      haptic="none"
      scaleDown={0.95}
    >
      <Animated.View
        style={[
          styles.chip,
          {
            backgroundColor: selected ? colors.accent : colors.bg,
            borderColor: colors.edge,
          },
          animStyle,
          style,
        ]}
      >
        <Text
          style={[
            styles.label,
            { color: selected ? '#fff' : Colors.text },
            textStyle,
          ]}
        >
          {label}
        </Text>
      </Animated.View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 3,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
  },
});

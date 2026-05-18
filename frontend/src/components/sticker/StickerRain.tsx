import React, { useEffect } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { DoodleIcon, type DoodleName } from './DoodleIcon';
import { Stickers } from '@/constants/theme';

const NAMES: DoodleName[] = ['book', 'coffee', 'star', 'heart', 'sparkle', 'cloud', 'music', 'pencil'];
const COLORS = [Stickers.cream.accent, Stickers.matcha.accent, Stickers.peach.accent, Stickers.lavender.accent];

const { width: W, height: H } = Dimensions.get('window');

type StickerProps = {
  name: DoodleName;
  size: number;
  color: string;
  finalX: number;
  finalY: number;
  delay: number;
  baseRotation: number;
};

function FallingSticker({ name, size, color, finalX, finalY, delay, baseRotation }: StickerProps) {
  const y = useSharedValue(-60);
  const rotation = useSharedValue(baseRotation);

  useEffect(() => {
    y.value = withDelay(delay, withSpring(finalY, { damping: 8, stiffness: 60 }));
    rotation.value = withDelay(
      delay + 400,
      withRepeat(
        withSequence(
          withTiming(baseRotation + 5, { duration: 1500 }),
          withTiming(baseRotation - 5, { duration: 1500 }),
        ),
        -1,
        true,
      ),
    );
  }, [y, rotation, delay, finalY, baseRotation]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: y.value }, { rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View style={[styles.sticker, { left: finalX, opacity: 0.8 }, animStyle]}>
      <DoodleIcon name={name} size={size} color={color} />
    </Animated.View>
  );
}

type Props = {
  count?: number;
};

export function StickerRain({ count = 10 }: Props) {
  const stickers = React.useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      name: NAMES[i % NAMES.length],
      size: 24 + Math.floor(Math.random() * 24), // 24-48
      color: COLORS[i % COLORS.length],
      finalX: Math.floor(Math.random() * (W - 60)) + 10,
      finalY: Math.floor(Math.random() * (H - 240)) + 80,
      delay: Math.floor(Math.random() * 600),
      baseRotation: Math.floor(Math.random() * 30) - 15,
    }));
  }, [count]);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {stickers.map((s, i) => (
        <FallingSticker key={i} {...s} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  sticker: { position: 'absolute' },
});

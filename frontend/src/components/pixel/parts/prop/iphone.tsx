import React from 'react';
import { G, Rect } from 'react-native-svg';
import type { PaletteColors } from '../../palette';

export default function PropIphone({ palette }: { palette: PaletteColors }) {
  return (
    <G>
      {/* Phone body */}
      <Rect x={28} y={62} width={8} height={16} fill={palette.outline} />
      {/* Screen (lighter inset) */}
      <Rect x={29} y={64} width={6} height={11} fill={palette.prop} />
      {/* Home button at bottom */}
      <Rect x={31} y={76} width={2} height={2} fill={palette.prop} />
    </G>
  );
}

import React from 'react';
import { G, Rect } from 'react-native-svg';
import type { PaletteColors } from '../../palette';

export default function PropLaptop({ palette }: { palette: PaletteColors }) {
  return (
    <G>
      {/* Screen */}
      <Rect x={22} y={62} width={20} height={12} fill={palette.prop} />
      <Rect x={24} y={64} width={16} height={8} fill={palette.outline} />
      {/* Base / keyboard */}
      <Rect x={20} y={74} width={24} height={4} fill={palette.topShade} />
    </G>
  );
}

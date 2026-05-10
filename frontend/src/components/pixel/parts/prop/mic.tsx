import React from 'react';
import { G, Rect } from 'react-native-svg';
import type { PaletteColors } from '../../palette';

export default function PropMic({ palette }: { palette: PaletteColors }) {
  return (
    <G>
      {/* Mic ball (head) */}
      <Rect x={28} y={56} width={8} height={6} fill={palette.prop} />
      <Rect x={26} y={58} width={2} height={4} fill={palette.prop} />
      <Rect x={36} y={58} width={2} height={4} fill={palette.prop} />
      <Rect x={28} y={56} width={8} height={2} fill={palette.outline} />
      <Rect x={28} y={62} width={8} height={2} fill={palette.outline} />
      {/* Stick */}
      <Rect x={30} y={64} width={4} height={14} fill={palette.topShade} />
    </G>
  );
}

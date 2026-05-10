import React from 'react';
import { G, Rect } from 'react-native-svg';
import type { PaletteColors } from '../../palette';

export default function TopShirt({ palette }: { palette: PaletteColors }) {
  return (
    <G>
      {/* Body */}
      <Rect x={14} y={48} width={36} height={24} fill={palette.top} />
      {/* V-collar (skin shows through) */}
      <Rect x={28} y={48} width={8} height={2} fill={palette.topShade} />
      <Rect x={30} y={50} width={4} height={2} fill={palette.topShade} />
      {/* Button line */}
      <Rect x={31} y={52} width={2} height={20} fill={palette.topShade} />
      {/* Sleeves */}
      <Rect x={10} y={48} width={4} height={16} fill={palette.top} />
      <Rect x={50} y={48} width={4} height={16} fill={palette.top} />
    </G>
  );
}

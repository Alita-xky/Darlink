import React from 'react';
import { View, StyleProp, ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';

type Props = {
  color?: 'yellow' | 'pink' | 'kraft';
  width?: number;
  height?: number;
  rotation?: number;
  style?: StyleProp<ViewStyle>;
};

const COLOR_MAP = {
  yellow: '#FCE38A',
  pink:   '#F8B3C5',
  kraft:  '#C9A37A',
} as const;

export function TapeStrip({ color = 'yellow', width = 80, height = 24, rotation = -3, style }: Props) {
  const fill = COLOR_MAP[color];
  const path = `M 0 4 L ${width * 0.1} 0 L ${width * 0.3} 3 L ${width * 0.5} 1 L ${width * 0.7} 4 L ${width * 0.9} 0 L ${width} 3 L ${width} ${height - 3} L ${width * 0.9} ${height} L ${width * 0.7} ${height - 4} L ${width * 0.5} ${height - 1} L ${width * 0.3} ${height - 3} L ${width * 0.1} ${height} L 0 ${height - 4} Z`;
  return (
    <View style={[{ transform: [{ rotate: `${rotation}deg` }] }, style]}>
      <Svg width={width} height={height}>
        <Path d={path} fill={fill} opacity={0.85} />
      </Svg>
    </View>
  );
}

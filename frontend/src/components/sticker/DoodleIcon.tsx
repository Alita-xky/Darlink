import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';

export type DoodleName =
  | 'book' | 'coffee' | 'star' | 'heart' | 'pencil' | 'laptop'
  | 'music' | 'camera' | 'basketball' | 'burger' | 'sparkle' | 'cloud';

type Props = {
  name: DoodleName;
  size?: number;
  color?: string;
};

const PATHS: Record<DoodleName, React.ReactNode> = {
  book: (
    <Path d="M4 4 L4 20 L11 18 L11 5 Z M13 5 L13 18 L20 20 L20 4 Z" fill="none" strokeWidth={1.8} />
  ),
  coffee: (
    <Path d="M5 9 L5 18 Q5 20 7 20 L15 20 Q17 20 17 18 L17 9 Z M17 11 L19 11 Q21 11 21 14 Q21 17 19 17 L17 17" fill="none" strokeWidth={1.8} />
  ),
  star: (
    <Path d="M12 3 L14 10 L21 10 L15 14 L17 21 L12 17 L7 21 L9 14 L3 10 L10 10 Z" fill="none" strokeWidth={1.8} />
  ),
  heart: (
    <Path d="M12 20 L4 12 Q2 9 4.5 6.5 Q7 4 10 6 L12 8 L14 6 Q17 4 19.5 6.5 Q22 9 20 12 Z" fill="none" strokeWidth={1.8} />
  ),
  pencil: (
    <Path d="M3 21 L7 17 L17 7 L20 10 L10 20 Z M16 8 L18 10" fill="none" strokeWidth={1.8} />
  ),
  laptop: (
    <Path d="M5 5 L19 5 L19 16 L5 16 Z M3 18 L21 18 L20 20 L4 20 Z" fill="none" strokeWidth={1.8} />
  ),
  music: (
    <Path d="M9 18 Q9 21 6 21 Q3 21 3 18 Q3 15 6 15 Q8 15 9 16 L9 5 L19 3 L19 16 Q19 19 16 19 Q13 19 13 16 Q13 13 16 13 Q18 13 19 14" fill="none" strokeWidth={1.8} />
  ),
  camera: (
    <>
      <Path d="M3 8 L7 8 L9 5 L15 5 L17 8 L21 8 L21 19 L3 19 Z" fill="none" strokeWidth={1.8} />
      <Circle cx={12} cy={13} r={4} fill="none" strokeWidth={1.8} />
    </>
  ),
  basketball: (
    <>
      <Circle cx={12} cy={12} r={9} fill="none" strokeWidth={1.8} />
      <Path d="M3 12 L21 12 M12 3 L12 21 M5 6 Q12 12 19 6 M5 18 Q12 12 19 18" fill="none" strokeWidth={1.5} />
    </>
  ),
  burger: (
    <Path d="M4 9 Q4 6 12 6 Q20 6 20 9 L4 9 M3 12 L21 12 M3 15 L21 15 M5 18 L19 18 Q20 18 20 17" fill="none" strokeWidth={1.8} />
  ),
  sparkle: (
    <Path d="M12 3 L13.5 10.5 L21 12 L13.5 13.5 L12 21 L10.5 13.5 L3 12 L10.5 10.5 Z" fill="none" strokeWidth={1.6} />
  ),
  cloud: (
    <Path d="M7 17 Q3 17 3 13 Q3 9 7 9 Q8 6 12 6 Q16 6 17 9 Q21 9 21 13 Q21 17 17 17 Z" fill="none" strokeWidth={1.8} />
  ),
};

export function DoodleIcon({ name, size = 24, color = '#1F1F1F' }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" stroke={color} strokeLinecap="round" strokeLinejoin="round">
      {PATHS[name]}
    </Svg>
  );
}

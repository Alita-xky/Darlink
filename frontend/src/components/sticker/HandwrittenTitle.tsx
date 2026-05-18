import React from 'react';
import { StyleProp, StyleSheet, Text, TextStyle } from 'react-native';
import { Colors, HandwrittenFonts } from '@/constants/theme';

type Props = {
  children: string;
  size?: number;
  color?: string;
  lang?: 'zh' | 'en';
  style?: StyleProp<TextStyle>;
};

export function HandwrittenTitle({ children, size = 24, color, lang = 'zh', style }: Props) {
  return (
    <Text
      style={[
        styles.text,
        {
          fontFamily: HandwrittenFonts[lang],
          fontSize: size,
          color: color ?? Colors.text,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {},
});

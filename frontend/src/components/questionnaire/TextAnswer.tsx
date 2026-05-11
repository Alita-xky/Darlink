import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Colors, Stickers } from '@/constants/theme';

type Props = {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  max?: number;
  multiline?: boolean;
};

export function TextAnswer({ value, onChange, placeholder, max = 100, multiline = true }: Props) {
  return (
    <View style={styles.wrap}>
      <TextInput
        style={[styles.input, multiline && styles.multiline]}
        value={value}
        onChangeText={(t) => { if (t.length <= max) onChange(t); }}
        placeholder={placeholder}
        placeholderTextColor={Colors.textPlaceholder}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
      <Text style={styles.counter}>{value.length} / {max}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: Stickers.cream.bg,
    borderColor: Stickers.cream.edge,
    borderWidth: 3,
    borderRadius: 14,
    padding: 12,
    minHeight: 80,
  },
  input: { fontSize: 16, color: Colors.text, padding: 0 },
  multiline: { minHeight: 60 },
  counter: { textAlign: 'right', fontSize: 11, color: Colors.textMuted, marginTop: 4 },
});

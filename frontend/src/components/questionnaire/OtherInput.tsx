import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { Colors, Stickers } from '@/constants/theme';

type Props = {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
};

export function OtherInput({ value, onChange, placeholder = '请说明…' }: Props) {
  return (
    <View style={styles.wrap}>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={(t) => { if (t.length <= 30) onChange(t); }}
        placeholder={placeholder}
        placeholderTextColor={Colors.textPlaceholder}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: '#fff',
    borderColor: Stickers.cream.edge,
    borderWidth: 2,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 6,
  },
  input: { fontSize: 14, color: Colors.text, padding: 0 },
});

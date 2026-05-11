import React from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PixelAvatar } from '@/src/components/pixel';
import { FAMOUS_PRESETS } from '@/src/components/pixel/famous';

export default function SmokeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>像素风冒烟测试</Text>
        <Text style={styles.subtitle}>6 名人 · 视觉评审</Text>
        <View style={styles.grid}>
          {Object.entries(FAMOUS_PRESETS).map(([key, { features, label }]) => (
            <View key={key} style={styles.cell}>
              <PixelAvatar features={features} size={120} />
              <Text style={styles.label}>{label}</Text>
              <Text style={styles.caption}>
                {features.hair} · {features.face} · {features.top}{features.prop ? ` · ${features.prop}` : ''}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8E7' },
  content: { padding: 16, alignItems: 'center', paddingBottom: 32 },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 24 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, justifyContent: 'center' },
  cell: { alignItems: 'center', width: 150, gap: 4 },
  label: { fontSize: 16, fontWeight: '700', marginTop: 4 },
  caption: { fontSize: 11, color: '#888', textAlign: 'center' },
});

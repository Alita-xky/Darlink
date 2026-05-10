import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  HandwrittenTitle,
  StickerCard,
} from '@/src/components/sticker';
import { PressableScale } from '@/src/components/PressableScale';
import { PixelAvatar } from '@/src/components/pixel';
import {
  vibeToFeatures,
  type VibePalette,
  type VibeKeyword,
  VIBE_PALETTES,
  VIBE_KEYWORDS,
} from '@/src/lib/vibeToFeatures';
import { Colors, Spacing, Stickers, Shadows } from '@/constants/theme';

function parsePalette(raw: unknown): VibePalette | undefined {
  if (typeof raw !== 'string') return undefined;
  return (VIBE_PALETTES as readonly string[]).includes(raw) ? (raw as VibePalette) : undefined;
}

function parseKeywords(raw: unknown): VibeKeyword[] {
  if (typeof raw !== 'string' || !raw) return [];
  return raw.split(',').filter((k): k is VibeKeyword => (VIBE_KEYWORDS as readonly string[]).includes(k));
}

export default function StepThreePreview() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const palette = parsePalette(params.palette);
  const keywords = parseKeywords(params.keywords);

  const features = useMemo(() => vibeToFeatures(palette, keywords), [palette, keywords]);

  function handleEnter() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace('/(tabs)');
  }

  const bgColor = palette ? Stickers[palette].bg : Stickers.cream.bg;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <HandwrittenTitle size={32} style={styles.title}>这是临时的你</HandwrittenTitle>
        <Text style={styles.subtitle}>之后填问卷会越来越像 ✶</Text>

        <StickerCard palette={palette ?? 'cream'} rotation={-2} style={styles.preview}>
          <View style={styles.avatarFrame}>
            <PixelAvatar features={features} size={160} />
          </View>
          <Text style={styles.featLine}>
            {features.hair} · {features.face} · {features.top}
            {features.prop ? ` · ${features.prop}` : ''}
          </Text>
        </StickerCard>

        {keywords.length > 0 && (
          <Text style={styles.kw}>关键词: {keywords.join(' · ')}</Text>
        )}

        <PressableScale
          onPress={handleEnter}
          haptic="heavy"
          scaleDown={0.97}
          style={styles.btn}
        >
          <HandwrittenTitle size={20} color="#1F1F1F">进入滴搭 →</HandwrittenTitle>
        </PressableScale>

        <Text style={styles.hint}>头像会在你填问卷之后由 AI 重新蒸馏</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: Spacing.lg, gap: Spacing.md, alignItems: 'center', paddingTop: Spacing.xl },
  title: { textAlign: 'center' },
  subtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },
  preview: { alignItems: 'center', gap: 8, paddingVertical: 16, paddingHorizontal: 24 },
  avatarFrame: {
    borderWidth: 3,
    borderColor: '#1F1F1F',
    borderRadius: 12,
    backgroundColor: '#FFF',
    padding: 8,
    overflow: 'hidden',
  },
  featLine: { fontSize: 12, color: Colors.textMuted, fontFamily: 'monospace' },
  kw: { fontSize: 14, color: Colors.text, fontWeight: '700' },
  btn: {
    marginTop: Spacing.md,
    backgroundColor: Stickers.peach.accent,
    borderColor: '#1F1F1F',
    borderWidth: 3,
    borderRadius: 18,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    ...Shadows.sticker,
  },
  hint: { textAlign: 'center', color: Colors.textMuted, fontSize: 12, lineHeight: 18, marginTop: Spacing.md },
});

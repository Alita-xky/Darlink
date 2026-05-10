import * as Haptics from 'expo-haptics';
import { useMutation } from 'convex/react';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { api } from '../../convex/_generated/api';
import { useAuth } from '@/src/lib/auth-context';
import {
  HandwrittenTitle,
  StickerCard,
  StickerChip,
} from '@/src/components/sticker';
import { PressableScale } from '@/src/components/PressableScale';
import {
  VIBE_PALETTES,
  VIBE_KEYWORDS,
  type VibePalette,
  type VibeKeyword,
} from '@/src/lib/vibeToFeatures';
import { Colors, Spacing, Stickers, Shadows } from '@/constants/theme';

const PALETTE_LABELS: Record<VibePalette, string> = {
  cream: '米黄',
  matcha: '抹茶绿',
  peach: '蜜桃橘',
  lavender: '藕紫',
};

export default function StepTwoVibe() {
  const router = useRouter();
  const { auth } = useAuth();
  const updateVibe = useMutation(api.auth.updateVibe);

  const [palette, setPalette] = useState<VibePalette | null>(null);
  const [keywords, setKeywords] = useState<VibeKeyword[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const canNext = palette !== null && keywords.length > 0;

  function toggleKeyword(k: VibeKeyword) {
    if (keywords.includes(k)) {
      setKeywords(keywords.filter((x) => x !== k));
    } else if (keywords.length < 2) {
      setKeywords([...keywords, k]);
    }
  }

  async function handleNext() {
    if (auth.status !== 'authenticated' || !palette) return;
    setSubmitting(true);
    try {
      await updateVibe({
        userId: auth.userId,
        vibePalette: palette,
        vibeKeywords: keywords,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const params = new URLSearchParams({
        palette,
        keywords: keywords.join(','),
      });
      router.push(`/auth/step-3-preview?${params.toString()}` as never);
    } finally {
      setSubmitting(false);
    }
  }

  const bgColor = palette ? Stickers[palette].bg : Stickers.cream.bg;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <HandwrittenTitle size={32} style={styles.title}>
          再聊聊你的味道
        </HandwrittenTitle>

        {/* Q1: palette */}
        <Text style={styles.q}>你今天的氛围是？</Text>
        <View style={styles.paletteGrid}>
          {VIBE_PALETTES.map((p) => {
            const selected = palette === p;
            return (
              <PressableScale
                key={p}
                onPress={() => {
                  Haptics.selectionAsync();
                  setPalette(p);
                }}
                haptic="none"
                scaleDown={0.95}
                style={styles.paletteCell}
              >
                <StickerCard
                  palette={p}
                  rotation={selected ? 0 : -1}
                  style={[
                    styles.paletteCard,
                    selected && {
                      borderColor: Stickers[p].accent,
                      borderWidth: 6,
                    },
                  ]}
                >
                  <View style={[styles.paletteSwatch, { backgroundColor: Stickers[p].accent }]} />
                  <Text style={styles.paletteLabel}>{PALETTE_LABELS[p]}</Text>
                </StickerCard>
              </PressableScale>
            );
          })}
        </View>

        {/* Q2: keywords */}
        <Text style={styles.q}>你想被记住的关键词？（最多 2 个）</Text>
        <View style={styles.keywordRow}>
          {VIBE_KEYWORDS.map((k) => (
            <StickerChip
              key={k}
              label={k}
              selected={keywords.includes(k)}
              onPress={() => toggleKeyword(k)}
              palette={palette ?? 'cream'}
            />
          ))}
        </View>

        {/* Next */}
        <PressableScale
          onPress={handleNext}
          disabled={!canNext || submitting}
          haptic="medium"
          scaleDown={0.97}
          style={[styles.btn, (!canNext || submitting) && { opacity: 0.5 }]}
        >
          <HandwrittenTitle size={20} color="#1F1F1F">下一步 →</HandwrittenTitle>
        </PressableScale>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: Spacing.lg, gap: Spacing.lg, paddingTop: Spacing.xl },
  title: { textAlign: 'center', marginBottom: Spacing.md },
  q: { fontSize: 16, fontWeight: '700', color: Colors.text, marginTop: Spacing.md },
  paletteGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    justifyContent: 'space-between',
  },
  paletteCell: { width: '48%' },
  paletteCard: { alignItems: 'center', gap: 6, paddingVertical: 16 },
  paletteSwatch: {
    width: 60,
    height: 60,
    borderRadius: 14,
    borderWidth: 3,
    borderColor: '#1F1F1F',
  },
  paletteLabel: { fontSize: 14, fontWeight: '700', color: Colors.text },
  keywordRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  btn: {
    marginTop: Spacing.lg,
    backgroundColor: Stickers.matcha.accent,
    borderColor: '#1F1F1F',
    borderWidth: 3,
    borderRadius: 18,
    padding: Spacing.md,
    alignItems: 'center',
    ...Shadows.sticker,
  },
});

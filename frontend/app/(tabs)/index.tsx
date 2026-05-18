import { useQuery } from 'convex/react';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { api } from '../../convex/_generated/api';
import { useAuth } from '@/src/lib/auth-context';
import { Colors, Stickers, Shadows, Radii, Spacing } from '@/constants/theme';
import { PressableScale } from '@/src/components/PressableScale';
import { DoodleIcon, StickerCard, HandwrittenTitle } from '@/src/components/sticker';
import { PixelAvatar, isValidPixelFeatures, DEFAULT_FEATURES } from '@/src/components/pixel';

function Tag({ text, color }: { text: string; color: string }) {
  return (
    <View style={[styles.tag, { backgroundColor: color + '15', borderColor: color + '30' }]}>
      <Text style={[styles.tagText, { color }]}>{text}</Text>
    </View>
  );
}

const MODE_META = [
  { key: 'study'   as const, emoji: '📚', label: '学习搭子',  palette: 'matcha'   as const, rotation: -2 },
  { key: 'friend'  as const, emoji: '🍱', label: '饭/玩搭子', palette: 'peach'    as const, rotation:  0 },
  { key: 'romance' as const, emoji: '💝', label: '恋爱潜力',  palette: 'lavender' as const, rotation:  2 },
];

export default function HomeScreen() {
  const router = useRouter();
  const { auth } = useAuth();
  const userId = auth.status === 'authenticated' ? auth.userId : undefined;

  const user        = useQuery(api.auth.me,                userId ? { userId } : 'skip');
  const modeStatus  = useQuery(api.profile.getModeStatus,  userId ? { userId } : 'skip');
  const dhStudy     = useQuery(api.profile.getDigitalHuman, userId ? { userId, mode: 'study'   } : 'skip');
  const dhFriend    = useQuery(api.profile.getDigitalHuman, userId ? { userId, mode: 'friend'  } : 'skip');
  const dhRomance   = useQuery(api.profile.getDigitalHuman, userId ? { userId, mode: 'romance' } : 'skip');

  if (!userId) return null;

  return (
    <SafeAreaView style={styles.container}>
      {/* Scattered doodles */}
      <View style={styles.doodleLayer} pointerEvents="none">
        <View style={[styles.doodle, { top: 40, right: 30 }]}><DoodleIcon name="star" size={32} color="#E8B4B8" /></View>
        <View style={[styles.doodle, { top: 120, left: 24 }]}><DoodleIcon name="coffee" size={36} color="#7A9E5C" /></View>
        <View style={[styles.doodle, { top: 220, right: 50 }]}><DoodleIcon name="sparkle" size={28} color="#E07856" /></View>
        <View style={[styles.doodle, { bottom: 200, left: 40 }]}><DoodleIcon name="heart" size={30} color="#7C5CA8" /></View>
        <View style={[styles.doodle, { bottom: 320, right: 30 }]}><DoodleIcon name="cloud" size={40} color="#E8B4B8" /></View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Header greeting */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>你好，{user?.nickname ?? '同学'} 👋</Text>
            <Text style={styles.school}>{user?.school}</Text>
          </View>
          {user?.verifiedStatus === 'verified' && (
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedText}>✓ 已认证</Text>
            </View>
          )}
        </View>

        {/* Mode picker (always visible) */}
        <View style={styles.modeRow}>
          {MODE_META.map((m) => {
            const filled = !!modeStatus?.[m.key]?.digitalHuman;
            return (
              <PressableScale
                key={m.key}
                onPress={() => router.push(`/onboarding/${m.key}` as any)}
                haptic="medium"
                scaleDown={0.95}
                style={{ flex: 1 }}
              >
                <StickerCard palette={m.palette} rotation={m.rotation} style={styles.modeCard}>
                  <Text style={styles.modeEmoji}>{m.emoji}</Text>
                  <HandwrittenTitle size={16} style={{ textAlign: 'center' }}>{m.label}</HandwrittenTitle>
                  <Text style={filled ? styles.modeFilled : styles.modeOpen}>
                    {filled ? '✓ 已完成' : '开始 →'}
                  </Text>
                </StickerCard>
              </PressableScale>
            );
          })}
        </View>

        {/* Per-mode DH cards */}
        {[
          { mode: 'study'   as const, dh: dhStudy   },
          { mode: 'friend'  as const, dh: dhFriend  },
          { mode: 'romance' as const, dh: dhRomance },
        ]
          .filter(({ dh }) => !!dh)
          .map(({ mode, dh }) => (
            <DigitalHumanCard
              key={mode}
              mode={mode}
              dh={dh!}
              userNickname={user?.nickname ?? '?'}
              userSchool={user?.school ?? ''}
            />
          ))}

        {/* Match CTA — only show if at least one DH exists */}
        {(dhStudy || dhFriend || dhRomance) && (
          <PressableScale
            onPress={() => router.push('/(tabs)/match')}
            haptic="heavy"
            scaleDown={0.97}
            style={styles.matchCtaWrap}
          >
            <View style={styles.matchCta}>
              <HandwrittenTitle size={18} color="#1F1F1F">去看看谁和你匹配</HandwrittenTitle>
              <DoodleIcon name="sparkle" size={20} color="#1F1F1F" />
            </View>
          </PressableScale>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function DigitalHumanCard({
  mode,
  dh,
  userNickname,
  userSchool,
}: {
  mode: 'study' | 'friend' | 'romance';
  dh: any;
  userNickname: string;
  userSchool: string;
}) {
  const router = useRouter();
  const meta = MODE_META.find((m) => m.key === mode)!;

  const iter = (dh.darwinIterations ?? 0) as number;
  const score = (dh.darwinScore ?? 0) as number;
  const trainingInProgress = iter > 0 && score === 0;

  if (trainingInProgress) {
    return (
      <View style={styles.dhCard}>
        <View style={styles.dhCardHeader}>
          <View style={styles.dhAvatarWrap}>
            <PixelAvatar
              features={isValidPixelFeatures(dh.pixelFeatures) ? dh.pixelFeatures : DEFAULT_FEATURES}
              size={52}
            />
          </View>
          <View style={styles.dhMeta}>
            <Text style={styles.dhName}>
              {userNickname} <Text style={styles.dhMode}>· {meta.label}</Text>
            </Text>
            <Text style={styles.dhSchool}>{userSchool}</Text>
          </View>
        </View>
        <View style={styles.trainingBox}>
          <ActivityIndicator color={Stickers[meta.palette].accent} />
          <Text style={styles.trainingText}>AI 正在为你训练数字人…</Text>
          <Text style={styles.trainingProgress}>
            {[1, 2, 3, 4].map((i) => (i <= iter ? '●' : '○')).join(' ')}
          </Text>
          <Text style={styles.trainingSub}>大约 30 秒，你也可以稍后回来看</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.dhCard}>
      <View style={styles.dhCardHeader}>
        <View style={styles.dhAvatarWrap}>
          <PixelAvatar
            features={isValidPixelFeatures(dh.pixelFeatures) ? dh.pixelFeatures : DEFAULT_FEATURES}
            size={52}
          />
        </View>
        <View style={styles.dhMeta}>
          <Text style={styles.dhName}>
            {userNickname} <Text style={styles.dhMode}>· {meta.label}</Text>
          </Text>
          <Text style={styles.dhSchool}>{userSchool}</Text>
        </View>
        <PressableScale
          onPress={() => router.push(`/onboarding/${mode}` as any)}
          haptic="light"
          style={styles.dhEditBtn}
        >
          <Text style={styles.dhEditText}>编辑</Text>
        </PressableScale>
      </View>

      <View style={styles.dhTextBox}>
        <Text style={styles.dhCardText}>{dh.cardText}</Text>
      </View>

      <View style={styles.dhSection}>
        <Text style={styles.dhSectionLabel}>心智模型</Text>
        <View style={styles.tagRow}>
          {(dh.mentalModels ?? []).map((m: string, i: number) => (
            <Tag key={i} text={m} color={Colors.study} />
          ))}
        </View>
      </View>

      <View style={styles.dhSection}>
        <Text style={styles.dhSectionLabel}>表达特征</Text>
        <View style={styles.tagRow}>
          {(dh.expressionPatterns ?? []).map((e: string, i: number) => (
            <Tag key={i} text={e} color={Stickers[meta.palette].accent} />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  doodleLayer: { ...StyleSheet.absoluteFillObject },
  doodle: { position: 'absolute', opacity: 0.6 },
  content: { padding: Spacing.lg, gap: Spacing.lg, paddingBottom: Spacing.xxl },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  greeting: { fontSize: 26, fontWeight: '800', color: Colors.text },
  school: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  verifiedBadge: {
    backgroundColor: Colors.successBg,
    borderRadius: Radii.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  verifiedText: { fontSize: 12, color: Colors.success, fontWeight: '600' },

  // Mode picker
  modeRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md },
  modeCard: { gap: 6, alignItems: 'center', paddingVertical: 16, paddingHorizontal: 8 },
  modeEmoji: { fontSize: 32 },
  modeFilled: { textAlign: 'center', fontSize: 12, color: Colors.success, fontWeight: '700' },
  modeOpen: { textAlign: 'center', fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },

  // DH card
  dhCard: {
    backgroundColor: Colors.bgWhite,
    borderRadius: Radii['3xl'],
    padding: Spacing.lg,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.md,
  },
  dhCardHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  dhAvatarWrap: {
    width: 52,
    height: 78,
    borderWidth: 3,
    borderColor: '#1F1F1F',
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dhMeta: { flex: 1 },
  dhName: { fontSize: 17, fontWeight: '800', color: Colors.text },
  dhMode: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
  dhSchool: { fontSize: 12, color: Colors.textSecondary },
  dhEditBtn: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radii.full,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  dhEditText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
  dhTextBox: {
    backgroundColor: Colors.bg,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.pink,
  },
  dhCardText: { fontSize: 14, color: Colors.textBody, lineHeight: 22 },
  dhSection: { gap: 6 },
  dhSectionLabel: { fontSize: 11, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radii.full, borderWidth: 1 },
  tagText: { fontSize: 12, fontWeight: '600' },

  // Training progress shell
  trainingBox: { alignItems: 'center', gap: 8, padding: Spacing.md },
  trainingText: { fontSize: 14, fontWeight: '700', color: Colors.text },
  trainingProgress: { fontSize: 18, color: Colors.textBody, letterSpacing: 4 },
  trainingSub: { fontSize: 11, color: Colors.textMuted, textAlign: 'center' },

  // Match CTA
  matchCtaWrap: { borderRadius: Radii.full, overflow: 'hidden' },
  matchCta: {
    backgroundColor: Stickers.peach.accent,
    borderColor: '#1F1F1F',
    borderWidth: 3,
    padding: Spacing.lg,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: Radii.full,
    ...Shadows.sticker,
  },
});

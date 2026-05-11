import { useQuery } from 'convex/react';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { api } from '../../convex/_generated/api';
import { useAuth } from '@/src/lib/auth-context';
import { Colors, Radii, Shadows, Spacing } from '@/constants/theme';
import { PressableScale } from '@/src/components/PressableScale';
import * as Haptics from 'expo-haptics';

type Scene = 'study' | 'food' | 'romance';

const SCENES: { key: Scene; label: string; emoji: string; color: string; bg: string; border: string }[] = [
  { key: 'study', label: '学习搭子', emoji: '📚', color: Colors.study, bg: Colors.studyBg, border: Colors.studyBorder },
  { key: 'food', label: '饭搭子', emoji: '🍜', color: Colors.food, bg: Colors.foodBg, border: Colors.foodBorder },
  { key: 'romance', label: '恋爱潜力', emoji: '💕', color: Colors.romance, bg: Colors.romanceBg, border: Colors.romanceBorder },
];

export default function MatchScreen() {
  const router = useRouter();
  const { auth } = useAuth();
  const userId = auth.status === 'authenticated' ? auth.userId : undefined;
  const [scene, setScene] = useState<Scene>('study');

  const matches = useQuery(api.matches.listForUser, userId ? { userId, scene } : 'skip');
  const currentScene = SCENES.find(s => s.key === scene)!;

  if (!userId) return null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.orb} pointerEvents="none" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>匹配</Text>
      </View>

      {/* Scene Tabs */}
      <View style={styles.sceneRow}>
        {SCENES.map((s) => {
          const active = scene === s.key;
          return (
            <PressableScale
              key={s.key}
              style={[styles.sceneTab, active && { backgroundColor: s.bg, borderColor: s.border }]}
              onPress={() => setScene(s.key)}
              haptic="selection"
              scaleDown={0.95}
            >
              <Text style={styles.sceneEmoji}>{s.emoji}</Text>
              <Text style={[styles.sceneLabel, active && { color: s.color, fontWeight: '700' }]}>
                {s.label}
              </Text>
            </PressableScale>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {matches === undefined && (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyEmoji}>⏳</Text>
            <Text style={styles.emptyTitle}>加载中…</Text>
          </View>
        )}
        {matches?.length === 0 && (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyEmoji}>🔍</Text>
            <Text style={styles.emptyTitle}>暂无匹配结果</Text>
            <Text style={styles.emptyDesc}>完善画像后，AI 会帮你找到合适的同学</Text>
          </View>
        )}

        {matches?.map((item) => {
          const sc = currentScene;
          const score = item.match.fitScore;
          return (
            <PressableScale
              key={item.match._id}
              style={styles.card}
              onPress={() => router.push(`/match/${item.match._id}`)}
              haptic="light"
              scaleDown={0.97}
            >
              {/* Top row */}
              <View style={styles.cardTop}>
                <View style={[styles.avatar, { backgroundColor: sc.bg }]}>
                  <Text style={[styles.avatarText, { color: sc.color }]}>
                    {item.other?.nickname?.[0] ?? '?'}
                  </Text>
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardName}>{item.other?.nickname ?? '匿名用户'}</Text>
                  <Text style={styles.cardSchool}>{item.other?.school}</Text>
                </View>
                <View style={[styles.scoreChip, { backgroundColor: sc.bg, borderColor: sc.border }]}>
                  <Text style={[styles.scoreNum, { color: sc.color }]}>{score}</Text>
                  <Text style={[styles.scoreSuffix, { color: sc.color }]}>%</Text>
                </View>
              </View>

              {/* Progress bar */}
              <View style={styles.barBg}>
                <LinearGradient
                  colors={[sc.color + 'CC', sc.color + '66']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={[styles.barFill, { width: `${score}%` as any }]}
                />
              </View>

              {/* Card text */}
              {item.otherCardText ? (
                <Text style={styles.cardDesc} numberOfLines={2}>{item.otherCardText}</Text>
              ) : null}

              {/* Shared topics */}
              {item.match.sharedTopics.length > 0 && (
                <View style={styles.chips}>
                  {item.match.sharedTopics.slice(0, 3).map((t) => (
                    <View key={t} style={[styles.chip, { backgroundColor: sc.bg, borderColor: sc.border }]}>
                      <Text style={[styles.chipText, { color: sc.color }]}>{t}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Status + AI twin entry */}
              <View style={styles.cardFooter}>
                <Text style={styles.statusText}>
                  {item.match.aStatus === 'interested' && item.match.bStatus === 'interested'
                    ? '🎉 双向心动！去聊天'
                    : '查看详情 →'}
                </Text>
                {item.other?._id && item.otherCardText && (
                  <PressableScale
                    onPress={(e?: { stopPropagation?: () => void }) => {
                      e?.stopPropagation?.();
                      Haptics.selectionAsync();
                      const aiMode = scene === 'food' ? 'friend' : scene;
                      router.push(`/digitalhuman/${item.other!._id}?mode=${aiMode}` as never);
                    }}
                    haptic="none"
                    scaleDown={0.96}
                    style={[styles.aiTwinBtn, { borderColor: sc.border, backgroundColor: '#FCE38A' }]}
                  >
                    <Text style={styles.aiTwinBtnText}>🤖 和 TA 的 AI 聊聊</Text>
                  </PressableScale>
                )}
              </View>
            </PressableScale>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  orb: {
    position: 'absolute', top: -30, right: -30, width: 180, height: 180,
    borderRadius: 90, backgroundColor: Colors.pink, opacity: 0.08,
  },
  header: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm, paddingBottom: Spacing.sm },
  title: { fontSize: 28, fontWeight: '800', color: Colors.text },
  sceneRow: { flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.lg, marginBottom: Spacing.sm },
  sceneTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.bgWhite,
  },
  sceneEmoji: { fontSize: 14 },
  sceneLabel: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' },
  list: { padding: Spacing.lg, gap: Spacing.md },
  emptyBox: { alignItems: 'center', marginTop: Spacing.xxl, gap: Spacing.sm },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  emptyDesc: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },
  card: {
    backgroundColor: Colors.bgWhite,
    borderRadius: Radii['2xl'],
    padding: Spacing.lg,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  avatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 22, fontWeight: '800' },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 16, fontWeight: '800', color: Colors.text },
  cardSchool: { fontSize: 12, color: Colors.textSecondary },
  scoreChip: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radii.full,
    borderWidth: 1.5,
  },
  scoreNum: { fontSize: 20, fontWeight: '900' },
  scoreSuffix: { fontSize: 12, fontWeight: '600' },
  barBg: { height: 6, backgroundColor: Colors.borderLight, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: 6, borderRadius: 3 },
  cardDesc: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radii.full, borderWidth: 1 },
  chipText: { fontSize: 12, fontWeight: '600' },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  aiTwinBtn: {
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  aiTwinBtnText: { fontSize: 12, fontWeight: '700', color: '#1F1F1F' },
  statusText: { fontSize: 12, color: Colors.textMuted, textAlign: 'right', fontWeight: '500' },
});

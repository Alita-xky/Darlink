import { useAction, useMutation, useQuery } from 'convex/react';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { useAuth } from '@/src/lib/auth-context';
import { Colors, Radii, Shadows, Spacing } from '@/constants/theme';
import { PressableScale } from '@/src/components/PressableScale';
import * as Haptics from 'expo-haptics';

const SCENE_MAP = {
  study: { label: '学习搭子', emoji: '📚', color: Colors.study, bg: Colors.studyBg, border: Colors.studyBorder },
  food: { label: '饭搭子', emoji: '🍜', color: Colors.food, bg: Colors.foodBg, border: Colors.foodBorder },
  romance: { label: '恋爱潜力', emoji: '💕', color: Colors.romance, bg: Colors.romanceBg, border: Colors.romanceBorder },
};

export default function MatchDetailScreen() {
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const router = useRouter();
  const { auth } = useAuth();
  const userId = auth.status === 'authenticated' ? auth.userId : undefined;

  const detail = useQuery(api.matches.getDetail, matchId ? { matchId: matchId as Id<'matches'> } : 'skip');
  const respond = useMutation(api.matches.respond);
  const suggestIcebreaker = useAction(api.ai.suggestIcebreaker);
  const [responding, setResponding] = useState(false);
  const [selectedIce, setSelectedIce] = useState<number | null>(null);
  const [extraIce, setExtraIce] = useState<string[]>([]);
  const [swapping, setSwapping] = useState(false);

  if (!userId || !detail) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator style={{ marginTop: 80 }} color={Colors.pinkDeep} />
      </SafeAreaView>
    );
  }

  const { match, userA, userB, chatId: existingChatId } = detail;
  const isA = match.userIdA === userId;
  const myStatus = isA ? match.aStatus : match.bStatus;
  const otherUser = isA ? userB : userA;
  const isMutual = match.aStatus === 'interested' && match.bStatus === 'interested';
  const sc = SCENE_MAP[match.scene];

  async function handleDecision(decision: 'interested' | 'passed') {
    if (!matchId || !userId) return;
    setResponding(true);
    try {
      const result = await respond({
        matchId: matchId as Id<'matches'>,
        userId,
        decision,
      }) as { match: unknown; chatId: string | null };
      if (decision === 'interested' && result.chatId) {
        const allIce = [...match.icebreakers, ...extraIce];
        const iceParam = selectedIce !== null && allIce[selectedIce]
          ? `?ice=${encodeURIComponent(allIce[selectedIce])}`
          : '';
        Alert.alert('🎉 双向心动！', '你们已经互相心动，现在可以开始聊天了', [
          { text: '去聊天', onPress: () => router.replace(`/chat/${result.chatId}${iceParam}`) },
        ]);
      }
    } catch (e) { console.error(e); }
    finally { setResponding(false); }
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Profile card */}
        <View style={styles.profileCard}>
          <View style={[styles.sceneChip, { backgroundColor: sc.bg, borderColor: sc.border }]}>
            <Text style={{ fontSize: 12 }}>{sc.emoji}</Text>
            <Text style={[styles.sceneLabel, { color: sc.color }]}>{sc.label}</Text>
          </View>

          <View style={styles.profileRow}>
            <View style={[styles.bigAvatar, { backgroundColor: sc.bg }]}>
              <Text style={[styles.bigAvatarText, { color: sc.color }]}>{otherUser?.nickname?.[0] ?? '?'}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{otherUser?.nickname}</Text>
              <Text style={styles.profileSchool}>{otherUser?.school}</Text>
            </View>
            <View style={[styles.bigScore, { backgroundColor: sc.bg, borderColor: sc.border }]}>
              <Text style={[styles.bigScoreNum, { color: sc.color }]}>{match.fitScore}</Text>
              <Text style={[styles.bigScoreLabel, { color: sc.color }]}>% 契合</Text>
            </View>
          </View>

          {/* Progress bar */}
          <View style={styles.barBg}>
            <LinearGradient
              colors={[sc.color, sc.color + '66']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={[styles.barFill, { width: `${match.fitScore}%` as any }]}
            />
          </View>
        </View>

        {/* Match Report */}
        <View style={styles.reportCard}>
          <Text style={styles.cardTitle}>AI 匹配洞察</Text>
          <View style={styles.insightBox}>
            <Text style={styles.insightText}>{match.explanation}</Text>
          </View>

          {match.sharedTopics.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.secLabel}>共同话题</Text>
              <View style={styles.chips}>
                {match.sharedTopics.map((t) => (
                  <View key={t} style={[styles.chip, { backgroundColor: Colors.successBg }]}>
                    <Text style={[styles.chipText, { color: Colors.success }]}>{t}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {match.complementarities.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.secLabel}>互补之处</Text>
              {match.complementarities.map((c, i) => (
                <Text key={i} style={styles.bullet}>• {c}</Text>
              ))}
            </View>
          )}

          {match.risks.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.secLabel}>需要注意</Text>
              {match.risks.map((r, i) => (
                <Text key={i} style={[styles.bullet, { color: Colors.warning }]}>⚠ {r}</Text>
              ))}
            </View>
          )}
        </View>

        {/* Icebreakers */}
        {(match.icebreakers.length > 0 || extraIce.length > 0) && (
          <View style={styles.iceCard}>
            <View style={styles.iceHeader}>
              <Text style={styles.cardTitle}>AI 破冰建议</Text>
              <View style={[styles.iceChip, { backgroundColor: Colors.romanceBg }]}>
                <Text style={{ fontSize: 10, color: Colors.romance, fontWeight: '700' }}>✦ Darlink AI</Text>
              </View>
            </View>
            <Text style={styles.iceHint}>选一句发给对方（由你确认后才出现在聊天框）</Text>
            {[...match.icebreakers, ...extraIce].map((ice, i) => (
              <PressableScale
                key={i}
                style={[styles.iceOption, selectedIce === i && styles.iceOptionActive]}
                onPress={() => setSelectedIce(selectedIce === i ? null : i)}
                haptic="selection"
                scaleDown={0.97}
              >
                <Text style={[styles.iceText, selectedIce === i && { color: Colors.pinkDeep }]}>"{ice}"</Text>
                {selectedIce === i && (
                  <View style={styles.iceSelectedRow}>
                    <Text style={styles.iceSelectedText}>✓ 已选，去聊天时使用</Text>
                    <PressableScale
                      haptic="light"
                      disabled={swapping}
                      onPress={async () => {
                        if (!matchId || swapping) return;
                        setSwapping(true);
                        try {
                          const newIce = await suggestIcebreaker({ matchId: matchId as Id<'matches'> });
                          const newIndex = match.icebreakers.length + extraIce.length;
                          setExtraIce((prev) => [...prev, newIce]);
                          setSelectedIce(newIndex);
                        } catch (e) { console.error(e); }
                        finally { setSwapping(false); }
                      }}
                    >
                      {swapping
                        ? <ActivityIndicator size="small" color={Colors.pinkDeep} />
                        : <Text style={styles.iceSwapText}>换一句</Text>
                      }
                    </PressableScale>
                  </View>
                )}
              </PressableScale>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Footer */}
      {!isMutual && myStatus === 'new' && (
        <View style={styles.footer}>
          <PressableScale style={styles.passBtn} onPress={() => handleDecision('passed')} disabled={responding} haptic="medium">
            <Text style={styles.passBtnText}>跳过</Text>
          </PressableScale>
          <PressableScale onPress={() => handleDecision('interested')} disabled={responding} style={styles.interestedBtnWrap} haptic="heavy" scaleDown={0.97}>
            <LinearGradient
              colors={[Colors.gradientStart, Colors.gradientEnd]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={[styles.interestedBtn, responding && { opacity: 0.5 }]}
            >
              {responding ? <ActivityIndicator color="#fff" /> : <Text style={styles.interestedBtnText}>心动 ✨</Text>}
            </LinearGradient>
          </PressableScale>
        </View>
      )}

      {isMutual && (
        <View style={styles.footer}>
          <PressableScale
            onPress={() => {
              if (existingChatId) {
                const allIce = [...match.icebreakers, ...extraIce];
                const iceParam = selectedIce !== null && allIce[selectedIce]
                  ? `?ice=${encodeURIComponent(allIce[selectedIce])}`
                  : '';
                router.push(`/chat/${existingChatId}${iceParam}`);
              } else {
                router.push('/(tabs)/chat');
              }
            }}
            style={styles.chatBtnWrap}
            haptic="light"
          >
            <LinearGradient colors={[Colors.success, '#059669']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.interestedBtn}>
              <Text style={styles.interestedBtnText}>🎉 去聊天</Text>
            </LinearGradient>
          </PressableScale>
        </View>
      )}

      {!isMutual && myStatus !== 'new' && (
        <View style={styles.footerInfo}>
          <Text style={styles.footerInfoText}>
            {myStatus === 'interested' ? '你已表示心动，等待对方决定…' : '已跳过此匹配'}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: Spacing.lg, gap: Spacing.lg, paddingBottom: Spacing.xxl },
  profileCard: {
    backgroundColor: Colors.bgWhite,
    borderRadius: Radii['2xl'],
    padding: Spacing.lg,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.md,
  },
  sceneChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radii.full,
    borderWidth: 1,
  },
  sceneLabel: { fontSize: 13, fontWeight: '700' },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  bigAvatar: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  bigAvatarText: { fontSize: 26, fontWeight: '800' },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 20, fontWeight: '800', color: Colors.text },
  profileSchool: { fontSize: 13, color: Colors.textSecondary },
  bigScore: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radii.lg,
    borderWidth: 1.5,
  },
  bigScoreNum: { fontSize: 26, fontWeight: '900' },
  bigScoreLabel: { fontSize: 11, fontWeight: '600' },
  barBg: { height: 6, backgroundColor: Colors.borderLight, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: 6, borderRadius: 3 },
  reportCard: {
    backgroundColor: Colors.bgWhite,
    borderRadius: Radii['2xl'],
    padding: Spacing.lg,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  cardTitle: { fontSize: 17, fontWeight: '800', color: Colors.text },
  insightBox: {
    backgroundColor: Colors.studyBg,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.studyBorder,
  },
  insightText: { fontSize: 14, color: Colors.textBody, lineHeight: 22 },
  section: { gap: 6 },
  secLabel: { fontSize: 11, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radii.full },
  chipText: { fontSize: 12, fontWeight: '600' },
  bullet: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
  iceCard: {
    backgroundColor: Colors.bgWhite,
    borderRadius: Radii['2xl'],
    padding: Spacing.lg,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  iceHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iceChip: { borderRadius: Radii.full, paddingHorizontal: 10, paddingVertical: 4 },
  iceHint: { fontSize: 12, color: Colors.textMuted },
  iceOption: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    gap: 6,
    backgroundColor: Colors.bg,
  },
  iceOptionActive: { borderColor: Colors.pink, backgroundColor: Colors.romanceBg },
  iceText: { fontSize: 14, color: Colors.textBody, lineHeight: 20 },
  iceSelectedRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  iceSelectedText: { fontSize: 12, color: Colors.pinkDeep, fontWeight: '600' },
  iceSwapText: { fontSize: 12, color: Colors.textMuted, textDecorationLine: 'underline' },
  footer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.bgWhite,
  },
  passBtn: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: Radii.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  passBtnText: { fontSize: 15, color: Colors.textSecondary, fontWeight: '600' },
  interestedBtnWrap: { flex: 2 },
  chatBtnWrap: { flex: 1 },
  interestedBtn: { borderRadius: Radii.full, padding: Spacing.md, alignItems: 'center' },
  interestedBtnText: { fontSize: 15, color: '#fff', fontWeight: '800' },
  footerInfo: { padding: Spacing.lg, alignItems: 'center', borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: Colors.bgWhite },
  footerInfoText: { fontSize: 14, color: Colors.textMuted },
});

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
import { Colors, Radii, Shadows, Spacing } from '@/constants/theme';
import { PressableScale } from '@/src/components/PressableScale';
import type { Id } from '../../convex/_generated/dataModel';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return '刚刚';
  if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`;
  return `${Math.floor(diff / 86400)}天前`;
}

type Scene = 'study' | 'food' | 'romance';

const SCENE_META: Record<Scene, { emoji: string; label: string; color: string; bg: string; border: string }> = {
  study: { emoji: '📚', label: '学习搭子', color: Colors.study, bg: Colors.studyBg, border: Colors.studyBorder },
  food: { emoji: '🍜', label: '饭搭子', color: Colors.food, bg: Colors.foodBg, border: Colors.foodBorder },
  romance: { emoji: '💕', label: '恋爱潜力', color: Colors.romance, bg: Colors.romanceBg, border: Colors.romanceBorder },
};

function isScene(s: string): s is Scene {
  return s === 'study' || s === 'food' || s === 'romance';
}

// ─── Scene Chip ───────────────────────────────────────────────────────────────

function SceneChip({ scene }: { scene: Scene }) {
  const m = SCENE_META[scene];
  return (
    <View style={[styles.chip, { backgroundColor: m.bg, borderColor: m.border }]}>
      <Text style={[styles.chipText, { color: m.color }]}>{m.emoji} {m.label}</Text>
    </View>
  );
}

// ─── FitScore Chip ────────────────────────────────────────────────────────────

function FitChip({ score, scene }: { score: number; scene: Scene }) {
  const m = SCENE_META[scene];
  return (
    <View style={[styles.chip, { backgroundColor: m.bg, borderColor: m.border }]}>
      <Text style={[styles.chipText, { color: m.color, fontWeight: '700' }]}>{score}% 匹配</Text>
    </View>
  );
}

// ─── Match Item ───────────────────────────────────────────────────────────────

type MatchEntry = {
  match: {
    _id: Id<'matches'>;
    scene: string;
    fitScore: number;
    aStatus?: string;
    bStatus?: string;
    createdAt?: number;
    _creationTime: number;
  };
  otherUser: { nickname?: string | null; school?: string | null } | null;
  isMutual: boolean;
};

function MatchItem({ entry }: { entry: MatchEntry }) {
  const router = useRouter();
  const { match, otherUser, isMutual } = entry;
  const scene = isScene(match.scene) ? match.scene : 'study';
  const ts = match.createdAt ?? match._creationTime;

  return (
    <PressableScale
      onPress={() => router.push(`/match/${match._id}` as any)}
      haptic="light"
      scaleDown={0.98}
      style={styles.card}
    >
      <View style={styles.cardTop}>
        <SceneChip scene={scene} />
        <Text style={styles.timeText}>{timeAgo(ts)}</Text>
      </View>

      <View style={styles.cardMid}>
        <Text style={styles.nicknameText}>{otherUser?.nickname ?? '匿名用户'}</Text>
        <Text style={styles.schoolText}>{otherUser?.school ?? ''}</Text>
      </View>

      <View style={styles.cardBottom}>
        <FitChip score={match.fitScore} scene={scene} />
        {isMutual ? (
          <Text style={[styles.statusText, { color: Colors.success }]}>🎉 双向心动</Text>
        ) : (
          <Text style={[styles.statusText, { color: Colors.textMuted }]}>等待对方决定</Text>
        )}
      </View>
    </PressableScale>
  );
}

// ─── Message Item ─────────────────────────────────────────────────────────────

type MessageEntry = {
  chatId: Id<'chats'>;
  lastMessage: { body: string; createdAt: number } | null;
  otherUser: { nickname?: string | null; school?: string | null } | null;
};

function MessageItem({ entry }: { entry: MessageEntry }) {
  const router = useRouter();
  const { chatId, lastMessage, otherUser } = entry;
  const initials = otherUser?.nickname?.[0] ?? '?';

  return (
    <PressableScale
      onPress={() => router.push(`/chat/${chatId}` as any)}
      haptic="light"
      scaleDown={0.98}
      style={styles.card}
    >
      <View style={styles.msgRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={styles.msgContent}>
          <View style={styles.msgTopRow}>
            <Text style={styles.nicknameText}>{otherUser?.nickname ?? '匿名用户'}</Text>
            {lastMessage && (
              <Text style={styles.timeText}>{timeAgo(lastMessage.createdAt)}</Text>
            )}
          </View>
          <Text style={styles.previewText} numberOfLines={1}>
            {lastMessage?.body ?? '暂无消息'}
          </Text>
        </View>
      </View>
    </PressableScale>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionLine} />
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionLine} />
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

const ALL_SCENES: Scene[] = ['study', 'food', 'romance'];

export default function ActivityScreen() {
  const { auth } = useAuth();
  const userId = auth.status === 'authenticated' ? auth.userId : undefined;

  // Fetch matches for all scenes
  const studyMatches = useQuery(
    api.matches.listForUser,
    userId ? { userId, scene: 'study' } : 'skip',
  );
  const foodMatches = useQuery(
    api.matches.listForUser,
    userId ? { userId, scene: 'food' } : 'skip',
  );
  const romanceMatches = useQuery(
    api.matches.listForUser,
    userId ? { userId, scene: 'romance' } : 'skip',
  );

  // Fetch chats
  const chats = useQuery(
    api.chats.listForUser,
    userId ? { userId } : 'skip',
  );

  const isLoading =
    studyMatches === undefined ||
    foodMatches === undefined ||
    romanceMatches === undefined ||
    chats === undefined;

  // Build match entries
  const matchEntries: MatchEntry[] = React.useMemo(() => {
    if (!userId || !studyMatches || !foodMatches || !romanceMatches) return [];

    const allRaw = [...studyMatches, ...foodMatches, ...romanceMatches];
    // Sort newest first
    allRaw.sort((a, b) => {
      const ta = (a.match as any).createdAt ?? a.match._creationTime;
      const tb = (b.match as any).createdAt ?? b.match._creationTime;
      return tb - ta;
    });

    return allRaw.map(({ match, other }) => {
      const aStatus = (match as any).aStatus as string | undefined;
      const bStatus = (match as any).bStatus as string | undefined;
      const isMutual = aStatus === 'interested' && bStatus === 'interested';
      return {
        match: match as MatchEntry['match'],
        otherUser: other,
        isMutual,
      };
    });
  }, [userId, studyMatches, foodMatches, romanceMatches]);

  // Build message entries
  const messageEntries: MessageEntry[] = React.useMemo(() => {
    if (!chats) return [];
    return chats
      .filter((c) => c.lastMessage !== null)
      .map((c) => ({
        chatId: c.chat._id,
        lastMessage: c.lastMessage
          ? { body: c.lastMessage.body, createdAt: c.lastMessage.createdAt }
          : null,
        otherUser: c.other,
      }));
  }, [chats]);

  const isEmpty = matchEntries.length === 0 && messageEntries.length === 0;
  const hasBoth = matchEntries.length > 0 && messageEntries.length > 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>动态</Text>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.pink} />
        </View>
      ) : isEmpty ? (
        <View style={styles.center}>
          <Text style={styles.emptyEmoji}>🎯</Text>
          <Text style={styles.emptyLabel}>暂无动态</Text>
          <Text style={styles.emptyDesc}>完善画像后匹配结果会出现在这里</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {matchEntries.length > 0 && (
            <>
              {hasBoth && <SectionHeader title="匹配结果" />}
              {matchEntries.map((entry) => (
                <MatchItem key={entry.match._id} entry={entry} />
              ))}
            </>
          )}

          {messageEntries.length > 0 && (
            <>
              {hasBoth && <SectionHeader title="消息" />}
              {messageEntries.map((entry) => (
                <MessageItem key={String(entry.chatId)} entry={entry} />
              ))}
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  title: { fontSize: 28, fontWeight: '800', color: Colors.text },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  emptyEmoji: { fontSize: 56 },
  emptyLabel: { fontSize: 18, fontWeight: '700', color: Colors.text },
  emptyDesc: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },

  scrollContent: {
    padding: Spacing.lg,
    gap: Spacing.sm,
    paddingBottom: Spacing.xxl,
  },

  card: {
    backgroundColor: Colors.bgWhite,
    borderRadius: Radii['2xl'],
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
    ...Shadows.sm,
  },

  // Match card rows
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardMid: { gap: 2 },
  cardBottom: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },

  nicknameText: { fontSize: 15, fontWeight: '700', color: Colors.text },
  schoolText: { fontSize: 13, color: Colors.textSecondary },
  timeText: { fontSize: 12, color: Colors.textMuted },
  statusText: { fontSize: 13, fontWeight: '600' },

  chip: {
    borderRadius: Radii.full,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  chipText: { fontSize: 12, fontWeight: '600' },

  // Message row
  msgRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.romanceBg,
    borderWidth: 1.5,
    borderColor: Colors.romanceBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 18, fontWeight: '800', color: Colors.romance },
  msgContent: { flex: 1, gap: 3 },
  msgTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  previewText: { fontSize: 13, color: Colors.textSecondary },

  // Section divider
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginVertical: 4,
  },
  sectionLine: { flex: 1, height: 1, backgroundColor: Colors.borderLight },
  sectionTitle: { fontSize: 12, fontWeight: '600', color: Colors.textMuted },
});

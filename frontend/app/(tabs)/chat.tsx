import { useQuery } from 'convex/react';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { api } from '../../convex/_generated/api';
import { useAuth } from '@/src/lib/auth-context';
import { Colors, Radii, Spacing } from '@/constants/theme';
import { PressableScale } from '@/src/components/PressableScale';
import * as Haptics from 'expo-haptics';

function timeAgo(ts: number) {
  const diff = Date.now() - ts;
  if (diff < 60_000) return '刚刚';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}分钟前`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}小时前`;
  return `${Math.floor(diff / 86_400_000)}天前`;
}

export default function ChatScreen() {
  const router = useRouter();
  const { auth } = useAuth();
  const userId = auth.status === 'authenticated' ? auth.userId : undefined;
  const chats = useQuery(api.chats.listForUser, userId ? { userId } : 'skip');

  if (!userId) return null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>聊天</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {chats?.length === 0 && (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyEmoji}>💬</Text>
            <Text style={styles.emptyTitle}>暂无聊天</Text>
            <Text style={styles.emptyDesc}>双向心动后，聊天窗口会在这里出现</Text>
          </View>
        )}
        {chats?.map((item) => (
          <PressableScale
            key={item.chat._id}
            style={styles.row}
            onPress={() => router.push(`/chat/${item.chat._id}`)}
            haptic="light"
            scaleDown={0.98}
          >
            <View style={styles.avatarWrap}>
              <Text style={styles.avatarText}>{item.other?.nickname?.[0] ?? '?'}</Text>
            </View>
            <View style={styles.rowInfo}>
              <View style={styles.rowTop}>
                <Text style={styles.rowName}>{item.other?.nickname ?? '匿名用户'}</Text>
                {item.lastMessage && (
                  <Text style={styles.rowTime}>{timeAgo(item.lastMessage.createdAt)}</Text>
                )}
              </View>
              <Text style={styles.rowPreview} numberOfLines={1}>
                {item.lastMessage?.body ?? '还没有消息，说个你好吧 👋'}
              </Text>
            </View>
          </PressableScale>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm, paddingBottom: Spacing.md },
  title: { fontSize: 28, fontWeight: '800', color: Colors.text },
  emptyBox: { alignItems: 'center', marginTop: 80, gap: 8, padding: Spacing.lg },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  emptyDesc: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.bgWhite,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  avatarWrap: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.romanceBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.romanceBorder,
  },
  avatarText: { fontSize: 20, fontWeight: '800', color: Colors.romance },
  rowInfo: { flex: 1 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  rowName: { fontSize: 15, fontWeight: '700', color: Colors.text },
  rowTime: { fontSize: 12, color: Colors.textMuted },
  rowPreview: { fontSize: 13, color: Colors.textSecondary },
});

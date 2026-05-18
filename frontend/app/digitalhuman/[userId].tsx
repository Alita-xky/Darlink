import * as Haptics from 'expo-haptics';
import { useAction, useQuery } from 'convex/react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState, useRef, useEffect } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { useAuth } from '@/src/lib/auth-context';
import { PixelAvatar, isValidPixelFeatures, DEFAULT_FEATURES } from '@/src/components/pixel';
import { HandwrittenTitle, StickerCard } from '@/src/components/sticker';
import { PressableScale } from '@/src/components/PressableScale';
import { Colors, Spacing, Stickers, Shadows } from '@/constants/theme';
import { getOrCreateSessionId, getPersona, sendBackendChatMessage } from '@/src/lib/backend-api';

type Mode = 'study' | 'friend' | 'romance';
type Message = { id: string; from: 'me' | 'twin'; text: string; ts: number };

const MODE_LABEL: Record<Mode, string> = {
  study: '学习搭子',
  friend: '饭/玩搭子',
  romance: '恋爱潜力',
};

export default function DigitalHumanChat() {
  const router = useRouter();
  const { auth } = useAuth();
  const params = useLocalSearchParams();

  const rawId = String(params.userId ?? '');
  const source = String(params.source ?? '');
  const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL;
  const backendMode = Boolean(backendUrl) && (source === 'backend' || /^\d+$/.test(rawId));

  const targetUserId = (backendMode ? null : (rawId as unknown as Id<'users'>)) as Id<'users'> | null;
  const personaId = backendMode ? Number.parseInt(rawId, 10) : null;
  const mode: Mode = (params.mode as Mode) ?? 'friend';

  const currentUserId = auth.status === 'authenticated' ? auth.userId : undefined;
  const callerId = auth.status === 'authenticated' ? auth.userId : null;

  const currentUser = useQuery(
    api.auth.me,
    currentUserId ? { userId: currentUserId } : 'skip',
  );

  const target = useQuery(
    api.auth.me,
    targetUserId ? { userId: targetUserId } : 'skip',
  );

  const targetDh = useQuery(
    api.profile.getDigitalHuman,
    targetUserId ? { userId: targetUserId, mode } : 'skip',
  );

  const aiPreview = useAction(api.aiPreview.aiPreview);

  const [backendPersonaName, setBackendPersonaName] = useState<string>('');
  const [backendPersonaDesc, setBackendPersonaDesc] = useState<string>('');
  const [backendSessionId, setBackendSessionId] = useState<string>('');

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!backendMode || personaId == null) return;

      if (!currentUser?.email) {
        setError('正在读取账号信息...');
        return;
      }

      setError('');

      try {
        const p = await getPersona(personaId, currentUser.email);

        if (cancelled) return;

        setBackendPersonaName(p?.name ?? `Persona #${personaId}`);
        setBackendPersonaDesc(p?.desc ?? '');
      } catch {
        if (cancelled) return;

        setBackendPersonaName(`Persona #${personaId}`);
      }

      try {
        const sid = await getOrCreateSessionId(currentUser.email, personaId);

        if (!cancelled) {
          setBackendSessionId(sid);
        }
      } catch (e: unknown) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : '无法创建后端会话');
        }
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [backendMode, personaId, currentUser?.email]);

  if (!rawId) return null;
  if (!backendMode && (!auth || auth.status !== 'authenticated' || !targetUserId)) return null;
  if (backendMode && auth.status !== 'authenticated') return null;

  const features = isValidPixelFeatures(targetDh?.pixelFeatures)
    ? targetDh.pixelFeatures
    : DEFAULT_FEATURES;

  const targetPalette = (target?.vibePalette ?? 'cream') as keyof typeof Stickers;

  async function handleSend() {
    if (!input.trim() || sending) return;

    const userMsg = input.trim();

    setInput('');
    setError('');
    setMessages((prev) => [
      ...prev,
      {
        id: `me-${Date.now()}`,
        from: 'me',
        text: userMsg,
        ts: Date.now(),
      },
    ]);

    setSending(true);
    Haptics.selectionAsync();

    try {
      if (backendMode) {
        if (!backendSessionId) {
          throw new Error('后端会话尚未就绪');
        }

        const res = await sendBackendChatMessage(backendSessionId, userMsg);
        const replyText = res?.reply ?? '[空回复]';

        setMessages((prev) => [
          ...prev,
          {
            id: `twin-${Date.now()}`,
            from: 'twin',
            text: replyText,
            ts: Date.now(),
          },
        ]);

        try {
          if (res?.distill_triggered) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            setMessages((prev) => [
              ...prev,
              {
                id: `sys-distill-${Date.now()}`,
                from: 'twin',
                text: '系统：已开始生成你的数字人，稍后可使用。',
                ts: Date.now(),
              },
            ]);
          }

          if (res?.distilled) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            setMessages((prev) => [
              ...prev,
              {
                id: `sys-distill-done-${Date.now()}`,
                from: 'twin',
                text: '系统：你的数字人已生成，可以在个人主页查看。',
                ts: Date.now(),
              },
            ]);
          }
        } catch (e) {
          // ignore
        }
      } else {
        if (!callerId || !targetUserId) {
          throw new Error('尚未登录');
        }

        const res = await aiPreview({
          callerId,
          targetUserId,
          mode,
          message: userMsg,
        });

        setMessages((prev) => [
          ...prev,
          {
            id: `twin-${Date.now()}`,
            from: 'twin',
            text: res.reply,
            ts: Date.now(),
          },
        ]);
      }
    } catch (e: unknown) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(e instanceof Error ? e.message : 'AI 暂时无法回复');
    } finally {
      setSending(false);
    }
  }

  function handleAddFriend() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    if (targetUserId) {
      router.replace(`/match/${targetUserId}` as never);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <PressableScale onPress={() => router.back()} haptic="light" style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </PressableScale>

        <View style={styles.headerAvatar}>
          <PixelAvatar features={features} size={36} />
        </View>

        <View style={styles.headerMeta}>
          <Text style={styles.headerName}>
            {backendMode ? backendPersonaName || '...' : target?.nickname ?? '...'}
          </Text>

          <Text style={styles.headerMode}>
            · {backendMode ? backendPersonaDesc || MODE_LABEL[mode] : MODE_LABEL[mode]}
          </Text>
        </View>

        <View style={styles.aiTag}>
          <Text style={styles.aiTagText}>AI 分身</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={80}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.flex}
          contentContainerStyle={styles.messages}
        >
          {messages.length === 0 && (
            <Text style={styles.placeholder}>
              和 {backendMode ? backendPersonaName || '...' : target?.nickname ?? '...'} 的 AI 分身打个招呼吧～
            </Text>
          )}

          {messages.map((m) => (
            <View
              key={m.id}
              style={[
                styles.bubbleWrap,
                m.from === 'me' ? styles.bubbleMe : styles.bubbleTwin,
              ]}
            >
              <StickerCard
                palette={m.from === 'me' ? 'cream' : targetPalette}
                rotation={0}
                style={styles.bubble}
              >
                <Text style={styles.bubbleText}>{m.text}</Text>
              </StickerCard>

              {m.from === 'twin' && (
                <Text style={styles.disclaimer}>
                  这是 AI 模拟回复，不代表本人
                  {!backendMode ? (
                    <Text>
                      {' '}
                      ·{' '}
                      <Text style={styles.disclaimerLink} onPress={handleAddFriend}>
                        请求加好友
                      </Text>
                    </Text>
                  ) : null}
                </Text>
              )}
            </View>
          ))}

          {sending && (
            <View style={[styles.bubbleWrap, styles.bubbleTwin]}>
              <ActivityIndicator color={Colors.textMuted} />
            </View>
          )}

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </ScrollView>

        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="说点什么…"
            placeholderTextColor={Colors.textPlaceholder}
            multiline
            maxLength={500}
            editable={!sending}
          />

          <PressableScale
            onPress={handleSend}
            disabled={sending || !input.trim()}
            haptic="medium"
            scaleDown={0.95}
            style={[styles.sendBtn, (sending || !input.trim()) && { opacity: 0.5 }]}
          >
            <HandwrittenTitle size={16} color="#1F1F1F">
              发送
            </HandwrittenTitle>
          </PressableScale>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Stickers.cream.bg },
  flex: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: Stickers.cream.edge,
    backgroundColor: '#FFF',
  },

  backBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },

  backText: {
    fontSize: 24,
    color: Colors.text,
  },

  headerAvatar: {
    borderWidth: 2,
    borderColor: '#1F1F1F',
    borderRadius: 6,
    padding: 2,
    backgroundColor: '#FFF',
    overflow: 'hidden',
  },

  headerMeta: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },

  headerName: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
  },

  headerMode: {
    fontSize: 12,
    color: Colors.textSecondary,
  },

  aiTag: {
    backgroundColor: '#FCE38A',
    borderColor: '#1F1F1F',
    borderWidth: 2,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },

  aiTagText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1F1F1F',
  },

  messages: {
    padding: Spacing.md,
    gap: Spacing.sm,
    paddingBottom: Spacing.lg,
  },

  placeholder: {
    textAlign: 'center',
    color: Colors.textMuted,
    marginTop: Spacing.xl,
  },

  bubbleWrap: {
    maxWidth: '80%',
    gap: 4,
  },

  bubbleMe: {
    alignSelf: 'flex-end',
  },

  bubbleTwin: {
    alignSelf: 'flex-start',
  },

  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },

  bubbleText: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 22,
  },

  disclaimer: {
    fontSize: 11,
    color: Colors.textMuted,
  },

  disclaimerLink: {
    color: Colors.romance,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },

  errorText: {
    color: Colors.error,
    fontSize: 13,
    padding: Spacing.md,
    textAlign: 'center',
  },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: Spacing.md,
    gap: Spacing.sm,
    borderTopWidth: 2,
    borderTopColor: Stickers.cream.edge,
    backgroundColor: '#FFF',
  },

  input: {
    flex: 1,
    backgroundColor: Stickers.cream.bg,
    borderWidth: 2,
    borderColor: Stickers.cream.edge,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 15,
    color: Colors.text,
    maxHeight: 100,
  },

  sendBtn: {
    backgroundColor: Stickers.matcha.accent,
    borderColor: '#1F1F1F',
    borderWidth: 2,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    ...Shadows.sticker,
  },
});

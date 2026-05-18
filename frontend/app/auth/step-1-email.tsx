import * as Haptics from 'expo-haptics';
import { useMutation } from 'convex/react';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
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
import { PressableScale } from '@/src/components/PressableScale';
import {
  HandwrittenTitle,
  StickerCard,
  StickerChip,
  StickerRain,
} from '@/src/components/sticker';
import { Colors, Stickers, Spacing, Shadows } from '@/constants/theme';

const SCHOOLS = [
  'HKU', 'CUHK', 'HKUST', 'PolyU', 'CityU', 'HKBU', 'LU', 'EdUHK',
  '北京大学', '清华大学', '复旦大学', '上海交通大学', '浙江大学', '南京大学', '武汉大学', '中山大学',
];

export default function StepOneEmail() {
  const router = useRouter();
  const { signIn } = useAuth();
  const signInOrCreate = useMutation(api.auth.signInOrCreate);

  const [email, setEmail] = useState('');
  const [nickname, setNickname] = useState('');
  const [school, setSchool] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleNext() {
    if (!email.trim() || !nickname.trim() || !school) {
      setError('请填写所有必填项');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    if (!email.includes('@')) {
      setError('请输入有效的邮箱地址');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setError('');
    setLoading(true);
    try {
      const userId = await signInOrCreate({
        email: email.trim(),
        nickname: nickname.trim(),
        school,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await signIn(userId as Id<'users'>);
      router.push('/auth/step-2-vibe');
    } catch (e: unknown) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(e instanceof Error ? e.message : '登录失败，请重试');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <StickerRain count={10} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.inner}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <HandwrittenTitle size={36} style={styles.title}>欢迎来滴搭</HandwrittenTitle>
          <Text style={styles.tagline}>3 步快速建立你的 AI 分身</Text>

          <StickerCard palette="cream" rotation={-1} style={styles.card}>
            <View style={styles.field}>
              <Text style={styles.label}>学校邮箱</Text>
              <TextInput
                style={styles.input}
                placeholder="xxx@university.edu.hk"
                placeholderTextColor={Colors.textPlaceholder}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                onFocus={() => Haptics.selectionAsync()}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>昵称</Text>
              <TextInput
                style={styles.input}
                placeholder="让大家怎么称呼你？"
                placeholderTextColor={Colors.textPlaceholder}
                value={nickname}
                onChangeText={setNickname}
                maxLength={20}
                onFocus={() => Haptics.selectionAsync()}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>学校</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.schoolRow}
              >
                {SCHOOLS.map((s) => (
                  <StickerChip
                    key={s}
                    label={s}
                    selected={school === s}
                    onPress={() => setSchool(s)}
                    palette="matcha"
                    style={{ marginRight: 8 }}
                  />
                ))}
              </ScrollView>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <PressableScale
              onPress={handleNext}
              disabled={loading}
              haptic="medium"
              scaleDown={0.97}
              style={styles.btnWrap}
            >
              <View style={[styles.btn, loading && { opacity: 0.5 }]}>
                {loading ? (
                  <ActivityIndicator color="#1F1F1F" />
                ) : (
                  <HandwrittenTitle size={20} color="#1F1F1F">下一步 →</HandwrittenTitle>
                )}
              </View>
            </PressableScale>

            <Text style={styles.hint}>使用学校邮箱（.edu.hk / .edu.cn 等）自动通过认证</Text>
          </StickerCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Stickers.cream.bg },
  flex: { flex: 1 },
  inner: { flexGrow: 1, justifyContent: 'center', padding: Spacing.lg, gap: Spacing.lg },
  title: { textAlign: 'center' },
  tagline: { textAlign: 'center', fontSize: 14, color: Colors.textSecondary },
  card: { gap: Spacing.md },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: '700', color: Colors.textBody },
  input: {
    backgroundColor: '#fff',
    borderWidth: 2.5,
    borderColor: Stickers.cream.edge,
    borderRadius: 14,
    padding: Spacing.md,
    fontSize: 15,
    color: Colors.text,
  },
  schoolRow: { paddingVertical: 4 },
  errorText: { fontSize: 13, color: Colors.error, textAlign: 'center' },
  btnWrap: { marginTop: 4 },
  btn: {
    backgroundColor: Stickers.matcha.accent,
    borderColor: '#1F1F1F',
    borderWidth: 3,
    borderRadius: 18,
    padding: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    ...Shadows.sticker,
  },
  hint: { textAlign: 'center', color: Colors.textMuted, fontSize: 12, lineHeight: 18 },
});

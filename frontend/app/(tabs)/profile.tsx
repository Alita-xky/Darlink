import { useMutation, useQuery } from 'convex/react';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { api } from '../../convex/_generated/api';
import { useAuth } from '@/src/lib/auth-context';
import { Colors, Radii, Shadows, Spacing } from '@/constants/theme';
import { PressableScale } from '@/src/components/PressableScale';

// ─── Static InfoRow (read-only) ───────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value?: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value ?? '—'}</Text>
    </View>
  );
}

// ─── Editable InfoRow ─────────────────────────────────────────────────────────

function EditableRow({
  label,
  value,
  onChange,
  placeholder,
  editable = true,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  editable?: boolean;
}) {
  if (!editable) {
    return <InfoRow label={label} value={value || undefined} />;
  }
  return (
    <View style={styles.editableRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder ?? label}
        placeholderTextColor={Colors.textMuted}
        returnKeyType="done"
      />
    </View>
  );
}

// ─── Maps ─────────────────────────────────────────────────────────────────────

const energyMap: Record<string, string> = {
  introvert: '慢热型',
  ambivert: '随机应变',
  extrovert: '主动型',
};
const styleMap: Record<string, string> = {
  concise: '简洁直接',
  warm: '温和有回应',
  playful: '轻松幽默',
  thoughtful: '深思熟虑',
};
const paceMap: Record<string, string> = {
  slow: '慢慢来',
  medium: '正常节奏',
  fast: '快节奏',
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const router = useRouter();
  const { auth, signOut } = useAuth();
  const userId = auth.status === 'authenticated' ? auth.userId : undefined;

  const user = useQuery(api.auth.me, userId ? { userId } : 'skip');
  const profile = useQuery(api.profile.getProfile, userId ? { userId } : 'skip');
  const updateBasic = useMutation(api.auth.updateBasic);

  // Edit state
  const [editMode, setEditMode] = useState(false);
  const [major, setMajor] = useState('');
  const [grade, setGrade] = useState('');
  const [saving, setSaving] = useState(false);

  if (!userId) return null;

  function enterEditMode() {
    setMajor(user?.major ?? '');
    setGrade(user?.grade ?? '');
    setEditMode(true);
  }

  function cancelEdit() {
    setEditMode(false);
  }

  async function handleSave() {
    if (!userId) return;
    setSaving(true);
    try {
      await updateBasic({ userId, major: major.trim() || undefined, grade: grade.trim() || undefined });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setEditMode(false);
    } catch (e) {
      Alert.alert('保存失败', '请稍后重试');
    } finally {
      setSaving(false);
    }
  }

  function handleSignOut() {
    Alert.alert('退出登录', '确定要退出吗？', [
      { text: '取消', style: 'cancel' },
      { text: '退出', style: 'destructive', onPress: () => signOut() },
    ]);
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Avatar Header */}
        <View style={styles.avatarSection}>
          <LinearGradient
            colors={[Colors.gradientStart, Colors.gradientEnd]}
            style={styles.avatarCircle}
          >
            <Text style={styles.avatarText}>{user?.nickname?.[0] ?? '?'}</Text>
          </LinearGradient>
          <Text style={styles.nameText}>{user?.nickname}</Text>
          <Text style={styles.schoolText}>{user?.school}</Text>
          <View style={[
            styles.badge,
            { backgroundColor: user?.verifiedStatus === 'verified' ? Colors.successBg : Colors.warningBg },
          ]}>
            <Text style={{ fontSize: 12, color: user?.verifiedStatus === 'verified' ? Colors.success : Colors.warning, fontWeight: '700' }}>
              {user?.verifiedStatus === 'verified' ? '✓ 学生认证' : '⏳ 待认证'}
            </Text>
          </View>
        </View>

        {/* Profile card */}
        {profile ? (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>我的画像</Text>
              <PressableScale onPress={() => router.push('/(tabs)')} style={styles.editBtn} haptic="light">
                <Text style={styles.editBtnText}>重新填写</Text>
              </PressableScale>
            </View>
            <InfoRow label="社交能量" value={energyMap[profile.socialEnergy]} />
            <InfoRow label="聊天风格" value={styleMap[profile.communicationStyle]} />
            <InfoRow label="关系节奏" value={paceMap[profile.relationshipPace]} />
            <InfoRow label="兴趣" value={profile.interests.slice(0, 3).join(' · ')} />
            <InfoRow label="目标" value={profile.socialGoal.join(' · ')} />
          </View>
        ) : (
          <PressableScale onPress={() => router.push('/(tabs)')} style={styles.ctaCard} haptic="medium">
            <Text style={styles.ctaEmoji}>📝</Text>
            <Text style={styles.ctaText}>填写画像问卷，开始匹配</Text>
          </PressableScale>
        )}

        {/* Account info card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>账户信息</Text>
            {!editMode ? (
              <PressableScale onPress={enterEditMode} style={styles.editBtn} haptic="light">
                <Text style={styles.editBtnText}>✏️ 编辑</Text>
              </PressableScale>
            ) : (
              <View style={styles.editActions}>
                <PressableScale onPress={cancelEdit} style={styles.cancelBtn} haptic="light" disabled={saving}>
                  <Text style={styles.cancelBtnText}>取消</Text>
                </PressableScale>
                <PressableScale onPress={handleSave} style={styles.saveBtn} haptic="medium" disabled={saving} scaleDown={0.97}>
                  {saving ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.saveBtnText}>保存</Text>
                  )}
                </PressableScale>
              </View>
            )}
          </View>

          {/* Email always read-only */}
          <InfoRow label="邮箱" value={user?.email} />

          {/* Major — editable */}
          <EditableRow
            label="专业"
            value={editMode ? major : (user?.major ?? '')}
            onChange={setMajor}
            placeholder="请输入专业"
            editable={editMode}
          />

          {/* Grade — editable */}
          <EditableRow
            label="年级"
            value={editMode ? grade : (user?.grade ?? '')}
            onChange={setGrade}
            placeholder="例如：大三"
            editable={editMode}
          />
        </View>

        {/* AI 分身设置 */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>AI 分身设置</Text>
          </View>
          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.toggleLabel}>暂停 AI 分身</Text>
              <Text style={styles.toggleHint}>
                开启后，其他用户无法和你的 AI 分身预聊天（你仍可正常匹配 + 真人聊天）
              </Text>
            </View>
            <Switch
              value={user?.aiTwinDisabled === true}
              onValueChange={async (v) => {
                if (auth.status !== 'authenticated') return;
                Haptics.selectionAsync();
                await updateBasic({ userId: auth.userId, aiTwinDisabled: v });
              }}
              trackColor={{ true: '#FF6B9E' }}
            />
          </View>
        </View>

        <PressableScale style={styles.signOutBtn} onPress={handleSignOut} haptic="medium">
          <Text style={styles.signOutText}>退出登录</Text>
        </PressableScale>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: Spacing.lg, gap: Spacing.lg, paddingBottom: Spacing.xxl },

  avatarSection: { alignItems: 'center', gap: 8, paddingVertical: Spacing.lg },
  avatarCircle: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 32, fontWeight: '800', color: '#fff' },
  nameText: { fontSize: 24, fontWeight: '800', color: Colors.text },
  schoolText: { fontSize: 14, color: Colors.textSecondary },
  badge: { borderRadius: Radii.full, paddingHorizontal: 12, paddingVertical: 5 },

  card: {
    backgroundColor: Colors.bgWhite,
    borderRadius: Radii['2xl'],
    padding: Spacing.lg,
    gap: 2,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  cardTitle: { fontSize: 16, fontWeight: '800', color: Colors.text },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    gap: Spacing.md,
  },
  toggleLabel: { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 2 },
  toggleHint: { fontSize: 12, color: Colors.textSecondary, lineHeight: 16 },

  editBtn: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radii.full,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  editBtnText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },

  editActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  cancelBtn: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radii.full,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  cancelBtnText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
  saveBtn: {
    backgroundColor: Colors.pinkDeep,
    borderRadius: Radii.full,
    paddingHorizontal: 16,
    paddingVertical: 5,
    minWidth: 52,
    alignItems: 'center',
  },
  saveBtnText: { fontSize: 13, color: '#fff', fontWeight: '700' },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  infoLabel: { fontSize: 14, color: Colors.textSecondary },
  infoValue: { fontSize: 14, color: Colors.text, fontWeight: '500', maxWidth: '60%', textAlign: 'right' },

  editableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.bg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    fontSize: 14,
    color: Colors.text,
    textAlign: 'right',
  },

  ctaCard: {
    backgroundColor: Colors.bgWhite,
    borderRadius: Radii['2xl'],
    padding: Spacing.xl,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: Colors.pink,
    borderStyle: 'dashed',
  },
  ctaEmoji: { fontSize: 32 },
  ctaText: { fontSize: 15, color: Colors.pinkDeep, fontWeight: '700' },

  signOutBtn: {
    borderRadius: Radii.lg,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.error + '40',
  },
  signOutText: { color: Colors.error, fontSize: 15, fontWeight: '600' },
});

import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useMutation } from 'convex/react';
import * as Haptics from 'expo-haptics';
import { api } from '../../convex/_generated/api';
import { useAuth } from '@/src/lib/auth-context';
import { StickerChip, HandwrittenTitle } from '@/src/components/sticker';
import { OtherInput } from '@/src/components/questionnaire';
import { PressableScale } from '@/src/components/PressableScale';
import { Colors, Spacing, Stickers, Shadows } from '@/constants/theme';

const GRADES = ['大一', '大二', '大三', '大四'];
const MAJORS = ['文科', '理科', '工科', '其他'];
const PERSONA = ['内向', '外向', '其他'];

export type BackgroundAnswer = {
  grade: string;
  major: string;
  majorOther?: string;
  selfPersonality: string;
  personalityOther?: string;
};

type Props = {
  onComplete: (background: BackgroundAnswer) => void;
};

export function SharedBackground({ onComplete }: Props) {
  const { auth } = useAuth();
  const updateBasic = useMutation(api.auth.updateBasic);
  const [grade, setGrade] = useState('');
  const [major, setMajor] = useState('');
  const [majorOther, setMajorOther] = useState('');
  const [persona, setPersona] = useState('');
  const [personaOther, setPersonaOther] = useState('');

  const canNext =
    !!grade && !!major && !!persona &&
    (major !== '其他' || majorOther.trim().length > 0) &&
    (persona !== '其他' || personaOther.trim().length > 0);

  async function handleNext() {
    if (auth.status !== 'authenticated') return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const finalMajor = major === '其他' ? majorOther : major;
    const finalPersonality = persona === '其他' ? personaOther : persona;
    await updateBasic({
      userId: auth.userId,
      grade,
      major: finalMajor,
      selfPersonality: finalPersonality,
    });
    onComplete({
      grade,
      major: finalMajor,
      majorOther: major === '其他' ? majorOther : undefined,
      selfPersonality: finalPersonality,
      personalityOther: persona === '其他' ? personaOther : undefined,
    });
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <HandwrittenTitle size={28}>先聊聊你自己</HandwrittenTitle>

      <Text style={styles.q}>你的年级</Text>
      <View style={styles.row}>
        {GRADES.map((g) => (
          <StickerChip key={g} label={g} selected={grade === g} onPress={() => setGrade(g)} palette="matcha" />
        ))}
      </View>

      <Text style={styles.q}>你的专业方向</Text>
      <View style={styles.row}>
        {MAJORS.map((m) => (
          <StickerChip key={m} label={m} selected={major === m} onPress={() => setMajor(m)} palette="peach" />
        ))}
      </View>
      {major === '其他' && <OtherInput value={majorOther} onChange={setMajorOther} placeholder="比如：医学" />}

      <Text style={styles.q}>你认为你是怎样的人？</Text>
      <View style={styles.row}>
        {PERSONA.map((p) => (
          <StickerChip key={p} label={p} selected={persona === p} onPress={() => setPersona(p)} palette="lavender" />
        ))}
      </View>
      {persona === '其他' && <OtherInput value={personaOther} onChange={setPersonaOther} placeholder="比如：双面性格" />}

      <PressableScale disabled={!canNext} onPress={handleNext} haptic="medium" style={[styles.btn, !canNext && { opacity: 0.5 }]}>
        <HandwrittenTitle size={18} color="#1F1F1F">下一步 →</HandwrittenTitle>
      </PressableScale>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.lg, gap: Spacing.md, backgroundColor: Stickers.cream.bg, flexGrow: 1 },
  q: { fontSize: 16, fontWeight: '700', color: Colors.text, marginTop: Spacing.md },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  btn: {
    marginTop: Spacing.lg,
    backgroundColor: Stickers.matcha.accent,
    borderColor: Stickers.matcha.edge,
    borderWidth: 3,
    borderRadius: 18,
    padding: 14,
    alignItems: 'center',
    ...Shadows.sticker,
  },
});

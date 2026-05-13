import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAction, useMutation } from 'convex/react';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';

import { api } from '../../convex/_generated/api';
import { getOrCreateSessionId } from '@/src/lib/backend-api';
import { Alert } from 'react-native';
import { useAuth } from '@/src/lib/auth-context';
import { SharedBackground, type BackgroundAnswer } from './_shared';
import { StickerChip, HandwrittenTitle } from '@/src/components/sticker';
import { OtherInput } from '@/src/components/questionnaire';
import { PressableScale } from '@/src/components/PressableScale';
import { Colors, Spacing, Stickers, Shadows } from '@/constants/theme';

const TARGET_MAJORS = ['文科', '理科', '工科', '其他'];
const PURPOSES = ['学习', '交友', '交流', '其他'];
const PERSONA = ['内向', '外向', '其他'];
const HELP = ['学习', '交友', '交流', '其他'];
const MEETMODE = ['线上', '线下'];
const FREQ = ['每日', '频繁', '中等', '较少', '其他'];

type Phase = 'background' | 'needs' | 'matching';

export default function StudyScreen() {
  const router = useRouter();
  const { auth } = useAuth();
  const upsert = useMutation(api.profile.upsertModeQuestionnaire);
  const distill = useAction(api.nuwa.distillForUserByMode);

  const [phase, setPhase] = useState<Phase>('background');
  const [bg, setBg] = useState<BackgroundAnswer | null>(null);

  // Needs
  const [targetMajor, setTargetMajor] = useState('');
  const [targetMajorOther, setTargetMajorOther] = useState('');
  const [purpose, setPurpose] = useState('');
  const [purposeOther, setPurposeOther] = useState('');
  const [idealPersona, setIdealPersona] = useState('');
  const [idealPersonaOther, setIdealPersonaOther] = useState('');

  // Matching
  const [canOffer, setCanOffer] = useState('');
  const [canOfferOther, setCanOfferOther] = useState('');
  const [meetMode, setMeetMode] = useState('');
  const [freq, setFreq] = useState('');
  const [freqOther, setFreqOther] = useState('');

  const [submitting, setSubmitting] = useState(false);

  if (phase === 'background') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Stickers.cream.bg }}>
        <SharedBackground
          onComplete={(b) => {
            setBg(b);
            setPhase('needs');
          }}
        />
      </SafeAreaView>
    );
  }

  const needsValid =
    !!targetMajor && !!purpose && !!idealPersona &&
    (targetMajor !== '其他' || targetMajorOther.trim().length > 0) &&
    (purpose !== '其他' || purposeOther.trim().length > 0) &&
    (idealPersona !== '其他' || idealPersonaOther.trim().length > 0);

  const matchingValid =
    !!canOffer && !!meetMode && !!freq &&
    (canOffer !== '其他' || canOfferOther.trim().length > 0) &&
    (freq !== '其他' || freqOther.trim().length > 0);

  async function submit() {
    if (auth.status !== 'authenticated' || !bg) return;
    setSubmitting(true);
    try {
      const finalTargetMajor = targetMajor === '其他' ? targetMajorOther : targetMajor;
      const finalPurpose = purpose === '其他' ? purposeOther : purpose;
      const finalIdealPersona = idealPersona === '其他' ? idealPersonaOther : idealPersona;
      const finalCanOffer = canOffer === '其他' ? canOfferOther : canOffer;
      const finalFreq = freq === '其他' ? freqOther : freq;

      const background = bg;
      const needs = {
        targetMajor: finalTargetMajor,
        purpose: finalPurpose,
        idealFriendPersonality: finalIdealPersona,
      };
      const matching = {
        canOffer: finalCanOffer,
        meetMode,
        frequency: finalFreq,
      };
      await upsert({
        userId: auth.userId,
        mode: 'study',
        background,
        needs,
        matching,
        raw: { background, needs, matching },
      });
      // 提示并跳转到 persona 列表，让用户从 13 个数字人中选择
      Alert.alert('提示', '聊天超过5句才能生成数字人');
      router.replace('/match' as any);
      distill({ userId: auth.userId, mode: 'study' }).catch((e) => console.error('distill:', e));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Stickers.cream.bg }}>
      <ScrollView contentContainerStyle={styles.content}>
        {phase === 'needs' && (
          <>
            <HandwrittenTitle size={28}>你想找什么样的学习伙伴</HandwrittenTitle>

            <Text style={styles.q}>对方的专业方向？</Text>
            <View style={styles.row}>
              {TARGET_MAJORS.map((m) => (
                <StickerChip key={m} label={m} selected={targetMajor === m} onPress={() => setTargetMajor(m)} palette="matcha" />
              ))}
            </View>
            {targetMajor === '其他' && <OtherInput value={targetMajorOther} onChange={setTargetMajorOther} />}

            <Text style={styles.q}>你的主要目的？</Text>
            <View style={styles.row}>
              {PURPOSES.map((p) => (
                <StickerChip key={p} label={p} selected={purpose === p} onPress={() => setPurpose(p)} palette="peach" />
              ))}
            </View>
            {purpose === '其他' && <OtherInput value={purposeOther} onChange={setPurposeOther} />}

            <Text style={styles.q}>理想伙伴的性格？</Text>
            <View style={styles.row}>
              {PERSONA.map((p) => (
                <StickerChip key={p} label={p} selected={idealPersona === p} onPress={() => setIdealPersona(p)} palette="lavender" />
              ))}
            </View>
            {idealPersona === '其他' && <OtherInput value={idealPersonaOther} onChange={setIdealPersonaOther} />}

            <PressableScale
              disabled={!needsValid}
              onPress={() => { Haptics.selectionAsync(); setPhase('matching'); }}
              haptic="none"
              style={[styles.btn, !needsValid && { opacity: 0.5 }]}
            >
              <HandwrittenTitle size={18}>下一步 →</HandwrittenTitle>
            </PressableScale>
          </>
        )}

        {phase === 'matching' && (
          <>
            <HandwrittenTitle size={28}>你能怎么搭配 TA</HandwrittenTitle>

            <Text style={styles.q}>你能提供的帮助？</Text>
            <View style={styles.row}>
              {HELP.map((h) => (
                <StickerChip key={h} label={h} selected={canOffer === h} onPress={() => setCanOffer(h)} palette="matcha" />
              ))}
            </View>
            {canOffer === '其他' && <OtherInput value={canOfferOther} onChange={setCanOfferOther} />}

            <Text style={styles.q}>你想怎样交流？</Text>
            <View style={styles.row}>
              {MEETMODE.map((m) => (
                <StickerChip key={m} label={m} selected={meetMode === m} onPress={() => setMeetMode(m)} palette="peach" />
              ))}
            </View>

            <Text style={styles.q}>学习频率？</Text>
            <View style={styles.row}>
              {FREQ.map((f) => (
                <StickerChip key={f} label={f} selected={freq === f} onPress={() => setFreq(f)} palette="lavender" />
              ))}
            </View>
            {freq === '其他' && <OtherInput value={freqOther} onChange={setFreqOther} />}

            <PressableScale
              disabled={!matchingValid || submitting}
              onPress={submit}
              haptic="medium"
              style={[styles.btn, (!matchingValid || submitting) && { opacity: 0.5 }]}
            >
              <HandwrittenTitle size={18}>生成我的学习数字人 ✦</HandwrittenTitle>
            </PressableScale>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.lg, gap: Spacing.md },
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

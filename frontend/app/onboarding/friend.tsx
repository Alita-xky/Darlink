import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAction, useMutation } from 'convex/react';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';

import { api } from '../../convex/_generated/api';
import { useAuth } from '@/src/lib/auth-context';
import { SharedBackground, type BackgroundAnswer } from './_shared';
import { StickerChip, HandwrittenTitle } from '@/src/components/sticker';
import { OtherInput, TextAnswer } from '@/src/components/questionnaire';
import { PressableScale } from '@/src/components/PressableScale';
import { Colors, Spacing, Stickers, Shadows } from '@/constants/theme';

const HOBBY_CATEGORIES = ['运动类', '社交类', '学习类', '娱乐类', '其他'];
const PERSONA = ['内向', '外向', '其他'];
const MEETMODE = ['线上', '线下'];

type Phase = 'background' | 'needs' | 'matching';

function toggleMulti(arr: string[], v: string, max?: number): string[] {
  if (arr.includes(v)) return arr.filter((x) => x !== v);
  if (max && arr.length >= max) return arr;
  return [...arr, v];
}

export default function FriendScreen() {
  const router = useRouter();
  const { auth } = useAuth();
  const upsert = useMutation(api.profile.upsertModeQuestionnaire);
  const distill = useAction(api.nuwa.distillForUserByMode);

  const [phase, setPhase] = useState<Phase>('background');
  const [bg, setBg] = useState<BackgroundAnswer | null>(null);

  // Needs — hobbies
  const [hobbies, setHobbies] = useState<string[]>([]);
  const [hobbiesOther, setHobbiesOther] = useState('');

  // Needs — friend specifics
  const [coreFriendNeed, setCoreFriendNeed] = useState('');
  const [coreFriendNeedOther, setCoreFriendNeedOther] = useState('');
  const [secondaryNeeds, setSecondaryNeeds] = useState<string[]>([]);
  const [secondaryNeedsOther, setSecondaryNeedsOther] = useState('');
  const [expectedPersonality, setExpectedPersonality] = useState('');
  const [expectedPersonalityOther, setExpectedPersonalityOther] = useState('');

  // Matching
  const [uniqueTrait, setUniqueTrait] = useState('');
  const [meetMode, setMeetMode] = useState('');

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
    hobbies.length > 0 &&
    !!coreFriendNeed &&
    !!expectedPersonality &&
    (hobbies.includes('其他') ? hobbiesOther.trim().length > 0 : true) &&
    (coreFriendNeed !== '其他' || coreFriendNeedOther.trim().length > 0) &&
    (secondaryNeeds.includes('其他') ? secondaryNeedsOther.trim().length > 0 : true) &&
    (expectedPersonality !== '其他' || expectedPersonalityOther.trim().length > 0);

  const matchingValid = uniqueTrait.trim().length > 0 && !!meetMode;

  async function submit() {
    if (auth.status !== 'authenticated' || !bg) return;
    setSubmitting(true);
    try {
      const finalHobbies = hobbies.includes('其他') && hobbiesOther.trim()
        ? hobbies.map((h) => (h === '其他' ? hobbiesOther.trim() : h))
        : hobbies;

      const finalCoreFriendNeed =
        coreFriendNeed === '其他' ? coreFriendNeedOther.trim() : coreFriendNeed;

      const finalSecondaryNeeds = secondaryNeeds.includes('其他') && secondaryNeedsOther.trim()
        ? secondaryNeeds.map((n) => (n === '其他' ? secondaryNeedsOther.trim() : n))
        : secondaryNeeds;

      const finalExpectedPersonality =
        expectedPersonality === '其他' ? expectedPersonalityOther.trim() : expectedPersonality;

      const background = { ...bg, hobbies: finalHobbies };
      const needs = {
        coreFriendNeed: finalCoreFriendNeed,
        secondaryNeeds: finalSecondaryNeeds,
        expectedPersonality: finalExpectedPersonality,
      };
      const matching = {
        uniqueTrait: uniqueTrait.trim(),
        meetMode,
      };

      await upsert({
        userId: auth.userId,
        mode: 'friend',
        background,
        needs,
        matching,
        raw: { background, needs, matching },
      });
      router.replace('/(tabs)');
      distill({ userId: auth.userId, mode: 'friend' }).catch((e) =>
        console.error('distill:', e)
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Stickers.cream.bg }}>
      <ScrollView contentContainerStyle={styles.content}>
        {phase === 'needs' && (
          <>
            <HandwrittenTitle size={28}>你在找什么样的饭搭/玩搭</HandwrittenTitle>

            <Text style={styles.q}>你平时喜欢哪类活动？（最多选 5 个）</Text>
            <View style={styles.row}>
              {HOBBY_CATEGORIES.map((h) => (
                <StickerChip
                  key={h}
                  label={h}
                  selected={hobbies.includes(h)}
                  onPress={() => setHobbies(toggleMulti(hobbies, h, 5))}
                  palette="peach"
                />
              ))}
            </View>
            {hobbies.includes('其他') && (
              <OtherInput value={hobbiesOther} onChange={setHobbiesOther} />
            )}

            <Text style={styles.q}>你最核心的交友需求？</Text>
            <View style={styles.row}>
              {HOBBY_CATEGORIES.map((h) => (
                <StickerChip
                  key={h}
                  label={h}
                  selected={coreFriendNeed === h}
                  onPress={() => setCoreFriendNeed(h)}
                  palette="peach"
                />
              ))}
            </View>
            {coreFriendNeed === '其他' && (
              <OtherInput value={coreFriendNeedOther} onChange={setCoreFriendNeedOther} />
            )}

            <Text style={styles.q}>其他感兴趣的方向？（可多选）</Text>
            <View style={styles.row}>
              {HOBBY_CATEGORIES.map((h) => (
                <StickerChip
                  key={h}
                  label={h}
                  selected={secondaryNeeds.includes(h)}
                  onPress={() => setSecondaryNeeds(toggleMulti(secondaryNeeds, h))}
                  palette="lavender"
                />
              ))}
            </View>
            {secondaryNeeds.includes('其他') && (
              <OtherInput value={secondaryNeedsOther} onChange={setSecondaryNeedsOther} />
            )}

            <Text style={styles.q}>理想搭子的性格？</Text>
            <View style={styles.row}>
              {PERSONA.map((p) => (
                <StickerChip
                  key={p}
                  label={p}
                  selected={expectedPersonality === p}
                  onPress={() => setExpectedPersonality(p)}
                  palette="peach"
                />
              ))}
            </View>
            {expectedPersonality === '其他' && (
              <OtherInput value={expectedPersonalityOther} onChange={setExpectedPersonalityOther} />
            )}

            <PressableScale
              disabled={!needsValid}
              onPress={() => {
                Haptics.selectionAsync();
                setPhase('matching');
              }}
              haptic="none"
              style={[styles.btn, !needsValid && { opacity: 0.5 }]}
            >
              <HandwrittenTitle size={18}>下一步 →</HandwrittenTitle>
            </PressableScale>
          </>
        )}

        {phase === 'matching' && (
          <>
            <HandwrittenTitle size={28}>让搭子更了解你</HandwrittenTitle>

            <Text style={styles.q}>用一句话描述你的独特之处（最多 100 字）</Text>
            <TextAnswer
              value={uniqueTrait}
              onChange={setUniqueTrait}
              placeholder="例如：我是个深夜奶茶爱好者，擅长把无聊时光变有趣…"
              max={100}
            />

            <Text style={styles.q}>你想怎样约搭子？</Text>
            <View style={styles.row}>
              {MEETMODE.map((m) => (
                <StickerChip
                  key={m}
                  label={m}
                  selected={meetMode === m}
                  onPress={() => setMeetMode(m)}
                  palette="peach"
                />
              ))}
            </View>

            <PressableScale
              disabled={!matchingValid || submitting}
              onPress={submit}
              haptic="medium"
              style={[styles.btn, (!matchingValid || submitting) && { opacity: 0.5 }]}
            >
              <HandwrittenTitle size={18}>生成我的搭子数字人 ✦</HandwrittenTitle>
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
    backgroundColor: Stickers.peach.accent,
    borderColor: Stickers.peach.edge,
    borderWidth: 3,
    borderRadius: 18,
    padding: 14,
    alignItems: 'center',
    ...Shadows.sticker,
  },
});

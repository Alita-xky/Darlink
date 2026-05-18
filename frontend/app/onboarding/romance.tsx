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
import { OtherInput, TextAnswer, SortableList, type SortableItem } from '@/src/components/questionnaire';
import { PressableScale } from '@/src/components/PressableScale';
import { Colors, Spacing, Stickers, Shadows } from '@/constants/theme';

const TARGET_GENDER = ['男', '女'];
const HOBBY_CATEGORIES = ['运动类', '社交类', '学习类', '娱乐类', '其他'];
const MARRIAGE_VIEW = ['想结婚', '稳定关系', '其他'];
const MEETMODE = ['线上', '线下'];

const DEFAULT_PRIORITY_ITEMS: SortableItem[] = [
  { key: 'a', label: '经济条件' },
  { key: 'b', label: '身体条件' },
  { key: 'c', label: '对你的投入' },
  { key: 'd', label: '相同兴趣' },
  { key: 'e', label: '其他' },
];

type Phase = 'background' | 'extra-bg' | 'needs' | 'matching';

function toggleMulti(arr: string[], v: string, max?: number): string[] {
  if (arr.includes(v)) return arr.filter((x) => x !== v);
  if (max && arr.length >= max) return arr;
  return [...arr, v];
}

export default function RomanceScreen() {
  const router = useRouter();
  const { auth } = useAuth();
  const upsert = useMutation(api.profile.upsertModeQuestionnaire);
  const distill = useAction(api.nuwa.distillForUserByMode);

  const [phase, setPhase] = useState<Phase>('background');
  const [bg, setBg] = useState<BackgroundAnswer | null>(null);

  // Extra-bg phase
  const [targetGender, setTargetGender] = useState('');
  const [attractivePoint, setAttractivePoint] = useState('');
  const [hobbies, setHobbies] = useState<string[]>([]);
  const [hobbiesOther, setHobbiesOther] = useState('');

  // Needs phase
  const [marriageView, setMarriageView] = useState('');
  const [marriageViewOther, setMarriageViewOther] = useState('');
  const [partnerPriorityItems, setPartnerPriorityItems] = useState<SortableItem[]>(DEFAULT_PRIORITY_ITEMS);
  const [desiredTraits, setDesiredTraits] = useState('');

  // Matching phase
  const [whatMovesYou, setWhatMovesYou] = useState('');
  const [dealBreakers, setDealBreakers] = useState('');
  const [worriedPartnerCantAccept, setWorriedPartnerCantAccept] = useState('');
  const [meetMode, setMeetMode] = useState('');

  const [submitting, setSubmitting] = useState(false);

  if (phase === 'background') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Stickers.cream.bg }}>
        <SharedBackground
          onComplete={(b) => {
            setBg(b);
            setPhase('extra-bg');
          }}
        />
      </SafeAreaView>
    );
  }

  const extraBgValid =
    !!targetGender &&
    attractivePoint.trim().length > 0 &&
    hobbies.length > 0 &&
    (hobbies.includes('其他') ? hobbiesOther.trim().length > 0 : true);

  const needsValid =
    !!marriageView &&
    (marriageView !== '其他' || marriageViewOther.trim().length > 0) &&
    desiredTraits.trim().length > 0;

  const matchingValid =
    whatMovesYou.trim().length > 0 &&
    dealBreakers.trim().length > 0 &&
    worriedPartnerCantAccept.trim().length > 0 &&
    !!meetMode;

  async function submit() {
    if (auth.status !== 'authenticated' || !bg) return;
    setSubmitting(true);
    try {
      const finalHobbies =
        hobbies.includes('其他') && hobbiesOther.trim()
          ? hobbies.map((h) => (h === '其他' ? hobbiesOther.trim() : h))
          : hobbies;

      const finalMarriageView =
        marriageView === '其他' ? marriageViewOther.trim() : marriageView;

      const partnerPriorityKeys = partnerPriorityItems.map((i) => i.key);

      const background = {
        ...bg,
        targetGender,
        attractivePoint: attractivePoint.trim(),
        hobbies: finalHobbies,
      };
      const needs = {
        marriageView: finalMarriageView,
        partnerPriority: partnerPriorityKeys,
        desiredTraits: desiredTraits.trim(),
      };
      const matching = {
        whatMovesYou: whatMovesYou.trim(),
        dealBreakers: dealBreakers.trim(),
        worriedPartnerCantAccept: worriedPartnerCantAccept.trim(),
        meetMode,
      };

      await upsert({
        userId: auth.userId,
        mode: 'romance',
        background,
        needs,
        matching,
        raw: { background, needs, matching },
      });
      Alert.alert('提示', '聊天超过5句才能生成数字人');
      // 跳转到 persona 列表，用户可以从 13 个数字人中选择想要聊天的对象
      router.replace('/match' as any);
      distill({ userId: auth.userId, mode: 'romance' }).catch((e) =>
        console.error('distill:', e)
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Stickers.cream.bg }}>
      <ScrollView contentContainerStyle={styles.content}>
        {phase === 'extra-bg' && (
          <>
            <HandwrittenTitle size={28}>多说一点关于你</HandwrittenTitle>

            <Text style={styles.q}>你想寻找的对象性别？</Text>
            <View style={styles.row}>
              {TARGET_GENDER.map((g) => (
                <StickerChip
                  key={g}
                  label={g}
                  selected={targetGender === g}
                  onPress={() => setTargetGender(g)}
                  palette="lavender"
                />
              ))}
            </View>

            <Text style={styles.q}>你最能打动 ta 的闪光点（最多 100 字）</Text>
            <TextAnswer
              value={attractivePoint}
              onChange={setAttractivePoint}
              placeholder="例如：我很会照顾人，对感情很专一…"
              max={100}
            />

            <Text style={styles.q}>你平时喜欢哪类活动？（最多选 5 个）</Text>
            <View style={styles.row}>
              {HOBBY_CATEGORIES.map((h) => (
                <StickerChip
                  key={h}
                  label={h}
                  selected={hobbies.includes(h)}
                  onPress={() => setHobbies(toggleMulti(hobbies, h, 5))}
                  palette="lavender"
                />
              ))}
            </View>
            {hobbies.includes('其他') && (
              <OtherInput value={hobbiesOther} onChange={setHobbiesOther} />
            )}

            <PressableScale
              disabled={!extraBgValid}
              onPress={() => {
                Haptics.selectionAsync();
                setPhase('needs');
              }}
              haptic="none"
              style={[styles.btn, !extraBgValid && { opacity: 0.5 }]}
            >
              <HandwrittenTitle size={18}>下一步 →</HandwrittenTitle>
            </PressableScale>
          </>
        )}

        {phase === 'needs' && (
          <>
            <HandwrittenTitle size={28}>你对感情的期待</HandwrittenTitle>

            <Text style={styles.q}>你对婚恋的态度？</Text>
            <View style={styles.row}>
              {MARRIAGE_VIEW.map((v) => (
                <StickerChip
                  key={v}
                  label={v}
                  selected={marriageView === v}
                  onPress={() => setMarriageView(v)}
                  palette="lavender"
                />
              ))}
            </View>
            {marriageView === '其他' && (
              <OtherInput value={marriageViewOther} onChange={setMarriageViewOther} />
            )}

            <Text style={styles.q}>你最看重伴侣的哪些方面？（拖拽排序，最重要放第一）</Text>
            <View style={{ height: 320 }}>
              <SortableList
                items={partnerPriorityItems}
                onChange={setPartnerPriorityItems}
              />
            </View>

            <Text style={styles.q}>你理想中伴侣的特质（最多 100 字）</Text>
            <TextAnswer
              value={desiredTraits}
              onChange={setDesiredTraits}
              placeholder="例如：温柔体贴、有上进心、喜欢陪我出去玩…"
              max={100}
            />

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
            <HandwrittenTitle size={28}>让 ta 真正了解你</HandwrittenTitle>

            <Text style={styles.q}>什么最能打动你？（最多 100 字）</Text>
            <TextAnswer
              value={whatMovesYou}
              onChange={setWhatMovesYou}
              placeholder="例如：ta 记住了我随口说的小事，悄悄帮我安排好…"
              max={100}
            />

            <Text style={styles.q}>你的绝对 dealbreaker 是什么？（最多 100 字）</Text>
            <TextAnswer
              value={dealBreakers}
              onChange={setDealBreakers}
              placeholder="例如：不诚实、控制欲强、不尊重我的边界…"
              max={100}
            />

            <Text style={styles.q}>你最担心对方无法接受你的哪一面？（最多 100 字）</Text>
            <TextAnswer
              value={worriedPartnerCantAccept}
              onChange={setWorriedPartnerCantAccept}
              placeholder="例如：我有时需要大量独处时间，容易焦虑…"
              max={100}
            />

            <Text style={styles.q}>你想怎样认识对方？</Text>
            <View style={styles.row}>
              {MEETMODE.map((m) => (
                <StickerChip
                  key={m}
                  label={m}
                  selected={meetMode === m}
                  onPress={() => setMeetMode(m)}
                  palette="lavender"
                />
              ))}
            </View>

            <PressableScale
              disabled={!matchingValid || submitting}
              onPress={submit}
              haptic="medium"
              style={[styles.btn, (!matchingValid || submitting) && { opacity: 0.5 }]}
            >
              <HandwrittenTitle size={18}>生成我的恋爱数字人 ✦</HandwrittenTitle>
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
    backgroundColor: Stickers.lavender.accent,
    borderColor: Stickers.lavender.edge,
    borderWidth: 3,
    borderRadius: 18,
    padding: 14,
    alignItems: 'center',
    ...Shadows.sticker,
  },
});

import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { getUserDistillation, runUserDistillation, UserDistillTraits } from '../lib/backend-api';

function scoreToPercent(v?: number) {
  return Math.round((v || 0) * 100);
}

function labelMap(key: string) {
  const map: Record<string, string> = {
    logical: '逻辑性',
    intuitive: '直觉性',
    systematic: '系统性',
    creative: '创造性',

    long_term: '长期主义',
    risk_taking: '冒险倾向',
    independence: '独立性',
    altruism: '利他倾向',

    concise: '简洁程度',
    humorous: '幽默程度',
    proactive: '主动程度',
    emotional: '情感表达',
  };
  return map[key] || key;
}

function ScoreGroup({
  title,
  data,
}: {
  title: string;
  data?: Record<string, number>;
}) {
  if (!data) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {Object.entries(data).map(([key, value]) => (
        <View key={key} style={styles.row}>
          <Text style={styles.rowLabel}>{labelMap(key)}</Text>
          <Text style={styles.rowValue}>{scoreToPercent(value)}%</Text>
        </View>
      ))}
    </View>
  );
}

export default function UserDistillCard({ email }: { email?: string }) {
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');
  const [traits, setTraits] = useState<UserDistillTraits | null>(null);

  const load = async () => {
    setLoading(true);
    setError('');

    try {
        if (!email) {
        setError('正在读取账号信息...');
        return;
        }

        const res = await getUserDistillation(email);

      if (!res.ok) {
        if (res.reason === 'not_distilled_yet') {
          setTraits(null);
          setError('还没有生成用户画像');
        } else {
          setTraits(null);
          setError(res.reason || '获取画像失败');
        }
      } else {
        setTraits(res.traits || null);
      }
    } catch (e: any) {
      setError(e?.message || '请求失败');
      setTraits(null);
    } finally {
      setLoading(false);
    }
  };

  const run = async () => {
    setRunning(true);
    setError('');

    try {
        if (!email) {
        setError('正在读取账号信息...');
        return;
        }

        const res = await runUserDistillation(email);

      if (!res.ok) {
        setError(res.reason || '生成画像失败');
      } else {
        setTraits(res.traits || null);
      }
    } catch (e: any) {
      setError(e?.message || '请求失败');
    } finally {
      setRunning(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <View style={styles.card}>
        <ActivityIndicator />
        <Text style={styles.muted}>正在加载画像...</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>我的用户画像</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {!traits ? (
        <Pressable style={styles.button} onPress={run} disabled={running}>
          <Text style={styles.buttonText}>
            {running ? '生成中...' : '生成我的画像'}
          </Text>
        </Pressable>
      ) : (
        <>
          {traits.summary ? <Text style={styles.summary}>{traits.summary}</Text> : null}

          <ScoreGroup title="思维方式" data={traits.thinking_style} />
          <ScoreGroup title="价值取向" data={traits.values} />
          <ScoreGroup title="沟通风格" data={traits.communication} />

          {!!traits.interests?.length && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>兴趣领域</Text>
              <Text style={styles.textLine}>{traits.interests.join('、')}</Text>
            </View>
          )}

          {!!traits.concerns?.length && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>当前关注</Text>
              {traits.concerns.map((item) => (
                <Text key={item} style={styles.textLine}>• {item}</Text>
              ))}
            </View>
          )}

          <Text style={styles.muted}>
            可信度：{scoreToPercent(traits.confidence)}%
          </Text>
          <Text style={styles.muted}>
            分析消息数：{traits.message_count_analyzed || 0}
          </Text>

          <Pressable
            style={[styles.button, styles.secondaryButton]}
            onPress={run}
            disabled={running}
          >
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>
              {running ? '更新中...' : '重新生成画像'}
            </Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    margin: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
  },
  summary: {
    fontSize: 15,
    lineHeight: 22,
    color: '#333',
    marginBottom: 12,
  },
  section: {
    marginTop: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  rowLabel: {
    fontSize: 14,
    color: '#333',
  },
  rowValue: {
    fontSize: 14,
    color: '#666',
  },
  textLine: {
    fontSize: 14,
    lineHeight: 22,
    color: '#333',
  },
  muted: {
    marginTop: 8,
    fontSize: 13,
    color: '#888',
  },
  error: {
    color: '#d33',
    marginBottom: 12,
  },
  button: {
    marginTop: 12,
    backgroundColor: '#111',
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: '#eee',
  },
  secondaryButtonText: {
    color: '#111',
  },
});

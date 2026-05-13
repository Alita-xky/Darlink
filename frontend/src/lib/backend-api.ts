import AsyncStorage from '@react-native-async-storage/async-storage';

export type BackendPersona = {
  id: number;
  name: string;
  desc: string;
};

const SESSION_KEY_PREFIX = 'darlink_backend_session_v1';
const TOKEN_KEY_PREFIX = 'darlink_backend_user_token_v1';

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function tokenKeyForEmail(email: string) {
  return `${TOKEN_KEY_PREFIX}:${normalizeEmail(email)}`;
}

function sessionKeyForEmail(email: string, personaId: number) {
  return `${SESSION_KEY_PREFIX}:${normalizeEmail(email)}:${personaId}`;
}

function baseUrl(): string {
  const url = process.env.EXPO_PUBLIC_BACKEND_URL;
  if (!url) {
    throw new Error('缺少 EXPO_PUBLIC_BACKEND_URL（例如 http://127.0.0.1:8000）');
  }
  return url.replace(/\/$/, '');
}

async function backendFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${baseUrl()}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  const data = (await res.json().catch(() => ({}))) as any;

  if (!res.ok) {
    const msg = data?.detail || data?.reason || `HTTP ${res.status}`;
    throw new Error(`后端请求失败: ${msg}`);
  }

  return data as T;
}

export async function ensureUserToken(email: string): Promise<string> {
  if (!email) {
    throw new Error('缺少登录邮箱，无法获取后端用户 token');
  }

  const key = tokenKeyForEmail(email);
  const existing = await AsyncStorage.getItem(key);
  if (existing) return existing;

  const send = await backendFetch<{
    ok: boolean;
    debug_token: string;
    reason?: string;
  }>('/verify_email/send', {
    method: 'POST',
    body: JSON.stringify({ email: normalizeEmail(email) }),
  });

  if (!send.ok || !send.debug_token) {
    throw new Error(send.reason || '发送验证失败');
  }

  const confirm = await backendFetch<{
    ok: boolean;
    user_token: string;
    reason?: string;
  }>('/verify_email/confirm', {
    method: 'POST',
    body: JSON.stringify({ token: send.debug_token }),
  });

  if (!confirm.ok || !confirm.user_token) {
    throw new Error(confirm.reason || '确认验证失败');
  }

  await AsyncStorage.setItem(key, confirm.user_token);
  return confirm.user_token;
}

export async function listPersonas(): Promise<BackendPersona[]> {
  const data = await backendFetch<{
    ok: boolean;
    personas: BackendPersona[];
  }>('/personas');

  return data.personas ?? [];
}

export async function getPersona(
  personaId: number,
  email?: string,
): Promise<BackendPersona | null> {
  if (personaId === 0) {
    if (!email) {
      throw new Error('获取蒸馏人格需要 email');
    }

    const user_token = await ensureUserToken(email);

    const data = await backendFetch<{
      ok: boolean;
      persona?: BackendPersona;
      traits?: any;
    }>(`/personas/distilled?user_token=${encodeURIComponent(user_token)}`);

    return data.persona ?? null;
  }

  const data = await backendFetch<{
    ok: boolean;
    persona?: BackendPersona;
    reason?: string;
  }>(`/personas/${personaId}`);

  return data.persona ?? null;
}

export async function getOrCreateSessionId(
  email: string,
  personaId: number,
): Promise<string> {
  if (!email) {
    throw new Error('缺少登录邮箱，无法创建会话');
  }

  const key = sessionKeyForEmail(email, personaId);
  const existing = await AsyncStorage.getItem(key);
  if (existing) return existing;

  const user_token = await ensureUserToken(email);

  const data = await backendFetch<{
    ok: boolean;
    session_id?: string;
    reason?: string;
  }>('/chat/start', {
    method: 'POST',
    body: JSON.stringify({
      user_token,
      persona_id: personaId,
    }),
  });

  if (!data.ok || !data.session_id) {
    throw new Error(data.reason ?? '无法创建会话');
  }

  await AsyncStorage.setItem(key, data.session_id);
  return data.session_id;
}

export async function getDistilledPersona(
  email: string,
): Promise<{ persona?: BackendPersona; traits?: any } | null> {
  if (!email) {
    throw new Error('获取蒸馏人格需要 email');
  }

  const user_token = await ensureUserToken(email);

  const data = await backendFetch<{
    ok: boolean;
    persona?: BackendPersona;
    traits?: any;
  }>(`/personas/distilled?user_token=${encodeURIComponent(user_token)}`);

  return data.ok ? { persona: data.persona, traits: data.traits } : null;
}

export async function sendBackendChatMessage(
  sessionId: string,
  text: string,
): Promise<any> {
  const data = await backendFetch<any>('/chat/message', {
    method: 'POST',
    body: JSON.stringify({
      session_id: sessionId,
      text,
    }),
  });

  if (!data.ok) {
    throw new Error(data.reason ?? '发送失败');
  }

  return data;
}

export async function getBackendChatHistory(
  sessionId: string,
): Promise<{ role: 'user' | 'bot'; text: string; created_at: string }[]> {
  const data = await backendFetch<{
    ok: boolean;
    messages?: {
      role: 'user' | 'bot';
      text: string;
      created_at: string;
    }[];
  }>(`/chat/history/${sessionId}`);

  return data.messages ?? [];
}

export type UserDistillTraits = {
  thinking_style?: {
    logical: number;
    intuitive: number;
    systematic: number;
    creative: number;
  };
  values?: {
    long_term: number;
    risk_taking: number;
    independence: number;
    altruism: number;
  };
  interests?: string[];
  communication?: {
    concise: number;
    humorous: number;
    proactive: number;
    emotional: number;
  };
  concerns?: string[];
  summary?: string;
  confidence?: number;
  last_updated?: string;
  message_count_analyzed?: number;
};

export async function getUserDistillation(email: string) {
  if (!email) {
    throw new Error('获取用户画像需要 email');
  }

  const user_token = await ensureUserToken(email);

  return backendFetch<{
    ok: boolean;
    reason?: string;
    traits?: UserDistillTraits;
  }>(`/distill/result/${encodeURIComponent(user_token)}`);
}

export async function runUserDistillation(email: string) {
  if (!email) {
    throw new Error('生成用户画像需要 email');
  }

  const user_token = await ensureUserToken(email);

  return backendFetch<{
    ok: boolean;
    reason?: string;
    raw?: string;
    traits?: UserDistillTraits;
  }>('/distill/run', {
    method: 'POST',
    body: JSON.stringify({ user_token }),
  });
}

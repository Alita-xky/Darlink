import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery } from 'convex/react';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';

type AuthState =
  | { status: 'loading' }
  | { status: 'unauthenticated' }
  | { status: 'authenticated'; userId: Id<'users'> };

type AuthContextValue = {
  auth: AuthState;
  signIn: (userId: Id<'users'>) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = 'darlink:userId';

// `null` = no stored id; `undefined` = haven't read AsyncStorage yet.
type StoredState = string | null | undefined;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [storedId, setStoredId] = useState<StoredState>(undefined);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      setStoredId(stored);
    });
  }, []);

  // Probe `me` whenever a stored id exists. Result:
  //   undefined → still loading
  //   null      → server confirms no such user (stale id from wiped DB)
  //   {...}     → real user
  const me = useQuery(api.auth.me, storedId ? { userId: storedId } : 'skip');

  // Self-heal: stored id but server says null → clear storage.
  useEffect(() => {
    if (storedId && me === null) {
      AsyncStorage.removeItem(STORAGE_KEY).then(() => setStoredId(null));
    }
  }, [storedId, me]);

  const auth: AuthState = useMemo(() => {
    if (storedId === undefined) return { status: 'loading' };
    if (storedId === null) return { status: 'unauthenticated' };
    // Have a stored id — wait for me-check before declaring authenticated.
    // Without this gate, downstream queries fire with a stale userId and
    // crash on ArgumentValidationError before self-heal effect can run.
    if (me === undefined) return { status: 'loading' };
    if (me === null) return { status: 'unauthenticated' };
    return { status: 'authenticated', userId: storedId as Id<'users'> };
  }, [storedId, me]);

  async function signIn(userId: Id<'users'>) {
    await AsyncStorage.setItem(STORAGE_KEY, userId);
    setStoredId(userId);
  }

  async function signOut() {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setStoredId(null);
  }

  return (
    <AuthContext.Provider value={{ auth, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

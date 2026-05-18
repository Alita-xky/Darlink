import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import 'react-native-reanimated';

import { AuthProvider, useAuth } from '@/src/lib/auth-context';

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!);

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootNavigator() {
  const { auth } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (auth.status === 'loading') return;

    const segArr = segments as unknown as string[];
    const inAuthGroup = segArr[0] === 'auth';
    const screen = segArr[1];
    // Allow authenticated users to remain on step-2 / step-3 (mid-flow);
    // only step-1 (or undefined sub-screen) is the login entry that should
    // bounce them out to /(tabs).
    const onLoginEntry = inAuthGroup && (screen === undefined || screen === 'step-1-email');

    if (auth.status === 'unauthenticated' && !inAuthGroup) {
      router.replace('/auth/step-1-email');
    } else if (auth.status === 'authenticated' && onLoginEntry) {
      router.replace('/(tabs)');
    }
  }, [auth.status, segments, router]);

  return (
    <>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="auth/step-1-email" options={{ headerShown: false }} />
        <Stack.Screen name="auth/step-2-vibe" options={{ headerShown: false }} />
        <Stack.Screen name="auth/step-3-preview" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding/study" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding/friend" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding/romance" options={{ headerShown: false }} />
        <Stack.Screen
          name="match/[matchId]"
          options={{ title: '匹配详情', headerBackTitle: '返回' }}
        />
        <Stack.Screen
          name="chat/[chatId]"
          options={{ title: '聊天', headerBackTitle: '返回' }}
        />
        <Stack.Screen
          name="digitalhuman/[userId]"
          options={{ headerShown: false }}
        />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'MaShanZheng-Regular': require('../assets/fonts/MaShanZheng-Regular.ttf'),
    'Caveat-Regular': require('../assets/fonts/Caveat-Regular.ttf'),
  });

  if (!fontsLoaded) return null;

  return (
    <ConvexProvider client={convex}>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </ConvexProvider>
  );
}

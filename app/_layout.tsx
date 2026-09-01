// ============================================================
// app/_layout.tsx  — VERSION MISE À JOUR (remplace l'ancienne)
// Layout racine — auth silencieuse, sync, notifications
// ============================================================

import { COLORS } from '@/constants';
import { useAuth } from '@/hooks/useAuth';
import { syncService } from '@/services/firebase/syncService';
import { setupNotifications } from '@/services/notifications';
import { useUserStore } from '@/store/userStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { setOnboarded, setLoading, user } = useUserStore();
  const { signInSilently } = useAuth();
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // 1. Vérifier onboarding
        const onboarded = await AsyncStorage.getItem('isOnboarded');
        if (onboarded === 'true') {
          useUserStore.setState({ isOnboarded: true });
        }

        // 2. Connexion anonyme silencieuse
        await signInSilently();

        // 3. Synchronisation en arrière-plan (si réseau dispo)
        const needsSync = await syncService.needsSync();
        if (needsSync) {
          syncService.fullSync().catch(() => {/* silencieux */});
        }

      } catch (e) {
        console.warn('Erreur initialisation:', e);
      } finally {
        setLoading(false);
        setAppReady(true);
        await SplashScreen.hideAsync();
      }
    }

    prepare();
  }, []);

  // Configurer les notifications quand l'utilisateur est chargé
  useEffect(() => {
    if (user) {
      setupNotifications(user.streak, '09:00').catch(() => {});
    }
  }, [user?.streak]);

  if (!appReady) return null;

  return (
    <>
      <StatusBar style="light" backgroundColor={COLORS.primary} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="auth" />
        <Stack.Screen
          name="lesson/[id]"
          options={{ animation: 'slide_from_right', gestureEnabled: false }}
        />
        <Stack.Screen
          name="flashcard/[moduleId]"
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="quiz/[id]"
          options={{ animation: 'slide_from_bottom' }}
        />
      </Stack>
    </>
  );
}

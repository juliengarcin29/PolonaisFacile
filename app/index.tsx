// ============================================================
// app/index.tsx
// Point d'entrée — redirige selon l'état de l'utilisateur
// ============================================================

import { COLORS } from '@/constants';
import { useUserStore } from '@/store/userStore';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

export default function EntryScreen() {
  const { isOnboarded, isLoading } = useUserStore();

  useEffect(() => {
    if (!isLoading) {
      if (isOnboarded) {
        router.replace('/(tabs)');
      } else {
        router.replace('/onboarding');
      }
    }
  }, [isLoading, isOnboarded]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={COLORS.white} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

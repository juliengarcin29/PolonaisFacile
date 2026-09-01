// ============================================================
// app/auth/_layout.tsx
// Layout du groupe Auth
// ============================================================

import { Stack } from 'expo-router';
import { COLORS } from '@/constants';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_bottom',
        contentStyle: { backgroundColor: COLORS.white },
      }}
    >
      <Stack.Screen name="login" />
    </Stack>
  );
}

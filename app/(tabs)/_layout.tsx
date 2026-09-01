// ============================================================
// app/(tabs)/_layout.tsx
// Navigation principale — 5 onglets max (règle UX absolue)
// ============================================================

import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '@/constants';

function TabIcon({ emoji, focused, size }: { emoji: string; focused: boolean; size: number }) {
  return (
    <Text style={{ fontSize: size, opacity: focused ? 1 : 0.45 }}>
      {emoji}
    </Text>
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#E53935',
        tabBarInactiveTintColor: '#757575',
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E0E0E0',
          height: 65 + insets.bottom,
          paddingBottom: insets.bottom + 8,
          paddingTop: 8,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarLabel: 'Accueil',
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🏠" focused={focused} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="learn"
        options={{
          tabBarLabel: 'Apprendre',
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="📚" focused={focused} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="review"
        options={{
          tabBarLabel: 'Réviser',
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🔄" focused={focused} size={24} />
          ),
        }}
      />
      {/* Masqué pour la V1 */}
      <Tabs.Screen
        name="premium"
        options={{
          href: null,
          tabBarLabel: 'Premium',
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="⭐" focused={focused} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarLabel: 'Profil',
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="👤" focused={focused} size={24} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    height: 72,
    paddingBottom: 8,
    paddingTop: 8,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  tabItem: { alignItems: 'center', gap: 2 },
  tabEmoji: { fontSize: 22, opacity: 0.45 },
  tabEmojiFocused: { opacity: 1 },
  tabLabel: { fontSize: 10, color: COLORS.textMuted, fontWeight: '600' },
  tabLabelFocused: { color: COLORS.primary },
});

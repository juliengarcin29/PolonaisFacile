// ============================================================
// app/(tabs)/profile.tsx — VERSION MISE À JOUR
// Profil complet — auth, sync, paramètres, notifications
// ============================================================

import { useState, useEffect } from 'react';
import {
  ScrollView, View, Text, TouchableOpacity, StyleSheet,
  Switch, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useUserStore } from '@/store/userStore';
import { usePremiumGate } from '@/hooks/usePremiumGate';
import { useAuth } from '@/hooks/useAuth';
import { useSync } from '@/hooks/useSync';
import { useGamification, ALL_ACHIEVEMENTS } from '@/hooks/useGamification';
import {
  loadSettings, saveSettings, scheduleDailyReminder,
  cancelNotification,
} from '@/services/notifications';
import { COLORS, SPACING, BORDER_RADIUS } from '@/constants';

export default function ProfileScreen() {
  const { user } = useUserStore();
  const { isPremium } = usePremiumGate();
  const { logout, isAnonymous } = useAuth();
  const { syncStatus, lastSyncAt, forceSync } = useSync();
  const { allAchievements } = useGamification();

  const [notifDaily, setNotifDaily] = useState(true);
  const [notifStreak, setNotifStreak] = useState(true);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  // Charger les préférences de notifications
  useEffect(() => {
    loadSettings().then(s => {
      setNotifDaily(s.dailyReminder);
      setNotifStreak(s.streakAlert);
      setSettingsLoaded(true);
    });
  }, []);

  const handleNotifDaily = async (value: boolean) => {
    setNotifDaily(value);
    await saveSettings({ dailyReminder: value });
    if (value) {
      await scheduleDailyReminder('09:00');
    } else {
      await cancelNotification('daily_reminder');
    }
  };

  const handleNotifStreak = async (value: boolean) => {
    setNotifStreak(value);
    await saveSettings({ streakAlert: value });
    if (!value) await cancelNotification('streak_alert');
  };

  const handleLogout = () => {
    Alert.alert(
      'Se déconnecter',
      isAnonymous
        ? '⚠️ Votre progression sera perdue si vous n\'avez pas créé de compte. Continuer ?'
        : 'Voulez-vous vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Se déconnecter',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/onboarding');
          },
        },
      ]
    );
  };

  // Badges débloqués
  const unlockedIds = user?.achievements ?? [];
  const unlockedAchievements = allAchievements.filter(a => unlockedIds.includes(a.id));
  const lockedAchievements = allAchievements.filter(a => !unlockedIds.includes(a.id)).slice(0, 4);

  const STATS = [
    { label: 'Série actuelle', value: user?.streak ?? 0, emoji: '🔥' },
    { label: 'XP total', value: user?.xp ?? 0, emoji: '⭐' },
    { label: 'Leçons', value: user?.progress.totalLessonsCompleted ?? 0, emoji: '📚' },
    { label: 'Mots appris', value: user?.progress.masteredFlashcards.length ?? 0, emoji: '🧠' },
  ];

  const syncLabel = {
    idle: '⚪ Non synchronisé',
    syncing: '🔄 Synchronisation...',
    synced: `✅ Sync ${lastSyncAt ? new Date(lastSyncAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''}`,
    error: '❌ Erreur de sync',
    offline: '📵 Hors ligne',
  }[syncStatus];

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Avatar & identité ── */}
        <View style={s.avatarSection}>
          <View style={s.avatar}>
            <Text style={s.avatarEmoji}>
              {isPremium ? '👑' : isAnonymous ? '👤' : '😊'}
            </Text>
          </View>
          <Text style={s.name}>{user?.displayName ?? 'Apprenant'}</Text>
          <Text style={s.level}>Niveau {user?.level ?? 1} · {user?.xp ?? 0} XP</Text>

          {/* Badge premium ou anonyme */}
          {isPremium ? (
            <View style={s.premiumBadge}>
              <Text style={s.premiumBadgeTxt}>⭐ Accès Illimité</Text>
            </View>
          ) : isAnonymous ? (
            <TouchableOpacity
              style={s.loginBtn}
              onPress={() => router.push('/auth/login')}
            >
              <Text style={s.loginBtnTxt}>🔒 Créer un compte pour sauvegarder</Text>
            </TouchableOpacity>
          ) : (
            <View style={s.emailBadge}>
              <Text style={s.emailBadgeTxt}>✅ Compte connecté</Text>
            </View>
          )}
        </View>

        {/* ── Statistiques ── */}
        <View style={s.statsGrid}>
          {STATS.map((stat) => (
            <View key={stat.label} style={s.statBox}>
              <Text style={s.statEmoji}>{stat.emoji}</Text>
              <Text style={s.statValue}>{stat.value}</Text>
              <Text style={s.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* ── Badges débloqués ── */}
        {unlockedAchievements.length > 0 && (
          <>
            <Text style={s.sectionTitle}>🏆 Mes badges</Text>
            <View style={s.badgesWrap}>
              {unlockedAchievements.map((a) => (
                <View key={a.id} style={[s.badge, s.badgeUnlocked]}>
                  <Text style={s.badgeEmoji}>{a.icon}</Text>
                  <Text style={s.badgeTitle}>{a.title}</Text>
                </View>
              ))}
              {lockedAchievements.map((a) => (
                <View key={a.id} style={[s.badge, s.badgeLocked]}>
                  <Text style={[s.badgeEmoji, { opacity: 0.25 }]}>{a.icon}</Text>
                  <Text style={[s.badgeTitle, { opacity: 0.35 }]}>{a.title}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* ── Notifications ── */}
        <Text style={s.sectionTitle}>🔔 Notifications</Text>
        <View style={s.settingsCard}>
          <View style={s.settingRow}>
            <View style={s.settingLeft}>
              <Text style={s.settingLabel}>Rappel quotidien</Text>
              <Text style={s.settingDesc}>Chaque jour à 9h00</Text>
            </View>
            <Switch
              value={notifDaily}
              onValueChange={handleNotifDaily}
              trackColor={{ false: COLORS.surfaceAlt, true: COLORS.primary + '60' }}
              thumbColor={notifDaily ? COLORS.primary : COLORS.textMuted}
            />
          </View>

          <View style={[s.settingRow, { borderBottomWidth: 0 }]}>
            <View style={s.settingLeft}>
              <Text style={s.settingLabel}>Alerte série</Text>
              <Text style={s.settingDesc}>Si pas d'activité à 20h</Text>
            </View>
            <Switch
              value={notifStreak}
              onValueChange={handleNotifStreak}
              trackColor={{ false: COLORS.surfaceAlt, true: COLORS.primary + '60' }}
              thumbColor={notifStreak ? COLORS.primary : COLORS.textMuted}
            />
          </View>
        </View>

        {/* ── Synchronisation ── */}
        <Text style={s.sectionTitle}>☁️ Synchronisation</Text>
        <View style={s.settingsCard}>
          <View style={s.settingRow}>
            <View style={s.settingLeft}>
              <Text style={s.settingLabel}>Statut</Text>
              <Text style={s.settingDesc}>{syncLabel}</Text>
            </View>
            <TouchableOpacity
              style={[s.syncBtn, syncStatus === 'syncing' && s.syncBtnDisabled]}
              onPress={forceSync}
              disabled={syncStatus === 'syncing'}
            >
              {syncStatus === 'syncing'
                ? <ActivityIndicator size="small" color={COLORS.primary} />
                : <Text style={s.syncBtnTxt}>Sync</Text>
              }
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Menu ── */}
        <Text style={s.sectionTitle}>⚙️ Paramètres</Text>
        <View style={s.menuCard}>
          {[
            { emoji: '⭐', label: 'Passer à Premium', action: () => router.push('/(tabs)/premium') },
            { emoji: '🌍', label: 'Langue de l\'interface', action: () => {} },
            { emoji: '❓', label: 'Aide & FAQ', action: () => {} },
            { emoji: '⭐', label: 'Noter l\'application', action: () => {} },
            { emoji: '📤', label: 'Partager avec un ami', action: () => {} },
          ].map((item, i, arr) => (
            <TouchableOpacity
              key={item.label}
              style={[s.menuRow, i === arr.length - 1 && { borderBottomWidth: 0 }]}
              onPress={item.action}
            >
              <Text style={s.menuEmoji}>{item.emoji}</Text>
              <Text style={s.menuLabel}>{item.label}</Text>
              <Text style={s.menuArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Déconnexion ── */}
        <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
          <Text style={s.logoutTxt}>
            {isAnonymous ? '🚪 Effacer les données' : '🚪 Se déconnecter'}
          </Text>
        </TouchableOpacity>

        {/* Version */}
        <Text style={s.version}>Polonais Facile v1.0.0</Text>

        <View style={{ height: SPACING.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },

  avatarSection: {
    alignItems: 'center', padding: SPACING.xl,
    backgroundColor: COLORS.white, marginBottom: SPACING.md,
  },
  avatar: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: COLORS.primary + '15',
    alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.sm,
  },
  avatarEmoji: { fontSize: 44 },
  name: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary },
  level: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4, marginBottom: 14 },

  premiumBadge: {
    backgroundColor: '#FFF8DC', borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: 16, paddingVertical: 6,
    borderWidth: 1.5, borderColor: '#D4AF37',
  },
  premiumBadgeTxt: { fontSize: 13, fontWeight: '800', color: '#92400E' },

  loginBtn: {
    backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.full,
    paddingVertical: 10, paddingHorizontal: SPACING.lg,
  },
  loginBtnTxt: { color: COLORS.white, fontSize: 13, fontWeight: '700' },

  emailBadge: {
    backgroundColor: COLORS.successLight, borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: 16, paddingVertical: 6,
  },
  emailBadgeTxt: { fontSize: 13, fontWeight: '700', color: COLORS.success },

  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 12,
    paddingHorizontal: SPACING.lg, marginBottom: SPACING.md,
  },
  statBox: {
    width: '47%', backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg, padding: SPACING.md,
    alignItems: 'center', gap: 4,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  statEmoji: { fontSize: 24 },
  statValue: { fontSize: 26, fontWeight: '900', color: COLORS.textPrimary },
  statLabel: { fontSize: 11, color: COLORS.textMuted, textAlign: 'center' },

  sectionTitle: {
    fontSize: 15, fontWeight: '800', color: COLORS.textPrimary,
    marginHorizontal: SPACING.lg, marginBottom: 10, marginTop: 4,
  },

  badgesWrap: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10,
    paddingHorizontal: SPACING.lg, marginBottom: SPACING.md,
  },
  badge: {
    alignItems: 'center', gap: 4, padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg, width: 68,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  badgeUnlocked: { backgroundColor: COLORS.white },
  badgeLocked: { backgroundColor: COLORS.surfaceAlt },
  badgeEmoji: { fontSize: 28 },
  badgeTitle: { fontSize: 9, color: COLORS.textMuted, textAlign: 'center', fontWeight: '600' },

  settingsCard: {
    backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.xl,
    marginHorizontal: SPACING.lg, marginBottom: SPACING.md, overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: SPACING.md,
    borderBottomWidth: 1, borderBottomColor: COLORS.surfaceAlt,
  },
  settingLeft: { flex: 1 },
  settingLabel: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  settingDesc: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },

  syncBtn: {
    backgroundColor: COLORS.primary + '15',
    borderRadius: BORDER_RADIUS.md, paddingHorizontal: 16, paddingVertical: 8,
    borderWidth: 1, borderColor: COLORS.primary + '30',
    minWidth: 56, alignItems: 'center',
  },
  syncBtnDisabled: { opacity: 0.5 },
  syncBtnTxt: { fontSize: 13, fontWeight: '700', color: COLORS.primary },

  menuCard: {
    backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.xl,
    marginHorizontal: SPACING.lg, marginBottom: SPACING.md, overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: SPACING.md,
    borderBottomWidth: 1, borderBottomColor: COLORS.surfaceAlt,
  },
  menuEmoji: { fontSize: 20, width: 28 },
  menuLabel: { flex: 1, fontSize: 15, color: COLORS.textPrimary, fontWeight: '500' },
  menuArrow: { fontSize: 20, color: COLORS.textMuted },

  logoutBtn: {
    marginHorizontal: SPACING.lg, marginBottom: SPACING.md,
    backgroundColor: COLORS.errorLight, borderRadius: BORDER_RADIUS.xl,
    paddingVertical: 16, alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.error + '30',
  },
  logoutTxt: { fontSize: 15, fontWeight: '700', color: COLORS.error },

  version: {
    fontSize: 11, color: COLORS.textMuted, textAlign: 'center', marginBottom: SPACING.sm,
  },
});

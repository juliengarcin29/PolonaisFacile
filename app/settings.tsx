// ============================================================
// app/settings.tsx
// Écran paramètres complet
// ============================================================

import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
  ScrollView, Switch, Alert, Linking,
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUserStore } from '@/store/userStore';
import { useAuth } from '@/hooks/useAuth';
import {
  loadSettings, saveSettings,
  scheduleDailyReminder, cancelNotification,
  requestPermissions,
} from '@/services/notifications';
import { COLORS, SPACING, BORDER_RADIUS } from '@/constants';
import { URLS, APP_META } from '@/config/appConfig';

interface SettingsState {
  dailyReminder: boolean;
  reminderTime: string;
  streakAlert: boolean;
  weeklyReport: boolean;
  soundEffects: boolean;
  haptics: boolean;
  autoPlayAudio: boolean;
  showTranslations: boolean;
  showPhonetics: boolean;
  dailyGoal: number;
}

const DEFAULT_SETTINGS: SettingsState = {
  dailyReminder: true,
  reminderTime: '09:00',
  streakAlert: true,
  weeklyReport: true,
  soundEffects: true,
  haptics: true,
  autoPlayAudio: false,
  showTranslations: true,
  showPhonetics: true,
  dailyGoal: 10,
};

const DAILY_GOAL_OPTIONS = [5, 10, 15, 20, 30];

const REMINDER_TIMES = [
  '07:00', '08:00', '09:00', '10:00',
  '12:00', '18:00', '19:00', '20:00', '21:00',
];

export default function SettingsScreen() {
  const { user, updateUser } = useUserStore();
  const { logout, isAnonymous } = useAuth();
  const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);

  useEffect(() => {
    loadSettings().then(s => {
      setSettings(prev => ({ ...prev, ...s }));
      setLoaded(true);
    });
  }, []);

  const updateSetting = async <K extends keyof SettingsState>(
    key: K,
    value: SettingsState[K],
  ) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    await saveSettings({ [key]: value });

    // Actions secondaires selon le paramètre
    if (key === 'dailyReminder') {
      if (value) {
        const granted = await requestPermissions();
        if (granted) await scheduleDailyReminder(settings.reminderTime);
      } else {
        await cancelNotification('daily_reminder');
      }
    }
    if (key === 'reminderTime' && settings.dailyReminder) {
      await scheduleDailyReminder(value as string);
    }
    if (key === 'dailyGoal') {
      updateUser({ dailyGoal: value as number });
    }
  };

  const handleClearCache = () => {
    Alert.alert(
      'Vider le cache',
      'Cela supprimera les données temporaires. Votre progression est sauvegardée.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Vider',
          onPress: async () => {
            const keys = await AsyncStorage.getAllKeys();
            const cacheKeys = keys.filter(k => k.startsWith('cache_'));
            if (cacheKeys.length > 0) await AsyncStorage.multiRemove(cacheKeys);
            Alert.alert('✅ Cache vidé');
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      '⚠️ Supprimer mon compte',
      'Cette action est irréversible. Toutes vos données seront supprimées.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/onboarding');
          },
        },
      ]
    );
  };

  if (!loaded) return null;

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={s.backTxt}>← Retour</Text>
        </TouchableOpacity>
        <Text style={s.title}>Paramètres</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── OBJECTIF QUOTIDIEN ── */}
        <SectionTitle title="🎯 Objectif quotidien" />
        <View style={s.card}>
          <Text style={s.cardDesc}>Minutes d'apprentissage par jour</Text>
          <View style={s.goalRow}>
            {DAILY_GOAL_OPTIONS.map(min => (
              <TouchableOpacity
                key={min}
                style={[s.goalChip, settings.dailyGoal === min && s.goalChipActive]}
                onPress={() => updateSetting('dailyGoal', min)}
              >
                <Text style={[s.goalChipTxt, settings.dailyGoal === min && s.goalChipTxtActive]}>
                  {min} min
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── NOTIFICATIONS ── */}
        <SectionTitle title="🔔 Notifications" />
        <View style={s.card}>
          <SettingRow
            label="Rappel quotidien"
            desc={`Chaque jour à ${settings.reminderTime}`}
            value={settings.dailyReminder}
            onChange={v => updateSetting('dailyReminder', v)}
          />
          {settings.dailyReminder && (
            <View style={s.timePickerWrap}>
              <Text style={s.timePickerLabel}>Heure du rappel</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={s.timeRow}>
                  {REMINDER_TIMES.map(t => (
                    <TouchableOpacity
                      key={t}
                      style={[s.timeChip, settings.reminderTime === t && s.timeChipActive]}
                      onPress={() => updateSetting('reminderTime', t)}
                    >
                      <Text style={[s.timeChipTxt, settings.reminderTime === t && s.timeChipTxtActive]}>
                        {t}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}
          <SettingRow
            label="Alerte série"
            desc="Si pas d'activité à 20h"
            value={settings.streakAlert}
            onChange={v => updateSetting('streakAlert', v)}
            noBorder
          />
        </View>

        {/* ── APPRENTISSAGE ── */}
        <SectionTitle title="📚 Apprentissage" />
        <View style={s.card}>
          <SettingRow
            label="Lecture audio automatique"
            desc="Jouer l'audio au démarrage d'un exercice"
            value={settings.autoPlayAudio}
            onChange={v => updateSetting('autoPlayAudio', v)}
          />
          <SettingRow
            label="Afficher les traductions"
            desc="Traduction FR visible par défaut"
            value={settings.showTranslations}
            onChange={v => updateSetting('showTranslations', v)}
          />
          <SettingRow
            label="Afficher la phonétique"
            desc="Transcription phonétique visible"
            value={settings.showPhonetics}
            onChange={v => updateSetting('showPhonetics', v)}
            noBorder
          />
        </View>

        {/* ── SONS & HAPTIQUE ── */}
        <SectionTitle title="🔊 Sons & Retours" />
        <View style={s.card}>
          <SettingRow
            label="Effets sonores"
            desc="Sons de bonne/mauvaise réponse"
            value={settings.soundEffects}
            onChange={v => updateSetting('soundEffects', v)}
          />
          <SettingRow
            label="Vibrations"
            desc="Retour haptique aux interactions"
            value={settings.haptics}
            onChange={v => updateSetting('haptics', v)}
            noBorder
          />
        </View>

        {/* ── COMPTE ── */}
        <SectionTitle title="👤 Compte" />
        <View style={s.card}>
          {isAnonymous ? (
            <TouchableAction
              label="Créer un compte"
              desc="Sauvegarder votre progression"
              onPress={() => router.push('/auth/login')}
              color={COLORS.primary}
            />
          ) : (
            <TouchableAction
              label="Se déconnecter"
              desc={user?.email ?? ''}
              onPress={() => Alert.alert(
                'Déconnexion',
                'Voulez-vous vous déconnecter ?',
                [
                  { text: 'Annuler', style: 'cancel' },
                  { text: 'Déconnecter', onPress: logout },
                ]
              )}
            />
          )}
          <TouchableAction
            label="Restaurer les achats"
            desc="Récupérer un abonnement existant"
            onPress={() => router.push('/(tabs)/premium')}
            noBorder
          />
        </View>

        {/* ── DONNÉES ── */}
        <SectionTitle title="💾 Données" />
        <View style={s.card}>
          <TouchableAction
            label="Vider le cache"
            desc="Libérer de l'espace (données temp.)"
            onPress={handleClearCache}
          />
          <TouchableAction
            label="Supprimer mon compte"
            desc="Action irréversible"
            onPress={handleDeleteAccount}
            color={COLORS.error}
            noBorder
          />
        </View>

        {/* ── À PROPOS ── */}
        <SectionTitle title="ℹ️ À propos" />
        <View style={s.card}>
          <TouchableAction
            label="Politique de confidentialité"
            onPress={() => Linking.openURL(URLS.PRIVACY_POLICY)}
          />
          <TouchableAction
            label="Conditions d'utilisation"
            onPress={() => Linking.openURL(URLS.TERMS_OF_SERVICE)}
          />
          <TouchableAction
            label="Contacter le support"
            desc={URLS.SUPPORT_EMAIL}
            onPress={() => Linking.openURL(`mailto:${URLS.SUPPORT_EMAIL}`)}
          />
          <TouchableAction
            label="Noter l'application"
            onPress={() => Linking.openURL(URLS.PLAY_STORE)}
            noBorder
          />
        </View>

        {/* Version */}
        <Text style={s.version}>
          {APP_META.NAME} v{APP_META.VERSION} ({APP_META.ENV})
        </Text>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Composants helpers ────────────────────────────────────────
function SectionTitle({ title }: { title: string }) {
  return <Text style={st.title}>{title}</Text>;
}

const st = StyleSheet.create({
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    marginBottom: 6,
  },
});

function SettingRow({
  label, desc, value, onChange, noBorder = false,
}: {
  label: string;
  desc?: string;
  value: boolean;
  onChange: (v: boolean) => void;
  noBorder?: boolean;
}) {
  return (
    <View style={[sr.row, noBorder && sr.rowNoBorder]}>
      <View style={sr.left}>
        <Text style={sr.label}>{label}</Text>
        {desc && <Text style={sr.desc}>{desc}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: COLORS.surfaceAlt, true: COLORS.primary + '60' }}
        thumbColor={value ? COLORS.primary : COLORS.textMuted}
      />
    </View>
  );
}

const sr = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', padding: SPACING.md,
    borderBottomWidth: 1, borderBottomColor: COLORS.surfaceAlt,
  },
  rowNoBorder: { borderBottomWidth: 0 },
  left: { flex: 1, marginRight: SPACING.md },
  label: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  desc: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
});

function TouchableAction({
  label, desc, onPress, color, noBorder = false,
}: {
  label: string;
  desc?: string;
  onPress: () => void;
  color?: string;
  noBorder?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[ta.row, noBorder && ta.rowNoBorder]}
      onPress={onPress}
    >
      <View style={ta.left}>
        <Text style={[ta.label, color ? { color } : {}]}>{label}</Text>
        {desc && <Text style={ta.desc}>{desc}</Text>}
      </View>
      <Text style={ta.arrow}>›</Text>
    </TouchableOpacity>
  );
}

const ta = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1, borderBottomColor: COLORS.surfaceAlt,
  },
  rowNoBorder: { borderBottomWidth: 0 },
  left: { flex: 1 },
  label: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  desc: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  arrow: { fontSize: 20, color: COLORS.textMuted },
});

// ── Styles principaux ─────────────────────────────────────────
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: SPACING.lg, backgroundColor: COLORS.white,
    borderBottomWidth: 1, borderBottomColor: COLORS.surfaceAlt,
  },
  backTxt: { fontSize: 15, color: COLORS.primary, fontWeight: '600' },
  title: { fontSize: 17, fontWeight: '800', color: COLORS.textPrimary },
  card: {
    backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.xl,
    marginHorizontal: SPACING.lg, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  cardDesc: {
    fontSize: 13, color: COLORS.textSecondary,
    paddingHorizontal: SPACING.md, paddingTop: SPACING.md,
  },
  goalRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
    padding: SPACING.md,
  },
  goalChip: {
    paddingHorizontal: 14, paddingVertical: 8,
    backgroundColor: COLORS.surfaceAlt, borderRadius: BORDER_RADIUS.full,
    borderWidth: 1.5, borderColor: 'transparent',
  },
  goalChipActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '12' },
  goalChipTxt: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary },
  goalChipTxtActive: { color: COLORS.primary },
  timePickerWrap: {
    paddingHorizontal: SPACING.md, paddingBottom: SPACING.md,
    borderBottomWidth: 1, borderBottomColor: COLORS.surfaceAlt,
  },
  timePickerLabel: { fontSize: 12, color: COLORS.textMuted, marginBottom: 8 },
  timeRow: { flexDirection: 'row', gap: 8 },
  timeChip: {
    paddingHorizontal: 12, paddingVertical: 6,
    backgroundColor: COLORS.surfaceAlt, borderRadius: BORDER_RADIUS.full,
    borderWidth: 1.5, borderColor: 'transparent',
  },
  timeChipActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '12' },
  timeChipTxt: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary },
  timeChipTxtActive: { color: COLORS.primary },
  version: {
    fontSize: 11, color: COLORS.textMuted, textAlign: 'center',
    marginTop: SPACING.lg, marginBottom: SPACING.sm,
  },
});

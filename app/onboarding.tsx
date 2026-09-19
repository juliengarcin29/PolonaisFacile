// ============================================================
// app/onboarding.tsx
// Onboarding multilingue — sans compte obligatoire
// ============================================================

import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useUserStore } from '@/store/userStore';
import { MONETIZATION_ENABLED } from '@/config/appConfig';
import { setupNotifications } from '@/services/notifications';
import { COLORS, SPACING, BORDER_RADIUS, ONBOARDING_GOALS, DAILY_GOALS, LEVELS_LABELS } from '@/constants';

const { width } = Dimensions.get('window');

type OnboardingData = {
  goal: string;
  level: string;
  dailyMinutes: number;
};

export default function OnboardingScreen() {
  const { t, i18n } = useTranslation();
  const [step, setStep] = useState(0);
  const [isFinishing, setIsFinishing] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    goal: '',
    level: '',
    dailyMinutes: 10,
  });
  const { setOnboarded, setLanguage } = useUserStore();

  const totalSteps = MONETIZATION_ENABLED ? 6 : 5;

  const handleNext = () => {
    if (step < totalSteps - 1) {
      setStep(step + 1);
    } else {
      setIsFinishing(true);
    }
  };

  const handleFinish = async () => {
    const newUser = {
      id: `anon_${Date.now()}`,
      email: null,
      displayName: 'Apprenant',
      photoURL: null,
      level: 1,
      xp: 0,
      xpToNextLevel: 100,
      streak: 0,
      longestStreak: 0,
      hearts: 5,
      maxHearts: 5,
      premium: false,
      premiumExpiresAt: null,
      language: i18n.language as any,
      targetLanguage: 'pl' as const,
      dailyGoal: data.dailyMinutes,
      achievements: [],
      progress: {
        completedLessons: [],
        completedModules: [],
        completedQuizzes: [],
        masteredFlashcards: [],
        totalXpEarned: 0,
        totalLessonsCompleted: 0,
        totalTimeSpent: 0,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt: new Date(),
    };
    useUserStore.setState({ user: newUser });
    await setOnboarded(true);

    try {
      await setupNotifications(0, '09:00');
    } catch (e) {
      console.warn('Erreur setup notifications:', e);
    }

    router.replace('/(tabs)');
  };

  useEffect(() => {
    if (isFinishing) {
      handleFinish();
    }
  }, [isFinishing]);

  const changeLanguage = (lang: 'fr' | 'en') => {
    i18n.changeLanguage(lang);
    setLanguage(lang);
    handleNext();
  };

  const canContinue = () => {
    if (step === 0) return false; // Choix de langue force le clic sur bouton
    if (step === 1) return data.goal !== '';
    if (step === 2) return data.level !== '';
    return true;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Barre de progression */}
      <View style={styles.progressBar}>
        {Array.from({ length: totalSteps }).map((_, i) => (
          <View
            key={i}
            style={[styles.progressDot, i <= step && styles.progressDotActive]}
          />
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {step === 0 && <StepLanguage onSelect={changeLanguage} />}
        {step === 1 && <StepGoal data={data} setData={setData} />}
        {step === 2 && <StepLevel data={data} setData={setData} />}
        {step === 3 && <StepTime data={data} setData={setData} />}
        {step === 4 && <StepDemo />}
        {MONETIZATION_ENABLED && step === 5 && <StepPremium />}
      </ScrollView>

      {/* Footer area */}
      <View style={styles.footer}>
        {step > 0 && (
          <TouchableOpacity
            style={[styles.btn, !canContinue() && styles.btnDisabled]}
            onPress={handleNext}
            disabled={!canContinue()}
          >
            <Text style={styles.btnText}>
              {step === totalSteps - 1 ? t('onboarding.buttons.finish') : t('onboarding.buttons.continue')}
            </Text>
          </TouchableOpacity>
        )}

        {step === (MONETIZATION_ENABLED ? 5 : 4) && (
          <TouchableOpacity onPress={() => setIsFinishing(true)} style={styles.skipBtn}>
            <Text style={styles.skipText}>{t('onboarding.buttons.skip')}</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

// ── ÉTAPE 0 : Langue ─────────────────────────────────────────
function StepLanguage({ onSelect }: { onSelect: (lang: 'fr' | 'en') => void }) {
  const { t } = useTranslation();
  return (
    <View style={styles.step}>
      <Text style={styles.emoji}>🌍</Text>
      <Text style={styles.title}>{t('onboarding.language.title')}</Text>
      <Text style={styles.subtitle}>{t('onboarding.language.subtitle')}</Text>
      <View style={styles.grid}>
        <TouchableOpacity style={styles.optionCard} onPress={() => onSelect('fr')}>
          <Text style={styles.optionEmoji}>🇫🇷</Text>
          <Text style={styles.optionLabel}>{t('onboarding.language.fr')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.optionCard} onPress={() => onSelect('en')}>
          <Text style={styles.optionEmoji}>🇬🇧</Text>
          <Text style={styles.optionLabel}>{t('onboarding.language.en')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── ÉTAPE 1 : Objectif ───────────────────────────────────────
function StepGoal({ data, setData }: { data: OnboardingData; setData: (d: OnboardingData) => void }) {
  const { t } = useTranslation();
  return (
    <View style={styles.step}>
      <Text style={styles.emoji}>🎯</Text>
      <Text style={styles.title}>{t('onboarding.goal.title')}</Text>
      <Text style={styles.subtitle}>{t('onboarding.goal.subtitle')}</Text>
      <View style={styles.grid}>
        {ONBOARDING_GOALS.map((goal) => (
          <TouchableOpacity
            key={goal.id}
            style={[styles.optionCard, data.goal === goal.id && styles.optionCardSelected]}
            onPress={() => setData({ ...data, goal: goal.id })}
          >
            <Text style={styles.optionEmoji}>{goal.emoji}</Text>
            <Text style={[styles.optionLabel, data.goal === goal.id && styles.optionLabelSelected]}>
              {t(goal.labelKey as any)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ── ÉTAPE 2 : Niveau ─────────────────────────────────────────
function StepLevel({ data, setData }: { data: OnboardingData; setData: (d: OnboardingData) => void }) {
  const { t } = useTranslation();
  return (
    <View style={styles.step}>
      <Text style={styles.emoji}>📊</Text>
      <Text style={styles.title}>{t('onboarding.level.title')}</Text>
      <View style={styles.levelList}>
        {LEVELS_LABELS.map((lvl) => (
          <TouchableOpacity
            key={lvl.id}
            style={[styles.levelCard, data.level === lvl.id && styles.levelCardSelected]}
            onPress={() => setData({ ...data, level: lvl.id })}
          >
            <View style={styles.levelCardInner}>
              <Text style={[styles.levelName, data.level === lvl.id && styles.levelNameSelected]}>
                {t(lvl.labelKey as any)}
              </Text>
              <Text style={styles.levelDesc}>{t(lvl.descriptionKey as any)}</Text>
            </View>
            <View style={[styles.radio, data.level === lvl.id && styles.radioSelected]} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ── ÉTAPE 3 : Objectif quotidien ─────────────────────────────
function StepTime({ data, setData }: { data: OnboardingData; setData: (d: OnboardingData) => void }) {
  const { t } = useTranslation();
  return (
    <View style={styles.step}>
      <Text style={styles.emoji}>⏱️</Text>
      <Text style={styles.title}>{t('onboarding.time.title')}</Text>
      <Text style={styles.subtitle}>{t('onboarding.time.subtitle')}</Text>
      <View style={styles.timeGrid}>
        {DAILY_GOALS.map((goal) => (
          <TouchableOpacity
            key={goal.minutes}
            style={[styles.timeCard, data.dailyMinutes === goal.minutes && styles.timeCardSelected]}
            onPress={() => setData({ ...data, dailyMinutes: goal.minutes })}
          >
            <Text style={styles.timeEmoji}>{goal.emoji}</Text>
            <Text style={[styles.timeMin, data.dailyMinutes === goal.minutes && styles.timeMinSelected]}>
              {t('onboarding.time.minutes', { count: goal.minutes })}
            </Text>
            <Text style={styles.timeLabel}>{t(goal.labelKey as any)}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ── ÉTAPE 4 : Démo de valeur ──────────────────────────────────
function StepDemo() {
  const { t } = useTranslation();
  const features = [
    { emoji: '🎮', title: t('onboarding.demo.feature1_title'), desc: t('onboarding.demo.feature1_desc') },
    { emoji: '🔊', title: t('onboarding.demo.feature2_title'), desc: t('onboarding.demo.feature2_desc') },
    { emoji: '🔥', title: t('onboarding.demo.feature3_title'), desc: t('onboarding.demo.feature3_desc') },
    { emoji: '🧠', title: t('onboarding.demo.feature4_title'), desc: t('onboarding.demo.feature4_desc') },
  ];
  return (
    <View style={styles.step}>
      <Text style={styles.emoji}>🇵🇱</Text>
      <Text style={styles.title}>{t('onboarding.demo.title')}</Text>
      <Text style={styles.subtitle}>{t('onboarding.demo.subtitle')}</Text>
      <View style={styles.featureList}>
        {features.map((f) => (
          <View key={f.title} style={styles.featureRow}>
            <Text style={styles.featureEmoji}>{f.emoji}</Text>
            <View>
              <Text style={styles.featureTitle}>{f.title}</Text>
              <Text style={styles.featureDesc}>{f.desc}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

// ── ÉTAPE 5 : Offre Premium ───────────────────────────────────
function StepPremium() {
  const { t } = useTranslation();
  return (
    <View style={styles.step}>
      <Text style={styles.emoji}>⭐</Text>
      <Text style={styles.title}>{t('onboarding.premium.title')}</Text>
      <Text style={styles.subtitle}>{t('onboarding.premium.subtitle')}</Text>
      <View style={styles.premiumCard}>
        {[
          t('onboarding.premium.feature1'),
          t('onboarding.premium.feature2'),
          t('onboarding.premium.feature3'),
          t('onboarding.premium.feature4'),
          t('onboarding.premium.feature5'),
          t('onboarding.premium.feature6'),
        ].map((item) => (
          <Text key={item} style={styles.premiumItem}>{item}</Text>
        ))}
      </View>
      <Text style={styles.premiumNote}>{t('onboarding.premium.note')}</Text>
    </View>
  );
}

// ── STYLES ───────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },

  progressBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    paddingTop: SPACING.md,
    paddingHorizontal: SPACING.xl,
  },
  progressDot: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.surfaceAlt,
  },
  progressDotActive: { backgroundColor: COLORS.primary },

  content: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xl },

  step: { alignItems: 'center', paddingTop: SPACING.xl },
  emoji: { fontSize: 64, marginBottom: SPACING.md },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
    lineHeight: 32,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
    width: '100%',
  },
  optionCard: {
    width: (width - SPACING.lg * 2 - 12) / 2,
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionCardSelected: { borderColor: COLORS.primary, backgroundColor: '#FFF0F3' },
  optionEmoji: { fontSize: 28 },
  optionLabel: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, textAlign: 'center' },
  optionLabelSelected: { color: COLORS.primary },

  levelList: { width: '100%', gap: 12 },
  levelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  levelCardSelected: { borderColor: COLORS.primary, backgroundColor: '#FFF0F3' },
  levelCardInner: { flex: 1 },
  levelName: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  levelNameSelected: { color: COLORS.primary },
  levelDesc: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  radio: {
    width: 22, height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.textMuted,
  },
  radioSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.primary },

  timeGrid: { flexDirection: 'row', gap: 12, width: '100%' },
  timeCard: {
    flex: 1,
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    gap: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  timeCardSelected: { borderColor: COLORS.primary, backgroundColor: '#FFF0F3' },
  timeEmoji: { fontSize: 24 },
  timeMin: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary },
  timeMinSelected: { color: COLORS.primary },
  timeLabel: { fontSize: 11, color: COLORS.textSecondary, textAlign: 'center' },

  featureList: { width: '100%', gap: 20, marginTop: SPACING.sm },
  featureRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 16 },
  featureEmoji: { fontSize: 32, width: 40, textAlign: 'center' },
  featureTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  featureDesc: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },

  premiumCard: {
    width: '100%',
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    gap: 12,
    marginTop: SPACING.sm,
  },
  premiumItem: { fontSize: 15, color: COLORS.textPrimary, fontWeight: '500' },
  premiumNote: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: SPACING.md,
    lineHeight: 18,
  },

  footer: { padding: SPACING.lg, gap: SPACING.sm },
  btn: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.full,
    paddingVertical: 16,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.4 },
  btnText: { color: COLORS.white, fontSize: 17, fontWeight: '800' },
  skipBtn: { alignItems: 'center', paddingVertical: SPACING.sm },
  skipText: { fontSize: 13, color: COLORS.textMuted },
});

// ============================================================
// app/onboarding.tsx
// Onboarding 5 étapes — sans compte obligatoire
// ============================================================

import { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, ScrollView, Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { useUserStore } from '@/store/userStore';
import { COLORS, SPACING, BORDER_RADIUS, ONBOARDING_GOALS, DAILY_GOALS, LEVELS_LABELS } from '@/constants';

const { width } = Dimensions.get('window');

type OnboardingData = {
  goal: string;
  level: string;
  dailyMinutes: number;
};

export default function OnboardingScreen() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<OnboardingData>({
    goal: '',
    level: '',
    dailyMinutes: 10,
  });
  const { setOnboarded, updateUser } = useUserStore();

  const totalSteps = 5;

  const handleNext = () => {
    if (step < totalSteps - 1) {
      setStep(step + 1);
    } else {
      handleFinish();
    }
  };

  const handleFinish = async () => {
    // Créer un utilisateur anonyme local pour démarrer
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
      language: 'fr' as const,
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
    router.replace('/(tabs)');
  };

  const canContinue = () => {
    if (step === 0) return data.goal !== '';
    if (step === 1) return data.level !== '';
    return true;
  };

  return (
    <SafeAreaView style={styles.container}>
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
        {step === 0 && <StepGoal data={data} setData={setData} />}
        {step === 1 && <StepLevel data={data} setData={setData} />}
        {step === 2 && <StepTime data={data} setData={setData} />}
        {step === 3 && <StepDemo />}
        {step === 4 && <StepPremium />}
      </ScrollView>

      {/* Bouton continuer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.btn, !canContinue() && styles.btnDisabled]}
          onPress={handleNext}
          disabled={!canContinue()}
        >
          <Text style={styles.btnText}>
            {step === totalSteps - 1 ? 'Commencer gratuitement →' : 'Continuer →'}
          </Text>
        </TouchableOpacity>

        {step === 4 && (
          <TouchableOpacity onPress={handleFinish} style={styles.skipBtn}>
            <Text style={styles.skipText}>Non merci, continuer gratuitement</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

// ── ÉTAPE 1 : Objectif ───────────────────────────────────────
function StepGoal({ data, setData }: { data: OnboardingData; setData: (d: OnboardingData) => void }) {
  return (
    <View style={styles.step}>
      <Text style={styles.emoji}>🎯</Text>
      <Text style={styles.title}>Pourquoi apprenez-vous{'\n'}le polonais ?</Text>
      <Text style={styles.subtitle}>Nous personnaliserons votre parcours</Text>
      <View style={styles.grid}>
        {ONBOARDING_GOALS.map((goal) => (
          <TouchableOpacity
            key={goal.id}
            style={[styles.optionCard, data.goal === goal.id && styles.optionCardSelected]}
            onPress={() => setData({ ...data, goal: goal.id })}
          >
            <Text style={styles.optionEmoji}>{goal.emoji}</Text>
            <Text style={[styles.optionLabel, data.goal === goal.id && styles.optionLabelSelected]}>
              {goal.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ── ÉTAPE 2 : Niveau ─────────────────────────────────────────
function StepLevel({ data, setData }: { data: OnboardingData; setData: (d: OnboardingData) => void }) {
  return (
    <View style={styles.step}>
      <Text style={styles.emoji}>📊</Text>
      <Text style={styles.title}>Quel est votre niveau{'\n'}en polonais ?</Text>
      <View style={styles.levelList}>
        {LEVELS_LABELS.map((lvl) => (
          <TouchableOpacity
            key={lvl.id}
            style={[styles.levelCard, data.level === lvl.id && styles.levelCardSelected]}
            onPress={() => setData({ ...data, level: lvl.id })}
          >
            <View style={styles.levelCardInner}>
              <Text style={[styles.levelName, data.level === lvl.id && styles.levelNameSelected]}>
                {lvl.label}
              </Text>
              <Text style={styles.levelDesc}>{lvl.description}</Text>
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
  return (
    <View style={styles.step}>
      <Text style={styles.emoji}>⏱️</Text>
      <Text style={styles.title}>Combien de temps par jour ?</Text>
      <Text style={styles.subtitle}>La régularité compte plus que la durée</Text>
      <View style={styles.timeGrid}>
        {DAILY_GOALS.map((goal) => (
          <TouchableOpacity
            key={goal.minutes}
            style={[styles.timeCard, data.dailyMinutes === goal.minutes && styles.timeCardSelected]}
            onPress={() => setData({ ...data, dailyMinutes: goal.minutes })}
          >
            <Text style={styles.timeEmoji}>{goal.emoji}</Text>
            <Text style={[styles.timeMin, data.dailyMinutes === goal.minutes && styles.timeMinSelected]}>
              {goal.minutes} min
            </Text>
            <Text style={styles.timeLabel}>{goal.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ── ÉTAPE 4 : Démo de valeur ──────────────────────────────────
function StepDemo() {
  const features = [
    { emoji: '🎮', title: 'Apprenez en jouant', desc: 'Quiz, flashcards, défis quotidiens' },
    { emoji: '🔊', title: 'Prononciation native', desc: 'Audio par des locuteurs natifs' },
    { emoji: '🔥', title: 'Streak quotidien', desc: 'Restez motivé chaque jour' },
    { emoji: '🧠', title: 'Répétition intelligente', desc: 'L\'algorithme retient ce que vous oubliez' },
  ];
  return (
    <View style={styles.step}>
      <Text style={styles.emoji}>🇵🇱</Text>
      <Text style={styles.title}>Polonais Facile</Text>
      <Text style={styles.subtitle}>La méthode la plus efficace pour les francophones</Text>
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
  return (
    <View style={styles.step}>
      <Text style={styles.emoji}>⭐</Text>
      <Text style={styles.title}>Essayez Premium{'\n'}7 jours gratuits</Text>
      <Text style={styles.subtitle}>Puis 29,99 €/an — annulable à tout moment</Text>
      <View style={styles.premiumCard}>
        {[
          '✅ Accès illimité à tout le contenu',
          '✅ Mode hors ligne complet',
          '✅ Zéro publicité',
          '✅ Dictées et dialogues',
          '✅ Statistiques avancées',
          '✅ Conversation avec l\'IA',
        ].map((item) => (
          <Text key={item} style={styles.premiumItem}>{item}</Text>
        ))}
      </View>
      <Text style={styles.premiumNote}>
        Aucune facturation pendant 7 jours.{'\n'}Annulez avant la fin de l'essai.
      </Text>
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

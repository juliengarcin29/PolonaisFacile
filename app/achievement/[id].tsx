// ============================================================
// app/achievement/[id].tsx
// Détail d'un badge — informations et progression
// ============================================================

import { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, Animated, ScrollView,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useUserStore } from '@/store/userStore';
import { ALL_ACHIEVEMENTS } from '@/hooks/useGamification';
import { getRarityColor } from '@/utils';
import { COLORS, SPACING, BORDER_RADIUS } from '@/constants';

export default function AchievementScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useUserStore();

  const achievement = ALL_ACHIEVEMENTS.find(a => a.id === id);
  const isUnlocked = user?.achievements.includes(id ?? '') ?? false;
  const rarityColor = achievement ? getRarityColor(achievement.rarity) : COLORS.primary;

  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, friction: 5, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  const RARITY_LABELS = {
    common: 'Commun', rare: 'Rare', epic: 'Épique', legendary: 'Légendaire',
  };

  const CONDITION_LABELS: Record<string, string> = {
    streak: 'Jours de série',
    xp: 'XP total',
    lessons: 'Leçons terminées',
    flashcards: 'Flashcards maîtrisées',
    quiz_score: 'Score parfait au quiz',
    modules: 'Modules complétés',
  };

  if (!achievement) {
    return (
      <SafeAreaView style={s.safe}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backTxt}>← Retour</Text>
        </TouchableOpacity>
        <View style={s.notFound}>
          <Text style={s.notFoundTxt}>Badge introuvable</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: rarityColor + '15' }]}>
      <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
        <Text style={[s.backTxt, { color: rarityColor }]}>← Retour</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={s.content}>
        {/* Badge principal */}
        <Animated.View style={[
          s.badgeCircle,
          { borderColor: rarityColor, transform: [{ scale: scaleAnim }] },
          !isUnlocked && s.badgeCircleLocked,
        ]}>
          <Text style={[s.badgeEmoji, !isUnlocked && { opacity: 0.3 }]}>
            {achievement.icon}
          </Text>
          {!isUnlocked && (
            <View style={s.lockOverlay}>
              <Text style={s.lockIcon}>🔒</Text>
            </View>
          )}
        </Animated.View>

        <Animated.View style={[s.infoWrap, { opacity: fadeAnim }]}>
          {/* Statut */}
          <View style={[s.statusBadge, {
            backgroundColor: isUnlocked ? rarityColor + '20' : COLORS.surfaceAlt,
          }]}>
            <Text style={[s.statusTxt, { color: isUnlocked ? rarityColor : COLORS.textMuted }]}>
              {isUnlocked ? '✅ Débloqué' : '🔒 Verrouillé'}
            </Text>
          </View>

          {/* Titre */}
          <Text style={s.title}>{achievement.title}</Text>
          <Text style={s.description}>{achievement.description}</Text>

          {/* Détails */}
          <View style={s.detailsCard}>
            <DetailRow
              label="Rareté"
              value={RARITY_LABELS[achievement.rarity]}
              color={rarityColor}
            />
            <DetailRow
              label="Récompense XP"
              value={`+${achievement.xpReward} XP`}
              color={COLORS.xpGold}
            />
            <DetailRow
              label="Condition"
              value={`${achievement.condition.value} ${CONDITION_LABELS[achievement.condition.type] ?? achievement.condition.type}`}
            />
            {isUnlocked && achievement.unlockedAt && (
              <DetailRow
                label="Débloqué le"
                value={new Date(achievement.unlockedAt).toLocaleDateString('fr-FR')}
                noBorder
              />
            )}
          </View>

          {/* Progression vers ce badge */}
          {!isUnlocked && (
            <View style={s.progressWrap}>
              <Text style={s.progressTitle}>Votre progression :</Text>
              <ConditionProgress achievement={achievement} user={user} rarityColor={rarityColor} />
            </View>
          )}

          {/* Tous les badges de même rareté */}
          <Text style={s.sameRarityTitle}>
            Autres badges {RARITY_LABELS[achievement.rarity].toLowerCase()}s :
          </Text>
          <View style={s.sameRarityList}>
            {ALL_ACHIEVEMENTS
              .filter(a => a.rarity === achievement.rarity && a.id !== achievement.id)
              .slice(0, 4)
              .map(a => (
                <TouchableOpacity
                  key={a.id}
                  style={[s.miniAchievement, {
                    borderColor: user?.achievements.includes(a.id) ? rarityColor + '40' : '#E5E7EB',
                  }]}
                  onPress={() => router.push(`/achievement/${a.id}`)}
                >
                  <Text style={[s.miniEmoji, !user?.achievements.includes(a.id) && { opacity: 0.3 }]}>
                    {a.icon}
                  </Text>
                  <Text style={s.miniTitle} numberOfLines={2}>{a.title}</Text>
                </TouchableOpacity>
              ))}
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailRow({
  label, value, color, noBorder = false,
}: {
  label: string; value: string; color?: string; noBorder?: boolean;
}) {
  return (
    <View style={[dr.row, noBorder && dr.rowNoBorder]}>
      <Text style={dr.label}>{label}</Text>
      <Text style={[dr.value, color ? { color } : {}]}>{value}</Text>
    </View>
  );
}

const dr = StyleSheet.create({
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.surfaceAlt,
  },
  rowNoBorder: { borderBottomWidth: 0 },
  label: { fontSize: 14, color: COLORS.textSecondary },
  value: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
});

function ConditionProgress({
  achievement, user, rarityColor,
}: {
  achievement: typeof ALL_ACHIEVEMENTS[0];
  user: any;
  rarityColor: string;
}) {
  const getCurrentValue = () => {
    switch (achievement.condition.type) {
      case 'streak': return user?.streak ?? 0;
      case 'xp': return user?.xp ?? 0;
      case 'lessons': return user?.progress.totalLessonsCompleted ?? 0;
      case 'flashcards': return user?.progress.masteredFlashcards.length ?? 0;
      default: return 0;
    }
  };

  const current = getCurrentValue();
  const target = achievement.condition.value;
  const percent = Math.min(100, Math.round((current / target) * 100));

  return (
    <View style={cp.wrap}>
      <View style={cp.header}>
        <Text style={cp.current}>{current}</Text>
        <Text style={cp.sep}>/</Text>
        <Text style={cp.target}>{target}</Text>
      </View>
      <View style={cp.track}>
        <View style={[cp.fill, { width: `${percent}%`, backgroundColor: rarityColor }]} />
      </View>
      <Text style={cp.pct}>{percent}% accompli</Text>
    </View>
  );
}

const cp = StyleSheet.create({
  wrap: { gap: 8 },
  header: { flexDirection: 'row', alignItems: 'baseline', gap: 4, justifyContent: 'center' },
  current: { fontSize: 32, fontWeight: '900', color: COLORS.textPrimary },
  sep: { fontSize: 20, color: COLORS.textMuted },
  target: { fontSize: 20, color: COLORS.textMuted },
  track: {
    height: 10, backgroundColor: COLORS.surfaceAlt,
    borderRadius: BORDER_RADIUS.full, overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: BORDER_RADIUS.full },
  pct: { fontSize: 12, color: COLORS.textMuted, textAlign: 'center' },
});

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  backBtn: { padding: SPACING.lg, paddingBottom: 0 },
  backTxt: { fontSize: 15, fontWeight: '600', color: COLORS.primary },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFoundTxt: { fontSize: 16, color: COLORS.textMuted },
  content: { alignItems: 'center', padding: SPACING.xl, gap: SPACING.lg },
  badgeCircle: {
    width: 140, height: 140, borderRadius: 70,
    borderWidth: 5, backgroundColor: COLORS.white,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 12, elevation: 4,
    position: 'relative',
  },
  badgeCircleLocked: { backgroundColor: COLORS.surfaceAlt },
  badgeEmoji: { fontSize: 60 },
  lockOverlay: {
    position: 'absolute', bottom: 0, right: 0,
    backgroundColor: COLORS.white, borderRadius: 20,
    width: 36, height: 36, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: COLORS.surfaceAlt,
  },
  lockIcon: { fontSize: 18 },
  infoWrap: { width: '100%', alignItems: 'center', gap: SPACING.md },
  statusBadge: {
    paddingHorizontal: 16, paddingVertical: 6,
    borderRadius: BORDER_RADIUS.full,
  },
  statusTxt: { fontSize: 14, fontWeight: '700' },
  title: { fontSize: 26, fontWeight: '900', color: COLORS.textPrimary, textAlign: 'center' },
  description: {
    fontSize: 14, color: COLORS.textSecondary,
    textAlign: 'center', lineHeight: 20,
  },
  detailsCard: {
    backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md, width: '100%',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  progressWrap: {
    backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg, width: '100%', gap: 10,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  progressTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  sameRarityTitle: {
    fontSize: 15, fontWeight: '700', color: COLORS.textPrimary,
    alignSelf: 'flex-start',
  },
  sameRarityList: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, width: '100%' },
  miniAchievement: {
    width: '22%', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.sm, borderWidth: 1.5,
  },
  miniEmoji: { fontSize: 28 },
  miniTitle: {
    fontSize: 9, color: COLORS.textMuted,
    textAlign: 'center', fontWeight: '600',
  },
});

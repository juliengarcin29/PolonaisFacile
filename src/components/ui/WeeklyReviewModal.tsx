// ============================================================
// src/components/ui/WeeklyReviewModal.tsx
// Bilan hebdomadaire — modal affiché le lundi matin
// ============================================================

import { useRef, useEffect } from 'react';
import {
  Modal, View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Animated, Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { useWeeklyReview, WeeklyData, WeeklyRecommendation } from '@/hooks/useWeeklyReview';
import { COLORS, SPACING, BORDER_RADIUS } from '@/constants';

const { height: SCREEN_H } = Dimensions.get('window');

interface WeeklyReviewModalProps {
  visible: boolean;
  data: WeeklyData | null;
  recommendations: WeeklyRecommendation[];
  onClose: () => void;
}

export function WeeklyReviewModal({
  visible, data, recommendations, onClose,
}: WeeklyReviewModalProps) {
  const slideAnim = useRef(new Animated.Value(SCREEN_H)).current;
  const bgAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0, friction: 9, tension: 60, useNativeDriver: true,
        }),
        Animated.timing(bgAnim, {
          toValue: 1, duration: 300, useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SCREEN_H, duration: 250, useNativeDriver: true,
        }),
        Animated.timing(bgAnim, {
          toValue: 0, duration: 250, useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!data) return null;

  const avgDailyXP = Math.round(data.xpTotal / 7);
  const grade = data.xpTotal >= 500 ? '🏆'
    : data.xpTotal >= 250 ? '⭐'
    : data.activeDays >= 4 ? '👍'
    : '💪';

  const formatMinutes = (min: number) => {
    if (min < 60) return `${min} min`;
    return `${Math.floor(min / 60)}h${min % 60 > 0 ? ` ${min % 60}min` : ''}`;
  };

  return (
    <Modal visible={visible} transparent animationType="none">
      <Animated.View style={[s.overlay, { opacity: bgAnim }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <Animated.View style={[s.sheet, { transform: [{ translateY: slideAnim }] }]}>
        {/* Handle */}
        <View style={s.handle} />

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={s.header}>
            <Text style={s.headerEmoji}>{grade}</Text>
            <Text style={s.headerTitle}>Bilan de la semaine</Text>
            <Text style={s.headerSub}>
              Semaine du {formatWeekDate(data.weekStart)}
            </Text>
          </View>

          {/* Mini graphique barres */}
          <View style={s.miniChart}>
            {data.dailyXP.map((xp, i) => {
              const maxXP = Math.max(...data.dailyXP, 1);
              const height = Math.max(4, (xp / maxXP) * 60);
              const DAY = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
              return (
                <View key={i} style={s.miniChartCol}>
                  <View style={[s.miniBar, {
                    height,
                    backgroundColor: xp > 0 ? COLORS.primary : COLORS.surfaceAlt,
                    opacity: xp > 0 ? 1 : 0.4,
                  }]} />
                  <Text style={s.miniDayLabel}>{DAY[i]}</Text>
                </View>
              );
            })}
          </View>

          {/* Stats principales */}
          <View style={s.statsGrid}>
            {[
              { label: 'XP gagnés', value: data.xpTotal, emoji: '⭐', color: COLORS.xpGold },
              { label: 'Leçons', value: data.lessonsCompleted, emoji: '📚', color: COLORS.success },
              { label: 'Jours actifs', value: `${data.streakDays}/7`, emoji: '🔥', color: '#FF6B35' },
              { label: 'Temps', value: formatMinutes(data.minutesSpent), emoji: '⏱', color: COLORS.info },
              { label: 'Flashcards', value: data.flashcardsReviewed, emoji: '🃏', color: COLORS.primary },
              { label: 'Quiz', value: data.quizzesCompleted, emoji: '🎯', color: '#8B5CF6' },
            ].map((stat) => (
              <View key={stat.label} style={s.statBox}>
                <Text style={s.statEmoji}>{stat.emoji}</Text>
                <Text style={[s.statVal, { color: stat.color }]}>{stat.value}</Text>
                <Text style={s.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>

          {/* Message motivationnel */}
          <View style={s.motivationBox}>
            <Text style={s.motivationTxt}>
              {getMotivationMessage(data)}
            </Text>
          </View>

          {/* Recommandations */}
          {recommendations.length > 0 && (
            <>
              <Text style={s.recoTitle}>💡 Cette semaine, concentrez-vous sur :</Text>
              {recommendations.map((reco, i) => (
                <TouchableOpacity
                  key={i}
                  style={s.recoCard}
                  onPress={() => {
                    onClose();
                    if (reco.actionRoute) router.push(reco.actionRoute as any);
                  }}
                >
                  <Text style={s.recoEmoji}>{reco.emoji}</Text>
                  <View style={s.recoBody}>
                    <Text style={s.recoTitle2}>{reco.title}</Text>
                    <Text style={s.recoDesc}>{reco.description}</Text>
                  </View>
                  {reco.actionRoute && (
                    <Text style={s.recoArrow}>›</Text>
                  )}
                </TouchableOpacity>
              ))}
            </>
          )}

          {/* Bouton fermer */}
          <TouchableOpacity style={s.closeBtn} onPress={onClose}>
            <Text style={s.closeBtnTxt}>Commencer la nouvelle semaine →</Text>
          </TouchableOpacity>

          <View style={{ height: 32 }} />
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

function formatWeekDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
}

function getMotivationMessage(data: WeeklyData): string {
  if (data.xpTotal >= 500 && data.streakDays >= 5) {
    return '🌟 Semaine exceptionnelle ! Vous êtes dans le top 10% des apprenants. Continuez sur cette lancée !';
  }
  if (data.xpTotal >= 250) {
    return '👏 Belle semaine ! Votre régularité paie. Le polonais commence à rentrer !';
  }
  if (data.streakDays >= 4) {
    return '🔥 Vous avez bien travaillé cette semaine. La constance est la clé de l\'apprentissage !';
  }
  if (data.xpTotal > 0) {
    return '💪 Vous avez commencé la semaine. Essayez d\'être encore plus régulier la semaine prochaine !';
  }
  return '🌱 Nouvelle semaine, nouvelle chance ! Même 5 minutes par jour font une grande différence.';
}

const s = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    maxHeight: SCREEN_H * 0.9,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: COLORS.surfaceAlt,
    alignSelf: 'center', marginBottom: SPACING.lg,
  },
  header: { alignItems: 'center', gap: 6, marginBottom: SPACING.lg },
  headerEmoji: { fontSize: 56 },
  headerTitle: { fontSize: 24, fontWeight: '900', color: COLORS.textPrimary },
  headerSub: { fontSize: 13, color: COLORS.textMuted },

  miniChart: {
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between',
    height: 80, marginBottom: SPACING.lg,
    backgroundColor: COLORS.surfaceAlt, borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
  },
  miniChartCol: { flex: 1, alignItems: 'center', gap: 4, justifyContent: 'flex-end' },
  miniBar: { width: '70%', borderRadius: 3 },
  miniDayLabel: { fontSize: 9, color: COLORS.textMuted, fontWeight: '700' },

  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10,
    marginBottom: SPACING.lg,
  },
  statBox: {
    width: '30%', backgroundColor: COLORS.surfaceAlt,
    borderRadius: BORDER_RADIUS.lg, padding: SPACING.sm,
    alignItems: 'center', gap: 3,
    flexGrow: 1,
  },
  statEmoji: { fontSize: 20 },
  statVal: { fontSize: 20, fontWeight: '900' },
  statLabel: { fontSize: 10, color: COLORS.textMuted, textAlign: 'center', fontWeight: '600' },

  motivationBox: {
    backgroundColor: COLORS.primary + '10',
    borderRadius: BORDER_RADIUS.xl, padding: SPACING.md,
    borderWidth: 1, borderColor: COLORS.primary + '20',
    marginBottom: SPACING.lg,
  },
  motivationTxt: {
    fontSize: 14, color: COLORS.textPrimary,
    lineHeight: 20, textAlign: 'center', fontWeight: '500',
  },

  recoTitle: {
    fontSize: 15, fontWeight: '800', color: COLORS.textPrimary,
    marginBottom: 10,
  },
  recoCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: COLORS.surfaceAlt, borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md, marginBottom: 10,
    borderWidth: 1, borderColor: COLORS.border ?? '#E5E7EB',
  },
  recoEmoji: { fontSize: 28 },
  recoBody: { flex: 1 },
  recoTitle2: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  recoDesc: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2, lineHeight: 16 },
  recoArrow: { fontSize: 22, color: COLORS.textMuted },

  closeBtn: {
    backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.full,
    paddingVertical: 16, alignItems: 'center', marginTop: SPACING.md,
  },
  closeBtnTxt: { color: COLORS.white, fontSize: 16, fontWeight: '800' },
});

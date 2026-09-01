// ============================================================
// src/components/ui/DailyGoalWidget.tsx
// Widget objectif quotidien — affiché sur l'écran d'accueil
// ============================================================

import { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated,
} from 'react-native';
import { useGamification } from '@/hooks/useGamification';
import { useUserStore } from '@/store/userStore';
import { COLORS, SPACING, BORDER_RADIUS } from '@/constants';

export function DailyGoalWidget() {
  const { getDailyProgress } = useGamification();
  const { user } = useUserStore();
  const [progress, setProgress] = useState({ done: 0, goal: 10, percentage: 0 });
  const progressAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    getDailyProgress().then(p => {
      setProgress(p);
      Animated.spring(progressAnim, {
        toValue: p.percentage,
        friction: 8,
        useNativeDriver: false,
      }).start();
    });
  }, []);

  const isCompleted = progress.percentage >= 100;

  const celebrate = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.08, duration: 100, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();
  };

  useEffect(() => {
    if (isCompleted) celebrate();
  }, [isCompleted]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <Animated.View style={[
      dg.container,
      isCompleted && dg.containerCompleted,
      { transform: [{ scale: scaleAnim }] },
    ]}>
      <View style={dg.header}>
        <View style={dg.iconWrap}>
          <Text style={dg.icon}>{isCompleted ? '🎯' : '⏱️'}</Text>
        </View>
        <View style={dg.textWrap}>
          <Text style={dg.title}>
            {isCompleted ? 'Objectif atteint !' : 'Objectif du jour'}
          </Text>
          <Text style={dg.sub}>
            {progress.done} / {progress.goal} minutes · {progress.percentage}%
          </Text>
        </View>
        {isCompleted && (
          <View style={dg.doneBadge}>
            <Text style={dg.doneBadgeTxt}>✓</Text>
          </View>
        )}
      </View>

      {/* Barre de progression */}
      <View style={dg.track}>
        <Animated.View style={[
          dg.fill,
          { width: progressWidth },
          isCompleted && dg.fillCompleted,
        ]} />
      </View>

      {/* Segments quotidiens (7 derniers jours) */}
      <View style={dg.weekRow}>
        {Array.from({ length: 7 }).map((_, i) => {
          const isToday = i === 6;
          const wasActive = i < 5; // Simulé — remplacer par données réelles
          return (
            <View key={i} style={dg.dayWrap}>
              <View style={[
                dg.dayDot,
                wasActive && dg.dayDotActive,
                isToday && dg.dayDotToday,
                isToday && isCompleted && dg.dayDotCompleted,
              ]} />
              <Text style={[dg.dayLabel, isToday && dg.dayLabelToday]}>
                {['L', 'M', 'M', 'J', 'V', 'S', 'A'][i]}
              </Text>
            </View>
          );
        })}
      </View>

      {!isCompleted && (
        <Text style={dg.encouragement}>
          Encore {progress.goal - progress.done} min pour compléter l'objectif
        </Text>
      )}
    </Animated.View>
  );
}

const dg = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md, gap: SPACING.sm,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
    borderWidth: 1, borderColor: COLORS.surfaceAlt,
  },
  containerCompleted: {
    borderColor: COLORS.success + '40',
    backgroundColor: COLORS.successLight + '50',
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: COLORS.primary + '12',
    alignItems: 'center', justifyContent: 'center',
  },
  icon: { fontSize: 20 },
  textWrap: { flex: 1 },
  title: { fontSize: 14, fontWeight: '800', color: COLORS.textPrimary },
  sub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  doneBadge: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: COLORS.success,
    alignItems: 'center', justifyContent: 'center',
  },
  doneBadgeTxt: { fontSize: 14, color: COLORS.white, fontWeight: '800' },
  track: {
    height: 8, backgroundColor: COLORS.surfaceAlt,
    borderRadius: BORDER_RADIUS.full, overflow: 'hidden',
  },
  fill: {
    height: '100%', backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.full,
  },
  fillCompleted: { backgroundColor: COLORS.success },
  weekRow: { flexDirection: 'row', justifyContent: 'space-around' },
  dayWrap: { alignItems: 'center', gap: 4 },
  dayDot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1.5, borderColor: '#D1D5DB',
  },
  dayDotActive: { backgroundColor: COLORS.primary + '60', borderColor: COLORS.primary + '40' },
  dayDotToday: { borderColor: COLORS.primary, backgroundColor: COLORS.white },
  dayDotCompleted: { backgroundColor: COLORS.success, borderColor: COLORS.success },
  dayLabel: { fontSize: 9, color: COLORS.textMuted, fontWeight: '600' },
  dayLabelToday: { color: COLORS.primary, fontWeight: '800' },
  encouragement: { fontSize: 11, color: COLORS.textMuted, textAlign: 'center' },
});

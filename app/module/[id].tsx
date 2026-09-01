// ============================================================
// app/module/[id].tsx
// Vue détaillée d'un module — leçons + progression
// ============================================================

import { useState, useEffect } from 'react';
import {
  ScrollView, View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUserStore } from '@/store/userStore';
import { contentService } from '@/services/firebase/contentService';
import { usePremiumGate } from '@/hooks/usePremiumGate';
import { COLORS, SPACING, BORDER_RADIUS } from '@/constants';
import type { Module, Lesson } from '@/types';

export default function ModuleScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useUserStore();
  const { isPremium } = usePremiumGate();
  const [module, setModule] = useState<Module | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      contentService.getModuleById(id),
      contentService.getLessonsForModule(id)
    ]).then(([mod, ls]) => {
      setModule(mod);
      setLessons(ls);
      setIsLoading(false);
    });
  }, [id]);

  const completedIds = user?.progress.completedLessons ?? [];
  const completedCount = lessons.filter(l => completedIds.includes(l.id)).length;
  const progress = lessons.length > 0
    ? Math.round((completedCount / lessons.length) * 100)
    : 0;

  if (isLoading) {
    return (
      <SafeAreaView style={m.safe}>
        <ActivityIndicator color={COLORS.primary} style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  return (
    <View style={m.safe}>
      <View style={[m.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={m.backBtn}>
          <Text style={m.backTxt}>← Retour</Text>
        </TouchableOpacity>
        <Text style={m.headerTitle}>{module?.title ?? 'Module'}</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
        {/* Info module */}
        <View style={m.moduleInfo}>
          <View style={m.progressWrap}>
            <Text style={m.progressLabel}>Progression : {progress}%</Text>
            <View style={m.progressTrack}>
              <View style={[m.progressFill, { width: `${progress}%` }]} />
            </View>
            <Text style={m.progressSub}>{completedCount}/{lessons.length} leçons</Text>
          </View>
        </View>

        {/* Liste des leçons */}
        <View style={m.lessonsList}>
          {lessons.map((lesson, idx) => {
            const isCompleted = completedIds.includes(lesson.id);
            const isLocked = lesson.isPremium && !isPremium;
            const isNext = !isCompleted && idx === completedCount;

            return (
              <TouchableOpacity
                key={lesson.id}
                style={[
                  m.lessonRow,
                  isCompleted && m.lessonRowCompleted,
                  isNext && m.lessonRowNext,
                  isLocked && m.lessonRowLocked,
                ]}
                onPress={() => {
                  if (isLocked) router.push('/paywall?reason=lesson');
                  else router.push(`/lesson/${lesson.id}`);
                }}
                activeOpacity={0.8}
              >
                <View style={[m.lessonNum, isCompleted && m.lessonNumCompleted]}>
                  <Text style={[m.lessonNumTxt, isCompleted && m.lessonNumTxtCompleted]}>
                    {isCompleted ? '✓' : String(idx + 1)}
                  </Text>
                </View>
                <View style={m.lessonBody}>
                  <Text style={[m.lessonTitle, isLocked && { opacity: 0.5 }]}>
                    {lesson.title}
                  </Text>
                  <Text style={m.lessonMeta}>
                    ⏱ {lesson.estimatedMinutes} min · ⭐ {lesson.xpReward} XP · {lesson.difficulty}
                  </Text>
                </View>
                {isLocked
                  ? <Text style={m.lockIcon}>🔒</Text>
                  : isNext
                  ? <View style={m.nextBadge}><Text style={m.nextBadgeTxt}>Suivant</Text></View>
                  : <Text style={m.arrowIcon}>›</Text>
                }
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}


const m = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg, paddingBottom: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1, borderBottomColor: COLORS.surfaceAlt,
  },
  backBtn: { paddingVertical: 8 },
  backTxt: { fontSize: 15, color: COLORS.primary, fontWeight: '600' },
  headerTitle: { fontSize: 17, fontWeight: '800', color: COLORS.textPrimary },
  moduleInfo: {
    backgroundColor: COLORS.white, margin: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl, padding: SPACING.lg,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  progressWrap: { gap: 6 },
  progressLabel: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  progressTrack: {
    height: 8, backgroundColor: COLORS.surfaceAlt,
    borderRadius: BORDER_RADIUS.full, overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.full },
  progressSub: { fontSize: 11, color: COLORS.textMuted },
  lessonsList: { paddingHorizontal: SPACING.lg, gap: 10 },
  lessonRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.xl, padding: SPACING.md,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
    borderWidth: 1.5, borderColor: 'transparent',
  },
  lessonRowCompleted: { borderColor: COLORS.success + '30', backgroundColor: COLORS.successLight + '20' },
  lessonRowNext: { borderColor: COLORS.primary, shadowColor: COLORS.primary, shadowOpacity: 0.15 },
  lessonRowLocked: { opacity: 0.65 },
  lessonNum: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.surfaceAlt, borderWidth: 2, borderColor: '#E5E7EB',
    alignItems: 'center', justifyContent: 'center',
  },
  lessonNumCompleted: { backgroundColor: COLORS.success, borderColor: COLORS.success },
  lessonNumTxt: { fontSize: 13, fontWeight: '800', color: COLORS.textMuted },
  lessonNumTxtCompleted: { color: COLORS.white },
  lessonBody: { flex: 1 },
  lessonTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  lessonMeta: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  lockIcon: { fontSize: 18, opacity: 0.5 },
  arrowIcon: { fontSize: 22, color: COLORS.textMuted },
  nextBadge: {
    backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  nextBadgeTxt: { fontSize: 10, fontWeight: '800', color: COLORS.white },
});

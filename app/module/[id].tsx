// ============================================================
// app/module/[id].tsx
// Vue détaillée d'un module — leçons + progression
// ============================================================

import { useState, useEffect } from 'react';
import {
  ScrollView, View, Text, StyleSheet as S2, TouchableOpacity as TO2,
  SafeAreaView as SA2, ActivityIndicator,
} from 'react-native';
import { router as r2, useLocalSearchParams as ulsp2 } from 'expo-router';
import { useUserStore } from '@/store/userStore';
import { contentService } from '@/services/firebase/contentService';
import { usePremiumGate } from '@/hooks/usePremiumGate';
import { COLORS as C2, SPACING as SP2, BORDER_RADIUS as BR2 } from '@/constants';
import type { Module, Lesson } from '@/types';

export default function ModuleScreen() {
  const { id } = ulsp2<{ id: string }>();
  const { user } = useUserStore();
  const { isPremium } = usePremiumGate();
  const [module, setModule] = useState<Module | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    contentService.getLessonsForModule(id).then(ls => {
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
      <SA2 style={m.safe}>
        <ActivityIndicator color={C2.primary} style={{ flex: 1 }} />
      </SA2>
    );
  }

  return (
    <SA2 style={m.safe}>
      <View style={m.header}>
        <TO2 onPress={() => r2.back()}>
          <Text style={m.backTxt}>← Retour</Text>
        </TO2>
        <Text style={m.headerTitle}>Module</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
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
              <TO2
                key={lesson.id}
                style={[
                  m.lessonRow,
                  isCompleted && m.lessonRowCompleted,
                  isNext && m.lessonRowNext,
                  isLocked && m.lessonRowLocked,
                ]}
                onPress={() => {
                  if (isLocked) r2.push('/paywall?reason=lesson');
                  else r2.push(`/lesson/${lesson.id}`);
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
              </TO2>
            );
          })}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SA2>
  );
}


const m = S2.create({
  safe: { flex: 1, backgroundColor: C2.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: SP2.lg, backgroundColor: C2.white,
    borderBottomWidth: 1, borderBottomColor: C2.surfaceAlt,
  },
  backTxt: { fontSize: 15, color: C2.primary, fontWeight: '600' },
  headerTitle: { fontSize: 17, fontWeight: '800', color: C2.textPrimary },
  moduleInfo: {
    backgroundColor: C2.white, margin: SP2.lg,
    borderRadius: BR2.xl, padding: SP2.lg,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  progressWrap: { gap: 6 },
  progressLabel: { fontSize: 14, fontWeight: '700', color: C2.textPrimary },
  progressTrack: {
    height: 8, backgroundColor: C2.surfaceAlt,
    borderRadius: BR2.full, overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: C2.primary, borderRadius: BR2.full },
  progressSub: { fontSize: 11, color: C2.textMuted },
  lessonsList: { paddingHorizontal: SP2.lg, gap: 10 },
  lessonRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: C2.white, borderRadius: BR2.xl, padding: SP2.md,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
    borderWidth: 1.5, borderColor: 'transparent',
  },
  lessonRowCompleted: { borderColor: C2.success + '30', backgroundColor: C2.successLight + '20' },
  lessonRowNext: { borderColor: C2.primary, shadowColor: C2.primary, shadowOpacity: 0.15 },
  lessonRowLocked: { opacity: 0.65 },
  lessonNum: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: C2.surfaceAlt, borderWidth: 2, borderColor: '#E5E7EB',
    alignItems: 'center', justifyContent: 'center',
  },
  lessonNumCompleted: { backgroundColor: C2.success, borderColor: C2.success },
  lessonNumTxt: { fontSize: 13, fontWeight: '800', color: C2.textMuted },
  lessonNumTxtCompleted: { color: C2.white },
  lessonBody: { flex: 1 },
  lessonTitle: { fontSize: 14, fontWeight: '700', color: C2.textPrimary },
  lessonMeta: { fontSize: 11, color: C2.textMuted, marginTop: 2 },
  lockIcon: { fontSize: 18, opacity: 0.5 },
  arrowIcon: { fontSize: 22, color: C2.textMuted },
  nextBadge: {
    backgroundColor: C2.primary, borderRadius: BR2.full,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  nextBadgeTxt: { fontSize: 10, fontWeight: '800', color: C2.white },
});

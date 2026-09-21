import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { COLORS, BORDER_RADIUS, SPACING } from '@/constants';
import type { Exercise } from '@/types';

interface MatchingExerciseProps {
  exercise: Exercise;
  matchSelected: { left?: string; right?: string };
  setMatchSelected: (v: { left?: string; right?: string }) => void;
  matchedPairs: string[];
  setMatchedPairs: (v: string[]) => void;
  onComplete: () => void;
}

export default function MatchingExercise({
  exercise,
  matchSelected,
  setMatchSelected,
  matchedPairs,
  setMatchedPairs,
  onComplete,
}: MatchingExerciseProps) {
  const { t } = useTranslation();
  const pairs = exercise.pairs ?? [];

  const handleLeft = (item: string) => {
    if (matchedPairs.includes(item)) return;
    const newSelected = { ...matchSelected, left: item };
    setMatchSelected(newSelected);
    tryMatch(newSelected);
  };

  const handleRight = (item: string) => {
    if (matchedPairs.some(p => p === item)) return;
    const newSelected = { ...matchSelected, right: item };
    setMatchSelected(newSelected);
    tryMatch(newSelected);
  };

  const tryMatch = (sel: { left?: string; right?: string }) => {
    if (!sel.left || !sel.right) return;
    const pair = pairs.find(p => p.left === sel.left && p.right === sel.right);
    if (pair) {
      const newMatched = [...matchedPairs, sel.left, sel.right];
      setMatchedPairs(newMatched);
      setMatchSelected({});
      if (newMatched.length === pairs.length * 2) {
        setTimeout(onComplete, 400);
      }
    } else {
      setMatchSelected({});
    }
  };

  // Note: Dans le code original, rights est trié aléatoirement à chaque rendu.
  // Nous gardons ce comportement pour l'instant pour garantir une identité parfaite.
  const lefts = useMemo(() => pairs.map(p => p.left), [exercise.id]);
  const rights = useMemo(() => {
    return pairs.map(p => p.right).sort(() => Math.random() - 0.5);
  }, [exercise.id]);

  return (
    <View style={mat.container}>
      <View style={mat.columns}>
        <View style={mat.col}>
          {lefts.map((item, i) => {
            const matched = matchedPairs.includes(item);
            const selected = matchSelected.left === item;
            return (
              <TouchableOpacity
                key={`left_${item}_${i}`}
                style={[mat.chip, selected && mat.chipSelected, matched && mat.chipMatched]}
                onPress={() => handleLeft(item)}
                disabled={matched}
              >
                <Text style={[mat.chipText, matched && mat.chipTextMatched]}>{item}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <View style={mat.col}>
          {rights.map((item, i) => {
            const matched = matchedPairs.includes(item);
            const selected = matchSelected.right === item;
            return (
              <TouchableOpacity
                key={`right_${item}_${i}`}
                style={[mat.chip, selected && mat.chipSelected, matched && mat.chipMatched]}
                onPress={() => handleRight(item)}
                disabled={matched}
              >
                <Text style={[mat.chipText, matched && mat.chipTextMatched]}>{item}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
      <Text style={mat.hint}>{t('lesson.exercises.matching_hint')}</Text>
    </View>
  );
}

const mat = StyleSheet.create({
  container: { marginTop: SPACING.lg },
  columns: { flexDirection: 'row', gap: 12 },
  col: { flex: 1, gap: 10 },
  chip: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    minHeight: 52,
    ...Platform.select({
      web: { boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)' } as any,
      default: { shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
    }),
  },
  chipSelected: { borderColor: COLORS.primary, backgroundColor: '#FFF0F3' },
  chipMatched: { borderColor: COLORS.success, backgroundColor: COLORS.successLight },
  chipText: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, textAlign: 'center' },
  chipTextMatched: { color: COLORS.success },
  hint: { fontSize: 12, color: COLORS.textMuted, textAlign: 'center', marginTop: SPACING.md },
});

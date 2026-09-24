import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { triggerHapticImpact } from '@/utils/haptics';
import { ScaleButton } from '@/components/ui/ScaleButton';
import { COLORS, BORDER_RADIUS, SPACING } from '@/constants';
import type { Exercise } from '@/types';

// Phase de la leçon nécessaire pour adapter l'affichage
type LessonPhase = 'loading' | 'error' | 'exercise' | 'feedback_correct' | 'feedback_wrong' | 'completed';

interface WordOrderExerciseProps {
  exercise: Exercise;
  wordOrderAnswer: string[];
  setWordOrderAnswer: (v: string[]) => void;
  availableWords: string[];
  setAvailableWords: (v: string[]) => void;
  onSubmit: (answer: string) => void;
  phase: LessonPhase;
  requiredCount?: number; // Nombre de mots requis pour valider (optionnel)
}

export default function WordOrderExercise({
  exercise,
  wordOrderAnswer,
  setWordOrderAnswer,
  availableWords,
  setAvailableWords,
  onSubmit,
  phase,
  requiredCount,
}: WordOrderExerciseProps) {
  const { t } = useTranslation();

  // Par défaut, on attend tous les mots de l'exercice si requiredCount n'est pas fourni
  const targetCount = requiredCount ?? (exercise.words?.length ?? 0);
  const isMaxReached = wordOrderAnswer.length >= targetCount;

  const addWord = (word: string, index: number) => {
    if (phase !== 'exercise' || isMaxReached) return;
    triggerHapticImpact();
    setWordOrderAnswer([...wordOrderAnswer, word]);
    setAvailableWords(availableWords.filter((_, i) => i !== index));
  };

  const removeWord = (index: number) => {
    if (phase !== 'exercise') return;
    triggerHapticImpact();
    const word = wordOrderAnswer[index];
    setAvailableWords([...availableWords, word]);
    setWordOrderAnswer(wordOrderAnswer.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    triggerHapticImpact();
    onSubmit(wordOrderAnswer.join(' '));
  };

  return (
    <View style={wo.container}>
      {/* Zone de réponse */}
      <View style={wo.answerZone}>
        {wordOrderAnswer.length === 0 ? (
          <Text style={wo.placeholder}>{t('lesson.exercises.word_order_placeholder')}</Text>
        ) : (
          <View style={wo.wordRow}>
            {wordOrderAnswer.map((word, i) => (
              <ScaleButton
                key={`ans_${word}_${i}`}
                style={wo.wordChipAnswer}
                onPress={() => removeWord(i)}
                disabled={phase !== 'exercise'}
              >
                <Text style={wo.wordChipAnswerText}>{word}</Text>
              </ScaleButton>
            ))}
          </View>
        )}
      </View>

      {/* Mots disponibles */}
      <View style={wo.wordBank}>
        {availableWords.map((word, i) => {
          const isBankDisabled = phase !== 'exercise' || isMaxReached;
          return (
            <ScaleButton
              key={`avail_${word}_${i}`}
              style={[wo.wordChip, isBankDisabled && wo.wordChipDisabled]}
              onPress={() => addWord(word, i)}
              disabled={isBankDisabled}
            >
              <Text style={[wo.wordChipText, isBankDisabled && wo.wordChipTextDisabled]}>{word}</Text>
            </ScaleButton>
          );
        })}
      </View>

      {/* Bouton valider */}
      {wordOrderAnswer.length === targetCount && phase === 'exercise' && (
        <ScaleButton style={wo.submitBtn} onPress={handleSubmit}>
          <Text style={wo.submitBtnText}>{t('lesson.exercises.word_order_verify')}</Text>
        </ScaleButton>
      )}
    </View>
  );
}

const wo = StyleSheet.create({
  container: { marginTop: SPACING.lg },
  answerZone: {
    minHeight: 64, backgroundColor: COLORS.surfaceAlt,
    borderRadius: BORDER_RADIUS.lg, padding: SPACING.md,
    borderWidth: 2, borderColor: '#E5E7EB', borderStyle: 'dashed',
    marginBottom: SPACING.lg, justifyContent: 'center',
  },
  placeholder: { color: COLORS.textMuted, fontSize: 14, textAlign: 'center' },
  wordRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  wordChipAnswer: {
    backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  wordChipAnswerText: { color: COLORS.white, fontSize: 15, fontWeight: '700' },
  wordBank: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: SPACING.lg },
  wordChip: {
    backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: 16, paddingVertical: 10,
    borderWidth: 2, borderColor: '#E5E7EB',
    ...Platform.select({
      web: { boxShadow: '0px 2px 3px rgba(0, 0, 0, 0.05)' } as any,
      default: { shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
    }),
  },
  wordChipDisabled: {
    opacity: 0.4,
    backgroundColor: COLORS.surfaceAlt,
  },
  wordChipText: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  wordChipTextDisabled: {
    color: COLORS.textMuted,
  },
  submitBtn: {
    backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.full,
    paddingVertical: 14, alignItems: 'center',
  },
  submitBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '800' },
});

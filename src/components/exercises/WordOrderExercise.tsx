import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
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
  requiredCount?: number; // Nouveau : nombre de mots requis pour valider (optionnel)
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
  const addWord = (word: string, index: number) => {
    if (phase !== 'exercise') return;
    setWordOrderAnswer([...wordOrderAnswer, word]);
    setAvailableWords(availableWords.filter((_, i) => i !== index));
  };

  const removeWord = (index: number) => {
    if (phase !== 'exercise') return;
    const word = wordOrderAnswer[index];
    setAvailableWords([...availableWords, word]);
    setWordOrderAnswer(wordOrderAnswer.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    onSubmit(wordOrderAnswer.join(' '));
  };

  // Par défaut, on attend tous les mots de l'exercice si requiredCount n'est pas fourni
  const targetCount = requiredCount ?? (exercise.words?.length ?? 0);

  return (
    <View style={wo.container}>
      {/* Zone de réponse */}
      <View style={wo.answerZone}>
        {wordOrderAnswer.length === 0 ? (
          <Text style={wo.placeholder}>Placez les mots ici</Text>
        ) : (
          <View style={wo.wordRow}>
            {wordOrderAnswer.map((word, i) => (
              <TouchableOpacity key={`ans_${word}_${i}`} style={wo.wordChipAnswer} onPress={() => removeWord(i)}>
                <Text style={wo.wordChipAnswerText}>{word}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Mots disponibles */}
      <View style={wo.wordBank}>
        {availableWords.map((word, i) => (
          <TouchableOpacity key={`avail_${word}_${i}`} style={wo.wordChip} onPress={() => addWord(word, i)}>
            <Text style={wo.wordChipText}>{word}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Bouton valider */}
      {wordOrderAnswer.length === targetCount && phase === 'exercise' && (
        <TouchableOpacity style={wo.submitBtn} onPress={handleSubmit}>
          <Text style={wo.submitBtnText}>Vérifier →</Text>
        </TouchableOpacity>
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
  wordChipText: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  submitBtn: {
    backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.full,
    paddingVertical: 14, alignItems: 'center',
  },
  submitBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '800' },
});

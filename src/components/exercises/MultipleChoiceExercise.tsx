import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { triggerHapticImpact } from '@/utils/haptics';
import { useFlashcardAudio } from '@/hooks/useAudio';
import { getAudioUrl } from '@/utils/media';
import { ScaleButton } from '@/components/ui/ScaleButton';
import { COLORS, BORDER_RADIUS, SPACING } from '@/constants';
import type { Exercise } from '@/types';

// Phase de la leçon nécessaire pour adapter l'affichage
type LessonPhase = 'loading' | 'error' | 'exercise' | 'feedback_correct' | 'feedback_wrong' | 'completed';

interface MultipleChoiceExerciseProps {
  exercise: Exercise;
  selectedAnswer: string;
  phase: LessonPhase;
  onAnswer: (answer: string) => void;
}

export default function MultipleChoiceExercise({
  exercise,
  selectedAnswer,
  phase,
  onAnswer,
}: MultipleChoiceExerciseProps) {
  const { t } = useTranslation();
  const options = exercise.options ?? [];
  const { isPlaying, playCard } = useFlashcardAudio();

  const handlePlayPrompt = () => {
    if (!exercise.audioText) {
      console.warn('[Audio] Missing audioText for isAudioPrompt exercise:', exercise.id);
      return;
    }
    const targetKey = exercise.audioKey ?? exercise.id;
    const audioUrl = exercise.audioUrl || getAudioUrl(targetKey);
    playCard(audioUrl, exercise.audioText);
  };

  return (
    <View style={mc.container}>
      {/* Mode Écoute : Bouton d'action audio principal (sur clic uniquement) */}
      {exercise.isAudioPrompt && (
        <TouchableOpacity style={mc.audioPromptBtn} onPress={handlePlayPrompt}>
          <Text style={mc.audioPromptBtnTxt}>
            {isPlaying ? t('lesson.exercises.playing_audio') : t('lesson.exercises.play_audio')}
          </Text>
        </TouchableOpacity>
      )}

      {options.map((option, index) => {
        const isSelected = selectedAnswer === option;
        const isCorrect = option === exercise.correctAnswer;
        const showResult = phase !== 'exercise';

        let bgColor = COLORS.white;
        let borderColor = COLORS.surfaceAlt;
        let textColor = COLORS.textPrimary;

        if (showResult && isCorrect) {
          bgColor = COLORS.successLight;
          borderColor = COLORS.success;
          textColor = COLORS.success;
        } else if (showResult && isSelected && !isCorrect) {
          bgColor = COLORS.errorLight;
          borderColor = COLORS.error;
          textColor = COLORS.error;
        } else if (isSelected) {
          borderColor = COLORS.primary;
        }

        return (
          <ScaleButton
            key={`${option}_${index}`}
            style={[mc.option, { backgroundColor: bgColor, borderColor }]}
            onPress={() => {
              if (phase === 'exercise') {
                triggerHapticImpact();
                onAnswer(option);
              }
            }}
            disabled={phase !== 'exercise'}
          >
            <Text style={[mc.optionText, { color: textColor }]}>{option}</Text>
            {showResult && isCorrect && <Text style={mc.tick}>✓</Text>}
            {showResult && isSelected && !isCorrect && <Text style={mc.cross}>✗</Text>}
          </ScaleButton>
        );
      })}
    </View>
  );
}

const mc = StyleSheet.create({
  container: { gap: 12, marginTop: SPACING.lg },
  audioPromptBtn: {
    backgroundColor: COLORS.primary + '15',
    paddingVertical: 14,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    alignItems: 'center',
    marginBottom: SPACING.md,
    borderWidth: 1.5,
    borderColor: COLORS.primary + '30',
  },
  audioPromptBtnTxt: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    ...Platform.select({
      web: { boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.04)' } as any,
      default: { shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
    }),
  },
  optionText: { fontSize: 16, fontWeight: '600', flex: 1 },
  tick: { fontSize: 18, color: COLORS.success },
  cross: { fontSize: 18, color: COLORS.error },
});

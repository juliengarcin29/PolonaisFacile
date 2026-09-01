// ============================================================
// src/hooks/useLesson.ts
// Hook complet de gestion d'une leçon
// ============================================================

import { useState, useRef, useCallback, useEffect } from 'react';
import { useUserStore } from '@/store/userStore';
import { useGamification } from '@/hooks/useGamification';
import { useWeeklyReview } from '@/hooks/useWeeklyReview';
import { comparePl } from '@/utils';
import { GAMIFICATION_CONFIG } from '@/config/appConfig';
import type { Exercise, ExerciseAnswer, ExerciseState } from '@/types';

type LessonPhase = 'exercise' | 'feedback_correct' | 'feedback_wrong' | 'completed';

interface UseLessonOptions {
  lessonId: string;
  exercises: Exercise[];
  onComplete?: (result: LessonResult) => void;
}

export interface LessonResult {
  lessonId: string;
  score: number;
  totalExercises: number;
  correctCount: number;
  xpEarned: number;
  isPerfect: boolean;
  timeSpent: number;
  answers: ExerciseAnswer[];
}

export function useLesson({ lessonId, exercises, onComplete }: UseLessonOptions) {
  const { user, loseHeart } = useUserStore();
  const { completeLesson, awardExerciseXP } = useGamification();
  const { updateTodayData } = useWeeklyReview();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<LessonPhase>('exercise');
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [isCorrect, setIsCorrect] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [answers, setAnswers] = useState<ExerciseAnswer[]>([]);
  const [lives, setLives] = useState(user?.hearts ?? 5);

  const startTimeRef = useRef(Date.now());
  const exerciseStartRef = useRef(Date.now());

  const current = exercises[currentIndex];
  const progress = exercises.length > 0
    ? ((currentIndex) / exercises.length) * 100
    : 0;
  const isLastExercise = currentIndex >= exercises.length - 1;

  // ── Vérifier la réponse ──────────────────────────────────
  const checkAnswer = useCallback((answer: string) => {
    if (phase !== 'exercise' || !current) return;

    const timeSpent = Math.round((Date.now() - exerciseStartRef.current) / 1000);
    const { isCorrect: correct } = comparePl(answer, current.correctAnswer);

    const answerRecord: ExerciseAnswer = {
      exerciseId: current.id,
      userAnswer: answer,
      correctAnswer: current.correctAnswer,
      isCorrect: correct,
      timeSpent,
    };

    setSelectedAnswer(answer);
    setIsCorrect(correct);
    setAnswers(prev => [...prev, answerRecord]);

    if (correct) {
      const xp = current.xpReward ?? GAMIFICATION_CONFIG.XP_PER_EXERCISE;
      setXpEarned(prev => prev + xp);
      setCorrectCount(prev => prev + 1);
      setPhase('feedback_correct');
      awardExerciseXP(true);
    } else {
      setLives(prev => {
        const newLives = Math.max(0, prev - 1);
        loseHeart();
        return newLives;
      });
      setPhase('feedback_wrong');
    }

    exerciseStartRef.current = Date.now();
  }, [phase, current, awardExerciseXP, loseHeart]);

  // ── Passer à l'exercice suivant ──────────────────────────
  const nextExercise = useCallback(async () => {
    setSelectedAnswer('');

    if (isLastExercise) {
      const timeSpent = Math.round((Date.now() - startTimeRef.current) / 1000);
      const isPerfect = correctCount + (isCorrect ? 1 : 0) === exercises.length;
      const finalXP = isPerfect
        ? xpEarned + GAMIFICATION_CONFIG.XP_PER_PERFECT_LESSON
        : xpEarned;

      const result: LessonResult = {
        lessonId,
        score: Math.round((correctCount / exercises.length) * 100),
        totalExercises: exercises.length,
        correctCount,
        xpEarned: finalXP,
        isPerfect,
        timeSpent,
        answers,
      };

      await completeLesson(lessonId, correctCount, exercises.length, timeSpent);
      await updateTodayData({
        xpGained: finalXP,
        lessonCompleted: true,
        minutesSpent: Math.round(timeSpent / 60),
      });

      setPhase('completed');
      onComplete?.(result);
    } else {
      setCurrentIndex(prev => prev + 1);
      setPhase('exercise');
    }
  }, [isLastExercise, correctCount, isCorrect, exercises.length, xpEarned,
      lessonId, answers, completeLesson, updateTodayData, onComplete]);

  // ── Ignorer une question (passer sans répondre) ──────────
  const skipExercise = useCallback(() => {
    if (!current) return;
    const skipped: ExerciseAnswer = {
      exerciseId: current.id,
      userAnswer: '',
      correctAnswer: current.correctAnswer,
      isCorrect: false,
      timeSpent: 0,
    };
    setAnswers(prev => [...prev, skipped]);
    setIsCorrect(false);
    setPhase('feedback_wrong');
  }, [current]);

  // ── Recommencer la leçon ─────────────────────────────────
  const restart = useCallback(() => {
    setCurrentIndex(0);
    setPhase('exercise');
    setSelectedAnswer('');
    setXpEarned(0);
    setCorrectCount(0);
    setAnswers([]);
    setLives(user?.hearts ?? 5);
    startTimeRef.current = Date.now();
    exerciseStartRef.current = Date.now();
  }, [user?.hearts]);

  return {
    current,
    currentIndex,
    phase,
    progress,
    selectedAnswer,
    isCorrect,
    xpEarned,
    correctCount,
    answers,
    lives,
    isLastExercise,
    totalExercises: exercises.length,
    checkAnswer,
    nextExercise,
    skipExercise,
    restart,
    isCompleted: phase === 'completed',
  };
}

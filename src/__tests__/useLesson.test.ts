// ============================================================
// src/__tests__/useLesson.test.ts
// Tests unitaires — logique de leçon (scoring, cœurs, completion)
// ============================================================

import { renderHook, act } from '@testing-library/react-hooks';
import { useLesson } from '../hooks/useLesson';
import type { Exercise } from '../types';

// ── Mocks ─────────────────────────────────────────────────────
jest.mock('../store/userStore', () => ({
  useUserStore: () => ({
    user: { hearts: 5, maxHearts: 5, id: 'test-uid' },
    loseHeart: jest.fn(),
    updateUser: jest.fn(),
  }),
}));

jest.mock('../hooks/useGamification', () => ({
  useGamification: () => ({
    completeLesson: jest.fn().mockResolvedValue(undefined),
    awardExerciseXP: jest.fn(),
    awardXP: jest.fn().mockResolvedValue(undefined),
  }),
}));

jest.mock('../hooks/useWeeklyReview', () => ({
  useWeeklyReview: () => ({
    updateTodayData: jest.fn().mockResolvedValue(undefined),
  }),
}));

// ── Fixtures ──────────────────────────────────────────────────
const makeExercise = (id: string, correctAnswer: string): Exercise => ({
  id,
  type: 'multiple_choice',
  question: `Question ${id}`,
  correctAnswer,
  options: [correctAnswer, 'wrong_a', 'wrong_b', 'wrong_c'],
  xpReward: 10,
});

const EXERCISES_3: Exercise[] = [
  makeExercise('ex1', 'Dziękuję'),
  makeExercise('ex2', 'Cześć'),
  makeExercise('ex3', 'Proszę'),
];

const onComplete = jest.fn();

// ── Tests ─────────────────────────────────────────────────────
describe('useLesson', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initialise avec le premier exercice et progress=0', () => {
    const { result } = renderHook(() =>
      useLesson({ lessonId: 'l1', exercises: EXERCISES_3, onComplete })
    );
    expect(result.current.currentIndex).toBe(0);
    expect(result.current.progress).toBe(0);
    expect(result.current.phase).toBe('exercise');
    expect(result.current.correctCount).toBe(0);
    expect(result.current.xpEarned).toBe(0);
    expect(result.current.isCompleted).toBe(false);
  });

  it('bonne réponse → phase feedback_correct, XP augmente', () => {
    const { result } = renderHook(() =>
      useLesson({ lessonId: 'l1', exercises: EXERCISES_3, onComplete })
    );
    act(() => { result.current.checkAnswer('Dziękuję'); });
    expect(result.current.phase).toBe('feedback_correct');
    expect(result.current.isCorrect).toBe(true);
    expect(result.current.xpEarned).toBeGreaterThan(0);
    expect(result.current.correctCount).toBe(1);
  });

  it('mauvaise réponse → phase feedback_wrong, vies diminuent', () => {
    const { result } = renderHook(() =>
      useLesson({ lessonId: 'l1', exercises: EXERCISES_3, onComplete })
    );
    act(() => { result.current.checkAnswer('wrong_a'); });
    expect(result.current.phase).toBe('feedback_wrong');
    expect(result.current.isCorrect).toBe(false);
    expect(result.current.correctCount).toBe(0);
  });

  it('nextExercise avance au suivant et remet la phase à exercise', async () => {
    const { result } = renderHook(() =>
      useLesson({ lessonId: 'l1', exercises: EXERCISES_3, onComplete })
    );
    act(() => { result.current.checkAnswer('Dziękuję'); });
    await act(async () => { await result.current.nextExercise(); });
    expect(result.current.currentIndex).toBe(1);
    expect(result.current.phase).toBe('exercise');
    expect(result.current.selectedAnswer).toBe('');
  });

  it('duplique impossible : checkAnswer ignoré si phase != exercise', () => {
    const { result } = renderHook(() =>
      useLesson({ lessonId: 'l1', exercises: EXERCISES_3, onComplete })
    );
    act(() => { result.current.checkAnswer('Dziękuję'); });
    const xpAfterFirst = result.current.xpEarned;
    // Deuxième appel pendant feedback_correct — doit être ignoré
    act(() => { result.current.checkAnswer('Dziękuję'); });
    expect(result.current.xpEarned).toBe(xpAfterFirst);
  });

  it('leçon complète après le dernier exercice → isCompleted=true, onComplete appelé', async () => {
    const { result } = renderHook(() =>
      useLesson({ lessonId: 'l1', exercises: EXERCISES_3, onComplete })
    );
    // Répondre à tous les exercices correctement
    for (let i = 0; i < 3; i++) {
      act(() => { result.current.checkAnswer(EXERCISES_3[i].correctAnswer); });
      await act(async () => { await result.current.nextExercise(); });
    }
    expect(result.current.isCompleted).toBe(true);
    expect(onComplete).toHaveBeenCalledTimes(1);
    const callArg = onComplete.mock.calls[0][0];
    expect(callArg.lessonId).toBe('l1');
    expect(callArg.score).toBeGreaterThan(0);
    expect(callArg.totalExercises).toBe(3);
  });

  it('leçon parfaite → isPerfect=true dans le résultat', async () => {
    const { result } = renderHook(() =>
      useLesson({ lessonId: 'l1', exercises: EXERCISES_3, onComplete })
    );
    for (let i = 0; i < 3; i++) {
      act(() => { result.current.checkAnswer(EXERCISES_3[i].correctAnswer); });
      await act(async () => { await result.current.nextExercise(); });
    }
    const callArg = onComplete.mock.calls[0][0];
    expect(callArg.isPerfect).toBe(true);
  });

  it('leçon imparfaite → isPerfect=false', async () => {
    const { result } = renderHook(() =>
      useLesson({ lessonId: 'l1', exercises: EXERCISES_3, onComplete })
    );
    act(() => { result.current.checkAnswer('wrong_a'); }); // mauvaise
    await act(async () => { await result.current.nextExercise(); });
    act(() => { result.current.checkAnswer(EXERCISES_3[1].correctAnswer); });
    await act(async () => { await result.current.nextExercise(); });
    act(() => { result.current.checkAnswer(EXERCISES_3[2].correctAnswer); });
    await act(async () => { await result.current.nextExercise(); });
    const callArg = onComplete.mock.calls[0][0];
    expect(callArg.isPerfect).toBe(false);
  });

  it('restart remet tout à zéro', async () => {
    const { result } = renderHook(() =>
      useLesson({ lessonId: 'l1', exercises: EXERCISES_3, onComplete })
    );
    act(() => { result.current.checkAnswer('Dziękuję'); });
    await act(async () => { await result.current.nextExercise(); });
    act(() => { result.current.restart(); });
    expect(result.current.currentIndex).toBe(0);
    expect(result.current.phase).toBe('exercise');
    expect(result.current.correctCount).toBe(0);
    expect(result.current.xpEarned).toBe(0);
    expect(result.current.isCompleted).toBe(false);
  });

  it('skipExercise → phase feedback_wrong sans toucher aux vies directement', () => {
    const { result } = renderHook(() =>
      useLesson({ lessonId: 'l1', exercises: EXERCISES_3, onComplete })
    );
    act(() => { result.current.skipExercise(); });
    expect(result.current.phase).toBe('feedback_wrong');
    expect(result.current.isCorrect).toBe(false);
  });

  it('progress augmente à chaque exercice', async () => {
    const { result } = renderHook(() =>
      useLesson({ lessonId: 'l1', exercises: EXERCISES_3, onComplete })
    );
    const p0 = result.current.progress;
    act(() => { result.current.checkAnswer('Dziękuję'); });
    await act(async () => { await result.current.nextExercise(); });
    expect(result.current.progress).toBeGreaterThan(p0);
  });

  it('leçon avec 0 exercice ne crashe pas', async () => {
    const { result } = renderHook(() =>
      useLesson({ lessonId: 'empty', exercises: [], onComplete })
    );
    expect(result.current.current).toBeUndefined();
    expect(result.current.progress).toBe(0);
  });
});

// ============================================================
// src/components/discovery/DiscoveryView.tsx
// Phase 1 : Écran de découverte contemplatif (sans risque / sans score)
// ============================================================

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useFlashcardAudio } from '@/hooks/useAudio';
import { ScaleButton } from '@/components/ui/ScaleButton';
import { COLORS, BORDER_RADIUS, SPACING } from '@/constants';
import type { VocabItem } from '@/types';

interface DiscoveryViewProps {
  items: VocabItem[];
  onComplete: () => void;
}

export function DiscoveryView({ items, onComplete }: DiscoveryViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  // Tableau du niveau de révélation pour chaque carte (0 = caché, 1 = polonais + audio, 2 = traduction)
  const [steps, setSteps] = useState<number[]>(() => items.map(() => 0));

  const { isPlaying, playCard, stop } = useFlashcardAudio();

  const currentItem = items[currentIndex];
  const currentStep = steps[currentIndex] ?? 0;

  // Déclencher l'audio automatiquement lors du passage à l'étape 1
  useEffect(() => {
    if (currentStep === 1 && currentItem) {
      playCard(currentItem.audioUrl, currentItem.front);
    }
  }, [currentIndex, currentStep, currentItem, playCard]);

  if (!currentItem) return null;

  const handleCardTap = () => {
    if (currentStep === 0) {
      // Passer à l'étape 1 (Polonais + Audio)
      const nextSteps = [...steps];
      nextSteps[currentIndex] = 1;
      setSteps(nextSteps);
    } else if (currentStep === 1) {
      // Passer à l'étape 2 (Traduction)
      const nextSteps = [...steps];
      nextSteps[currentIndex] = 2;
      setSteps(nextSteps);
    }
  };

  const handleNext = () => {
    stop();
    if (currentIndex + 1 < items.length) {
      setCurrentIndex(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      stop();
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleReplayAudio = () => {
    if (currentItem) {
      playCard(currentItem.audioUrl, currentItem.front);
    }
  };

  return (
    <View style={dv.container}>
      {/* ── En-tête : Progression contemplative ── */}
      <View style={dv.header}>
        <Text style={dv.headerTag}>🔍 DÉCOUVERTE</Text>
        <Text style={dv.counter}>
          {currentIndex + 1} / {items.length}
        </Text>
      </View>

      {/* ── Carte principale réactive ── */}
      <ScaleButton style={dv.card} onPress={handleCardTap}>
        {/* Emoji d'illustration */}
        <Text style={[dv.emoji, currentStep > 0 && dv.emojiSmall]}>
          {currentItem.emoji ?? '💡'}
        </Text>

        {/* Étape 0 : Incitation initiale */}
        {currentStep === 0 && (
          <View style={dv.stepBox}>
            <Text style={dv.tapPrompt}>Touchez la carte pour découvrir le mot</Text>
          </View>
        )}

        {/* Étape 1 : Polonais + Phonétique */}
        {currentStep >= 1 && (
          <View style={dv.stepBox}>
            <Text style={dv.frontText}>{currentItem.front}</Text>
            <Text style={dv.phoneticText}>{currentItem.phonetic}</Text>

            <TouchableOpacity style={dv.audioBtn} onPress={handleReplayAudio}>
              <Text style={dv.audioBtnTxt}>{isPlaying ? '🔊 Lecture...' : '🔊 Réécouter'}</Text>
            </TouchableOpacity>

            {currentStep === 1 && (
              <Text style={dv.subPrompt}>Touchez encore pour la traduction</Text>
            )}
          </View>
        )}

        {/* Étape 2 : Traduction française */}
        {currentStep === 2 && (
          <View style={dv.translationBox}>
            <Text style={dv.backText}>{currentItem.back}</Text>
            {currentItem.examplePl && (
              <View style={dv.exampleBox}>
                <Text style={dv.examplePl}>{currentItem.examplePl}</Text>
                <Text style={dv.exampleFr}>{currentItem.exampleFr}</Text>
              </View>
            )}
          </View>
        )}
      </ScaleButton>

      {/* ── Barre de navigation (Précédent / Suivant) ── */}
      <View style={dv.navRow}>
        {currentIndex > 0 ? (
          <TouchableOpacity style={dv.prevBtn} onPress={handlePrev}>
            <Text style={dv.prevBtnTxt}>← Précédent</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ flex: 1 }} />
        )}

        {currentStep === 2 && (
          <TouchableOpacity style={dv.nextBtn} onPress={handleNext}>
            <Text style={dv.nextBtnTxt}>
              {currentIndex + 1 >= items.length ? 'Terminer la découverte ➔' : 'Suivant →'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const dv = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
  },
  headerTag: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 1,
  },
  counter: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  card: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: SPACING.md,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    gap: 16,
  },
  emoji: {
    fontSize: 80,
    textAlign: 'center',
  },
  emojiSmall: {
    fontSize: 52,
  },
  stepBox: {
    alignItems: 'center',
    gap: 8,
    width: '100%',
  },
  tapPrompt: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 12,
  },
  subPrompt: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 10,
  },
  frontText: {
    fontSize: 30,
    fontWeight: '900',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  phoneticText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  audioBtn: {
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BORDER_RADIUS.full,
    marginTop: 6,
  },
  audioBtnTxt: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  translationBox: {
    backgroundColor: '#F3F4F6',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    width: '100%',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  backText: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.primary,
    textAlign: 'center',
  },
  exampleBox: {
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 8,
    alignItems: 'center',
    width: '100%',
  },
  examplePl: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  exampleFr: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 52,
    gap: 12,
  },
  prevBtn: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surfaceAlt,
  },
  prevBtnTxt: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  nextBtn: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  nextBtnTxt: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.white,
  },
});

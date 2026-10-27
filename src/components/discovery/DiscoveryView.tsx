// ============================================================
// src/components/discovery/DiscoveryView.tsx
// Phase 1 : Écran de découverte contemplatif (sans risque / sans score)
// ============================================================

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ActivityIndicator, Dimensions, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useFlashcardAudio } from '@/hooks/useAudio';
import { ScaleButton } from '@/components/ui/ScaleButton';
import { getImageUrl, getAudioUrl } from '@/utils/media';
import { SHOW_ENDING_HIGHLIGHT } from '@/config/appConfig';
import { COLORS, BORDER_RADIUS, SPACING } from '@/constants';
import type { VocabItem } from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// 80% de la largeur d'écran (max 340px pour tablettes)
const LARGE_IMAGE_SIZE = Math.min(340, Math.round(SCREEN_WIDTH * 0.8));
// 65% de la largeur d'écran (max 260px) pour l'étape révélée
const SMALL_IMAGE_SIZE = Math.min(260, Math.round(SCREEN_WIDTH * 0.65));

interface DiscoveryViewProps {
  items: VocabItem[];
  onComplete: () => void;
}

/**
 * Rendu d'un texte (phrase ou note) avec coloration orange (#C55A11) des segments entre { }
 */
function renderMarkedText(
  markedText: string | undefined,
  defaultText: string,
  style: any,
  highlightStyle: any
) {
  const textToRender = markedText || defaultText;
  if (!SHOW_ENDING_HIGHLIGHT || !textToRender || !textToRender.includes('{')) {
    // Retirer préventivement toute accolade orpheline restante du texte affiché
    return <Text style={style}>{textToRender.replace(/[\{\}]/g, '')}</Text>;
  }

  // Découper sur les accolades { et } tout en conservant les contenus capturés
  const parts = textToRender.split(/\{([^}]+)\}/g);

  return (
    <Text style={style}>
      {parts.map((part, index) => {
        const cleanPart = part.replace(/[\{\}]/g, '');
        if (!cleanPart) return null;

        const isHighlight = index % 2 === 1; // Index impair = segment capturé entre { }
        if (isHighlight) {
          return (
            <Text key={index} style={highlightStyle}>
              {cleanPart}
            </Text>
          );
        }
        return cleanPart;
      })}
    </Text>
  );
}

export function DiscoveryView({ items, onComplete }: DiscoveryViewProps) {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  // Tableau du niveau de révélation pour chaque carte (0 = caché, 1 = polonais + audio, 2 = traduction)
  const [steps, setSteps] = useState<number[]>(() => items.map(() => 0));

  // États locaux de chargement et d'erreur d'image
  const [imageLoading, setImageLoading] = useState(true);
  const [imageHasError, setImageHasError] = useState(false);

  const { isPlaying, playCard, stop } = useFlashcardAudio();

  const currentItem = items[currentIndex];
  const currentStep = steps[currentIndex] ?? 0;
  const isSoundCard = currentItem?.itemType === 'sound';
  const hasHighlight = SHOW_ENDING_HIGHLIGHT && Boolean(currentItem?.examplePlMarked && /\{[^}]+\}/.test(currentItem.examplePlMarked));

  // Réinitialiser les états d'image lors du changement de carte
  useEffect(() => {
    setImageLoading(true);
    setImageHasError(false);
  }, [currentIndex]);

  // Déclencher l'audio du mot principal automatiquement lors du passage à l'étape 1
  useEffect(() => {
    if (currentStep === 1 && currentItem) {
      const targetAudioUrl = currentItem.audioUrl || getAudioUrl(currentItem.id);
      const textToSpeak = currentItem.ttsText ?? currentItem.front;
      playCard(targetAudioUrl, textToSpeak);
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
      // Passer à l'étape 2 (Traduction / Exemples)
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
      const targetAudioUrl = currentItem.audioUrl || getAudioUrl(currentItem.id);
      const textToSpeak = currentItem.ttsText ?? currentItem.front;
      playCard(targetAudioUrl, textToSpeak);
    }
  };

  const handlePlayExampleAudio = () => {
    if (currentItem?.examplePl) {
      // Toujours lire le texte d'exemple propre (sans accolades)
      const cleanExample = currentItem.examplePl.replace(/[\{\}]/g, '');
      playCard(undefined, cleanExample);
    }
  };

  /**
   * Rendu de la note de grammaire avec titre (ligne 1 si \n) et corps (ligne 2+)
   */
  const renderEndingNote = (noteText: string) => {
    if (!noteText) return null;

    const lines = noteText.split('\n');
    const titleLine = lines.length > 1 ? lines[0] : null;
    const bodyText = lines.length > 1 ? lines.slice(1).join('\n') : lines[0];

    return (
      <View style={dv.grammarBox}>
        <Text style={dv.grammarHeader}>💡 {t('lesson.discovery.grammar_title')}</Text>
        {titleLine && (
          <View style={dv.grammarTitleRow}>
            {renderMarkedText(titleLine, titleLine, dv.grammarTitleTxt, dv.exampleHighlight)}
          </View>
        )}
        <View style={dv.grammarBodyRow}>
          {renderMarkedText(bodyText, bodyText, dv.grammarBodyTxt, dv.exampleHighlight)}
        </View>
      </View>
    );
  };

  // Aucune requête image pour les cartes de type 'sound'
  const targetImageUrl = !isSoundCard && (currentItem?.imageUrl || (currentItem ? getImageUrl(currentItem.id) : ''));
  const showImage = Boolean(targetImageUrl) && !imageHasError;

  return (
    <View style={dv.container}>
      {/* ── En-tête : Progression contemplative ── */}
      <View style={dv.header}>
        <Text style={dv.headerTag}>{t('lesson.discovery.tag')}</Text>
        <Text style={dv.counter}>
          {currentIndex + 1} / {items.length}
        </Text>
      </View>

      {/* ── Carte principale réactive ── */}
      <ScaleButton
        style={[dv.card, !isSoundCard && currentStep === 2 && dv.cardWordStep2]}
        onPress={handleCardTap}
        disabled={currentStep === 2}
      >
        {/* Rendu spécifique pour les cartes de type 'sound' (lettres) */}
        {isSoundCard ? (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={dv.soundScrollContent}
          >
            {/* Lettre géante */}
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.5}
              style={[dv.soundLetter, currentStep > 0 && dv.soundLetterSmall]}
            >
              {currentItem.front}
            </Text>

            {/* Étape 0 : Incitation initiale */}
            {currentStep === 0 && (
              <View style={dv.stepBox}>
                <Text style={dv.tapPrompt}>{t('lesson.discovery.sound_tap_prompt')}</Text>
              </View>
            )}

            {/* Étape 1 : Son principal + Phonétique + Repère français */}
            {currentStep >= 1 && (
              <View style={dv.stepBox}>
                <TouchableOpacity style={dv.audioBtn} onPress={handleReplayAudio}>
                  <Text style={dv.audioBtnTxt}>
                    {isPlaying ? t('lesson.discovery.playing_audio') : t('lesson.discovery.replay_audio')}
                  </Text>
                </TouchableOpacity>

                {/* Pastille de prononciation */}
                <View style={dv.phoneticBadge}>
                  <Text style={dv.phoneticBadgeTxt}>{currentItem.phonetic}</Text>
                </View>

                {/* Repère français */}
                <Text style={dv.backText}>{currentItem.back}</Text>

                {currentStep === 1 && (
                  <Text style={dv.subPrompt}>{t('lesson.discovery.sound_sub_prompt')}</Text>
                )}
              </View>
            )}

            {/* Étape 2 : Bloc d'exemples */}
            {currentStep === 2 && (
              <View style={dv.translationBox}>
                {Boolean(currentItem.examplePl && currentItem.examplePl.trim()) && (
                  <View style={dv.exampleBox}>
                    <Text style={dv.exampleHeader}>{t('lesson.discovery.sound_examples_title')}</Text>

                    {renderMarkedText(
                      currentItem.examplePlMarked,
                      currentItem.examplePl,
                      dv.examplePl,
                      dv.exampleHighlight
                    )}

                    {hasHighlight && (
                      currentItem.endingNote ? (
                        renderEndingNote(currentItem.endingNote)
                      ) : (
                        <Text style={dv.endingLegend}>{t('lesson.discovery.ending_legend')}</Text>
                      )
                    )}

                    <TouchableOpacity style={dv.exampleAudioBtn} onPress={handlePlayExampleAudio}>
                      <Text style={dv.exampleAudioBtnTxt}>{t('lesson.discovery.play_examples')}</Text>
                    </TouchableOpacity>

                    <Text style={dv.exampleFr}>{currentItem.exampleFr}</Text>
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        ) : currentStep === 2 ? (
          /* ÉTAPE 2 RÉVÉLÉE POUR CARTES 'WORD' / 'PHRASE' : Structure resserrée avec ScrollView */
          <ScrollView
            style={{ flex: 1, width: '100%' }}
            showsVerticalScrollIndicator={true}
            persistentScrollbar={true}
            nestedScrollEnabled={true}
            contentContainerStyle={dv.wordStep2Scroll}
          >
            {/* En-tête resserré : Emoji/Image à ~48px, Mot 24px, Phonétique 14px, Bouton Réécouter aminci */}
            <View style={dv.wordStep2HeaderBox}>
              {showImage ? (
                <View style={dv.wordImageContainerSmall}>
                  <Image
                    source={{ uri: targetImageUrl as string }}
                    style={dv.image}
                    onLoadStart={() => setImageLoading(true)}
                    onLoadEnd={() => setImageLoading(false)}
                    onError={() => setImageHasError(true)}
                    resizeMode="cover"
                  />
                  {imageLoading && (
                    <ActivityIndicator size="small" color={COLORS.primary} style={StyleSheet.absoluteFill} />
                  )}
                </View>
              ) : (
                <Text style={dv.wordEmojiSmall}>{currentItem.emoji ?? '💡'}</Text>
              )}

              <Text style={dv.wordFrontTextSmall}>{currentItem.front}</Text>
              <Text style={dv.wordPhoneticTextSmall}>{currentItem.phonetic}</Text>

              <TouchableOpacity style={dv.wordAudioBtnSmall} onPress={handleReplayAudio}>
                <Text style={dv.wordAudioBtnTxtSmall}>
                  {isPlaying ? t('lesson.discovery.playing_audio') : t('lesson.discovery.replay_audio')}
                </Text>
              </TouchableOpacity>
            </View>

            {/* 1. Bloc Traduction du mot (fond #E9F0F8, pas de bordure, texte rouge primary) */}
            <View style={dv.wordTranslationBox}>
              <Text style={dv.wordBackText}>{currentItem.back}</Text>
            </View>

            {/* 2. Bloc « Dans une phrase » (si examplePl non vide) */}
            {Boolean(currentItem.examplePl && currentItem.examplePl.trim()) && (
              <View style={dv.sentenceBlock}>
                <View style={dv.sentenceHeaderRow}>
                  <Text style={dv.sentenceHeaderLabel}>{t('lesson.discovery.in_a_sentence')}</Text>
                  <TouchableOpacity style={dv.shortAudioBtn} onPress={handlePlayExampleAudio}>
                    <Text style={dv.shortAudioBtnTxt}>{t('lesson.discovery.play_short')}</Text>
                  </TouchableOpacity>
                </View>

                {/* Phrase polonaise (droite, taille 20, gras, orange si marqueur) */}
                <View style={dv.sentencePlWrap}>
                  {renderMarkedText(
                    currentItem.examplePlMarked,
                    currentItem.examplePl,
                    dv.sentencePlTxt,
                    dv.exampleHighlight
                  )}
                </View>

                {/* Traduction française (taille 16, couleur #4E6585, centrée) */}
                <Text style={dv.sentenceFrTxt}>{currentItem.exampleFr}</Text>
              </View>
            )}

            {/* 3. Bloc « Grammaire en contexte » (si segment orange) */}
            {hasHighlight && (
              currentItem.endingNote ? (
                renderEndingNote(currentItem.endingNote)
              ) : (
                <Text style={dv.endingLegend}>{t('lesson.discovery.ending_legend')}</Text>
              )
            )}
          </ScrollView>
        ) : (
          /* ÉTAPES 0 ET 1 POUR CARTES 'WORD' / 'PHRASE' : Rendu 100% INCHANGÉ */
          <>
            {/* Image Firebase Storage ou Fallback Emoji */}
            {showImage ? (
              <View style={[dv.imageContainer, currentStep > 0 && dv.imageContainerSmall]}>
                <Image
                  source={{ uri: targetImageUrl as string }}
                  style={dv.image}
                  onLoadStart={() => setImageLoading(true)}
                  onLoadEnd={() => setImageLoading(false)}
                  onError={() => setImageHasError(true)}
                  resizeMode="cover"
                />
                {imageLoading && (
                  <ActivityIndicator size="small" color={COLORS.primary} style={StyleSheet.absoluteFill} />
                )}
              </View>
            ) : (
              <Text style={[dv.emoji, currentStep > 0 && dv.emojiSmall]}>
                {currentItem.emoji ?? '💡'}
              </Text>
            )}

            {/* Étape 0 : Incitation initiale */}
            {currentStep === 0 && (
              <View style={dv.stepBox}>
                <Text style={dv.tapPrompt}>{t('lesson.discovery.tap_prompt')}</Text>
              </View>
            )}

            {/* Étape 1 : Polonais + Phonétique */}
            {currentStep === 1 && (
              <View style={dv.stepBox}>
                <Text style={dv.frontText}>{currentItem.front}</Text>
                <Text style={dv.phoneticText}>{currentItem.phonetic}</Text>

                <TouchableOpacity style={dv.audioBtn} onPress={handleReplayAudio}>
                  <Text style={dv.audioBtnTxt}>
                    {isPlaying ? t('lesson.discovery.playing_audio') : t('lesson.discovery.replay_audio')}
                  </Text>
                </TouchableOpacity>

                <Text style={dv.subPrompt}>{t('lesson.discovery.sub_prompt')}</Text>
              </View>
            )}
          </>
        )}
      </ScaleButton>

      {/* ── Barre de navigation (Précédent / Suivant) ── */}
      <View style={dv.navRow}>
        {currentIndex > 0 ? (
          <TouchableOpacity style={dv.prevBtn} onPress={handlePrev}>
            <Text style={dv.prevBtnTxt}>{t('lesson.discovery.prev_btn')}</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ flex: 1 }} />
        )}

        {currentStep === 2 && (
          <TouchableOpacity style={dv.nextBtn} onPress={handleNext}>
            <Text style={dv.nextBtnTxt}>{t('lesson.discovery.next_btn')}</Text>
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
    padding: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: SPACING.md,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardWordStep2: {
    paddingTop: 16,
    paddingBottom: 8,
    paddingHorizontal: SPACING.md,
  },
  soundScrollContent: {
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
    gap: 10,
    width: '100%',
  },
  wordStep2HeaderBox: {
    alignItems: 'center',
    gap: 2,
    width: '100%',
  },
  wordEmojiSmall: {
    fontSize: 48,
    textAlign: 'center',
    marginVertical: 2,
  },
  wordImageContainerSmall: {
    width: 52,
    height: 52,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  wordFrontTextSmall: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  wordPhoneticTextSmall: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  wordAudioBtnSmall: {
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
    marginTop: 4,
  },
  wordAudioBtnTxtSmall: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  wordStep2Scroll: {
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
    width: '100%',
    gap: 10,
    paddingBottom: 8,
  },
  wordTranslationBox: {
    backgroundColor: COLORS.translationBg,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: 10,
    paddingHorizontal: SPACING.md,
    width: '100%',
    alignItems: 'center',
  },
  wordBackText: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.primary,
    textAlign: 'center',
  },
  soundLetter: {
    fontSize: 110,
    fontWeight: '900',
    color: COLORS.primary,
    textAlign: 'center',
    marginVertical: 6,
  },
  soundLetterSmall: {
    fontSize: 72,
    marginVertical: 2,
  },
  phoneticBadge: {
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.full,
    marginVertical: 4,
  },
  phoneticBadgeTxt: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.primary,
  },
  exampleHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  imageContainer: {
    width: LARGE_IMAGE_SIZE,
    aspectRatio: 1,
    maxWidth: 340,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainerSmall: {
    width: SMALL_IMAGE_SIZE,
    aspectRatio: 1,
    maxWidth: 260,
    borderRadius: 20,
  },
  image: {
    width: '100%',
    height: '100%',
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
  },
  backText: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.primary,
    textAlign: 'center',
  },
  sentenceBlock: {
    backgroundColor: COLORS.sentenceBg,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.sentenceBorder,
    padding: 12,
    width: '100%',
    gap: 6,
  },
  sentenceHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 2,
  },
  sentenceHeaderLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.sentenceHeader,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  shortAudioBtn: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
  },
  shortAudioBtnTxt: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  sentencePlWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  sentencePlTxt: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  sentenceFrTxt: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.sentenceFr,
    textAlign: 'center',
    alignSelf: 'stretch',
    width: '100%',
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
  exampleHighlight: {
    color: '#C55A11',
    fontWeight: '900',
    fontStyle: 'normal',
  },
  endingLegend: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 4,
  },
  grammarBox: {
    backgroundColor: COLORS.grammarBg,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.grammarBorder,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.grammarAccent,
    padding: 12,
    width: '100%',
    alignItems: 'flex-start',
    gap: 4,
  },
  grammarHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.grammarAccent,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  grammarTitleRow: {
    width: '100%',
  },
  grammarTitleTxt: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'left',
  },
  grammarBodyRow: {
    width: '100%',
  },
  grammarBodyTxt: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.textPrimary,
    textAlign: 'left',
    lineHeight: 20,
  },
  exampleAudioBtn: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
    marginVertical: 4,
  },
  exampleAudioBtnTxt: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
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

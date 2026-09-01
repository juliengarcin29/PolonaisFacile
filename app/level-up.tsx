// ============================================================
// app/level-up.tsx
// Écran de passage de niveau — célébration animée
// ============================================================

import { BORDER_RADIUS, COLORS, GAMIFICATION, SPACING } from '@/constants';
import { useUserStore } from '@/store/userStore';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width: W, height: H } = Dimensions.get('window');

export default function LevelUpScreen() {
  const { level } = useLocalSearchParams<{ level: string }>();
  const { user } = useUserStore();

  const newLevel = parseInt(level ?? String(user?.level ?? 2));
  const levelInfo =
    GAMIFICATION.LEVELS.find((l) => l.level === newLevel) ?? {
      level: newLevel,
      title: 'Expert',
      badge: '⭐',
      xpRequired: 0,
    };

  // Animations
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const confettiAnims = useRef(
    Array.from({ length: 12 }, () => ({
      y: new Animated.Value(-50),
      x: new Animated.Value(Math.random() * W),
      opacity: new Animated.Value(0),
      rotate: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    // Animation principale
    Animated.sequence([
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, friction: 4, tension: 80, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]),
      Animated.timing(rotateAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();

    // Confettis
    confettiAnims.forEach((anim, i) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 100),
          Animated.parallel([
            Animated.timing(anim.y, { toValue: H + 100, duration: 2000 + Math.random() * 1000, useNativeDriver: true }),
            Animated.timing(anim.opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
            Animated.timing(anim.rotate, { toValue: 1, duration: 1500, useNativeDriver: true }),
          ]),
        ])
      ).start();
    });
  }, []);

  const rotate = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '15deg'] });

  const CONFETTI_EMOJIS = ['🎉', '🎊', '⭐', '✨', '🌟', '💫', '🏆', '🎯', '💎', '🔥', '⚡', '🌈'];

  return (
    <SafeAreaView style={s.safe}>
      {/* Confettis */}
      {confettiAnims.map((anim, i) => (
        <Animated.Text
          key={i}
          style={[
            s.confetti,
            {
              left: anim.x,
              transform: [
                { translateY: anim.y },
                { rotate: anim.rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) },
              ],
              opacity: anim.opacity,
            },
          ]}
        >
          {CONFETTI_EMOJIS[i % CONFETTI_EMOJIS.length]}
        </Animated.Text>
      ))}

      {/* Contenu principal */}
      <Animated.View style={[s.content, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        {/* Badge niveau */}
        <Animated.View style={[s.badgeWrap, { transform: [{ rotate }] }]}>
          <View style={s.badge}>
            <Text style={s.badgeEmoji}>{levelInfo.badge}</Text>
          </View>
        </Animated.View>

        {/* Texte */}
        <Text style={s.congrats}>FÉLICITATIONS !</Text>
        <Text style={s.levelText}>NIVEAU {newLevel}</Text>
        <Text style={s.titleText}>{levelInfo.title}</Text>
        <Text style={s.desc}>
          Vous progressez remarquablement dans votre apprentissage du polonais !
        </Text>

        {/* Récompenses débloquées */}
        <View style={s.rewardsWrap}>
          <Text style={s.rewardsTitle}>Ce niveau débloque :</Text>
          {getLevelRewards(newLevel).map((reward, i) => (
            <View key={i} style={s.rewardRow}>
              <Text style={s.rewardEmoji}>{reward.emoji}</Text>
              <Text style={s.rewardText}>{reward.text}</Text>
            </View>
          ))}
        </View>

        {/* Bouton continuer */}
        <TouchableOpacity
          style={s.continueBtn}
          onPress={() => router.replace('/(tabs)')}
          activeOpacity={0.85}
        >
          <Text style={s.continueBtnTxt}>Continuer l'apprentissage →</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.replace('/(tabs)')}>
          <Text style={s.skipTxt}>Retour à l'accueil</Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

function getLevelRewards(level: number): Array<{ emoji: string; text: string }> {
  const rewards: Record<number, Array<{ emoji: string; text: string }>> = {
    2: [{ emoji: '🃏', text: '20 nouvelles flashcards' }],
    3: [{ emoji: '📚', text: 'Module 2 débloqué' }],
    4: [{ emoji: '🎯', text: 'Quiz avancés disponibles' }],
    5: [{ emoji: '⚡', text: 'Sessions de 30 flashcards' }],
    6: [{ emoji: '🔥', text: 'Mode compétition' }],
    7: [{ emoji: '🧠', text: 'Leçons de grammaire avancée' }],
    8: [{ emoji: '💎', text: 'Badge Expert débloqué' }],
    9: [{ emoji: '🏆', text: 'Accès au classement' }],
    10: [{ emoji: '👑', text: 'Statut Légende atteint !' }],
  };
  return rewards[level] ?? [{ emoji: '✨', text: 'Nouveau contenu disponible !' }];
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.primary },
  confetti: { position: 'absolute', fontSize: 20, zIndex: 0 },
  content: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: SPACING.xl, gap: SPACING.md, zIndex: 1,
  },
  badgeWrap: { marginBottom: SPACING.sm },
  badge: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 4, borderColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center', justifyContent: 'center',
  },
  badgeEmoji: { fontSize: 56 },
  congrats: {
    fontSize: 16, fontWeight: '800', color: 'rgba(255,255,255,0.8)',
    letterSpacing: 3, textTransform: 'uppercase',
  },
  levelText: { fontSize: 40, fontWeight: '900', color: COLORS.white, letterSpacing: 2 },
  titleText: { fontSize: 22, fontWeight: '700', color: 'rgba(255,255,255,0.9)' },
  desc: {
    fontSize: 14, color: 'rgba(255,255,255,0.7)',
    textAlign: 'center', lineHeight: 20, maxWidth: 280,
  },
  rewardsWrap: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: BORDER_RADIUS.xl, padding: SPACING.lg,
    width: '100%', gap: 10,
  },
  rewardsTitle: { fontSize: 14, fontWeight: '700', color: COLORS.white, marginBottom: 4 },
  rewardRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rewardEmoji: { fontSize: 20 },
  rewardText: { fontSize: 14, color: 'rgba(255,255,255,0.85)', fontWeight: '500' },
  continueBtn: {
    backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.full,
    paddingVertical: 16, paddingHorizontal: SPACING.xxl,
    width: '100%', alignItems: 'center', marginTop: SPACING.sm,
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
  },
  continueBtnTxt: { color: COLORS.primary, fontSize: 16, fontWeight: '800' },
  skipTxt: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 4 },
});
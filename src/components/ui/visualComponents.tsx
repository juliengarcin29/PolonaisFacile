// ============================================================
// src/components/ui/ProgressRing.tsx
// Cercle de progression SVG animé
// ============================================================

import { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { COLORS } from '@/constants';

interface ProgressRingProps {
  size?: number;
  strokeWidth?: number;
  progress: number;       // 0-100
  color?: string;
  trackColor?: string;
  label?: string;
  sublabel?: string;
  showPercent?: boolean;
}

export function ProgressRing({
  size = 80,
  strokeWidth = 8,
  progress,
  color = COLORS.primary,
  trackColor = COLORS.surfaceAlt,
  label,
  sublabel,
  showPercent = true,
}: ProgressRingProps) {
  const animatedProgress = useRef(new Animated.Value(0)).current;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    Animated.spring(animatedProgress, {
      toValue: Math.min(100, Math.max(0, progress)),
      friction: 8,
      tension: 40,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const strokeDashoffset = animatedProgress.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
  });

  const AnimatedCircle = Animated.createAnimatedComponent(Circle);

  return (
    <View style={[pr.container, { width: size, height: size }]}>
      <Svg width={size} height={size} style={pr.svg}>
        {/* Track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={pr.labelWrap}>
        {showPercent && !label && (
          <Text style={[pr.percent, { color }]}>{Math.round(progress)}%</Text>
        )}
        {label && <Text style={[pr.label, { color }]}>{label}</Text>}
        {sublabel && <Text style={pr.sublabel}>{sublabel}</Text>}
      </View>
    </View>
  );
}

const pr = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  svg: { position: 'absolute' },
  labelWrap: { alignItems: 'center' },
  percent: { fontSize: 16, fontWeight: '900' },
  label: { fontSize: 14, fontWeight: '800' },
  sublabel: { fontSize: 10, color: COLORS.textMuted, marginTop: 1 },
});


// ============================================================
// src/components/ui/XPAnimation.tsx
// Animation +XP flottante déclenchée après un exercice correct
// ============================================================

import { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { COLORS } from '@/constants';

interface XPAnimationProps {
  amount: number;
  visible: boolean;
  onComplete?: () => void;
  x?: number;
  y?: number;
}

export function XPAnimation({
  amount, visible, onComplete, x = 0, y = 0,
}: XPAnimationProps) {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    if (!visible) return;

    translateY.setValue(0);
    opacity.setValue(0);
    scale.setValue(0.5);

    Animated.sequence([
      Animated.parallel([
        Animated.spring(scale, { toValue: 1.2, friction: 4, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(translateY, { toValue: -60, duration: 600, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 600, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, friction: 8, useNativeDriver: true }),
      ]),
    ]).start(() => onComplete?.());
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        xa.container,
        { left: x, top: y },
        {
          transform: [{ translateY }, { scale }],
          opacity,
        },
      ]}
      pointerEvents="none"
    >
      <Text style={xa.text}>+{amount} XP</Text>
      <Text style={xa.star}>⭐</Text>
    </Animated.View>
  );
}

const xa = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.xpGold,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
    shadowColor: COLORS.xpGold,
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  text: { fontSize: 15, fontWeight: '900', color: COLORS.white },
  star: { fontSize: 14 },
});


// ============================================================
// src/components/gamification/StreakCalendar.tsx
// Calendrier de streak — 7 derniers jours
// ============================================================

import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '@/constants';
import { useUserStore } from '@/store/userStore';

interface StreakCalendarProps {
  weekActivity?: boolean[]; // 7 valeurs (lundi → dimanche)
}

const DAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

export function StreakCalendar({ weekActivity }: StreakCalendarProps) {
  const { user } = useUserStore();

  // Simuler 7 jours d'activité si non fourni
  const activity = weekActivity ?? Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return i < (user?.streak ?? 0);
  });

  const todayIdx = (new Date().getDay() + 6) % 7; // 0=lundi

  return (
    <View style={sc.container}>
      {DAY_LABELS.map((label, i) => {
        const isToday = i === todayIdx;
        const wasActive = activity[i];
        const isFuture = i > todayIdx;

        return (
          <View key={i} style={sc.dayCol}>
            <View style={[
              sc.dot,
              wasActive && sc.dotActive,
              isToday && !wasActive && sc.dotToday,
              isFuture && sc.dotFuture,
            ]}>
              {wasActive && <Text style={sc.checkmark}>✓</Text>}
              {isToday && !wasActive && <Text style={sc.todayDot}>•</Text>}
            </View>
            <Text style={[
              sc.label,
              isToday && sc.labelToday,
              wasActive && sc.labelActive,
            ]}>
              {label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const sc = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
  },
  dayCol: { alignItems: 'center', gap: 4 },
  dot: {
    width: 32, height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotActive: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  dotToday: {
    borderColor: COLORS.primary,
    borderWidth: 2,
    backgroundColor: COLORS.white,
  },
  dotFuture: { opacity: 0.3 },
  checkmark: { fontSize: 14, color: COLORS.white, fontWeight: '900' },
  todayDot: { fontSize: 16, color: COLORS.primary, fontWeight: '900' },
  label: { fontSize: 10, color: COLORS.textMuted, fontWeight: '600' },
  labelToday: { color: COLORS.primary, fontWeight: '800' },
  labelActive: { color: '#FF6B35' },
});


// ============================================================
// src/components/lesson/WordCard.tsx
// Carte de vocabulaire standalone — utilisable partout
// ============================================================

import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import * as Speech from 'expo-speech';
import { COLORS, SPACING, BORDER_RADIUS } from '@/constants';

interface WordCardProps {
  pl: string;
  fr: string;
  phonetic?: string;
  examplePl?: string;
  exampleFr?: string;
  audioUrl?: string;
  onPress?: () => void;
  isLearned?: boolean;
  compact?: boolean;
}

export function WordCard({
  pl, fr, phonetic, examplePl, exampleFr,
  onPress, isLearned = false, compact = false,
}: WordCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showExample, setShowExample] = useState(false);

  const playWord = () => {
    if (isPlaying) return;
    setIsPlaying(true);
    Speech.speak(pl, {
      language: 'pl-PL',
      rate: 0.85,
      onDone: () => setIsPlaying(false),
      onError: () => setIsPlaying(false),
    });
  };

  if (compact) {
    return (
      <TouchableOpacity
        style={[wc.compact, isLearned && wc.compactLearned]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <View style={wc.compactLeft}>
          <Text style={wc.compactPl}>{pl}</Text>
          {phonetic && <Text style={wc.compactPhonetic}>{phonetic}</Text>}
        </View>
        <Text style={wc.compactFr}>{fr}</Text>
        <TouchableOpacity
          style={wc.soundBtn}
          onPress={(e) => {
            e.stopPropagation();
            playWord();
          }}
        >
          <Text style={wc.soundIcon}>{isPlaying ? '🔉' : '🔊'}</Text>
        </TouchableOpacity>
        {isLearned && <Text style={wc.learnedBadge}>✓</Text>}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[wc.card, isLearned && wc.cardLearned]}
      onPress={() => setShowExample(!showExample)}
      activeOpacity={0.9}
    >
      {/* Mot principal */}
      <View style={wc.header}>
        <View style={wc.headerLeft}>
          <Text style={wc.plWord}>{pl}</Text>
          {phonetic && <Text style={wc.phoneticText}>{phonetic}</Text>}
        </View>
        <TouchableOpacity
          style={wc.audioBtn}
          onPress={(e) => {
            e.stopPropagation();
            playWord();
          }}
        >
          <Text style={wc.audioIcon}>{isPlaying ? '🔉' : '🔊'}</Text>
        </TouchableOpacity>
      </View>

      {/* Traduction */}
      <Text style={wc.frWord}>{fr}</Text>

      {/* Exemple (toggle) */}
      {showExample && examplePl && (
        <View style={wc.exampleBox}>
          <Text style={wc.examplePl}>{examplePl}</Text>
          {exampleFr && <Text style={wc.exampleFr}>{exampleFr}</Text>}
        </View>
      )}

      {/* Indicateur appris */}
      {isLearned && (
        <View style={wc.learnedTag}>
          <Text style={wc.learnedTagTxt}>✅ Appris</Text>
        </View>
      )}

      {/* Hint expand */}
      {examplePl && (
        <Text style={wc.expandHint}>
          {showExample ? '▲ Masquer' : '▼ Voir un exemple'}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const wc = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    gap: 6,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.surfaceAlt,
  },
  cardLearned: {
    borderColor: COLORS.success + '40',
    backgroundColor: COLORS.successLight + '30',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: { flex: 1 },
  plWord: { fontSize: 24, fontWeight: '900', color: COLORS.primary },
  phoneticText: { fontSize: 13, color: COLORS.textMuted, fontStyle: 'italic', marginTop: 2 },
  audioBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.primary + '12',
    alignItems: 'center', justifyContent: 'center',
  },
  audioIcon: { fontSize: 16 },
  frWord: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
  exampleBox: {
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    gap: 4,
    marginTop: 4,
  },
  examplePl: { fontSize: 13, color: COLORS.textSecondary, fontStyle: 'italic' },
  exampleFr: { fontSize: 12, color: COLORS.textMuted },
  learnedTag: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.successLight,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginTop: 4,
  },
  learnedTagTxt: { fontSize: 11, color: COLORS.success, fontWeight: '700' },
  expandHint: {
    fontSize: 10,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },

  // Compact
  compact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.surfaceAlt,
  },
  compactLearned: { borderColor: COLORS.success + '30', backgroundColor: COLORS.successLight + '20' },
  compactLeft: { flex: 1 },
  compactPl: { fontSize: 15, fontWeight: '700', color: COLORS.primary },
  compactPhonetic: { fontSize: 10, color: COLORS.textMuted, fontStyle: 'italic' },
  compactFr: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500', flex: 1 },
  soundBtn: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: COLORS.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
  },
  soundIcon: { fontSize: 14 },
  learnedBadge: { fontSize: 16, color: COLORS.success },
});

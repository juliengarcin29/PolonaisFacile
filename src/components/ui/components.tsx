// ============================================================
// src/components/ui/XPBar.tsx
// Barre XP animée avec niveau
// ============================================================
import { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '@/constants';
import { useUserStore } from '@/store/userStore';

export function XPBar({ showLabel = true }: { showLabel?: boolean }) {
  const { user } = useUserStore();
  const progressAnim = useRef(new Animated.Value(0)).current;

  const totalXPForLevel = (user?.xp ?? 0) + (user?.xpToNextLevel ?? 100);
  const percent = totalXPForLevel > 0
    ? Math.min(100, ((user?.xp ?? 0) / totalXPForLevel) * 100)
    : 0;

  useEffect(() => {
    Animated.spring(progressAnim, {
      toValue: percent,
      useNativeDriver: false,
      friction: 8,
      tension: 40,
    }).start();
  }, [percent]);

  const width = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={xp.container}>
      {showLabel && (
        <View style={xp.labelRow}>
          <Text style={xp.levelText}>Niv. {user?.level ?? 1}</Text>
          <Text style={xp.xpText}>⭐ {user?.xp ?? 0} XP</Text>
        </View>
      )}
      <View style={xp.track}>
        <Animated.View style={[xp.fill, { width }]} />
      </View>
      {showLabel && (
        <Text style={xp.nextText}>
          {user?.xpToNextLevel ?? 100} XP avant le niveau {(user?.level ?? 1) + 1}
        </Text>
      )}
    </View>
  );
}

const xp = StyleSheet.create({
  container: { gap: 4 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  levelText: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary },
  xpText: { fontSize: 13, fontWeight: '700', color: COLORS.xpGold },
  track: {
    height: 10, backgroundColor: COLORS.surfaceAlt,
    borderRadius: BORDER_RADIUS.full, overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.xpGold,
  },
  nextText: { fontSize: 11, color: COLORS.textMuted, textAlign: 'right' },
});


// ============================================================
// src/components/ui/HeartBar.tsx
// Affichage des vies (cœurs)
// ============================================================
import React from 'react';
import { View, Text, StyleSheet as S2 } from 'react-native';
import { COLORS } from '@/constants';
import { useUserStore } from '@/store/userStore';

export function HeartBar() {
  const { user } = useUserStore();
  const hearts = user?.hearts ?? 5;
  const maxHearts = user?.maxHearts ?? 5;

  return (
    <View style={hb.row}>
      {Array.from({ length: maxHearts }).map((_, i) => (
        <Text key={i} style={[hb.heart, i >= hearts && hb.heartEmpty]}>
          ❤️
        </Text>
      ))}
    </View>
  );
}

const hb = S2.create({
  row: { flexDirection: 'row', gap: 2, alignItems: 'center' },
  heart: { fontSize: 18 },
  heartEmpty: { opacity: 0.2 },
});


// ============================================================
// src/components/ui/StreakBadge.tsx
// Badge streak avec animation de flamme
// ============================================================
import { useRef as useRef2, useEffect as useEffect2 } from 'react';
import { View, Text, StyleSheet as S3, Animated as Anim2 } from 'react-native';
import { COLORS as C, SPACING as SP, BORDER_RADIUS as BR } from '@/constants';
import { useUserStore as useUS } from '@/store/userStore';

export function StreakBadge({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const { user } = useUS();
  const streak = user?.streak ?? 0;
  const pulseAnim = useRef2(new Anim2.Value(1)).current;

  useEffect2(() => {
    if (streak > 0) {
      Anim2.loop(
        Anim2.sequence([
          Anim2.timing(pulseAnim, { toValue: 1.1, duration: 800, useNativeDriver: true }),
          Anim2.timing(pulseAnim, { toValue: 1.0, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [streak]);

  const sizes = {
    sm: { badge: 32, emoji: 14, text: 11 },
    md: { badge: 44, emoji: 18, text: 13 },
    lg: { badge: 60, emoji: 26, text: 17 },
  };
  const sz = sizes[size];

  const isActive = streak > 0;

  return (
    <Anim2.View style={[
      sb.badge,
      {
        width: sz.badge, height: sz.badge, borderRadius: sz.badge / 2,
        backgroundColor: isActive ? '#FF6B35' : C.surfaceAlt,
        transform: [{ scale: isActive ? pulseAnim : new Anim2.Value(1) }],
      },
    ]}>
      <Text style={{ fontSize: sz.emoji }}>🔥</Text>
      <Text style={[sb.text, { fontSize: sz.text, color: isActive ? C.white : C.textMuted }]}>
        {streak}
      </Text>
    </Anim2.View>
  );
}

const sb = S3.create({
  badge: { alignItems: 'center', justifyContent: 'center', gap: 1 },
  text: { fontWeight: '900', lineHeight: 14 },
});


// ============================================================
// src/components/ui/LevelUpModal.tsx
// Modal animée de passage de niveau
// ============================================================
import { useRef as r3, useEffect as e3 } from 'react';
import {
  Modal, View, Text, TouchableOpacity,
  StyleSheet as S4, Animated as A3,
} from 'react-native';
import { COLORS as CO, SPACING as SPa, BORDER_RADIUS as BRa } from '@/constants';

interface LevelUpModalProps {
  visible: boolean;
  newLevel: number;
  onClose: () => void;
}

export function LevelUpModal({ visible, newLevel, onClose }: LevelUpModalProps) {
  const scaleAnim = r3(new A3.Value(0)).current;
  const rotateAnim = r3(new A3.Value(0)).current;

  e3(() => {
    if (visible) {
      A3.parallel([
        A3.spring(scaleAnim, { toValue: 1, friction: 4, tension: 80, useNativeDriver: true }),
        A3.timing(rotateAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]).start();
    } else {
      scaleAnim.setValue(0);
      rotateAnim.setValue(0);
    }
  }, [visible]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={lu.overlay}>
        <A3.View style={[lu.card, { transform: [{ scale: scaleAnim }] }]}>
          <A3.Text style={[lu.star, { transform: [{ rotate }] }]}>⭐</A3.Text>
          <Text style={lu.title}>NIVEAU {newLevel} !</Text>
          <Text style={lu.sub}>Félicitations, vous progressez !</Text>
          <Text style={lu.desc}>
            Continuez à apprendre pour débloquer{'\n'}de nouvelles leçons et badges.
          </Text>
          <TouchableOpacity style={lu.btn} onPress={onClose}>
            <Text style={lu.btnTxt}>Continuer →</Text>
          </TouchableOpacity>
        </A3.View>
      </View>
    </Modal>
  );
}

const lu = S4.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center', justifyContent: 'center',
  },
  card: {
    backgroundColor: CO.white, borderRadius: 28,
    padding: SPa.xl, alignItems: 'center', gap: SPa.sm,
    width: '80%', maxWidth: 340,
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 20, elevation: 10,
  },
  star: { fontSize: 72 },
  title: {
    fontSize: 32, fontWeight: '900', color: CO.primary,
    letterSpacing: 1,
  },
  sub: { fontSize: 18, fontWeight: '700', color: CO.textPrimary },
  desc: {
    fontSize: 14, color: CO.textSecondary,
    textAlign: 'center', lineHeight: 20,
  },
  btn: {
    backgroundColor: CO.primary, borderRadius: 100,
    paddingVertical: 14, paddingHorizontal: 40,
    marginTop: SPa.sm,
  },
  btnTxt: { color: CO.white, fontSize: 16, fontWeight: '800' },
});


// ============================================================
// src/components/ui/AchievementToast.tsx
// Toast de badge débloqué — apparaît en haut de l'écran
// ============================================================
import { useRef as r4, useEffect as e4 } from 'react';
import {
  View, Text, StyleSheet as S5,
  Animated as A4, Dimensions as Dim,
} from 'react-native';
import { COLORS as C5, SPACING as SP5, BORDER_RADIUS as BR5 } from '@/constants';
import type { Achievement as Ach } from '@/types';

const { width: W } = Dim.get('window');

interface AchievementToastProps {
  achievement: Ach | null;
  visible: boolean;
  onHide: () => void;
}

export function AchievementToast({ achievement, visible, onHide }: AchievementToastProps) {
  const slideAnim = r4(new A4.Value(-120)).current;

  e4(() => {
    if (visible && achievement) {
      A4.sequence([
        A4.spring(slideAnim, { toValue: 0, friction: 8, useNativeDriver: true }),
        A4.delay(2500),
        A4.timing(slideAnim, { toValue: -120, duration: 300, useNativeDriver: true }),
      ]).start(() => onHide());
    }
  }, [visible, achievement]);

  if (!achievement) return null;

  const rarityColors: Record<string, string> = {
    common: '#6B7280',
    rare: '#3B82F6',
    epic: '#8B5CF6',
    legendary: '#D4AF37',
  };
  const rarityColor = rarityColors[achievement.rarity] ?? C5.primary;

  return (
    <A4.View style={[at.container, { transform: [{ translateY: slideAnim }] }]}>
      <View style={[at.inner, { borderLeftColor: rarityColor }]}>
        <Text style={at.icon}>{achievement.icon}</Text>
        <View style={at.textWrap}>
          <Text style={at.label}>Badge débloqué !</Text>
          <Text style={at.title}>{achievement.title}</Text>
          <Text style={at.desc}>{achievement.description}</Text>
        </View>
        <Text style={[at.xp, { color: rarityColor }]}>+{achievement.xpReward} XP</Text>
      </View>
    </A4.View>
  );
}

const at = S5.create({
  container: {
    position: 'absolute', top: 60, left: SP5.lg, right: SP5.lg,
    zIndex: 9999,
  },
  inner: {
    backgroundColor: C5.white, borderRadius: BR5.xl,
    padding: SP5.md, flexDirection: 'row', alignItems: 'center', gap: 12,
    borderLeftWidth: 4,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 12, elevation: 8,
  },
  icon: { fontSize: 32 },
  textWrap: { flex: 1 },
  label: { fontSize: 10, color: C5.textMuted, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
  title: { fontSize: 15, fontWeight: '800', color: C5.textPrimary, marginTop: 1 },
  desc: { fontSize: 12, color: C5.textSecondary, marginTop: 1 },
  xp: { fontSize: 14, fontWeight: '900' },
});


// ============================================================
// src/components/ui/PremiumBadge.tsx
// Badge "Premium" à afficher sur le contenu verrouillé
// ============================================================
import React2 from 'react';
import { View, Text, TouchableOpacity, StyleSheet as S6 } from 'react-native';
import { router as rtr } from 'expo-router';
import { COLORS as C6, SPACING as SP6, BORDER_RADIUS as BR6 } from '@/constants';

interface PremiumBadgeProps {
  size?: 'sm' | 'md';
  showCTA?: boolean;
}

export function PremiumBadge({ size = 'md', showCTA = false }: PremiumBadgeProps) {
  return (
    <View style={pb.wrap}>
      <View style={[pb.badge, size === 'sm' && pb.badgeSm]}>
        <Text style={[pb.text, size === 'sm' && pb.textSm]}>⭐ Premium</Text>
      </View>
      {showCTA && (
        <TouchableOpacity style={pb.cta} onPress={() => rtr.push('/(tabs)/premium')}>
          <Text style={pb.ctaTxt}>Débloquer →</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const pb = S6.create({
  wrap: { alignItems: 'flex-start', gap: 8 },
  badge: {
    backgroundColor: '#FFF8DC', borderRadius: BR6.full,
    paddingHorizontal: 12, paddingVertical: 5,
    borderWidth: 1.5, borderColor: '#D4AF37',
  },
  badgeSm: { paddingHorizontal: 8, paddingVertical: 3 },
  text: { fontSize: 12, fontWeight: '800', color: '#92400E' },
  textSm: { fontSize: 10 },
  cta: {
    backgroundColor: C6.primary, borderRadius: BR6.full,
    paddingHorizontal: 16, paddingVertical: 8,
  },
  ctaTxt: { color: C6.white, fontSize: 13, fontWeight: '800' },
});


// ============================================================
// src/components/ui/AudioButton.tsx
// Bouton lecture audio avec état de chargement
// ============================================================
import { TouchableOpacity as TO, Text as T, StyleSheet as S7, ActivityIndicator as AI } from 'react-native';
import { useSimpleAudio } from '@/hooks/useAudio';
import { COLORS as C7, BORDER_RADIUS as BR7 } from '@/constants';

interface AudioButtonProps {
  uri: string;
  size?: 'sm' | 'md' | 'lg';
  speed?: number;
}

export function AudioButton({ uri, size = 'md', speed = 1.0 }: AudioButtonProps) {
  const { playUri, isPlaying } = useSimpleAudio();
  const sizes = { sm: 32, md: 44, lg: 56 };
  const emojis = { sm: 14, md: 18, lg: 22 };
  const sz = sizes[size];
  const es = emojis[size];

  return (
    <TO
      style={[
        ab.btn,
        { width: sz, height: sz, borderRadius: sz / 2 },
        isPlaying && ab.btnActive,
      ]}
      onPress={() => playUri(uri, speed)}
      disabled={isPlaying}
    >
      {isPlaying
        ? <AI size={es - 4} color={C7.primary} />
        : <T style={{ fontSize: es }}>🔊</T>
      }
    </TO>
  );
}

const ab = S7.create({
  btn: {
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: C7.primary + '15',
    borderWidth: 1.5, borderColor: C7.primary + '30',
  },
  btnActive: {
    backgroundColor: C7.primary + '25',
    borderColor: C7.primary,
  },
});

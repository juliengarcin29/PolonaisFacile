// ============================================================
// src/components/lesson/AudioPlayer.tsx
// Lecteur audio complet — vitesse, répétition, progression
// ============================================================

import { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, ActivityIndicator,
} from 'react-native';
import { useAudio } from '@/hooks/useAudio';
import { COLORS, SPACING, BORDER_RADIUS } from '@/constants';

interface AudioPlayerProps {
  uri: string;
  label?: string;           // ex: "Dziękuję"
  phonetic?: string;        // ex: "[dʑɛŋkujɛ]"
  compact?: boolean;        // version bouton seul
  autoplay?: boolean;
}

const SPEED_OPTIONS = [0.5, 0.75, 1.0, 1.25, 1.5] as const;

export function AudioPlayer({
  uri, label, phonetic, compact = false, autoplay = false,
}: AudioPlayerProps) {
  const [speed, setSpeed] = useState(1.0);
  const [loopCount, setLoopCount] = useState(0);
  const [maxLoops, setMaxLoops] = useState(1);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const { play, pause, replay, setSpeed: updateSpeed, status, progressPercent, isPlaying, isLoading } = useAudio(uri, { autoplay });

  // Animation de la barre de progression
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progressPercent,
      duration: 100,
      useNativeDriver: false,
    }).start();
  }, [progressPercent]);

  // Pulse quand en lecture
  useEffect(() => {
    if (isPlaying) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.08, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1.0, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isPlaying]);

  // Gérer les répétitions automatiques
  useEffect(() => {
    if (status === 'finished' && loopCount < maxLoops - 1) {
      setLoopCount(prev => prev + 1);
      setTimeout(() => replay(), 500);
    }
  }, [status]);

  const handleSpeedChange = () => {
    const currentIdx = SPEED_OPTIONS.indexOf(speed as typeof SPEED_OPTIONS[number]);
    const nextIdx = (currentIdx + 1) % SPEED_OPTIONS.length;
    const newSpeed = SPEED_OPTIONS[nextIdx];
    setSpeed(newSpeed);
    updateSpeed(newSpeed);
  };

  const handleLoopToggle = () => {
    setMaxLoops(prev => prev === 1 ? 3 : 1);
    setLoopCount(0);
  };

  // ── Version compacte (bouton seul) ──────────────────────
  if (compact) {
    return (
      <TouchableOpacity
        style={[s.compactBtn, isPlaying && s.compactBtnActive]}
        onPress={isPlaying ? pause : play}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={COLORS.primary} />
        ) : (
          <Animated.Text style={[s.compactIcon, { transform: [{ scale: pulseAnim }] }]}>
            {isPlaying ? '⏸' : '🔊'}
          </Animated.Text>
        )}
      </TouchableOpacity>
    );
  }

  // ── Version complète ─────────────────────────────────────
  return (
    <View style={s.container}>
      {/* Label et phonétique */}
      {(label || phonetic) && (
        <View style={s.labelWrap}>
          {label && <Text style={s.labelWord}>{label}</Text>}
          {phonetic && <Text style={s.labelPhonetic}>{phonetic}</Text>}
        </View>
      )}

      {/* Barre de progression */}
      <View style={s.progressTrack}>
        <Animated.View style={[
          s.progressFill,
          { width: progressAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }) },
        ]} />
      </View>

      {/* Contrôles */}
      <View style={s.controls}>
        {/* Vitesse */}
        <TouchableOpacity style={s.speedBtn} onPress={handleSpeedChange}>
          <Text style={s.speedTxt}>{speed}×</Text>
        </TouchableOpacity>

        {/* Lecture / Pause */}
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <TouchableOpacity
            style={[s.playBtn, isPlaying && s.playBtnActive]}
            onPress={isPlaying ? pause : (status === 'finished' ? replay : play)}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={COLORS.white} size="small" />
            ) : (
              <Text style={s.playIcon}>
                {isPlaying ? '⏸' : status === 'finished' ? '↩' : '▶'}
              </Text>
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* Répétition */}
        <TouchableOpacity
          style={[s.loopBtn, maxLoops > 1 && s.loopBtnActive]}
          onPress={handleLoopToggle}
        >
          <Text style={s.loopTxt}>
            {maxLoops > 1 ? `🔁×${maxLoops}` : '🔁'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Statut */}
      <Text style={s.statusTxt}>
        {isLoading ? 'Chargement...'
          : isPlaying ? 'En lecture...'
          : status === 'finished' ? 'Terminé'
          : 'Appuyez pour écouter'}
      </Text>
    </View>
  );
}

// ── Bouton audio ultra-simple (inline dans les exercices) ────
export function InlineAudioButton({ uri, word }: { uri: string; word?: string }) {
  const { play, isPlaying, isLoading } = useAudio(uri);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.88, duration: 80, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();
    play();
  };

  return (
    <TouchableOpacity onPress={handlePress} disabled={isLoading || isPlaying} style={ia.wrap}>
      <Animated.View style={[ia.btn, isPlaying && ia.btnActive, { transform: [{ scale: scaleAnim }] }]}>
        {isLoading
          ? <ActivityIndicator size="small" color={COLORS.primary} />
          : <Text style={ia.icon}>{isPlaying ? '🔉' : '🔊'}</Text>
        }
      </Animated.View>
      {word && <Text style={ia.word}>{word}</Text>}
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg, gap: SPACING.md,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
    borderWidth: 1, borderColor: COLORS.surfaceAlt,
  },
  labelWrap: { alignItems: 'center', gap: 4 },
  labelWord: { fontSize: 28, fontWeight: '900', color: COLORS.primary },
  labelPhonetic: { fontSize: 14, color: COLORS.textMuted, fontStyle: 'italic' },

  progressTrack: {
    height: 4, backgroundColor: COLORS.surfaceAlt,
    borderRadius: BORDER_RADIUS.full, overflow: 'hidden',
  },
  progressFill: {
    height: '100%', backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.full,
  },

  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },

  speedBtn: {
    backgroundColor: COLORS.surfaceAlt, borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: 12, paddingVertical: 6,
    minWidth: 56, alignItems: 'center',
  },
  speedTxt: { fontSize: 13, fontWeight: '800', color: COLORS.textSecondary },

  playBtn: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: COLORS.primary, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  playBtnActive: { backgroundColor: COLORS.primaryDark ?? '#A50E2D' },
  playIcon: { fontSize: 20, color: COLORS.white },

  loopBtn: {
    backgroundColor: COLORS.surfaceAlt, borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: 12, paddingVertical: 6,
    minWidth: 56, alignItems: 'center',
  },
  loopBtnActive: { backgroundColor: COLORS.primary + '20', borderWidth: 1.5, borderColor: COLORS.primary },
  loopTxt: { fontSize: 13, fontWeight: '800', color: COLORS.textSecondary },

  statusTxt: { fontSize: 11, color: COLORS.textMuted, textAlign: 'center' },

  compactBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: COLORS.primary + '15',
    borderWidth: 1.5, borderColor: COLORS.primary + '30',
    alignItems: 'center', justifyContent: 'center',
  },
  compactBtnActive: { backgroundColor: COLORS.primary + '25', borderColor: COLORS.primary },
  compactIcon: { fontSize: 18 },
});

const ia = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  btn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.primary + '12',
    borderWidth: 1.5, borderColor: COLORS.primary + '25',
    alignItems: 'center', justifyContent: 'center',
  },
  btnActive: { backgroundColor: COLORS.primary + '22', borderColor: COLORS.primary },
  icon: { fontSize: 16 },
  word: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
});

// ============================================================
// src/hooks/useAudio.ts
// FIX PRODUCTION — Gestion audio mobile robuste
// Corrige : fuites mémoire, mode silencieux iOS, interruptions
// ============================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import { Audio, AVPlaybackStatus } from 'expo-av';
import * as Speech from 'expo-speech';

// ── Configuration audio système (UNE SEULE fois au démarrage) ──
let audioSessionConfigured = false;

async function configureAudioSession(): Promise<void> {
  if (audioSessionConfigured) return;
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,      // joue même en mode silencieux iPhone
      staysActiveInBackground: false,   // ne garde pas la session active en fond
      allowsRecordingIOS: false,
      shouldDuckAndroid: true,          // baisse le volume des autres apps sur Android
    });
    audioSessionConfigured = true;
  } catch (e) {
    console.warn('[Audio] Session config failed:', e);
  }
}

interface AudioState {
  isLoading: boolean;
  isPlaying: boolean;
  isError: boolean;
  duration: number;
  position: number;
}

export function useAudio() {
  const soundRef = useRef<Audio.Sound | null>(null);
  const isMountedRef = useRef(true);
  const currentUrlRef = useRef<string | null>(null);

  const [state, setState] = useState<AudioState>({
    isLoading: false, isPlaying: false, isError: false, duration: 0, position: 0,
  });

  useEffect(() => {
    isMountedRef.current = true;
    configureAudioSession();
    return () => {
      isMountedRef.current = false;
      cleanupSound();
      Speech.stop();
    };
  }, []);

  const setStateSafe = useCallback((update: Partial<AudioState>) => {
    if (isMountedRef.current) setState(prev => ({ ...prev, ...update }));
  }, []);

  const cleanupSound = useCallback(async () => {
    if (soundRef.current) {
      try {
        const status = await soundRef.current.getStatusAsync();
        if (status.isLoaded) {
          await soundRef.current.stopAsync();
          await soundRef.current.unloadAsync(); // CRITIQUE: libère la mémoire native
        }
      } catch { /* ignoré */ } finally {
        soundRef.current = null;
        currentUrlRef.current = null;
      }
    }
  }, []);

  const onPlaybackStatusUpdate = useCallback((status: AVPlaybackStatus) => {
    if (!isMountedRef.current) return;
    if (!status.isLoaded) {
      if (status.error) setStateSafe({ isError: true, isPlaying: false, isLoading: false });
      return;
    }
    setStateSafe({
      isPlaying: status.isPlaying, isLoading: false, isError: false,
      duration: status.durationMillis ?? 0, position: status.positionMillis ?? 0,
    });
    if (status.didJustFinish) setStateSafe({ isPlaying: false, position: 0 });
  }, [setStateSafe]);

  const playFromUrl = useCallback(async (url: string, rate = 1.0): Promise<void> => {
    // Réutiliser le son si même URL
    if (currentUrlRef.current === url && soundRef.current) {
      try {
        const s = await soundRef.current.getStatusAsync();
        if (s.isLoaded) { await soundRef.current.setPositionAsync(0); await soundRef.current.playAsync(); return; }
      } catch { /* recharger */ }
    }
    await cleanupSound();
    setStateSafe({ isLoading: true, isError: false, isPlaying: false });
    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: url },
        { shouldPlay: true, rate, volume: 1.0, isLooping: false, progressUpdateIntervalMillis: 500 },
        onPlaybackStatusUpdate,
      );
      if (!isMountedRef.current) { await sound.unloadAsync(); return; }
      soundRef.current = sound;
      currentUrlRef.current = url;
    } catch (e) {
      console.error('[Audio] Load error:', e);
      setStateSafe({ isError: true, isLoading: false, isPlaying: false });
    }
  }, [cleanupSound, onPlaybackStatusUpdate, setStateSafe]);

  const playTTS = useCallback((text: string, lang = 'pl-PL', rate = 0.85): void => {
    Speech.stop();
    if (soundRef.current) cleanupSound();
    Speech.speak(text, {
      language: lang, rate, pitch: 1.0,
      onStart: () => setStateSafe({ isPlaying: true }),
      onDone: () => setStateSafe({ isPlaying: false }),
      onError: () => setStateSafe({ isPlaying: false, isError: true }),
    });
  }, [cleanupSound, setStateSafe]);

  const stop = useCallback(async (): Promise<void> => {
    Speech.stop();
    if (soundRef.current) {
      try {
        const s = await soundRef.current.getStatusAsync();
        if (s.isLoaded && s.isPlaying) { await soundRef.current.stopAsync(); await soundRef.current.setPositionAsync(0); }
      } catch (e) { console.warn('[Audio] Stop error:', e); }
    }
    setStateSafe({ isPlaying: false, position: 0 });
  }, [setStateSafe]);

  const pause = useCallback(async (): Promise<void> => {
    if (soundRef.current) {
      try {
        const s = await soundRef.current.getStatusAsync();
        if (s.isLoaded && s.isPlaying) await soundRef.current.pauseAsync();
      } catch (e) { console.warn('[Audio] Pause error:', e); }
    }
    setStateSafe({ isPlaying: false });
  }, [setStateSafe]);

  const resume = useCallback(async (): Promise<void> => {
    if (soundRef.current) {
      try {
        const s = await soundRef.current.getStatusAsync();
        if (s.isLoaded && !s.isPlaying) await soundRef.current.playAsync();
      } catch (e) { console.warn('[Audio] Resume error:', e); }
    }
  }, []);

  const setRate = useCallback(async (rate: number): Promise<void> => {
    if (soundRef.current) {
      try {
        const s = await soundRef.current.getStatusAsync();
        if (s.isLoaded) await soundRef.current.setRateAsync(rate, true);
      } catch (e) { console.warn('[Audio] SetRate error:', e); }
    }
  }, []);

  return { state, playFromUrl, playTTS, stop, pause, resume, setRate, cleanup: cleanupSound };
}

// ── Hook dédié flashcards : stop OBLIGATOIRE entre chaque carte ──
export function useFlashcardAudio() {
  const { state, playFromUrl, playTTS, stop, cleanup } = useAudio();

  const playCard = useCallback(async (
    audioUrl: string | undefined, text: string, lang = 'pl-PL',
  ): Promise<void> => {
    await stop(); // Arrêt AVANT chargement = pas de chevauchement ni fuite
    if (audioUrl) await playFromUrl(audioUrl, 0.85);
    else playTTS(text, lang, 0.85);
  }, [stop, playFromUrl, playTTS]);

  return { isPlaying: state.isPlaying, isLoading: state.isLoading, isError: state.isError, playCard, stop, cleanup };
}

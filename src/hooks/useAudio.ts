// ============================================================
// src/hooks/useAudio.ts
// Gestion Audio SDK 57 (expo-audio & expo-speech)
// ============================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import { createAudioPlayer, AudioPlayer } from 'expo-audio';
import * as Speech from 'expo-speech';

interface AudioState {
  isLoading: boolean;
  isPlaying: boolean;
  isError: boolean;
}

export function useAudio() {
  const playerRef = useRef<AudioPlayer | null>(null);
  const isMountedRef = useRef(true);

  const [state, setState] = useState<AudioState>({
    isLoading: false,
    isPlaying: false,
    isError: false,
  });

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      stop();
    };
  }, []);

  const stop = useCallback(async (): Promise<void> => {
    Speech.stop();
    if (playerRef.current) {
      try {
        playerRef.current.pause();
      } catch {
        // Ignorer
      }
      playerRef.current = null;
    }
    if (isMountedRef.current) {
      setState({ isLoading: false, isPlaying: false, isError: false });
    }
  }, []);

  const playTTS = useCallback((text: string, lang = 'pl-PL', rate = 0.85): void => {
    stop();
    Speech.speak(text, {
      language: lang,
      rate,
      pitch: 1.0,
      onStart: () => {
        if (isMountedRef.current) setState({ isLoading: false, isPlaying: true, isError: false });
      },
      onDone: () => {
        if (isMountedRef.current) setState({ isLoading: false, isPlaying: false, isError: false });
      },
      onError: () => {
        if (isMountedRef.current) setState({ isLoading: false, isPlaying: false, isError: true });
      },
    });
  }, [stop]);

  const playFromUrl = useCallback(async (url: string, rate = 0.85): Promise<void> => {
    await stop();
    if (isMountedRef.current) setState({ isLoading: true, isPlaying: false, isError: false });

    try {
      // 🚀 Requête HEAD ultra-légère pour vérifier l'existence réelle du fichier (200 OK)
      const response = await fetch(url, { method: 'HEAD' });
      if (!response.ok) {
        throw new Error(`Fichier audio distant introuvable (HTTP ${response.status})`);
      }

      const player = createAudioPlayer(url);
      playerRef.current = player;
      player.setPlaybackRate(rate);
      player.play();
      if (isMountedRef.current) setState({ isLoading: false, isPlaying: true, isError: false });
    } catch (e) {
      console.warn('[Audio] Erreur de chargement audio distant, bascule sur TTS:', e);
      if (isMountedRef.current) setState({ isLoading: false, isPlaying: false, isError: true });
      throw e; // 🛑 Rejeter l'erreur pour que playCard bascule immédiatement sur playTTS
    }
  }, [stop]);

  return {
    state,
    playFromUrl,
    playTTS,
    stop,
  };
}

// ── Hook dédié aux cartes et découverte : bascule automatique ──
export function useFlashcardAudio() {
  const { state, playFromUrl, playTTS, stop } = useAudio();

  const playCard = useCallback(async (
    audioUrl: string | undefined,
    text: string,
    lang = 'pl-PL',
  ): Promise<void> => {
    await stop();
    if (audioUrl) {
      try {
        await playFromUrl(audioUrl, 0.85);
      } catch {
        // 🔄 Fallback automatique sur la synthèse vocale TTS si le MP3 distant n'existe pas (404)
        playTTS(text, lang, 0.85);
      }
    } else {
      playTTS(text, lang, 0.85);
    }
  }, [stop, playFromUrl, playTTS]);

  return {
    isPlaying: state.isPlaying,
    isLoading: state.isLoading,
    isError: state.isError,
    playCard,
    stop,
  };
}

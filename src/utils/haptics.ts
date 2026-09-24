// ============================================================
// src/utils/haptics.ts
// Service centralisé de gestion des retours haptiques
// ============================================================

import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Vibrer pour une erreur (ex: mauvaise réponse)
 */
export async function triggerHapticError(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  } catch {
    // Ignorer si non supporté sur le device/simulateur
  }
}

/**
 * Impact haptique au clic sur un bouton ou option
 */
export async function triggerHapticImpact(
  style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light
): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await Haptics.impactAsync(style);
  } catch {
    // Ignorer
  }
}

/**
 * Retour haptique lors d'une sélection
 */
export async function triggerHapticSelection(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await Haptics.selectionAsync();
  } catch {
    // Ignorer
  }
}

// ============================================================
// src/config/theme.ts
// Système de thème complet — light + dark mode
// ============================================================

export interface AppTheme {
  colors: {
    // Fonds
    background: string;
    surface: string;
    surfaceAlt: string;
    surfaceElevated: string;
    // Texte
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    textInverse: string;
    // Marque
    primary: string;
    primaryDark: string;
    primaryLight: string;
    primarySurface: string;
    // États
    success: string;
    successLight: string;
    error: string;
    errorLight: string;
    warning: string;
    warningLight: string;
    info: string;
    infoLight: string;
    // Gamification
    xpGold: string;
    streakOrange: string;
    premiumGold: string;
    // Bordures
    border: string;
    borderStrong: string;
    // Ombres
    shadow: string;
  };
  spacing: {
    xs: number; sm: number; md: number;
    lg: number; xl: number; xxl: number;
  };
  radius: {
    sm: number; md: number; lg: number;
    xl: number; xxl: number; full: number;
  };
  typography: {
    sizes: { xs: number; sm: number; md: number; lg: number; xl: number; xxl: number; xxxl: number };
    weights: { regular: '400'; medium: '500'; semibold: '600'; bold: '700'; extrabold: '800'; black: '900' };
    lineHeights: { tight: number; normal: number; relaxed: number };
  };
}

// ── Thème clair ───────────────────────────────────────────────
export const lightTheme: AppTheme = {
  colors: {
    background: '#F8F9FA',
    surface: '#FFFFFF',
    surfaceAlt: '#F0F2F5',
    surfaceElevated: '#FFFFFF',
    textPrimary: '#1A1A2E',
    textSecondary: '#4A5568',
    textMuted: '#9CA3AF',
    textInverse: '#FFFFFF',
    primary: '#DC143C',
    primaryDark: '#A50E2D',
    primaryLight: '#FF4D6D',
    primarySurface: 'rgba(220,20,60,0.08)',
    success: '#22C55E',
    successLight: '#DCFCE7',
    error: '#EF4444',
    errorLight: '#FEE2E2',
    warning: '#F59E0B',
    warningLight: '#FEF3C7',
    info: '#3B82F6',
    infoLight: '#DBEAFE',
    xpGold: '#F59E0B',
    streakOrange: '#FF6B35',
    premiumGold: '#D4AF37',
    border: 'rgba(0,0,0,0.08)',
    borderStrong: 'rgba(0,0,0,0.16)',
    shadow: 'rgba(0,0,0,0.08)',
  },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 },
  radius: { sm: 6, md: 10, lg: 14, xl: 20, xxl: 28, full: 9999 },
  typography: {
    sizes: { xs: 11, sm: 13, md: 15, lg: 17, xl: 20, xxl: 24, xxxl: 32 },
    weights: {
      regular: '400', medium: '500', semibold: '600',
      bold: '700', extrabold: '800', black: '900',
    },
    lineHeights: { tight: 1.2, normal: 1.5, relaxed: 1.8 },
  },
};

// ── Thème sombre ──────────────────────────────────────────────
export const darkTheme: AppTheme = {
  ...lightTheme,
  colors: {
    ...lightTheme.colors,
    background: '#0F172A',
    surface: '#1E293B',
    surfaceAlt: '#2D3748',
    surfaceElevated: '#334155',
    textPrimary: '#F1F5F9',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
    textInverse: '#1A1A2E',
    primary: '#FF4D6D',
    primaryDark: '#DC143C',
    primaryLight: '#FF8096',
    primarySurface: 'rgba(255,77,109,0.12)',
    successLight: 'rgba(34,197,94,0.15)',
    errorLight: 'rgba(239,68,68,0.15)',
    warningLight: 'rgba(245,158,11,0.15)',
    infoLight: 'rgba(59,130,246,0.15)',
    border: 'rgba(255,255,255,0.08)',
    borderStrong: 'rgba(255,255,255,0.16)',
    shadow: 'rgba(0,0,0,0.3)',
  },
};

// ── Hook de thème ─────────────────────────────────────────────
import { useColorScheme } from 'react-native';
import { useMemo } from 'react';

export function useTheme(): AppTheme {
  const colorScheme = useColorScheme();
  return useMemo(
    () => colorScheme === 'dark' ? darkTheme : lightTheme,
    [colorScheme]
  );
}

// Export par défaut
export default lightTheme;

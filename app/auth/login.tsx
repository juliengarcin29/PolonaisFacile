// ============================================================
// app/auth/login.tsx
// Écran de connexion — email, anonyme, lier son compte
// ============================================================

import { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
  TextInput, KeyboardAvoidingView, Platform, ScrollView,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { COLORS, SPACING, BORDER_RADIUS } from '@/constants';

type AuthMode = 'login' | 'signup';

export default function LoginScreen() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { signInWithEmail, signUpWithEmail, isLoading, error } = useAuth();

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) return;

    if (mode === 'login') {
      const result = await signInWithEmail(email.trim(), password);
      if (result.success) router.replace('/(tabs)');
    } else {
      if (!displayName.trim()) return;
      const result = await signUpWithEmail(email.trim(), password, displayName.trim());
      if (result.success) router.replace('/(tabs)');
    }
  };

  const isFormValid = mode === 'login'
    ? email.trim().length > 0 && password.length >= 6
    : email.trim().length > 0 && password.length >= 6 && displayName.trim().length > 0;

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={s.header}>
            <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
              <Text style={s.backTxt}>← Retour</Text>
            </TouchableOpacity>
          </View>

          {/* Titre */}
          <View style={s.titleWrap}>
            <Text style={s.emoji}>🇵🇱</Text>
            <Text style={s.title}>
              {mode === 'login' ? 'Bon retour !' : 'Créer un compte'}
            </Text>
            <Text style={s.subtitle}>
              {mode === 'login'
                ? 'Connectez-vous pour retrouver votre progression'
                : 'Sauvegardez votre progression sur tous vos appareils'}
            </Text>
          </View>

          {/* Formulaire */}
          <View style={s.form}>
            {/* Prénom (inscription uniquement) */}
            {mode === 'signup' && (
              <View style={s.fieldWrap}>
                <Text style={s.fieldLabel}>Prénom</Text>
                <TextInput
                  style={s.input}
                  placeholder="Votre prénom"
                  placeholderTextColor={COLORS.textMuted}
                  value={displayName}
                  onChangeText={setDisplayName}
                  autoCapitalize="words"
                  returnKeyType="next"
                />
              </View>
            )}

            {/* Email */}
            <View style={s.fieldWrap}>
              <Text style={s.fieldLabel}>Email</Text>
              <TextInput
                style={s.input}
                placeholder="vous@exemple.com"
                placeholderTextColor={COLORS.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
              />
            </View>

            {/* Mot de passe */}
            <View style={s.fieldWrap}>
              <Text style={s.fieldLabel}>Mot de passe</Text>
              <View style={s.inputRow}>
                <TextInput
                  style={[s.input, { flex: 1, marginBottom: 0 }]}
                  placeholder="6 caractères minimum"
                  placeholderTextColor={COLORS.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit}
                />
                <TouchableOpacity
                  style={s.eyeBtn}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Text style={s.eyeTxt}>{showPassword ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Message d'erreur */}
            {error && (
              <View style={s.errorBox}>
                <Text style={s.errorTxt}>⚠️ {error}</Text>
              </View>
            )}

            {/* Bouton principal */}
            <TouchableOpacity
              style={[s.submitBtn, (!isFormValid || isLoading) && s.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={!isFormValid || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={s.submitBtnTxt}>
                  {mode === 'login' ? 'Se connecter →' : 'Créer mon compte →'}
                </Text>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={s.divider}>
              <View style={s.dividerLine} />
              <Text style={s.dividerTxt}>ou</Text>
              <View style={s.dividerLine} />
            </View>

            {/* Continuer sans compte */}
            <TouchableOpacity
              style={s.skipBtn}
              onPress={() => router.replace('/(tabs)')}
            >
              <Text style={s.skipTxt}>Continuer sans compte</Text>
            </TouchableOpacity>
          </View>

          {/* Toggle login/signup */}
          <View style={s.toggleRow}>
            <Text style={s.toggleTxt}>
              {mode === 'login' ? 'Pas encore de compte ?' : 'Déjà un compte ?'}
            </Text>
            <TouchableOpacity onPress={() => setMode(mode === 'login' ? 'signup' : 'login')}>
              <Text style={s.toggleLink}>
                {mode === 'login' ? "S'inscrire" : 'Se connecter'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Mention légale */}
          <Text style={s.legal}>
            En continuant, vous acceptez nos{' '}
            <Text style={s.legalLink}>Conditions d'utilisation</Text>
            {' '}et notre{' '}
            <Text style={s.legalLink}>Politique de confidentialité</Text>.
          </Text>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.white },
  scroll: { padding: SPACING.lg, paddingBottom: SPACING.xxl },

  header: { marginBottom: SPACING.lg },
  backBtn: { alignSelf: 'flex-start', padding: 4 },
  backTxt: { fontSize: 15, color: COLORS.primary, fontWeight: '600' },

  titleWrap: { alignItems: 'center', marginBottom: SPACING.xl },
  emoji: { fontSize: 48, marginBottom: SPACING.sm },
  title: {
    fontSize: 28, fontWeight: '900', color: COLORS.textPrimary,
    marginBottom: 8, textAlign: 'center',
  },
  subtitle: {
    fontSize: 14, color: COLORS.textSecondary,
    textAlign: 'center', lineHeight: 20, maxWidth: 280,
  },

  form: { gap: SPACING.md },
  fieldWrap: { gap: 6 },
  fieldLabel: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary },
  input: {
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: 14,
    fontSize: 15,
    color: COLORS.textPrimary,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eyeBtn: {
    width: 48, height: 48, alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.surfaceAlt, borderRadius: BORDER_RADIUS.lg,
  },
  eyeTxt: { fontSize: 18 },

  errorBox: {
    backgroundColor: COLORS.errorLight, borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md, borderWidth: 1, borderColor: COLORS.error + '40',
  },
  errorTxt: { fontSize: 13, color: COLORS.error, fontWeight: '600' },

  submitBtn: {
    backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.full,
    paddingVertical: 16, alignItems: 'center', marginTop: SPACING.sm,
  },
  submitBtnDisabled: { opacity: 0.45 },
  submitBtnTxt: { color: COLORS.white, fontSize: 16, fontWeight: '800' },

  divider: {
    flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 4,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.surfaceAlt },
  dividerTxt: { fontSize: 12, color: COLORS.textMuted, fontWeight: '600' },

  skipBtn: {
    backgroundColor: COLORS.surfaceAlt, borderRadius: BORDER_RADIUS.full,
    paddingVertical: 14, alignItems: 'center',
  },
  skipTxt: { fontSize: 15, color: COLORS.textSecondary, fontWeight: '600' },

  toggleRow: {
    flexDirection: 'row', justifyContent: 'center', gap: 6,
    marginTop: SPACING.xl,
  },
  toggleTxt: { fontSize: 14, color: COLORS.textSecondary },
  toggleLink: { fontSize: 14, color: COLORS.primary, fontWeight: '700' },

  legal: {
    fontSize: 11, color: COLORS.textMuted, textAlign: 'center',
    marginTop: SPACING.lg, lineHeight: 16,
  },
  legalLink: { color: COLORS.primary, fontWeight: '600' },
});

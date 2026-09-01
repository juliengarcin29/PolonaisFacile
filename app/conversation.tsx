// ============================================================
// app/conversation.tsx
// IA conversationnelle — pratiquer le polonais avec l'IA
// Fonctionnalité Premium uniquement
// ============================================================

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
  ScrollView, TextInput, KeyboardAvoidingView, Platform,
  ActivityIndicator, Animated,
} from 'react-native';
import { router } from 'expo-router';
import { useUserStore } from '@/store/userStore';
import { usePremiumGate } from '@/hooks/usePremiumGate';
import { COLORS, SPACING, BORDER_RADIUS } from '@/constants';

// ── Types ────────────────────────────────────────────────────
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  translation?: string;
  corrections?: string[];
  timestamp: Date;
}

interface ConversationScenario {
  id: string;
  title: string;
  emoji: string;
  description: string;
  systemPrompt: string;
  difficulty: 'A1' | 'A2' | 'B1';
  starterMessage: string;
}

// ── Scénarios de conversation ────────────────────────────────
const SCENARIOS: ConversationScenario[] = [
  {
    id: 'cafe',
    title: 'Au café',
    emoji: '☕',
    description: 'Commander un café et discuter avec le barista',
    difficulty: 'A1',
    starterMessage: 'Dzień dobry! Co mogę dla pana/pani zrobić?',
    systemPrompt: `Tu es un barista polonais sympa dans un café de Varsovie. 
L'utilisateur est un francophone qui apprend le polonais.
RÈGLES IMPORTANTES :
- Parle uniquement en polonais, mais reste simple (niveau A1)
- Après chaque réponse polonaise, donne la traduction française entre [FR: ...]
- Si l'utilisateur fait une erreur, corrige-le gentiment entre [CORRECTION: ...]
- Utilise des mots simples : kawa (café), herbata (thé), proszę (s'il vous plaît)
- Reste dans le contexte d'un café
- Propose des suggestions si l'utilisateur est bloqué`,
  },
  {
    id: 'market',
    title: 'Au marché',
    emoji: '🛒',
    description: 'Acheter des fruits et légumes en polonais',
    difficulty: 'A1',
    starterMessage: 'Dzień dobry! Co pan/pani chce kupić dzisiaj?',
    systemPrompt: `Tu es un vendeur de marché polonais à Cracovie.
L'utilisateur est un francophone qui apprend le polonais.
RÈGLES :
- Parle en polonais simple (A1), avec traduction française [FR: ...]
- Corrige les erreurs grammaticales [CORRECTION: ...]
- Vocabulaire : jabłko (pomme), chleb (pain), ile kosztuje (combien ça coûte)
- Reste dans le contexte du marché`,
  },
  {
    id: 'directions',
    title: 'Demander son chemin',
    emoji: '🗺️',
    description: 'Se repérer dans une ville polonaise',
    difficulty: 'A2',
    starterMessage: 'Hej, czy mogę panu/pani pomóc?',
    systemPrompt: `Tu es un habitant de Varsovie qui aide un touriste.
L'utilisateur est un francophone qui apprend le polonais.
RÈGLES :
- Parle en polonais (A2), avec traduction française [FR: ...]
- Corrige les erreurs [CORRECTION: ...]
- Vocabulaire : prosto (tout droit), w lewo (à gauche), w prawo (à droite)
- Mentionne des lieux connus : Stare Miasto, Zamek Królewski`,
  },
  {
    id: 'family',
    title: 'Parler de sa famille',
    emoji: '👨‍👩‍👧',
    description: 'Décrire sa famille en polonais',
    difficulty: 'A1',
    starterMessage: 'Cześć! Opowiedz mi o swojej rodzinie!',
    systemPrompt: `Tu es un ami polonais curieux et bienveillant.
L'utilisateur est un francophone qui apprend le polonais.
RÈGLES :
- Parle en polonais (A1-A2), avec traduction française [FR: ...]
- Corrige les erreurs [CORRECTION: ...]
- Vocabulaire : rodzina (famille), mama (maman), tata (papa), brat (frère)
- Pose des questions simples pour encourager la conversation`,
  },
  {
    id: 'free',
    title: 'Conversation libre',
    emoji: '💬',
    description: 'Discuter librement en polonais',
    difficulty: 'B1',
    starterMessage: 'Cześć! Jak się masz? O czym chcesz porozmawiać?',
    systemPrompt: `Tu es un tuteur de langue polonaise bienveillant.
L'utilisateur est un francophone intermédiaire en polonais.
RÈGLES :
- Parle en polonais (adapte ton niveau à l'utilisateur)
- Donne la traduction si nécessaire [FR: ...]
- Corrige les erreurs importantes [CORRECTION: ...]
- Encourage et motive l'utilisateur
- Adapte-toi au sujet que l'utilisateur choisit`,
  },
];

// ── Fonction d'appel à l'API Claude ──────────────────────────
async function callClaudeAPI(
  messages: Array<{ role: string; content: string }>,
  systemPrompt: string,
): Promise<string> {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        system: systemPrompt,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
      }),
    });

    if (!response.ok) throw new Error(`API error: ${response.status}`);
    const data = await response.json();
    return data.content?.[0]?.text ?? 'Désolé, je n\'ai pas compris. Pouvez-vous répéter ?';
  } catch (error) {
    console.error('Erreur API Claude:', error);
    throw error;
  }
}

// ── Parsing de la réponse ────────────────────────────────────
function parseAssistantResponse(raw: string): {
  mainText: string;
  translation?: string;
  corrections: string[];
} {
  let mainText = raw;
  let translation: string | undefined;
  const corrections: string[] = [];

  // Extraire la traduction [FR: ...]
  const frMatch = raw.match(/\[FR:\s*([^\]]+)\]/i);
  if (frMatch) {
    translation = frMatch[1].trim();
    mainText = mainText.replace(frMatch[0], '').trim();
  }

  // Extraire les corrections [CORRECTION: ...]
  const correctionMatches = raw.matchAll(/\[CORRECTION:\s*([^\]]+)\]/gi);
  for (const match of correctionMatches) {
    corrections.push(match[1].trim());
    mainText = mainText.replace(match[0], '').trim();
  }

  return { mainText: mainText.trim(), translation, corrections };
}

// ── Composant principal ──────────────────────────────────────
export default function ConversationScreen() {
  const { user } = useUserStore();
  const { isPremium, requirePremium } = usePremiumGate();

  const [selectedScenario, setSelectedScenario] = useState<ConversationScenario | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showTranslations, setShowTranslations] = useState(true);
  const [sessionXP, setSessionXP] = useState(0);

  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Vérifier Premium au montage
  useEffect(() => {
    if (!isPremium) {
      requirePremium('default');
    }
  }, [isPremium]);

  // Scroll automatique
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  // Démarrer un scénario
  const startScenario = useCallback((scenario: ConversationScenario) => {
    setSelectedScenario(scenario);
    setMessages([]);
    setSessionXP(0);

    const starterMsg: Message = {
      id: `msg_${Date.now()}`,
      role: 'assistant',
      content: scenario.starterMessage,
      translation: undefined,
      corrections: [],
      timestamp: new Date(),
    };
    setMessages([starterMsg]);

    Animated.timing(fadeAnim, {
      toValue: 1, duration: 400, useNativeDriver: true,
    }).start();
  }, []);

  // Envoyer un message
  const sendMessage = useCallback(async () => {
    if (!inputText.trim() || !selectedScenario || isLoading) return;

    const userMsg: Message = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: inputText.trim(),
      corrections: [],
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const apiMessages = [
        ...messages.map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: inputText.trim() },
      ];

      const rawResponse = await callClaudeAPI(apiMessages, selectedScenario.systemPrompt);
      const parsed = parseAssistantResponse(rawResponse);

      const assistantMsg: Message = {
        id: `msg_${Date.now() + 1}`,
        role: 'assistant',
        content: parsed.mainText,
        translation: parsed.translation,
        corrections: parsed.corrections,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMsg]);

      // XP pour chaque échange
      const xpGained = 15 + (parsed.corrections.length === 0 ? 10 : 0);
      setSessionXP(prev => prev + xpGained);
    } catch (error) {
      const errorMsg: Message = {
        id: `msg_error_${Date.now()}`,
        role: 'assistant',
        content: 'Przepraszam, wystąpił błąd. Spróbuj ponownie!',
        translation: 'Désolé, une erreur est survenue. Réessayez !',
        corrections: [],
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  }, [inputText, selectedScenario, isLoading, messages]);

  // ── Sélection du scénario ────────────────────────────────
  if (!selectedScenario) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
            <Text style={s.backTxt}>← Retour</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle}>Conversation IA 🤖</Text>
        </View>

        <ScrollView contentContainerStyle={s.scenarioList}>
          <Text style={s.scenarioIntro}>
            Pratiquez le polonais avec notre IA en choisissant une situation du quotidien.
          </Text>

          {SCENARIOS.map((scenario) => (
            <TouchableOpacity
              key={scenario.id}
              style={s.scenarioCard}
              onPress={() => startScenario(scenario)}
              activeOpacity={0.8}
            >
              <View style={s.scenarioLeft}>
                <Text style={s.scenarioEmoji}>{scenario.emoji}</Text>
              </View>
              <View style={s.scenarioBody}>
                <View style={s.scenarioTitleRow}>
                  <Text style={s.scenarioTitle}>{scenario.title}</Text>
                  <View style={[s.diffBadge, {
                    backgroundColor: scenario.difficulty === 'A1'
                      ? COLORS.successLight
                      : scenario.difficulty === 'A2'
                      ? COLORS.warningLight
                      : COLORS.infoLight,
                  }]}>
                    <Text style={[s.diffTxt, {
                      color: scenario.difficulty === 'A1'
                        ? COLORS.success
                        : scenario.difficulty === 'A2'
                        ? COLORS.warning
                        : COLORS.info,
                    }]}>{scenario.difficulty}</Text>
                  </View>
                </View>
                <Text style={s.scenarioDesc}>{scenario.description}</Text>
              </View>
              <Text style={s.scenarioArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Interface de conversation ────────────────────────────
  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        {/* Header conversation */}
        <View style={s.chatHeader}>
          <TouchableOpacity
            style={s.backBtn}
            onPress={() => setSelectedScenario(null)}
          >
            <Text style={s.backTxt}>←</Text>
          </TouchableOpacity>
          <View style={s.chatHeaderCenter}>
            <Text style={s.chatTitle}>
              {selectedScenario.emoji} {selectedScenario.title}
            </Text>
            <Text style={s.chatSubtitle}>
              {selectedScenario.difficulty} · ⭐ {sessionXP} XP
            </Text>
          </View>
          <TouchableOpacity
            style={s.translationToggle}
            onPress={() => setShowTranslations(!showTranslations)}
          >
            <Text style={s.translationToggleTxt}>
              {showTranslations ? '🇫🇷' : '🇵🇱'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={s.messages}
          contentContainerStyle={s.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              showTranslation={showTranslations}
            />
          ))}

          {isLoading && (
            <View style={[s.bubble, s.bubbleAssistant]}>
              <View style={s.typingIndicator}>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={s.typingTxt}>L'IA répond...</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Suggestions rapides */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={s.suggestionsWrap}
          contentContainerStyle={s.suggestionsContent}
        >
          {QUICK_REPLIES.map((reply) => (
            <TouchableOpacity
              key={reply}
              style={s.suggestionChip}
              onPress={() => setInputText(reply)}
            >
              <Text style={s.suggestionTxt}>{reply}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Input */}
        <View style={s.inputWrap}>
          <TextInput
            ref={inputRef}
            style={s.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Écrivez en polonais..."
            placeholderTextColor={COLORS.textMuted}
            multiline
            maxLength={300}
            returnKeyType="send"
            onSubmitEditing={sendMessage}
          />
          <TouchableOpacity
            style={[s.sendBtn, (!inputText.trim() || isLoading) && s.sendBtnDisabled]}
            onPress={sendMessage}
            disabled={!inputText.trim() || isLoading}
          >
            {isLoading
              ? <ActivityIndicator size="small" color={COLORS.white} />
              : <Text style={s.sendIcon}>▶</Text>
            }
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Bulle de message ─────────────────────────────────────────
function MessageBubble({
  message, showTranslation,
}: {
  message: Message;
  showTranslation: boolean;
}) {
  const isUser = message.role === 'user';

  return (
    <View style={[s.bubbleWrap, isUser && s.bubbleWrapUser]}>
      {!isUser && <Text style={s.avatar}>🤖</Text>}
      <View style={[s.bubble, isUser ? s.bubbleUser : s.bubbleAssistant]}>
        <Text style={[s.bubbleTxt, isUser && s.bubbleTxtUser]}>
          {message.content}
        </Text>

        {/* Traduction */}
        {!isUser && message.translation && showTranslation && (
          <View style={s.translationBox}>
            <Text style={s.translationLabel}>🇫🇷</Text>
            <Text style={s.translationTxt}>{message.translation}</Text>
          </View>
        )}

        {/* Corrections */}
        {message.corrections && message.corrections.length > 0 && (
          <View style={s.correctionsBox}>
            <Text style={s.correctionLabel}>✏️ Correction :</Text>
            {message.corrections.map((c, i) => (
              <Text key={i} style={s.correctionTxt}>{c}</Text>
            ))}
          </View>
        )}

        <Text style={s.timestamp}>
          {message.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </View>
  );
}

// ── Réponses rapides ─────────────────────────────────────────
const QUICK_REPLIES = [
  'Dzień dobry!',
  'Proszę...',
  'Dziękuję!',
  'Przepraszam...',
  'Nie rozumiem',
  'Ile kosztuje?',
  'Tak, proszę',
  'Nie, dziękuję',
];

// ── Styles ───────────────────────────────────────────────────
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },

  header: {
    flexDirection: 'row', alignItems: 'center',
    padding: SPACING.lg, gap: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1, borderBottomColor: COLORS.surfaceAlt,
  },
  backBtn: { padding: 4 },
  backTxt: { fontSize: 15, color: COLORS.primary, fontWeight: '600' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary, flex: 1 },

  scenarioList: { padding: SPACING.lg, gap: 12 },
  scenarioIntro: {
    fontSize: 14, color: COLORS.textSecondary,
    marginBottom: SPACING.sm, lineHeight: 20,
  },
  scenarioCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md, gap: 14,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
    borderWidth: 1, borderColor: COLORS.surfaceAlt,
  },
  scenarioLeft: {
    width: 52, height: 52, borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.primary + '12',
    alignItems: 'center', justifyContent: 'center',
  },
  scenarioEmoji: { fontSize: 26 },
  scenarioBody: { flex: 1 },
  scenarioTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  scenarioTitle: { fontSize: 15, fontWeight: '800', color: COLORS.textPrimary },
  diffBadge: {
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: BORDER_RADIUS.full,
  },
  diffTxt: { fontSize: 10, fontWeight: '800', letterSpacing: 0.3 },
  scenarioDesc: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 16 },
  scenarioArrow: { fontSize: 22, color: COLORS.textMuted },

  chatHeader: {
    flexDirection: 'row', alignItems: 'center',
    padding: SPACING.md, gap: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1, borderBottomColor: COLORS.surfaceAlt,
  },
  chatHeaderCenter: { flex: 1 },
  chatTitle: { fontSize: 15, fontWeight: '800', color: COLORS.textPrimary },
  chatSubtitle: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  translationToggle: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
  },
  translationToggleTxt: { fontSize: 18 },

  messages: { flex: 1 },
  messagesContent: { padding: SPACING.md, gap: 12, paddingBottom: SPACING.lg },

  bubbleWrap: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  bubbleWrapUser: { flexDirection: 'row-reverse' },
  avatar: { fontSize: 24, marginBottom: 4 },

  bubble: {
    maxWidth: '80%', borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md, gap: 6,
  },
  bubbleAssistant: {
    backgroundColor: COLORS.white,
    borderBottomLeftRadius: 4,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  bubbleUser: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  bubbleTxt: { fontSize: 15, color: COLORS.textPrimary, lineHeight: 22 },
  bubbleTxtUser: { color: COLORS.white },

  translationBox: {
    flexDirection: 'row', gap: 6, alignItems: 'flex-start',
    backgroundColor: COLORS.surfaceAlt, borderRadius: BORDER_RADIUS.md,
    padding: 8, marginTop: 4,
  },
  translationLabel: { fontSize: 12 },
  translationTxt: { fontSize: 12, color: COLORS.textSecondary, flex: 1, lineHeight: 16 },

  correctionsBox: {
    backgroundColor: COLORS.warningLight, borderRadius: BORDER_RADIUS.md,
    padding: 8, gap: 2,
  },
  correctionLabel: { fontSize: 11, fontWeight: '700', color: COLORS.warning },
  correctionTxt: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 16 },

  timestamp: { fontSize: 10, color: COLORS.textMuted, alignSelf: 'flex-end', marginTop: 2 },

  typingIndicator: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  typingTxt: { fontSize: 13, color: COLORS.textMuted },

  suggestionsWrap: { maxHeight: 48, backgroundColor: COLORS.white },
  suggestionsContent: { paddingHorizontal: SPACING.md, gap: 8, paddingVertical: 8 },
  suggestionChip: {
    backgroundColor: COLORS.primary + '12', borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: 14, paddingVertical: 6,
    borderWidth: 1, borderColor: COLORS.primary + '25',
  },
  suggestionTxt: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },

  inputWrap: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    padding: SPACING.md,
    backgroundColor: COLORS.white,
    borderTopWidth: 1, borderTopColor: COLORS.surfaceAlt,
  },
  input: {
    flex: 1, backgroundColor: COLORS.surfaceAlt,
    borderRadius: BORDER_RADIUS.xl, paddingHorizontal: SPACING.md,
    paddingVertical: 10, fontSize: 15, color: COLORS.textPrimary,
    maxHeight: 100, borderWidth: 1, borderColor: 'transparent',
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendIcon: { fontSize: 16, color: COLORS.white, marginLeft: 2 },
});

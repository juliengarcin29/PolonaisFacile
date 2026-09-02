// ============================================================
// src/content/dialogues/dialogues.ts
// Contenu des dialogues polonais
// ============================================================

export interface DialogueLine {
  id: string;
  speaker: 'A' | 'B';
  speakerName: string;
  text: string;
  translation: string;
  phonetic?: string;
}

export interface Dialogue {
  id: string;
  title: string;
  context: string;
  emoji: string;
  difficulty: 'A1' | 'A2' | 'B1';
  xpReward: number;
  lines: DialogueLine[];
  vocabulary: Array<{ pl: string; fr: string }>;
}

export const DIALOGUES: Dialogue[] = [
  {
    id: 'dialogue_01',
    title: 'Première rencontre',
    context: 'Anna et Piotr se rencontrent pour la première fois à Varsovie.',
    emoji: '🤝',
    difficulty: 'A1',
    xpReward: 80,
    vocabulary: [
      { pl: 'Nazywam się', fr: 'Je m\'appelle' },
      { pl: 'Skąd jesteś?', fr: 'D\'où es-tu ?' },
      { pl: 'Jestem z...', fr: 'Je suis de...' },
      { pl: 'Miło mi', fr: 'Enchanté(e)' },
    ],
    lines: [
      { id: 'l1', speaker: 'A', speakerName: 'Anna', text: 'Cześć! Jestem Anna. Jak masz na imię?', translation: 'Salut ! Je suis Anna. Comment tu t\'appelles ?', phonetic: '[tʂɛɕtɕ | ˈjɛstem ˈanna | jak maʂ na ˈimjɛ]' },
      { id: 'l2', speaker: 'B', speakerName: 'Piotr', text: 'Cześć, Anna! Nazywam się Piotr. Miło mi!', translation: 'Salut, Anna ! Je m\'appelle Piotr. Enchanté !', phonetic: '[ˈnazɨvam ɕɛ ˈpjɔtr | ˈmiwɔ mi]' },
      { id: 'l3', speaker: 'A', speakerName: 'Anna', text: 'Skąd jesteś, Piotr?', translation: 'D\'où es-tu, Piotr ?', phonetic: '[skɔnt ˈjɛstɛɕ]' },
      { id: 'l4', speaker: 'B', speakerName: 'Piotr', text: 'Jestem z Krakowa. A ty?', translation: 'Je suis de Cracovie. Et toi ?', phonetic: '[ˈjɛstem s ˈkrakɔva | a tɨ]' },
      { id: 'l5', speaker: 'A', speakerName: 'Anna', text: 'Ja jestem z Warszawy. Uczę się polskiego!', translation: 'Moi, je suis de Varsovie. J\'apprends le polonais !', phonetic: '[ja ˈjɛstem s varˈʂavɨ | ˈutʂɛ ɕɛ pɔlˈskiɛgɔ]' },
      { id: 'l6', speaker: 'B', speakerName: 'Piotr', text: 'Naprawdę? Świetnie mówisz po polsku!', translation: 'Vraiment ? Tu parles très bien polonais !', phonetic: '[naˈpravdɛ | ˈɕfjɛtɲɛ ˈmuviʂ pɔ ˈpɔlsku]' },
      { id: 'l7', speaker: 'A', speakerName: 'Anna', text: 'Dziękuję! Uczę się dopiero trzy miesiące.', translation: 'Merci ! J\'apprends depuis seulement trois mois.', phonetic: '[dʑɛŋˈkujɛ | ˈutʂɛ ɕɛ dɔˈpjɛrɔ tʂɨ ˈmjɛɕɔntse]' },
    ],
  },
  {
    id: 'dialogue_02',
    title: 'Au restaurant',
    context: 'Marie commande un repas dans un restaurant polonais.',
    emoji: '🍽️',
    difficulty: 'A1',
    xpReward: 100,
    vocabulary: [
      { pl: 'Poproszę', fr: 'Je voudrais / S\'il vous plaît' },
      { pl: 'Ile kosztuje?', fr: 'Combien ça coûte ?' },
      { pl: 'Czy jest...?', fr: 'Est-ce qu\'il y a... ?' },
      { pl: 'Rachunek', fr: 'L\'addition' },
    ],
    lines: [
      { id: 'l1', speaker: 'A', speakerName: 'Kelner', text: 'Dzień dobry! Co mogę przynieść?', translation: 'Bonjour ! Qu\'est-ce que je peux apporter ?' },
      { id: 'l2', speaker: 'B', speakerName: 'Marie', text: 'Dzień dobry! Poproszę kartę, proszę.', translation: 'Bonjour ! Le menu, s\'il vous plaît.' },
      { id: 'l3', speaker: 'A', speakerName: 'Kelner', text: 'Proszę très. Czy ma pani jakieś pytania?', translation: 'Voici. Avez-vous des questions ?' },
      { id: 'l4', speaker: 'B', speakerName: 'Marie', text: 'Tak. Czy są wegetariańskie pierogi?', translation: 'Oui. Est-ce qu\'il y a des pierogis végétariens ?' },
      { id: 'l5', speaker: 'A', speakerName: 'Kelner', text: 'Oczywiście! Mamy pierogi z kapustą i grzybami.', translation: 'Bien sûr ! Nous avons des pierogis à la choucroute et aux champignons.' },
      { id: 'l6', speaker: 'B', speakerName: 'Marie', text: 'Poproszę pierogi i wodę mineralną.', translation: 'Je voudrais les pierogis et une eau minérale.' },
      { id: 'l7', speaker: 'A', speakerName: 'Kelner', text: 'Doskonały wybór! Coś jeszcze?', translation: 'Excellent choix ! Autre chose ?' },
      { id: 'l8', speaker: 'B', speakerName: 'Marie', text: 'Nie, dziękuję. Ile to kosztuje?', translation: 'Non, merci. Combien ça coûte ?' },
      { id: 'l9', speaker: 'A', speakerName: 'Kelner', text: 'Dwadzieścia pięć złotych. Poproszę chwilę.', translation: 'Vingt-cinq zlotys. Un moment, s\'il vous plaît.' },
    ],
  },
  {
    id: 'dialogue_03',
    title: 'Dans le bus',
    context: 'Thomas demande son chemin dans un bus à Cracovie.',
    emoji: '🚌',
    difficulty: 'A2',
    xpReward: 120,
    vocabulary: [
      { pl: 'Przepraszam', fr: 'Excusez-moi' },
      { pl: 'Czy jedzie...?', fr: 'Est-ce que ça va à... ?' },
      { pl: 'Gdzie wysiadać?', fr: 'Où descendre ?' },
      { pl: 'Następny przystanek', fr: 'Le prochain arrêt' },
    ],
    lines: [
      { id: 'l1', speaker: 'A', speakerName: 'Thomas', text: 'Przepraszam! Czy ten autobus jedzie do Rynku?', translation: 'Excusez-moi ! Ce bus va-t-il à la place du marché ?' },
      { id: 'l2', speaker: 'B', speakerName: 'Pani', text: 'Tak, ten autobus jedzie do centrum.', translation: 'Oui, ce bus va au centre-ville.' },
      { id: 'l3', speaker: 'A', speakerName: 'Thomas', text: 'Gdzie powinienem wysiąść na Rynek Główny?', translation: 'Où dois-je descendre pour la Grand-Place ?' },
      { id: 'l4', speaker: 'B', speakerName: 'Pani', text: 'Trzecia stacja stąd. Przystanek Teatr Słowackiego.', translation: 'Troisième arrêt d\'ici. Arrêt Théâtre Słowacki.' },
      { id: 'l5', speaker: 'A', speakerName: 'Thomas', text: 'Dziękuję bardzo! Jak długo jedzie?', translation: 'Merci beaucoup ! Combien de temps dure le trajet ?' },
      { id: 'l6', speaker: 'B', speakerName: 'Pani', text: 'Około dziesięciu minut. To niedaleko.', translation: 'Environ dix minutes. Ce n\'est pas loin.' },
      { id: 'l7', speaker: 'A', speakerName: 'Thomas', text: 'Wspaniale! Dziękuję za pomoc!', translation: 'Super ! Merci pour l\'aide !' },
      { id: 'l8', speaker: 'B', speakerName: 'Pani', text: 'Nie ma za co! Miłego pobytu w Krakowie!', translation: 'De rien ! Bon séjour à Cracovie !' },
    ],
  },
  {
    id: 'dialogue_04',
    title: 'À l\'hôtel',
    context: 'Marek arrive à la réception d\'un hôtel à Cracovie pour s\'enregistrer.',
    emoji: '🏨',
    difficulty: 'A2',
    xpReward: 110,
    vocabulary: [
      { pl: 'Rezerwacja', fr: 'Réservation' },
      { pl: 'Pokój', fr: 'Chambre' },
      { pl: 'Klucz', fr: 'Clé' },
      { pl: 'Dowód osobisty', fr: 'Carte d\'identité' },
    ],
    lines: [
      { id: 'l1', speaker: 'A', speakerName: 'Recepcjonistka', text: 'Dzień dobry! W czym mogę pomóc?', translation: 'Bonjour ! Comment puis-je vous aider ?' },
      { id: 'l2', speaker: 'B', speakerName: 'Marek', text: 'Dzień dobry. Mam rezerwację na nazwisko Marek Nowak.', translation: 'Bonjour. J\'ai une réservation au nom de Marek Nowak.' },
      { id: 'l3', speaker: 'A', speakerName: 'Recepcjonistka', text: 'Chwileczkę... Tak, zgadza się. Pokój jednoosobowy na dwie noce?', translation: 'Un instant... Oui, c\'est exact. Une chambre simple pour deux nuits ?' },
      { id: 'l4', speaker: 'B', speakerName: 'Marek', text: 'Tak, zgadza się. Czy śniadanie jest wliczone w cenę?', translation: 'Oui, c\'est exact. Est-ce que le petit-déjeuner est inclus dans le prix ?' },
      { id: 'l5', speaker: 'A', speakerName: 'Recepcjonistka', text: 'Tak, śniadanie serwujemy od siódmej do dziesiątej. Poproszę o dowód osobisty.', translation: 'Oui, nous servons le petit-déjeuner de 7h à 10h. Votre carte d\'identité, s\'il vous plaît.' },
      { id: 'l6', speaker: 'B', speakerName: 'Marek', text: 'Proszę bardzo. Oto mój dowód.', translation: 'Voilà. Voici ma carte.' },
      { id: 'l7', speaker: 'A', speakerName: 'Recepcjonistka', text: 'Dziękuję. To jest pana klucz. Pokój numer dwieście cztery na drugim piętrze.', translation: 'Merci. Voici votre clé. Chambre numéro 204 au deuxième étage.' },
      { id: 'l8', speaker: 'B', speakerName: 'Marek', text: 'Dziękuję bardzo. Gdzie jest winda?', translation: 'Merci beaucoup. Où est l\'ascenseur ?' },
      { id: 'l9', speaker: 'A', speakerName: 'Recepcjonistka', text: 'Winda jest po lewej stronie, za schodami.', translation: 'L\'ascenseur est sur la gauche, derrière les escaliers.' },
      { id: 'l10', speaker: 'B', speakerName: 'Marek', text: 'Dziękuję, do widzenia.', translation: 'Merci, au revoir.' },
    ],
  },
];

export function getDialogueById(id: string): Dialogue | undefined {
  return DIALOGUES.find(d => d.id === id);
}

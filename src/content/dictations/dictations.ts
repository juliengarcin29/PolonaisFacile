// ============================================================
// src/content/dictations/dictations.ts
// Contenu des dictées polonaises
// ============================================================

export interface DictationSentence {
  id: string;
  text: string;
  translation: string;
  hint?: string;
}

export interface DictationExercise {
  id: string;
  title: string;
  difficulty: 'A1' | 'A2' | 'B1';
  sentences: DictationSentence[];
  xpReward: number;
}

export const DICTATIONS: DictationExercise[] = [
  {
    id: 'dictation_01',
    title: 'Salutations du quotidien',
    difficulty: 'A1',
    xpReward: 100,
    sentences: [
      {
        id: 'd01_s1',
        text: 'Dzień dobry, jak się pan miewa?',
        translation: 'Bonjour, comment allez-vous ?',
        hint: 'Formule de politesse formelle',
      },
      {
        id: 'd01_s2',
        text: 'Dziękuję bardzo za pomoc.',
        translation: 'Merci beaucoup pour l\'aide.',
        hint: 'Expression de gratitude',
      },
      {
        id: 'd01_s3',
        text: 'Przepraszam, gdzie jest toaleta?',
        translation: 'Excusez-moi, où sont les toilettes ?',
        hint: 'Demander son chemin',
      },
      {
        id: 'd01_s4',
        text: 'Do widzenia, do zobaczenia jutro!',
        translation: 'Au revoir, à demain !',
        hint: 'Formule d\'adieu',
      },
      {
        id: 'd01_s5',
        text: 'Miło mi pana poznać.',
        translation: 'Enchanté de faire votre connaissance.',
        hint: 'Formule de présentation',
      },
    ],
  },
  {
    id: 'dictation_02',
    title: 'Au café polonais',
    difficulty: 'A1',
    xpReward: 120,
    sentences: [
      {
        id: 'd02_s1',
        text: 'Poproszę jedną kawę z mlekiem.',
        translation: 'Un café au lait, s\'il vous plaît.',
        hint: 'Commander au café',
      },
      {
        id: 'd02_s2',
        text: 'Ile to kosztuje?',
        translation: 'Combien ça coûte ?',
        hint: 'Demander le prix',
      },
      {
        id: 'd02_s3',
        text: 'Poproszę rachunek, proszę.',
        translation: 'L\'addition, s\'il vous plaît.',
        hint: 'Demander l\'addition',
      },
      {
        id: 'd02_s4',
        text: 'Czy jest tu wolne miejsce?',
        translation: 'Est-ce qu\'il y a une place libre ici ?',
        hint: 'Chercher une table',
      },
    ],
  },
  {
    id: 'dictation_03',
    title: 'Se présenter',
    difficulty: 'A1',
    xpReward: 150,
    sentences: [
      {
        id: 'd03_s1',
        text: 'Nazywam się Marie Dupont.',
        translation: 'Je m\'appelle Marie Dupont.',
        hint: 'Donner son nom',
      },
      {
        id: 'd03_s2',
        text: 'Jestem z Francji, z Paryża.',
        translation: 'Je suis de France, de Paris.',
        hint: 'Dire d\'où on vient',
      },
      {
        id: 'd03_s3',
        text: 'Uczę się polskiego od trzech miesięcy.',
        translation: 'J\'apprends le polonais depuis trois mois.',
        hint: 'Parler de son apprentissage',
      },
      {
        id: 'd03_s4',
        text: 'Mój mąż jest Polakiem.',
        translation: 'Mon mari est polonais.',
        hint: 'Parler de sa famille',
      },
    ],
  },
];

export function getDictationById(id: string): DictationExercise | undefined {
  return DICTATIONS.find(d => d.id === id);
}

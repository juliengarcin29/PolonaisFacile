// ============================================================
// src/content/quizzes/advancedQuizzes.ts
// Quiz avancés — niveaux A2 et B1
// ============================================================

import type { Quiz } from '@/types';

export const ADVANCED_QUIZZES: Quiz[] = [

  // ── QUIZ A2 : GRAMMAIRE — LES CAS ───────────────────────────
  {
    id: 'quiz_cases_a2',
    title: 'Les cas polonais — Niveau A2',
    description: 'Testez votre maîtrise des cas nominatif, génitif et accusatif.',
    moduleId: 'module_8',
    difficulty: 'A2',
    xpReward: 150,
    isPremium: true,
    passingScore: 65,
    timeLimit: 180,
    questions: [
      {
        id: 'qa_01', type: 'multiple_choice', points: 15,
        question: 'Complétez : "Nie mam ___ (czas = temps)"',
        correctAnswer: 'czasu',
        options: ['czas', 'czasu', 'czasowi', 'czasem'],
        explanation: 'Après "nie mam" → génitif. Czas (masc.) → czasu au génitif.',
      },
      {
        id: 'qa_02', type: 'multiple_choice', points: 15,
        question: 'Quel cas utilise-t-on après "mieszkam w..." ?',
        correctAnswer: 'Locatif',
        options: ['Nominatif', 'Accusatif', 'Locatif', 'Instrumental'],
        explanation: 'La préposition "w" (dans) est suivie du locatif pour exprimer un lieu.',
      },
      {
        id: 'qa_03', type: 'translation_fr_pl', points: 20,
        question: 'Traduisez : "Je lis un livre"',
        correctAnswer: 'Czytam książkę',
        options: ['Czytam książka', 'Czytam książkę', 'Czytam książki', 'Czytam książce'],
        explanation: 'Czytać + objet direct → accusatif. Książka (fém.) → książkę.',
      },
      {
        id: 'qa_04', type: 'multiple_choice', points: 15,
        question: '"Jadę autobusem" utilise quel cas ?',
        correctAnswer: 'Instrumental',
        options: ['Nominatif', 'Génitif', 'Accusatif', 'Instrumental'],
        explanation: 'Le moyen de transport s\'exprime à l\'instrumental. Autobus → autobusem.',
      },
      {
        id: 'qa_05', type: 'multiple_choice', points: 15,
        question: 'Quelle est la forme correcte de "Polska" au locatif ?',
        correctAnswer: 'Polsce',
        options: ['Polska', 'Polski', 'Polskę', 'Polsce'],
        explanation: '"Mieszkam w Polsce" — Polska → Polsce au locatif féminin.',
      },
      {
        id: 'qa_06', type: 'multiple_choice', points: 20,
        question: 'Comment dire "la maison de mon père" ?',
        correctAnswer: 'dom mojego ojca',
        options: ['dom mój ojciec', 'dom mojego ojca', 'dom do ojca', 'dom ojciec'],
        explanation: 'Possession → génitif. Mój ojciec → mojego ojca (génitif masculin).',
      },
      {
        id: 'qa_07', type: 'translation_pl_fr', points: 15,
        question: 'Que signifie "Daję książkę Ani" ?',
        correctAnswer: 'Je donne le livre à Anna',
        options: [
          'J\'ai le livre d\'Anna',
          'Je donne le livre à Anna',
          'Anna me donne un livre',
          'Je lis le livre avec Anna',
        ],
        explanation: 'Daję (je donne) + książkę (accusatif) + Ani (datif de Anna). Dać + à qui = datif.',
      },
    ],
  },

  // ── QUIZ A2 : CONJUGAISON ────────────────────────────────────
  {
    id: 'quiz_conjugation_a2',
    title: 'Conjugaison au présent — A2',
    description: 'Maîtrisez la conjugaison des verbes les plus courants.',
    moduleId: 'module_9',
    difficulty: 'A2',
    xpReward: 150,
    isPremium: true,
    passingScore: 70,
    questions: [
      {
        id: 'qc_01', type: 'multiple_choice', points: 10,
        question: 'Conjuguez "mówić" à la 1ère personne du singulier',
        correctAnswer: 'mówię',
        options: ['mówię', 'mówisz', 'mówi', 'mówimy'],
        explanation: 'Mówić → ja mówię. Verbe de type -ić : ajouter -ię pour "ja".',
      },
      {
        id: 'qc_02', type: 'multiple_choice', points: 10,
        question: '"Oni ___ do szkoły." (chodzić)',
        correctAnswer: 'chodzą',
        options: ['chodzi', 'chodzimy', 'chodzą', 'chodzicie'],
        explanation: 'Oni/One → chodzą. Pluriel 3e personne de chodzić.',
      },
      {
        id: 'qc_03', type: 'multiple_choice', points: 15,
        question: 'Quelle forme de "być" complète "Wy ___ zmęczeni" ?',
        correctAnswer: 'jesteście',
        options: ['jesteśmy', 'jesteście', 'są', 'jest'],
        explanation: 'Wy (vous) + être → jesteście.',
      },
      {
        id: 'qc_04', type: 'translation_fr_pl', points: 20,
        question: 'Traduisez : "Elle comprend le polonais"',
        correctAnswer: 'Ona rozumie po polsku',
        options: [
          'Ona rozumiem po polsku',
          'Ona rozumie po polsku',
          'Ona rozumieją po polsku',
          'Ona rozumiesz po polsku',
        ],
        explanation: 'Ona (elle) → rozumie. Rozumieć : ja rozumiem, ty rozumiesz, on/ona rozumie.',
      },
      {
        id: 'qc_05', type: 'multiple_choice', points: 15,
        question: 'Différence entre "iść" et "chodzić" ?',
        correctAnswer: 'iść = une fois maintenant / chodzić = habituellement',
        options: [
          'Aucune différence',
          'iść = une fois maintenant / chodzić = habituellement',
          'iść = à pied / chodzić = en bus',
          'iść = présent / chodzić = passé',
        ],
        explanation: '"Idę do sklepu" (j\'y vais maintenant). "Chodzę do sklepu" (j\'y vais régulièrement).',
      },
      {
        id: 'qc_06', type: 'multiple_choice', points: 15,
        question: '"Pracujemy" est la forme de "my" pour quel verbe ?',
        correctAnswer: 'pracować',
        options: ['pracować', 'pracuję', 'pracowić', 'praca'],
        explanation: 'Pracować → my pracujemy. Verbe en -ować : supprime -ować, ajoute -ujemy pour "my".',
      },
      {
        id: 'qc_07', type: 'multiple_choice', points: 15,
        question: 'Comment dire "je veux" en polonais ?',
        correctAnswer: 'chcę',
        options: ['chcę', 'chcesz', 'chce', 'chcemy'],
        explanation: 'Chcieć → ja chcę. Verbe irrégulier très fréquent.',
      },
    ],
  },

  // ── QUIZ B1 : ASPECTS VERBAUX ────────────────────────────────
  {
    id: 'quiz_aspects_b1',
    title: 'Aspects verbaux — Niveau B1',
    description: 'Maîtrisez la distinction perfectif / imperfectif.',
    moduleId: 'module_9',
    difficulty: 'B1',
    xpReward: 200,
    isPremium: true,
    passingScore: 60,
    questions: [
      {
        id: 'qb_01', type: 'multiple_choice', points: 20,
        question: '"Czytałem całą noc" — quel aspect ?',
        correctAnswer: 'Imperfectif — action en cours / durée',
        options: [
          'Perfectif — action terminée',
          'Imperfectif — action en cours / durée',
          'Perfectif — résultat obtenu',
          'Aucun des deux',
        ],
        explanation: '"Czytałem" (imperfectif) indique une action qui durait. Comparez "przeczytałem" (fini).',
      },
      {
        id: 'qb_02', type: 'multiple_choice', points: 20,
        question: 'Pour dire "J\'ai fini d\'écrire le rapport", on utilise...',
        correctAnswer: 'napisałem (perfectif)',
        options: ['pisałem (imperfectif)', 'napisałem (perfectif)', 'piszę (présent)', 'będę pisać (futur)'],
        explanation: '"Napisałem" (perfectif) indique une action complète avec résultat. Le rapport est écrit.',
      },
      {
        id: 'qb_03', type: 'multiple_choice', points: 20,
        question: '"Zrobiłem zakupy" signifie...',
        correctAnswer: 'J\'ai fait les courses (et c\'est terminé)',
        options: [
          'Je faisais les courses',
          'J\'ai fait les courses (et c\'est terminé)',
          'Je fais les courses chaque jour',
          'J\'allais faire les courses',
        ],
        explanation: '"Zrobić" est le perfectif de "robić". Zrobiłem = j\'ai fait et terminé.',
      },
      {
        id: 'qb_04', type: 'multiple_choice', points: 20,
        question: 'Quel verbe utiliser pour "je mange tous les jours" (habitude) ?',
        correctAnswer: 'jeść (imperfectif)',
        options: ['zjeść (perfectif)', 'jeść (imperfectif)', 'Les deux conviennent', 'Ni l\'un ni l\'autre'],
        explanation: 'Les habitudes → imperfectif. "Jem codziennie" (je mange chaque jour).',
      },
      {
        id: 'qb_05', type: 'multiple_choice', points: 20,
        question: '"Napiszę ci jutro" signifie...',
        correctAnswer: 'Je t\'écrirai demain (et tu recevras le message)',
        options: [
          'Je t\'écrivais hier',
          'J\'écris souvent',
          'Je t\'écrirai demain (et tu recevras le message)',
          'Je n\'écrirai pas demain',
        ],
        explanation: '"Napiszę" = perfectif du futur. L\'action sera complète. Comparez "będę pisać" (action en cours).',
      },
      {
        id: 'qb_06', type: 'multiple_choice', points: 25,
        question: 'Pourquoi "Nie mogę zjeść zupy" est incorrect ?',
        correctAnswer: 'Avec "nie" + capacité, on utilise l\'imperfectif : "jeść"',
        options: [
          'La phrase est correcte',
          'Avec "nie" + capacité, on utilise l\'imperfectif : "jeść"',
          '"Zupy" devrait être "zupę"',
          '"Mogę" est mal conjugué',
        ],
        explanation: 'La négation avec verbe de capacité → imperfectif. "Nie mogę jeść zupy" est correct.',
      },
    ],
  },

  // ── QUIZ A2 : VOCABULAIRE THÉMATIQUE ────────────────────────
  {
    id: 'quiz_vocab_city_a2',
    title: 'La ville et les transports — A2',
    description: 'Vocabulaire pour se déplacer dans une ville polonaise.',
    moduleId: 'module_6',
    difficulty: 'A2',
    xpReward: 120,
    isPremium: true,
    passingScore: 70,
    questions: [
      {
        id: 'qv_01', type: 'multiple_choice', points: 10,
        question: 'Que signifie "Jadę tramwajem" ?',
        correctAnswer: 'Je prends le tramway',
        options: ['Je vois le tramway', 'Je prends le tramway', 'J\'attends le tramway', 'Je rate le tramway'],
        explanation: '"Jadę" = je vais (en véhicule). "Tramwajem" = instrumental de tramwaj (tramway).',
      },
      {
        id: 'qv_02', type: 'translation_fr_pl', points: 15,
        question: 'Comment dire "Où est l\'arrêt de bus ?" en polonais ?',
        correctAnswer: 'Gdzie jest przystanek autobusowy?',
        options: [
          'Co jest autobus?',
          'Gdzie jest przystanek autobusowy?',
          'Jak idę do autobusu?',
          'Gdzie jedzie autobus?',
        ],
        explanation: 'przystanek = arrêt. autobusowy = de bus (adjectif). Gdzie jest = où est.',
      },
      {
        id: 'qv_03', type: 'multiple_choice', points: 10,
        question: '"Skręć w prawo" signifie...',
        correctAnswer: 'Tourne à droite',
        options: ['Va tout droit', 'Tourne à droite', 'Tourne à gauche', 'Arrête-toi'],
        explanation: 'Skręć = tourne (impératif). W prawo = à droite. W lewo = à gauche.',
      },
      {
        id: 'qv_04', type: 'multiple_choice', points: 15,
        question: 'Quelle est la différence entre "dworzec" et "lotnisko" ?',
        correctAnswer: 'dworzec = gare / lotnisko = aéroport',
        options: [
          'dworzec = arrêt / lotnisko = gare',
          'dworzec = gare / lotnisko = aéroport',
          'Ils sont synonymes',
          'dworzec = aéroport / lotnisko = port',
        ],
        explanation: 'dworzec (PKP) = gare ferroviaire. lotnisko = aéroport (de "lot" = vol).',
      },
      {
        id: 'qv_05', type: 'multiple_choice', points: 10,
        question: '"Ile kosztuje bilet do Krakowa?" signifie...',
        correctAnswer: 'Combien coûte un billet pour Cracovie ?',
        options: [
          'Où est le billet pour Cracovie ?',
          'Combien coûte un billet pour Cracovie ?',
          'Quand part le train pour Cracovie ?',
          'Y a-t-il des billets pour Cracovie ?',
        ],
        explanation: '"Ile kosztuje ?" = combien coûte ? "Bilet do..." = billet pour...',
      },
    ],
  },

  // ── QUIZ B1 : CULTURE POLONAISE ──────────────────────────────
  {
    id: 'quiz_culture_b1',
    title: 'Culture et expressions polonaises — B1',
    description: 'Expressions idiomatiques et culture de la Pologne.',
    moduleId: 'module_10',
    difficulty: 'B1',
    xpReward: 200,
    isPremium: true,
    passingScore: 60,
    questions: [
      {
        id: 'qk_01', type: 'multiple_choice', points: 20,
        question: '"Nie mój cyrk, nie moje małpy" — que signifie cette expression ?',
        correctAnswer: 'Ce n\'est pas mon problème',
        options: [
          'J\'aime les cirques et les animaux',
          'Ce n\'est pas mon problème',
          'Je ne veux pas travailler',
          'C\'est une situation chaotique',
        ],
        explanation: 'Littéralement : "Ce n\'est pas mon cirque, ce ne sont pas mes singes." = pas mon affaire.',
      },
      {
        id: 'qk_02', type: 'multiple_choice', points: 15,
        question: 'Que dit-on en Pologne après un éternuement ?',
        correctAnswer: 'Na zdrowie !',
        options: ['Bless you !', 'Na zdrowie !', 'Przepraszam !', 'Dziękuję !'],
        explanation: '"Na zdrowie" = à ta santé. S\'utilise après un éternuement, comme "à vos souhaits".',
      },
      {
        id: 'qk_03', type: 'multiple_choice', points: 20,
        question: 'Qu\'est-ce que la "Wigilia" ?',
        correctAnswer: 'Le réveillon de Noël le 24 décembre',
        options: [
          'La fête nationale polonaise',
          'Le réveillon de Noël le 24 décembre',
          'Le Jour de l\'An',
          'Pâques',
        ],
        explanation: 'Wigilia (du latin vigilia = veille) est la fête centrale de Noël en Pologne, le 24 décembre.',
      },
      {
        id: 'qk_04', type: 'multiple_choice', points: 15,
        question: '"Sto lat !" est chanté...',
        correctAnswer: 'Pour un anniversaire',
        options: ['Pour Noël', 'Pour un anniversaire', 'Pour le Nouvel An', 'Pour un mariage'],
        explanation: '"Sto lat" = cent ans. C\'est la chanson d\'anniversaire polonaise équivalente à "Happy Birthday".',
      },
      {
        id: 'qk_05', type: 'multiple_choice', points: 15,
        question: 'Le polonais est parlé par combien de personnes dans le monde ?',
        correctAnswer: 'Environ 50 millions',
        options: ['5 millions', '20 millions', 'Environ 50 millions', 'Plus de 200 millions'],
        explanation: 'Le polonais compte environ 45-50 millions de locuteurs natifs (Pologne + diaspora mondiale).',
      },
      {
        id: 'qk_06', type: 'multiple_choice', points: 15,
        question: 'Quelle lettre polonaise se prononce comme le "v" français ?',
        correctAnswer: 'W',
        options: ['V', 'W', 'F', 'U'],
        explanation: 'En polonais, "w" se prononce comme "v". Ex : Warszawa = [Var-CHA-va].',
      },
    ],
  },
];

// ── Export consolidé avec les quiz de base ───────────────────
export { QUIZZES as BASE_QUIZZES } from './quizzes';

export const ALL_QUIZZES = [
  ...require('./quizzes').QUIZZES,
  ...ADVANCED_QUIZZES,
];

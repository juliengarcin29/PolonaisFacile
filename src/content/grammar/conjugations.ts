// ============================================================
// src/content/grammar/conjugations.ts
// Tableaux de conjugaison — 20 verbes essentiels
// ============================================================

import type { ConjugationTable } from '@/types';

export const CONJUGATIONS: ConjugationTable[] = [

  // ── ÊTRE ────────────────────────────────────────────────────
  {
    verb: 'być',
    translation: 'être',
    aspect: 'imperfective',
    tense: 'present',
    forms: {
      ja: 'jestem',
      ty: 'jesteś',
      on_ona: 'jest',
      my: 'jesteśmy',
      wy: 'jesteście',
      oni_one: 'są',
    },
  },
  {
    verb: 'być',
    translation: 'être',
    aspect: 'imperfective',
    tense: 'past',
    forms: {
      ja: 'byłem / byłam',
      ty: 'byłeś / byłaś',
      on_ona: 'był / była',
      my: 'byliśmy / byłyśmy',
      wy: 'byliście / byłyście',
      oni_one: 'byli / były',
    },
  },

  // ── AVOIR ───────────────────────────────────────────────────
  {
    verb: 'mieć',
    translation: 'avoir',
    aspect: 'imperfective',
    tense: 'present',
    forms: {
      ja: 'mam',
      ty: 'masz',
      on_ona: 'ma',
      my: 'mamy',
      wy: 'macie',
      oni_one: 'mają',
    },
  },
  {
    verb: 'mieć',
    translation: 'avoir',
    aspect: 'imperfective',
    tense: 'past',
    forms: {
      ja: 'miałem / miałam',
      ty: 'miałeś / miałaś',
      on_ona: 'miał / miała',
      my: 'mieliśmy / miałyśmy',
      wy: 'mieliście / miałyście',
      oni_one: 'mieli / miały',
    },
  },

  // ── ALLER ───────────────────────────────────────────────────
  {
    verb: 'iść',
    translation: 'aller (à pied)',
    aspect: 'imperfective',
    tense: 'present',
    forms: {
      ja: 'idę',
      ty: 'idziesz',
      on_ona: 'idzie',
      my: 'idziemy',
      wy: 'idziecie',
      oni_one: 'idą',
    },
  },
  {
    verb: 'chodzić',
    translation: 'aller (habituellement)',
    aspect: 'imperfective',
    tense: 'present',
    forms: {
      ja: 'chodzę',
      ty: 'chodzisz',
      on_ona: 'chodzi',
      my: 'chodzimy',
      wy: 'chodzicie',
      oni_one: 'chodzą',
    },
  },

  // ── FAIRE / PRÉPARER ────────────────────────────────────────
  {
    verb: 'robić',
    translation: 'faire',
    aspect: 'imperfective',
    tense: 'present',
    forms: {
      ja: 'robię',
      ty: 'robisz',
      on_ona: 'robi',
      my: 'robimy',
      wy: 'robicie',
      oni_one: 'robią',
    },
  },

  // ── PARLER ──────────────────────────────────────────────────
  {
    verb: 'mówić',
    translation: 'parler / dire',
    aspect: 'imperfective',
    tense: 'present',
    forms: {
      ja: 'mówię',
      ty: 'mówisz',
      on_ona: 'mówi',
      my: 'mówimy',
      wy: 'mówicie',
      oni_one: 'mówią',
    },
  },

  // ── VOULOIR ─────────────────────────────────────────────────
  {
    verb: 'chcieć',
    translation: 'vouloir',
    aspect: 'imperfective',
    tense: 'present',
    forms: {
      ja: 'chcę',
      ty: 'chcesz',
      on_ona: 'chce',
      my: 'chcemy',
      wy: 'chcecie',
      oni_one: 'chcą',
    },
  },

  // ── POUVOIR ─────────────────────────────────────────────────
  {
    verb: 'móc',
    translation: 'pouvoir',
    aspect: 'imperfective',
    tense: 'present',
    forms: {
      ja: 'mogę',
      ty: 'możesz',
      on_ona: 'może',
      my: 'możemy',
      wy: 'możecie',
      oni_one: 'mogą',
    },
  },

  // ── SAVOIR ──────────────────────────────────────────────────
  {
    verb: 'wiedzieć',
    translation: 'savoir (un fait)',
    aspect: 'imperfective',
    tense: 'present',
    forms: {
      ja: 'wiem',
      ty: 'wiesz',
      on_ona: 'wie',
      my: 'wiemy',
      wy: 'wiecie',
      oni_one: 'wiedzą',
    },
  },
  {
    verb: 'umieć',
    translation: 'savoir (une compétence)',
    aspect: 'imperfective',
    tense: 'present',
    forms: {
      ja: 'umiem',
      ty: 'umiesz',
      on_ona: 'umie',
      my: 'umiemy',
      wy: 'umiecie',
      oni_one: 'umieją',
    },
  },

  // ── VOIR ────────────────────────────────────────────────────
  {
    verb: 'widzieć',
    translation: 'voir',
    aspect: 'imperfective',
    tense: 'present',
    forms: {
      ja: 'widzę',
      ty: 'widzisz',
      on_ona: 'widzi',
      my: 'widzimy',
      wy: 'widzicie',
      oni_one: 'widzą',
    },
  },

  // ── ENTENDRE ────────────────────────────────────────────────
  {
    verb: 'słyszeć',
    translation: 'entendre',
    aspect: 'imperfective',
    tense: 'present',
    forms: {
      ja: 'słyszę',
      ty: 'słyszysz',
      on_ona: 'słyszy',
      my: 'słyszymy',
      wy: 'słyszycie',
      oni_one: 'słyszą',
    },
  },

  // ── MANGER ──────────────────────────────────────────────────
  {
    verb: 'jeść',
    translation: 'manger',
    aspect: 'imperfective',
    tense: 'present',
    forms: {
      ja: 'jem',
      ty: 'jesz',
      on_ona: 'je',
      my: 'jemy',
      wy: 'jecie',
      oni_one: 'jedzą',
    },
  },

  // ── BOIRE ───────────────────────────────────────────────────
  {
    verb: 'pić',
    translation: 'boire',
    aspect: 'imperfective',
    tense: 'present',
    forms: {
      ja: 'piję',
      ty: 'pijesz',
      on_ona: 'pije',
      my: 'pijemy',
      wy: 'pijecie',
      oni_one: 'piją',
    },
  },

  // ── TRAVAILLER ──────────────────────────────────────────────
  {
    verb: 'pracować',
    translation: 'travailler',
    aspect: 'imperfective',
    tense: 'present',
    forms: {
      ja: 'pracuję',
      ty: 'pracujesz',
      on_ona: 'pracuje',
      my: 'pracujemy',
      wy: 'pracujecie',
      oni_one: 'pracują',
    },
  },

  // ── HABITER ─────────────────────────────────────────────────
  {
    verb: 'mieszkać',
    translation: 'habiter',
    aspect: 'imperfective',
    tense: 'present',
    forms: {
      ja: 'mieszkam',
      ty: 'mieszkasz',
      on_ona: 'mieszka',
      my: 'mieszkamy',
      wy: 'mieszkacie',
      oni_one: 'mieszkają',
    },
  },

  // ── AIMER ───────────────────────────────────────────────────
  {
    verb: 'lubić',
    translation: 'aimer (apprécier)',
    aspect: 'imperfective',
    tense: 'present',
    forms: {
      ja: 'lubię',
      ty: 'lubisz',
      on_ona: 'lubi',
      my: 'lubimy',
      wy: 'lubicie',
      oni_one: 'lubią',
    },
  },
  {
    verb: 'kochać',
    translation: 'aimer (profondément)',
    aspect: 'imperfective',
    tense: 'present',
    forms: {
      ja: 'kocham',
      ty: 'kochasz',
      on_ona: 'kocha',
      my: 'kochamy',
      wy: 'kochacie',
      oni_one: 'kochają',
    },
  },

  // ── APPRENDRE ───────────────────────────────────────────────
  {
    verb: 'uczyć się',
    translation: 'apprendre / étudier',
    aspect: 'imperfective',
    tense: 'present',
    forms: {
      ja: 'uczę się',
      ty: 'uczysz się',
      on_ona: 'uczy się',
      my: 'uczymy się',
      wy: 'uczycie się',
      oni_one: 'uczą się',
    },
  },

  // ── VENIR ───────────────────────────────────────────────────
  {
    verb: 'przychodzić',
    translation: 'venir (habituellement)',
    aspect: 'imperfective',
    tense: 'present',
    forms: {
      ja: 'przychodzę',
      ty: 'przychodzisz',
      on_ona: 'przychodzi',
      my: 'przychodzimy',
      wy: 'przychodzicie',
      oni_one: 'przychodzą',
    },
  },

  // ── COMPRENDRE ──────────────────────────────────────────────
  {
    verb: 'rozumieć',
    translation: 'comprendre',
    aspect: 'imperfective',
    tense: 'present',
    forms: {
      ja: 'rozumiem',
      ty: 'rozumiesz',
      on_ona: 'rozumie',
      my: 'rozumiemy',
      wy: 'rozumiecie',
      oni_one: 'rozumieją',
    },
  },

  // ── CHERCHER ────────────────────────────────────────────────
  {
    verb: 'szukać',
    translation: 'chercher',
    aspect: 'imperfective',
    tense: 'present',
    forms: {
      ja: 'szukam',
      ty: 'szukasz',
      on_ona: 'szuka',
      my: 'szukamy',
      wy: 'szukacie',
      oni_one: 'szukają',
    },
  },

  // ── ASPECTS VERBAUX ─────────────────────────────────────────
  // Perfectif vs Imperfectif — paires clés
  {
    verb: 'pisać / napisać',
    translation: 'écrire (imp.) / écrire et finir (perf.)',
    aspect: 'imperfective',
    tense: 'present',
    forms: {
      ja: 'piszę / napiszę',
      ty: 'piszesz / napiszesz',
      on_ona: 'pisze / napisze',
      my: 'piszemy / napiszemy',
      wy: 'piszecie / napiszecie',
      oni_one: 'piszą / napiszą',
    },
  },
  {
    verb: 'czytać / przeczytać',
    translation: 'lire (imp.) / lire jusqu\'au bout (perf.)',
    aspect: 'imperfective',
    tense: 'present',
    forms: {
      ja: 'czytam / przeczytam',
      ty: 'czytasz / przeczytasz',
      on_ona: 'czyta / przeczyta',
      my: 'czytamy / przeczytamy',
      wy: 'czytacie / przeczytacie',
      oni_one: 'czytają / przeczytają',
    },
  },
];

// ── Explications des aspects verbaux ─────────────────────────
export const ASPECT_EXPLANATIONS = {
  title: 'Les aspects verbaux en polonais',
  intro: `Le polonais possède deux aspects verbaux qui n'existent pas en français :
l'aspect imperfectif (niedokonany) et l'aspect perfectif (dokonany).`,
  imperfective: {
    name: 'Imperfectif (niedokonany)',
    description: 'Action en cours, répétée, habituelle ou non terminée.',
    examples: [
      { pl: 'Czytam książkę.', fr: 'Je lis un livre. (en ce moment)', note: 'action en cours' },
      { pl: 'Codziennie czytam.', fr: 'Je lis tous les jours.', note: 'action habituelle' },
      { pl: 'Pisałem list.', fr: 'J\'écrivais une lettre.', note: 'action non terminée' },
    ],
  },
  perfective: {
    name: 'Perfectif (dokonany)',
    description: 'Action terminée, complète, avec un résultat.',
    examples: [
      { pl: 'Przeczytałem książkę.', fr: 'J\'ai fini de lire le livre.', note: 'action terminée' },
      { pl: 'Napisałem list.', fr: 'J\'ai écrit la lettre. (et c\'est fait)', note: 'résultat obtenu' },
      { pl: 'Zrozumiałem.', fr: 'J\'ai compris. (maintenant je sais)', note: 'état accompli' },
    ],
  },
  keyPairs: [
    { imperfective: 'pisać', perfective: 'napisać', translation: 'écrire' },
    { imperfective: 'czytać', perfective: 'przeczytać', translation: 'lire' },
    { imperfective: 'mówić', perfective: 'powiedzieć', translation: 'dire / parler' },
    { imperfective: 'robić', perfective: 'zrobić', translation: 'faire' },
    { imperfective: 'jeść', perfective: 'zjeść', translation: 'manger' },
    { imperfective: 'pić', perfective: 'wypić', translation: 'boire' },
    { imperfective: 'kupować', perfective: 'kupić', translation: 'acheter' },
    { imperfective: 'dawać', perfective: 'dać', translation: 'donner' },
    { imperfective: 'brać', perfective: 'wziąć', translation: 'prendre' },
    { imperfective: 'oglądać', perfective: 'obejrzeć', translation: 'regarder' },
  ],
};

// ── Les 7 cas polonais ───────────────────────────────────────
export const POLISH_CASES = [
  {
    id: 'nominative',
    name: 'Nominatif',
    namePl: 'Mianownik',
    question: 'Kto? Co? (Qui ? Quoi ?)',
    usage: 'Sujet de la phrase',
    example: { pl: 'Dom jest duży.', fr: 'La maison est grande.' },
    endings: { masculine: '—', feminine: '-a / -i', neuter: '-o / -e' },
  },
  {
    id: 'genitive',
    name: 'Génitif',
    namePl: 'Dopełniacz',
    question: 'Kogo? Czego? (De qui ? De quoi ?)',
    usage: 'Possession, négation, quantité',
    example: { pl: 'Nie ma domu.', fr: 'Il n\'y a pas de maison.' },
    endings: { masculine: '-a / -u', feminine: '-y / -i', neuter: '-a' },
  },
  {
    id: 'dative',
    name: 'Datif',
    namePl: 'Celownik',
    question: 'Komu? Czemu? (À qui ? À quoi ?)',
    usage: 'Complément indirect, bénéficiaire',
    example: { pl: 'Daję książkę Ani.', fr: 'Je donne le livre à Anna.' },
    endings: { masculine: '-owi / -u', feminine: '-ie / -i', neuter: '-u' },
  },
  {
    id: 'accusative',
    name: 'Accusatif',
    namePl: 'Biernik',
    question: 'Kogo? Co? (Qui ? Quoi ? — objet direct)',
    usage: 'Complément d\'objet direct',
    example: { pl: 'Czytam książkę.', fr: 'Je lis un livre.' },
    endings: { masculine: '-a (animé) / — (inanimé)', feminine: '-ę / -ę', neuter: '= nominatif' },
  },
  {
    id: 'instrumental',
    name: 'Instrumental',
    namePl: 'Narzędnik',
    question: 'Kim? Czym? (Avec qui ? Avec quoi ?)',
    usage: 'Moyen, accompagnement, profession',
    example: { pl: 'Jadę autobusem.', fr: 'Je prends le bus.' },
    endings: { masculine: '-em', feminine: '-ą', neuter: '-em' },
  },
  {
    id: 'locative',
    name: 'Locatif',
    namePl: 'Miejscownik',
    question: 'O kim? O czym? (De qui ? De quoi ? — sujet de conversation)',
    usage: 'Lieu (après w, na, przy, o)',
    example: { pl: 'Mieszkam w Warszawie.', fr: 'J\'habite à Varsovie.' },
    endings: { masculine: '-ie / -u', feminine: '-ie / -i', neuter: '-ie / -u' },
  },
  {
    id: 'vocative',
    name: 'Vocatif',
    namePl: 'Wołacz',
    question: '(Apostrophe directe)',
    usage: 'S\'adresser directement à quelqu\'un',
    example: { pl: 'Mamo, chodź tutaj!', fr: 'Maman, viens ici !' },
    endings: { masculine: '-ie / -u', feminine: '-o / -i', neuter: '= nominatif' },
  },
];

// ============================================================
// scripts/generateAudio.js
// Génération TTS via Google Cloud Text-to-Speech
// Prérequis : npm install @google-cloud/text-to-speech
// Usage    : node scripts/generateAudio.js
// ============================================================

const textToSpeech = require('@google-cloud/text-to-speech');
const fs = require('fs');
const path = require('path');

// ── Configuration ─────────────────────────────────────────────
// Télécharger la clé depuis : console.cloud.google.com
// IAM & Admin → Comptes de service → Créer une clé JSON
process.env.GOOGLE_APPLICATION_CREDENTIALS = './scripts/google-tts-key.json';

const client = new textToSpeech.TextToSpeechClient();

const VOICE_CONFIG = {
  languageCode: 'pl-PL',
  name: 'pl-PL-Wavenet-A',     // Voix féminine naturelle (recommandée)
  ssmlGender: 'FEMALE',
  // Alternatives :
  // 'pl-PL-Wavenet-B' — masculin
  // 'pl-PL-Standard-A' — féminin (moins naturel, gratuit)
};

const AUDIO_CONFIG = {
  audioEncoding: 'MP3',
  speakingRate: 0.85,           // Légèrement plus lent pour l'apprentissage
  pitch: 0,
  volumeGainDb: 0,
};

// ── Mots à générer ────────────────────────────────────────────
const WORDS_TO_GENERATE = [
  // Salutations
  { text: 'Dzień dobry', file: 'dzien_dobry', folder: 'greetings' },
  { text: 'Cześć', file: 'czesc', folder: 'greetings' },
  { text: 'Do widzenia', file: 'do_widzenia', folder: 'greetings' },
  { text: 'Dobranoc', file: 'dobranoc', folder: 'greetings' },
  { text: 'Dziękuję', file: 'dziekuje', folder: 'greetings' },
  { text: 'Dziękuję bardzo', file: 'dziekuje_bardzo', folder: 'greetings' },
  { text: 'Przepraszam', file: 'przepraszam', folder: 'greetings' },
  { text: 'Proszę', file: 'prosze', folder: 'greetings' },
  { text: 'Proszę bardzo', file: 'prosze_bardzo', folder: 'greetings' },
  { text: 'Dobrze', file: 'dobrze', folder: 'greetings' },
  { text: 'Tak', file: 'tak', folder: 'greetings' },
  { text: 'Nie', file: 'nie', folder: 'greetings' },
  { text: 'Miło mi', file: 'milo_mi', folder: 'greetings' },
  { text: 'Jak się masz?', file: 'jak_sie_masz', folder: 'greetings' },

  // Chiffres
  { text: 'jeden', file: 'jeden', folder: 'numbers' },
  { text: 'dwa', file: 'dwa', folder: 'numbers' },
  { text: 'trzy', file: 'trzy', folder: 'numbers' },
  { text: 'cztery', file: 'cztery', folder: 'numbers' },
  { text: 'pięć', file: 'piec', folder: 'numbers' },
  { text: 'sześć', file: 'szesc', folder: 'numbers' },
  { text: 'siedem', file: 'siedem', folder: 'numbers' },
  { text: 'osiem', file: 'osiem', folder: 'numbers' },
  { text: 'dziewięć', file: 'dziewiec', folder: 'numbers' },
  { text: 'dziesięć', file: 'dziesiec', folder: 'numbers' },
  { text: 'dwadzieścia', file: 'dwadziescia', folder: 'numbers' },
  { text: 'sto', file: 'sto', folder: 'numbers' },
  { text: 'tysiąc', file: 'tysiac', folder: 'numbers' },

  // Famille
  { text: 'mama', file: 'mama', folder: 'family' },
  { text: 'tata', file: 'tata', folder: 'family' },
  { text: 'brat', file: 'brat', folder: 'family' },
  { text: 'siostra', file: 'siostra', folder: 'family' },
  { text: 'dziadek', file: 'dziadek', folder: 'family' },
  { text: 'babcia', file: 'babcia', folder: 'family' },
  { text: 'syn', file: 'syn', folder: 'family' },
  { text: 'córka', file: 'corka', folder: 'family' },
  { text: 'mąż', file: 'maz', folder: 'family' },
  { text: 'żona', file: 'zona', folder: 'family' },

  // Nourriture
  { text: 'pierogi', file: 'pierogi', folder: 'food' },
  { text: 'bigos', file: 'bigos', folder: 'food' },
  { text: 'chleb', file: 'chleb', folder: 'food' },
  { text: 'woda', file: 'woda', folder: 'food' },
  { text: 'kawa', file: 'kawa', folder: 'food' },
  { text: 'herbata', file: 'herbata', folder: 'food' },
  { text: 'piwo', file: 'piwo', folder: 'food' },
  { text: 'zupa', file: 'zupa', folder: 'food' },
  { text: 'mięso', file: 'mieso', folder: 'food' },
  { text: 'ryba', file: 'ryba', folder: 'food' },

  // Voyage
  { text: 'dworzec', file: 'dworzec', folder: 'travel' },
  { text: 'pociąg', file: 'pociag', folder: 'travel' },
  { text: 'lotnisko', file: 'lotnisko', folder: 'travel' },
  { text: 'bilet', file: 'bilet', folder: 'travel' },
  { text: 'hotel', file: 'hotel', folder: 'travel' },
  { text: 'apteka', file: 'apteka', folder: 'travel' },
  { text: 'rachunek', file: 'rachunek', folder: 'travel' },

  // Phrases complètes (pour les dictées)
  { text: 'Dzień dobry, jak się pan miewa?', file: 'phrase_greeting_formal', folder: 'phrases' },
  { text: 'Dziękuję bardzo za pomoc.', file: 'phrase_thankyou_help', folder: 'phrases' },
  { text: 'Przepraszam, gdzie jest toaleta?', file: 'phrase_excuse_toilet', folder: 'phrases' },
  { text: 'Poproszę jedną kawę z mlekiem.', file: 'phrase_order_coffee', folder: 'phrases' },
  { text: 'Ile to kosztuje?', file: 'phrase_how_much', folder: 'phrases' },
  { text: 'Nazywam się Marie.', file: 'phrase_my_name', folder: 'phrases' },
  { text: 'Jestem z Francji.', file: 'phrase_from_france', folder: 'phrases' },
  { text: 'Nie rozumiem po polsku.', file: 'phrase_dont_understand', folder: 'phrases' },
  { text: 'Proszę mówić wolniej.', file: 'phrase_speak_slower', folder: 'phrases' },
  { text: 'Do widzenia, do zobaczenia jutro!', file: 'phrase_goodbye_tomorrow', folder: 'phrases' },
];

// ── Créer les dossiers nécessaires ────────────────────────────
function ensureDirectories() {
  const folders = ['greetings', 'numbers', 'family', 'food', 'travel', 'phrases'];
  folders.forEach(folder => {
    const dir = path.join('assets', 'audio', folder);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`📁 Dossier créé : ${dir}`);
    }
  });
}

// ── Générer un fichier audio ──────────────────────────────────
async function generateAudioFile(word) {
  const outputPath = path.join('assets', 'audio', word.folder, `${word.file}.mp3`);

  // Ne pas re-générer si le fichier existe déjà
  if (fs.existsSync(outputPath)) {
    console.log(`⏭  Existant : ${word.file}.mp3`);
    return;
  }

  const request = {
    input: { text: word.text },
    voice: VOICE_CONFIG,
    audioConfig: AUDIO_CONFIG,
  };

  const [response] = await client.synthesizeSpeech(request);
  fs.writeFileSync(outputPath, response.audioContent, 'binary');
  console.log(`✅ Généré : ${word.folder}/${word.file}.mp3 — "${word.text}"`);
}

// ── Générer avec limitation de débit ─────────────────────────
async function generateAllAudio() {
  console.log('🎙️  Démarrage de la génération audio...\n');
  console.log(`📊 ${WORDS_TO_GENERATE.length} fichiers à générer\n`);

  ensureDirectories();

  let success = 0;
  let skipped = 0;
  let errors = 0;

  for (let i = 0; i < WORDS_TO_GENERATE.length; i++) {
    const word = WORDS_TO_GENERATE[i];
    try {
      await generateAudioFile(word);
      success++;

      // Attendre 100ms entre chaque requête pour éviter le rate limiting
      await new Promise(r => setTimeout(r, 100));

      // Afficher la progression toutes les 10 générations
      if ((i + 1) % 10 === 0) {
        console.log(`\n📈 Progression : ${i + 1}/${WORDS_TO_GENERATE.length}\n`);
      }
    } catch (e) {
      if (e.message?.includes('already exists')) {
        skipped++;
      } else {
        console.error(`❌ Erreur pour "${word.text}":`, e.message);
        errors++;
      }
    }
  }

  console.log('\n✅ Génération terminée !');
  console.log(`  ✅ Générés  : ${success}`);
  console.log(`  ⏭  Ignorés  : ${skipped}`);
  console.log(`  ❌ Erreurs  : ${errors}`);
  console.log('\n📁 Fichiers disponibles dans : assets/audio/');
}

generateAllAudio().catch(console.error);


// ============================================================
// scripts/uploadAudio.js
// Upload des fichiers MP3 vers Firebase Storage
// Prérequis : npm install glob firebase-admin
// Usage    : node scripts/uploadAudio.js
// ============================================================

const admin = require('firebase-admin');
const glob = require('glob');
const path2 = require('path');
const fs2 = require('fs');

// Initialiser Firebase Admin
const serviceAccount2 = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount2),
  storageBucket: 'votre-projet.appspot.com', // ← Remplacer
});

const bucket = admin.storage().bucket();
const urlMap = {};

async function uploadAudioFile(localPath) {
  const relativePath = localPath.replace('assets/', '');
  const remotePath = `audio/${relativePath.replace('audio/', '')}`;
  const filename = path2.basename(localPath, '.mp3');

  try {
    await bucket.upload(localPath, {
      destination: remotePath,
      metadata: {
        contentType: 'audio/mpeg',
        cacheControl: 'public, max-age=31536000', // 1 an
        metadata: { originalFile: filename },
      },
    });

    // Obtenir l'URL publique signée
    const [url] = await bucket.file(remotePath).getSignedUrl({
      action: 'read',
      expires: '03-01-2500', // Très longue durée
    });

    urlMap[filename] = url;
    console.log(`✅ Uploadé : ${filename}`);
    return url;
  } catch (e) {
    console.error(`❌ Erreur upload ${filename}:`, e.message);
    return null;
  }
}

async function uploadAllAudio() {
  console.log('☁️  Démarrage de l\'upload vers Firebase Storage...\n');

  const files = glob.sync('assets/audio/**/*.mp3');
  console.log(`📊 ${files.length} fichiers à uploader\n`);

  for (const file of files) {
    await uploadAudioFile(file);
    await new Promise(r => setTimeout(r, 200));
  }

  // Sauvegarder le mapping URL → fichier
  const outputPath = 'src/content/audioUrls.json';
  fs2.writeFileSync(outputPath, JSON.stringify(urlMap, null, 2));

  console.log(`\n✅ URLs sauvegardées dans : ${outputPath}`);
  console.log(`📊 ${Object.keys(urlMap).length} URLs générées`);
  console.log('\n💡 Importez maintenant audioUrls.json dans vos flashcards :');
  console.log('   import audioUrls from \'@/content/audioUrls.json\';');
  console.log('   audioUrl: audioUrls[\'dzien_dobry\'],');
}

uploadAllAudio().catch(console.error);

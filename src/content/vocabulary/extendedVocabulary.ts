// ============================================================
// src/content/vocabulary/extendedVocabulary.ts
// 200 mots supplémentaires — 10 thèmes × 20 mots
// ============================================================

import type { Flashcard } from '@/types';

export const EXTENDED_FLASHCARDS: Flashcard[] = [

  // ── THÈME : CORPS HUMAIN (20 mots) ──────────────────────────
  { id: 'fc_body_01', moduleId: 'module_4', isPremium: true, front: 'głowa', back: 'tête', phonetic: '[ˈgwɔva]', examplePl: 'Boli mnie głowa.', exampleFr: 'J\'ai mal à la tête.', tags: ['corps'] },
  { id: 'fc_body_02', moduleId: 'module_4', isPremium: true, front: 'oko', back: 'œil', phonetic: '[ˈɔkɔ]', examplePl: 'Mam niebieskie oczy.', exampleFr: 'J\'ai les yeux bleus.', tags: ['corps'] },
  { id: 'fc_body_03', moduleId: 'module_4', isPremium: true, front: 'ucho', back: 'oreille', phonetic: '[ˈuxɔ]', examplePl: 'Boli mnie ucho.', exampleFr: 'J\'ai mal à l\'oreille.', tags: ['corps'] },
  { id: 'fc_body_04', moduleId: 'module_4', isPremium: true, front: 'nos', back: 'nez', phonetic: '[nɔs]', examplePl: 'Mam katar.', exampleFr: 'J\'ai le nez qui coule.', tags: ['corps'] },
  { id: 'fc_body_05', moduleId: 'module_4', isPremium: true, front: 'usta', back: 'bouche', phonetic: '[ˈusta]', examplePl: 'Otwórz usta.', exampleFr: 'Ouvrez la bouche.', tags: ['corps'] },
  { id: 'fc_body_06', moduleId: 'module_4', isPremium: true, front: 'ząb', back: 'dent', phonetic: '[zɔmp]', examplePl: 'Boli mnie ząb.', exampleFr: 'J\'ai mal aux dents.', tags: ['corps'] },
  { id: 'fc_body_07', moduleId: 'module_4', isPremium: true, front: 'szyja', back: 'cou', phonetic: '[ˈʃɨja]', examplePl: 'Boli mnie szyja.', exampleFr: 'J\'ai mal au cou.', tags: ['corps'] },
  { id: 'fc_body_08', moduleId: 'module_4', isPremium: true, front: 'ramię', back: 'épaule / bras', phonetic: '[ˈramjɛ]', examplePl: 'Złamałem ramię.', exampleFr: 'Je me suis cassé le bras.', tags: ['corps'] },
  { id: 'fc_body_09', moduleId: 'module_4', isPremium: true, front: 'ręka', back: 'main', phonetic: '[ˈrɛŋka]', examplePl: 'Podaj mi rękę.', exampleFr: 'Donne-moi la main.', tags: ['corps'] },
  { id: 'fc_body_10', moduleId: 'module_4', isPremium: true, front: 'noga', back: 'jambe / pied', phonetic: '[ˈnɔga]', examplePl: 'Boli mnie noga.', exampleFr: 'J\'ai mal à la jambe.', tags: ['corps'] },
  { id: 'fc_body_11', moduleId: 'module_4', isPremium: true, front: 'plecy', back: 'dos', phonetic: '[ˈplɛtsɨ]', examplePl: 'Boli mnie plecy.', exampleFr: 'J\'ai mal au dos.', tags: ['corps'] },
  { id: 'fc_body_12', moduleId: 'module_4', isPremium: true, front: 'serce', back: 'cœur', phonetic: '[ˈsɛrtsɛ]', examplePl: 'Moje serce bije.', exampleFr: 'Mon cœur bat.', tags: ['corps'] },
  { id: 'fc_body_13', moduleId: 'module_4', isPremium: true, front: 'żołądek', back: 'estomac', phonetic: '[ʐɔˈwɔndɛk]', examplePl: 'Boli mnie żołądek.', exampleFr: 'J\'ai mal à l\'estomac.', tags: ['corps'] },
  { id: 'fc_body_14', moduleId: 'module_4', isPremium: true, front: 'krew', back: 'sang', phonetic: '[krɛv]', examplePl: 'Mam grupę krwi A.', exampleFr: 'J\'ai le groupe sanguin A.', tags: ['corps', 'médecine'] },
  { id: 'fc_body_15', moduleId: 'module_4', isPremium: true, front: 'włosy', back: 'cheveux', phonetic: '[ˈvwɔsɨ]', examplePl: 'Mam długie włosy.', exampleFr: 'J\'ai les cheveux longs.', tags: ['corps', 'apparence'] },
  { id: 'fc_body_16', moduleId: 'module_4', isPremium: true, front: 'twarz', back: 'visage', phonetic: '[tfaʂ]', examplePl: 'Ma ładną twarz.', exampleFr: 'Il/Elle a un beau visage.', tags: ['corps'] },
  { id: 'fc_body_17', moduleId: 'module_4', isPremium: true, front: 'kolano', back: 'genou', phonetic: '[kɔˈlanɔ]', examplePl: 'Upadłem na kolano.', exampleFr: 'Je suis tombé sur le genou.', tags: ['corps'] },
  { id: 'fc_body_18', moduleId: 'module_4', isPremium: true, front: 'brzuch', back: 'ventre', phonetic: '[bʐux]', examplePl: 'Boli mnie brzuch.', exampleFr: 'J\'ai mal au ventre.', tags: ['corps'] },
  { id: 'fc_body_19', moduleId: 'module_4', isPremium: true, front: 'palec', back: 'doigt', phonetic: '[ˈpalɛts]', examplePl: 'Skaleczył się w palec.', exampleFr: 'Il s\'est coupé le doigt.', tags: ['corps'] },
  { id: 'fc_body_20', moduleId: 'module_4', isPremium: true, front: 'skóra', back: 'peau', phonetic: '[ˈskura]', examplePl: 'Mam suchą skórę.', exampleFr: 'J\'ai la peau sèche.', tags: ['corps'] },

  // ── THÈME : COULEURS (20 mots) ───────────────────────────────
  { id: 'fc_col_01', moduleId: 'module_5', isPremium: false, front: 'czerwony', back: 'rouge', phonetic: '[tʂɛrˈvɔnɨ]', examplePl: 'Czerwony to kolor Polski.', exampleFr: 'Le rouge est la couleur de la Pologne.', tags: ['couleurs'] },
  { id: 'fc_col_02', moduleId: 'module_5', isPremium: false, front: 'biały', back: 'blanc', phonetic: '[ˈbjawɨ]', examplePl: 'Biały śnieg.', exampleFr: 'La neige blanche.', tags: ['couleurs'] },
  { id: 'fc_col_03', moduleId: 'module_5', isPremium: false, front: 'czarny', back: 'noir', phonetic: '[ˈtʂarnɨ]', examplePl: 'Czarna kawa.', exampleFr: 'Un café noir.', tags: ['couleurs'] },
  { id: 'fc_col_04', moduleId: 'module_5', isPremium: false, front: 'niebieski', back: 'bleu', phonetic: '[ɲɛˈbjɛski]', examplePl: 'Niebieskie niebo.', exampleFr: 'Un ciel bleu.', tags: ['couleurs'] },
  { id: 'fc_col_05', moduleId: 'module_5', isPremium: false, front: 'zielony', back: 'vert', phonetic: '[ʑɛˈlɔnɨ]', examplePl: 'Zielone liście.', exampleFr: 'Des feuilles vertes.', tags: ['couleurs'] },
  { id: 'fc_col_06', moduleId: 'module_5', isPremium: false, front: 'żółty', back: 'jaune', phonetic: '[ˈʐuwtɨ]', examplePl: 'Żółte słońce.', exampleFr: 'Un soleil jaune.', tags: ['couleurs'] },
  { id: 'fc_col_07', moduleId: 'module_5', isPremium: false, front: 'pomarańczowy', back: 'orange', phonetic: '[pɔmaˈrɑɲtʂɔvɨ]', examplePl: 'Pomarańczowy kwiat.', exampleFr: 'Une fleur orange.', tags: ['couleurs'] },
  { id: 'fc_col_08', moduleId: 'module_5', isPremium: false, front: 'różowy', back: 'rose', phonetic: '[ruˈʐɔvɨ]', examplePl: 'Różowe jabłko.', exampleFr: 'Une pomme rose.', tags: ['couleurs'] },
  { id: 'fc_col_09', moduleId: 'module_5', isPremium: false, front: 'fioletowy', back: 'violet', phonetic: '[fjɔlɛˈtɔvɨ]', examplePl: 'Fioletowe fioletki.', exampleFr: 'Des violettes violettes.', tags: ['couleurs'] },
  { id: 'fc_col_10', moduleId: 'module_5', isPremium: false, front: 'brązowy', back: 'marron', phonetic: '[brɔ̃ˈzɔvɨ]', examplePl: 'Brązowe buty.', exampleFr: 'Des chaussures marron.', tags: ['couleurs'] },
  { id: 'fc_col_11', moduleId: 'module_5', isPremium: false, front: 'szary', back: 'gris', phonetic: '[ˈʃarɨ]', examplePl: 'Szare chmury.', exampleFr: 'Des nuages gris.', tags: ['couleurs'] },
  { id: 'fc_col_12', moduleId: 'module_5', isPremium: false, front: 'złoty', back: 'doré / or', phonetic: '[ˈzwɔtɨ]', examplePl: 'Złoty pierścionek.', exampleFr: 'Une bague en or.', tags: ['couleurs', 'bijoux'] },

  // ── THÈME : MÉTÉO (20 mots) ──────────────────────────────────
  { id: 'fc_wea_01', moduleId: 'module_6', isPremium: true, front: 'pogoda', back: 'météo / temps', phonetic: '[pɔˈgɔda]', examplePl: 'Jaka jest pogoda?', exampleFr: 'Quel temps fait-il ?', tags: ['météo'] },
  { id: 'fc_wea_02', moduleId: 'module_6', isPremium: true, front: 'słońce', back: 'soleil', phonetic: '[ˈswɔɲtsɛ]', examplePl: 'Dziś świeci słońce.', exampleFr: 'Il y a du soleil aujourd\'hui.', tags: ['météo'] },
  { id: 'fc_wea_03', moduleId: 'module_6', isPremium: true, front: 'deszcz', back: 'pluie', phonetic: '[dɛʂtʂ]', examplePl: 'Pada deszcz.', exampleFr: 'Il pleut.', tags: ['météo'] },
  { id: 'fc_wea_04', moduleId: 'module_6', isPremium: true, front: 'śnieg', back: 'neige', phonetic: '[ɕɲɛk]', examplePl: 'Pada śnieg.', exampleFr: 'Il neige.', tags: ['météo'] },
  { id: 'fc_wea_05', moduleId: 'module_6', isPremium: true, front: 'wiatr', back: 'vent', phonetic: '[vjatʂ]', examplePl: 'Wieje silny wiatr.', exampleFr: 'Il y a un vent fort.', tags: ['météo'] },
  { id: 'fc_wea_06', moduleId: 'module_6', isPremium: true, front: 'chmura', back: 'nuage', phonetic: '[ˈxmura]', examplePl: 'Na niebie są chmury.', exampleFr: 'Il y a des nuages dans le ciel.', tags: ['météo'] },
  { id: 'fc_wea_07', moduleId: 'module_6', isPremium: true, front: 'mgła', back: 'brouillard', phonetic: '[mgwa]', examplePl: 'Jest gęsta mgła.', exampleFr: 'Il y a un épais brouillard.', tags: ['météo'] },
  { id: 'fc_wea_08', moduleId: 'module_6', isPremium: true, front: 'burza', back: 'orage', phonetic: '[ˈbuʐa]', examplePl: 'Idzie burza.', exampleFr: 'L\'orage arrive.', tags: ['météo'] },
  { id: 'fc_wea_09', moduleId: 'module_6', isPremium: true, front: 'gorąco', back: 'chaud (il fait)', phonetic: '[gɔˈrɔntso]', examplePl: 'Dziś jest gorąco.', exampleFr: 'Il fait chaud aujourd\'hui.', tags: ['météo'] },
  { id: 'fc_wea_10', moduleId: 'module_6', isPremium: true, front: 'zimno', back: 'froid (il fait)', phonetic: '[ˈzimno]', examplePl: 'Jest bardzo zimno.', exampleFr: 'Il fait très froid.', tags: ['météo'] },
  { id: 'fc_wea_11', moduleId: 'module_6', isPremium: true, front: 'temperatura', back: 'température', phonetic: '[tɛmperaˈtura]', examplePl: 'Temperatura wynosi 20 stopni.', exampleFr: 'La température est de 20 degrés.', tags: ['météo'] },
  { id: 'fc_wea_12', moduleId: 'module_6', isPremium: true, front: 'piorun', back: 'éclair / tonnerre', phonetic: '[ˈpjɔrun]', examplePl: 'Słyszę pioruny.', exampleFr: 'J\'entends le tonnerre.', tags: ['météo'] },

  // ── THÈME : TEMPS & JOURS (20 mots) ─────────────────────────
  { id: 'fc_time_01', moduleId: 'module_7', isPremium: true, front: 'poniedziałek', back: 'lundi', phonetic: '[pɔɲɛˈdʑawɛk]', examplePl: 'W poniedziałek zaczynam pracę.', exampleFr: 'Je commence le travail lundi.', tags: ['jours'] },
  { id: 'fc_time_02', moduleId: 'module_7', isPremium: true, front: 'wtorek', back: 'mardi', phonetic: '[ˈftɔrɛk]', examplePl: 'We wtorek mam spotkanie.', exampleFr: 'J\'ai une réunion mardi.', tags: ['jours'] },
  { id: 'fc_time_03', moduleId: 'module_7', isPremium: true, front: 'środa', back: 'mercredi', phonetic: '[ˈɕrɔda]', examplePl: 'W środę idę do lekarza.', exampleFr: 'Je vais chez le médecin mercredi.', tags: ['jours'] },
  { id: 'fc_time_04', moduleId: 'module_7', isPremium: true, front: 'czwartek', back: 'jeudi', phonetic: '[ˈtʂvartɛk]', examplePl: 'W czwartek mam wolne.', exampleFr: 'J\'ai congé jeudi.', tags: ['jours'] },
  { id: 'fc_time_05', moduleId: 'module_7', isPremium: true, front: 'piątek', back: 'vendredi', phonetic: '[ˈpjɔntɛk]', examplePl: 'W piątek idziemy na kolację.', exampleFr: 'On va dîner vendredi.', tags: ['jours'] },
  { id: 'fc_time_06', moduleId: 'module_7', isPremium: true, front: 'sobota', back: 'samedi', phonetic: '[sɔˈbɔta]', examplePl: 'W sobotę śpię długo.', exampleFr: 'Je dors longtemps le samedi.', tags: ['jours'] },
  { id: 'fc_time_07', moduleId: 'module_7', isPremium: true, front: 'niedziela', back: 'dimanche', phonetic: '[ɲɛˈdʑɛla]', examplePl: 'W niedzielę rodzina je razem.', exampleFr: 'La famille mange ensemble le dimanche.', tags: ['jours'] },
  { id: 'fc_time_08', moduleId: 'module_7', isPremium: true, front: 'styczeń', back: 'janvier', phonetic: '[ˈstɨtʂɛɲ]', examplePl: 'Urodziłem się w styczniu.', exampleFr: 'Je suis né en janvier.', tags: ['mois'] },
  { id: 'fc_time_09', moduleId: 'module_7', isPremium: true, front: 'luty', back: 'février', phonetic: '[ˈlutɨ]', examplePl: 'W lutym jest Walentynki.', exampleFr: 'En février, c\'est la Saint-Valentin.', tags: ['mois'] },
  { id: 'fc_time_10', moduleId: 'module_7', isPremium: true, front: 'marzec', back: 'mars', phonetic: '[ˈmaʐɛts]', examplePl: 'Wiosna zaczyna się w marcu.', exampleFr: 'Le printemps commence en mars.', tags: ['mois'] },
  { id: 'fc_time_11', moduleId: 'module_7', isPremium: true, front: 'kwiecień', back: 'avril', phonetic: '[ˈkfjɛtɕɛɲ]', examplePl: 'Wielkanoc jest w kwietniu.', exampleFr: 'Pâques est en avril.', tags: ['mois'] },
  { id: 'fc_time_12', moduleId: 'module_7', isPremium: true, front: 'maj', back: 'mai', phonetic: '[maj]', examplePl: 'W maju kwitną kwiaty.', exampleFr: 'Les fleurs s\'épanouissent en mai.', tags: ['mois'] },
  { id: 'fc_time_13', moduleId: 'module_7', isPremium: true, front: 'czerwiec', back: 'juin', phonetic: '[ˈtʂɛrvjɛts]', examplePl: 'Lato zaczyna się w czerwcu.', exampleFr: 'L\'été commence en juin.', tags: ['mois'] },
  { id: 'fc_time_14', moduleId: 'module_7', isPremium: true, front: 'lipiec', back: 'juillet', phonetic: '[ˈlipjɛts]', examplePl: 'Jedziemy na wakacje w lipcu.', exampleFr: 'On part en vacances en juillet.', tags: ['mois'] },
  { id: 'fc_time_15', moduleId: 'module_7', isPremium: true, front: 'sierpień', back: 'août', phonetic: '[ˈɕɛrpjɛɲ]', examplePl: 'Sierpień to najcieplejszy miesiąc.', exampleFr: 'Août est le mois le plus chaud.', tags: ['mois'] },
  { id: 'fc_time_16', moduleId: 'module_7', isPremium: true, front: 'wrzesień', back: 'septembre', phonetic: '[ˈvʐɛɕɛɲ]', examplePl: 'We wrześniu zaczyna się szkoła.', exampleFr: 'L\'école commence en septembre.', tags: ['mois'] },
  { id: 'fc_time_17', moduleId: 'module_7', isPremium: true, front: 'październik', back: 'octobre', phonetic: '[paʑˈdʑɛrɲik]', examplePl: 'W październiku liście opadają.', exampleFr: 'Les feuilles tombent en octobre.', tags: ['mois'] },
  { id: 'fc_time_18', moduleId: 'module_7', isPremium: true, front: 'listopad', back: 'novembre', phonetic: '[ˈlistɔpat]', examplePl: 'Listopad jest deszczowy.', exampleFr: 'Novembre est pluvieux.', tags: ['mois'] },
  { id: 'fc_time_19', moduleId: 'module_7', isPremium: true, front: 'grudzień', back: 'décembre', phonetic: '[ˈgrudʑɛɲ]', examplePl: 'W grudniu są Święta Bożego Narodzenia.', exampleFr: 'Noël est en décembre.', tags: ['mois'] },
  { id: 'fc_time_20', moduleId: 'module_7', isPremium: true, front: 'rok', back: 'année', phonetic: '[rɔk]', examplePl: 'Ten rok był trudny.', exampleFr: 'Cette année a été difficile.', tags: ['temps'] },

  // ── THÈME : MAISON (20 mots) ─────────────────────────────────
  { id: 'fc_home_01', moduleId: 'module_6', isPremium: true, front: 'dom', back: 'maison', phonetic: '[dɔm]', examplePl: 'Mieszkam w domu.', exampleFr: 'J\'habite dans une maison.', tags: ['maison'] },
  { id: 'fc_home_02', moduleId: 'module_6', isPremium: true, front: 'mieszkanie', back: 'appartement', phonetic: '[mɛʂˈkaɲɛ]', examplePl: 'Mam małe mieszkanie.', exampleFr: 'J\'ai un petit appartement.', tags: ['maison'] },
  { id: 'fc_home_03', moduleId: 'module_6', isPremium: true, front: 'pokój', back: 'chambre / pièce', phonetic: '[ˈpɔkuj]', examplePl: 'Mam swój pokój.', exampleFr: 'J\'ai ma propre chambre.', tags: ['maison'] },
  { id: 'fc_home_04', moduleId: 'module_6', isPremium: true, front: 'kuchnia', back: 'cuisine', phonetic: '[ˈkuxɲa]', examplePl: 'Gotuję w kuchni.', exampleFr: 'Je cuisine dans la cuisine.', tags: ['maison'] },
  { id: 'fc_home_05', moduleId: 'module_6', isPremium: true, front: 'łazienka', back: 'salle de bain', phonetic: '[waˈʑɛŋka]', examplePl: 'Łazienka jest na górze.', exampleFr: 'La salle de bain est en haut.', tags: ['maison'] },
  { id: 'fc_home_06', moduleId: 'module_6', isPremium: true, front: 'salon', back: 'salon', phonetic: '[ˈsalɔn]', examplePl: 'Oglądamy telewizję w salonie.', exampleFr: 'On regarde la télé au salon.', tags: ['maison'] },
  { id: 'fc_home_07', moduleId: 'module_6', isPremium: true, front: 'okno', back: 'fenêtre', phonetic: '[ˈɔknɔ]', examplePl: 'Otwórz okno, proszę.', exampleFr: 'Ouvre la fenêtre, s\'il te plaît.', tags: ['maison'] },
  { id: 'fc_home_08', moduleId: 'module_6', isPremium: true, front: 'drzwi', back: 'porte', phonetic: '[dʐvi]', examplePl: 'Zamknij drzwi.', exampleFr: 'Ferme la porte.', tags: ['maison'] },
  { id: 'fc_home_09', moduleId: 'module_6', isPremium: true, front: 'stół', back: 'table', phonetic: '[stuw]', examplePl: 'Siadamy przy stole.', exampleFr: 'On s\'assoit à table.', tags: ['maison', 'mobilier'] },
  { id: 'fc_home_10', moduleId: 'module_6', isPremium: true, front: 'krzesło', back: 'chaise', phonetic: '[ˈkʂɛswɔ]', examplePl: 'Proszę usiąść na krześle.', exampleFr: 'Veuillez vous asseoir sur la chaise.', tags: ['maison', 'mobilier'] },
  { id: 'fc_home_11', moduleId: 'module_6', isPremium: true, front: 'łóżko', back: 'lit', phonetic: '[ˈwuʂkɔ]', examplePl: 'Idę spać do łóżka.', exampleFr: 'Je vais me coucher.', tags: ['maison', 'mobilier'] },
  { id: 'fc_home_12', moduleId: 'module_6', isPremium: true, front: 'szafa', back: 'armoire', phonetic: '[ˈʃafa]', examplePl: 'Ubrania są w szafie.', exampleFr: 'Les vêtements sont dans l\'armoire.', tags: ['maison', 'mobilier'] },
  { id: 'fc_home_13', moduleId: 'module_6', isPremium: true, front: 'lodówka', back: 'réfrigérateur', phonetic: '[lɔˈdufka]', examplePl: 'Mleko jest w lodówce.', exampleFr: 'Le lait est dans le réfrigérateur.', tags: ['maison', 'cuisine'] },
  { id: 'fc_home_14', moduleId: 'module_6', isPremium: true, front: 'kuchenka', back: 'cuisinière', phonetic: '[kuˈxɛŋka]', examplePl: 'Gotuję na kuchence.', exampleFr: 'Je fais cuire sur la cuisinière.', tags: ['maison', 'cuisine'] },
  { id: 'fc_home_15', moduleId: 'module_6', isPremium: true, front: 'pralka', back: 'machine à laver', phonetic: '[ˈpralka]', examplePl: 'Włącz pralkę.', exampleFr: 'Lance la machine à laver.', tags: ['maison'] },
  { id: 'fc_home_16', moduleId: 'module_6', isPremium: true, front: 'telewizor', back: 'télévision', phonetic: '[tɛlɛˈvizɔr]', examplePl: 'Oglądasz telewizor?', exampleFr: 'Tu regardes la télévision ?', tags: ['maison', 'électronique'] },
  { id: 'fc_home_17', moduleId: 'module_6', isPremium: true, front: 'komputer', back: 'ordinateur', phonetic: '[kɔmˈputɛr]', examplePl: 'Pracuję na komputerze.', exampleFr: 'Je travaille sur l\'ordinateur.', tags: ['maison', 'électronique'] },
  { id: 'fc_home_18', moduleId: 'module_6', isPremium: true, front: 'telefon', back: 'téléphone', phonetic: '[ˈtɛlɛfɔn]', examplePl: 'Zadzwoń do mnie.', exampleFr: 'Appelle-moi.', tags: ['maison', 'électronique'] },
  { id: 'fc_home_19', moduleId: 'module_6', isPremium: true, front: 'klucz', back: 'clé', phonetic: '[klutʂ]', examplePl: 'Gdzie są moje klucze?', exampleFr: 'Où sont mes clés ?', tags: ['maison'] },
  { id: 'fc_home_20', moduleId: 'module_6', isPremium: true, front: 'ogród', back: 'jardin', phonetic: '[ˈɔgrut]', examplePl: 'Mamy piękny ogród.', exampleFr: 'Nous avons un beau jardin.', tags: ['maison', 'extérieur'] },
];

// ── Toutes les flashcards combinées ──────────────────────────
export { FLASHCARDS as BASE_FLASHCARDS } from './flashcards';

export const ALL_FLASHCARDS = [
  ...require('./flashcards').FLASHCARDS,
  ...EXTENDED_FLASHCARDS,
];

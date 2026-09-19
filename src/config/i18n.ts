import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import fr from '../locales/fr.json';
import en from '../locales/en.json';

// Nécessaire pour les pluriels dans les versions récentes
import 'intl-pluralrules';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      fr: { translation: fr },
      en: { translation: en },
    },
    lng: 'fr', // langue par défaut
    fallbackLng: 'fr',
    interpolation: {
      escapeValue: false, // react déjà protégé contre les injections XSS
    },
    react: {
      useSuspense: false, // évite des problèmes avec les composants asynchrones
    },
  });

export default i18n;

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  // load translations using http (default public/locales)
  .use(Backend)
  // detect user language
  .use(LanguageDetector)
  // pass the i18n instance to react-i18next
  .use(initReactI18next)
  // init i18next
  .init({
    fallbackLng: 'en',
    debug: false,
    supportedLngs: ['en', 'ar'],

    interpolation: {
      escapeValue: false, // not needed for React as it escapes by default
    },

    // language direction
    react: {
      useSuspense: false,
    },
  });

export default i18n;

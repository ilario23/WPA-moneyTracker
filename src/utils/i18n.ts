import {createI18n} from 'vue-i18n';
import enUS from 'vant/es/locale/lang/en-US';
import itIT from 'vant/es/locale/lang/it-IT';
import esES from 'vant/es/locale/lang/es-ES';
import frFR from 'vant/es/locale/lang/fr-FR';
import {Locale} from 'vant';
import type {PickerColumn} from 'vant';

const FALLBACK_LOCALE = 'en-US';

const vantLocales = {
  'en-US': enUS,
  'it-IT': itIT,
  'es-ES': esES,
  'fr-FR': frFR,
};

export const languageColumns: PickerColumn = [
  {text: 'English', value: 'en-US'},
  {text: 'Italiano', value: 'it-IT'},
  {text: 'Español', value: 'es-ES'},
  {text: 'Français', value: 'fr-FR'},
];

export const i18n = setupI18n();
type I18n = typeof i18n;

export const locale = computed({
  get() {
    return i18n.global.locale.value;
  },
  set(language: string) {
    setLang(language, i18n);
  },
});

function setupI18n() {
  const locale = getI18nLocale();
  const i18n = createI18n({
    locale,
    legacy: false,
  });
  setLang(locale, i18n);
  return i18n;
}

async function setLang(lang: string, i18n: I18n) {
  await loadLocaleMsg(lang, i18n);

  document.querySelector('html').setAttribute('lang', lang);
  localStorage.setItem('language', lang);
  i18n.global.locale.value = lang;

  // Setting up vant component language packs
  Locale.use(lang, vantLocales[lang]);
}

// Loading local language packs
async function loadLocaleMsg(locale: string, i18n: I18n) {
  const messages = await import(`../locales/${locale}.json`);
  i18n.global.setLocaleMessage(locale, messages.default);
}

// Get the name of the language pack for the current language
function getI18nLocale() {
  const storedLocale = localStorage.getItem('language') || navigator.language;

  const langs = languageColumns.map((v) => v.value as string);

  // Language packs for the current language or language packs for any region of the current language.
  const foundLocale = langs.find(
    (v) => v === storedLocale || v.indexOf(storedLocale) === 0
  );

  // If not found, the default language pack is used.
  const locale = foundLocale || FALLBACK_LOCALE;

  return locale;
}

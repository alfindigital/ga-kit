import { useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { translations, TranslationKey } from '@/i18n/translations';

/**
 * Returns a `t()` function that maps a translation key to the localised string.
 * Falls back to English when a key is missing for the current language.
 */
export function useTranslation() {
  const { language } = useLanguage();

  const t = useCallback(
    (key: TranslationKey, replacements?: Record<string, string | number>): string => {
      const dict = translations[language] ?? translations.en;
      let value: string = dict[key] ?? translations.en[key] ?? key;

      if (replacements) {
        for (const [k, v] of Object.entries(replacements)) {
          value = value.replace(`{{${k}}}`, String(v));
        }
      }

      return value;
    },
    [language],
  );

  return { t, language };
}

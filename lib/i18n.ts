export const locales = ['en', 'ru'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

export function getLocale(): Locale {
  if (typeof window === 'undefined') return defaultLocale;

  const savedLocale = localStorage.getItem('locale');
  if (savedLocale && locales.includes(savedLocale as Locale)) {
    return savedLocale as Locale;
  }

  // Detect from browser
  const browserLocale = navigator.language.split('-')[0];
  if (locales.includes(browserLocale as Locale)) {
    return browserLocale as Locale;
  }

  return defaultLocale;
}

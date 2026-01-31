"use client";

import { createContext, useContext, useState } from 'react';
import { Locale, getLocale, locales } from './i18n';
import enMessages from '@/data/locales/en.json';
import ruMessages from '@/data/locales/ru.json';

type Messages = typeof enMessages;

interface LocaleContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const messages: Record<Locale, Messages> = {
  en: enMessages,
  ru: ruMessages,
};

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

// Pluralization rules
function getPluralKey(locale: Locale, count: number): string {
  if (locale === 'en') {
    return count === 1 ? 'one' : 'other';
  }

  if (locale === 'ru') {
    const lastTwo = count % 100;
    const lastOne = count % 10;

    if (lastTwo >= 11 && lastTwo <= 19) {
      return 'many';
    }
    if (lastOne === 1) {
      return 'one';
    }
    if (lastOne >= 2 && lastOne <= 4) {
      return 'few';
    }
    return 'many';
  }

  return 'other';
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(getLocale());

  const setLocale = (newLocale: Locale) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('locale', newLocale);
      setLocaleState(newLocale);
    }
  };

  const t = (key: string, params?: Record<string, string | number>) => {
    const keys = key.split('.');
    let value: any = messages[locale];

    for (const k of keys) {
      value = value?.[k];
    }

    if (typeof value !== 'string') {
      console.warn(`Translation missing for key: ${key}`);
      return key;
    }

    // Handle pluralization for count parameter
    if (params?.count !== undefined && typeof params.count === 'number') {
      const count = params.count;
      const pluralKey = getPluralKey(locale, count);

      // Try to find plural variant
      const parentKeys = keys.slice(0, -1);
      const baseKey = keys[keys.length - 1];

      let pluralValue: any = messages[locale];
      for (const k of parentKeys) {
        pluralValue = pluralValue?.[k];
      }

      const pluralKeyPath = `${baseKey}_${pluralKey}`;
      if (pluralValue?.[pluralKeyPath]) {
        value = pluralValue[pluralKeyPath];
      }
    }

    // Replace {{param}} with values
    return value.replace(/\{\{(\w+)\}\}/g, (_: string, match: string) =>
      params?.[match]?.toString() || `{{${match}}}`
    );
  };

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocale must be used within LocaleProvider');
  }
  return context;
}

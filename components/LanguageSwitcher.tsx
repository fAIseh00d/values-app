"use client";

import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/localeProvider";
import { locales, Locale } from "@/lib/i18n";
import { Languages } from "lucide-react";

const localeNames: Record<Locale, string> = {
  en: 'English',
  ru: 'Русский'
};

export function LanguageSwitcher() {
  const { locale, setLocale } = useLocale();

  return (
    <div className="flex items-center gap-2">
      <Languages className="h-4 w-4 text-gray-600" />
      {locales.map((localeItem) => (
        <Button
          key={localeItem}
          variant={locale === localeItem ? "default" : "outline"}
          size="sm"
          onClick={() => setLocale(localeItem)}
        >
          {localeNames[localeItem]}
        </Button>
      ))}
    </div>
  );
}

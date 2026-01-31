"use client";

import { useEffect } from "react";
import { useLocale } from "@/lib/localeProvider";

export function LocaleSetter({ children }: { children: React.ReactNode }) {
  const { locale } = useLocale();

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return <>{children}</>;
}

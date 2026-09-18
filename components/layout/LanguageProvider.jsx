"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getDictionary } from "@/lib/dictionary";

const LanguageContext = createContext(null);
const STORAGE_KEY = "mrb_locale";

export function LanguageProvider({ children }) {
  const [locale, setLocale] = useState("en");

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "en" || saved === "id") {
      setLocale(saved);
    }
  }, []);

  function toggleLocale() {
    setLocale((prev) => {
      const next = prev === "id" ? "en" : "id";
      window.localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }

  const value = useMemo(
    () => ({
      locale,
      toggleLocale,
      t: getDictionary(locale),
    }),
    [locale]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return ctx;
}
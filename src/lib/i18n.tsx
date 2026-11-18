import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type Lang = 'es' | 'en';

type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: <T>(es: T, en: T) => T };
const LangContext = createContext<Ctx | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    if (typeof window === 'undefined') return 'es';
    const s = window.localStorage.getItem('monitor-lang');
    return s === 'en' ? 'en' : 'es';
  });
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    window.localStorage.setItem('monitor-lang', l);
  }, []);
  const value = useMemo<Ctx>(
    () => ({ lang, setLang, t: <T,>(es: T, en: T) => (lang === 'es' ? es : en) }),
    [lang, setLang],
  );
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang() {
  const c = useContext(LangContext);
  if (!c) throw new Error('useLang outside provider');
  return c;
}

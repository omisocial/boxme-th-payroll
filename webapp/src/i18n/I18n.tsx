import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { translate, type DictKey, type Lang } from './dict'

const STORAGE_KEY = 'boxme.lang'

interface Ctx {
  lang: Lang
  setLang: (l: Lang) => void
  t: (key: DictKey) => string
}

const I18nContext = createContext<Ctx | null>(null)

function detectInitial(): Lang {
  if (typeof window === 'undefined') return 'en'
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'en' || stored === 'vi' || stored === 'th') return stored
  return 'en'
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(detectInitial)

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const setLang = useCallback((l: Lang) => {
    setLangState(l)
    try { localStorage.setItem(STORAGE_KEY, l) } catch { /* ignore */ }
  }, [])

  const t = useCallback((key: DictKey) => translate(key, lang), [lang])

  const value = useMemo<Ctx>(() => ({ lang, setLang, t }), [lang, setLang, t])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): Ctx {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}

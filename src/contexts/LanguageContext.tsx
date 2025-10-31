import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Language, SUPPORTED_LANGUAGES, Translations } from '../translations';
import { en } from '../translations/en';
import { es } from '../translations/es';
import { ar } from '../translations/ar';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
  direction: 'ltr' | 'rtl';
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations: Record<Language, Translations> = {
  en,
  es,
  ar,
  // Placeholder translations for other languages (use English as fallback)
  fr: en,
  de: en,
  zh: en,
  ja: en,
  pt: en,
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    // Load language from localStorage or detect browser language
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('allergen-aware-language') as Language;
      if (stored && SUPPORTED_LANGUAGES.some(l => l.code === stored)) {
        return stored;
      }
      
      // Try to detect browser language
      const browserLang = navigator.language.split('-')[0] as Language;
      if (SUPPORTED_LANGUAGES.some(l => l.code === browserLang)) {
        return browserLang;
      }
    }
    return 'en';
  });

  const currentLangInfo = SUPPORTED_LANGUAGES.find(l => l.code === language) || SUPPORTED_LANGUAGES[0];

  useEffect(() => {
    // Apply direction to document
    document.documentElement.dir = currentLangInfo.direction;
    document.documentElement.lang = language;
    
    // Save to localStorage
    localStorage.setItem('allergen-aware-language', language);
  }, [language, currentLangInfo.direction]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t: translations[language],
        direction: currentLangInfo.direction,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

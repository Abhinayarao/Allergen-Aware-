import { useState } from 'react';
import { Globe, Check } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { SUPPORTED_LANGUAGES, Language } from '../translations';
import { Button } from './ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './ui/popover';

interface LanguageSwitcherProps {
  variant?: 'button' | 'settings';
}

export function LanguageSwitcher({ variant = 'button' }: LanguageSwitcherProps) {
  const { language, setLanguage, t } = useLanguage();
  const [open, setOpen] = useState(false);

  const currentLanguage = SUPPORTED_LANGUAGES.find(l => l.code === language);

  if (variant === 'settings') {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-foreground">{t.settings.language}</h3>
            <p className="text-sm text-muted-foreground">{t.settings.chooseLanguage}</p>
          </div>
        </div>

        <div className="grid gap-2">
          {SUPPORTED_LANGUAGES.map((lang) => {
            const isSelected = language === lang.code;
            
            return (
              <button
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                className={`relative flex items-center gap-3 p-4 rounded-xl border-2 transition-all hover:scale-[1.02] ${
                  isSelected
                    ? 'border-green-500 bg-green-50 dark:bg-green-950 dark:border-green-600'
                    : 'border-border bg-card hover:border-green-300 dark:hover:border-green-700'
                }`}
              >
                <span className="text-2xl">{lang.flag}</span>
                <div className="flex-1 text-left">
                  <div className={`${isSelected ? 'text-green-600 dark:text-green-400 font-medium' : 'text-foreground'}`}>
                    {lang.name}
                  </div>
                  <div className="text-xs text-muted-foreground">{lang.englishName}</div>
                </div>
                {isSelected && (
                  <div className="bg-green-500 rounded-full p-1">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <p className="text-xs text-muted-foreground">
          {currentLanguage && `Currently using ${currentLanguage.name}`}
        </p>
      </div>
    );
  }

  // Button variant (for header)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="gap-2 hover:bg-accent"
          title={t.settings.language}
        >
          <Globe className="w-5 h-5" />
          <span className="hidden sm:inline">{currentLanguage?.code.toUpperCase()}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="end">
        <div className="space-y-1">
          <div className="px-2 py-1.5 text-sm font-medium text-foreground">
            {t.settings.chooseLanguage}
          </div>
          <div className="border-t border-border my-1" />
          {SUPPORTED_LANGUAGES.map((lang) => {
            const isSelected = language === lang.code;
            
            return (
              <button
                key={lang.code}
                onClick={() => {
                  setLanguage(lang.code);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  isSelected
                    ? 'bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400'
                    : 'hover:bg-accent text-foreground'
                }`}
              >
                <span className="text-xl">{lang.flag}</span>
                <div className="flex-1 text-left">
                  <div className="text-sm font-medium">{lang.name}</div>
                  <div className="text-xs text-muted-foreground">{lang.englishName}</div>
                </div>
                {isSelected && (
                  <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                )}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

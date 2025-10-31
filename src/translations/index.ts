// Translation system for Allergen-Aware Recipe Advisor

export type Language = 'en' | 'es' | 'fr' | 'ar' | 'de' | 'zh' | 'ja' | 'pt';

export interface LanguageInfo {
  code: Language;
  name: string; // Native name
  englishName: string;
  direction: 'ltr' | 'rtl';
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  { code: 'en', name: 'English', englishName: 'English', direction: 'ltr', flag: '🇺🇸' },
  { code: 'es', name: 'Español', englishName: 'Spanish', direction: 'ltr', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', englishName: 'French', direction: 'ltr', flag: '🇫🇷' },
  { code: 'ar', name: 'العربية', englishName: 'Arabic', direction: 'rtl', flag: '🇸🇦' },
  { code: 'de', name: 'Deutsch', englishName: 'German', direction: 'ltr', flag: '🇩🇪' },
  { code: 'zh', name: '中文', englishName: 'Chinese', direction: 'ltr', flag: '🇨🇳' },
  { code: 'ja', name: '日本語', englishName: 'Japanese', direction: 'ltr', flag: '🇯🇵' },
  { code: 'pt', name: 'Português', englishName: 'Portuguese', direction: 'ltr', flag: '🇧🇷' },
];

export interface Translations {
  // Common
  common: {
    appName: string;
    tagline: string;
    loading: string;
    save: string;
    cancel: string;
    edit: string;
    delete: string;
    back: string;
    next: string;
    continue: string;
    getStarted: string;
    confirm: string;
    close: string;
  };

  // Header & Navigation
  nav: {
    home: string;
    history: string;
    settings: string;
    allergens: string;
  };

  // Welcome Page
  welcome: {
    title: string;
    subtitle: string;
    feature1: string;
    feature2: string;
    feature3: string;
    cta: string;
  };

  // Profile Setup
  profile: {
    title: string;
    subtitle: string;
    name: string;
    namePlaceholder: string;
    age: string;
    agePlaceholder: string;
    gender: string;
    genderPlaceholder: string;
    male: string;
    female: string;
    nonBinary: string;
    preferNotToSay: string;
    ageRanges: {
      under18: string;
      '18-24': string;
      '25-34': string;
      '35-44': string;
      '45-54': string;
      '55-64': string;
      '65+': string;
    };
  };

  // Allergen Setup
  allergens: {
    title: string;
    subtitle: string;
    selectAllergens: string;
    selected: string;
    allergen: string;
    allergens: string;
    clearAll: string;
    noAllergens: string;
    addAllergens: string;
    myAllergens: string;
    detectedAllergens: string;
  };

  // Home Page
  home: {
    title: string;
    subtitle: string;
    searchLabel: string;
    searchPlaceholder: string;
    analyzeButton: string;
    scanButton: string;
    alertNoAllergens: string;
    addAllergensNow: string;
  };

  // Analysis Results
  results: {
    backToSearch: string;
    confidenceScore: string;
    safe: string;
    risky: string;
    unsafe: string;
    safeToEat: string;
    proceedWithCaution: string;
    notSafe: string;
    detectedAllergens: string;
    riskyIngredients: string;
    suggestedSubstitutions: string;
    alternativeDishes: string;
    nutritionInfo: string;
    calories: string;
    protein: string;
    carbs: string;
    fat: string;
  };

  // Camera/Scan Page
  scan: {
    title: string;
    scanFood: string;
    uploadImage: string;
    scanBarcode: string;
    takePicture: string;
    analyzing: string;
  };

  // History/Favorites
  history: {
    title: string;
    subtitle: string;
    noHistory: string;
    clearHistory: string;
    confirmClear: string;
    entryDeleted: string;
    historyCleared: string;
    filterAll: string;
    filterSafe: string;
    filterRisky: string;
    filterUnsafe: string;
  };

  // Settings
  settings: {
    title: string;
    subtitle: string;
    profileInfo: string;
    editProfile: string;
    saveProfile: string;
    profileSaved: string;
    themeSettings: string;
    appearance: string;
    chooseTheme: string;
    light: string;
    dark: string;
    auto: string;
    themeLight: string;
    themeDark: string;
    themeAuto: string;
    languageSettings: string;
    language: string;
    chooseLanguage: string;
    notSpecified: string;
    infoMessage: string;
  };

  // Toasts/Notifications
  notifications: {
    welcome: string;
    profileSaved: string;
    analysisComplete: string;
    analysisFailed: string;
    setAllergensFirst: string;
    entryDeleted: string;
    historyCleared: string;
    failedToDelete: string;
    failedToClear: string;
  };
}

import { useState, useEffect } from 'react';
import { Settings } from 'lucide-react';
import { ShieldUtensilIcon } from './components/ShieldUtensilIcon';
import { Navigation } from './components/Navigation';
import { WelcomePage } from './components/WelcomePage';
import { ProfileSetupPage } from './components/ProfileSetupPage';
import { OnboardingAllergenPage } from './components/OnboardingAllergenPage';
import { HomePage } from './components/HomePage';
import { AnalysisResultsPage } from './components/AnalysisResultsPage';
import { FavoritesPage } from './components/FavoritesPage';
import { CameraScanPage } from './components/CameraScanPage';
import { SettingsPage } from './components/SettingsPage';
import { LanguageSwitcher } from './components/LanguageSwitcher';
// Supabase Edge Function usage removed; using FastAPI via src/lib/api
import { toast } from 'sonner@2.0.3';
import { Toaster } from './components/ui/sonner';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { FavoriteCardsProvider } from './contexts/FavoriteCardsContext';
import Login from './pages/Login';
import Register from './pages/Register';

type Page = 'welcome' | 'profile-setup' | 'allergen-setup' | 'login' | 'register' | 'home' | 'results' | 'history' | 'scan' | 'settings';

interface UserProfile {
  name: string;
  age?: string;
  gender?: string;
  allergens: string[];
}

interface AnalysisResult {
  dishName: string;
  verdict: 'SAFE' | 'RISKY' | 'UNSAFE';
  confidence: number;
  detectedAllergens: string[];
  riskyIngredients: string[];
  substitutions: Array<{
    original: string;
    replacement: string;
    reason: string;
  }>;
  alternativeDishes: Array<{
    name: string;
    reason: string;
  }>;
  explanation: string;
  nutrition?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  imageUrl?: string;
}

interface HistoryEntry extends AnalysisResult {
  id: string;
  timestamp: string;
}

function AppContent() {
  const { t } = useLanguage();
  const [currentPage, setCurrentPage] = useState<Page>('welcome');
  const [userId] = useState(() => {
    // Generate or retrieve user ID from localStorage
    let id = localStorage.getItem('allergen-aware-user-id');
    if (!id) {
      id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('allergen-aware-user-id', id);
    }
    return id;
  });

  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: '',
    allergens: [],
  });
  const [tempProfile, setTempProfile] = useState<Partial<UserProfile>>({});
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [currentResult, setCurrentResult] = useState<AnalysisResult | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  // Auth token presence indicates authenticated state
  const [accessToken] = useState<string | null>(() => localStorage.getItem('access_token'));

  // Load user profile and history on mount
  useEffect(() => {
    loadUserProfile();
    loadHistory();
    
    // Hide splash screen after 2 seconds
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Check onboarding status after loading profile
  useEffect(() => {
    if (!showSplash) {
      if (!localStorage.getItem('access_token')) {
        setCurrentPage('login');
      } else if (hasCompletedOnboarding && userProfile.name) {
        setCurrentPage('home');
      } else {
        setCurrentPage('welcome');
      }
    }
  }, [showSplash, hasCompletedOnboarding]);

  const loadUserProfile = async () => {
    try {
      const { getProfile, getAllergens } = await import('./lib/api');
      const [profileData, allergenData] = await Promise.all([getProfile().catch(() => null), getAllergens().catch(() => null)]);

      const allergens: string[] = [];
      if (allergenData) {
        const map: Record<string, string> = {
          peanuts: 'peanuts',
          tree_nuts: 'tree-nuts',
          shellfish: 'shellfish',
          fish: 'fish',
          gluten: 'gluten',
          dairy: 'dairy',
          eggs: 'eggs',
          soy: 'soy',
          sesame: 'sesame',
          sulfites: 'sulfites',
          mustard: 'mustard',
          celery: 'celery',
          lupin: 'lupin',
          mollusks: 'mollusks',
        };
        Object.entries(map).forEach(([key, id]) => {
          if (allergenData[key]) allergens.push(id);
        });
        if (Array.isArray(allergenData.custom_allergens)) {
          allergens.push(...allergenData.custom_allergens);
        }
      }

      if (profileData) {
        setUserProfile({
          name: profileData.name || '',
          age: profileData.age,
          gender: profileData.gender,
          allergens,
        });
        setHasCompletedOnboarding(Boolean(profileData.name));
      }
    } catch {}
  };

  const loadHistory = async () => {
    try {
      const { getHistory } = await import('./lib/api');
      const data = await getHistory();
      setHistory(data || []);
    } catch {}
  };

  const saveUserProfile = async (profile: UserProfile) => {
    setIsSaving(true);
    try {
      const { updateProfile, updateAllergens } = await import('./lib/api');
      await updateProfile({ name: profile.name, age: profile.age, gender: profile.gender });

      const allergenPayload: any = {
        peanuts: profile.allergens.includes('peanuts'),
        tree_nuts: profile.allergens.includes('tree-nuts'),
        shellfish: profile.allergens.includes('shellfish'),
        fish: profile.allergens.includes('fish'),
        gluten: profile.allergens.includes('gluten'),
        dairy: profile.allergens.includes('dairy'),
        eggs: profile.allergens.includes('eggs'),
        soy: profile.allergens.includes('soy'),
        sesame: profile.allergens.includes('sesame'),
        sulfites: profile.allergens.includes('sulfites'),
        mustard: profile.allergens.includes('mustard'),
        celery: profile.allergens.includes('celery'),
        lupin: profile.allergens.includes('lupin'),
        mollusks: profile.allergens.includes('mollusks'),
      };
      await updateAllergens(allergenPayload);
      setUserProfile(profile);
      setHasCompletedOnboarding(true);
      toast.success('Profile saved successfully!');
      return true;
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save profile. Please try again.');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleProfileSetup = (profile: { name: string; age?: string; gender?: string }) => {
    setTempProfile(profile);
    setCurrentPage('allergen-setup');
  };

  const handleAllergenSetup = async (allergens: string[]) => {
    const completeProfile: UserProfile = {
      name: tempProfile.name || '',
      age: tempProfile.age,
      gender: tempProfile.gender,
      allergens,
    };

    const success = await saveUserProfile(completeProfile);
    if (success) {
      setCurrentPage('home');
      toast.success(`Welcome, ${completeProfile.name}! 🎉`);
    }
  };

  const handleSaveSettings = async (updatedProfile: UserProfile) => {
    await saveUserProfile(updatedProfile);
  };

  const handleAnalyze = async (data: { method: string; value: string | File }) => {
    if (userProfile.allergens.length === 0) {
      toast.error('Please set your allergens first!');
      setCurrentPage('settings');
      return;
    }

    setIsLoading(true);

    try {
      let result: any = null;
      const { scanImage, scanBarcode, scanVoice, analyzeFood, addHistory } = await import('./lib/api');

      if (data.method === 'upload') {
        const file = data.value as File;
        const scanRes = await scanImage(file);
        result = scanRes?.food_details ? {
          dishName: scanRes.food_details.food_name,
          explanation: 'AI-based allergen analysis',
          detectedAllergens: [],
          substitutions: [],
          alternativeDishes: [],
          riskyIngredients: scanRes.food_details.ingredients || [],
          verdict: 'SAFE',
          confidence: 70,
        } : null;
      } else if (data.method === 'barcode') {
        const barcode = String(data.value);
        const scanRes = await scanBarcode(barcode);
        result = scanRes?.food_details ? {
          dishName: scanRes.food_details.food_name || `Product ${barcode}`,
          explanation: 'AI-based allergen analysis',
          detectedAllergens: [],
          substitutions: [],
          alternativeDishes: [],
          riskyIngredients: scanRes.food_details.ingredients || [],
          verdict: 'SAFE',
          confidence: 65,
        } : null;
      } else if (data.method === 'search') {
        const foodDetails = {
          food_name: String(data.value),
          ingredients: [],
          nutrition: null,
        } as any;
        const res = await analyzeFood(foodDetails);
        result = {
          dishName: res.food_name || String(data.value),
          explanation: res.analysis_details || 'AI-based allergen analysis',
          detectedAllergens: res.detected_allergens || res.detectedAllergens || [],
          substitutions: res.substitutions || [],
          alternativeDishes: res.alternative_suggestions || [],
          riskyIngredients: res.risk_factors || [],
          verdict: (res.is_safe ? 'SAFE' : (res.risk_level === 'high' ? 'UNSAFE' : 'RISKY')),
          confidence: Math.round((res.confidence_score || 0.7) * 100),
        };
      }

      // Add some mock nutrition data if not present
      if (!result.nutrition) {
        result.nutrition = {
          calories: Math.floor(Math.random() * 400) + 200,
          protein: Math.floor(Math.random() * 30) + 10,
          carbs: Math.floor(Math.random() * 50) + 20,
          fat: Math.floor(Math.random() * 20) + 5,
        };
      }

      setCurrentResult(result);

      // Save to history
      await addHistory({ analysis: result });

      // Reload history
      loadHistory();

      setCurrentPage('results');
      toast.success('Analysis complete!');
    } catch (error) {
      console.error('Error analyzing:', error);
      const errorMessage = error.message || 'Unknown error';
      toast.error(`Analysis failed: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleDeleteHistoryEntry = async (entryId: string) => {
    try {
      const { deleteHistoryEntry } = await import('./lib/api');
      await deleteHistoryEntry(entryId);
      setHistory(history.filter((entry) => entry.id !== entryId));
      toast.success('Entry deleted');
    } catch (error) {
      console.error('Error deleting history entry:', error);
      toast.error('Failed to delete entry');
    }
  };

  const handleClearHistory = async () => {
    if (!confirm('Are you sure you want to clear all history?')) {
      return;
    }

    try {
      const { clearHistory } = await import('./lib/api');
      await clearHistory();
      setHistory([]);
      toast.success('History cleared');
    } catch (error) {
      console.error('Error clearing history:', error);
      toast.error('Failed to clear history');
    }
  };

  const handleViewHistoryDetails = (entry: HistoryEntry) => {
    setCurrentResult(entry);
    setCurrentPage('results');
  };

  // Splash Screen
  if (showSplash) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-400 via-green-500 to-green-600 flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="bg-white p-6 rounded-3xl shadow-2xl mb-6 inline-block animate-bounce">
            <ShieldUtensilIcon size={80} />
          </div>
          <h1 className="text-white mb-2">{t.common.appName}</h1>
          <p className="text-green-100 text-xl mb-4">{t.common.tagline}</p>
          <p className="text-white">Eat Smart. Stay Safe. Powered by AI.</p>
        </div>
      </div>
    );
  }

  // Onboarding Pages
  if (currentPage === 'welcome') {
    return (
      <>
        <Toaster position="top-center" />
        <WelcomePage onGetStarted={() => setCurrentPage('profile-setup')} />
      </>
    );
  }

  if (currentPage === 'profile-setup') {
    return (
      <>
        <Toaster position="top-center" />
        <ProfileSetupPage onNext={handleProfileSetup} />
      </>
    );
  }

  if (currentPage === 'allergen-setup') {
    return (
      <>
        <Toaster position="top-center" />
        <OnboardingAllergenPage
          onComplete={handleAllergenSetup}
          isLoading={isSaving}
        />
      </>
    );
  }

  if (currentPage === 'login') {
    return (
      <>
        <Toaster position="top-center" />
        <Login onSuccess={() => setCurrentPage('welcome')} onNavigateRegister={() => setCurrentPage('register')} />
      </>
    );
  }

  if (currentPage === 'register') {
    return (
      <>
        <Toaster position="top-center" />
        <Register onSuccess={() => setCurrentPage('welcome')} onNavigateLogin={() => setCurrentPage('login')} />
      </>
    );
  }

  // Main App
  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-center" />
      
      {/* Header - Hide on scan page */}
        {currentPage !== 'scan' && (
          <header className="bg-card border-b border-border sticky top-0 z-40 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
              <button
                onClick={() => setCurrentPage('home')}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <ShieldUtensilIcon size={32} />
                <span className="hidden sm:inline text-foreground">{t.common.appName}</span>
              </button>

              <div className="flex items-center gap-2">
                <Navigation currentPage={currentPage} onNavigate={(page) => setCurrentPage(page as Page)} />
                
                {/* Language Switcher - Desktop */}
                <div className="hidden md:block">
                  <LanguageSwitcher variant="button" />
                </div>
                
                {/* Settings Icon - Desktop */}
                <button
                  onClick={() => setCurrentPage('settings')}
                  className={`hidden md:flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                    currentPage === 'settings'
                      ? 'bg-green-500 text-white dark:bg-green-600'
                      : 'text-muted-foreground hover:bg-accent'
                  }`}
                >
                  <Settings className="w-5 h-5" />
                  <span>{t.nav.settings}</span>
                </button>
              </div>
            </div>
          </header>
        )}

      {/* Main Content */}
      <main>
        {currentPage === 'home' && (
          <HomePage
            onAnalyze={handleAnalyze}
            onNavigateToAllergens={() => setCurrentPage('settings')}
            onNavigateToScan={() => setCurrentPage('scan')}
            isLoading={isLoading}
            hasAllergens={userProfile.allergens.length > 0}
            userAllergens={userProfile.allergens}
          />
        )}

        {currentPage === 'scan' && localStorage.getItem('access_token') && (
          <CameraScanPage
            onCapture={(file) => handleAnalyze({ method: 'upload', value: file })}
            onUpload={(file) => handleAnalyze({ method: 'upload', value: file })}
            onBarcode={(barcode) => handleAnalyze({ method: 'barcode', value: barcode })}
            onVoice={async (payload) => {
              try {
                const { scanVoice } = await import('./lib/api');
                await scanVoice(payload);
                toast.success('Voice analyzed');
              } catch (e: any) {
                toast.error(e.message || 'Voice analysis failed');
              }
            }}
            onBack={() => setCurrentPage('home')}
            isLoading={isLoading}
          />
        )}

        {currentPage === 'settings' && localStorage.getItem('access_token') && (
          <SettingsPage
            profile={userProfile}
            onSave={handleSaveSettings}
            isSaving={isSaving}
          />
        )}

        {currentPage === 'results' && currentResult && (
          <AnalysisResultsPage
            result={currentResult}
            onBack={() => setCurrentPage('home')}
          />
        )}

        {currentPage === 'history' && localStorage.getItem('access_token') && (
          <FavoritesPage
            history={history}
            onDeleteEntry={handleDeleteHistoryEntry}
            onClearHistory={handleClearHistory}
            onViewDetails={handleViewHistoryDetails}
          />
        )}
      </main>

        {/* Mobile Bottom Navigation with Settings */}
        {currentPage !== 'scan' && currentPage !== 'welcome' && currentPage !== 'profile-setup' && currentPage !== 'allergen-setup' && (
          <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border px-2 py-2 z-50">
            <div className="flex items-center justify-around">
              <button
                onClick={() => setCurrentPage('home')}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all ${
                  currentPage === 'home' ? 'text-green-500 dark:text-green-400' : 'text-muted-foreground'
                }`}
              >
                <ShieldUtensilIcon size={24} />
                <span className="text-xs">{t.nav.home}</span>
              </button>
              <button
                onClick={() => setCurrentPage('history')}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all ${
                  currentPage === 'history' ? 'text-green-500 dark:text-green-400' : 'text-muted-foreground'
                }`}
              >
                <span className="text-xl">🕒</span>
                <span className="text-xs">{t.nav.history}</span>
              </button>
              <button
                onClick={() => setCurrentPage('settings')}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all ${
                  currentPage === 'settings' ? 'text-green-500 dark:text-green-400' : 'text-muted-foreground'
                }`}
              >
                <Settings className="w-6 h-6" />
                <span className="text-xs">{t.nav.settings}</span>
              </button>
            </div>
          </nav>
        )}
      </div>
  );
}

// Wrapper component with providers
export default function App() {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <FavoriteCardsProvider>
          <AppContent />
        </FavoriteCardsProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
}

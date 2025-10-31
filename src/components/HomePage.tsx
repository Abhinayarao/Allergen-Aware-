import { useState } from 'react';
import { Search, Camera, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { useLanguage } from '../contexts/LanguageContext';
import { EducationalCardsCarousel } from './EducationalCardsCarousel';
import { EducationalCardsModal } from './EducationalCardsModal';
import { educationalCards } from '../data/educationalCards';

interface HomePageProps {
  onAnalyze: (data: { method: string; value: string | File }) => void;
  onNavigateToAllergens: () => void;
  onNavigateToScan: () => void;
  isLoading: boolean;
  hasAllergens: boolean;
  userAllergens?: string[];
}

export function HomePage({ onAnalyze, onNavigateToAllergens, onNavigateToScan, isLoading, hasAllergens, userAllergens = [] }: HomePageProps) {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAnalyze = () => {
    if (searchQuery.trim()) {
      onAnalyze({ method: 'search', value: searchQuery });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white dark:from-gray-900 dark:to-gray-950 pb-24 md:pb-8">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Allergen Alert Banner */}
        {!hasAllergens && (
          <Alert className="mb-6 bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertDescription className="text-amber-800 dark:text-amber-200">
              <span className="block sm:inline">{t.home.alertNoAllergens} </span>
              <button
                onClick={onNavigateToAllergens}
                className="underline hover:text-amber-900 dark:hover:text-amber-100 font-medium"
              >
                {t.home.addAllergensNow}
              </button>
            </AlertDescription>
          </Alert>
        )}
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="bg-green-500 dark:bg-green-600 p-3 rounded-2xl">
              <Search className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-foreground mb-2">{t.home.title}</h1>
          <p className="text-muted-foreground">{t.home.subtitle}</p>
        </div>

        {/* Main Card */}
        <Card className="p-6 shadow-lg mb-6 bg-card border-border">
          <div className="space-y-4">
            <div>
              <label className="block text-foreground mb-2">{t.home.searchLabel}</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    placeholder={t.home.searchPlaceholder}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAnalyze()}
                    className="w-full pr-12"
                  />
                  <button
                    onClick={onNavigateToScan}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-accent rounded-lg transition-colors"
                    title="Scan with camera"
                  >
                    <Camera className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>
              </div>
            </div>

            {/* Analyze Button */}
            <Button
              onClick={handleAnalyze}
              disabled={isLoading || !searchQuery.trim()}
              className="w-full bg-green-500 hover:bg-green-600 text-white py-6 rounded-xl"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {t.scan.analyzing}
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Search className="w-5 h-5" />
                  {t.home.analyzeButton}
                </span>
              )}
            </Button>

            {/* Footer */}
            <div className="text-center space-y-3">
              <p className="text-sm text-gray-500">Powered by FatSecret and Gemini AI</p>
              <button
                onClick={onNavigateToAllergens}
                className="text-green-600 hover:text-green-700 underline"
              >
                Set My Allergens
              </button>
            </div>
          </div>
        </Card>

        {/* Educational Cards Carousel */}
        <div className="mb-6">
          <EducationalCardsCarousel 
            cards={educationalCards}
            onOpenModal={() => setIsModalOpen(true)}
            userAllergens={userAllergens}
          />
        </div>
      </div>

      {/* Educational Cards Modal */}
      <EducationalCardsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        cards={educationalCards}
        userAllergens={userAllergens}
      />
    </div>
  );
}

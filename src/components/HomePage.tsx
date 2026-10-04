import { useState, useEffect, useRef } from 'react';
import { Search, Camera, AlertCircle, Loader2, Utensils, Store, Clock, Image as ImageIcon } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { useLanguage } from '../contexts/LanguageContext';
import { EducationalCardsCarousel } from './EducationalCardsCarousel';
import { EducationalCardsModal } from './EducationalCardsModal';
import { educationalCards } from '../data/educationalCards';
import { searchFoods } from '../lib/api';

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
  const [suggestions, setSuggestions] = useState<Array<{ food_id: string; food_name: string; brand_name?: string; food_type?: string; food_description?: string }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Debounced search for suggestions
  useEffect(() => {
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // If query is empty, clear suggestions
    if (searchQuery.trim().length === 0) {
      setSuggestions([]);
      setShowSuggestions(false);
      setIsSearching(false);
      return;
    }

    // Set loading state
    setIsSearching(true);

    // Debounce the search
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const query = searchQuery.trim();
        console.log('🔍 Fetching suggestions for:', query);
        
        if (!query) {
          setSuggestions([]);
          setShowSuggestions(false);
          setIsSearching(false);
          return;
        }
        
        const results = await searchFoods(query, 8);
        console.log('📦 Raw API response:', JSON.stringify(results, null, 2));
        
        // Handle different response formats - backend returns { foods: [...], total_results: ... }
        let foods = [];
        if (results) {
          // Primary format: { foods: [...] } - this is what our backend returns
          if (results.foods && Array.isArray(results.foods)) {
            foods = results.foods;
            console.log('✅ Found foods array:', foods.length, 'items');
          } 
          // Fallback: direct array
          else if (Array.isArray(results)) {
            foods = results;
            console.log('✅ Found direct array:', foods.length, 'items');
          } 
          // Fallback: nested data
          else if (results.data && Array.isArray(results.data)) {
            foods = results.data;
            console.log('✅ Found nested data array:', foods.length, 'items');
          }
          // Check for FatSecret direct format: { foods: { food: [...] } }
          else if (results.foods && results.foods.food) {
            const foodList = results.foods.food;
            foods = Array.isArray(foodList) ? foodList : [foodList];
            console.log('✅ Found FatSecret format:', foods.length, 'items');
          }
        }
        
        console.log('📋 Processed foods array:', foods);
        
        if (foods && foods.length > 0) {
          // Ensure we have valid food objects with food_name
          const validFoods = foods
            .filter(f => {
              const hasName = f && (f.food_name || f.name);
              if (!hasName) {
                console.warn('⚠️ Skipping food item without name:', f);
              }
              return hasName;
            })
            .map(f => ({
              food_id: f.food_id || f.id || String(Math.random()),
              food_name: f.food_name || f.name || '',
              brand_name: f.brand_name || null,
              food_type: f.food_type || null,
              food_description: f.food_description || null
            }));
            
          console.log('✅ Valid foods after processing:', validFoods.length);
          console.log('📝 Valid foods:', validFoods);
            
          if (validFoods.length > 0) {
            console.log('✨ Setting suggestions state...');
            setSuggestions(validFoods);
            setShowSuggestions(true);
            console.log('✅ Suggestions state updated! showSuggestions: true, count:', validFoods.length);
          } else {
            console.log('❌ No valid foods after filtering');
            setSuggestions([]);
            setShowSuggestions(false);
          }
        } else {
          console.log('❌ No foods found in response');
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } catch (error: any) {
        console.error('❌ Error fetching suggestions:', error);
        console.error('Error details:', {
          message: error?.message,
          stack: error?.stack,
          response: error?.response
        });
        // Don't show error to user, just hide suggestions
        setSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setIsSearching(false);
      }
    }, 300); // 300ms debounce

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleAnalyze = () => {
    if (searchQuery.trim()) {
      setShowSuggestions(false);
      onAnalyze({ method: 'search', value: searchQuery });
    }
  };

  const handleSuggestionClick = (foodName: string) => {
    setSearchQuery(foodName);
    setShowSuggestions(false);
    onAnalyze({ method: 'search', value: foodName });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setSelectedIndex(-1); // Reset selection when typing
  };

  const handleInputFocus = () => {
    // Show suggestions if we have any, or if we're currently searching
    if (suggestions.length > 0 || isSearching) {
      setShowSuggestions(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter') {
        handleAnalyze();
      }
      return;
    }

    const totalItems = suggestions.length;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev < totalItems - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          // Select suggestion
          handleSuggestionClick(suggestions[selectedIndex].food_name);
        } else {
          // Search for exact query
          handleSuggestionClick(searchQuery);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
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
                    ref={inputRef}
                    placeholder={t.home.searchPlaceholder}
                    value={searchQuery}
                    onChange={handleInputChange}
                    onFocus={handleInputFocus}
                    onKeyDown={handleKeyDown}
                    className="w-full pr-12"
                  />
                  {isSearching && (
                    <div className="absolute right-12 top-1/2 -translate-y-1/2">
                      <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
                    </div>
                  )}
                  <button
                    onClick={onNavigateToScan}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-accent rounded-lg transition-colors"
                    title="Scan with camera"
                  >
                    <Camera className="w-5 h-5 text-muted-foreground" />
                  </button>
                  
                  {/* Suggestions Dropdown - Google-style */}
                  {showSuggestions && suggestions.length > 0 && (
                    <div
                      ref={suggestionsRef}
                      className="absolute z-[9999] w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl max-h-80 overflow-y-auto"
                      style={{ top: 'calc(100% + 4px)', left: 0 }}
                    >
                      {/* Food suggestions - Google-style */}
                      {suggestions.map((food, index) => {
                        return (
                          <button
                            key={food.food_id || food.food_name || index}
                            onClick={() => handleSuggestionClick(food.food_name)}
                            className={`w-full text-left px-4 py-2.5 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-b-0 flex items-center gap-3 group ${
                              selectedIndex === index
                                ? 'bg-blue-50 dark:bg-blue-900/20'
                                : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                            }`}
                          >
                            <Search className="w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm text-gray-900 dark:text-gray-100 font-normal group-hover:text-blue-600 dark:group-hover:text-blue-400">
                                {food.food_name}
                              </div>
                              {(food.brand_name || food.food_description) && (
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                                  {food.brand_name && food.brand_name.toLowerCase() !== 'generic' && (
                                    <span>{food.brand_name}</span>
                                  )}
                                  {food.brand_name && food.food_description && <span> • </span>}
                                  {food.food_description && (
                                    <span className="truncate">{food.food_description}</span>
                                  )}
                                </div>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
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

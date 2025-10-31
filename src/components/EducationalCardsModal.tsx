import { useState, useRef, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Shuffle, Star } from 'lucide-react';
import { EducationalCard, CardData } from './EducationalCard';
import { Button } from './ui/button';
import { Dialog, DialogContent } from './ui/dialog';
import { useFavoriteCards } from '../contexts/FavoriteCardsContext';

interface EducationalCardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  cards: CardData[];
  initialIndex?: number;
  userAllergens?: string[];
}

export function EducationalCardsModal({
  isOpen,
  onClose,
  cards,
  initialIndex = 0,
  userAllergens = [],
}: EducationalCardsModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [displayCards, setDisplayCards] = useState(cards);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const { favoriteCards } = useFavoriteCards();
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  // Personalize cards based on user allergens
  useEffect(() => {
    let filteredCards = cards;
    
    if (showFavoritesOnly) {
      filteredCards = cards.filter(card => favoriteCards.includes(card.id));
    }
    
    // If no favorites, show all cards
    if (filteredCards.length === 0) {
      filteredCards = cards;
      setShowFavoritesOnly(false);
    }
    
    setDisplayCards(filteredCards);
    setCurrentIndex(0);
  }, [showFavoritesOnly, favoriteCards, cards]);

  const shuffleCards = () => {
    const shuffled = [...displayCards].sort(() => Math.random() - 0.5);
    setDisplayCards(shuffled);
    setCurrentIndex(0);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : displayCards.length - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev < displayCards.length - 1 ? prev + 1 : 0));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') goToPrevious();
    if (e.key === 'ArrowRight') goToNext();
    if (e.key === 'Escape') onClose();
  };

  // Touch swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const swipeThreshold = 50;
    const diff = touchStartX.current - touchEndX.current;

    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0) {
        setSwipeDirection('left');
        goToNext(); // Swiped left
      } else {
        setSwipeDirection('right');
        goToPrevious(); // Swiped right
      }
      
      // Reset direction after animation
      setTimeout(() => setSwipeDirection(null), 300);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-full h-full sm:max-w-2xl sm:h-auto bg-black/95 dark:bg-black/98 border-none p-0"
        onKeyDown={handleKeyDown}
      >
        {/* Semi-transparent dark background overlay */}
        <div 
          className="relative w-full h-full flex items-center justify-center p-4 sm:p-8"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Top Controls */}
          <div className="absolute top-4 left-4 right-4 z-30 flex items-center justify-between">
            <div className="flex gap-2">
              {/* Shuffle Button */}
              <button
                onClick={shuffleCards}
                className="bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full p-2 transition-colors"
                aria-label="Shuffle cards"
              >
                <Shuffle className="w-5 h-5 text-white" />
              </button>

              {/* Favorites Filter Button */}
              <button
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                className={`backdrop-blur-sm rounded-full p-2 transition-colors ${
                  showFavoritesOnly 
                    ? 'bg-white/30 hover:bg-white/40' 
                    : 'bg-white/10 hover:bg-white/20'
                }`}
                aria-label={showFavoritesOnly ? 'Show all cards' : 'Show favorites only'}
              >
                <Star 
                  className={`w-5 h-5 transition-all ${
                    showFavoritesOnly ? 'fill-white text-white' : 'text-white'
                  }`}
                />
              </button>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full p-2 transition-colors"
              aria-label="Close"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>

          {/* Previous Button */}
          <button
            onClick={goToPrevious}
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-30 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full p-3 transition-colors"
            aria-label="Previous card"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>

          {/* Next Button */}
          <button
            onClick={goToNext}
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-30 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full p-3 transition-colors"
            aria-label="Next card"
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>

          {/* Card */}
          <div className={`w-full max-w-sm transition-transform duration-300 ${
            swipeDirection === 'left' ? 'animate-slide-out-left' : 
            swipeDirection === 'right' ? 'animate-slide-out-right' : 
            'animate-fade-in'
          }`}>
            <EducationalCard card={displayCards[currentIndex]} isModal={true} />
          </div>

          {/* Navigation Info */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-3">
            {/* Dots */}
            <div className="flex items-center gap-2 max-w-xs overflow-x-auto scrollbar-hide px-2">
              {displayCards.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`h-2 rounded-full transition-all flex-shrink-0 ${
                    index === currentIndex
                      ? 'w-8 bg-white'
                      : 'w-2 bg-white/40 hover:bg-white/60'
                  }`}
                  aria-label={`Go to card ${index + 1}`}
                />
              ))}
            </div>

            {/* Counter */}
            <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
              <span className="text-white text-sm">
                {currentIndex + 1} / {displayCards.length}
                {showFavoritesOnly && ' (Favorites)'}
              </span>
            </div>

            {/* Instructions */}
            <div className="text-center">
              <div className="text-white/60 text-xs">
                <span className="hidden sm:inline">Arrow keys or </span>
                <span className="sm:hidden">👈 Swipe 👉</span>
                <span className="hidden sm:inline">Swipe to navigate</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

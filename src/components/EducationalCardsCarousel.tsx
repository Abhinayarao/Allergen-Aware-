import { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, Shuffle, Heart } from 'lucide-react';
import { EducationalCard, CardData } from './EducationalCard';
import { Button } from './ui/button';
import { useFavoriteCards } from '../contexts/FavoriteCardsContext';

interface EducationalCardsCarouselProps {
  cards: CardData[];
  onOpenModal?: () => void;
  userAllergens?: string[];
}

export function EducationalCardsCarousel({ cards, onOpenModal, userAllergens = [] }: EducationalCardsCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayCards, setDisplayCards] = useState(cards);
  const { favoriteCards } = useFavoriteCards();

  // Personalize card order based on user allergens on mount
  useEffect(() => {
    if (userAllergens.length > 0) {
      // Prioritize tips and risks for users with allergens
      const prioritized = [...cards].sort((a, b) => {
        if (a.type === 'tip' && b.type !== 'tip') return -1;
        if (a.type !== 'tip' && b.type === 'tip') return 1;
        if (a.type === 'risk' && b.type === 'trivia') return -1;
        if (a.type === 'trivia' && b.type === 'risk') return 1;
        return 0;
      });
      setDisplayCards(prioritized);
    } else {
      // Show a mix of all types for new users
      const mixed = [...cards].sort(() => Math.random() - 0.5);
      setDisplayCards(mixed);
    }
  }, [userAllergens, cards]);

  const shuffleCards = () => {
    const shuffled = [...displayCards].sort(() => Math.random() - 0.5);
    setDisplayCards(shuffled);
    setCurrentIndex(0);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const cardWidth = 320; // Card width + gap
    const scrollAmount = direction === 'left' ? -cardWidth : cardWidth;

    container.scrollBy({ left: scrollAmount, behavior: 'smooth' });

    // Update current index
    const newIndex = direction === 'left' 
      ? Math.max(0, currentIndex - 1)
      : Math.min(cards.length - 1, currentIndex + 1);
    setCurrentIndex(newIndex);
  };

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    
    const container = scrollContainerRef.current;
    const cardWidth = 320;
    const newIndex = Math.round(container.scrollLeft / cardWidth);
    setCurrentIndex(newIndex);
  };

  return (
    <div className="relative w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-4">
        <div>
          <h2 className="text-foreground mb-1">Learn & Stay Safe</h2>
          <p className="text-muted-foreground text-sm">Swipe to discover tips and facts</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={shuffleCards}
            className="gap-2"
          >
            <Shuffle className="w-4 h-4" />
            <span className="hidden sm:inline">Shuffle</span>
          </Button>
          {onOpenModal && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onOpenModal}
              className="gap-2"
            >
              <Maximize2 className="w-4 h-4" />
              <span className="hidden sm:inline">View All</span>
            </Button>
          )}
        </div>
      </div>

      {/* Carousel Container */}
      <div className="relative group">
        {/* Left Arrow */}
        {currentIndex > 0 && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-white dark:bg-gray-800 rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Previous card"
          >
            <ChevronLeft className="w-6 h-6 text-gray-800 dark:text-white" />
          </button>
        )}

        {/* Right Arrow */}
        {currentIndex < cards.length - 1 && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-white dark:bg-gray-800 rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Next card"
          >
            <ChevronRight className="w-6 h-6 text-gray-800 dark:text-white" />
          </button>
        )}

        {/* Scrollable Cards */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory px-4 py-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {displayCards.map((card) => (
            <div key={card.id} className="snap-center">
              <EducationalCard card={card} />
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Dots */}
      <div className="flex items-center justify-center gap-2 mt-4">
        {displayCards.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              if (scrollContainerRef.current) {
                const cardWidth = 320;
                scrollContainerRef.current.scrollTo({
                  left: index * cardWidth,
                  behavior: 'smooth',
                });
                setCurrentIndex(index);
              }
            }}
            className={`h-2 rounded-full transition-all ${
              index === currentIndex
                ? 'w-8 bg-green-500 dark:bg-green-400'
                : 'w-2 bg-gray-300 dark:bg-gray-600'
            }`}
            aria-label={`Go to card ${index + 1}`}
          />
        ))}
      </div>

      {/* Hide scrollbar */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}

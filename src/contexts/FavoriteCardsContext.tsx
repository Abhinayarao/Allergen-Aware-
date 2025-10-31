import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface FavoriteCardsContextType {
  favoriteCards: string[];
  toggleFavorite: (cardId: string) => void;
  isFavorite: (cardId: string) => boolean;
}

const FavoriteCardsContext = createContext<FavoriteCardsContextType | undefined>(undefined);

export function FavoriteCardsProvider({ children }: { children: ReactNode }) {
  const [favoriteCards, setFavoriteCards] = useState<string[]>(() => {
    const saved = localStorage.getItem('favorite-cards');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('favorite-cards', JSON.stringify(favoriteCards));
  }, [favoriteCards]);

  const toggleFavorite = (cardId: string) => {
    setFavoriteCards((prev) =>
      prev.includes(cardId)
        ? prev.filter((id) => id !== cardId)
        : [...prev, cardId]
    );
  };

  const isFavorite = (cardId: string) => favoriteCards.includes(cardId);

  return (
    <FavoriteCardsContext.Provider value={{ favoriteCards, toggleFavorite, isFavorite }}>
      {children}
    </FavoriteCardsContext.Provider>
  );
}

export function useFavoriteCards() {
  const context = useContext(FavoriteCardsContext);
  if (context === undefined) {
    throw new Error('useFavoriteCards must be used within a FavoriteCardsProvider');
  }
  return context;
}

import { LightbulbIcon, AlertTriangleIcon, BrainCircuitIcon, Heart } from 'lucide-react';
import { useFavoriteCards } from '../contexts/FavoriteCardsContext';

export type CardType = 'tip' | 'risk' | 'trivia';

export interface CardData {
  id: string;
  type: CardType;
  title: string;
  content: string;
  emoji: string;
}

interface EducationalCardProps {
  card: CardData;
  isModal?: boolean;
}

export function EducationalCard({ card, isModal = false }: EducationalCardProps) {
  const { isFavorite, toggleFavorite } = useFavoriteCards();
  const getCardStyles = () => {
    switch (card.type) {
      case 'tip':
        return {
          bg: 'bg-gradient-to-br from-green-400 to-green-500 dark:from-green-600 dark:to-green-700',
          icon: <LightbulbIcon className="w-8 h-8 text-white" />,
          label: 'Safety Tip',
          labelBg: 'bg-green-600 dark:bg-green-800',
        };
      case 'risk':
        return {
          bg: 'bg-gradient-to-br from-amber-400 to-amber-500 dark:from-amber-600 dark:to-amber-700',
          icon: <AlertTriangleIcon className="w-8 h-8 text-white" />,
          label: 'Important Fact',
          labelBg: 'bg-amber-600 dark:bg-amber-800',
        };
      case 'trivia':
        return {
          bg: 'bg-gradient-to-br from-blue-400 to-blue-500 dark:from-blue-600 dark:to-blue-700',
          icon: <BrainCircuitIcon className="w-8 h-8 text-white" />,
          label: 'AI Trivia',
          labelBg: 'bg-blue-600 dark:bg-blue-800',
        };
    }
  };

  const styles = getCardStyles();

  const favorite = isFavorite(card.id);

  return (
    <div
      className={`${
        isModal ? 'w-full max-w-sm mx-auto' : 'w-[280px] sm:w-[320px] flex-shrink-0'
      } h-[360px] ${styles.bg} rounded-3xl shadow-2xl p-6 flex flex-col items-center justify-between relative overflow-hidden`}
    >
      {/* Favorite Button */}
      <button
        onClick={() => toggleFavorite(card.id)}
        className="absolute top-4 right-4 z-20 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-2.5 transition-all hover:scale-110"
        aria-label={favorite ? 'Remove from favorites' : 'Add to favorites'}
      >
        <Heart
          className={`w-5 h-5 transition-all ${
            favorite ? 'fill-white text-white' : 'text-white'
          }`}
        />
      </button>

      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-16 translate-x-16" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full translate-y-12 -translate-x-12" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-start flex-1 text-center pt-4">
        {/* Type Label */}
        <div className={`${styles.labelBg} text-white px-4 py-1.5 rounded-full mb-4`}>
          <span className="text-sm">{styles.label}</span>
        </div>

        {/* Emoji */}
        <div className="text-5xl mb-3">{card.emoji}</div>

        {/* Icon */}
        <div className="mb-3 bg-white/20 p-2.5 rounded-2xl backdrop-blur-sm">
          {styles.icon}
        </div>

        {/* Title */}
        <h3 className="text-white mb-3 px-3 text-lg">{card.title}</h3>

        {/* Content */}
        <p className="text-white/95 leading-relaxed px-4 text-[15px]">
          {card.content}
        </p>
      </div>

      {/* Decorative Bottom Border */}
      <div className="w-16 h-1 bg-white/40 rounded-full mt-4" />
    </div>
  );
}

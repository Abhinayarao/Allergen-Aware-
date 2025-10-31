import { useState } from 'react';
import { CheckCircle, AlertCircle, Trash2, Calendar } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { useLanguage } from '../contexts/LanguageContext';

interface HistoryEntry {
  id: string;
  dishName: string;
  verdict: 'SAFE' | 'RISKY' | 'UNSAFE';
  timestamp: string;
  confidence: number;
  detectedAllergens: string[];
}

interface FavoritesPageProps {
  history: HistoryEntry[];
  onDeleteEntry: (id: string) => void;
  onClearHistory: () => void;
  onViewDetails: (entry: HistoryEntry) => void;
}

type FilterType = 'all' | 'safe' | 'unsafe';

export function FavoritesPage({
  history,
  onDeleteEntry,
  onClearHistory,
  onViewDetails,
}: FavoritesPageProps) {
  const { t } = useLanguage();
  const [filter, setFilter] = useState<FilterType>('all');

  const verdictConfig = {
    SAFE: {
      icon: CheckCircle,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-950',
      borderColor: 'border-green-200 dark:border-green-800',
      badge: 'bg-green-500 dark:bg-green-600',
    },
    RISKY: {
      icon: AlertCircle,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-950',
      borderColor: 'border-red-200 dark:border-red-800',
      badge: 'bg-red-500 dark:bg-red-600',
    },
    UNSAFE: {
      icon: AlertCircle,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-950',
      borderColor: 'border-red-200 dark:border-red-800',
      badge: 'bg-red-500 dark:bg-red-600',
    },
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  // Filter history based on selected filter
  const filteredHistory = history.filter((entry) => {
    if (filter === 'all') return true;
    if (filter === 'safe') return entry.verdict === 'SAFE';
    if (filter === 'unsafe') return entry.verdict === 'UNSAFE' || entry.verdict === 'RISKY';
    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-950 pb-24 md:pb-8">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-foreground mb-2">{t.history.title}</h1>
          <p className="text-muted-foreground">{t.history.subtitle}</p>
        </div>

        {/* Filter Buttons - Only show when there's history */}
        {history.length > 0 && (
          <div className="flex items-center gap-2 mb-6 flex-wrap">
            <span className="text-muted-foreground text-sm mr-2">Filter:</span>
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
              className={filter === 'all' ? 'bg-primary text-primary-foreground' : ''}
            >
              All
            </Button>
            <Button
              variant={filter === 'safe' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('safe')}
              className={filter === 'safe' ? 'bg-green-500 hover:bg-green-600 text-white dark:bg-green-600 dark:hover:bg-green-700' : ''}
            >
              Safe
            </Button>
            <Button
              variant={filter === 'unsafe' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('unsafe')}
              className={filter === 'unsafe' ? 'bg-red-500 hover:bg-red-600 text-white dark:bg-red-600 dark:hover:bg-red-700' : ''}
            >
              Unsafe
            </Button>
          </div>
        )}

        {/* History List */}
        {filteredHistory.length === 0 ? (
          <Card className="p-12 text-center">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-foreground mb-2">
              {history.length === 0 ? 'No History Yet' : `No ${filter === 'safe' ? 'Safe' : 'Unsafe'} Dishes`}
            </h3>
            <p className="text-muted-foreground">
              {history.length === 0 
                ? 'Start analyzing dishes to see them here'
                : `You don't have any ${filter === 'safe' ? 'safe' : 'unsafe'} dishes in your history`
              }
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredHistory.map((entry) => {
              const config = verdictConfig[entry.verdict];
              const Icon = config.icon;

              return (
                <Card
                  key={entry.id}
                  className={`p-4 border ${config.borderColor} hover:shadow-md transition-shadow cursor-pointer`}
                  onClick={() => onViewDetails(entry)}
                >
                  <div className="flex items-start gap-4">
                    <div className={`${config.bgColor} p-3 rounded-lg`}>
                      <Icon className={`w-6 h-6 ${config.color}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h3 className="text-foreground truncate">{entry.dishName}</h3>
                        <Badge className={`${config.badge} text-white shrink-0`}>
                          {entry.verdict === 'RISKY' ? 'UNSAFE' : entry.verdict}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(entry.timestamp)}
                        </span>
                        <span>Confidence: {entry.confidence}%</span>
                      </div>

                      {entry.detectedAllergens.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {entry.detectedAllergens.map((allergen, idx) => (
                            <Badge
                              key={idx}
                              variant="secondary"
                              className="text-xs bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300"
                            >
                              {allergen}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteEntry(entry.id);
                      }}
                      className="text-muted-foreground hover:text-red-600 dark:hover:text-red-400 p-2 shrink-0"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Clear History Button */}
        {history.length > 0 && (
          <div className="mt-6 text-center">
            <Button
              variant="outline"
              onClick={onClearHistory}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All History
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

import { ChevronLeft, AlertCircle, CheckCircle, AlertTriangle, ArrowRight } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { NutritionSummary } from './NutritionSummary';
import { useLanguage } from '../contexts/LanguageContext';

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

interface AnalysisResultsPageProps {
  result: AnalysisResult;
  onBack: () => void;
}

export function AnalysisResultsPage({ result, onBack }: AnalysisResultsPageProps) {
  const { t } = useLanguage();
  const verdictConfig = {
    SAFE: {
      color: 'bg-green-500',
      textColor: 'text-green-700 dark:text-green-300',
      bgColor: 'bg-green-50 dark:bg-green-950',
      borderColor: 'border-green-200 dark:border-green-800',
      icon: CheckCircle,
      label: 'SAFE TO EAT',
    },
    RISKY: {
      color: 'bg-amber-500',
      textColor: 'text-amber-700 dark:text-amber-300',
      bgColor: 'bg-amber-50 dark:bg-amber-950',
      borderColor: 'border-amber-200 dark:border-amber-800',
      icon: AlertTriangle,
      label: 'PROCEED WITH CAUTION',
    },
    UNSAFE: {
      color: 'bg-red-500',
      textColor: 'text-red-700 dark:text-red-300',
      bgColor: 'bg-red-50 dark:bg-red-950',
      borderColor: 'border-red-200 dark:border-red-800',
      icon: AlertCircle,
      label: 'NOT SAFE',
    },
  };

  const config = verdictConfig[result.verdict];
  const Icon = config.icon;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950 pb-24 md:pb-8">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Back Button */}
        <Button
          onClick={onBack}
          variant="ghost"
          className="mb-4 hover:bg-accent"
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          Back to Search
        </Button>

        {/* Dish Header with Image */}
        {result.imageUrl && (
          <div className="mb-6 rounded-2xl overflow-hidden shadow-lg">
            <img
              src={result.imageUrl}
              alt={result.dishName}
              className="w-full h-64 object-cover"
            />
          </div>
        )}

        {/* Dish Name */}
        <div className="mb-6">
          <h1 className="text-foreground mb-2">{result.dishName}</h1>
        </div>

        {/* Verdict Card */}
        <Card className={`p-6 mb-6 border-2 ${config.borderColor} ${config.bgColor}`}>
          <div className="flex items-center gap-4 mb-4">
            <div className={`${config.color} p-3 rounded-full`}>
              <Icon className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <Badge className={`${config.color} text-white mb-2`}>
                {config.label}
              </Badge>
              <div>
                <p className="text-sm text-muted-foreground">Confidence Score</p>
                <div className="flex items-center gap-3 mt-1">
                  <Progress value={result.confidence} className="flex-1 h-2" />
                  <span className={`${config.textColor}`}>{result.confidence}%</span>
                </div>
              </div>
            </div>
          </div>
          <p className="text-foreground">{result.explanation}</p>
        </Card>

        {/* Detected Allergens */}
        {result.detectedAllergens.length > 0 && (
          <Card className="p-6 mb-6 bg-card border-border">
            <h2 className="text-foreground mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400" />
              Detected Allergens
            </h2>
            <div className="flex flex-wrap gap-2">
              {result.detectedAllergens.map((allergen, index) => (
                <Badge key={index} variant="destructive" className="bg-red-500 dark:bg-red-600 text-white px-4 py-2">
                  {allergen}
                </Badge>
              ))}
            </div>
          </Card>
        )}

        {/* Risky Ingredients */}
        {result.riskyIngredients.length > 0 && (
          <Card className="p-6 mb-6 bg-card border-border">
            <h2 className="text-foreground mb-4">Risky Ingredients</h2>
            <ul className="space-y-2">
              {result.riskyIngredients.map((ingredient, index) => (
                <li key={index} className="flex items-start gap-2 text-foreground">
                  <span className="text-amber-500 dark:text-amber-400 mt-1">⚠️</span>
                  <span>{ingredient}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {/* Substitutions */}
        {result.substitutions.length > 0 && (
          <Card className="p-6 mb-6 bg-card border-border">
            <h2 className="text-foreground mb-4">Suggested Substitutions</h2>
            <div className="space-y-3">
              {result.substitutions.map((sub, index) => (
                <div
                  key={index}
                  className="p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-foreground line-through">{sub.original}</span>
                    <ArrowRight className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <span className="text-green-700 dark:text-green-300">{sub.replacement}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{sub.reason}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Alternative Dishes */}
        {result.alternativeDishes.length > 0 && (
          <Card className="p-6 mb-6 bg-card border-border">
            <h2 className="text-foreground mb-4">{t.results.alternativeDishes}</h2>
            <div className="space-y-3">
              {result.alternativeDishes.map((dish, index) => (
                <div
                  key={index}
                  className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800"
                >
                  <h3 className="text-foreground mb-1">{dish.name}</h3>
                  <p className="text-sm text-muted-foreground">{dish.reason}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Nutrition Summary */}
        {result.nutrition && (
          <NutritionSummary nutrition={result.nutrition} variant="auto" />
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={onBack}
            className="flex-1 bg-green-500 hover:bg-green-600 text-white py-6 rounded-xl"
          >
            Analyze Another Dish
          </Button>
        </div>
      </div>
    </div>
  );
}

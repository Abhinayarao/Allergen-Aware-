import { useState } from 'react';
import { Flame, Drumstick, Wheat, Droplet, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { useLanguage } from '../contexts/LanguageContext';

interface NutritionData {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  saturatedFat?: number;
}

interface NutritionSummaryProps {
  nutrition: NutritionData;
  variant?: 'collapsed' | 'expanded' | 'auto';
  showExpand?: boolean;
  className?: string;
}

interface NutrientItemProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  unit: string;
  color: string;
  iconBg: string;
}

function NutrientItem({ icon, label, value, unit, color, iconBg }: NutrientItemProps) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 dark:bg-muted/30 hover:bg-muted/70 dark:hover:bg-muted/50 transition-colors">
      <div className={`${iconBg} p-2 rounded-lg shrink-0`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className={`text-2xl font-bold ${color} tabular-nums`}>
            {value}
          </span>
          <span className="text-sm text-muted-foreground font-medium">
            {unit}
          </span>
        </div>
        <div className="text-sm text-muted-foreground truncate">
          {label}
        </div>
      </div>
    </div>
  );
}

function MacroBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const percentage = Math.min((value / total) * 100, 100);
  
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-foreground font-medium">{label}</span>
        <span className="text-muted-foreground tabular-nums">{value}g</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full ${color} transition-all duration-500 rounded-full`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export function NutritionSummary({ 
  nutrition, 
  variant = 'auto', 
  showExpand = true,
  className = '' 
}: NutritionSummaryProps) {
  const { t } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(variant === 'expanded');

  const shouldShowExpanded = variant === 'expanded' || (variant === 'auto' && isExpanded);

  // Calculate total macros for bar visualization
  const totalMacros = nutrition.protein + nutrition.carbs + nutrition.fat;

  // Main nutrients (always shown)
  const mainNutrients = [
    {
      icon: <Flame className="w-5 h-5 text-orange-600 dark:text-orange-400" />,
      label: t.results.calories,
      value: nutrition.calories,
      unit: 'kcal',
      color: 'text-orange-600 dark:text-orange-400',
      iconBg: 'bg-orange-100 dark:bg-orange-950',
    },
    {
      icon: <Drumstick className="w-5 h-5 text-red-600 dark:text-red-400" />,
      label: t.results.protein,
      value: nutrition.protein,
      unit: 'g',
      color: 'text-red-600 dark:text-red-400',
      iconBg: 'bg-red-100 dark:bg-red-950',
    },
    {
      icon: <Wheat className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
      label: t.results.carbs,
      value: nutrition.carbs,
      unit: 'g',
      color: 'text-amber-600 dark:text-amber-400',
      iconBg: 'bg-amber-100 dark:bg-amber-950',
    },
    {
      icon: <Droplet className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />,
      label: t.results.fat,
      value: nutrition.fat,
      unit: 'g',
      color: 'text-yellow-600 dark:text-yellow-400',
      iconBg: 'bg-yellow-100 dark:bg-yellow-950',
    },
  ];

  // Additional nutrients (shown when expanded)
  const additionalNutrients = [
    nutrition.fiber !== undefined && {
      icon: <Sparkles className="w-4 h-4 text-green-600 dark:text-green-400" />,
      label: 'Fiber',
      value: nutrition.fiber,
      unit: 'g',
      color: 'text-green-600 dark:text-green-400',
      iconBg: 'bg-green-100 dark:bg-green-950',
    },
    nutrition.sugar !== undefined && {
      icon: <Sparkles className="w-4 h-4 text-pink-600 dark:text-pink-400" />,
      label: 'Sugar',
      value: nutrition.sugar,
      unit: 'g',
      color: 'text-pink-600 dark:text-pink-400',
      iconBg: 'bg-pink-100 dark:bg-pink-950',
    },
    nutrition.saturatedFat !== undefined && {
      icon: <Droplet className="w-4 h-4 text-purple-600 dark:text-purple-400" />,
      label: 'Saturated Fat',
      value: nutrition.saturatedFat,
      unit: 'g',
      color: 'text-purple-600 dark:text-purple-400',
      iconBg: 'bg-purple-100 dark:bg-purple-950',
    },
    nutrition.sodium !== undefined && {
      icon: <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />,
      label: 'Sodium',
      value: nutrition.sodium,
      unit: 'mg',
      color: 'text-blue-600 dark:text-blue-400',
      iconBg: 'bg-blue-100 dark:bg-blue-950',
    },
  ].filter(Boolean) as NutrientItemProps[];

  return (
    <Card className={`p-6 bg-card border-border ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-foreground flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          {t.results.nutritionInfo}
        </h3>
        {showExpand && variant === 'auto' && additionalNutrients.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="gap-1 text-muted-foreground hover:text-foreground"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4" />
                <span className="text-sm">Less</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                <span className="text-sm">More</span>
              </>
            )}
          </Button>
        )}
      </div>

      {shouldShowExpanded ? (
        /* Expanded View - Grid Layout */
        <div className="space-y-4">
          {/* Main nutrients grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {mainNutrients.map((nutrient) => (
              <NutrientItem key={nutrient.label} {...nutrient} />
            ))}
          </div>

          {/* Additional nutrients */}
          {additionalNutrients.length > 0 && (
            <div className="pt-4 border-t border-border">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {additionalNutrients.map((nutrient) => (
                  <NutrientItem key={nutrient.label} {...nutrient} />
                ))}
              </div>
            </div>
          )}

          {/* Macro breakdown bars */}
          <div className="pt-4 border-t border-border space-y-3">
            <h4 className="text-sm text-muted-foreground font-medium">Macronutrient Breakdown</h4>
            <MacroBar
              label={t.results.protein}
              value={nutrition.protein}
              total={totalMacros}
              color="bg-red-500 dark:bg-red-600"
            />
            <MacroBar
              label={t.results.carbs}
              value={nutrition.carbs}
              total={totalMacros}
              color="bg-amber-500 dark:bg-amber-600"
            />
            <MacroBar
              label={t.results.fat}
              value={nutrition.fat}
              total={totalMacros}
              color="bg-yellow-500 dark:bg-yellow-600"
            />
          </div>
        </div>
      ) : (
        /* Collapsed View - Compact Bar */
        <div className="space-y-4">
          {/* Compact calorie display */}
          <div className="flex items-center justify-center p-4 bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-950/30 dark:to-orange-900/30 rounded-xl border border-orange-200 dark:border-orange-800">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Flame className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                <span className="text-4xl font-bold text-orange-600 dark:text-orange-400 tabular-nums">
                  {nutrition.calories}
                </span>
              </div>
              <div className="text-sm text-orange-700 dark:text-orange-300 font-medium">
                Total Calories
              </div>
            </div>
          </div>

          {/* Compact macros row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-muted/50 dark:bg-muted/30 rounded-lg">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Drumstick className="w-4 h-4 text-red-600 dark:text-red-400" />
                <span className="text-xl font-bold text-red-600 dark:text-red-400 tabular-nums">
                  {nutrition.protein}
                </span>
                <span className="text-xs text-muted-foreground">g</span>
              </div>
              <div className="text-xs text-muted-foreground">{t.results.protein}</div>
            </div>

            <div className="text-center p-3 bg-muted/50 dark:bg-muted/30 rounded-lg">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Wheat className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span className="text-xl font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                  {nutrition.carbs}
                </span>
                <span className="text-xs text-muted-foreground">g</span>
              </div>
              <div className="text-xs text-muted-foreground">{t.results.carbs}</div>
            </div>

            <div className="text-center p-3 bg-muted/50 dark:bg-muted/30 rounded-lg">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Droplet className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                <span className="text-xl font-bold text-yellow-600 dark:text-yellow-400 tabular-nums">
                  {nutrition.fat}
                </span>
                <span className="text-xs text-muted-foreground">g</span>
              </div>
              <div className="text-xs text-muted-foreground">{t.results.fat}</div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

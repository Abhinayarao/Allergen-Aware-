import { NutritionSummary } from './NutritionSummary';
import { Card } from './ui/card';

/**
 * Showcase component to demonstrate the NutritionSummary variants
 * This is for testing and design preview purposes
 */
export function NutritionShowcase() {
  // Sample nutrition data with all fields
  const fullNutrition = {
    calories: 450,
    protein: 28,
    carbs: 42,
    fat: 15,
    fiber: 8,
    sugar: 12,
    sodium: 680,
    saturatedFat: 4,
  };

  // Sample nutrition data with only main fields
  const basicNutrition = {
    calories: 320,
    protein: 18,
    carbs: 35,
    fat: 12,
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-foreground mb-2">Nutrition Summary Component</h1>
          <p className="text-muted-foreground">
            Reusable, responsive component with multiple variants and full dark mode support
          </p>
        </div>

        {/* Collapsed Variant */}
        <section>
          <div className="mb-4">
            <h2 className="text-foreground mb-1">Collapsed Variant</h2>
            <p className="text-sm text-muted-foreground">
              Compact view showing calories prominently with main macros in a row
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">Light Mode</p>
              <NutritionSummary nutrition={basicNutrition} variant="collapsed" showExpand={false} />
            </div>
            <div className="dark">
              <p className="text-xs text-white mb-2 uppercase tracking-wider">Dark Mode Preview</p>
              <NutritionSummary nutrition={basicNutrition} variant="collapsed" showExpand={false} />
            </div>
          </div>
        </section>

        {/* Expanded Variant */}
        <section>
          <div className="mb-4">
            <h2 className="text-foreground mb-1">Expanded Variant</h2>
            <p className="text-sm text-muted-foreground">
              Full detailed view with all nutrients, macro breakdown bars, and grid layout
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6">
            <div>
              <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">Light Mode</p>
              <NutritionSummary nutrition={fullNutrition} variant="expanded" showExpand={false} />
            </div>
            <div className="dark">
              <p className="text-xs text-white mb-2 uppercase tracking-wider">Dark Mode Preview</p>
              <NutritionSummary nutrition={fullNutrition} variant="expanded" showExpand={false} />
            </div>
          </div>
        </section>

        {/* Auto Variant (Toggleable) */}
        <section>
          <div className="mb-4">
            <h2 className="text-foreground mb-1">Auto Variant (Interactive)</h2>
            <p className="text-sm text-muted-foreground">
              User can toggle between collapsed and expanded views with expand/collapse button
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">Light Mode</p>
              <NutritionSummary nutrition={fullNutrition} variant="auto" showExpand={true} />
            </div>
            <div className="dark">
              <p className="text-xs text-white mb-2 uppercase tracking-wider">Dark Mode Preview</p>
              <NutritionSummary nutrition={fullNutrition} variant="auto" showExpand={true} />
            </div>
          </div>
        </section>

        {/* Mobile Preview */}
        <section>
          <div className="mb-4">
            <h2 className="text-foreground mb-1">Mobile Preview</h2>
            <p className="text-sm text-muted-foreground">
              Component adapts to mobile screens with responsive grid layout
            </p>
          </div>
          <div className="flex justify-center gap-6">
            <div className="w-full max-w-[375px]">
              <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">iPhone Size</p>
              <Card className="p-4 bg-muted/30">
                <div className="bg-background rounded-lg overflow-hidden">
                  <NutritionSummary nutrition={fullNutrition} variant="auto" />
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* Features List */}
        <section className="pt-8 border-t border-border">
          <h2 className="text-foreground mb-4">Component Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="p-4 bg-card border-border">
              <h3 className="text-foreground mb-2">📱 Responsive Design</h3>
              <p className="text-sm text-muted-foreground">
                Automatically adapts from mobile (1 column) to tablet (2 columns) to desktop (4 columns)
              </p>
            </Card>
            <Card className="p-4 bg-card border-border">
              <h3 className="text-foreground mb-2">🎨 Dark Mode Support</h3>
              <p className="text-sm text-muted-foreground">
                Full dark mode with proper contrast ratios and theme-aware colors
              </p>
            </Card>
            <Card className="p-4 bg-card border-border">
              <h3 className="text-foreground mb-2">🔢 Tabular Numbers</h3>
              <p className="text-sm text-muted-foreground">
                Numbers use tabular-nums for perfect alignment in tables and lists
              </p>
            </Card>
            <Card className="p-4 bg-card border-border">
              <h3 className="text-foreground mb-2">🧩 Component Variants</h3>
              <p className="text-sm text-muted-foreground">
                Three variants: collapsed (compact), expanded (full), and auto (toggleable)
              </p>
            </Card>
            <Card className="p-4 bg-card border-border">
              <h3 className="text-foreground mb-2">✨ Auto Layout</h3>
              <p className="text-sm text-muted-foreground">
                Uses CSS Grid with gap - missing nutrients automatically close the gap
              </p>
            </Card>
            <Card className="p-4 bg-card border-border">
              <h3 className="text-foreground mb-2">🌍 i18n Ready</h3>
              <p className="text-sm text-muted-foreground">
                Fully integrated with translation system for multi-language support
              </p>
            </Card>
          </div>
        </section>

        {/* Usage Example */}
        <section className="pt-8 border-t border-border">
          <h2 className="text-foreground mb-4">Usage Examples</h2>
          <Card className="p-6 bg-card border-border">
            <pre className="text-sm text-foreground overflow-x-auto">
              <code>{`// Basic usage with auto variant
<NutritionSummary 
  nutrition={{
    calories: 450,
    protein: 28,
    carbs: 42,
    fat: 15
  }} 
  variant="auto" 
/>

// Collapsed view for cards
<NutritionSummary 
  nutrition={data} 
  variant="collapsed"
  showExpand={false}
/>

// Expanded view for detail pages
<NutritionSummary 
  nutrition={fullData} 
  variant="expanded"
/>`}</code>
            </pre>
          </Card>
        </section>
      </div>
    </div>
  );
}

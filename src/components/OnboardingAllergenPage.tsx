import { useState } from 'react';
import { ShieldAlert, Check, ArrowRight } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';

interface OnboardingAllergenPageProps {
  onComplete: (allergens: string[]) => void;
  isLoading?: boolean;
}

const COMMON_ALLERGENS = [
  { id: 'peanuts', label: 'Peanuts', emoji: '🥜' },
  { id: 'tree-nuts', label: 'Tree Nuts', emoji: '🌰' },
  { id: 'dairy', label: 'Dairy', emoji: '🥛' },
  { id: 'eggs', label: 'Eggs', emoji: '🥚' },
  { id: 'soy', label: 'Soy', emoji: '🫘' },
  { id: 'wheat', label: 'Wheat', emoji: '🌾' },
  { id: 'shellfish', label: 'Shellfish', emoji: '🦐' },
  { id: 'fish', label: 'Fish', emoji: '🐟' },
  { id: 'sesame', label: 'Sesame', emoji: '🍞' },
  { id: 'gluten', label: 'Gluten', emoji: '🍞' },
  { id: 'mustard', label: 'Mustard', emoji: '🌭' },
  { id: 'celery', label: 'Celery', emoji: '🥬' },
];

export function OnboardingAllergenPage({ onComplete, isLoading = false }: OnboardingAllergenPageProps) {
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);
  const [saveAsDefault, setSaveAsDefault] = useState(true);

  const toggleAllergen = (allergenId: string) => {
    setSelectedAllergens((prev) =>
      prev.includes(allergenId)
        ? prev.filter((id) => id !== allergenId)
        : [...prev, allergenId]
    );
  };

  const handleComplete = () => {
    onComplete(selectedAllergens);
  };

  const handleSkip = () => {
    onComplete([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white p-4 flex items-center justify-center">
      <div className="max-w-2xl w-full animate-slide-in">
        {/* Progress Indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <div className="w-3 h-3 rounded-full bg-green-500" />
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="bg-green-500 p-4 rounded-2xl inline-block mb-4">
            <ShieldAlert className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-gray-900 mb-2">Select Your Allergens</h1>
          <p className="text-gray-600">Choose all that apply to get personalized recommendations</p>
        </div>

        {/* Allergen Selection Card */}
        <Card className="p-6 shadow-lg mb-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {COMMON_ALLERGENS.map((allergen) => (
              <button
                key={allergen.id}
                onClick={() => toggleAllergen(allergen.id)}
                className={`relative p-4 rounded-xl border-2 transition-all hover:scale-105 ${
                  selectedAllergens.includes(allergen.id)
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 bg-white hover:border-green-300'
                }`}
              >
                {selectedAllergens.includes(allergen.id) && (
                  <div className="absolute top-2 right-2 bg-green-500 rounded-full p-0.5">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
                <div className="text-3xl mb-2">{allergen.emoji}</div>
                <div className="text-sm text-gray-700">{allergen.label}</div>
              </button>
            ))}
          </div>

          {/* Selected Count */}
          {selectedAllergens.length > 0 && (
            <div className="mt-6 p-4 bg-green-50 rounded-xl border border-green-200">
              <div className="flex items-center justify-between">
                <span className="text-gray-700">
                  {selectedAllergens.length} allergen{selectedAllergens.length !== 1 ? 's' : ''} selected
                </span>
                <button
                  onClick={() => setSelectedAllergens([])}
                  className="text-green-600 hover:text-green-700 text-sm underline"
                >
                  Clear all
                </button>
              </div>
            </div>
          )}

          {/* Save as Default Toggle */}
          <div className="mt-6 flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
              <p className="text-gray-700">Save as default profile</p>
              <p className="text-sm text-gray-500">You can update this anytime in Settings</p>
            </div>
            <button
              onClick={() => setSaveAsDefault(!saveAsDefault)}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                saveAsDefault ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <div
                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform ${
                  saveAsDefault ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={handleComplete}
            disabled={isLoading}
            className="w-full bg-green-500 hover:bg-green-600 text-white py-6 rounded-xl shadow-lg"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Setting up your profile...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                Continue to Search
                <ArrowRight className="w-5 h-5" />
              </span>
            )}
          </Button>

          <Button
            onClick={handleSkip}
            disabled={isLoading}
            variant="outline"
            className="w-full py-6 rounded-xl"
          >
            Skip for now
          </Button>
        </div>

        <p className="text-center text-gray-500 text-sm mt-4">
          Step 2 of 2
        </p>
      </div>
    </div>
  );
}

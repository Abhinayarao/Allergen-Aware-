import { Sparkles } from 'lucide-react';
import { Button } from './ui/button';
import { ShieldUtensilIcon } from './ShieldUtensilIcon';

interface WelcomePageProps {
  onGetStarted: () => void;
}

export function WelcomePage({ onGetStarted }: WelcomePageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 via-green-500 to-green-600 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center animate-fade-in">
        {/* Logo */}
        <div className="mb-8">
          <div className="bg-white p-8 rounded-3xl shadow-2xl inline-block mb-6 animate-bounce">
            <ShieldUtensilIcon size={96} />
          </div>
          <h1 className="text-white mb-3">Allergen-Aware</h1>
          <p className="text-white text-xl mb-6">Recipe Advisor</p>
        </div>

        {/* Tagline */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-12 border border-white/20">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-yellow-300" />
            <p className="text-white text-lg">Eat Smart. Stay Safe.</p>
            <Sparkles className="w-5 h-5 text-yellow-300" />
          </div>
          <p className="text-green-100">Powered by AI</p>
        </div>

        {/* Get Started Button */}
        <Button
          onClick={onGetStarted}
          className="w-full bg-white text-green-600 hover:bg-green-50 py-6 rounded-xl text-lg shadow-2xl"
        >
          Get Started
        </Button>

        <p className="text-green-100 text-sm mt-6">
          Set up your profile in just 2 steps
        </p>
      </div>
    </div>
  );
}

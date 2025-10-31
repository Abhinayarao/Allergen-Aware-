import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  const options = [
    { value: 'light' as const, label: 'Light', icon: Sun },
    { value: 'dark' as const, label: 'Dark', icon: Moon },
    { value: 'auto' as const, label: 'Auto', icon: Monitor },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-foreground">Appearance</h3>
          <p className="text-sm text-muted-foreground">Choose your theme preference</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {options.map((option) => {
          const Icon = option.icon;
          const isSelected = theme === option.value;
          
          return (
            <button
              key={option.value}
              onClick={() => setTheme(option.value)}
              className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all hover:scale-105 ${
                isSelected
                  ? 'border-green-500 bg-green-50 dark:bg-green-950 dark:border-green-600'
                  : 'border-border bg-card hover:border-green-300 dark:hover:border-green-700'
              }`}
            >
              {isSelected && (
                <div className="absolute top-2 right-2 bg-green-500 rounded-full p-0.5">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M10 3L4.5 8.5L2 6"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              )}
              
              <Icon className={`w-6 h-6 ${isSelected ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`} />
              <span className={`text-sm ${isSelected ? 'text-green-600 dark:text-green-400 font-medium' : 'text-foreground'}`}>
                {option.label}
              </span>
            </button>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        {theme === 'auto' 
          ? 'Theme will match your system preferences'
          : `Theme is set to ${theme} mode`
        }
      </p>
    </div>
  );
}

import { useState } from 'react';
import { User, ShieldAlert, Save, Edit2, Check, Palette, Globe } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card } from './ui/card';
import { ThemeSwitcher } from './ThemeSwitcher';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useLanguage } from '../contexts/LanguageContext';

interface UserProfile {
  name: string;
  age?: string;
  gender?: string;
  allergens: string[];
}

interface SettingsPageProps {
  profile: UserProfile;
  onSave: (profile: UserProfile) => void;
  isSaving?: boolean;
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

export function SettingsPage({ profile, onSave, isSaving = false }: SettingsPageProps) {
  const { t } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<UserProfile>(profile);

  const handleSave = () => {
    onSave(editedProfile);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedProfile(profile);
    setIsEditing(false);
  };

  const toggleAllergen = (allergenId: string) => {
    setEditedProfile((prev) => ({
      ...prev,
      allergens: prev.allergens.includes(allergenId)
        ? prev.allergens.filter((id) => id !== allergenId)
        : [...prev.allergens, allergenId],
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white dark:from-gray-900 dark:to-gray-950 pb-24 md:pb-8">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="bg-green-500 dark:bg-green-600 p-4 rounded-2xl inline-block mb-4">
            <User className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-foreground mb-2">{t.settings.title}</h1>
          <p className="text-muted-foreground">{t.settings.subtitle}</p>
        </div>

        {/* Profile Info Card */}
        <Card className="p-6 shadow-lg mb-6 bg-card border-border">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-foreground">{t.settings.profileInfo}</h2>
            {!isEditing && (
              <Button
                onClick={() => setIsEditing(true)}
                variant="outline"
                className="gap-2"
              >
                <Edit2 className="w-4 h-4" />
                {t.settings.editProfile}
              </Button>
            )}
          </div>

          <div className="space-y-5">
            {/* Name */}
            <div>
              <Label htmlFor="edit-name" className="text-foreground mb-2 block">
                {t.profile.name}
              </Label>
              {isEditing ? (
                <Input
                  id="edit-name"
                  value={editedProfile.name}
                  onChange={(e) =>
                    setEditedProfile({ ...editedProfile, name: e.target.value })
                  }
                  placeholder={t.profile.namePlaceholder}
                />
              ) : (
                <p className="text-foreground p-3 bg-muted rounded-lg">{profile.name}</p>
              )}
            </div>

            {/* Age */}
            <div>
              <Label htmlFor="edit-age" className="text-foreground mb-2 block">
                {t.profile.age}
              </Label>
              {isEditing ? (
                <Select
                  value={editedProfile.age || ''}
                  onValueChange={(value) =>
                    setEditedProfile({ ...editedProfile, age: value })
                  }
                >
                  <SelectTrigger id="edit-age">
                    <SelectValue placeholder="Select your age range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="under-18">Under 18</SelectItem>
                    <SelectItem value="18-24">18-24</SelectItem>
                    <SelectItem value="25-34">25-34</SelectItem>
                    <SelectItem value="35-44">35-44</SelectItem>
                    <SelectItem value="45-54">45-54</SelectItem>
                    <SelectItem value="55-64">55-64</SelectItem>
                    <SelectItem value="65+">65+</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-foreground p-3 bg-muted rounded-lg">
                  {profile.age ? profile.age : 'Not specified'}
                </p>
              )}
            </div>

            {/* Gender */}
            <div>
              <Label htmlFor="edit-gender" className="text-foreground mb-2 block">
                Gender
              </Label>
              {isEditing ? (
                <Select
                  value={editedProfile.gender || ''}
                  onValueChange={(value) =>
                    setEditedProfile({ ...editedProfile, gender: value })
                  }
                >
                  <SelectTrigger id="edit-gender">
                    <SelectValue placeholder="Select your gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="non-binary">Non-binary</SelectItem>
                    <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-foreground p-3 bg-muted rounded-lg">
                  {profile.gender ? profile.gender : 'Not specified'}
                </p>
              )}
            </div>
          </div>

          {isEditing && (
            <div className="flex gap-3 mt-6">
              <Button
                onClick={handleCancel}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving || !editedProfile.name.trim()}
                className="flex-1 bg-green-500 hover:bg-green-600"
              >
                {isSaving ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Save className="w-4 h-4" />
                    Save Changes
                  </span>
                )}
              </Button>
            </div>
          )}
        </Card>

        {/* Allergens Card */}
        <Card className="p-6 shadow-lg mb-6 bg-card border-border">
          <div className="flex items-center gap-2 mb-6">
            <ShieldAlert className="w-5 h-5 text-green-600 dark:text-green-400" />
            <h2 className="text-foreground">{t.allergens.myAllergens}</h2>
          </div>

          {isEditing ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-4">
                {COMMON_ALLERGENS.map((allergen) => (
                  <button
                    key={allergen.id}
                    onClick={() => toggleAllergen(allergen.id)}
                    className={`relative p-4 rounded-xl border-2 transition-all hover:scale-105 ${
                      editedProfile.allergens.includes(allergen.id)
                        ? 'border-green-500 bg-green-50 dark:bg-green-950 dark:border-green-600'
                        : 'border-border bg-card hover:border-green-300 dark:hover:border-green-700'
                    }`}
                  >
                    {editedProfile.allergens.includes(allergen.id) && (
                      <div className="absolute top-2 right-2 bg-green-500 rounded-full p-0.5">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                    <div className="text-3xl mb-2">{allergen.emoji}</div>
                    <div className="text-sm text-foreground">{allergen.label}</div>
                  </button>
                ))}
              </div>
              {editedProfile.allergens.length > 0 && (
                <div className="p-4 bg-green-50 dark:bg-green-950 rounded-xl border border-green-200 dark:border-green-800">
                  <div className="flex items-center justify-between">
                    <span className="text-foreground">
                      {editedProfile.allergens.length} allergen
                      {editedProfile.allergens.length !== 1 ? 's' : ''} selected
                    </span>
                    <button
                      onClick={() => setEditedProfile({ ...editedProfile, allergens: [] })}
                      className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 text-sm underline"
                    >
                      Clear all
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {profile.allergens.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profile.allergens.map((allergenId) => {
                    const allergen = COMMON_ALLERGENS.find((a) => a.id === allergenId);
                    return allergen ? (
                      <div
                        key={allergenId}
                        className="px-4 py-2 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-xl flex items-center gap-2"
                      >
                        <span className="text-xl">{allergen.emoji}</span>
                        <span className="text-foreground">{allergen.label}</span>
                      </div>
                    ) : null;
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <ShieldAlert className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No allergens selected</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Click "Edit Profile" to add your allergens
                  </p>
                </div>
              )}
            </>
          )}
        </Card>

        {/* Theme Switcher Card */}
        <Card className="p-6 shadow-lg mb-6">
          <div className="flex items-center gap-2 mb-6">
            <Palette className="w-5 h-5 text-green-600 dark:text-green-400" />
            <h2 className="text-foreground">{t.settings.themeSettings}</h2>
          </div>
          <ThemeSwitcher />
        </Card>

        {/* Language Switcher Card */}
        <Card className="p-6 shadow-lg mb-6">
          <div className="flex items-center gap-2 mb-6">
            <Globe className="w-5 h-5 text-green-600 dark:text-green-400" />
            <h2 className="text-foreground">{t.settings.languageSettings}</h2>
          </div>
          <LanguageSwitcher variant="settings" />
        </Card>

        {/* Info Message */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-xl">
          <p className="text-blue-800 dark:text-blue-200 text-sm">
            {t.settings.infoMessage}
          </p>
        </div>
      </div>
    </div>
  );
}

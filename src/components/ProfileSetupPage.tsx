import { useState } from 'react';
import { User, ArrowRight } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card } from './ui/card';

interface ProfileSetupPageProps {
  onNext: (profile: { name: string; age?: string; gender?: string }) => void;
}

export function ProfileSetupPage({ onNext }: ProfileSetupPageProps) {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');

  const handleNext = () => {
    if (name.trim()) {
      onNext({
        name: name.trim(),
        age: age || undefined,
        gender: gender || undefined,
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white p-4 flex items-center justify-center">
      <div className="max-w-md w-full animate-slide-in">
        {/* Progress Indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <div className="w-3 h-3 rounded-full bg-gray-300" />
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="bg-green-500 p-4 rounded-2xl inline-block mb-4">
            <User className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-gray-900 mb-2">Let's personalize your experience</h1>
          <p className="text-gray-600">Tell us a bit about yourself</p>
        </div>

        {/* Form Card */}
        <Card className="p-6 shadow-lg mb-6">
          <div className="space-y-5">
            {/* Name Input */}
            <div>
              <Label htmlFor="name" className="text-gray-700 mb-2 block">
                Your Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleNext()}
                className="w-full"
                autoFocus
              />
            </div>

            {/* Age Input - Optional */}
            <div>
              <Label htmlFor="age" className="text-gray-700 mb-2 block">
                Age <span className="text-gray-400 text-sm">(optional)</span>
              </Label>
              <Select value={age} onValueChange={setAge}>
                <SelectTrigger id="age" className="w-full">
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
            </div>

            {/* Gender Input - Optional */}
            <div>
              <Label htmlFor="gender" className="text-gray-700 mb-2 block">
                Gender <span className="text-gray-400 text-sm">(optional)</span>
              </Label>
              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger id="gender" className="w-full">
                  <SelectValue placeholder="Select your gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="non-binary">Non-binary</SelectItem>
                  <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Next Button */}
        <Button
          onClick={handleNext}
          disabled={!name.trim()}
          className="w-full bg-green-500 hover:bg-green-600 text-white py-6 rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="flex items-center justify-center gap-2">
            Next: Set Allergens
            <ArrowRight className="w-5 h-5" />
          </span>
        </Button>

        <p className="text-center text-gray-500 text-sm mt-4">
          Step 1 of 2
        </p>
      </div>
    </div>
  );
}

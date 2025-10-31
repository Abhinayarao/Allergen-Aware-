-- Database setup for Allergen-Aware Recipe Advisor
-- Run these commands in your Supabase SQL editor

-- Enable Row Level Security (RLS)
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    email TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    date_of_birth TEXT,
    emergency_contact TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create allergen_profiles table
CREATE TABLE IF NOT EXISTS allergen_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    peanuts BOOLEAN DEFAULT FALSE,
    tree_nuts BOOLEAN DEFAULT FALSE,
    shellfish BOOLEAN DEFAULT FALSE,
    fish BOOLEAN DEFAULT FALSE,
    gluten BOOLEAN DEFAULT FALSE,
    dairy BOOLEAN DEFAULT FALSE,
    eggs BOOLEAN DEFAULT FALSE,
    soy BOOLEAN DEFAULT FALSE,
    sesame BOOLEAN DEFAULT FALSE,
    sulfites BOOLEAN DEFAULT FALSE,
    mustard BOOLEAN DEFAULT FALSE,
    celery BOOLEAN DEFAULT FALSE,
    lupin BOOLEAN DEFAULT FALSE,
    mollusks BOOLEAN DEFAULT FALSE,
    custom_allergens TEXT[],
    severity_level TEXT DEFAULT 'moderate' CHECK (severity_level IN ('mild', 'moderate', 'severe')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create food_scans table for tracking scan history
CREATE TABLE IF NOT EXISTS food_scans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    scan_type TEXT NOT NULL CHECK (scan_type IN ('image', 'barcode', 'voice')),
    food_id TEXT,
    food_name TEXT NOT NULL,
    scan_data JSONB, -- Store additional scan data
    analysis_result JSONB, -- Store AI analysis results
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_favorites table
CREATE TABLE IF NOT EXISTS user_favorites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    food_id TEXT NOT NULL,
    food_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, food_id)
);

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE allergen_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_profiles
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for allergen_profiles
CREATE POLICY "Users can view own allergen profile" ON allergen_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own allergen profile" ON allergen_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own allergen profile" ON allergen_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for food_scans
CREATE POLICY "Users can view own scans" ON food_scans
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scans" ON food_scans
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for user_favorites
CREATE POLICY "Users can view own favorites" ON user_favorites
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorites" ON user_favorites
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites" ON user_favorites
    FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_allergen_profiles_user_id ON allergen_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_food_scans_user_id ON food_scans(user_id);
CREATE INDEX IF NOT EXISTS idx_food_scans_created_at ON food_scans(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites(user_id);

-- Create function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (user_id, email, first_name, last_name)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'first_name',
        NEW.raw_user_meta_data->>'last_name'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create user profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_allergen_profiles_updated_at
    BEFORE UPDATE ON allergen_profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

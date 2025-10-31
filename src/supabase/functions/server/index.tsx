import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'npm:@supabase/supabase-js@2';
import * as kv from './kv_store.tsx';

const app = new Hono();

app.use('*', cors());
app.use('*', logger(console.log));

// Initialize Supabase client for auth
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// FatSecret API credentials
const FATSECRET_CLIENT_ID = Deno.env.get('FATSECRET_CLIENT_ID');
const FATSECRET_CLIENT_SECRET = Deno.env.get('FATSECRET_CLIENT_SECRET');

// Gemini API key
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

// Log initialization status (without exposing keys)
console.log('Server initialization:');
console.log('- GEMINI_API_KEY:', GEMINI_API_KEY ? `Set (${GEMINI_API_KEY.substring(0, 8)}...)` : 'NOT SET');
console.log('- FATSECRET_CLIENT_ID:', FATSECRET_CLIENT_ID ? 'Set' : 'NOT SET');
console.log('- FATSECRET_CLIENT_SECRET:', FATSECRET_CLIENT_SECRET ? 'Set' : 'NOT SET');

// Get FatSecret access token
async function getFatSecretToken(): Promise<string> {
  const tokenUrl = 'https://oauth.fatsecret.com/connect/token';
  const auth = btoa(`${FATSECRET_CLIENT_ID}:${FATSECRET_CLIENT_SECRET}`);
  
  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials&scope=basic',
  });
  
  if (!response.ok) {
    throw new Error(`FatSecret token error: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.access_token;
}

// Search food using FatSecret API
app.post('/make-server-f76a17ea/search-food', async (c) => {
  try {
    const { query } = await c.req.json();
    
    if (!query) {
      return c.json({ error: 'Query parameter is required' }, 400);
    }
    
    const token = await getFatSecretToken();
    
    const response = await fetch(
      `https://platform.fatsecret.com/rest/server.api?method=foods.search&search_expression=${encodeURIComponent(query)}&format=json`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );
    
    if (!response.ok) {
      throw new Error(`FatSecret API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    return c.json(data);
  } catch (error) {
    console.log('Error searching food:', error);
    return c.json({ error: `Failed to search food: ${error.message}` }, 500);
  }
});

// Get food details using FatSecret API
app.post('/make-server-f76a17ea/food-details', async (c) => {
  try {
    const { foodId } = await c.req.json();
    
    if (!foodId) {
      return c.json({ error: 'Food ID is required' }, 400);
    }
    
    const token = await getFatSecretToken();
    
    const response = await fetch(
      `https://platform.fatsecret.com/rest/server.api?method=food.get.v2&food_id=${foodId}&format=json`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );
    
    if (!response.ok) {
      throw new Error(`FatSecret API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    return c.json(data);
  } catch (error) {
    console.log('Error getting food details:', error);
    return c.json({ error: `Failed to get food details: ${error.message}` }, 500);
  }
});

// Analyze allergens using Gemini AI
app.post('/make-server-f76a17ea/analyze-allergens', async (c) => {
  try {
    const { dishName, ingredients, allergens, imageBase64 } = await c.req.json();
    
    if (!dishName && !imageBase64) {
      return c.json({ error: 'Dish name or image is required' }, 400);
    }
    
    if (!allergens || allergens.length === 0) {
      return c.json({ error: 'Allergens list is required' }, 400);
    }
    
    if (!GEMINI_API_KEY) {
      console.log('ERROR: GEMINI_API_KEY is not set in environment variables');
      return c.json({ error: 'Gemini API key is not configured. Please set up your API key.' }, 500);
    }
    
    console.log('Analyzing allergens for:', dishName || 'image upload');
    console.log('User allergens:', allergens.join(', '));
    
    // Construct prompt for Gemini
    let prompt = `You are an allergen detection assistant. `;
    
    if (imageBase64) {
      prompt += `Analyze this food image and identify the dish and its likely ingredients. `;
    } else {
      prompt += `Analyze the dish "${dishName}"${ingredients ? ` with ingredients: ${ingredients}` : ''}. `;
    }
    
    prompt += `The user is allergic to: ${allergens.join(', ')}.

Please provide a JSON response with the following structure:
{
  "dishName": "identified dish name",
  "verdict": "SAFE" | "RISKY" | "UNSAFE",
  "confidence": 0-100,
  "detectedAllergens": ["allergen1", "allergen2"],
  "riskyIngredients": ["ingredient1 (contains allergen)", "ingredient2"],
  "substitutions": [
    {"original": "ingredient", "replacement": "safe alternative", "reason": "why"}
  ],
  "alternativeDishes": [
    {"name": "dish name", "reason": "why it's safer"}
  ],
  "explanation": "brief explanation of the verdict"
}

Rules:
- SAFE: No detected allergens
- RISKY: May contain traces or unclear ingredients
- UNSAFE: Definitely contains user's allergens
- Be thorough but concise
- Provide practical substitutions
- Suggest 2-3 alternative dishes if unsafe/risky`;

    // Validate API key format
    if (!GEMINI_API_KEY.startsWith('AIza')) {
      console.log('ERROR: GEMINI_API_KEY appears to be invalid (should start with "AIza")');
      return c.json({ error: 'Gemini API key appears to be invalid. Please check your configuration.' }, 500);
    }
    
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    const requestBody: any = {
      contents: [{
        parts: imageBase64 
          ? [
              { text: prompt },
              { 
                inline_data: {
                  mime_type: "image/jpeg",
                  data: imageBase64
                }
              }
            ]
          : [{ text: prompt }]
      }],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 2048,
      }
    };
    
    console.log('Sending request to Gemini API...');
    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('Gemini API error response:', errorText);
      
      // Parse error for better user feedback
      try {
        const errorJson = JSON.parse(errorText);
        const errorMessage = errorJson.error?.message || errorText;
        const errorCode = errorJson.error?.code || response.status;
        
        if (errorCode === 400 && errorMessage.includes('API key not valid')) {
          throw new Error('Invalid Gemini API key. Please verify your API key is correct.');
        }
        
        throw new Error(`Gemini API error (${errorCode}): ${errorMessage}`);
      } catch (e) {
        throw new Error(`Gemini API error (${response.status}): ${errorText}`);
      }
    }
    
    const data = await response.json();
    console.log('Gemini API response received successfully');
    
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!textResponse) {
      console.log('No text response from Gemini. Full response:', JSON.stringify(data));
      throw new Error('No response from Gemini AI');
    }
    
    // Extract JSON from response (remove markdown code blocks if present)
    let jsonText = textResponse.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }
    
    const analysis = JSON.parse(jsonText);
    
    return c.json(analysis);
  } catch (error) {
    console.log('Error analyzing allergens with Gemini:', error);
    return c.json({ error: `Failed to analyze allergens: ${error.message}` }, 500);
  }
});

// Save user allergen profile
app.post('/make-server-f76a17ea/save-allergens', async (c) => {
  try {
    const { userId, allergens } = await c.req.json();
    
    if (!userId) {
      return c.json({ error: 'User ID is required' }, 400);
    }
    
    await kv.set(`allergens:${userId}`, allergens);
    
    return c.json({ success: true });
  } catch (error) {
    console.log('Error saving allergens:', error);
    return c.json({ error: `Failed to save allergens: ${error.message}` }, 500);
  }
});

// Get user allergen profile
app.get('/make-server-f76a17ea/get-allergens', async (c) => {
  try {
    const userId = c.req.query('userId');
    
    if (!userId) {
      return c.json({ error: 'User ID is required' }, 400);
    }
    
    const allergens = await kv.get(`allergens:${userId}`) || [];
    
    return c.json({ allergens });
  } catch (error) {
    console.log('Error getting allergens:', error);
    return c.json({ error: `Failed to get allergens: ${error.message}` }, 500);
  }
});

// Save user profile (name, age, gender, allergens)
app.post('/make-server-f76a17ea/save-profile', async (c) => {
  try {
    const { userId, profile } = await c.req.json();
    
    if (!userId || !profile) {
      return c.json({ error: 'User ID and profile are required' }, 400);
    }
    
    await kv.set(`profile:${userId}`, profile);
    
    return c.json({ success: true });
  } catch (error) {
    console.log('Error saving profile:', error);
    return c.json({ error: `Failed to save profile: ${error.message}` }, 500);
  }
});

// Get user profile
app.get('/make-server-f76a17ea/get-profile', async (c) => {
  try {
    const userId = c.req.query('userId');
    
    if (!userId) {
      return c.json({ error: 'User ID is required' }, 400);
    }
    
    const profile = await kv.get(`profile:${userId}`);
    
    return c.json({ profile: profile || null });
  } catch (error) {
    console.log('Error getting profile:', error);
    return c.json({ error: `Failed to get profile: ${error.message}` }, 500);
  }
});

// Save analysis to history
app.post('/make-server-f76a17ea/save-history', async (c) => {
  try {
    const { userId, analysis } = await c.req.json();
    
    if (!userId || !analysis) {
      return c.json({ error: 'User ID and analysis are required' }, 400);
    }
    
    const historyKey = `history:${userId}`;
    const history = await kv.get(historyKey) || [];
    
    const newEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      ...analysis,
    };
    
    history.unshift(newEntry);
    
    // Keep only last 50 entries
    if (history.length > 50) {
      history.length = 50;
    }
    
    await kv.set(historyKey, history);
    
    return c.json({ success: true, entry: newEntry });
  } catch (error) {
    console.log('Error saving history:', error);
    return c.json({ error: `Failed to save history: ${error.message}` }, 500);
  }
});

// Get user history
app.get('/make-server-f76a17ea/get-history', async (c) => {
  try {
    const userId = c.req.query('userId');
    
    if (!userId) {
      return c.json({ error: 'User ID is required' }, 400);
    }
    
    const history = await kv.get(`history:${userId}`) || [];
    
    return c.json({ history });
  } catch (error) {
    console.log('Error getting history:', error);
    return c.json({ error: `Failed to get history: ${error.message}` }, 500);
  }
});

// Delete history entry
app.post('/make-server-f76a17ea/delete-history', async (c) => {
  try {
    const { userId, entryId } = await c.req.json();
    
    if (!userId || !entryId) {
      return c.json({ error: 'User ID and entry ID are required' }, 400);
    }
    
    const historyKey = `history:${userId}`;
    let history = await kv.get(historyKey) || [];
    
    history = history.filter((entry: any) => entry.id !== entryId);
    
    await kv.set(historyKey, history);
    
    return c.json({ success: true });
  } catch (error) {
    console.log('Error deleting history entry:', error);
    return c.json({ error: `Failed to delete history entry: ${error.message}` }, 500);
  }
});

// Clear all history
app.post('/make-server-f76a17ea/clear-history', async (c) => {
  try {
    const { userId } = await c.req.json();
    
    if (!userId) {
      return c.json({ error: 'User ID is required' }, 400);
    }
    
    await kv.set(`history:${userId}`, []);
    
    return c.json({ success: true });
  } catch (error) {
    console.log('Error clearing history:', error);
    return c.json({ error: `Failed to clear history: ${error.message}` }, 500);
  }
});

Deno.serve(app.fetch);

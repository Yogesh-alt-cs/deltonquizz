import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const sanitizeText = (v: unknown, max: number) => {
  if (typeof v !== 'string') return '';
  // Strip control chars, collapse whitespace, cap length
  return v.replace(/[\x00-\x1F\x7F]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // --- Authentication ---
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Unauthorized' }, 401);
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) return json({ error: 'Unauthorized' }, 401);

    // --- Input validation ---
    const body = await req.json().catch(() => ({}));
    const topic = sanitizeText(body.topic, 200);
    const category = sanitizeText(body.category, 80);
    const course = sanitizeText(body.course, 120);
    const allowedDifficulty = ['easy', 'medium', 'hard'];
    const difficulty = allowedDifficulty.includes(body.difficulty) ? body.difficulty : 'medium';
    let numQuestions = Number(body.numQuestions);
    if (!Number.isFinite(numQuestions)) numQuestions = 10;
    numQuestions = Math.min(Math.max(Math.floor(numQuestions), 1), 30);

    if (!topic) return json({ error: 'topic is required' }, 400);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const visualCategories = ['flags', 'biology-diagrams', 'anime-characters', 'brand-logos', 'geography', 'anatomy'];
    const isVisual = visualCategories.includes(category?.toLowerCase?.() ?? '') || topic?.toLowerCase?.().includes('flag') || topic?.toLowerCase?.().includes('diagram') || topic?.toLowerCase?.().includes('anime') || topic?.toLowerCase?.().includes('logo');

    const imageInstructions = isVisual ? `
IMPORTANT: This is a VISUAL quiz. Each question MUST include an "image_url" field with a real, publicly accessible image URL.
Use images from Wikimedia Commons, Wikipedia, or other reliable public sources.
- For flags: use https://flagcdn.com/w640/{iso2}.png (e.g., https://flagcdn.com/w640/jp.png for Japan)
- For biology/anatomy diagrams: use Wikimedia Commons direct file URLs (e.g., https://upload.wikimedia.org/wikipedia/commons/...)
- For anime: use publicly available character images from Wikimedia or similar
- For brand logos: use logo URLs from Wikimedia Commons
- Ensure all URLs are direct image links (ending in .png, .jpg, .svg, or similar)
- The "image_url" must be a REAL working URL, not a placeholder
` : '';

    const prompt = `Generate a quiz with exactly ${numQuestions || 10} multiple choice questions about "${topic}"${course ? ` specifically for the course: ${course}` : ''}${category ? ` in the category: ${category}` : ''}.
    
Difficulty level: ${difficulty || 'medium'}

Requirements:
- Each question must have exactly 4 options
- Questions should be challenging but fair for the ${difficulty} difficulty level
- Include a brief explanation for the correct answer
- Vary question types (definitions, applications, problem-solving)
${imageInstructions}
Return a JSON object with this exact structure:
{
  "title": "Quiz title",
  "description": "Brief description",
  "questions": [
    {
      "question_text": "The question?",
      ${isVisual ? '"image_url": "https://example.com/image.png",' : ''}
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": 0,
      "explanation": "Why this is correct",
      "points": 10
    }
  ]
}

Only return valid JSON, no markdown or extra text.`;

    console.log('Generating quiz for topic:', topic, 'difficulty:', difficulty);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are a quiz generator. You create educational quiz questions. Always respond with valid JSON only.' },
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add more credits.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content in AI response');
    }

    // Parse the JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse quiz JSON from response');
    }
    
    const quizData = JSON.parse(jsonMatch[0]);
    console.log('Quiz generated successfully with', quizData.questions?.length, 'questions');

    return new Response(JSON.stringify(quizData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error generating quiz:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

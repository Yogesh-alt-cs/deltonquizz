import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pdfText, numQuestions, difficulty } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    if (!pdfText || pdfText.trim().length < 50) {
      throw new Error('PDF text is too short to generate meaningful questions');
    }

    // Clean and truncate text to avoid issues
    const cleanedText = pdfText
      .replace(/[^\x20-\x7E\n\r\t]/g, ' ')
      .replace(/\s+/g, ' ')
      .substring(0, 10000);

    const prompt = `Based on the following document content, create exactly ${numQuestions || 10} quiz questions.

DOCUMENT CONTENT:
${cleanedText}

IMPORTANT REQUIREMENTS:
1. Create exactly ${numQuestions || 10} multiple choice questions
2. Each question MUST have exactly 4 options as an array of strings
3. correct_answer MUST be an integer (0, 1, 2, or 3)
4. Difficulty level: ${difficulty || 'medium'}
5. Keep explanations brief (max 100 characters)
6. Do NOT include special characters that break JSON

Respond with ONLY this JSON structure (no markdown, no code blocks):
{"title":"Quiz Title","description":"Brief description","questions":[{"question_text":"Question?","options":["A","B","C","D"],"correct_answer":0,"explanation":"Brief explanation","points":10}]}`;

    console.log('Generating quiz from PDF, cleaned text length:', cleanedText.length);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are a JSON quiz generator. You ONLY output valid JSON. Never use markdown. Never use code blocks. Only output raw JSON.' },
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
    let content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content in AI response');
    }

    // Clean the response - remove markdown code blocks if present
    content = content
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim();

    // Find JSON object
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('Raw content:', content.substring(0, 500));
      throw new Error('Could not find JSON in response');
    }
    
    // Parse with error handling
    let quizData;
    try {
      quizData = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Attempted to parse:', jsonMatch[0].substring(0, 500));
      throw new Error('Failed to parse quiz JSON - invalid format from AI');
    }

    // Validate structure
    if (!quizData.questions || !Array.isArray(quizData.questions)) {
      throw new Error('Invalid quiz structure - missing questions array');
    }

    console.log('PDF quiz generated successfully with', quizData.questions.length, 'questions');

    return new Response(JSON.stringify(quizData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error generating quiz from PDF:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

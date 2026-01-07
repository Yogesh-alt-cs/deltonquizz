import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Advanced text cleaning to extract only meaningful content
function cleanPdfText(rawText: string): string {
  let text = rawText;
  
  // Remove common PDF metadata and formatting artifacts
  text = text
    // Remove page numbers in various formats
    .replace(/\bPage\s*\d+\s*(of\s*\d+)?\b/gi, '')
    .replace(/^\s*\d+\s*$/gm, '')
    // Remove common headers/footers patterns
    .replace(/^(Copyright|©|All Rights Reserved|Confidential|Draft|Version).*$/gim, '')
    // Remove URLs and file paths
    .replace(/https?:\/\/[^\s]+/g, '')
    .replace(/[A-Za-z]:\\[^\s]+/g, '')
    // Remove email addresses
    .replace(/[\w.-]+@[\w.-]+\.\w+/g, '')
    // Remove excessive special characters (likely formatting)
    .replace(/[▪▸►◆●○■□▶◀★☆→←↑↓]/g, '')
    // Remove font declarations and encoding artifacts
    .replace(/\/[A-Z][a-z]+\+?[A-Z][a-z]+/g, '')
    .replace(/\b(Arial|Times|Helvetica|Calibri|Cambria)\b/gi, '')
    // Remove dimension and coordinate data (page layout)
    .replace(/\b\d+(\.\d+)?\s*(pt|px|mm|cm|in)\b/gi, '')
    .replace(/\bx\s*=\s*\d+/gi, '')
    .replace(/\by\s*=\s*\d+/gi, '')
    .replace(/\bwidth\s*[:=]\s*\d+/gi, '')
    .replace(/\bheight\s*[:=]\s*\d+/gi, '')
    // Remove PDF operators and commands
    .replace(/\b(BT|ET|Tf|Td|TJ|Tm|cm|re|f|S|W|n)\b/g, '')
    // Remove isolated numbers that aren't part of content
    .replace(/^\s*[\d.]+\s*$/gm, '')
    // Normalize whitespace
    .replace(/\t+/g, ' ')
    .replace(/  +/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  
  return text;
}

// Detect and parse existing questions from text
function detectExistingQuestions(text: string): { 
  hasQuestions: boolean; 
  questions: Array<{
    question: string;
    options: string[];
    answer?: string;
  }>;
} {
  const questions: Array<{ question: string; options: string[]; answer?: string }> = [];
  
  // Pattern for MCQ questions with options
  const mcqPattern = /(?:^|\n)\s*(?:Q\.?\s*)?(\d+)[.)]\s*([^\n]+(?:\n(?![A-Da-d][.)]).+)*)\s*\n\s*[Aa][.)]\s*([^\n]+)\s*\n\s*[Bb][.)]\s*([^\n]+)\s*\n\s*[Cc][.)]\s*([^\n]+)\s*\n\s*[Dd][.)]\s*([^\n]+)/g;
  
  let match;
  while ((match = mcqPattern.exec(text)) !== null) {
    questions.push({
      question: match[2].trim(),
      options: [match[3].trim(), match[4].trim(), match[5].trim(), match[6].trim()],
    });
  }
  
  // Try alternative pattern: numbered questions with lettered options
  if (questions.length === 0) {
    const altPattern = /(?:^|\n)\s*(\d+)[.)]\s*([^?]+\?)\s*\n\s*(?:\(?[Aa]\)?\.?\s*([^\n]+))\s*\n\s*(?:\(?[Bb]\)?\.?\s*([^\n]+))\s*\n\s*(?:\(?[Cc]\)?\.?\s*([^\n]+))\s*\n\s*(?:\(?[Dd]\)?\.?\s*([^\n]+))/g;
    
    while ((match = altPattern.exec(text)) !== null) {
      questions.push({
        question: match[2].trim(),
        options: [match[3].trim(), match[4].trim(), match[5].trim(), match[6].trim()],
      });
    }
  }
  
  // Detect True/False questions
  const tfPattern = /(?:^|\n)\s*(?:Q\.?\s*)?(\d+)[.)]\s*([^\n]+)\s*\n\s*(?:(?:\(?[Aa]\)?|1)[.)]\s*(True|T))\s*\n\s*(?:(?:\(?[Bb]\)?|2)[.)]\s*(False|F))/gi;
  
  while ((match = tfPattern.exec(text)) !== null) {
    questions.push({
      question: match[2].trim(),
      options: ['True', 'False'],
    });
  }
  
  return {
    hasQuestions: questions.length > 0,
    questions,
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pdfText, numQuestions, difficulty, topic } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    if (!pdfText || pdfText.trim().length < 20) {
      throw new Error('Document content is too short to generate meaningful questions');
    }

    // Step 1: Clean the PDF text thoroughly
    const cleanedText = cleanPdfText(pdfText);
    
    if (cleanedText.length < 50) {
      throw new Error('After cleaning, document content is too short. Please ensure the PDF contains readable text.');
    }

    console.log('Original text length:', pdfText.length, 'Cleaned length:', cleanedText.length);
    
    // Step 2: Detect if there are existing questions in the document
    const existingQuestions = detectExistingQuestions(cleanedText);
    console.log('Detected existing questions:', existingQuestions.questions.length);
    
    // Step 3: Prepare the content for AI (take up to 20000 chars for better context)
    const contentForAI = cleanedText.substring(0, 20000);
    
    // Step 4: Build the appropriate prompt
    let prompt: string;
    
    if (existingQuestions.hasQuestions && existingQuestions.questions.length >= 5) {
      // Document contains questions - extract and format them
      prompt = `You are analyzing an educational document that contains existing questions. 

DETECTED QUESTIONS FROM DOCUMENT:
${JSON.stringify(existingQuestions.questions.slice(0, numQuestions || 10), null, 2)}

FULL DOCUMENT CONTENT (for context and answers):
${contentForAI}

INSTRUCTIONS:
1. Use the detected questions from the document
2. For each question, determine the correct answer based on the document content
3. If a question has fewer than 4 options, add plausible distractors
4. Provide explanations for why each answer is correct
5. Ensure exactly ${numQuestions || 10} questions total (add AI-generated ones if needed)
6. Set difficulty to ${difficulty || 'medium'}

${topic ? `Focus on questions related to: "${topic}"` : ''}

Return ONLY valid JSON (no markdown):
{"title":"Quiz Title","description":"Brief description","questions":[{"question_text":"Question?","options":["A","B","C","D"],"correct_answer":0,"explanation":"Why correct","points":10}]}`;
    } else {
      // Document is content-only - generate questions from scratch
      const topicInstruction = topic 
        ? `Focus specifically on: "${topic}". Only create questions about this topic.`
        : 'Create questions covering the main educational concepts.';

      prompt = `You are an expert educational content analyzer. Create a quiz from this document.

DOCUMENT CONTENT:
${contentForAI}

REQUIREMENTS:
1. ${topicInstruction}
2. Generate exactly ${numQuestions || 10} multiple choice questions
3. Difficulty: ${difficulty || 'medium'}
4. Each question MUST have exactly 4 distinct options
5. Questions should test understanding, not memorization
6. Ensure factual accuracy based on the document
7. correct_answer is the index (0-3) of the correct option

DIFFICULTY LEVELS:
- Easy: Basic recall and definitions
- Medium: Application and analysis  
- Hard: Synthesis, evaluation, multi-step reasoning

QUESTION TYPES TO INCLUDE:
- Conceptual understanding questions
- Application/scenario questions
- Comparison/contrast questions
- Cause and effect questions

Return ONLY valid JSON (no markdown, no code blocks):
{"title":"Quiz Title Based on Content","description":"Brief quiz description","questions":[{"question_text":"Question?","options":["Option A","Option B","Option C","Option D"],"correct_answer":0,"explanation":"Brief explanation","points":10}]}`;
    }

    console.log('Sending to AI, content length for AI:', contentForAI.length);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { 
            role: 'system', 
            content: 'You are an educational quiz generator. Output ONLY valid JSON. Never use markdown. Never use code blocks. Output raw JSON only.' 
          },
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }), {
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

    // Clean response thoroughly
    content = content
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .replace(/^\s*json\s*/i, '')
      .trim();

    // Find JSON object
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('Raw content preview:', content.substring(0, 500));
      throw new Error('Could not find valid JSON in AI response');
    }
    
    // Parse with error handling
    let quizData;
    try {
      quizData = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Attempted to parse:', jsonMatch[0].substring(0, 500));
      throw new Error('Failed to parse quiz data from AI response');
    }

    // Validate structure
    if (!quizData.questions || !Array.isArray(quizData.questions)) {
      throw new Error('Invalid quiz structure - missing questions array');
    }

    // Validate and fix each question
    quizData.questions = quizData.questions.map((q: any, idx: number) => ({
      question_text: q.question_text || q.question || `Question ${idx + 1}`,
      options: Array.isArray(q.options) && q.options.length >= 2 
        ? q.options.slice(0, 4).map((o: any) => String(o))
        : ['Option A', 'Option B', 'Option C', 'Option D'],
      correct_answer: typeof q.correct_answer === 'number' 
        ? Math.min(Math.max(0, q.correct_answer), (q.options?.length || 4) - 1)
        : 0,
      explanation: q.explanation || 'See the document for details.',
      points: q.points || 10,
    }));

    // Pad options to 4 if needed
    quizData.questions = quizData.questions.map((q: any) => {
      while (q.options.length < 4) {
        q.options.push(`Option ${String.fromCharCode(65 + q.options.length)}`);
      }
      return q;
    });

    console.log('Quiz generated successfully:', quizData.questions.length, 'questions');

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

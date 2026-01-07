import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const userId = user.id;

    // Get user's topic stats (weak areas)
    const { data: topicStats } = await supabase
      .from('user_topic_stats')
      .select('*')
      .eq('user_id', userId)
      .order('correct_answers', { ascending: true });

    // Get user's learning goals
    const { data: learningGoals } = await supabase
      .from('learning_goals')
      .select('*, categories(name)')
      .eq('user_id', userId)
      .eq('is_active', true);

    // Get user's recent quiz sessions
    const { data: recentSessions } = await supabase
      .from('quiz_sessions')
      .select('quiz_id, score, created_at')
      .eq('user_id', userId)
      .eq('completed', true)
      .order('created_at', { ascending: false })
      .limit(20);

    const recentQuizIds = recentSessions?.map(s => s.quiz_id) || [];

    // Get user's profile for level-based recommendations
    const { data: profile } = await supabase
      .from('profiles')
      .select('level, total_quizzes_played')
      .eq('id', userId)
      .single();

    const userLevel = profile?.level || 1;
    const quizzesPlayed = profile?.total_quizzes_played || 0;

    // Determine recommended difficulty based on performance
    let recommendedDifficulty = 'medium';
    if (topicStats && topicStats.length > 0) {
      const avgAccuracy = topicStats.reduce((sum, s) => {
        const accuracy = s.total_questions > 0 ? (s.correct_answers / s.total_questions) * 100 : 50;
        return sum + accuracy;
      }, 0) / topicStats.length;

      if (avgAccuracy > 80) recommendedDifficulty = 'hard';
      else if (avgAccuracy < 50) recommendedDifficulty = 'easy';
    }

    // Build recommendations
    const recommendations: Array<{
      quiz_id?: string;
      type: 'weak_area' | 'goal' | 'popular' | 'new' | 'challenge';
      reason: string;
      topic?: string;
      category_id?: string;
      category_name?: string;
      difficulty: string;
      priority: number;
    }> = [];

    // 1. Weak area recommendations (highest priority)
    const weakTopics = topicStats
      ?.filter(s => s.total_questions > 0 && (s.correct_answers / s.total_questions) < 0.6)
      .slice(0, 3) || [];

    for (const weak of weakTopics) {
      // Find quizzes matching this weak topic
      const { data: matchingQuizzes } = await supabase
        .from('quizzes')
        .select('id, title, category_id, difficulty')
        .ilike('title', `%${weak.topic}%`)
        .eq('is_public', true)
        .not('id', 'in', `(${recentQuizIds.join(',') || 'null'})`)
        .limit(1);

      if (matchingQuizzes && matchingQuizzes.length > 0) {
        recommendations.push({
          quiz_id: matchingQuizzes[0].id,
          type: 'weak_area',
          reason: `Improve your ${weak.topic} skills (${Math.round((weak.correct_answers / weak.total_questions) * 100)}% accuracy)`,
          topic: weak.topic,
          category_id: weak.category_id,
          difficulty: matchingQuizzes[0].difficulty || 'medium',
          priority: 1,
        });
      }
    }

    // 2. Learning goal recommendations
    for (const goal of (learningGoals || [])) {
      const { data: goalQuizzes } = await supabase
        .from('quizzes')
        .select('id, title, difficulty')
        .eq('category_id', goal.category_id)
        .eq('is_public', true)
        .not('id', 'in', `(${recentQuizIds.join(',') || 'null'})`)
        .limit(2);

      for (const quiz of (goalQuizzes || [])) {
        recommendations.push({
          quiz_id: quiz.id,
          type: 'goal',
          reason: `Matches your learning goal: ${goal.target_topic || (goal as any).categories?.name}`,
          category_id: goal.category_id || undefined,
          category_name: (goal as any).categories?.name,
          difficulty: quiz.difficulty || 'medium',
          priority: 2,
        });
      }
    }

    // 3. Popular quizzes (social proof)
    const { data: popularQuizzes } = await supabase
      .from('quizzes')
      .select('id, title, category_id, difficulty, total_plays')
      .eq('is_public', true)
      .not('id', 'in', `(${recentQuizIds.join(',') || 'null'})`)
      .order('total_plays', { ascending: false })
      .limit(3);

    for (const quiz of (popularQuizzes || [])) {
      recommendations.push({
        quiz_id: quiz.id,
        type: 'popular',
        reason: `Popular quiz (${quiz.total_plays} plays)`,
        difficulty: quiz.difficulty || 'medium',
        priority: 3,
      });
    }

    // 4. New quizzes to explore
    const { data: newQuizzes } = await supabase
      .from('quizzes')
      .select('id, title, category_id, difficulty')
      .eq('is_public', true)
      .not('id', 'in', `(${recentQuizIds.join(',') || 'null'})`)
      .order('created_at', { ascending: false })
      .limit(2);

    for (const quiz of (newQuizzes || [])) {
      recommendations.push({
        quiz_id: quiz.id,
        type: 'new',
        reason: 'Recently added quiz',
        difficulty: quiz.difficulty || 'medium',
        priority: 4,
      });
    }

    // Sort by priority and deduplicate
    const uniqueRecommendations = recommendations
      .filter((rec, idx, arr) => 
        rec.quiz_id ? arr.findIndex(r => r.quiz_id === rec.quiz_id) === idx : true
      )
      .sort((a, b) => a.priority - b.priority)
      .slice(0, 10);

    // Fetch full quiz details for recommendations with quiz_ids
    const quizIds = uniqueRecommendations
      .filter(r => r.quiz_id)
      .map(r => r.quiz_id);

    let quizDetails: Record<string, any> = {};
    if (quizIds.length > 0) {
      const { data: quizzes } = await supabase
        .from('quizzes')
        .select('id, title, description, difficulty, total_plays, categories(name)')
        .in('id', quizIds);

      quizDetails = (quizzes || []).reduce((acc, q) => {
        acc[q.id] = q;
        return acc;
      }, {} as Record<string, any>);
    }

    const enrichedRecommendations = uniqueRecommendations.map(rec => ({
      ...rec,
      quiz: rec.quiz_id ? quizDetails[rec.quiz_id] : null,
    }));

    return new Response(JSON.stringify({
      recommendations: enrichedRecommendations,
      userStats: {
        level: userLevel,
        quizzesPlayed,
        recommendedDifficulty,
        weakAreas: weakTopics.map(w => w.topic),
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error getting recommendations:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

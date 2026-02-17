import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Navbar } from '@/components/layout/Navbar';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { 
  History, Trophy, Clock, Target, Zap, ArrowLeft, 
  Play, Calendar, ChevronRight, Loader2 
} from 'lucide-react';
import { format } from 'date-fns';

interface QuizSession {
  id: string;
  quiz_id: string;
  score: number;
  max_streak: number;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
  time_taken_seconds: number;
  current_question: number;
  mode?: string;
  quiz_title?: string;
  category?: string;
  total_questions?: number;
  correct_answers?: number;
  accuracy?: number;
  quiz?: {
    title: string;
    difficulty: string | null;
    category_id: string | null;
  };
}

export default function QuizHistoryPage() {
  const [sessions, setSessions] = useState<QuizSession[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchHistory();
  }, [user, navigate]);

  const fetchHistory = async () => {
    if (!user) return;

    // Fetch from quiz_sessions (legacy)
    const { data: sessionsData } = await supabase
      .from('quiz_sessions')
      .select(`
        *,
        quiz:quizzes (
          title,
          difficulty,
          category_id
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    // Fetch from quiz_history (new centralized)
    const { data: historyData } = await supabase
      .from('quiz_history')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    // Merge: convert quiz_history rows to match QuizSession shape
    const historyAsSessions: QuizSession[] = (historyData || []).map((h: any) => ({
      id: h.id,
      quiz_id: h.quiz_id || '',
      score: h.score,
      max_streak: h.max_streak || 0,
      completed: h.completed,
      completed_at: h.created_at,
      created_at: h.created_at,
      time_taken_seconds: h.time_taken_seconds,
      current_question: h.total_questions || 0,
      mode: h.mode,
      quiz_title: h.quiz_title,
      category: h.category,
      total_questions: h.total_questions,
      correct_answers: h.correct_answers,
      accuracy: h.accuracy,
    }));

    // Combine and deduplicate by created_at proximity, sort by date
    const allSessions = [...(sessionsData || []), ...historyAsSessions];
    allSessions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Remove near-duplicate entries (same quiz within 5s)
    const deduped: QuizSession[] = [];
    for (const s of allSessions) {
      const isDupe = deduped.some(d => 
        d.quiz_id === s.quiz_id && 
        Math.abs(new Date(d.created_at).getTime() - new Date(s.created_at).getTime()) < 5000
      );
      if (!isDupe) deduped.push(s);
    }

    setSessions(deduped.slice(0, 100));
    setLoading(false);
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getDifficultyColor = (difficulty: string | null) => {
    switch (difficulty) {
      case 'easy': return 'text-success';
      case 'hard': return 'text-destructive';
      default: return 'text-warning';
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 pt-24">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto"
        >
          <div className="flex items-center gap-3 mb-8">
            <History className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold font-display text-foreground">Quiz History</h1>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : sessions.length === 0 ? (
            <Card className="glass-card p-8 text-center">
              <History className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">No Quiz History</h2>
              <p className="text-muted-foreground mb-6">
                You haven't completed any quizzes yet. Start playing to build your history!
              </p>
              <Button variant="gaming" onClick={() => navigate('/categories')}>
                <Play className="w-4 h-4 mr-2" />
                Start a Quiz
              </Button>
            </Card>
          ) : (
            <div className="space-y-4">
              {sessions.map((session, index) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card 
                    className="glass-card p-4 hover:bg-muted/50 transition-colors cursor-pointer group"
                    onClick={() => navigate(`/quiz/${session.quiz_id}`)}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        session.completed ? 'bg-success/20' : 'bg-warning/20'
                      }`}>
                        {session.completed ? (
                          <Trophy className="w-6 h-6 text-success" />
                        ) : (
                          <Target className="w-6 h-6 text-warning" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-foreground truncate">
                            {session.quiz_title || session.quiz?.title || 'Quiz'}
                          </h3>
                          {session.mode && session.mode !== 'solo' && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary capitalize">
                              {session.mode}
                            </span>
                          )}
                          {session.quiz?.difficulty && (
                            <span className={`text-xs capitalize ${getDifficultyColor(session.quiz.difficulty)}`}>
                              {session.quiz.difficulty}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {session.completed_at 
                              ? format(new Date(session.completed_at), 'MMM d, yyyy')
                              : format(new Date(session.created_at), 'MMM d, yyyy')
                            }
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDuration(session.time_taken_seconds)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <div className="text-xl font-bold text-primary">{session.score}</div>
                          <div className="text-xs text-muted-foreground">points</div>
                        </div>
                        
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-warning">
                            <Zap className="w-4 h-4" />
                            <span className="font-bold">{session.max_streak}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">streak</div>
                        </div>

                        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}

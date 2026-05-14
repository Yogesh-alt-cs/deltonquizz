import { SEO } from "@/components/SEO";
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Navbar } from '@/components/layout/Navbar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { 
  History, Trophy, Clock, Target, Zap, ArrowLeft, 
  Play, Calendar, Eye, RotateCcw, Loader2, BookOpen, AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';

interface HistoryEntry {
  id: string;
  quiz_id: string;
  score: number;
  max_streak: number;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
  time_taken_seconds: number;
  mode: string;
  quiz_title: string;
  category: string | null;
  total_questions: number;
  correct_answers: number;
  accuracy: number;
  status: 'completed' | 'in_progress' | 'abandoned';
}

export default function QuizHistoryPage() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'completed' | 'in_progress' | 'abandoned'>('all');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    fetchHistory();
  }, [user, navigate]);

  const fetchHistory = async () => {
    if (!user) return;

    // Fetch from unified quiz_history table
    const { data: historyData } = await supabase
      .from('quiz_history')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100);

    const mapped: HistoryEntry[] = (historyData || []).map((h: any) => {
      // Determine status: completed, in_progress, or abandoned
      let status: 'completed' | 'in_progress' | 'abandoned' = 'completed';
      if (!h.completed) {
        const created = new Date(h.created_at);
        const hoursAgo = (Date.now() - created.getTime()) / (1000 * 60 * 60);
        status = hoursAgo > 24 ? 'abandoned' : 'in_progress';
      }
      return {
        id: h.id,
        quiz_id: h.quiz_id || '',
        score: h.score,
        max_streak: h.max_streak || 0,
        completed: h.completed,
        completed_at: h.created_at,
        created_at: h.created_at,
        time_taken_seconds: h.time_taken_seconds,
        mode: h.mode || 'solo',
        quiz_title: h.quiz_title || 'Quiz',
        category: h.category,
        total_questions: h.total_questions || 0,
        correct_answers: h.correct_answers || 0,
        accuracy: h.accuracy || 0,
        status,
      };
    });

    setEntries(mapped);
    setLoading(false);
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="text-xs px-2 py-0.5 rounded-full bg-success/20 text-success font-medium">Completed</span>;
      case 'in_progress':
        return <span className="text-xs px-2 py-0.5 rounded-full bg-warning/20 text-warning font-medium">In Progress</span>;
      case 'abandoned':
        return <span className="text-xs px-2 py-0.5 rounded-full bg-muted/50 text-muted-foreground font-medium">Abandoned</span>;
      default:
        return null;
    }
  };

  const filtered = entries.filter(e => filter === 'all' || e.status === filter);

  const counts = {
    all: entries.length,
    completed: entries.filter(e => e.status === 'completed').length,
    in_progress: entries.filter(e => e.status === 'in_progress').length,
    abandoned: entries.filter(e => e.status === 'abandoned').length,
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 pt-24">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />Back
        </Button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <History className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold font-display text-foreground">Quiz History</h1>
          </div>

          {/* Filter Tabs */}
          <Tabs value={filter} onValueChange={(v) => setFilter(v as any)} className="mb-6">
            <TabsList className="w-full grid grid-cols-4">
              <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
              <TabsTrigger value="completed">Completed ({counts.completed})</TabsTrigger>
              <TabsTrigger value="in_progress">In Progress ({counts.in_progress})</TabsTrigger>
              <TabsTrigger value="abandoned">Abandoned ({counts.abandoned})</TabsTrigger>
            </TabsList>
          </Tabs>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <Card className="glass-card p-8 text-center">
              <History className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">
                {filter === 'all' ? 'No Quiz History' : `No ${filter.replace('_', ' ')} quizzes`}
              </h2>
              <p className="text-muted-foreground mb-6">
                {filter === 'all' ? "Start playing to build your history!" : "Try a different filter."}
              </p>
              {filter === 'all' && (
                <Button variant="gaming" onClick={() => navigate('/categories')}>
                  <Play className="w-4 h-4 mr-2" />Start a Quiz
                </Button>
              )}
            </Card>
          ) : (
            <div className="space-y-3">
              {filtered.map((entry, index) => (
                <motion.div key={entry.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.03 }}>
                  <Card className="glass-card p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                        entry.status === 'completed' ? 'bg-success/20' : entry.status === 'in_progress' ? 'bg-warning/20' : 'bg-muted/50'
                      }`}>
                        {entry.status === 'completed' ? <Trophy className="w-6 h-6 text-success" /> :
                         entry.status === 'in_progress' ? <Target className="w-6 h-6 text-warning" /> :
                         <AlertTriangle className="w-6 h-6 text-muted-foreground" />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-semibold text-foreground truncate">{entry.quiz_title}</h3>
                          {entry.category && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-accent/50 text-accent-foreground">{entry.category}</span>
                          )}
                          {entry.mode !== 'solo' && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary capitalize">{entry.mode}</span>
                          )}
                          {getStatusBadge(entry.status)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(entry.created_at), 'MMM d, yyyy h:mm a')}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDuration(entry.time_taken_seconds)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        <div className="text-right">
                          <div className="text-lg font-bold text-primary">
                            {entry.total_questions > 0 ? `${entry.correct_answers}/${entry.total_questions}` : `${entry.score} pts`}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground justify-end">
                            <Zap className="w-3 h-3 text-warning" />
                            <span>{entry.max_streak} streak</span>
                          </div>
                        </div>

                        <div className="flex gap-1">
                          {entry.status === 'completed' ? (
                            <>
                              <Button size="sm" variant="ghost" onClick={() => navigate(`/quiz/${entry.quiz_id}`)} title="Play Again">
                                <RotateCcw className="w-4 h-4" />
                              </Button>
                            </>
                          ) : entry.status === 'in_progress' ? (
                            <Button size="sm" variant="outline" onClick={() => navigate(`/quiz/${entry.quiz_id}`)} title="Resume">
                              <Play className="w-4 h-4 mr-1" />Resume
                            </Button>
                          ) : (
                            <Button size="sm" variant="outline" onClick={() => navigate(`/quiz/${entry.quiz_id}`)} title="Restart">
                              <RotateCcw className="w-4 h-4 mr-1" />Restart
                            </Button>
                          )}
                        </div>
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

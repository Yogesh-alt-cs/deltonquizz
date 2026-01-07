import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/layout/Navbar';
import { 
  ArrowLeft, Sparkles, Target, TrendingUp, Users, Flame, 
  ChevronRight, Loader2, AlertCircle, BookOpen, Trophy
} from 'lucide-react';

interface Recommendation {
  quiz_id?: string;
  type: 'weak_area' | 'goal' | 'popular' | 'new' | 'challenge';
  reason: string;
  topic?: string;
  category_id?: string;
  category_name?: string;
  difficulty: string;
  priority: number;
  quiz?: {
    id: string;
    title: string;
    description: string | null;
    difficulty: string;
    total_plays: number;
    categories?: { name: string };
  };
}

interface UserStats {
  level: number;
  quizzesPlayed: number;
  recommendedDifficulty: string;
  weakAreas: string[];
}

const typeIcons = {
  weak_area: Target,
  goal: BookOpen,
  popular: TrendingUp,
  new: Sparkles,
  challenge: Trophy,
};

const typeColors = {
  weak_area: 'text-orange-500 bg-orange-500/10',
  goal: 'text-blue-500 bg-blue-500/10',
  popular: 'text-green-500 bg-green-500/10',
  new: 'text-purple-500 bg-purple-500/10',
  challenge: 'text-yellow-500 bg-yellow-500/10',
};

const typeLabels = {
  weak_area: 'Improve Weakness',
  goal: 'Learning Goal',
  popular: 'Trending',
  new: 'New Quiz',
  challenge: 'Challenge',
};

export default function RecommendationsPage() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchRecommendations();
  }, [user, navigate]);

  const fetchRecommendations = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const { data: session } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke('get-recommendations', {
        headers: {
          Authorization: `Bearer ${session.session?.access_token}`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      setRecommendations(response.data.recommendations || []);
      setUserStats(response.data.userStats || null);
    } catch (err: any) {
      console.error('Error fetching recommendations:', err);
      setError('Failed to load recommendations. Try again later.');
      
      // Fallback: fetch popular quizzes directly
      const { data: fallbackQuizzes } = await supabase
        .from('quizzes')
        .select('id, title, description, difficulty, total_plays, categories(name)')
        .eq('is_public', true)
        .order('total_plays', { ascending: false })
        .limit(6);

      if (fallbackQuizzes) {
        setRecommendations(fallbackQuizzes.map(q => ({
          quiz_id: q.id,
          type: 'popular' as const,
          reason: 'Popular quiz',
          difficulty: q.difficulty || 'medium',
          priority: 3,
          quiz: q,
        })));
      }
    } finally {
      setLoading(false);
    }
  };

  const startQuiz = (quizId: string) => {
    navigate(`/quiz/${quizId}`);
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
          className="max-w-4xl mx-auto"
        >
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold font-display text-foreground">Recommended For You</h1>
          </div>
          <p className="text-muted-foreground mb-8">Personalized quizzes based on your learning journey</p>

          {/* User Stats Summary */}
          {userStats && (
            <Card className="glass-card p-6 mb-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{userStats.level}</div>
                  <div className="text-sm text-muted-foreground">Your Level</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">{userStats.quizzesPlayed}</div>
                  <div className="text-sm text-muted-foreground">Quizzes Played</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground capitalize">{userStats.recommendedDifficulty}</div>
                  <div className="text-sm text-muted-foreground">Suggested Difficulty</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-500">{userStats.weakAreas.length}</div>
                  <div className="text-sm text-muted-foreground">Areas to Improve</div>
                </div>
              </div>
              
              {userStats.weakAreas.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground mb-2">Focus areas:</p>
                  <div className="flex flex-wrap gap-2">
                    {userStats.weakAreas.map((area, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-orange-500/10 text-orange-500 rounded-full text-sm"
                      >
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Analyzing your learning patterns...</p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <Card className="glass-card p-6 mb-6">
              <div className="flex items-center gap-3 text-orange-500">
                <AlertCircle className="w-5 h-5" />
                <p>{error}</p>
              </div>
            </Card>
          )}

          {/* Recommendations Grid */}
          {!loading && recommendations.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2">
              {recommendations.map((rec, idx) => {
                const Icon = typeIcons[rec.type];
                const colorClass = typeColors[rec.type];
                const label = typeLabels[rec.type];

                return (
                  <motion.div
                    key={rec.quiz_id || idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <Card className="glass-card p-5 hover:border-primary/50 transition-colors cursor-pointer group">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-lg ${colorClass}`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${colorClass}`}>
                              {label}
                            </span>
                            <span className="text-xs text-muted-foreground capitalize">
                              {rec.difficulty}
                            </span>
                          </div>
                          <h3 className="font-semibold text-foreground truncate">
                            {rec.quiz?.title || rec.topic || 'Explore Quiz'}
                          </h3>
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                            {rec.reason}
                          </p>
                          {rec.quiz?.total_plays !== undefined && (
                            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                              <Users className="w-3 h-3" />
                              {rec.quiz.total_plays} plays
                            </div>
                          )}
                        </div>
                        {rec.quiz_id && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="shrink-0 group-hover:bg-primary group-hover:text-primary-foreground"
                            onClick={() => startQuiz(rec.quiz_id!)}
                          >
                            <ChevronRight className="w-5 h-5" />
                          </Button>
                        )}
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Empty State */}
          {!loading && recommendations.length === 0 && !error && (
            <Card className="glass-card p-12 text-center">
              <Flame className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">Start Your Journey!</h3>
              <p className="text-muted-foreground mb-6">
                Complete a few quizzes to get personalized recommendations
              </p>
              <Button onClick={() => navigate('/categories')}>
                Browse Categories
              </Button>
            </Card>
          )}
        </motion.div>
      </main>
    </div>
  );
}

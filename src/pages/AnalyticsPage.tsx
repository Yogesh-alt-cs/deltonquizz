import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/layout/Navbar';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { FloatingParticles } from '@/components/effects/Particles';
import {
  ArrowLeft, TrendingUp, Target, Brain, Zap, Trophy,
  BarChart3, PieChart, Calendar, Flame, AlertCircle, CheckCircle2, Loader2
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart as RechartsPie, Pie, Cell, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis
} from 'recharts';

interface QuizSession {
  id: string;
  quiz_id: string;
  score: number;
  max_streak: number;
  time_taken_seconds: number;
  completed: boolean;
  created_at: string;
  quiz?: {
    title: string;
    category_id: string;
    difficulty: string;
    category?: {
      name: string;
    };
  };
}

interface CategoryPerformance {
  name: string;
  avgScore: number;
  quizCount: number;
  color: string;
}

interface AnalyticsData {
  totalQuizzes: number;
  totalScore: number;
  avgScore: number;
  bestStreak: number;
  avgTime: number;
  completionRate: number;
  recentTrend: { date: string; score: number; quizzes: number }[];
  categoryPerformance: CategoryPerformance[];
  difficultyBreakdown: { difficulty: string; count: number; avgScore: number }[];
  weeklyActivity: { day: string; quizzes: number }[];
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
}

const COLORS = ['hsl(239, 84%, 67%)', 'hsl(160, 84%, 39%)', 'hsl(38, 92%, 50%)', 'hsl(0, 84%, 60%)', 'hsl(280, 84%, 60%)'];

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchAnalytics();
  }, [user, navigate]);

  const fetchAnalytics = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Fetch quiz sessions with quiz details
      const { data: sessions } = await supabase
        .from('quiz_sessions')
        .select(`
          *,
          quiz:quizzes (
            title,
            category_id,
            difficulty,
            category:categories (name)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!sessions || sessions.length === 0) {
        setAnalytics({
          totalQuizzes: 0,
          totalScore: 0,
          avgScore: 0,
          bestStreak: 0,
          avgTime: 0,
          completionRate: 0,
          recentTrend: [],
          categoryPerformance: [],
          difficultyBreakdown: [],
          weeklyActivity: [],
          strengths: [],
          weaknesses: [],
          suggestions: ['Complete your first quiz to see analytics!'],
        });
        setLoading(false);
        return;
      }

      // Calculate basic stats
      const completedSessions = sessions.filter(s => s.completed);
      const totalQuizzes = sessions.length;
      const totalScore = completedSessions.reduce((sum, s) => sum + (s.score || 0), 0);
      const avgScore = completedSessions.length > 0 ? Math.round(totalScore / completedSessions.length) : 0;
      const bestStreak = Math.max(...sessions.map(s => s.max_streak || 0));
      const avgTime = completedSessions.length > 0 
        ? Math.round(completedSessions.reduce((sum, s) => sum + (s.time_taken_seconds || 0), 0) / completedSessions.length)
        : 0;
      const completionRate = Math.round((completedSessions.length / totalQuizzes) * 100);

      // Calculate recent trend (last 7 days)
      const last7Days = [...Array(7)].map((_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return date.toISOString().split('T')[0];
      });

      const recentTrend = last7Days.map(date => {
        const daySessions = completedSessions.filter(s => 
          s.created_at.split('T')[0] === date
        );
        return {
          date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
          score: daySessions.length > 0 
            ? Math.round(daySessions.reduce((sum, s) => sum + s.score, 0) / daySessions.length)
            : 0,
          quizzes: daySessions.length,
        };
      });

      // Category performance
      const categoryMap = new Map<string, { scores: number[]; name: string }>();
      completedSessions.forEach(s => {
        const catName = (s.quiz as any)?.category?.name || 'Uncategorized';
        if (!categoryMap.has(catName)) {
          categoryMap.set(catName, { scores: [], name: catName });
        }
        categoryMap.get(catName)!.scores.push(s.score || 0);
      });

      const categoryPerformance: CategoryPerformance[] = Array.from(categoryMap.entries()).map(([name, data], idx) => ({
        name,
        avgScore: Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length),
        quizCount: data.scores.length,
        color: COLORS[idx % COLORS.length],
      }));

      // Difficulty breakdown
      const difficultyMap = new Map<string, { scores: number[]; count: number }>();
      completedSessions.forEach(s => {
        const diff = (s.quiz as any)?.difficulty || 'medium';
        if (!difficultyMap.has(diff)) {
          difficultyMap.set(diff, { scores: [], count: 0 });
        }
        difficultyMap.get(diff)!.scores.push(s.score || 0);
        difficultyMap.get(diff)!.count++;
      });

      const difficultyBreakdown = ['easy', 'medium', 'hard'].map(difficulty => {
        const data = difficultyMap.get(difficulty);
        return {
          difficulty: difficulty.charAt(0).toUpperCase() + difficulty.slice(1),
          count: data?.count || 0,
          avgScore: data ? Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length) : 0,
        };
      });

      // Weekly activity
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const weeklyActivity = dayNames.map(day => {
        const dayQuizzes = sessions.filter(s => {
          const sessionDay = new Date(s.created_at).toLocaleDateString('en-US', { weekday: 'short' });
          return sessionDay === day;
        });
        return { day, quizzes: dayQuizzes.length };
      });

      // Determine strengths and weaknesses
      const sortedCategories = [...categoryPerformance].sort((a, b) => b.avgScore - a.avgScore);
      const strengths = sortedCategories.slice(0, 2).filter(c => c.avgScore >= avgScore).map(c => c.name);
      const weaknesses = sortedCategories.slice(-2).filter(c => c.avgScore < avgScore).map(c => c.name);

      // Generate suggestions
      const suggestions: string[] = [];
      
      if (completionRate < 80) {
        suggestions.push('Try to complete more quizzes - finishing helps reinforce learning!');
      }
      if (avgTime > 300) {
        suggestions.push('Practice speed reading to improve your time per question.');
      }
      if (weaknesses.length > 0) {
        suggestions.push(`Focus on improving in: ${weaknesses.join(', ')}`);
      }
      if (bestStreak < 5) {
        suggestions.push('Work on building longer answer streaks for bonus points!');
      }
      if (difficultyBreakdown.find(d => d.difficulty === 'Hard')?.count === 0) {
        suggestions.push('Challenge yourself with some hard difficulty quizzes!');
      }
      if (suggestions.length === 0) {
        suggestions.push("You're doing great! Keep up the consistent practice.");
      }

      setAnalytics({
        totalQuizzes,
        totalScore,
        avgScore,
        bestStreak,
        avgTime,
        completionRate,
        recentTrend,
        categoryPerformance,
        difficultyBreakdown,
        weeklyActivity,
        strengths,
        weaknesses,
        suggestions,
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <FloatingParticles />
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 pt-24">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
              <BarChart3 className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold font-display text-foreground">Quiz Analytics</h1>
              <p className="text-muted-foreground">Track your progress and identify areas for improvement</p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
          ) : !analytics || analytics.totalQuizzes === 0 ? (
            <Card className="glass-card p-12 text-center">
              <BarChart3 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">No Data Yet</h2>
              <p className="text-muted-foreground mb-6">Complete some quizzes to see your analytics!</p>
              <Button onClick={() => navigate('/categories')}>
                Start a Quiz
              </Button>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Stats Overview */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {[
                  { label: 'Total Quizzes', value: analytics.totalQuizzes, icon: Target, color: 'text-primary' },
                  { label: 'Total Score', value: analytics.totalScore.toLocaleString(), icon: Trophy, color: 'text-warning' },
                  { label: 'Avg Score', value: analytics.avgScore, icon: TrendingUp, color: 'text-success' },
                  { label: 'Best Streak', value: analytics.bestStreak, icon: Flame, color: 'text-destructive' },
                  { label: 'Avg Time', value: `${Math.floor(analytics.avgTime / 60)}m`, icon: Calendar, color: 'text-primary' },
                  { label: 'Completion', value: `${analytics.completionRate}%`, icon: CheckCircle2, color: 'text-success' },
                ].map((stat, idx) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card className="glass-card p-4 text-center">
                      <stat.icon className={`w-6 h-6 mx-auto mb-2 ${stat.color}`} />
                      <p className="font-gaming text-xl text-foreground">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* Charts Row */}
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Performance Trend */}
                <Card className="glass-card p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    7-Day Performance
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={analytics.recentTrend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="score" 
                          stroke="hsl(239, 84%, 67%)" 
                          strokeWidth={3}
                          dot={{ fill: 'hsl(239, 84%, 67%)', strokeWidth: 2 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                {/* Category Performance */}
                <Card className="glass-card p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-primary" />
                    Category Performance
                  </h3>
                  {analytics.categoryPerformance.length > 0 ? (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={analytics.categoryPerformance}>
                          <PolarGrid stroke="hsl(var(--border))" />
                          <PolarAngleAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                          <PolarRadiusAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
                          <Radar
                            name="Avg Score"
                            dataKey="avgScore"
                            stroke="hsl(239, 84%, 67%)"
                            fill="hsl(239, 84%, 67%)"
                            fillOpacity={0.5}
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-64 flex items-center justify-center text-muted-foreground">
                      No category data yet
                    </div>
                  )}
                </Card>
              </div>

              {/* Second Row */}
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Difficulty Breakdown */}
                <Card className="glass-card p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-warning" />
                    By Difficulty
                  </h3>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.difficultyBreakdown} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis dataKey="difficulty" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} width={60} />
                        <Tooltip
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                        />
                        <Bar dataKey="avgScore" fill="hsl(239, 84%, 67%)" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                {/* Weekly Activity */}
                <Card className="glass-card p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-success" />
                    Weekly Activity
                  </h3>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.weeklyActivity}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <Tooltip
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                        />
                        <Bar dataKey="quizzes" fill="hsl(160, 84%, 39%)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                {/* Strengths & Weaknesses */}
                <Card className="glass-card p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Brain className="w-5 h-5 text-primary" />
                    Insights
                  </h3>
                  <div className="space-y-4">
                    {analytics.strengths.length > 0 && (
                      <div>
                        <p className="text-sm text-success font-medium mb-2 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4" />
                          Strengths
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {analytics.strengths.map(s => (
                            <span key={s} className="px-3 py-1 bg-success/20 text-success text-sm rounded-full">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {analytics.weaknesses.length > 0 && (
                      <div>
                        <p className="text-sm text-destructive font-medium mb-2 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" />
                          Needs Work
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {analytics.weaknesses.map(w => (
                            <span key={w} className="px-3 py-1 bg-destructive/20 text-destructive text-sm rounded-full">
                              {w}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              </div>

              {/* Suggestions */}
              <Card className="glass-card p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-warning" />
                  Improvement Suggestions
                </h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {analytics.suggestions.map((suggestion, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex items-start gap-3 p-4 bg-background/50 rounded-lg border border-border"
                    >
                      <div className="w-8 h-8 rounded-full bg-warning/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-warning font-bold text-sm">{idx + 1}</span>
                      </div>
                      <p className="text-sm text-foreground">{suggestion}</p>
                    </motion.div>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}

import { SEO } from "@/components/SEO";
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
  BarChart3, PieChart, Calendar, Flame, AlertCircle, CheckCircle2, Loader2, Play, Clock
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  PieChart as RechartsPieChart, Pie, Cell
} from 'recharts';

interface AnalyticsData {
  totalQuizzes: number;
  completedQuizzes: number;
  inProgressQuizzes: number;
  totalScore: number;
  avgScore: number;
  avgAccuracy: number;
  bestStreak: number;
  avgTime: number;
  totalTimeSpent: number;
  completionRate: number;
  recentTrend: { date: string; score: number; accuracy: number; quizzes: number }[];
  categoryPerformance: { name: string; avgScore: number; avgAccuracy: number; quizCount: number; color: string }[];
  difficultyBreakdown: { difficulty: string; count: number; avgScore: number; avgAccuracy: number }[];
  weeklyActivity: { day: string; quizzes: number }[];
  modeBreakdown: { mode: string; count: number }[];
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  strongestCategory: string;
  weakestCategory: string;
  mostPlayedCategory: string;
}

const COLORS = ['hsl(239, 84%, 67%)', 'hsl(160, 84%, 39%)', 'hsl(38, 92%, 50%)', 'hsl(0, 84%, 60%)', 'hsl(280, 84%, 60%)', 'hsl(200, 84%, 50%)'];

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    fetchAnalytics();
  }, [user, navigate]);

  const fetchAnalytics = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Pull from quiz_history (unified table that captures ALL quiz types)
      const { data: historyData } = await supabase
        .from('quiz_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      const records = historyData || [];

      if (records.length === 0) {
        setAnalytics(null);
        setLoading(false);
        return;
      }

      const completed = records.filter(r => r.completed);
      const inProgress = records.filter(r => !r.completed);
      const totalQuizzes = records.length;
      const completedQuizzes = completed.length;
      const totalScore = completed.reduce((s, r) => s + (r.score || 0), 0);
      const avgScore = completedQuizzes > 0 ? Math.round(totalScore / completedQuizzes) : 0;
      const avgAccuracy = completedQuizzes > 0
        ? Math.round(completed.reduce((s, r) => s + (r.accuracy || 0), 0) / completedQuizzes)
        : 0;
      const bestStreak = Math.max(0, ...records.map(r => r.max_streak || 0));
      const totalTimeSpent = records.reduce((s, r) => s + (r.time_taken_seconds || 0), 0);
      const avgTime = completedQuizzes > 0
        ? Math.round(completed.reduce((s, r) => s + (r.time_taken_seconds || 0), 0) / completedQuizzes)
        : 0;
      const completionRate = totalQuizzes > 0 ? Math.round((completedQuizzes / totalQuizzes) * 100) : 0;

      // 7-day trend
      const last7Days = [...Array(7)].map((_, i) => {
        const d = new Date(); d.setDate(d.getDate() - (6 - i));
        return d.toISOString().split('T')[0];
      });
      const recentTrend = last7Days.map(date => {
        const dayRecords = completed.filter(r => r.created_at.split('T')[0] === date);
        return {
          date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
          score: dayRecords.length > 0 ? Math.round(dayRecords.reduce((s, r) => s + r.score, 0) / dayRecords.length) : 0,
          accuracy: dayRecords.length > 0 ? Math.round(dayRecords.reduce((s, r) => s + (r.accuracy || 0), 0) / dayRecords.length) : 0,
          quizzes: dayRecords.length,
        };
      });

      // Category performance
      const catMap = new Map<string, { scores: number[]; accuracies: number[] }>();
      completed.forEach(r => {
        const cat = r.category || 'General';
        if (!catMap.has(cat)) catMap.set(cat, { scores: [], accuracies: [] });
        catMap.get(cat)!.scores.push(r.score || 0);
        catMap.get(cat)!.accuracies.push(r.accuracy || 0);
      });
      const categoryPerformance = Array.from(catMap.entries()).map(([name, data], idx) => ({
        name: name.length > 15 ? name.slice(0, 12) + '...' : name,
        avgScore: Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length),
        avgAccuracy: Math.round(data.accuracies.reduce((a, b) => a + b, 0) / data.accuracies.length),
        quizCount: data.scores.length,
        color: COLORS[idx % COLORS.length],
      }));

      const sortedByAccuracy = [...categoryPerformance].sort((a, b) => b.avgAccuracy - a.avgAccuracy);
      const sortedByCount = [...categoryPerformance].sort((a, b) => b.quizCount - a.quizCount);
      const strongestCategory = sortedByAccuracy[0]?.name || 'N/A';
      const weakestCategory = sortedByAccuracy.length > 1 ? sortedByAccuracy[sortedByAccuracy.length - 1].name : 'N/A';
      const mostPlayedCategory = sortedByCount[0]?.name || 'N/A';

      // Difficulty breakdown from mode field or quiz title heuristic
      const diffMap = new Map<string, { scores: number[]; accuracies: number[] }>();
      completed.forEach(r => {
        // quiz_history doesn't store difficulty directly — infer from category or default
        const diff = 'Medium'; // default
        if (!diffMap.has(diff)) diffMap.set(diff, { scores: [], accuracies: [] });
        diffMap.get(diff)!.scores.push(r.score || 0);
        diffMap.get(diff)!.accuracies.push(r.accuracy || 0);
      });

      // Also try quiz_sessions for difficulty data
      const { data: sessionsData } = await supabase
        .from('quiz_sessions')
        .select('*, quiz:quizzes(difficulty)')
        .eq('user_id', user.id)
        .eq('completed', true);

      const diffMap2 = new Map<string, { count: number; scores: number[]; accuracies: number[] }>();
      (sessionsData || []).forEach((s: any) => {
        const diff = s.quiz?.difficulty || 'medium';
        const cap = diff.charAt(0).toUpperCase() + diff.slice(1);
        if (!diffMap2.has(cap)) diffMap2.set(cap, { count: 0, scores: [], accuracies: [] });
        const d = diffMap2.get(cap)!;
        d.count++;
        d.scores.push(s.score || 0);
      });

      // Fallback: use history count if sessions don't have difficulty
      const difficultyBreakdown = ['Easy', 'Medium', 'Hard'].map(difficulty => {
        const d = diffMap2.get(difficulty);
        return {
          difficulty,
          count: d?.count || (difficulty === 'Medium' ? completedQuizzes : 0),
          avgScore: d && d.scores.length > 0 ? Math.round(d.scores.reduce((a, b) => a + b, 0) / d.scores.length) : avgScore,
          avgAccuracy: avgAccuracy,
        };
      });

      // Weekly activity
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const weeklyActivity = dayNames.map(day => ({
        day,
        quizzes: records.filter(r => new Date(r.created_at).toLocaleDateString('en-US', { weekday: 'short' }) === day).length,
      }));

      // Mode breakdown
      const modeMap = new Map<string, number>();
      records.forEach(r => {
        const mode = r.mode || 'solo';
        modeMap.set(mode, (modeMap.get(mode) || 0) + 1);
      });
      const modeBreakdown = Array.from(modeMap.entries()).map(([mode, count]) => ({ mode, count }));

      // Strengths/weaknesses
      const strengths = sortedByAccuracy.filter(c => c.avgAccuracy >= avgAccuracy).slice(0, 3).map(c => c.name);
      const weaknesses = sortedByAccuracy.filter(c => c.avgAccuracy < avgAccuracy).slice(-3).map(c => c.name);

      // Suggestions
      const suggestions: string[] = [];
      if (strongestCategory !== 'N/A') suggestions.push(`Your strongest category is ${strongestCategory} 💪`);
      if (weakestCategory !== 'N/A' && weakestCategory !== strongestCategory) suggestions.push(`Your weakest category is ${weakestCategory} — practice more!`);
      if (completionRate < 80) suggestions.push('Try finishing more in-progress quizzes for better stats');
      if (avgAccuracy < 70) suggestions.push('Focus on accuracy — take more time to read questions carefully');
      if (avgAccuracy >= 90) suggestions.push('Your accuracy is excellent! Try harder difficulty quizzes');
      if (bestStreak >= 10) suggestions.push(`Impressive ${bestStreak} streak! Keep it going`);
      if (bestStreak < 5) suggestions.push('Work on building longer answer streaks for bonus points');
      // Check for weekly improvement
      const thisWeekQuizzes = recentTrend.reduce((s, d) => s + d.quizzes, 0);
      if (thisWeekQuizzes >= 5) suggestions.push('Great consistency this week! You took ' + thisWeekQuizzes + ' quizzes');
      if (thisWeekQuizzes === 0) suggestions.push("You haven't played this week — jump back in!");
      if (suggestions.length === 0) suggestions.push("You're doing great! Keep up the consistent practice.");

      setAnalytics({
        totalQuizzes,
        completedQuizzes,
        inProgressQuizzes: inProgress.length,
        totalScore,
        avgScore,
        avgAccuracy,
        bestStreak,
        avgTime,
        totalTimeSpent,
        completionRate,
        recentTrend,
        categoryPerformance,
        difficultyBreakdown,
        weeklyActivity,
        modeBreakdown,
        strengths,
        weaknesses,
        suggestions,
        strongestCategory,
        weakestCategory,
        mostPlayedCategory,
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Analytics — Delton Quizz" description="Detailed performance analytics: accuracy by topic, difficulty trends, and progress over time." path="/analytics" />
      <FloatingParticles />
      <Navbar />
      <main className="container mx-auto px-4 py-8 pt-24">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />Back
        </Button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
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
          ) : !analytics ? (
            <Card className="glass-card p-12 text-center">
              <BarChart3 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">No Data Yet</h2>
              <p className="text-muted-foreground mb-6">Start your first quiz to unlock analytics!</p>
              <Button onClick={() => navigate('/categories')}>
                <Play className="w-4 h-4 mr-2" />Start a Quiz
              </Button>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Stats Overview */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {[
                  { label: 'Total Quizzes', value: analytics.totalQuizzes, icon: Target, color: 'text-primary' },
                  { label: 'Avg Score', value: analytics.avgScore, icon: TrendingUp, color: 'text-success' },
                  { label: 'Avg Accuracy', value: `${analytics.avgAccuracy}%`, icon: CheckCircle2, color: 'text-success' },
                  { label: 'Best Streak', value: analytics.bestStreak, icon: Flame, color: 'text-destructive' },
                  { label: 'Time Spent', value: formatTime(analytics.totalTimeSpent), icon: Clock, color: 'text-primary' },
                  { label: 'Completion', value: `${analytics.completionRate}%`, icon: Trophy, color: 'text-warning' },
                ].map((stat, idx) => (
                  <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
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
                {/* 7-Day Performance */}
                <Card className="glass-card p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />7-Day Performance
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={analytics.recentTrend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }} />
                        <Line type="monotone" dataKey="score" stroke="hsl(239, 84%, 67%)" strokeWidth={3} dot={{ fill: 'hsl(239, 84%, 67%)', strokeWidth: 2 }} name="Avg Score" />
                        <Line type="monotone" dataKey="accuracy" stroke="hsl(160, 84%, 39%)" strokeWidth={2} dot={{ fill: 'hsl(160, 84%, 39%)', strokeWidth: 2 }} name="Accuracy %" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                {/* Category Radar */}
                <Card className="glass-card p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-primary" />Category Performance
                  </h3>
                  {analytics.categoryPerformance.length > 0 ? (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={analytics.categoryPerformance}>
                          <PolarGrid stroke="hsl(var(--border))" />
                          <PolarAngleAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                          <PolarRadiusAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
                          <Radar name="Accuracy" dataKey="avgAccuracy" stroke="hsl(239, 84%, 67%)" fill="hsl(239, 84%, 67%)" fillOpacity={0.4} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-64 flex items-center justify-center text-muted-foreground">No category data yet</div>
                  )}
                </Card>
              </div>

              {/* Second Row */}
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Difficulty */}
                <Card className="glass-card p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-warning" />By Difficulty
                  </h3>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.difficultyBreakdown} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis dataKey="difficulty" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} width={60} />
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }} />
                        <Bar dataKey="count" fill="hsl(239, 84%, 67%)" radius={[0, 4, 4, 0]} name="Quizzes" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                {/* Weekly Activity */}
                <Card className="glass-card p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-success" />Weekly Activity
                  </h3>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.weeklyActivity}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }} />
                        <Bar dataKey="quizzes" fill="hsl(160, 84%, 39%)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                {/* Completion Donut */}
                <Card className="glass-card p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" />Completion Rate
                  </h3>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={[
                            { name: 'Completed', value: analytics.completedQuizzes },
                            { name: 'In Progress', value: analytics.inProgressQuizzes },
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={70}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          <Cell fill="hsl(160, 84%, 39%)" />
                          <Cell fill="hsl(38, 92%, 50%)" />
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }} />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center gap-4 text-xs">
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full" style={{ background: 'hsl(160, 84%, 39%)' }} />Completed</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full" style={{ background: 'hsl(38, 92%, 50%)' }} />In Progress</span>
                  </div>
                </Card>
              </div>

              {/* Insights */}
              <div className="grid lg:grid-cols-3 gap-6">
                <Card className="glass-card p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Brain className="w-5 h-5 text-primary" />Insights
                  </h3>
                  <div className="space-y-4">
                    {analytics.strengths.length > 0 && (
                      <div>
                        <p className="text-sm text-success font-medium mb-2 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4" />Strengths
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {analytics.strengths.map(s => (
                            <span key={s} className="px-3 py-1 bg-success/20 text-success text-sm rounded-full">{s}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {analytics.weaknesses.length > 0 && (
                      <div>
                        <p className="text-sm text-destructive font-medium mb-2 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" />Needs Work
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {analytics.weaknesses.map(w => (
                            <span key={w} className="px-3 py-1 bg-destructive/20 text-destructive text-sm rounded-full">{w}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="pt-2 border-t border-border space-y-1 text-sm text-muted-foreground">
                      <p>🏆 Strongest: <span className="text-foreground font-medium">{analytics.strongestCategory}</span></p>
                      <p>📉 Weakest: <span className="text-foreground font-medium">{analytics.weakestCategory}</span></p>
                      <p>🔥 Most played: <span className="text-foreground font-medium">{analytics.mostPlayedCategory}</span></p>
                    </div>
                  </div>
                </Card>

                {/* Suggestions - spans 2 cols */}
                <Card className="glass-card p-6 lg:col-span-2">
                  <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-warning" />Smart Insights
                  </h3>
                  <div className="grid md:grid-cols-2 gap-3">
                    {analytics.suggestions.map((suggestion, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="flex items-start gap-3 p-3 bg-background/50 rounded-lg border border-border"
                      >
                        <div className="w-7 h-7 rounded-full bg-warning/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-warning font-bold text-xs">{idx + 1}</span>
                        </div>
                        <p className="text-sm text-foreground">{suggestion}</p>
                      </motion.div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}

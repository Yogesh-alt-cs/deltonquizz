import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { 
  Trophy, Star, Flame, Zap, Target, Award, Medal, Rocket, Users, Crown,
  Play, Clock, TrendingUp, BookOpen, Loader2
} from "lucide-react";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement_type: string;
  requirement_value: number;
  xp_reward: number;
  earned_at?: string;
}

interface RecentQuiz {
  id: string;
  quiz_id: string;
  score: number;
  max_streak: number;
  completed_at: string;
  quiz_title?: string;
}

interface UserStats {
  total_score: number;
  total_quizzes_played: number;
  highest_streak: number;
  rank: number;
}

const iconMap: Record<string, any> = {
  trophy: Trophy,
  star: Star,
  crown: Crown,
  flame: Flame,
  zap: Zap,
  rocket: Rocket,
  target: Target,
  medal: Medal,
  award: Award,
  users: Users,
};

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [earnedAchievements, setEarnedAchievements] = useState<string[]>([]);
  const [recentQuizzes, setRecentQuizzes] = useState<RecentQuiz[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchDashboardData();
  }, [user, navigate]);

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      // Fetch user profile stats
      const { data: profile } = await supabase
        .from('profiles')
        .select('total_score, total_quizzes_played, highest_streak')
        .eq('id', user.id)
        .single();

      // Fetch user rank from leaderboard
      const { data: leaderboard } = await supabase
        .from('leaderboard')
        .select('id, rank')
        .eq('id', user.id)
        .single();

      setStats({
        total_score: profile?.total_score || 0,
        total_quizzes_played: profile?.total_quizzes_played || 0,
        highest_streak: profile?.highest_streak || 0,
        rank: leaderboard?.rank || 0,
      });

      // Fetch all achievements
      const { data: allAchievements } = await supabase
        .from('achievements')
        .select('*')
        .order('requirement_value');

      // Fetch earned achievements
      const { data: userAchievements } = await supabase
        .from('user_achievements')
        .select('achievement_id, earned_at')
        .eq('user_id', user.id);

      const earnedIds = userAchievements?.map(ua => ua.achievement_id) || [];
      setEarnedAchievements(earnedIds);

      if (allAchievements) {
        const achievementsWithStatus = allAchievements.map(ach => ({
          ...ach,
          earned_at: userAchievements?.find(ua => ua.achievement_id === ach.id)?.earned_at,
        }));
        setAchievements(achievementsWithStatus);
      }

      // Fetch recent quiz sessions
      const { data: sessions } = await supabase
        .from('quiz_sessions')
        .select('id, quiz_id, score, max_streak, completed_at')
        .eq('user_id', user.id)
        .eq('completed', true)
        .order('completed_at', { ascending: false })
        .limit(10);

      if (sessions && sessions.length > 0) {
        const quizIds = [...new Set(sessions.map(s => s.quiz_id))];
        const { data: quizzes } = await supabase
          .from('quizzes')
          .select('id, title')
          .in('id', quizIds);

        const sessionsWithTitles = sessions.map(session => ({
          ...session,
          quiz_title: quizzes?.find(q => q.id === session.quiz_id)?.title || 'Unknown Quiz',
        }));
        setRecentQuizzes(sessionsWithTitles);
      }

      // Check and award new achievements
      await checkAndAwardAchievements(profile, earnedIds);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkAndAwardAchievements = async (profile: any, earnedIds: string[]) => {
    if (!user || !profile) return;

    const { data: allAchievements } = await supabase.from('achievements').select('*');
    if (!allAchievements) return;

    const newAchievements: string[] = [];

    for (const ach of allAchievements) {
      if (earnedIds.includes(ach.id)) continue;

      let earned = false;
      switch (ach.requirement_type) {
        case 'quizzes_played':
          earned = profile.total_quizzes_played >= ach.requirement_value;
          break;
        case 'streak':
          earned = profile.highest_streak >= ach.requirement_value;
          break;
        case 'single_score':
          // Would need to check individual quiz scores
          break;
      }

      if (earned) {
        await supabase.from('user_achievements').insert({
          user_id: user.id,
          achievement_id: ach.id,
        });
        newAchievements.push(ach.id);
      }
    }

    if (newAchievements.length > 0) {
      setEarnedAchievements(prev => [...prev, ...newAchievements]);
    }
  };

  const getProgress = (achievement: Achievement): number => {
    if (!stats) return 0;
    switch (achievement.requirement_type) {
      case 'quizzes_played':
        return Math.min(100, (stats.total_quizzes_played / achievement.requirement_value) * 100);
      case 'streak':
        return Math.min(100, (stats.highest_streak / achievement.requirement_value) * 100);
      default:
        return 0;
    }
  };

  if (!user) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold font-display mb-2">
            Your <span className="text-gradient">Dashboard</span>
          </h1>
          <p className="text-muted-foreground">Track your progress and achievements</p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Score', value: stats?.total_score?.toLocaleString() || 0, icon: Trophy, color: 'text-warning' },
            { label: 'Quizzes Played', value: stats?.total_quizzes_played || 0, icon: BookOpen, color: 'text-primary' },
            { label: 'Best Streak', value: stats?.highest_streak || 0, icon: Flame, color: 'text-destructive' },
            { label: 'Global Rank', value: stats?.rank ? `#${stats.rank}` : '-', icon: TrendingUp, color: 'text-success' },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass-card p-6 text-center"
            >
              <stat.icon className={`w-8 h-8 mx-auto mb-2 ${stat.color}`} />
              <div className="text-2xl font-bold font-gaming">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Button variant="gaming" size="lg" className="w-full" onClick={() => navigate('/categories')}>
            <Play className="w-5 h-5 mr-2" />Solo Quiz
          </Button>
          <Button variant="outline" size="lg" className="w-full" onClick={() => navigate('/multiplayer?create=true')}>
            <Users className="w-5 h-5 mr-2" />Host Game
          </Button>
          <Button variant="outline" size="lg" className="w-full" onClick={() => navigate('/tournament')}>
            <Trophy className="w-5 h-5 mr-2" />Tournaments
          </Button>
          <Button variant="outline" size="lg" className="w-full" onClick={() => navigate('/study')}>
            <BookOpen className="w-5 h-5 mr-2" />Study Mode
          </Button>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Achievements */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Award className="w-6 h-6 text-warning" />
              Achievements
            </h2>
            <div className="glass-card p-4 space-y-4 max-h-[500px] overflow-y-auto">
              {achievements.map((achievement) => {
                const Icon = iconMap[achievement.icon] || Trophy;
                const isEarned = earnedAchievements.includes(achievement.id);
                const progress = getProgress(achievement);

                return (
                  <motion.div
                    key={achievement.id}
                    className={`p-4 rounded-lg border ${
                      isEarned 
                        ? 'bg-success/10 border-success/50' 
                        : 'bg-background/50 border-border/50'
                    }`}
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        isEarned ? 'bg-success/20' : 'bg-muted'
                      }`}>
                        <Icon className={`w-6 h-6 ${isEarned ? 'text-success' : 'text-muted-foreground'}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{achievement.name}</span>
                          {isEarned && <Star className="w-4 h-4 text-warning fill-warning" />}
                        </div>
                        <p className="text-sm text-muted-foreground">{achievement.description}</p>
                        {!isEarned && (
                          <div className="mt-2">
                            <div className="progress-bar h-1.5">
                              <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
                            </div>
                            <span className="text-xs text-muted-foreground">{Math.round(progress)}% complete</span>
                          </div>
                        )}
                        <div className="text-xs text-primary mt-1">+{achievement.xp_reward} XP</div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Recent Quizzes */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Clock className="w-6 h-6 text-primary" />
              Recent Quizzes
            </h2>
            <div className="glass-card p-4 space-y-3 max-h-[500px] overflow-y-auto">
              {recentQuizzes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No quizzes played yet</p>
                  <Button variant="link" onClick={() => navigate('/categories')}>
                    Start your first quiz
                  </Button>
                </div>
              ) : (
                recentQuizzes.map((quiz, index) => (
                  <motion.div
                    key={quiz.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-4 p-4 rounded-lg bg-background/50 hover:bg-background/80 transition-colors cursor-pointer"
                    onClick={() => navigate(`/quiz/${quiz.quiz_id}`)}
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{quiz.quiz_title}</p>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Trophy className="w-3 h-3" />{quiz.score}
                        </span>
                        <span className="flex items-center gap-1">
                          <Flame className="w-3 h-3" />{quiz.max_streak} streak
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(quiz.completed_at).toLocaleDateString()}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;

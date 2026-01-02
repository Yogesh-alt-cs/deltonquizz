import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Leaderboard } from "@/components/quiz/Leaderboard";
import { FloatingParticles } from "@/components/effects/Particles";
import { Trophy, Calendar, TrendingUp, Users, Filter, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface LeaderboardEntry {
  rank: number;
  username: string;
  score: number;
  badge?: string;
  avatar?: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

type TimePeriod = "all-time" | "weekly" | "daily";
type FilterType = "global" | "category" | "friends";

const LeaderboardPage = () => {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("all-time");
  const [filterType, setFilterType] = useState<FilterType>("global");
  const [categoryId, setCategoryId] = useState<string>("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [userStats, setUserStats] = useState<{ rank: number; score: number; quizzes: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [timePeriod, filterType, categoryId, user]);

  const fetchCategories = async () => {
    const { data } = await supabase.from("categories").select("*");
    if (data) setCategories(data);
  };

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("profiles")
        .select("id, username, avatar_url, total_score, total_quizzes_played, highest_streak")
        .order("total_score", { ascending: false })
        .limit(50);

      // Time period filter - for now we use total_score for all periods
      // In a real app, you'd have separate weekly/daily score tables
      
      const { data: profiles } = await query;

      if (profiles) {
        const entries: LeaderboardEntry[] = profiles.map((p, idx) => ({
          rank: idx + 1,
          username: p.username || "Anonymous",
          score: p.total_score || 0,
          avatar: p.avatar_url || undefined,
          badge: idx === 0 ? "Champion" : idx < 3 ? "Top 3" : undefined,
        }));

        setLeaderboardData(entries);

        // Find user's rank
        if (user) {
          const userIndex = profiles.findIndex(p => p.id === user.id);
          if (userIndex !== -1) {
            setUserStats({
              rank: userIndex + 1,
              score: profiles[userIndex].total_score || 0,
              quizzes: profiles[userIndex].total_quizzes_played || 0,
            });
          } else {
            // User not in top 50, fetch their data separately
            const { data: userData } = await supabase
              .from("profiles")
              .select("total_score, total_quizzes_played")
              .eq("id", user.id)
              .single();
            
            if (userData) {
              // Count how many users have higher scores to get rank
              const { count } = await supabase
                .from("profiles")
                .select("*", { count: "exact", head: true })
                .gt("total_score", userData.total_score || 0);
              
              setUserStats({
                rank: (count || 0) + 1,
                score: userData.total_score || 0,
                quizzes: userData.total_quizzes_played || 0,
              });
            }
          }
        }
      }
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    let title = "";
    switch (timePeriod) {
      case "daily": title = "Today's "; break;
      case "weekly": title = "This Week's "; break;
      default: title = "All-Time ";
    }
    
    if (filterType === "category" && categoryId) {
      const cat = categories.find(c => c.id === categoryId);
      title += cat ? `${cat.name} ` : "";
    } else if (filterType === "friends") {
      title += "Friends ";
    }
    
    return title + "Rankings";
  };

  return (
    <div className="min-h-screen">
      <FloatingParticles />
      <Navbar />
      
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-warning/20 mb-6">
              <Trophy className="w-10 h-10 text-warning" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="text-gradient">Leaderboard</span>
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Compete with players worldwide and climb the rankings!
            </p>
          </motion.div>

          {/* Filters Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-4 mb-6"
          >
            <div className="flex flex-wrap items-center gap-4">
              {/* Time Period */}
              <div className="flex gap-1 p-1 bg-background/50 rounded-lg">
                {[
                  { id: "all-time" as TimePeriod, label: "All Time", icon: TrendingUp },
                  { id: "weekly" as TimePeriod, label: "Weekly", icon: Calendar },
                  { id: "daily" as TimePeriod, label: "Daily", icon: Calendar },
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setTimePeriod(id)}
                    className={`px-4 py-2 rounded-md font-medium transition-all flex items-center gap-2 text-sm ${
                      timePeriod === id
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{label}</span>
                  </button>
                ))}
              </div>

              {/* Filter Type */}
              <div className="flex gap-1 p-1 bg-background/50 rounded-lg">
                {[
                  { id: "global" as FilterType, label: "Global", icon: TrendingUp },
                  { id: "category" as FilterType, label: "Category", icon: Filter },
                  { id: "friends" as FilterType, label: "Friends", icon: Users },
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setFilterType(id)}
                    className={`px-4 py-2 rounded-md font-medium transition-all flex items-center gap-2 text-sm ${
                      filterType === id
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{label}</span>
                  </button>
                ))}
              </div>

              {/* Category Selector */}
              {filterType === "category" && (
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </motion.div>

          {/* Leaderboard */}
          <motion.div
            key={`${timePeriod}-${filterType}-${categoryId}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 md:p-8"
          >
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : leaderboardData.length === 0 ? (
              <div className="text-center py-12">
                <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No rankings yet. Be the first to compete!</p>
              </div>
            ) : (
              <Leaderboard 
                entries={leaderboardData}
                title={getTitle()}
              />
            )}
          </motion.div>

          {/* Your Stats Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-6 mt-8"
          >
            <h3 className="text-lg font-semibold mb-4">Your Progress</h3>
            {user && userStats ? (
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <span className="text-muted-foreground text-sm">Your Rank</span>
                  <p className="font-gaming text-2xl text-primary">#{userStats.rank}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-sm">Total Score</span>
                  <p className="font-gaming text-2xl text-foreground">{userStats.score.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-sm">Quizzes Taken</span>
                  <p className="font-gaming text-2xl text-foreground">{userStats.quizzes}</p>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <span className="text-muted-foreground text-sm">Your Rank</span>
                    <p className="font-gaming text-2xl text-primary">#--</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-sm">Total Score</span>
                    <p className="font-gaming text-2xl text-foreground">0</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-sm">Quizzes Taken</span>
                    <p className="font-gaming text-2xl text-foreground">0</p>
                  </div>
                </div>
                <p className="text-center text-muted-foreground mt-4 text-sm">
                  Sign in to track your progress and compete on the leaderboard!
                </p>
              </>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default LeaderboardPage;

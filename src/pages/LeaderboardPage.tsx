import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Leaderboard } from "@/components/quiz/Leaderboard";
import { FloatingParticles } from "@/components/effects/Particles";
import { Trophy, Calendar, TrendingUp } from "lucide-react";
import { useState } from "react";

const leaderboardData = [
  { rank: 1, username: "QuizMaster99", score: 127500, badge: "Champion" },
  { rank: 2, username: "BrainStorm", score: 115200, badge: "Pro" },
  { rank: 3, username: "TriviaKing", score: 108800 },
  { rank: 4, username: "NerdAlert", score: 98500 },
  { rank: 5, username: "SmartCookie", score: 94200 },
  { rank: 6, username: "QuizWhiz", score: 89100 },
  { rank: 7, username: "MindBender", score: 85400 },
  { rank: 8, username: "KnowledgeNinja", score: 82300 },
  { rank: 9, username: "BrainiacPro", score: 79600 },
  { rank: 10, username: "TriviaGuru", score: 76800 },
];

const weeklyData = [
  { rank: 1, username: "WeeklyChamp", score: 24500, badge: "Rising Star" },
  { rank: 2, username: "QuizMaster99", score: 22100 },
  { rank: 3, username: "NewPlayer123", score: 19800 },
  { rank: 4, username: "SpeedRunner", score: 18200 },
  { rank: 5, username: "AccuracyKing", score: 17500 },
];

const LeaderboardPage = () => {
  const [activeTab, setActiveTab] = useState<"all-time" | "weekly">("all-time");

  return (
    <div className="min-h-screen">
      <FloatingParticles />
      <Navbar />
      
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-warning/20 mb-6">
              <Trophy className="w-10 h-10 text-warning" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="text-gradient">Leaderboard</span>
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Compete with players worldwide and climb the rankings to become the ultimate quiz champion!
            </p>
          </motion.div>

          {/* Tab Selector */}
          <div className="flex justify-center mb-8">
            <div className="glass-card p-1.5 inline-flex gap-1">
              <button
                onClick={() => setActiveTab("all-time")}
                className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
                  activeTab === "all-time"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                All Time
              </button>
              <button
                onClick={() => setActiveTab("weekly")}
                className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
                  activeTab === "weekly"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Calendar className="w-4 h-4" />
                This Week
              </button>
            </div>
          </div>

          {/* Leaderboard */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 md:p-8"
          >
            <Leaderboard 
              entries={activeTab === "all-time" ? leaderboardData : weeklyData}
              title={activeTab === "all-time" ? "All-Time Rankings" : "Weekly Rankings"}
            />
          </motion.div>

          {/* Your Stats Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-6 mt-8"
          >
            <h3 className="text-lg font-semibold mb-4">Your Progress</h3>
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
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default LeaderboardPage;

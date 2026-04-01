import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Flame, Clock, Sparkles, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const DAILY_TOPICS = [
  "General Knowledge", "Science", "History", "Geography", "Technology",
  "Biology", "Mathematics", "Programming", "Sports", "Movies & TV",
  "Music", "Anime & Manga", "Literature", "Physics", "Chemistry",
  "World Capitals", "Space & Astronomy", "Art & Culture", "Food & Cuisine",
  "Famous Inventions", "Ancient Civilizations", "Modern History", "Animals",
  "Human Body", "Environmental Science", "Computer Science", "Economics",
  "Philosophy", "Mythology", "Languages",
];

function getDailyTopic(): { topic: string; seed: number } {
  const now = new Date();
  const seed = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
  const index = seed % DAILY_TOPICS.length;
  return { topic: DAILY_TOPICS[index], seed };
}

function getTimeUntilReset(): number {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow.getTime() - now.getTime();
}

function formatCountdown(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const h = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
  const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
  const s = String(totalSeconds % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

export const DailyChallenge = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [countdown, setCountdown] = useState(getTimeUntilReset());
  const { topic, seed } = getDailyTopic();

  const storageKey = user ? `daily_challenge_${user.id}` : "daily_challenge_guest";
  const completedSeed = localStorage.getItem(storageKey);
  const isCompleted = completedSeed === String(seed);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(getTimeUntilReset());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleStart = () => {
    // Mark intent; actual completion marking happens in QuizPage
    localStorage.setItem(`daily_challenge_active`, String(seed));
    navigate(`/quiz/daily?topic=${encodeURIComponent(topic)}&difficulty=medium&questionCount=10&daily=true`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6 relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
      
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
          <Flame className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-bold text-foreground">Daily Challenge</h3>
          <p className="text-xs text-muted-foreground">{topic}</p>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-4 text-sm">
        <span className="flex items-center gap-1 text-primary">
          <Sparkles className="w-4 h-4" /> +75 XP
        </span>
        <span className="flex items-center gap-1 text-muted-foreground">
          <Clock className="w-4 h-4" /> {formatCountdown(countdown)}
        </span>
      </div>

      {isCompleted ? (
        <div className="flex items-center gap-2 text-success">
          <CheckCircle2 className="w-5 h-5" />
          <span className="font-medium text-sm">Completed! Come back tomorrow.</span>
        </div>
      ) : (
        <Button variant="gaming" size="sm" className="w-full" onClick={handleStart}>
          Start Challenge
        </Button>
      )}
    </motion.div>
  );
};

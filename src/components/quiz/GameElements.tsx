import { motion } from "framer-motion";
import { Heart, Zap, Trophy, Star } from "lucide-react";

interface LivesDisplayProps {
  lives: number;
  maxLives: number;
}

export const LivesDisplay = ({ lives, maxLives }: LivesDisplayProps) => {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: maxLives }).map((_, index) => (
        <motion.div
          key={index}
          initial={{ scale: 0 }}
          animate={{ 
            scale: index < lives ? 1 : 0.8,
            opacity: index < lives ? 1 : 0.3
          }}
          transition={{ delay: index * 0.1, type: "spring", stiffness: 500 }}
        >
          <Heart
            className={`w-8 h-8 ${
              index < lives 
                ? "text-destructive fill-destructive lives-heart" 
                : "text-muted-foreground"
            }`}
          />
        </motion.div>
      ))}
    </div>
  );
};

interface ScoreDisplayProps {
  score: number;
  combo?: number;
}

export const ScoreDisplay = ({ score, combo = 0 }: ScoreDisplayProps) => {
  return (
    <div className="flex flex-col items-end">
      <motion.div 
        className="score-display text-3xl font-bold text-primary"
        key={score}
        initial={{ scale: 1.2 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 400 }}
      >
        {score.toLocaleString()}
      </motion.div>
      {combo > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-1 text-warning text-sm font-gaming"
        >
          <Zap className="w-4 h-4" />
          {combo}x COMBO
        </motion.div>
      )}
    </div>
  );
};

interface TimerDisplayProps {
  timeLeft: number;
  totalTime: number;
}

export const TimerDisplay = ({ timeLeft, totalTime }: TimerDisplayProps) => {
  const percentage = (timeLeft / totalTime) * 100;
  const isLow = percentage < 25;

  return (
    <div className="flex flex-col items-center gap-2 min-w-[80px]">
      <motion.span 
        className={`font-gaming text-2xl ${isLow ? "text-destructive" : "text-foreground"}`}
        animate={isLow ? { scale: [1, 1.1, 1] } : {}}
        transition={{ repeat: Infinity, duration: 0.5 }}
      >
        {timeLeft}s
      </motion.span>
      <div className="w-full progress-bar h-2">
        <motion.div
          className={`progress-bar-fill ${isLow ? "!bg-destructive" : ""}`}
          style={{ width: `${percentage}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </div>
  );
};

interface StreakBadgeProps {
  streak: number;
}

export const StreakBadge = ({ streak }: StreakBadgeProps) => {
  if (streak < 2) return null;

  return (
    <motion.div
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      className="flex items-center gap-2 px-4 py-2 rounded-full bg-warning/20 border border-warning/50"
    >
      <Star className="w-5 h-5 text-warning fill-warning" />
      <span className="font-gaming text-warning">{streak} STREAK</span>
    </motion.div>
  );
};

interface RankBadgeProps {
  rank: number;
  size?: "sm" | "md" | "lg";
}

export const RankBadge = ({ rank, size = "md" }: RankBadgeProps) => {
  const sizeClasses = {
    sm: "w-8 h-8 text-sm",
    md: "w-10 h-10 text-base",
    lg: "w-14 h-14 text-xl"
  };

  const getRankClass = () => {
    if (rank === 1) return "rank-1";
    if (rank === 2) return "rank-2";
    if (rank === 3) return "rank-3";
    return "bg-muted text-muted-foreground";
  };

  return (
    <div className={`rank-badge ${getRankClass()} ${sizeClasses[size]}`}>
      {rank <= 3 ? (
        <Trophy className={`${size === "lg" ? "w-6 h-6" : "w-4 h-4"}`} />
      ) : (
        <span>#{rank}</span>
      )}
    </div>
  );
};

import { motion } from "framer-motion";
import { RankBadge } from "./GameElements";
import { Trophy, Medal, Award } from "lucide-react";

interface LeaderboardEntry {
  rank: number;
  username: string;
  score: number;
  avatar?: string;
  badge?: string;
}

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  title?: string;
  showTopThree?: boolean;
}

export const Leaderboard = ({ 
  entries, 
  title = "Leaderboard",
  showTopThree = true 
}: LeaderboardProps) => {
  const topThree = entries.slice(0, 3);
  const rest = showTopThree ? entries.slice(3) : entries;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
        <Trophy className="w-6 h-6 text-warning" />
        {title}
      </h2>

      {showTopThree && topThree.length > 0 && (
        <div className="flex items-end justify-center gap-4 py-8">
          {topThree[1] && (
            <TopThreeCard entry={topThree[1]} position={2} />
          )}
          {topThree[0] && (
            <TopThreeCard entry={topThree[0]} position={1} />
          )}
          {topThree[2] && (
            <TopThreeCard entry={topThree[2]} position={3} />
          )}
        </div>
      )}

      <div className="space-y-3">
        {rest.map((entry, index) => (
          <motion.div
            key={entry.rank}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="leaderboard-row"
          >
            <RankBadge rank={entry.rank} size="sm" />
            
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center overflow-hidden">
              {entry.avatar ? (
                <img src={entry.avatar} alt={entry.username} className="w-full h-full object-cover" />
              ) : (
                <span className="font-bold text-primary">{entry.username[0]}</span>
              )}
            </div>
            
            <div className="flex-1">
              <span className="font-semibold text-foreground">{entry.username}</span>
              {entry.badge && (
                <span className="ml-2 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                  {entry.badge}
                </span>
              )}
            </div>
            
            <span className="font-gaming text-primary text-lg">
              {entry.score.toLocaleString()}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const TopThreeCard = ({ 
  entry, 
  position 
}: { 
  entry: LeaderboardEntry; 
  position: 1 | 2 | 3 
}) => {
  const heights = { 1: "h-40", 2: "h-32", 3: "h-28" };
  const scales = { 1: "scale-110", 2: "scale-100", 3: "scale-100" };
  const icons = { 1: Trophy, 2: Medal, 3: Award };
  const Icon = icons[position];
  const colors = { 
    1: "from-yellow-400 to-amber-600",
    2: "from-slate-300 to-slate-500",
    3: "from-orange-400 to-amber-700"
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: position === 1 ? 0.2 : position === 2 ? 0.1 : 0.3 }}
      className={`flex flex-col items-center ${scales[position]}`}
    >
      <div className="relative mb-4">
        <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${colors[position]} flex items-center justify-center shadow-lg`}>
          <Icon className="w-8 h-8 text-white" />
        </div>
        {position === 1 && (
          <motion.div
            className="absolute -top-2 -right-2 w-8 h-8 bg-warning rounded-full flex items-center justify-center animate-pulse-glow"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5 }}
          >
            <span className="text-xs font-bold">👑</span>
          </motion.div>
        )}
      </div>
      
      <span className="font-semibold text-foreground text-center mb-1">{entry.username}</span>
      <span className="font-gaming text-primary">{entry.score.toLocaleString()}</span>
      
      <div className={`glass-card w-24 ${heights[position]} mt-4 flex items-end justify-center pb-4 bg-gradient-to-t from-primary/20 to-transparent`}>
        <span className="font-gaming text-2xl text-primary">{position}</span>
      </div>
    </motion.div>
  );
};

import { motion } from 'framer-motion';
import { Zap, TrendingUp } from 'lucide-react';

interface XPProgressProps {
  currentXP: number;
  level: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

// Calculate XP needed for each level
function getXPForLevel(level: number): number {
  // Level 1: 0 XP, Level 2: 100 XP, Level 3: 300 XP, Level 4: 600 XP, etc.
  return ((level - 1) * level * 100) / 2;
}

function getXPProgress(currentXP: number, level: number): { current: number; needed: number; percent: number } {
  const currentLevelXP = getXPForLevel(level);
  const nextLevelXP = getXPForLevel(level + 1);
  const xpIntoCurrentLevel = currentXP - currentLevelXP;
  const xpNeededForNextLevel = nextLevelXP - currentLevelXP;
  
  return {
    current: xpIntoCurrentLevel,
    needed: xpNeededForNextLevel,
    percent: Math.min(100, (xpIntoCurrentLevel / xpNeededForNextLevel) * 100),
  };
}

export function XPProgress({ currentXP, level, showLabel = true, size = 'md' }: XPProgressProps) {
  const progress = getXPProgress(currentXP, level);
  
  const sizeClasses = {
    sm: { bar: 'h-1.5', text: 'text-xs', icon: 'w-3 h-3' },
    md: { bar: 'h-2', text: 'text-sm', icon: 'w-4 h-4' },
    lg: { bar: 'h-3', text: 'text-base', icon: 'w-5 h-5' },
  };
  
  const classes = sizeClasses[size];

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1.5">
            <Zap className={`${classes.icon} text-primary`} />
            <span className={`${classes.text} font-medium text-foreground`}>Level {level}</span>
          </div>
          <span className={`${classes.text} text-muted-foreground`}>
            {progress.current} / {progress.needed} XP
          </span>
        </div>
      )}
      <div className={`w-full bg-muted rounded-full ${classes.bar} overflow-hidden`}>
        <motion.div
          className={`bg-gradient-to-r from-primary to-primary/70 ${classes.bar} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${progress.percent}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

export function LevelBadge({ level, size = 'md' }: { level: number; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-12 h-12 text-lg',
    lg: 'w-16 h-16 text-2xl',
  };

  return (
    <motion.div
      className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center font-bold text-primary-foreground shadow-lg`}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
    >
      {level}
    </motion.div>
  );
}

export function XPGain({ amount, reason }: { amount: number; reason?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex items-center gap-2 bg-primary/20 text-primary px-3 py-2 rounded-lg"
    >
      <TrendingUp className="w-4 h-4" />
      <span className="font-bold">+{amount} XP</span>
      {reason && <span className="text-sm opacity-80">({reason})</span>}
    </motion.div>
  );
}

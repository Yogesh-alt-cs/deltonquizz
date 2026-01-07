import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Lock } from 'lucide-react';

interface Badge {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  category: string;
  requirement_type: string;
  requirement_value: number;
  xp_reward: number;
  earned?: boolean;
  earned_at?: string;
}

interface BadgeDisplayProps {
  badges: Badge[];
  size?: 'sm' | 'md' | 'lg';
  showLocked?: boolean;
}

const categoryColors: Record<string, string> = {
  achievement: 'from-purple-500 to-purple-600',
  streak: 'from-orange-500 to-red-500',
  mastery: 'from-blue-500 to-cyan-500',
  social: 'from-pink-500 to-rose-500',
  challenge: 'from-yellow-500 to-amber-500',
};

export function BadgeDisplay({ badges, size = 'md', showLocked = false }: BadgeDisplayProps) {
  const sizeClasses = {
    sm: { container: 'w-12 h-12', icon: 'text-xl', text: 'text-xs' },
    md: { container: 'w-16 h-16', icon: 'text-3xl', text: 'text-sm' },
    lg: { container: 'w-20 h-20', icon: 'text-4xl', text: 'text-base' },
  };

  const classes = sizeClasses[size];
  const displayBadges = showLocked ? badges : badges.filter(b => b.earned);

  return (
    <div className="flex flex-wrap gap-3">
      {displayBadges.map((badge, idx) => (
        <motion.div
          key={badge.id}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: idx * 0.05 }}
          className="relative group"
        >
          <div
            className={`${classes.container} rounded-xl flex items-center justify-center 
              ${badge.earned 
                ? `bg-gradient-to-br ${categoryColors[badge.category] || 'from-gray-500 to-gray-600'} shadow-lg` 
                : 'bg-muted/50 border border-border'
              } transition-transform hover:scale-110`}
          >
            {badge.earned ? (
              <span className={classes.icon}>{badge.icon}</span>
            ) : (
              <Lock className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
          
          {/* Tooltip */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
            <Card className="p-2 bg-popover text-popover-foreground shadow-lg min-w-[150px]">
              <p className={`font-semibold ${classes.text}`}>{badge.name}</p>
              {badge.description && (
                <p className="text-xs text-muted-foreground mt-1">{badge.description}</p>
              )}
              {!badge.earned && (
                <p className="text-xs text-primary mt-1">+{badge.xp_reward} XP</p>
              )}
            </Card>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export function BadgeCard({ badge, earned }: { badge: Badge; earned: boolean }) {
  return (
    <Card className={`p-4 ${earned ? 'glass-card' : 'bg-muted/30 border-dashed'}`}>
      <div className="flex items-center gap-4">
        <div
          className={`w-14 h-14 rounded-xl flex items-center justify-center
            ${earned 
              ? `bg-gradient-to-br ${categoryColors[badge.category] || 'from-gray-500 to-gray-600'} shadow-lg` 
              : 'bg-muted border border-border'
            }`}
        >
          {earned ? (
            <span className="text-3xl">{badge.icon}</span>
          ) : (
            <Lock className="w-6 h-6 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1">
          <h4 className={`font-semibold ${earned ? 'text-foreground' : 'text-muted-foreground'}`}>
            {badge.name}
          </h4>
          <p className="text-sm text-muted-foreground">{badge.description}</p>
          {!earned && (
            <p className="text-xs text-primary mt-1">Reward: +{badge.xp_reward} XP</p>
          )}
        </div>
        {earned && (
          <div className="text-xs text-muted-foreground">
            ✓ Earned
          </div>
        )}
      </div>
    </Card>
  );
}

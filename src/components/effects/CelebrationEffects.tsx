import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState, useCallback } from 'react';
import { Award, Zap, Star, Trophy, Sparkles } from 'lucide-react';

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  rotation: number;
  delay: number;
}

interface CelebrationProps {
  type: 'levelUp' | 'badge' | null;
  level?: number;
  badgeName?: string;
  badgeIcon?: string;
  onComplete?: () => void;
}

const CONFETTI_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--success))',
  'hsl(var(--warning))',
  '#ec4899',
  '#06b6d4',
  '#f97316',
  '#8b5cf6',
];

function generateConfetti(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: -10 - Math.random() * 20,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    size: 8 + Math.random() * 8,
    rotation: Math.random() * 360,
    delay: Math.random() * 0.5,
  }));
}

function Confetti({ particles }: { particles: Particle[] }) {
  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute"
          style={{
            left: `${particle.x}%`,
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
          }}
          initial={{ 
            y: particle.y, 
            rotate: particle.rotation,
            opacity: 1,
          }}
          animate={{ 
            y: '120vh',
            rotate: particle.rotation + 720,
            opacity: [1, 1, 0],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            delay: particle.delay,
            ease: 'easeIn',
          }}
        />
      ))}
    </div>
  );
}

function StarBurst() {
  const stars = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    angle: (i * 30) * (Math.PI / 180),
  }));

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {stars.map((star) => (
        <motion.div
          key={star.id}
          className="absolute"
          initial={{ scale: 0, opacity: 1 }}
          animate={{ 
            scale: 1,
            opacity: 0,
            x: Math.cos(star.angle) * 150,
            y: Math.sin(star.angle) * 150,
          }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <Star className="w-6 h-6 text-warning fill-warning" />
        </motion.div>
      ))}
    </div>
  );
}

export function LevelUpCelebration({ level, onComplete }: { level: number; onComplete?: () => void }) {
  const [confetti] = useState(() => generateConfetti(60));
  const [showContent, setShowContent] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowContent(false);
      onComplete?.();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {showContent && (
        <>
          <Confetti particles={confetti} />
          <motion.div
            className="fixed inset-0 z-[99] flex items-center justify-center bg-background/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="relative flex flex-col items-center"
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            >
              <StarBurst />
              
              {/* Glowing ring */}
              <motion.div
                className="absolute w-48 h-48 rounded-full border-4 border-primary/50"
                animate={{ 
                  scale: [1, 1.3, 1],
                  opacity: [0.5, 0, 0.5],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              
              {/* Level badge */}
              <motion.div
                className="w-32 h-32 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-2xl relative z-10"
                animate={{ 
                  boxShadow: [
                    '0 0 20px hsl(var(--primary) / 0.5)',
                    '0 0 60px hsl(var(--primary) / 0.8)',
                    '0 0 20px hsl(var(--primary) / 0.5)',
                  ],
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <span className="text-5xl font-gaming font-bold text-primary-foreground">
                  {level}
                </span>
              </motion.div>
              
              <motion.div
                className="mt-6 text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="flex items-center gap-2 text-primary mb-2">
                  <Zap className="w-6 h-6" />
                  <span className="text-2xl font-gaming uppercase tracking-wider">Level Up!</span>
                  <Zap className="w-6 h-6" />
                </div>
                <p className="text-muted-foreground">
                  You've reached <span className="text-foreground font-bold">Level {level}</span>
                </p>
              </motion.div>
              
              {/* Sparkles around */}
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute"
                  style={{
                    top: `${20 + Math.random() * 60}%`,
                    left: `${10 + Math.random() * 80}%`,
                  }}
                  animate={{
                    scale: [0, 1, 0],
                    opacity: [0, 1, 0],
                    rotate: [0, 180],
                  }}
                  transition={{
                    duration: 1.5,
                    delay: i * 0.2,
                    repeat: Infinity,
                  }}
                >
                  <Sparkles className="w-5 h-5 text-warning" />
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function BadgeUnlockCelebration({ 
  badgeName, 
  badgeIcon, 
  onComplete 
}: { 
  badgeName: string; 
  badgeIcon: string; 
  onComplete?: () => void;
}) {
  const [confetti] = useState(() => generateConfetti(40));
  const [showContent, setShowContent] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowContent(false);
      onComplete?.();
    }, 3500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {showContent && (
        <>
          <Confetti particles={confetti} />
          <motion.div
            className="fixed inset-0 z-[99] flex items-center justify-center bg-background/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="relative flex flex-col items-center"
              initial={{ scale: 0, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            >
              {/* Badge container */}
              <motion.div
                className="relative"
                animate={{ rotate: [0, -5, 5, 0] }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                {/* Glow effect */}
                <motion.div
                  className="absolute inset-0 rounded-2xl bg-gradient-to-br from-success/50 to-primary/50 blur-xl"
                  animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 0.8, 0.5],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                
                {/* Badge card */}
                <div className="relative w-48 h-56 rounded-2xl bg-gradient-to-br from-card to-muted border border-border/50 shadow-2xl flex flex-col items-center justify-center p-4">
                  <motion.div
                    className="text-6xl mb-3"
                    animate={{ 
                      scale: [1, 1.2, 1],
                    }}
                    transition={{ duration: 0.5, delay: 0.8 }}
                  >
                    {badgeIcon}
                  </motion.div>
                  <Award className="w-8 h-8 text-success mb-2" />
                  <span className="text-lg font-bold text-foreground text-center">
                    {badgeName}
                  </span>
                </div>
              </motion.div>
              
              <motion.div
                className="mt-6 text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <div className="flex items-center gap-2 text-success mb-2">
                  <Trophy className="w-5 h-5" />
                  <span className="text-xl font-gaming uppercase tracking-wider">Badge Unlocked!</span>
                  <Trophy className="w-5 h-5" />
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function CelebrationEffects({ type, level, badgeName, badgeIcon, onComplete }: CelebrationProps) {
  if (type === 'levelUp' && level) {
    return <LevelUpCelebration level={level} onComplete={onComplete} />;
  }
  
  if (type === 'badge' && badgeName && badgeIcon) {
    return <BadgeUnlockCelebration badgeName={badgeName} badgeIcon={badgeIcon} onComplete={onComplete} />;
  }
  
  return null;
}
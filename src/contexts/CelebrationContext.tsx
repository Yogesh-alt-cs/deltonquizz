import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { CelebrationEffects } from '@/components/effects/CelebrationEffects';
import { setCelebrationCallbacks } from '@/hooks/useGamification';

interface Celebration {
  id: string;
  type: 'levelUp' | 'badge';
  level?: number;
  badgeName?: string;
  badgeIcon?: string;
}

interface CelebrationContextType {
  triggerLevelUp: (level: number) => void;
  triggerBadgeUnlock: (badgeName: string, badgeIcon: string) => void;
}

const CelebrationContext = createContext<CelebrationContextType | null>(null);

export function CelebrationProvider({ children }: { children: ReactNode }) {
  const [celebrations, setCelebrations] = useState<Celebration[]>([]);

  const triggerLevelUp = useCallback((level: number) => {
    const id = `levelup-${Date.now()}`;
    setCelebrations(prev => [...prev, { id, type: 'levelUp', level }]);
  }, []);

  const triggerBadgeUnlock = useCallback((badgeName: string, badgeIcon: string) => {
    const id = `badge-${Date.now()}`;
    setCelebrations(prev => [...prev, { id, type: 'badge', badgeName, badgeIcon }]);
  }, []);

  const removeCelebration = useCallback((id: string) => {
    setCelebrations(prev => prev.filter(c => c.id !== id));
  }, []);

  // Connect to gamification hook callbacks
  useEffect(() => {
    setCelebrationCallbacks({
      onLevelUp: triggerLevelUp,
      onBadgeUnlock: triggerBadgeUnlock,
    });

    return () => {
      setCelebrationCallbacks({});
    };
  }, [triggerLevelUp, triggerBadgeUnlock]);

  const currentCelebration = celebrations[0];

  return (
    <CelebrationContext.Provider value={{ triggerLevelUp, triggerBadgeUnlock }}>
      {children}
      {currentCelebration && (
        <CelebrationEffects
          type={currentCelebration.type}
          level={currentCelebration.level}
          badgeName={currentCelebration.badgeName}
          badgeIcon={currentCelebration.badgeIcon}
          onComplete={() => removeCelebration(currentCelebration.id)}
        />
      )}
    </CelebrationContext.Provider>
  );
}

export function useCelebration() {
  const context = useContext(CelebrationContext);
  if (!context) {
    throw new Error('useCelebration must be used within a CelebrationProvider');
  }
  return context;
}
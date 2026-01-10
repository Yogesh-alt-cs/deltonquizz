import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

interface Badge {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  category: string;
  requirement_type: string;
  requirement_value: number;
  xp_reward: number;
}

interface UserBadge extends Badge {
  earned: boolean;
  earned_at?: string;
}

interface GamificationState {
  xp: number;
  level: number;
  dailyStreak: number;
  badges: UserBadge[];
  loading: boolean;
}

interface CelebrationCallbacks {
  onLevelUp?: (level: number) => void;
  onBadgeUnlock?: (badgeName: string, badgeIcon: string) => void;
}

let celebrationCallbacks: CelebrationCallbacks = {};

export function setCelebrationCallbacks(callbacks: CelebrationCallbacks) {
  celebrationCallbacks = callbacks;
}

export function useGamification() {
  const [state, setState] = useState<GamificationState>({
    xp: 0,
    level: 1,
    dailyStreak: 0,
    badges: [],
    loading: true,
  });
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchGamificationData = useCallback(async () => {
    if (!user) return;

    try {
      // Fetch user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('xp, level, daily_streak')
        .eq('id', user.id)
        .single();

      // Fetch all badges
      const { data: allBadges } = await supabase
        .from('badges')
        .select('*')
        .order('requirement_value');

      // Fetch user's earned badges
      const { data: userBadges } = await supabase
        .from('user_badges')
        .select('badge_id, earned_at')
        .eq('user_id', user.id);

      const earnedBadgeIds = new Set(userBadges?.map(ub => ub.badge_id) || []);
      const earnedDates = Object.fromEntries(
        (userBadges || []).map(ub => [ub.badge_id, ub.earned_at])
      );

      const badgesWithStatus: UserBadge[] = (allBadges || []).map(badge => ({
        ...badge,
        earned: earnedBadgeIds.has(badge.id),
        earned_at: earnedDates[badge.id],
      }));

      setState({
        xp: profile?.xp || 0,
        level: profile?.level || 1,
        dailyStreak: profile?.daily_streak || 0,
        badges: badgesWithStatus,
        loading: false,
      });
    } catch (error) {
      console.error('Error fetching gamification data:', error);
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [user]);

  useEffect(() => {
    fetchGamificationData();
  }, [fetchGamificationData]);

  const awardXP = useCallback(async (amount: number, reason?: string) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase.rpc('award_xp', {
        p_user_id: user.id,
        p_xp_amount: amount,
        p_reason: reason || 'quiz_completion',
      });

      if (error) throw error;

      const result = data?.[0];
      if (result) {
        setState(prev => ({
          ...prev,
          xp: result.new_xp,
          level: result.new_level,
        }));

        if (result.leveled_up) {
          // Trigger celebration effect
          celebrationCallbacks.onLevelUp?.(result.new_level);
          
          toast({
            title: '🎉 Level Up!',
            description: `Congratulations! You've reached level ${result.new_level}!`,
          });
        }

        return result;
      }
    } catch (error) {
      console.error('Error awarding XP:', error);
    }
    return null;
  }, [user, toast]);

  const updateStreak = useCallback(async () => {
    if (!user) return 0;

    try {
      const { data, error } = await supabase.rpc('update_daily_streak', {
        p_user_id: user.id,
      });

      if (error) throw error;

      const newStreak = data as number;
      setState(prev => ({ ...prev, dailyStreak: newStreak }));

      // Award XP for streak milestones
      if (newStreak === 7) {
        awardXP(200, '7-day streak');
        toast({ title: '🔥 7-Day Streak!', description: '+200 XP bonus!' });
      } else if (newStreak === 30) {
        awardXP(500, '30-day streak');
        toast({ title: '⚡ 30-Day Streak!', description: '+500 XP bonus!' });
      }

      return newStreak;
    } catch (error) {
      console.error('Error updating streak:', error);
      return 0;
    }
  }, [user, awardXP, toast]);

  const checkAndAwardBadges = useCallback(async (stats: {
    quizzesCompleted?: number;
    accuracy?: number;
    streakDays?: number;
    challengesWon?: number;
    friendsAdded?: number;
    speedSeconds?: number;
  }) => {
    if (!user) return [];

    const newBadges: Badge[] = [];

    try {
      // Get unearned badges
      const unearnedBadges = state.badges.filter(b => !b.earned);

      for (const badge of unearnedBadges) {
        let earned = false;

        switch (badge.requirement_type) {
          case 'quizzes_completed':
            earned = (stats.quizzesCompleted || 0) >= badge.requirement_value;
            break;
          case 'accuracy':
            earned = (stats.accuracy || 0) >= badge.requirement_value;
            break;
          case 'streak_days':
            earned = (stats.streakDays || state.dailyStreak) >= badge.requirement_value;
            break;
          case 'challenges_won':
            earned = (stats.challengesWon || 0) >= badge.requirement_value;
            break;
          case 'friends_added':
            earned = (stats.friendsAdded || 0) >= badge.requirement_value;
            break;
          case 'speed':
            earned = (stats.speedSeconds || Infinity) <= badge.requirement_value;
            break;
          case 'xp_earned':
            earned = state.xp >= badge.requirement_value;
            break;
          case 'level_reached':
            earned = state.level >= badge.requirement_value;
            break;
        }

        if (earned) {
          // Award the badge
          const { error } = await supabase
            .from('user_badges')
            .insert({ user_id: user.id, badge_id: badge.id });

          if (!error) {
            newBadges.push(badge);
            await awardXP(badge.xp_reward, `Badge: ${badge.name}`);
            
            // Trigger celebration effect
            celebrationCallbacks.onBadgeUnlock?.(badge.name, badge.icon);
            
            toast({
              title: `${badge.icon} Badge Unlocked!`,
              description: `${badge.name}: ${badge.description}`,
            });
          }
        }
      }

      if (newBadges.length > 0) {
        fetchGamificationData();
      }

      return newBadges;
    } catch (error) {
      console.error('Error checking badges:', error);
      return [];
    }
  }, [user, state.badges, state.dailyStreak, state.xp, state.level, awardXP, toast, fetchGamificationData]);

  const recordQuizCompletion = useCallback(async (
    score: number,
    totalQuestions: number,
    timeSeconds: number
  ) => {
    if (!user) return;

    const accuracy = totalQuestions > 0 ? Math.round((score / (totalQuestions * 10)) * 100) : 0;
    
    // Calculate XP based on performance
    let xpToAward = 50; // Base XP for completion
    if (accuracy >= 80) xpToAward += 30;
    if (accuracy === 100) xpToAward += 50;
    if (timeSeconds < 60) xpToAward += 20;

    await awardXP(xpToAward, 'quiz_completion');
    await updateStreak();

    // Fetch updated stats and check badges
    const { data: profile } = await supabase
      .from('profiles')
      .select('total_quizzes_played, multiplayer_wins')
      .eq('id', user.id)
      .single();

    const { count: friendCount } = await supabase
      .from('friends')
      .select('*', { count: 'exact', head: true })
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
      .eq('status', 'accepted');

    await checkAndAwardBadges({
      quizzesCompleted: profile?.total_quizzes_played || 0,
      accuracy,
      challengesWon: profile?.multiplayer_wins || 0,
      friendsAdded: friendCount || 0,
      speedSeconds: timeSeconds,
    });

    return xpToAward;
  }, [user, awardXP, updateStreak, checkAndAwardBadges]);

  return {
    ...state,
    awardXP,
    updateStreak,
    checkAndAwardBadges,
    recordQuizCompletion,
    refetch: fetchGamificationData,
  };
}
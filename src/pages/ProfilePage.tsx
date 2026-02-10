import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/layout/Navbar';
import { User, Trophy, Zap, Target, LogOut, Save, ArrowLeft, Camera, Palette, Loader2, Award, Flame } from 'lucide-react';
import { XPProgress, LevelBadge } from '@/components/gamification/XPProgress';
import { BadgeDisplay } from '@/components/gamification/BadgeDisplay';

interface Profile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  total_score: number;
  total_quizzes_played: number;
  highest_streak: number;
  theme_color: string | null;
  bio: string | null;
  multiplayer_wins: number;
  multiplayer_games: number;
  tournaments_won: number;
  tournaments_played: number;
  xp: number;
  level: number;
  daily_streak: number;
}

interface Badge {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  category: string;
  requirement_type: string;
  requirement_value: number;
  xp_reward: number | null;
  earned?: boolean;
  earned_at?: string;
}

const THEME_COLORS = [
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Cyan', value: '#06b6d4' },
];

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [themeColor, setThemeColor] = useState('#8b5cf6');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchProfile();
    fetchBadgesAndCheck();
  }, [user, navigate]);

  const fetchProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile:', error);
    } else if (data) {
      setProfile(data as Profile);
      setUsername(data.username || '');
      setBio(data.bio || '');
      setThemeColor(data.theme_color || '#8b5cf6');
    }
    setLoading(false);
  };

  const fetchBadgesAndCheck = async () => {
    if (!user) return;

    // Fetch profile stats for badge checking
    const { data: profileData } = await supabase
      .from('profiles')
      .select('total_quizzes_played, multiplayer_wins, xp, level, daily_streak')
      .eq('id', user.id)
      .single();

    // Fetch friend count
    const { count: friendCount } = await supabase
      .from('friends')
      .select('*', { count: 'exact', head: true })
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
      .eq('status', 'accepted');

    // Fetch all badges
    const { data: allBadges, error: badgesError } = await supabase
      .from('badges')
      .select('*');

    if (badgesError) {
      console.error('Error fetching badges:', badgesError);
      return;
    }

    // Fetch user's earned badges
    const { data: userBadges, error: userBadgesError } = await supabase
      .from('user_badges')
      .select('badge_id, earned_at')
      .eq('user_id', user.id);

    if (userBadgesError) {
      console.error('Error fetching user badges:', userBadgesError);
      return;
    }

    const earnedBadgeIds = new Set(userBadges?.map(ub => ub.badge_id) || []);
    const earnedBadgesMap = new Map(userBadges?.map(ub => [ub.badge_id, ub.earned_at]) || []);

    // Check & auto-award unearned badges
    const stats = {
      quizzesCompleted: profileData?.total_quizzes_played || 0,
      challengesWon: profileData?.multiplayer_wins || 0,
      xp: profileData?.xp || 0,
      level: profileData?.level || 1,
      streak: profileData?.daily_streak || 0,
      friendsAdded: friendCount || 0,
    };

    for (const badge of (allBadges || [])) {
      if (earnedBadgeIds.has(badge.id)) continue;

      let earned = false;
      switch (badge.requirement_type) {
        case 'quizzes_completed':
          earned = stats.quizzesCompleted >= badge.requirement_value;
          break;
        case 'xp_earned':
          earned = stats.xp >= badge.requirement_value;
          break;
        case 'level_reached':
          earned = stats.level >= badge.requirement_value;
          break;
        case 'streak_days':
          earned = stats.streak >= badge.requirement_value;
          break;
        case 'challenges_won':
          earned = stats.challengesWon >= badge.requirement_value;
          break;
        case 'friends_added':
          earned = stats.friendsAdded >= badge.requirement_value;
          break;
      }

      if (earned) {
        const { error } = await supabase
          .from('user_badges')
          .insert({ user_id: user.id, badge_id: badge.id });
        if (!error) {
          earnedBadgeIds.add(badge.id);
          earnedBadgesMap.set(badge.id, new Date().toISOString());
          // Award XP for the badge
          if (badge.xp_reward) {
            await supabase.rpc('award_xp', {
              p_user_id: user.id,
              p_xp_amount: badge.xp_reward,
              p_reason: `Badge: ${badge.name}`,
            });
          }
          toast({
            title: `${badge.icon} Badge Unlocked!`,
            description: `${badge.name}: ${badge.description}`,
          });
        }
      }
    }

    const mergedBadges = (allBadges || []).map(badge => ({
      ...badge,
      earned: earnedBadgeIds.has(badge.id),
      earned_at: earnedBadgesMap.get(badge.id) || undefined,
    }));

    setBadges(mergedBadges);

    // Refresh profile if badges were awarded (XP may have changed)
    if (earnedBadgeIds.size > (userBadges?.length || 0)) {
      fetchProfile();
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Error', description: 'Please upload an image file', variant: 'destructive' });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'Error', description: 'Image must be less than 2MB', variant: 'destructive' });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      toast({ title: 'Success', description: 'Avatar uploaded successfully' });
      fetchProfile();
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({ title: 'Error', description: 'Failed to upload avatar', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ username, bio, theme_color: themeColor })
      .eq('id', user.id);

    if (error) {
      toast({ title: 'Error', description: 'Failed to update profile', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Profile updated successfully' });
      fetchProfile();
    }
    setSaving(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const earnedBadges = badges.filter(b => b.earned);
  const lockedBadges = badges.filter(b => !b.earned);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 pt-24">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto"
        >
          <h1 className="text-3xl font-bold font-display text-foreground mb-8">Profile</h1>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* XP & Level Card */}
              <Card className="glass-card p-6">
                <div className="flex items-center gap-6 mb-4">
                  <LevelBadge level={profile?.level || 1} size="lg" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-xl font-bold text-foreground">Level {profile?.level || 1}</h2>
                      <div className="flex items-center gap-1 text-sm text-warning">
                        <Flame className="w-4 h-4" />
                        <span>{profile?.daily_streak || 0} day streak</span>
                      </div>
                    </div>
                    <XPProgress 
                      currentXP={profile?.xp || 0} 
                      level={profile?.level || 1} 
                      size="lg"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border/50">
                  <div className="text-center">
                    <div className="text-2xl font-bold font-gaming text-primary">{profile?.xp || 0}</div>
                    <div className="text-xs text-muted-foreground">Total XP</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold font-gaming text-success">{earnedBadges.length}</div>
                    <div className="text-xs text-muted-foreground">Badges Earned</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold font-gaming text-warning">{profile?.highest_streak || 0}</div>
                    <div className="text-xs text-muted-foreground">Best Streak</div>
                  </div>
                </div>
              </Card>

              {/* Badge Collection */}
              <Card className="glass-card p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Award className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-bold text-foreground">Badge Collection</h3>
                  <span className="text-sm text-muted-foreground ml-auto">
                    {earnedBadges.length}/{badges.length} unlocked
                  </span>
                </div>
                
                {earnedBadges.length > 0 ? (
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground mb-3">Earned Badges</p>
                    <BadgeDisplay badges={earnedBadges} size="md" showLocked={false} />
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <Award className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No badges earned yet. Complete quizzes to unlock badges!</p>
                  </div>
                )}
                
                {lockedBadges.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <p className="text-sm text-muted-foreground mb-3">Locked Badges ({lockedBadges.length})</p>
                    <BadgeDisplay badges={lockedBadges} size="sm" showLocked={true} />
                  </div>
                )}
              </Card>

              {/* Avatar & Profile Info */}
              <Card className="glass-card p-6">
                <div className="flex items-start gap-6 mb-6">
                  <div className="relative">
                    <div 
                      className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden"
                      style={{ borderColor: themeColor, borderWidth: '3px' }}
                    >
                      {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-12 h-12 text-primary" />
                      )}
                    </div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleAvatarUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <Button
                      size="icon"
                      variant="secondary"
                      className="absolute -bottom-1 -right-1 rounded-full w-8 h-8"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                    >
                      {uploading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Camera className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-foreground">
                      {profile?.username || 'Set your username'}
                    </h2>
                    <p className="text-muted-foreground">{user.email}</p>
                    {profile?.bio && (
                      <p className="text-sm text-muted-foreground mt-2">{profile.bio}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">Username</label>
                    <Input
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter username"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">Bio</label>
                    <Input
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell us about yourself"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block flex items-center gap-2">
                      <Palette className="w-4 h-4" />
                      Theme Color
                    </label>
                    <div className="flex gap-2">
                      {THEME_COLORS.map((color) => (
                        <button
                          key={color.value}
                          onClick={() => setThemeColor(color.value)}
                          className={`w-8 h-8 rounded-full transition-transform ${
                            themeColor === color.value ? 'ring-2 ring-offset-2 ring-offset-background ring-foreground scale-110' : ''
                          }`}
                          style={{ backgroundColor: color.value }}
                          title={color.name}
                        />
                      ))}
                    </div>
                  </div>

                  <Button onClick={handleSaveProfile} disabled={saving}>
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </Card>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="glass-card p-4 text-center">
                  <Trophy className="w-8 h-8 text-primary mx-auto mb-2" />
                  <div className="text-2xl font-bold font-display text-foreground">
                    {profile?.total_score || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Score</div>
                </Card>

                <Card className="glass-card p-4 text-center">
                  <Target className="w-8 h-8 text-success mx-auto mb-2" />
                  <div className="text-2xl font-bold font-display text-foreground">
                    {profile?.total_quizzes_played || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Quizzes Played</div>
                </Card>

                <Card className="glass-card p-4 text-center">
                  <Zap className="w-8 h-8 text-warning mx-auto mb-2" />
                  <div className="text-2xl font-bold font-display text-foreground">
                    {profile?.highest_streak || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Best Streak</div>
                </Card>

                <Card className="glass-card p-4 text-center">
                  <Trophy className="w-8 h-8 text-primary mx-auto mb-2" />
                  <div className="text-2xl font-bold font-display text-foreground">
                    {profile?.multiplayer_wins || 0}/{profile?.multiplayer_games || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">MP Wins/Games</div>
                </Card>
              </div>

              {/* Sign Out */}
              <Button
                variant="outline"
                className="w-full"
                onClick={handleSignOut}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
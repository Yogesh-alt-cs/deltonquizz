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
import { User, Trophy, Zap, Target, LogOut, Save, ArrowLeft, Camera, Palette, Loader2 } from 'lucide-react';

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
      setProfile(data);
      setUsername(data.username || '');
      setBio(data.bio || '');
      setThemeColor(data.theme_color || '#8b5cf6');
    }
    setLoading(false);
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
          className="max-w-2xl mx-auto"
        >
          <h1 className="text-3xl font-bold font-display text-foreground mb-8">Profile</h1>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-6">
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

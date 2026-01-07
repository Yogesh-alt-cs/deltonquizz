import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/layout/Navbar';
import { 
  Users, UserPlus, Search, ArrowLeft, Trophy, Zap, Clock,
  Check, X, Swords, Send, Loader2, User
} from 'lucide-react';

interface Friend {
  id: string;
  friend_id: string;
  user_id: string;
  status: string;
  created_at: string;
  profile: {
    id: string;
    username: string | null;
    avatar_url: string | null;
    level: number;
    xp: number;
    total_score: number;
    total_quizzes_played: number;
  };
}

interface Challenge {
  id: string;
  challenger_id: string;
  challenged_id: string;
  quiz_id: string | null;
  status: string;
  challenger_score: number | null;
  challenged_score: number | null;
  created_at: string;
  challenger_profile?: { username: string | null; avatar_url: string | null };
  challenged_profile?: { username: string | null; avatar_url: string | null };
  quiz?: { title: string } | null;
}

interface SearchResult {
  id: string;
  username: string | null;
  avatar_url: string | null;
  level: number;
}

export default function FriendsPage() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Friend[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchFriends();
    fetchChallenges();

    // Subscribe to real-time updates
    const friendsChannel = supabase
      .channel('friends-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friends' }, () => {
        fetchFriends();
      })
      .subscribe();

    const challengesChannel = supabase
      .channel('challenges-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'challenges' }, () => {
        fetchChallenges();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(friendsChannel);
      supabase.removeChannel(challengesChannel);
    };
  }, [user, navigate]);

  const fetchFriends = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('friends')
      .select('*')
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

    if (error) {
      console.error('Error fetching friends:', error);
      return;
    }

    // Fetch profiles for each friend
    const friendsWithProfiles: Friend[] = [];
    const pendingWithProfiles: Friend[] = [];

    for (const f of data || []) {
      const otherUserId = f.user_id === user.id ? f.friend_id : f.user_id;
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, level, xp, total_score, total_quizzes_played')
        .eq('id', otherUserId)
        .single();

      if (profile) {
        const friendData = { ...f, profile };
        if (f.status === 'accepted') {
          friendsWithProfiles.push(friendData);
        } else if (f.status === 'pending' && f.friend_id === user.id) {
          pendingWithProfiles.push(friendData);
        }
      }
    }

    setFriends(friendsWithProfiles);
    setPendingRequests(pendingWithProfiles);
    setLoading(false);
  };

  const fetchChallenges = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('challenges')
      .select('*')
      .or(`challenger_id.eq.${user.id},challenged_id.eq.${user.id}`)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching challenges:', error);
      return;
    }

    // Enrich with profiles and quiz data
    const enrichedChallenges: Challenge[] = [];
    for (const c of data || []) {
      const { data: challengerProfile } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', c.challenger_id)
        .single();

      const { data: challengedProfile } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', c.challenged_id)
        .single();

      let quiz = null;
      if (c.quiz_id) {
        const { data: quizData } = await supabase
          .from('quizzes')
          .select('title')
          .eq('id', c.quiz_id)
          .single();
        quiz = quizData;
      }

      enrichedChallenges.push({
        ...c,
        challenger_profile: challengerProfile || undefined,
        challenged_profile: challengedProfile || undefined,
        quiz,
      });
    }

    setChallenges(enrichedChallenges);
  };

  const searchUsers = async () => {
    if (!searchQuery.trim() || !user) return;

    setSearching(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, level')
      .ilike('username', `%${searchQuery}%`)
      .neq('id', user.id)
      .limit(10);

    if (error) {
      toast({ title: 'Error', description: 'Failed to search users', variant: 'destructive' });
    } else {
      setSearchResults(data || []);
    }
    setSearching(false);
  };

  const sendFriendRequest = async (friendId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('friends')
      .insert({ user_id: user.id, friend_id: friendId, status: 'pending' });

    if (error) {
      if (error.code === '23505') {
        toast({ title: 'Already sent', description: 'Friend request already exists' });
      } else {
        toast({ title: 'Error', description: 'Failed to send request', variant: 'destructive' });
      }
    } else {
      toast({ title: 'Request sent!', description: 'Waiting for them to accept' });
      setSearchResults(prev => prev.filter(r => r.id !== friendId));
    }
  };

  const respondToRequest = async (requestId: string, accept: boolean) => {
    const { error } = await supabase
      .from('friends')
      .update({ status: accept ? 'accepted' : 'declined' })
      .eq('id', requestId);

    if (error) {
      toast({ title: 'Error', description: 'Failed to respond', variant: 'destructive' });
    } else {
      toast({ title: accept ? 'Friend added!' : 'Request declined' });
      fetchFriends();
    }
  };

  const sendChallenge = async (friendId: string) => {
    if (!user) return;

    // Get a random public quiz
    const { data: quizzes } = await supabase
      .from('quizzes')
      .select('id')
      .eq('is_public', true)
      .limit(10);

    const randomQuiz = quizzes?.[Math.floor(Math.random() * (quizzes?.length || 1))];

    const { error } = await supabase
      .from('challenges')
      .insert({
        challenger_id: user.id,
        challenged_id: friendId,
        quiz_id: randomQuiz?.id || null,
        status: 'pending',
      });

    if (error) {
      toast({ title: 'Error', description: 'Failed to send challenge', variant: 'destructive' });
    } else {
      toast({ title: 'Challenge sent!', description: 'Waiting for response' });
    }
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
          className="max-w-4xl mx-auto"
        >
          <h1 className="text-3xl font-bold font-display text-foreground mb-2 flex items-center gap-3">
            <Users className="w-8 h-8 text-primary" />
            Friends & Challenges
          </h1>
          <p className="text-muted-foreground mb-8">Connect with friends and compete!</p>

          <Tabs defaultValue="friends" className="space-y-6">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="friends">
                Friends ({friends.length})
              </TabsTrigger>
              <TabsTrigger value="requests">
                Requests ({pendingRequests.length})
              </TabsTrigger>
              <TabsTrigger value="challenges">
                Challenges ({challenges.filter(c => c.status === 'pending').length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="friends" className="space-y-6">
              {/* Search Users */}
              <Card className="glass-card p-4">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users by username..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && searchUsers()}
                      className="pl-10"
                    />
                  </div>
                  <Button onClick={searchUsers} disabled={searching}>
                    {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
                  </Button>
                </div>

                <AnimatePresence>
                  {searchResults.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 space-y-2"
                    >
                      {searchResults.map((result) => (
                        <div
                          key={result.id}
                          className="flex items-center justify-between p-3 bg-card/50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                              {result.avatar_url ? (
                                <img src={result.avatar_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <User className="w-5 h-5 text-primary" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{result.username || 'Anonymous'}</p>
                              <p className="text-xs text-muted-foreground">Level {result.level}</p>
                            </div>
                          </div>
                          <Button size="sm" onClick={() => sendFriendRequest(result.id)}>
                            <UserPlus className="w-4 h-4 mr-1" />
                            Add
                          </Button>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>

              {/* Friends List */}
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : friends.length === 0 ? (
                <Card className="glass-card p-8 text-center">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No friends yet. Search for users above!</p>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {friends.map((friend) => (
                    <Card key={friend.id} className="glass-card p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                            {friend.profile.avatar_url ? (
                              <img src={friend.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <User className="w-6 h-6 text-primary" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">{friend.profile.username || 'Anonymous'}</p>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Zap className="w-3 h-3" /> Level {friend.profile.level}
                              </span>
                              <span className="flex items-center gap-1">
                                <Trophy className="w-3 h-3" /> {friend.profile.total_score}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => sendChallenge(friend.profile.id)}
                        >
                          <Swords className="w-4 h-4 mr-1" />
                          Challenge
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="requests" className="space-y-4">
              {pendingRequests.length === 0 ? (
                <Card className="glass-card p-8 text-center">
                  <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No pending friend requests</p>
                </Card>
              ) : (
                pendingRequests.map((request) => (
                  <Card key={request.id} className="glass-card p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                          {request.profile.avatar_url ? (
                            <img src={request.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-6 h-6 text-primary" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{request.profile.username || 'Anonymous'}</p>
                          <p className="text-sm text-muted-foreground">wants to be your friend</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => respondToRequest(request.id, true)}>
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => respondToRequest(request.id, false)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="challenges" className="space-y-4">
              {challenges.length === 0 ? (
                <Card className="glass-card p-8 text-center">
                  <Swords className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No challenges yet</p>
                </Card>
              ) : (
                challenges.map((challenge) => {
                  const isChallenger = challenge.challenger_id === user.id;
                  const opponent = isChallenger ? challenge.challenged_profile : challenge.challenger_profile;
                  const myScore = isChallenger ? challenge.challenger_score : challenge.challenged_score;
                  const theirScore = isChallenger ? challenge.challenged_score : challenge.challenger_score;

                  return (
                    <Card key={challenge.id} className="glass-card p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                            <Swords className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">
                              {isChallenger ? 'You challenged' : 'Challenged by'} {opponent?.username || 'Anonymous'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {challenge.quiz?.title || 'Random Quiz'} • {challenge.status}
                            </p>
                            {challenge.status === 'completed' && (
                              <p className="text-sm font-medium text-primary">
                                {myScore} - {theirScore}
                              </p>
                            )}
                          </div>
                        </div>
                        {challenge.status === 'pending' && !isChallenger && (
                          <Button
                            size="sm"
                            onClick={() => {
                              if (challenge.quiz_id) {
                                navigate(`/quiz/${challenge.quiz_id}?challenge=${challenge.id}`);
                              }
                            }}
                          >
                            Accept
                          </Button>
                        )}
                      </div>
                    </Card>
                  );
                })
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>
    </div>
  );
}

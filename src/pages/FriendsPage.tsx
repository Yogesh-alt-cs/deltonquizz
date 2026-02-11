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
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
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

const challengeCategories = [
  'Engineering', 'Anime', 'Science', 'Programming', 'Mathematics',
  'General Knowledge', 'History', 'Geography', 'Sports', 'Movies & TV',
];

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

  // Challenge modal state
  const [challengeModalOpen, setChallengeModalOpen] = useState(false);
  const [challengeFriendId, setChallengeFriendId] = useState<string | null>(null);
  const [challengeCategory, setChallengeCategory] = useState('General Knowledge');
  const [challengeDifficulty, setChallengeDifficulty] = useState('medium');
  const [challengeMode, setChallengeMode] = useState('timed');
  const [challengeQuestionCount, setChallengeQuestionCount] = useState(15);
  const [sendingChallenge, setSendingChallenge] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchFriends();
    fetchChallenges();

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

  const openChallengeModal = (friendId: string) => {
    setChallengeFriendId(friendId);
    setChallengeCategory('General Knowledge');
    setChallengeDifficulty('medium');
    setChallengeMode('timed');
    setChallengeQuestionCount(15);
    setChallengeModalOpen(true);
  };

  const handleSendChallenge = async () => {
    if (!user || !challengeFriendId) return;

    setSendingChallenge(true);
    try {
      // Create a quiz with the selected config, then challenge
      const { data: quiz, error: quizError } = await supabase
        .from('quizzes')
        .insert({
          title: `${challengeCategory} Challenge (${challengeDifficulty})`,
          description: `Friend challenge: ${challengeCategory} - ${challengeDifficulty} - ${challengeMode} - ${challengeQuestionCount} questions`,
          difficulty: challengeDifficulty,
          creator_id: user.id,
          is_public: false,
        })
        .select()
        .single();

      if (quizError) throw quizError;

      const { error } = await supabase
        .from('challenges')
        .insert({
          challenger_id: user.id,
          challenged_id: challengeFriendId,
          quiz_id: quiz.id,
          status: 'pending',
        });

      if (error) throw error;

      toast({ title: 'Challenge sent!', description: `${challengeCategory} (${challengeDifficulty}) — waiting for response` });
      setChallengeModalOpen(false);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to send challenge', variant: 'destructive' });
    } finally {
      setSendingChallenge(false);
    }
  };

  const handleAcceptChallenge = async (challenge: Challenge) => {
    // Update status to accepted, then navigate to quiz
    await supabase.from('challenges').update({ status: 'accepted' }).eq('id', challenge.id);

    // Parse challenge config from quiz description if available
    const desc = challenge.quiz?.title || '';
    const categoryMatch = desc.match(/^(.+?) Challenge/);
    const category = categoryMatch ? categoryMatch[1] : 'General Knowledge';
    
    navigate(`/quiz/${category.toLowerCase().replace(/\s+/g, '-')}?difficulty=medium&challenge=${challenge.id}`);
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
                          onClick={() => openChallengeModal(friend.profile.id)}
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
                              {challenge.quiz?.title || 'Quiz Challenge'} • {challenge.status}
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
                            onClick={() => handleAcceptChallenge(challenge)}
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

      {/* Challenge Setup Modal */}
      <Dialog open={challengeModalOpen} onOpenChange={setChallengeModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Swords className="w-5 h-5 text-primary" />
              Challenge Setup
            </DialogTitle>
            <DialogDescription>
              Configure the quiz for your challenge
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-4">
            {/* Category */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Quiz Category</Label>
              <Select value={challengeCategory} onValueChange={setChallengeCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {challengeCategories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Difficulty */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Difficulty</Label>
              <RadioGroup value={challengeDifficulty} onValueChange={setChallengeDifficulty} className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="easy" id="ch-easy" />
                  <Label htmlFor="ch-easy" className="text-success font-medium">Easy</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="medium" id="ch-medium" />
                  <Label htmlFor="ch-medium" className="text-warning font-medium">Medium</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="hard" id="ch-hard" />
                  <Label htmlFor="ch-hard" className="text-destructive font-medium">Hard</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Mode */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Quiz Mode</Label>
              <RadioGroup value={challengeMode} onValueChange={setChallengeMode} className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="timed" id="ch-timed" />
                  <Label htmlFor="ch-timed">Timed</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="battle" id="ch-battle" />
                  <Label htmlFor="ch-battle">Battle</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="practice" id="ch-practice" />
                  <Label htmlFor="ch-practice">Practice</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Question Count */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Number of Questions: {challengeQuestionCount}</Label>
              <Slider
                value={[challengeQuestionCount]}
                onValueChange={(val) => setChallengeQuestionCount(val[0])}
                min={10}
                max={30}
                step={5}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>10</span>
                <span>30</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setChallengeModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSendChallenge} disabled={sendingChallenge} className="gap-2">
              {sendingChallenge ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Send Challenge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

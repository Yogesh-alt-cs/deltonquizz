import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Navbar } from "@/components/layout/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Trophy, Users, Crown, Swords, Calendar, Clock, Plus, 
  ArrowLeft, Loader2, Medal, ChevronRight, Zap
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Tournament {
  id: string;
  name: string;
  description: string | null;
  creator_id: string;
  category_id: string | null;
  difficulty: string;
  max_participants: number;
  current_round: number;
  status: string;
  bracket_type: string;
  questions_per_match: number;
  time_per_question: number;
  registration_ends_at: string | null;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
}

interface Participant {
  id: string;
  tournament_id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  seed: number | null;
  eliminated: boolean;
  total_score: number;
  matches_won: number;
  matches_played: number;
}

interface Match {
  id: string;
  tournament_id: string;
  round: number;
  match_number: number;
  player1_id: string | null;
  player2_id: string | null;
  winner_id: string | null;
  player1_score: number;
  player2_score: number;
  status: string;
  player1?: Participant;
  player2?: Participant;
}

interface Category {
  id: string;
  name: string;
}

const TournamentPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  
  // Create form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [maxParticipants, setMaxParticipants] = useState("16");

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchCategories();
    if (id) {
      fetchTournament(id);
    } else {
      fetchTournaments();
    }
  }, [user, id]);

  useEffect(() => {
    if (!selectedTournament) return;

    const channel = supabase
      .channel(`tournament-${selectedTournament.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'tournament_participants',
        filter: `tournament_id=eq.${selectedTournament.id}`
      }, () => fetchParticipants(selectedTournament.id))
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'tournament_matches',
        filter: `tournament_id=eq.${selectedTournament.id}`
      }, () => fetchMatches(selectedTournament.id))
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedTournament?.id]);

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('id, name');
    if (data) setCategories(data);
  };

  const fetchTournaments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('tournaments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tournaments:', error);
    } else {
      setTournaments(data || []);
    }
    setLoading(false);
  };

  const fetchTournament = async (tournamentId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('tournaments')
      .select('*')
      .eq('id', tournamentId)
      .single();

    if (error) {
      console.error('Error fetching tournament:', error);
      navigate('/tournament');
    } else {
      setSelectedTournament(data);
      await Promise.all([fetchParticipants(tournamentId), fetchMatches(tournamentId)]);
    }
    setLoading(false);
  };

  const fetchParticipants = async (tournamentId: string) => {
    const { data } = await supabase
      .from('tournament_participants')
      .select('*')
      .eq('tournament_id', tournamentId)
      .order('seed');
    if (data) setParticipants(data);
  };

  const fetchMatches = async (tournamentId: string) => {
    const { data } = await supabase
      .from('tournament_matches')
      .select('*')
      .eq('tournament_id', tournamentId)
      .order('round')
      .order('match_number');
    if (data) setMatches(data);
  };

  const handleCreateTournament = async () => {
    if (!name.trim()) {
      toast({ title: 'Error', description: 'Please enter a tournament name', variant: 'destructive' });
      return;
    }

    setCreating(true);
    try {
      const { data, error } = await supabase
        .from('tournaments')
        .insert({
          name,
          description: description || null,
          creator_id: user!.id,
          category_id: categoryId || null,
          difficulty,
          max_participants: parseInt(maxParticipants),
        })
        .select()
        .single();

      if (error) throw error;

      toast({ title: 'Tournament Created!', description: 'Players can now register' });
      navigate(`/tournament/${data.id}`);
    } catch (error: any) {
      console.error('Error creating tournament:', error);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  const handleJoinTournament = async () => {
    if (!selectedTournament || !user) return;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', user.id)
        .single();

      const { error } = await supabase
        .from('tournament_participants')
        .insert({
          tournament_id: selectedTournament.id,
          user_id: user.id,
          username: profile?.username || user.email?.split('@')[0] || 'Player',
          avatar_url: profile?.avatar_url,
          seed: participants.length + 1,
        });

      if (error) throw error;
      toast({ title: 'Joined!', description: 'You have registered for the tournament' });
      fetchParticipants(selectedTournament.id);
    } catch (error: any) {
      console.error('Error joining tournament:', error);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleStartTournament = async () => {
    if (!selectedTournament || participants.length < 2) {
      toast({ title: 'Error', description: 'Need at least 2 participants', variant: 'destructive' });
      return;
    }

    try {
      // Generate bracket
      const numParticipants = participants.length;
      const numRounds = Math.ceil(Math.log2(numParticipants));
      const bracketSize = Math.pow(2, numRounds);
      
      const matchesToCreate: any[] = [];
      let matchNumber = 0;

      // Create first round matches
      for (let i = 0; i < bracketSize / 2; i++) {
        matchNumber++;
        const player1 = participants[i * 2];
        const player2 = participants[i * 2 + 1];

        matchesToCreate.push({
          tournament_id: selectedTournament.id,
          round: 1,
          match_number: matchNumber,
          player1_id: player1?.id || null,
          player2_id: player2?.id || null,
          status: player1 && player2 ? 'pending' : player1 ? 'bye' : 'pending',
          winner_id: (player1 && !player2) ? player1.id : null,
        });
      }

      // Create placeholder matches for subsequent rounds
      for (let round = 2; round <= numRounds; round++) {
        const matchesInRound = bracketSize / Math.pow(2, round);
        for (let i = 0; i < matchesInRound; i++) {
          matchNumber++;
          matchesToCreate.push({
            tournament_id: selectedTournament.id,
            round,
            match_number: matchNumber,
            player1_id: null,
            player2_id: null,
            status: 'pending',
          });
        }
      }

      await supabase.from('tournament_matches').insert(matchesToCreate);
      await supabase
        .from('tournaments')
        .update({ status: 'in_progress', started_at: new Date().toISOString() })
        .eq('id', selectedTournament.id);

      toast({ title: 'Tournament Started!', description: 'Let the games begin!' });
      fetchTournament(selectedTournament.id);
    } catch (error: any) {
      console.error('Error starting tournament:', error);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const isParticipant = participants.some(p => p.user_id === user?.id);
  const isCreator = selectedTournament?.creator_id === user?.id;
  const groupedMatches = matches.reduce((acc, match) => {
    if (!acc[match.round]) acc[match.round] = [];
    acc[match.round].push(match);
    return acc;
  }, {} as Record<number, Match[]>);

  const getParticipant = (id: string | null) => participants.find(p => p.id === id);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
        </div>
      </div>
    );
  }

  // Tournament Detail View
  if (selectedTournament) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 pt-24 pb-12">
          <Button variant="ghost" onClick={() => navigate('/tournament')} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />Back to Tournaments
          </Button>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold font-display mb-2">{selectedTournament.name}</h1>
                <p className="text-muted-foreground">{selectedTournament.description}</p>
                <div className="flex items-center gap-4 mt-2 text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    selectedTournament.status === 'registration' ? 'bg-success/20 text-success' :
                    selectedTournament.status === 'in_progress' ? 'bg-warning/20 text-warning' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {selectedTournament.status.replace('_', ' ').toUpperCase()}
                  </span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Users className="w-4 h-4" />
                    {participants.length}/{selectedTournament.max_participants}
                  </span>
                  <span className="capitalize text-muted-foreground">{selectedTournament.difficulty}</span>
                </div>
              </div>

              {selectedTournament.status === 'registration' && (
                <div className="flex gap-2">
                  {!isParticipant && participants.length < selectedTournament.max_participants && (
                    <Button variant="gaming" onClick={handleJoinTournament}>
                      <Swords className="w-4 h-4 mr-2" />Join Tournament
                    </Button>
                  )}
                  {isCreator && participants.length >= 2 && (
                    <Button onClick={handleStartTournament}>
                      <Zap className="w-4 h-4 mr-2" />Start Tournament
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Bracket Display */}
            {matches.length > 0 && (
              <div className="glass-card p-6 mb-6 overflow-x-auto">
                <h2 className="text-xl font-bold mb-4">Tournament Bracket</h2>
                <div className="flex gap-8 min-w-max">
                  {Object.entries(groupedMatches).map(([round, roundMatches]) => (
                    <div key={round} className="space-y-4">
                      <h3 className="text-sm font-medium text-muted-foreground text-center">
                        {parseInt(round) === Object.keys(groupedMatches).length ? 'Final' : `Round ${round}`}
                      </h3>
                      <div className="space-y-4" style={{ marginTop: `${(Math.pow(2, parseInt(round) - 1) - 1) * 40}px` }}>
                        {roundMatches.map((match) => {
                          const p1 = getParticipant(match.player1_id);
                          const p2 = getParticipant(match.player2_id);
                          
                          return (
                            <div 
                              key={match.id}
                              className="w-48 border border-border rounded-lg overflow-hidden"
                              style={{ marginBottom: `${(Math.pow(2, parseInt(round)) - 1) * 40}px` }}
                            >
                              <div className={`flex items-center justify-between px-3 py-2 ${
                                match.winner_id === match.player1_id ? 'bg-success/20' : 'bg-background/50'
                              }`}>
                                <span className="text-sm truncate">{p1?.username || 'TBD'}</span>
                                <span className="font-bold">{match.player1_score}</span>
                              </div>
                              <div className="border-t border-border" />
                              <div className={`flex items-center justify-between px-3 py-2 ${
                                match.winner_id === match.player2_id ? 'bg-success/20' : 'bg-background/50'
                              }`}>
                                <span className="text-sm truncate">{p2?.username || 'TBD'}</span>
                                <span className="font-bold">{match.player2_score}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Participants */}
            <div className="glass-card p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5" />Participants
              </h2>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {participants.map((participant, index) => (
                  <motion.div
                    key={participant.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className={`flex items-center gap-3 p-3 rounded-lg ${
                      participant.eliminated ? 'bg-destructive/10 opacity-60' : 'bg-background/50'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                      {participant.avatar_url ? (
                        <img src={participant.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        participant.username.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate flex items-center gap-1">
                        {participant.username}
                        {participant.user_id === selectedTournament.creator_id && (
                          <Crown className="w-3 h-3 text-warning" />
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {participant.matches_won}W - {participant.matches_played - participant.matches_won}L
                      </p>
                    </div>
                    {participant.eliminated && (
                      <span className="text-xs text-destructive">Eliminated</span>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </main>
      </div>
    );
  }

  // Tournament List View
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold font-display">
                <span className="text-gradient">Tournaments</span>
              </h1>
              <p className="text-muted-foreground">Compete in bracket-style elimination rounds</p>
            </div>
            <Button variant="gaming" onClick={() => setShowCreate(!showCreate)}>
              <Plus className="w-4 h-4 mr-2" />Create Tournament
            </Button>
          </div>

          {/* Create Tournament Form */}
          <AnimatePresence>
            {showCreate && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="glass-card p-6 mb-8"
              >
                <h2 className="text-xl font-bold mb-4">Create New Tournament</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <Input
                    placeholder="Tournament Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                  <Input
                    placeholder="Description (optional)"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                  <Select value={categoryId} onValueChange={setCategoryId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={difficulty} onValueChange={setDifficulty}>
                    <SelectTrigger>
                      <SelectValue placeholder="Difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={maxParticipants} onValueChange={setMaxParticipants}>
                    <SelectTrigger>
                      <SelectValue placeholder="Max Participants" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="8">8 Players</SelectItem>
                      <SelectItem value="16">16 Players</SelectItem>
                      <SelectItem value="32">32 Players</SelectItem>
                      <SelectItem value="64">64 Players</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={handleCreateTournament} disabled={creating} className="md:col-span-2">
                    {creating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trophy className="w-4 h-4 mr-2" />}
                    {creating ? 'Creating...' : 'Create Tournament'}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tournament List */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tournaments.map((tournament, index) => (
              <motion.div
                key={tournament.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="glass-card p-6 cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => navigate(`/tournament/${tournament.id}`)}
              >
                <div className="flex items-start justify-between mb-3">
                  <Trophy className="w-8 h-8 text-warning" />
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    tournament.status === 'registration' ? 'bg-success/20 text-success' :
                    tournament.status === 'in_progress' ? 'bg-warning/20 text-warning' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {tournament.status.replace('_', ' ')}
                  </span>
                </div>
                <h3 className="font-bold text-lg mb-1">{tournament.name}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {tournament.description || 'No description'}
                </p>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Users className="w-4 h-4" />
                    {tournament.max_participants} max
                  </span>
                  <span className="capitalize text-primary">{tournament.difficulty}</span>
                </div>
              </motion.div>
            ))}

            {tournaments.length === 0 && (
              <div className="col-span-full text-center py-12">
                <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No Tournaments Yet</h3>
                <p className="text-muted-foreground mb-4">Be the first to create a tournament!</p>
                <Button variant="gaming" onClick={() => setShowCreate(true)}>
                  <Plus className="w-4 h-4 mr-2" />Create Tournament
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default TournamentPage;

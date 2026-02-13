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
  ArrowLeft, Loader2, Medal, ChevronRight, Zap, Trash2, Download, Play
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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
  const [deleting, setDeleting] = useState(false);
  
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
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'tournaments',
        filter: `id=eq.${selectedTournament.id}`
      }, () => fetchTournament(selectedTournament.id))
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
      .order('total_score', { ascending: false });
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
          status: 'registration',
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
      
      // Shuffle participants for fair seeding
      const shuffled = [...participants].sort(() => Math.random() - 0.5);
      
      const matchesToCreate: any[] = [];
      let matchNumber = 0;

      // Create first round matches
      for (let i = 0; i < bracketSize / 2; i++) {
        matchNumber++;
        const player1 = shuffled[i * 2];
        const player2 = shuffled[i * 2 + 1];

        const isBye = player1 && !player2;

        matchesToCreate.push({
          tournament_id: selectedTournament.id,
          round: 1,
          match_number: matchNumber,
          player1_id: player1?.id || null,
          player2_id: player2?.id || null,
          status: isBye ? 'completed' : 'waiting',
          winner_id: isBye ? player1.id : null,
          player1_score: 0,
          player2_score: 0,
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
            status: 'waiting',
          });
        }
      }

      const { error: matchError } = await supabase.from('tournament_matches').insert(matchesToCreate);
      if (matchError) throw matchError;

      const { error: updateError } = await supabase
        .from('tournaments')
        .update({ status: 'in_progress', started_at: new Date().toISOString(), current_round: 1 })
        .eq('id', selectedTournament.id);
      if (updateError) throw updateError;

      // Auto-advance byes to next round
      await advanceByeWinners(selectedTournament.id);

      toast({ title: 'Tournament Started!', description: 'Matches are ready — click "Play Match" when both players are ready.' });
      fetchTournament(selectedTournament.id);
    } catch (error: any) {
      console.error('Error starting tournament:', error);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const advanceByeWinners = async (tournamentId: string) => {
    const { data: allMatches } = await supabase
      .from('tournament_matches')
      .select('*')
      .eq('tournament_id', tournamentId)
      .order('round')
      .order('match_number');

    if (!allMatches) return;

    const matchesByRound: Record<number, typeof allMatches> = {};
    allMatches.forEach(m => {
      if (!matchesByRound[m.round]) matchesByRound[m.round] = [];
      matchesByRound[m.round].push(m);
    });

    // For round 1 byes, advance winners to round 2
    const round1 = matchesByRound[1] || [];
    const round2 = matchesByRound[2] || [];
    
    for (let i = 0; i < round1.length; i++) {
      const match = round1[i];
      if (match.status === 'completed' && match.winner_id) {
        const nextMatchIndex = Math.floor(i / 2);
        if (round2[nextMatchIndex]) {
          const nextMatch = round2[nextMatchIndex];
          const field = i % 2 === 0 ? 'player1_id' : 'player2_id';
          await supabase
            .from('tournament_matches')
            .update({ [field]: match.winner_id })
            .eq('id', nextMatch.id);
        }
      }
    }
  };

  // Start a real quiz match — navigates the current user to take the quiz for this match
  const handlePlayMatch = async (match: Match) => {
    if (!match.player1_id || !match.player2_id || !selectedTournament) return;

    // Check if user is a participant in this match
    const myParticipant = participants.find(p => p.user_id === user?.id);
    if (!myParticipant) {
      toast({ title: 'Not in match', description: 'You are not a participant in this match', variant: 'destructive' });
      return;
    }

    const isInMatch = match.player1_id === myParticipant.id || match.player2_id === myParticipant.id;
    if (!isInMatch) {
      toast({ title: 'Not your match', description: 'You are not assigned to this match', variant: 'destructive' });
      return;
    }

    // Mark match as in_progress so spectators see it
    if (match.status === 'waiting') {
      await supabase
        .from('tournament_matches')
        .update({ status: 'in_progress', started_at: new Date().toISOString() })
        .eq('id', match.id);
    }

    // Navigate to quiz with tournament context
    const category = categories.find(c => c.id === selectedTournament.category_id);
    const topicName = category?.name || 'General Knowledge';
    navigate(`/quiz/${topicName.toLowerCase().replace(/\s+/g, '-')}?difficulty=${selectedTournament.difficulty}&questionCount=${selectedTournament.questions_per_match || 10}&tournamentId=${selectedTournament.id}&matchId=${match.id}&participantId=${myParticipant.id}`);
  };

  // Called by creator to submit scores for a match (after both players finished their quiz)
  const handleSubmitMatchResult = async (match: Match, p1Score: number, p2Score: number) => {
    if (!selectedTournament) return;

    const winnerId = p1Score >= p2Score ? match.player1_id : match.player2_id;
    const loserId = winnerId === match.player1_id ? match.player2_id : match.player1_id;

    try {
      // Update match with real scores
      await supabase
        .from('tournament_matches')
        .update({
          player1_score: p1Score,
          player2_score: p2Score,
          winner_id: winnerId,
          status: 'completed',
          ended_at: new Date().toISOString(),
        })
        .eq('id', match.id);

      // Update winner stats
      const winnerP = participants.find(p => p.id === winnerId);
      if (winnerP) {
        await supabase
          .from('tournament_participants')
          .update({
            matches_won: (winnerP.matches_won || 0) + 1,
            matches_played: (winnerP.matches_played || 0) + 1,
            total_score: (winnerP.total_score || 0) + (winnerId === match.player1_id ? p1Score : p2Score),
          })
          .eq('id', winnerId);
      }

      // Update loser stats & eliminate
      const loserP = participants.find(p => p.id === loserId);
      if (loserP) {
        await supabase
          .from('tournament_participants')
          .update({
            matches_played: (loserP.matches_played || 0) + 1,
            total_score: (loserP.total_score || 0) + (loserId === match.player1_id ? p1Score : p2Score),
            eliminated: true,
            eliminated_in_round: match.round,
          })
          .eq('id', loserId);
      }

      // Advance winner to next round
      const { data: allMatches } = await supabase
        .from('tournament_matches')
        .select('*')
        .eq('tournament_id', selectedTournament.id)
        .order('round')
        .order('match_number');

      if (allMatches) {
        const currentRoundMatches = allMatches.filter(m => m.round === match.round);
        const nextRoundMatches = allMatches.filter(m => m.round === match.round + 1);
        
        if (nextRoundMatches.length > 0) {
          const matchIndexInRound = currentRoundMatches.findIndex(m => m.id === match.id);
          const nextMatchIndex = Math.floor(matchIndexInRound / 2);
          const nextMatch = nextRoundMatches[nextMatchIndex];
          
          if (nextMatch) {
            const field = matchIndexInRound % 2 === 0 ? 'player1_id' : 'player2_id';
            await supabase
              .from('tournament_matches')
              .update({ [field]: winnerId })
              .eq('id', nextMatch.id);
          }
        } else {
          // This was the final match — only now announce winner
          await supabase
            .from('tournaments')
            .update({ 
              status: 'completed', 
              ended_at: new Date().toISOString() 
            })
            .eq('id', selectedTournament.id);

          // Award XP to winner
          if (winnerP) {
            await supabase.rpc('award_xp', {
              p_user_id: winnerP.user_id,
              p_xp_amount: 500,
              p_reason: 'tournament_win',
            });
          }

          toast({ title: '🏆 Tournament Complete!', description: `${winnerP?.username || 'Winner'} wins the tournament!` });
        }

        // Check if all matches in current round are done to advance round counter
        const allDone = currentRoundMatches.every(m => m.id === match.id ? true : m.status === 'completed');
        if (allDone && nextRoundMatches.length > 0) {
          await supabase
            .from('tournaments')
            .update({ current_round: match.round + 1 })
            .eq('id', selectedTournament.id);
        }
      }

      toast({ title: 'Match Complete', description: `${winnerP?.username} wins this match!` });
      fetchTournament(selectedTournament.id);
    } catch (error: any) {
      console.error('Error completing match:', error);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleDeleteTournament = async () => {
    if (!selectedTournament || !user || selectedTournament.creator_id !== user.id) return;

    setDeleting(true);
    try {
      await supabase.from('tournament_matches').delete().eq('tournament_id', selectedTournament.id);
      await supabase.from('tournament_participants').delete().eq('tournament_id', selectedTournament.id);
      const { error } = await supabase.from('tournaments').delete().eq('id', selectedTournament.id);
      if (error) throw error;

      toast({ title: 'Deleted', description: 'Tournament has been removed' });
      navigate('/tournament');
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  };

  const handleDownloadResults = (format: 'csv' | 'json') => {
    if (!selectedTournament) return;

    const data = {
      tournament: selectedTournament.name,
      status: selectedTournament.status,
      difficulty: selectedTournament.difficulty,
      started_at: selectedTournament.started_at,
      ended_at: selectedTournament.ended_at,
      participants: participants.map(p => ({
        username: p.username,
        score: p.total_score,
        matches_won: p.matches_won,
        matches_played: p.matches_played,
        eliminated: p.eliminated,
      })),
      matches: matches.map(m => {
        const p1 = participants.find(p => p.id === m.player1_id);
        const p2 = participants.find(p => p.id === m.player2_id);
        const winner = participants.find(p => p.id === m.winner_id);
        return {
          round: m.round,
          match_number: m.match_number,
          player1: p1?.username || 'TBD',
          player1_score: m.player1_score,
          player2: p2?.username || 'TBD',
          player2_score: m.player2_score,
          winner: winner?.username || 'TBD',
          status: m.status,
        };
      }),
    };

    let blob: Blob;
    let filename: string;

    if (format === 'json') {
      blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      filename = `${selectedTournament.name.replace(/\s+/g, '_')}_results.json`;
    } else {
      const rows = [['Round', 'Match', 'Player 1', 'P1 Score', 'Player 2', 'P2 Score', 'Winner', 'Status']];
      data.matches.forEach(m => {
        rows.push([
          String(m.round), String(m.match_number), m.player1, String(m.player1_score),
          m.player2, String(m.player2_score), m.winner, m.status,
        ]);
      });
      const csvContent = rows.map(r => r.join(',')).join('\n');
      blob = new Blob([csvContent], { type: 'text/csv' });
      filename = `${selectedTournament.name.replace(/\s+/g, '_')}_results.csv`;
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const isParticipant = participants.some(p => p.user_id === user?.id);
  const isCreator = selectedTournament?.creator_id === user?.id;
  const groupedMatches = matches.reduce((acc, match) => {
    if (!acc[match.round]) acc[match.round] = [];
    acc[match.round].push(match);
    return acc;
  }, {} as Record<number, Match[]>);

  const getParticipant = (id: string | null) => participants.find(p => p.id === id);

  // Sorted leaderboard
  const sortedParticipants = [...participants].sort((a, b) => b.total_score - a.total_score || b.matches_won - a.matches_won);

  // Check if user is in a given match
  const myParticipant = participants.find(p => p.user_id === user?.id);
  const isUserInMatch = (match: Match) => {
    if (!myParticipant) return false;
    return match.player1_id === myParticipant.id || match.player2_id === myParticipant.id;
  };

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
                    selectedTournament.status === 'completed' ? 'bg-primary/20 text-primary' :
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

              <div className="flex gap-2 flex-wrap">
                {selectedTournament.status === 'registration' && (
                  <>
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
                  </>
                )}

                {/* Download results */}
                {matches.length > 0 && (
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" onClick={() => handleDownloadResults('csv')}>
                      <Download className="w-4 h-4 mr-1" />CSV
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDownloadResults('json')}>
                      <Download className="w-4 h-4 mr-1" />JSON
                    </Button>
                  </div>
                )}

                {/* Delete tournament (creator only) */}
                {isCreator && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Tournament</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete the tournament, all matches, and results. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDeleteTournament}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          disabled={deleting}
                        >
                          {deleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>

            {/* Tournament Leaderboard */}
            {(selectedTournament.status === 'in_progress' || selectedTournament.status === 'completed') && sortedParticipants.length > 0 && (
              <div className="glass-card p-6 mb-6">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-warning" />Tournament Leaderboard
                </h2>
                <div className="space-y-2">
                  {sortedParticipants.map((p, idx) => (
                    <div key={p.id} className={`flex items-center gap-3 p-3 rounded-lg ${
                      idx === 0 && selectedTournament.status === 'completed' ? 'bg-warning/10 border border-warning/30' : 'bg-background/50'
                    }`}>
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        idx === 0 ? 'bg-warning/20 text-warning' : idx === 1 ? 'bg-muted text-muted-foreground' : idx === 2 ? 'bg-orange-500/20 text-orange-500' : 'bg-background text-muted-foreground'
                      }`}>
                        {idx + 1}
                      </span>
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                        {p.avatar_url ? (
                          <img src={p.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          p.username.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="flex-1">
                        <span className="font-medium">{p.username}</span>
                        {p.eliminated && <span className="text-xs text-destructive ml-2">Eliminated R{(p as any).eliminated_in_round}</span>}
                      </div>
                      <div className="text-right text-sm">
                        <div className="font-bold text-primary">{p.total_score}</div>
                        <div className="text-xs text-muted-foreground">{p.matches_won}W / {p.matches_played}P</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
                          const matchReady = match.player1_id && match.player2_id && match.status !== 'completed';
                          const canUserPlay = matchReady && isUserInMatch(match);
                          
                          // Real-time status: check if match is in_progress or one player submitted a score
                          const p1Submitted = (match.player1_score || 0) > 0;
                          const p2Submitted = (match.player2_score || 0) > 0;
                          const isInProgress = (match.status === 'in_progress') || (matchReady && (p1Submitted || p2Submitted) && match.status !== 'completed');
                          const bothWaiting = matchReady && !isInProgress && match.status !== 'completed' && match.status !== 'in_progress';
                          
                          return (
                            <div 
                              key={match.id}
                              className={`w-56 border rounded-lg overflow-hidden ${
                                isInProgress ? 'border-warning/60 shadow-[0_0_8px_rgba(234,179,8,0.15)]' :
                                match.status === 'completed' ? 'border-success/40' : 'border-border'
                              }`}
                              style={{ marginBottom: `${(Math.pow(2, parseInt(round)) - 1) * 40}px` }}
                            >
                              {/* Player 1 row */}
                              <div className={`flex items-center justify-between px-3 py-2 ${
                                match.winner_id === match.player1_id ? 'bg-success/20' : 'bg-background/50'
                              }`}>
                                <div className="flex items-center gap-1.5 min-w-0">
                                  {isInProgress && p1Submitted && (
                                    <span className="w-2 h-2 rounded-full bg-success shrink-0" title="Score submitted" />
                                  )}
                                  {isInProgress && !p1Submitted && match.player1_id && (
                                    <span className="w-2 h-2 rounded-full bg-warning animate-pulse shrink-0" title="Playing..." />
                                  )}
                                  <span className="text-sm truncate">{p1?.username || 'TBD'}</span>
                                </div>
                                <span className="font-bold">{match.status === 'completed' ? match.player1_score : p1Submitted ? match.player1_score : '-'}</span>
                              </div>
                              <div className="border-t border-border" />
                              {/* Player 2 row */}
                              <div className={`flex items-center justify-between px-3 py-2 ${
                                match.winner_id === match.player2_id ? 'bg-success/20' : 'bg-background/50'
                              }`}>
                                <div className="flex items-center gap-1.5 min-w-0">
                                  {isInProgress && p2Submitted && (
                                    <span className="w-2 h-2 rounded-full bg-success shrink-0" title="Score submitted" />
                                  )}
                                  {isInProgress && !p2Submitted && match.player2_id && (
                                    <span className="w-2 h-2 rounded-full bg-warning animate-pulse shrink-0" title="Playing..." />
                                  )}
                                  <span className="text-sm truncate">{p2?.username || 'TBD'}</span>
                                </div>
                                <span className="font-bold">{match.status === 'completed' ? match.player2_score : p2Submitted ? match.player2_score : '-'}</span>
                              </div>
                              {/* Status indicators */}
                              {match.status === 'completed' && (
                                <div className="bg-success/10 text-success text-xs text-center py-1 font-medium">
                                  ✓ Completed
                                </div>
                              )}
                              {isInProgress && (
                                <div className="bg-warning/10 text-warning text-xs text-center py-1 font-medium flex items-center justify-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse" />
                                  Match In Progress
                                </div>
                              )}
                              {canUserPlay && !isInProgress && (
                                <button
                                  onClick={() => handlePlayMatch(match)}
                                  className="w-full bg-primary/10 text-primary text-xs text-center py-2 font-medium hover:bg-primary/20 transition-colors flex items-center justify-center gap-1"
                                >
                                  <Play className="w-3 h-3" />
                                  Play Match
                                </button>
                              )}
                              {bothWaiting && !canUserPlay && (
                                <div className="bg-muted/50 text-muted-foreground text-xs text-center py-1">
                                  Waiting for players
                                </div>
                              )}
                              {(!match.player1_id || !match.player2_id) && match.status !== 'completed' && (
                                <div className="bg-muted text-muted-foreground text-xs text-center py-1">
                                  Waiting for opponent
                                </div>
                              )}
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
                    tournament.status === 'completed' ? 'bg-primary/20 text-primary' :
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

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, Loader2, Users, Trophy, Clock, CheckCircle, 
  XCircle, TrendingUp, BarChart3, Eye
} from "lucide-react";

interface QuizSession {
  id: string;
  user_id: string;
  quiz_id: string;
  score: number;
  max_streak: number;
  completed: boolean;
  completed_at: string | null;
  time_taken_seconds: number;
  current_question: number;
  lives_remaining: number;
  created_at: string;
  profile?: {
    username: string | null;
    avatar_url: string | null;
  };
}

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  total_plays: number;
  difficulty: string;
  created_at: string;
}

interface GameRoom {
  id: string;
  room_code: string;
  status: string;
  created_at: string;
  started_at: string | null;
  ended_at: string | null;
  players: {
    id: string;
    username: string;
    score: number;
    avatar_url: string | null;
  }[];
}

const QuizActivityPage = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [sessions, setSessions] = useState<QuizSession[]>([]);
  const [gameRooms, setGameRooms] = useState<GameRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPlays: 0,
    averageScore: 0,
    highestScore: 0,
    averageTime: 0,
    completionRate: 0,
  });

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (quizId) {
      fetchQuizActivity();
    }
  }, [user, quizId]);

  const fetchQuizActivity = async () => {
    if (!quizId) return;
    setLoading(true);

    try {
      // Fetch quiz details
      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .select('*')
        .eq('id', quizId)
        .single();

      if (quizError) throw quizError;
      
      // Check if user is the creator
      if (quizData.creator_id !== user?.id) {
        toast({ title: 'Access Denied', description: 'You can only view activity for quizzes you created', variant: 'destructive' });
        navigate('/dashboard');
        return;
      }

      setQuiz(quizData);

      // Fetch all sessions for this quiz
      const { data: sessionsData } = await supabase
        .from('quiz_sessions')
        .select('*')
        .eq('quiz_id', quizId)
        .order('created_at', { ascending: false });

      if (sessionsData && sessionsData.length > 0) {
        // Fetch user profiles for sessions
        const userIds = [...new Set(sessionsData.map(s => s.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .in('id', userIds);

        const sessionsWithProfiles = sessionsData.map(session => ({
          ...session,
          profile: profiles?.find(p => p.id === session.user_id),
        }));

        setSessions(sessionsWithProfiles);

        // Calculate stats
        const completedSessions = sessionsData.filter(s => s.completed);
        const totalScore = completedSessions.reduce((sum, s) => sum + s.score, 0);
        const totalTime = completedSessions.reduce((sum, s) => sum + (s.time_taken_seconds || 0), 0);
        const highestScore = Math.max(...completedSessions.map(s => s.score), 0);

        setStats({
          totalPlays: sessionsData.length,
          averageScore: completedSessions.length > 0 ? Math.round(totalScore / completedSessions.length) : 0,
          highestScore,
          averageTime: completedSessions.length > 0 ? Math.round(totalTime / completedSessions.length) : 0,
          completionRate: sessionsData.length > 0 ? Math.round((completedSessions.length / sessionsData.length) * 100) : 0,
        });
      }

      // Fetch multiplayer game rooms for this quiz
      const { data: roomsData } = await supabase
        .from('game_rooms')
        .select('*')
        .eq('quiz_id', quizId)
        .order('created_at', { ascending: false });

      if (roomsData && roomsData.length > 0) {
        const roomIds = roomsData.map(r => r.id);
        const { data: playersData } = await supabase
          .from('game_players')
          .select('*')
          .in('room_id', roomIds);

        const roomsWithPlayers = roomsData.map(room => ({
          ...room,
          players: playersData?.filter(p => p.room_id === room.id) || [],
        }));

        setGameRooms(roomsWithPlayers);
      }

    } catch (error: any) {
      console.error('Error fetching quiz activity:', error);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!user) return null;

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

  if (!quiz) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 pt-24 pb-12 text-center">
          <h1 className="text-2xl font-bold">Quiz not found</h1>
          <Button onClick={() => navigate('/dashboard')} className="mt-4">
            Go to Dashboard
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-12">
        <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />Back to Dashboard
        </Button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-8">
            <h1 className="text-3xl font-bold font-display mb-2">{quiz.title}</h1>
            <p className="text-muted-foreground">{quiz.description}</p>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {stats.totalPlays} plays
              </span>
              <span className="capitalize">{quiz.difficulty}</span>
              <span>Created {new Date(quiz.created_at).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <div className="glass-card p-4 text-center">
              <Users className="w-8 h-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold">{stats.totalPlays}</div>
              <div className="text-sm text-muted-foreground">Total Plays</div>
            </div>
            <div className="glass-card p-4 text-center">
              <TrendingUp className="w-8 h-8 text-success mx-auto mb-2" />
              <div className="text-2xl font-bold">{stats.averageScore}</div>
              <div className="text-sm text-muted-foreground">Avg Score</div>
            </div>
            <div className="glass-card p-4 text-center">
              <Trophy className="w-8 h-8 text-warning mx-auto mb-2" />
              <div className="text-2xl font-bold">{stats.highestScore}</div>
              <div className="text-sm text-muted-foreground">High Score</div>
            </div>
            <div className="glass-card p-4 text-center">
              <Clock className="w-8 h-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold">{formatTime(stats.averageTime)}</div>
              <div className="text-sm text-muted-foreground">Avg Time</div>
            </div>
            <div className="glass-card p-4 text-center">
              <BarChart3 className="w-8 h-8 text-success mx-auto mb-2" />
              <div className="text-2xl font-bold">{stats.completionRate}%</div>
              <div className="text-sm text-muted-foreground">Completion</div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Solo Sessions */}
            <div className="glass-card p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Solo Sessions
              </h2>
              {sessions.length > 0 ? (
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {sessions.map((session, index) => (
                    <motion.div
                      key={session.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="flex items-center gap-4 p-3 rounded-lg bg-background/50"
                    >
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                        {session.profile?.avatar_url ? (
                          <img src={session.profile.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          (session.profile?.username || 'U').charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {session.profile?.username || 'Anonymous'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(session.created_at).toLocaleDateString()} at {new Date(session.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          {session.completed ? (
                            <CheckCircle className="w-4 h-4 text-success" />
                          ) : (
                            <XCircle className="w-4 h-4 text-destructive" />
                          )}
                          <span className="font-bold text-primary">{session.score}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {session.time_taken_seconds ? formatTime(session.time_taken_seconds) : '-'}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No sessions yet</p>
                </div>
              )}
            </div>

            {/* Multiplayer Games */}
            <div className="glass-card p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Multiplayer Games
              </h2>
              {gameRooms.length > 0 ? (
                <div className="space-y-4 max-h-[400px] overflow-y-auto">
                  {gameRooms.map((room, index) => (
                    <motion.div
                      key={room.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="p-4 rounded-lg bg-background/50"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-primary">{room.room_code}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          room.status === 'finished' ? 'bg-success/20 text-success' :
                          room.status === 'playing' ? 'bg-warning/20 text-warning' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {room.status}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {new Date(room.created_at).toLocaleDateString()} • {room.players.length} players
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {room.players.sort((a, b) => b.score - a.score).map((player, i) => (
                          <div key={player.id} className="flex items-center gap-1 text-sm bg-background/50 px-2 py-1 rounded">
                            {i === 0 && room.status === 'finished' && <Trophy className="w-3 h-3 text-warning" />}
                            <span>{player.username}</span>
                            <span className="text-primary font-bold">{player.score}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No multiplayer games yet</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default QuizActivityPage;

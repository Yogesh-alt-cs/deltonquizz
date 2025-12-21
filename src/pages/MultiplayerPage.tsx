import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Navbar } from "@/components/layout/Navbar";
import { LivesDisplay, ScoreDisplay, TimerDisplay, StreakBadge, RankBadge } from "@/components/quiz/GameElements";
import { QuestionCard, AnswerOption } from "@/components/quiz/QuizComponents";
import { Confetti } from "@/components/effects/Particles";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { useMultiplayer } from "@/hooks/useMultiplayer";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, Crown, Copy, Play, ArrowLeft, Loader2, CheckCircle2, 
  Trophy, Star, Zap, Twitter, Facebook, Link as LinkIcon 
} from "lucide-react";

interface Question {
  id: string;
  question_text: string;
  options: string[];
  correct_answer: number;
  explanation: string | null;
  points: number;
}

const MultiplayerPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const sounds = useSoundEffects();
  const { 
    room, players, playerId, isHost, loading,
    createRoom, joinRoom, startGame, submitAnswer, nextQuestion, endGame, leaveRoom, setPlayerReady 
  } = useMultiplayer();

  const [joinCode, setJoinCode] = useState(searchParams.get('code') || '');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [timeLeft, setTimeLeft] = useState(20);
  const [questionStartTime, setQuestionStartTime] = useState<number>(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [gamePhase, setGamePhase] = useState<'lobby' | 'playing' | 'results' | 'waiting'>('lobby');
  const [waitingForNext, setWaitingForNext] = useState(false);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');

  const currentPlayer = players.find(p => p.id === playerId);
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const currentQuestion = questions[room?.current_question || 0];

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (searchParams.get('create') === 'true' && !room && user) {
      handleCreateRoom();
    } else if (searchParams.get('code') && !room && user) {
      handleJoinRoom();
    }
  }, [searchParams, user]);

  useEffect(() => {
    if (!room) return;

    if (room.status === 'playing' && gamePhase !== 'playing') {
      setGamePhase('playing');
      generateQuestions();
    } else if (room.status === 'finished' && gamePhase !== 'results') {
      setGamePhase('results');
      setShowConfetti(true);
      sounds.playVictory();
    }
  }, [room?.status]);

  useEffect(() => {
    if (room?.current_question !== undefined && gamePhase === 'playing') {
      setSelectedAnswer(null);
      setIsAnswered(false);
      setWaitingForNext(false);
      setTimeLeft(20);
      setQuestionStartTime(Date.now());
    }
  }, [room?.current_question]);

  useEffect(() => {
    if (gamePhase !== 'playing' || isAnswered || !room) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleTimeout();
          return 0;
        }
        if (prev <= 5) sounds.playCountdown();
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gamePhase, isAnswered, room?.current_question]);

  const generateQuestions = async () => {
    try {
      const topics = ['Science', 'History', 'Geography', 'Literature', 'Technology', 'Sports', 'Music', 'Art'];
      const randomTopic = topics[Math.floor(Math.random() * topics.length)];
      
      const response = await supabase.functions.invoke('generate-quiz', {
        body: { 
          topic: `${randomTopic} Trivia`, 
          difficulty: difficulty, 
          numQuestions: 10 
        },
      });

      if (response.error) throw response.error;

      setQuestions(response.data.questions.map((q: any, i: number) => ({
        id: `q-${i}-${Date.now()}`,
        question_text: q.question_text,
        options: q.options,
        correct_answer: q.correct_answer,
        explanation: q.explanation,
        points: q.points || 100,
      })));
    } catch (error) {
      console.error('Error generating questions:', error);
    }
  };

  const handleCreateRoom = async () => {
    const result = await createRoom();
    if (result) {
      toast({ title: 'Room Created!', description: `Share code: ${result.room_code}` });
    }
  };

  const handleJoinRoom = async () => {
    const code = joinCode || searchParams.get('code') || '';
    if (code.length !== 6) {
      toast({ title: 'Invalid Code', description: 'Room code must be 6 characters', variant: 'destructive' });
      return;
    }
    const success = await joinRoom(code);
    if (success) {
      toast({ title: 'Joined!', description: 'Waiting for host to start...' });
    }
  };

  const handleStartGame = async () => {
    if (players.length < 1) {
      toast({ title: 'Need Players', description: 'Wait for at least one other player', variant: 'destructive' });
      return;
    }
    await startGame();
  };

  const handleTimeout = useCallback(() => {
    if (isAnswered || !currentQuestion) return;
    setIsAnswered(true);
    submitAnswer(room?.current_question || 0, -1, false, 20000, 0);
    sounds.playIncorrect();
    setWaitingForNext(true);

    if (isHost) {
      setTimeout(() => {
        if (room && room.current_question >= questions.length - 1) {
          endGame();
        } else {
          nextQuestion();
        }
      }, 3000);
    }
  }, [isAnswered, currentQuestion, room, isHost, questions.length]);

  const handleAnswerSelect = (index: number) => {
    if (isAnswered || gamePhase !== 'playing' || !currentQuestion) return;

    setSelectedAnswer(index);
    setIsAnswered(true);

    const isCorrect = index === currentQuestion.correct_answer;
    const timeTaken = Date.now() - questionStartTime;
    const timeBonus = Math.max(0, Math.floor((20000 - timeTaken) / 100));
    const points = isCorrect ? currentQuestion.points + timeBonus : 0;

    submitAnswer(room?.current_question || 0, index, isCorrect, timeTaken, points);

    if (isCorrect) {
      sounds.playCorrect();
    } else {
      sounds.playIncorrect();
    }

    setWaitingForNext(true);

    if (isHost) {
      setTimeout(() => {
        if (room && room.current_question >= questions.length - 1) {
          endGame();
        } else {
          nextQuestion();
        }
      }, 3000);
    }
  };

  const copyRoomCode = () => {
    if (room) {
      navigator.clipboard.writeText(room.room_code);
      toast({ title: 'Copied!', description: 'Room code copied to clipboard' });
    }
  };

  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/multiplayer?code=${room?.room_code}` : '';
  const shareText = `Join my quiz game! Use code: ${room?.room_code}`;

  if (!user) return null;

  if (!room) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 pt-24 pb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto"
          >
            <div className="text-center mb-8">
              <Users className="w-16 h-16 text-primary mx-auto mb-4" />
              <h1 className="text-3xl font-bold font-display mb-2">Multiplayer Quiz</h1>
              <p className="text-muted-foreground">Compete with friends in real-time!</p>
            </div>

            <div className="glass-card p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">Create a Room</h3>
                <Button 
                  variant="gaming" 
                  size="lg" 
                  className="w-full"
                  onClick={handleCreateRoom}
                  disabled={loading}
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Crown className="w-5 h-5 mr-2" />}
                  Create New Room
                </Button>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">or</span>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Join a Room</h3>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter 6-digit code"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    maxLength={6}
                    className="font-mono text-lg tracking-wider uppercase"
                  />
                  <Button onClick={handleJoinRoom} disabled={loading || joinCode.length !== 6}>
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Join'}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </main>
      </div>
    );
  }

  if (room.status === 'waiting') {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 pt-24 pb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto"
          >
            <div className="glass-card p-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-2">Game Lobby</h2>
                <div className="flex items-center justify-center gap-2 mb-4">
                  <span className="font-mono text-3xl tracking-wider text-primary">{room.room_code}</span>
                  <Button variant="ghost" size="icon" onClick={copyRoomCode}>
                    <Copy className="w-5 h-5" />
                  </Button>
                </div>
                <p className="text-muted-foreground">Share this code with friends to join!</p>
              </div>

              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Players ({players.length}/{room.max_players})</h3>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, '_blank')}>
                      <Twitter className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={copyRoomCode}>
                      <LinkIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {players.map((player, index) => (
                    <motion.div
                      key={player.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center gap-4 p-4 rounded-xl bg-background/50"
                    >
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                        {player.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{player.username}</span>
                          {player.user_id === room.host_id && (
                            <Crown className="w-4 h-4 text-warning" />
                          )}
                        </div>
                      </div>
                      {player.is_ready && (
                        <CheckCircle2 className="w-5 h-5 text-success" />
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Difficulty Selection - Host Only */}
              {isHost && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Difficulty</h3>
                  <div className="flex gap-2">
                    {(['easy', 'medium', 'hard'] as const).map((diff) => (
                      <Button
                        key={diff}
                        variant={difficulty === diff ? 'gaming' : 'outline'}
                        size="sm"
                        onClick={() => setDifficulty(diff)}
                        className="flex-1 capitalize"
                      >
                        {diff}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="outline" onClick={leaveRoom}>
                  <ArrowLeft className="w-5 h-5 mr-2" />Leave
                </Button>
                {isHost ? (
                  <Button variant="gaming" className="flex-1" onClick={handleStartGame}>
                    <Play className="w-5 h-5 mr-2" />Start Game
                  </Button>
                ) : (
                  <Button variant="secondary" className="flex-1" onClick={() => setPlayerReady(!currentPlayer?.is_ready)}>
                    {currentPlayer?.is_ready ? 'Not Ready' : 'Ready'}
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </main>
      </div>
    );
  }

  if (room.status === 'finished' || gamePhase === 'results') {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <Confetti isActive={showConfetti} />
        <main className="container mx-auto px-4 pt-24 pb-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl mx-auto"
          >
            <div className="glass-card p-8 text-center">
              <Trophy className="w-20 h-20 text-warning mx-auto mb-4" />
              <h2 className="text-3xl font-bold mb-6">Game Over!</h2>

              <div className="space-y-4 mb-8">
                {sortedPlayers.map((player, index) => (
                  <motion.div
                    key={player.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`flex items-center gap-4 p-4 rounded-xl ${
                      index === 0 ? 'bg-warning/20 border border-warning/50' : 'bg-background/50'
                    }`}
                  >
                    <RankBadge rank={index + 1} />
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{player.username}</span>
                        {player.id === playerId && <span className="text-xs text-primary">(You)</span>}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Zap className="w-3 h-3" />
                        <span>Best streak: {player.current_streak}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">{player.score}</div>
                      <div className="text-xs text-muted-foreground">points</div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="flex flex-col gap-3">
                <Button variant="gaming" size="lg" onClick={() => { leaveRoom(); navigate('/multiplayer'); }}>
                  Play Again
                </Button>
                <Button variant="outline" size="lg" onClick={() => navigate('/categories')}>
                  Back to Categories
                </Button>
              </div>
            </div>
          </motion.div>
        </main>
      </div>
    );
  }

  // Playing state
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Users className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{players.length} players</span>
          </div>
          <TimerDisplay timeLeft={timeLeft} totalTime={20} />
          <ScoreDisplay score={currentPlayer?.score || 0} combo={currentPlayer?.current_streak || 0} />
        </div>

        {/* Live leaderboard */}
        <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
          {sortedPlayers.slice(0, 5).map((player, index) => (
            <motion.div
              key={player.id}
              layout
              className={`flex items-center gap-2 px-3 py-2 rounded-lg shrink-0 ${
                player.id === playerId ? 'bg-primary/20 border border-primary/50' : 'bg-background/50'
              }`}
            >
              <span className="text-xs font-bold text-muted-foreground">#{index + 1}</span>
              <span className="text-sm font-medium truncate max-w-[80px]">{player.username}</span>
              <span className="text-sm font-bold text-primary">{player.score}</span>
              {player.last_answer_correct === true && <CheckCircle2 className="w-4 h-4 text-success" />}
              {player.last_answer_correct === false && <span className="text-destructive">✗</span>}
            </motion.div>
          ))}
        </div>

        <div className="mb-4">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>Question {(room?.current_question || 0) + 1} of {questions.length || 10}</span>
          </div>
          <div className="progress-bar h-2">
            <motion.div
              className="progress-bar-fill"
              animate={{ width: `${(((room?.current_question || 0) + 1) / (questions.length || 10)) * 100}%` }}
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {currentQuestion ? (
            <motion.div
              key={room?.current_question}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
            >
              <QuestionCard
                question={currentQuestion.question_text}
                questionNumber={(room?.current_question || 0) + 1}
                totalQuestions={questions.length}
                category="Multiplayer Quiz"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                {currentQuestion.options.map((option, index) => (
                  <AnswerOption
                    key={index}
                    option={option}
                    index={index}
                    selected={selectedAnswer === index}
                    correct={isAnswered ? index === currentQuestion.correct_answer : null}
                    disabled={isAnswered}
                    onClick={() => handleAnswerSelect(index)}
                  />
                ))}
              </div>
              {waitingForNext && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center mt-6"
                >
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                  <p className="text-muted-foreground mt-2">Waiting for next question...</p>
                </motion.div>
              )}
            </motion.div>
          ) : (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default MultiplayerPage;

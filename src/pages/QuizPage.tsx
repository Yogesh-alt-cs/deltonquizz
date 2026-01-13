import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/Navbar";
import { LivesDisplay, ScoreDisplay, TimerDisplay, StreakBadge } from "@/components/quiz/GameElements";
import { QuestionCard, AnswerOption } from "@/components/quiz/QuizComponents";
import { Confetti } from "@/components/effects/Particles";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { QuizPdfDownload } from "@/components/quiz/QuizPdfDownload";
import { ArrowLeft, RotateCcw, Home, Trophy, Volume2, VolumeX, Loader2, Twitter, Facebook, Link as LinkIcon, Sparkles, TrendingUp } from "lucide-react";
interface Question {
  id: string;
  question_text: string;
  options: string[];
  correct_answer: number;
  explanation: string | null;
  points: number;
}

interface XPResult {
  earned: number;
  breakdown: { label: string; amount: number }[];
  newLevel: number;
  leveledUp: boolean;
}

const QuizPage = () => {
  const { quizId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const sounds = useSoundEffects();
  
  // Get difficulty from URL params (from category sidebar)
  const urlDifficulty = searchParams.get('difficulty') || 'medium';

  const [quizTitle, setQuizTitle] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(5);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [combo, setCombo] = useState(1);
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameState, setGameState] = useState<"loading" | "playing" | "gameOver" | "complete">("loading");
  const [showConfetti, setShowConfetti] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [xpResult, setXpResult] = useState<XPResult | null>(null);

  useEffect(() => {
    const fetchQuiz = async () => {
      if (!quizId) return;
      try {
        const { data: quizData } = await supabase.from('quizzes').select('*').eq('id', quizId).maybeSingle();
        
        if (quizData) {
          setQuizTitle(quizData.title);
          const { data: questionsData } = await supabase.from('questions').select('*').eq('quiz_id', quizData.id).order('order_index');
          if (questionsData && questionsData.length > 0) {
            setQuestions(questionsData.map(q => ({ 
              ...q, 
              options: Array.isArray(q.options) ? q.options : JSON.parse(q.options as string) 
            })));
            setTimeLeft(quizData.time_limit_seconds || 30);
            (window as any).__quizStartTime = Date.now();
            setGameState("playing");
            setLoading(false);
            return;
          }
        }

        const categoryMap: Record<string, string> = {
          'engineering': 'Engineering - Data Structures, Algorithms, Operating Systems, Networks',
          'general': 'General Knowledge - History, Geography, Science, Culture',
          'anime': 'Anime and Manga - Popular series like Naruto, One Piece, Attack on Titan',
          'science': 'Science - Physics, Chemistry, Biology, Astronomy',
          'history': 'World History - Ancient civilizations, World Wars, Modern history',
          'technology': 'Technology - Computers, Programming, Internet, AI',
          'mathematics': 'Mathematics - Algebra, Calculus, Geometry, Statistics',
          'programming': 'Programming - JavaScript, Python, Data Structures, Algorithms',
          'sports': 'Sports - Football, Basketball, Olympics, Athletes',
          'movies-tv': 'Movies and TV Shows - Cinema, Series, Actors, Directors',
          'music': 'Music - Artists, Songs, Genres, Music Theory',
          'geography': 'Geography - Countries, Capitals, Landmarks, Maps',
          'biology': 'Medical Biology - NEET style questions, Anatomy, Physiology, Pathology, Pharmacology, Clinical scenario MCQs',
          'competitive': 'Competitive Exams - UPSC, SSC, Banking, Railway, State PSC, Defence exams preparation'
        };
        
        const categoryName = categoryMap[quizId] || quizId;
        const difficulty = urlDifficulty;
        
        toast({ title: 'Generating Quiz', description: `AI is creating 30 ${difficulty} questions...` });
        
        const response = await supabase.functions.invoke('generate-quiz', {
          body: { topic: categoryName, difficulty, numQuestions: 30, category: categoryName },
        });

        if (response.error) throw response.error;
        
        setQuizTitle(response.data.title || `${categoryName} Quiz`);
        setQuestions(response.data.questions.map((q: any, i: number) => ({
          id: `q-${i}`, 
          question_text: q.question_text, 
          options: q.options, 
          correct_answer: q.correct_answer,
          explanation: q.explanation, 
          points: q.points || 10,
        })));
        (window as any).__quizStartTime = Date.now();
        setGameState("playing");
      } catch (error: any) {
        console.error('Error:', error);
        toast({ title: 'Error', description: error.message || 'Failed to load quiz', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [quizId, toast]);

  useEffect(() => {
    if (gameState !== "playing" || isAnswered) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) { handleTimeout(); return 0; }
        if (prev <= 5 && soundEnabled) sounds.playCountdown();
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [gameState, isAnswered, soundEnabled]);

  const handleTimeout = useCallback(() => {
    if (isAnswered) return;
    setIsAnswered(true);
    setLives((prev) => prev - 1);
    setStreak(0);
    setCombo(1);
    if (soundEnabled) sounds.playIncorrect();
    if (lives <= 1) { 
      setGameState("gameOver"); 
      if (soundEnabled) sounds.playGameOver();
      saveSession(false);
    } else {
      setTimeout(goToNextQuestion, 2000);
    }
  }, [isAnswered, lives, soundEnabled, sounds]);

  const handleAnswerSelect = (index: number) => {
    if (isAnswered || gameState !== "playing") return;
    setSelectedAnswer(index);
    setIsAnswered(true);
    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = index === currentQuestion.correct_answer;

    if (isCorrect) {
      const timeBonus = Math.floor(timeLeft * 2);
      const streakBonus = streak >= 3 ? 50 : streak >= 5 ? 100 : 0;
      setScore((prev) => prev + (currentQuestion.points * combo) + timeBonus + streakBonus);
      setCorrectAnswers((prev) => prev + 1);
      setStreak((prev) => { 
        const ns = prev + 1; 
        if (ns > maxStreak) setMaxStreak(ns); 
        return ns; 
      });
      setCombo((prev) => Math.min(prev + 0.5, 4));
      if (soundEnabled) { 
        sounds.playCorrect(); 
        if (streak >= 2) sounds.playCombo(); 
      }
    } else {
      setLives((prev) => prev - 1);
      setStreak(0);
      setCombo(1);
      if (soundEnabled) sounds.playIncorrect();
      if (lives <= 1) { 
        setGameState("gameOver"); 
        if (soundEnabled) sounds.playGameOver();
        saveSession(false);
        return; 
      }
    }
    setTimeout(goToNextQuestion, 1500);
  };

  const calculateAndAwardXP = async (completed: boolean): Promise<XPResult | null> => {
    if (!user) return null;

    const totalQuestions = questions.length;
    const answeredQuestions = currentQuestionIndex + (completed ? 1 : 0);
    const accuracy = answeredQuestions > 0 ? (correctAnswers / answeredQuestions) * 100 : 0;

    // XP breakdown
    const breakdown: { label: string; amount: number }[] = [];
    
    // Base XP for completion
    const baseXP = completed ? 50 : 20;
    breakdown.push({ label: "Quiz participation", amount: baseXP });

    // Accuracy bonus
    let accuracyBonus = 0;
    if (accuracy >= 90) {
      accuracyBonus = 50;
      breakdown.push({ label: "Accuracy 90%+", amount: 50 });
    } else if (accuracy >= 80) {
      accuracyBonus = 30;
      breakdown.push({ label: "Accuracy 80%+", amount: 30 });
    } else if (accuracy >= 70) {
      accuracyBonus = 15;
      breakdown.push({ label: "Accuracy 70%+", amount: 15 });
    }

    // Streak bonus
    let streakBonus = 0;
    if (maxStreak >= 10) {
      streakBonus = 40;
      breakdown.push({ label: "10+ streak", amount: 40 });
    } else if (maxStreak >= 5) {
      streakBonus = 20;
      breakdown.push({ label: "5+ streak", amount: 20 });
    } else if (maxStreak >= 3) {
      streakBonus = 10;
      breakdown.push({ label: "3+ streak", amount: 10 });
    }

    // Score bonus (1 XP per 100 points)
    const scoreBonus = Math.floor(score / 100);
    if (scoreBonus > 0) {
      breakdown.push({ label: "Score bonus", amount: scoreBonus });
    }

    // Perfect game bonus
    if (completed && lives === 5 && accuracy === 100) {
      breakdown.push({ label: "Perfect game!", amount: 100 });
    }

    const totalXP = breakdown.reduce((sum, item) => sum + item.amount, 0);

    try {
      // Award XP using the database function
      const { data, error } = await supabase.rpc('award_xp', {
        p_user_id: user.id,
        p_xp_amount: totalXP,
        p_reason: 'quiz_completion'
      });

      if (error) throw error;

      const result = data?.[0];
      
      // Update daily streak
      await supabase.rpc('update_daily_streak', { p_user_id: user.id });

      return {
        earned: totalXP,
        breakdown,
        newLevel: result?.new_level || 1,
        leveledUp: result?.leveled_up || false
      };
    } catch (error) {
      console.error('Error awarding XP:', error);
      return { earned: totalXP, breakdown, newLevel: 1, leveledUp: false };
    }
  };

  const saveSession = async (completed: boolean) => {
    if (!user) return;
    
    try {
      await supabase.from('quiz_sessions').insert({
        user_id: user.id,
        quiz_id: quizId || 'generated',
        score,
        max_streak: maxStreak,
        completed,
        completed_at: completed ? new Date().toISOString() : null,
        current_question: currentQuestionIndex,
        time_taken_seconds: Math.floor((Date.now() - (window as any).__quizStartTime) / 1000) || 0,
      });

      // Award XP
      const xp = await calculateAndAwardXP(completed);
      if (xp) {
        setXpResult(xp);
        if (xp.leveledUp && soundEnabled) {
          sounds.playLevelUp();
        }
      }
    } catch (error) {
      console.error('Error saving session:', error);
    }
  };

  const goToNextQuestion = () => {
    if (currentQuestionIndex >= questions.length - 1) {
      setGameState("complete");
      setShowConfetti(true);
      if (soundEnabled) sounds.playVictory();
      saveSession(true);
    } else {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
      setTimeLeft(30);
    }
  };

  const restartQuiz = () => {
    setCurrentQuestionIndex(0); 
    setSelectedAnswer(null); 
    setIsAnswered(false);
    setScore(0); 
    setLives(5); 
    setStreak(0); 
    setMaxStreak(0); 
    setCombo(1);
    setTimeLeft(30); 
    setGameState("playing"); 
    setShowConfetti(false);
    setCorrectAnswers(0);
    setXpResult(null);
    (window as any).__quizStartTime = Date.now();
  };

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareText = `I scored ${score} points on ${quizTitle} at Delton Quizz! 🎮 Can you beat my score?`;

  const shareToTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  const shareToFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`, '_blank');
  };

  const copyLink = () => {
    navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
    toast({ title: 'Copied!', description: 'Share link copied to clipboard' });
  };

  if (loading) return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Generating quiz questions...</p>
        </div>
      </div>
    </div>
  );

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Confetti isActive={showConfetti} />
      <main className="container mx-auto px-4 pt-24 pb-12">
        <AnimatePresence mode="wait">
          {(gameState === "gameOver" || gameState === "complete") ? (
            <motion.div 
              key="results" 
              initial={{ opacity: 0, scale: 0.9 }} 
              animate={{ opacity: 1, scale: 1 }} 
              className="max-w-lg mx-auto"
            >
              <div className="glass-card p-8 text-center">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", bounce: 0.5 }}>
                  {gameState === "complete" ? (
                    <Trophy className="w-20 h-20 mx-auto text-warning mb-4" />
                  ) : (
                    <div className="w-20 h-20 mx-auto bg-destructive/20 rounded-full flex items-center justify-center mb-4">
                      <span className="text-4xl">💔</span>
                    </div>
                  )}
                </motion.div>
                
                <h2 className="text-3xl font-bold font-display text-foreground mb-2">
                  {gameState === "complete" ? "Quiz Complete!" : "Game Over!"}
                </h2>
                <p className="text-muted-foreground mb-6">
                  {gameState === "complete" ? "Amazing job!" : "Better luck next time!"}
                </p>
                
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-background/50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-primary">{score}</div>
                    <div className="text-sm text-muted-foreground">Score</div>
                  </div>
                  <div className="bg-background/50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-success">
                      {correctAnswers}/{questions.length}
                    </div>
                    <div className="text-sm text-muted-foreground">Correct</div>
                  </div>
                  <div className="bg-background/50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-warning">{maxStreak}</div>
                    <div className="text-sm text-muted-foreground">Best Streak</div>
                  </div>
                </div>

                {/* XP Earned Section */}
                {xpResult && user && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mb-6"
                  >
                    <div className="bg-gradient-to-r from-primary/20 to-primary/10 rounded-lg p-4 border border-primary/30">
                      <div className="flex items-center justify-center gap-2 mb-3">
                        <Sparkles className="w-5 h-5 text-primary" />
                        <span className="font-bold text-lg text-primary">+{xpResult.earned} XP</span>
                      </div>
                      
                      {xpResult.leveledUp && (
                        <motion.div
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="flex items-center justify-center gap-2 mb-3 text-warning"
                        >
                          <TrendingUp className="w-5 h-5" />
                          <span className="font-bold">Level Up! Now Level {xpResult.newLevel}</span>
                        </motion.div>
                      )}
                      
                      <div className="space-y-1">
                        {xpResult.breakdown.map((item, index) => (
                          <motion.div
                            key={item.label}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 + index * 0.1 }}
                            className="flex justify-between text-sm"
                          >
                            <span className="text-muted-foreground">{item.label}</span>
                            <span className="text-primary font-medium">+{item.amount}</span>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {!user && (
                  <div className="mb-6 p-4 rounded-lg bg-muted/50 border border-border">
                    <p className="text-sm text-muted-foreground mb-2">Sign in to earn XP and track your progress!</p>
                    <Button variant="outline" size="sm" onClick={() => navigate("/auth")}>
                      Sign In
                    </Button>
                  </div>
                )}

                <div className="mb-6">
                  <p className="text-sm text-muted-foreground mb-3">Share your score</p>
                  <div className="flex justify-center gap-3">
                    <Button variant="outline" size="icon" onClick={shareToTwitter} title="Share on Twitter">
                      <Twitter className="w-5 h-5" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={shareToFacebook} title="Share on Facebook">
                      <Facebook className="w-5 h-5" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={copyLink} title="Copy link">
                      <LinkIcon className="w-5 h-5" />
                    </Button>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <Button variant="gaming" size="lg" onClick={restartQuiz}>
                    <RotateCcw className="w-5 h-5 mr-2" />Play Again
                  </Button>
                  <QuizPdfDownload 
                    title={quizTitle}
                    questions={questions}
                    score={score}
                    correctAnswers={correctAnswers}
                  />
                  <Button variant="outline" size="lg" onClick={() => navigate("/categories")}>
                    <Home className="w-5 h-5 mr-2" />Categories
                  </Button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div key="quiz" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="flex items-center justify-between mb-6">
                <Button variant="ghost" onClick={() => navigate(-1)}>
                  <ArrowLeft className="w-5 h-5 mr-2" />Exit
                </Button>
                <Button variant="ghost" size="icon" onClick={() => { setSoundEnabled(!soundEnabled); sounds.setSoundEnabled(!soundEnabled); }}>
                  {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                </Button>
              </div>
              
              <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                <LivesDisplay lives={lives} maxLives={5} />
                <div className="flex items-center gap-4">
                  {streak >= 2 && <StreakBadge streak={streak} />}
                  <TimerDisplay timeLeft={timeLeft} totalTime={30} />
                </div>
                <ScoreDisplay score={score} combo={combo} />
              </div>
              
              <div className="mb-8">
                <div className="flex justify-between text-sm text-muted-foreground mb-2">
                  <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
                  <span>{quizTitle}</span>
                </div>
                <div className="progress-bar h-2">
                  <motion.div className="progress-bar-fill" animate={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }} />
                </div>
              </div>
              
              {currentQuestion && (
                <>
                  <QuestionCard 
                    question={currentQuestion.question_text} 
                    questionNumber={currentQuestionIndex + 1} 
                    totalQuestions={questions.length}
                    category={quizTitle}
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
                  {isAnswered && currentQuestion.explanation && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 p-4 rounded-lg bg-muted/50">
                      <p className="text-sm text-muted-foreground"><strong>Explanation:</strong> {currentQuestion.explanation}</p>
                    </motion.div>
                  )}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default QuizPage;

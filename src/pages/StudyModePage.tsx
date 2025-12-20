import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Navbar } from "@/components/layout/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  BookOpen, Brain, RotateCcw, CheckCircle, XCircle, Plus, 
  Loader2, Calendar, Flame, ArrowLeft, Sparkles, Clock
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";

interface Flashcard {
  id: string;
  question: string;
  answer: string;
  difficulty: string;
  ease_factor: number;
  interval_days: number;
  repetitions: number;
  next_review_at: string;
  last_reviewed_at: string | null;
  category_id: string | null;
}

interface Category {
  id: string;
  name: string;
}

const StudyModePage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [dueCards, setDueCards] = useState<Flashcard[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'overview' | 'study' | 'create'>('overview');
  
  // Study mode state
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [studyStats, setStudyStats] = useState({ correct: 0, incorrect: 0 });
  
  // Create form state
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchFlashcards();
    fetchCategories();
  }, [user]);

  const fetchFlashcards = async () => {
    if (!user) return;
    setLoading(true);
    
    const { data, error } = await supabase
      .from('flashcards')
      .select('*')
      .eq('user_id', user.id)
      .order('next_review_at');

    if (error) {
      console.error('Error fetching flashcards:', error);
    } else {
      setFlashcards(data || []);
      const now = new Date().toISOString();
      setDueCards((data || []).filter(card => card.next_review_at <= now));
    }
    setLoading(false);
  };

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('id, name');
    if (data) setCategories(data);
  };

  const handleCreateFlashcard = async () => {
    if (!question.trim() || !answer.trim()) {
      toast({ title: 'Error', description: 'Please fill in both question and answer', variant: 'destructive' });
      return;
    }

    setCreating(true);
    try {
      const { error } = await supabase.from('flashcards').insert({
        user_id: user!.id,
        question,
        answer,
        category_id: categoryId || null,
        difficulty,
      });

      if (error) throw error;

      toast({ title: 'Created!', description: 'Flashcard added to your deck' });
      setQuestion("");
      setAnswer("");
      fetchFlashcards();
      setMode('overview');
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  const handleGenerateFromQuiz = async () => {
    setCreating(true);
    try {
      const response = await supabase.functions.invoke('generate-quiz', {
        body: { topic: 'General Knowledge', difficulty, numQuestions: 10 },
      });

      if (response.error) throw response.error;

      const questions = response.data.questions || [];
      const flashcardsToInsert = questions.map((q: any) => ({
        user_id: user!.id,
        question: q.question_text,
        answer: q.options[q.correct_answer] + (q.explanation ? `\n\n${q.explanation}` : ''),
        difficulty,
        category_id: categoryId || null,
      }));

      const { error } = await supabase.from('flashcards').insert(flashcardsToInsert);
      if (error) throw error;

      toast({ title: 'Generated!', description: `${questions.length} flashcards created` });
      fetchFlashcards();
      setMode('overview');
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  // Spaced repetition algorithm (SM-2)
  const calculateNextReview = (card: Flashcard, quality: number) => {
    let { ease_factor, interval_days, repetitions } = card;
    
    if (quality >= 3) {
      if (repetitions === 0) {
        interval_days = 1;
      } else if (repetitions === 1) {
        interval_days = 6;
      } else {
        interval_days = Math.round(interval_days * ease_factor);
      }
      repetitions++;
    } else {
      repetitions = 0;
      interval_days = 1;
    }
    
    ease_factor = Math.max(1.3, ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
    
    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + interval_days);
    
    return {
      ease_factor,
      interval_days,
      repetitions,
      next_review_at: nextReview.toISOString(),
      last_reviewed_at: new Date().toISOString(),
    };
  };

  const handleRateCard = async (quality: number) => {
    const card = dueCards[currentCardIndex];
    if (!card) return;

    const updates = calculateNextReview(card, quality);
    
    await supabase.from('flashcards').update(updates).eq('id', card.id);
    await supabase.from('flashcard_reviews').insert({
      flashcard_id: card.id,
      user_id: user!.id,
      quality,
    });

    setStudyStats(prev => ({
      correct: quality >= 3 ? prev.correct + 1 : prev.correct,
      incorrect: quality < 3 ? prev.incorrect + 1 : prev.incorrect,
    }));

    if (currentCardIndex < dueCards.length - 1) {
      setCurrentCardIndex(prev => prev + 1);
      setIsFlipped(false);
    } else {
      setMode('overview');
      fetchFlashcards();
      toast({ 
        title: 'Study Session Complete!', 
        description: `Correct: ${studyStats.correct + (quality >= 3 ? 1 : 0)}, Needs Review: ${studyStats.incorrect + (quality < 3 ? 1 : 0)}` 
      });
      setStudyStats({ correct: 0, incorrect: 0 });
      setCurrentCardIndex(0);
    }
  };

  const startStudySession = () => {
    if (dueCards.length === 0) {
      toast({ title: 'No Cards Due', description: 'All caught up! Add more cards or wait for reviews.' });
      return;
    }
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setStudyStats({ correct: 0, incorrect: 0 });
    setMode('study');
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

  // Study Mode
  if (mode === 'study') {
    const currentCard = dueCards[currentCardIndex];
    const progress = ((currentCardIndex + 1) / dueCards.length) * 100;

    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 pt-24 pb-12">
          <div className="max-w-xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <Button variant="ghost" onClick={() => setMode('overview')}>
                <ArrowLeft className="w-4 h-4 mr-2" />Exit
              </Button>
              <span className="text-sm text-muted-foreground">
                {currentCardIndex + 1} / {dueCards.length}
              </span>
            </div>

            <Progress value={progress} className="mb-6" />

            <motion.div
              key={currentCard?.id}
              className="perspective-1000"
            >
              <motion.div
                className="relative cursor-pointer"
                onClick={() => setIsFlipped(!isFlipped)}
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.6 }}
                style={{ transformStyle: 'preserve-3d' }}
              >
                <div className={`glass-card p-8 min-h-[300px] flex items-center justify-center ${isFlipped ? 'invisible' : ''}`}>
                  <div className="text-center">
                    <Brain className="w-12 h-12 text-primary mx-auto mb-4" />
                    <p className="text-xl font-medium">{currentCard?.question}</p>
                    <p className="text-sm text-muted-foreground mt-4">Tap to reveal answer</p>
                  </div>
                </div>
                <div 
                  className={`glass-card p-8 min-h-[300px] flex items-center justify-center absolute inset-0 ${!isFlipped ? 'invisible' : ''}`}
                  style={{ transform: 'rotateY(180deg)', backfaceVisibility: 'hidden' }}
                >
                  <div className="text-center">
                    <CheckCircle className="w-12 h-12 text-success mx-auto mb-4" />
                    <p className="text-xl font-medium whitespace-pre-wrap">{currentCard?.answer}</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {isFlipped && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6"
              >
                <p className="text-center text-muted-foreground mb-4">How well did you know this?</p>
                <div className="grid grid-cols-4 gap-2">
                  <Button variant="outline" className="flex-col h-auto py-3 border-destructive/50 hover:bg-destructive/10" onClick={() => handleRateCard(1)}>
                    <XCircle className="w-5 h-5 text-destructive mb-1" />
                    <span className="text-xs">Again</span>
                  </Button>
                  <Button variant="outline" className="flex-col h-auto py-3 border-warning/50 hover:bg-warning/10" onClick={() => handleRateCard(2)}>
                    <Clock className="w-5 h-5 text-warning mb-1" />
                    <span className="text-xs">Hard</span>
                  </Button>
                  <Button variant="outline" className="flex-col h-auto py-3 border-primary/50 hover:bg-primary/10" onClick={() => handleRateCard(4)}>
                    <CheckCircle className="w-5 h-5 text-primary mb-1" />
                    <span className="text-xs">Good</span>
                  </Button>
                  <Button variant="outline" className="flex-col h-auto py-3 border-success/50 hover:bg-success/10" onClick={() => handleRateCard(5)}>
                    <Flame className="w-5 h-5 text-success mb-1" />
                    <span className="text-xs">Easy</span>
                  </Button>
                </div>
              </motion.div>
            )}
          </div>
        </main>
      </div>
    );
  }

  // Create Mode
  if (mode === 'create') {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 pt-24 pb-12">
          <Button variant="ghost" onClick={() => setMode('overview')} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />Back
          </Button>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Create Flashcard</h1>
            
            <div className="glass-card p-6 space-y-4">
              <Textarea
                placeholder="Question"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                rows={3}
              />
              <Textarea
                placeholder="Answer"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                rows={3}
              />
              <div className="grid grid-cols-2 gap-4">
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Category (optional)" />
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
              </div>
              <Button onClick={handleCreateFlashcard} disabled={creating} className="w-full">
                {creating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                Create Flashcard
              </Button>
            </div>

            <div className="glass-card p-6 mt-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Generate with AI
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Automatically generate flashcards from quiz topics
              </p>
              <Button variant="outline" onClick={handleGenerateFromQuiz} disabled={creating} className="w-full">
                {creating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                Generate 10 Flashcards
              </Button>
            </div>
          </motion.div>
        </main>
      </div>
    );
  }

  // Overview Mode
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold font-display">
                <span className="text-gradient">Study Mode</span>
              </h1>
              <p className="text-muted-foreground">Learn with spaced repetition flashcards</p>
            </div>
            <Button variant="gaming" onClick={() => setMode('create')}>
              <Plus className="w-4 h-4 mr-2" />Add Flashcard
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid sm:grid-cols-3 gap-4 mb-8">
            <div className="glass-card p-6 text-center">
              <BookOpen className="w-10 h-10 text-primary mx-auto mb-2" />
              <div className="text-3xl font-bold">{flashcards.length}</div>
              <div className="text-sm text-muted-foreground">Total Cards</div>
            </div>
            <div className="glass-card p-6 text-center">
              <Calendar className="w-10 h-10 text-warning mx-auto mb-2" />
              <div className="text-3xl font-bold">{dueCards.length}</div>
              <div className="text-sm text-muted-foreground">Due Today</div>
            </div>
            <div className="glass-card p-6 text-center">
              <Flame className="w-10 h-10 text-success mx-auto mb-2" />
              <div className="text-3xl font-bold">
                {flashcards.filter(c => c.repetitions > 0).length}
              </div>
              <div className="text-sm text-muted-foreground">Mastered</div>
            </div>
          </div>

          {/* Study Button */}
          <div className="glass-card p-8 text-center mb-8">
            <Brain className="w-16 h-16 text-primary mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Ready to Study?</h2>
            <p className="text-muted-foreground mb-4">
              {dueCards.length > 0 
                ? `You have ${dueCards.length} card${dueCards.length > 1 ? 's' : ''} due for review` 
                : 'All caught up! Add more cards or come back later.'}
            </p>
            <Button 
              variant="gaming" 
              size="lg" 
              onClick={startStudySession}
              disabled={dueCards.length === 0}
            >
              <Brain className="w-5 h-5 mr-2" />
              Start Study Session
            </Button>
          </div>

          {/* Flashcard List */}
          {flashcards.length > 0 && (
            <div className="glass-card p-6">
              <h2 className="text-xl font-bold mb-4">Your Flashcards</h2>
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {flashcards.map((card, index) => {
                  const isDue = new Date(card.next_review_at) <= new Date();
                  return (
                    <motion.div
                      key={card.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className={`p-4 rounded-lg ${isDue ? 'bg-warning/10 border border-warning/30' : 'bg-background/50'}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium">{card.question}</p>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{card.answer}</p>
                        </div>
                        <div className="text-right text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <RotateCcw className="w-3 h-3" />
                            {card.repetitions}x
                          </div>
                          {isDue ? (
                            <span className="text-warning">Due now</span>
                          ) : (
                            <span>Due {new Date(card.next_review_at).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {flashcards.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No Flashcards Yet</h3>
              <p className="text-muted-foreground mb-4">Create your first flashcard to start studying!</p>
              <Button variant="gaming" onClick={() => setMode('create')}>
                <Plus className="w-4 h-4 mr-2" />Create Flashcard
              </Button>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default StudyModePage;

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Navbar } from '@/components/layout/Navbar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { QuizPdfDownload } from '@/components/quiz/QuizPdfDownload';
import {
  ArrowLeft, CheckCircle2, XCircle, Clock, Loader2,
  Filter, BookOpen, Download
} from 'lucide-react';

interface StoredAnswer {
  questionIndex: number;
  questionText: string;
  options: string[];
  selectedAnswer: number | null;
  correctAnswer: number;
  isCorrect: boolean;
  explanation: string | null;
  timeTaken: number;
}

interface ReviewData {
  quizTitle: string;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  maxStreak: number;
  timeTaken: number;
  answers: StoredAnswer[];
}

export default function ReviewAnswersPage() {
  const [reviewData, setReviewData] = useState<ReviewData | null>(null);
  const [filter, setFilter] = useState<'all' | 'correct' | 'wrong' | 'skipped'>('all');
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const stored = sessionStorage.getItem('quizReviewData');
    if (stored) {
      try {
        setReviewData(JSON.parse(stored));
      } catch {
        navigate(-1);
      }
    } else {
      navigate(-1);
    }
  }, []);

  if (!reviewData) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const filteredAnswers = reviewData.answers.filter(a => {
    if (filter === 'correct') return a.isCorrect;
    if (filter === 'wrong') return !a.isCorrect && a.selectedAnswer !== null;
    if (filter === 'skipped') return a.selectedAnswer === null;
    return true;
  });

  const accuracy = reviewData.totalQuestions > 0
    ? Math.round((reviewData.correctAnswers / reviewData.totalQuestions) * 100)
    : 0;

  const wrongCount = reviewData.answers.filter(a => !a.isCorrect && a.selectedAnswer !== null).length;
  const skippedCount = reviewData.answers.filter(a => a.selectedAnswer === null).length;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 pt-24 max-w-4xl">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Results
        </Button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Header */}
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold font-display text-foreground">
                Review: {reviewData.quizTitle}
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Score: {reviewData.score} • {reviewData.correctAnswers}/{reviewData.totalQuestions} correct • {accuracy}% accuracy
              </p>
            </div>
            <QuizPdfDownload
              title={reviewData.quizTitle}
              questions={reviewData.answers.map(a => ({
                question_text: a.questionText,
                options: a.options,
                correct_answer: a.correctAnswer,
                explanation: a.explanation,
              }))}
              score={reviewData.score}
              correctAnswers={reviewData.correctAnswers}
            />
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Correct', value: reviewData.correctAnswers, color: 'text-success', bg: 'bg-success/10' },
              { label: 'Wrong', value: wrongCount, color: 'text-destructive', bg: 'bg-destructive/10' },
              { label: 'Skipped', value: skippedCount, color: 'text-warning', bg: 'bg-warning/10' },
              { label: 'Avg Time', value: `${Math.round(reviewData.answers.reduce((s, a) => s + a.timeTaken, 0) / Math.max(reviewData.answers.length, 1))}s`, color: 'text-primary', bg: 'bg-primary/10' },
            ].map(stat => (
              <Card key={stat.label} className={`${stat.bg} border-none p-4 text-center`}>
                <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </Card>
            ))}
          </div>

          {/* Filter Tabs */}
          <Tabs value={filter} onValueChange={(v) => setFilter(v as any)} className="mb-6">
            <TabsList className="w-full grid grid-cols-4">
              <TabsTrigger value="all">All ({reviewData.answers.length})</TabsTrigger>
              <TabsTrigger value="correct">Correct ({reviewData.correctAnswers})</TabsTrigger>
              <TabsTrigger value="wrong">Wrong ({wrongCount})</TabsTrigger>
              <TabsTrigger value="skipped">Skipped ({skippedCount})</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Questions */}
          <div className="space-y-4">
            {filteredAnswers.length === 0 ? (
              <Card className="glass-card p-8 text-center">
                <Filter className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No questions match this filter</p>
              </Card>
            ) : (
              filteredAnswers.map((answer, idx) => (
                <motion.div
                  key={answer.questionIndex}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                >
                  <Card className="glass-card p-5">
                    {/* Question Header */}
                    <div className="flex items-start gap-3 mb-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        answer.isCorrect
                          ? 'bg-success/20'
                          : answer.selectedAnswer === null
                          ? 'bg-warning/20'
                          : 'bg-destructive/20'
                      }`}>
                        {answer.isCorrect ? (
                          <CheckCircle2 className="w-4 h-4 text-success" />
                        ) : answer.selectedAnswer === null ? (
                          <Clock className="w-4 h-4 text-warning" />
                        ) : (
                          <XCircle className="w-4 h-4 text-destructive" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-xs text-muted-foreground font-medium">
                            Question {answer.questionIndex + 1}
                          </span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {answer.timeTaken}s
                          </span>
                        </div>
                        <p className="font-medium text-foreground">{answer.questionText}</p>
                      </div>
                    </div>

                    {/* Options */}
                    <div className="space-y-2 ml-11">
                      {answer.options.map((option, optIdx) => {
                        const isSelected = answer.selectedAnswer === optIdx;
                        const isCorrectOption = answer.correctAnswer === optIdx;
                        let classes = 'p-3 rounded-lg border text-sm';

                        if (isCorrectOption) {
                          classes += ' bg-success/10 border-success/50 text-foreground';
                        } else if (isSelected && !answer.isCorrect) {
                          classes += ' bg-destructive/10 border-destructive/50 text-foreground';
                        } else {
                          classes += ' bg-muted/30 border-border/50 text-muted-foreground';
                        }

                        return (
                          <div key={optIdx} className={classes}>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs w-5">
                                {String.fromCharCode(65 + optIdx)}.
                              </span>
                              <span className="flex-1">{option}</span>
                              {isCorrectOption && (
                                <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                              )}
                              {isSelected && !isCorrectOption && (
                                <XCircle className="w-4 h-4 text-destructive shrink-0" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Explanation */}
                    {answer.explanation && (
                      <div className="mt-3 ml-11 p-3 rounded-lg bg-primary/5 border border-primary/20">
                        <p className="text-sm text-muted-foreground">
                          <span className="font-semibold text-primary">💡 Explanation:</span> {answer.explanation}
                        </p>
                      </div>
                    )}
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      </main>
    </div>
  );
}

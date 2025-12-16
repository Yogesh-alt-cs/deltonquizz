import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Volume2, VolumeX, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/Navbar";
import { LivesDisplay, ScoreDisplay, TimerDisplay, StreakBadge } from "@/components/quiz/GameElements";
import { QuestionCard, AnswerOption } from "@/components/quiz/QuizComponents";
import { Confetti } from "@/components/effects/Particles";
import { Link } from "react-router-dom";

// Sample quiz data
const quizData = {
  engineering: {
    name: "Engineering Fundamentals",
    questions: [
      {
        question: "What is the SI unit of electrical resistance?",
        options: ["Ohm", "Ampere", "Volt", "Watt"],
        correct: 0
      },
      {
        question: "In object-oriented programming, what does 'inheritance' allow?",
        options: ["Multiple returns", "Reuse of parent class properties", "Faster execution", "Better memory management"],
        correct: 1
      },
      {
        question: "What type of stress occurs when forces push together?",
        options: ["Tensile stress", "Compressive stress", "Shear stress", "Bending stress"],
        correct: 1
      },
      {
        question: "Which data structure uses LIFO (Last In, First Out)?",
        options: ["Queue", "Stack", "Array", "Linked List"],
        correct: 1
      },
      {
        question: "What is the purpose of a capacitor in an electrical circuit?",
        options: ["Increase resistance", "Store electrical energy", "Convert AC to DC", "Generate magnetic field"],
        correct: 1
      },
    ]
  },
  general: {
    name: "General Knowledge",
    questions: [
      {
        question: "What is the capital of Japan?",
        options: ["Tokyo", "Beijing", "Seoul", "Bangkok"],
        correct: 0
      },
      {
        question: "Who painted the Mona Lisa?",
        options: ["Michelangelo", "Leonardo da Vinci", "Raphael", "Donatello"],
        correct: 1
      },
      {
        question: "What is the largest planet in our solar system?",
        options: ["Mars", "Saturn", "Jupiter", "Neptune"],
        correct: 2
      },
      {
        question: "In which year did World War II end?",
        options: ["1943", "1944", "1945", "1946"],
        correct: 2
      },
      {
        question: "What is the chemical symbol for gold?",
        options: ["Ag", "Au", "Fe", "Cu"],
        correct: 1
      },
    ]
  },
  anime: {
    name: "Anime & Manga",
    questions: [
      {
        question: "What is the name of the main character in 'Naruto'?",
        options: ["Sasuke Uchiha", "Naruto Uzumaki", "Kakashi Hatake", "Sakura Haruno"],
        correct: 1
      },
      {
        question: "In 'Attack on Titan', what are the giant humanoids called?",
        options: ["Giants", "Titans", "Colossals", "Monsters"],
        correct: 1
      },
      {
        question: "Who is the creator of 'One Piece'?",
        options: ["Masashi Kishimoto", "Eiichiro Oda", "Akira Toriyama", "Tite Kubo"],
        correct: 1
      },
      {
        question: "What is Goku's original Saiyan name in Dragon Ball Z?",
        options: ["Vegeta", "Raditz", "Kakarot", "Broly"],
        correct: 2
      },
      {
        question: "In 'Death Note', what must you know to kill someone?",
        options: ["Their location", "Their face and name", "Their blood type", "Their age"],
        correct: 1
      },
    ]
  }
};

const QuizPage = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  
  const quiz = quizData[categoryId as keyof typeof quizData] || quizData.general;
  
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [combo, setCombo] = useState(1);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isPaused, setIsPaused] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [gameOver, setGameOver] = useState(false);
  const [quizComplete, setQuizComplete] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [answerResult, setAnswerResult] = useState<boolean | null>(null);

  const question = quiz.questions[currentQuestion];

  // Timer effect
  useEffect(() => {
    if (isPaused || showResult || gameOver || quizComplete) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleTimeout();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPaused, showResult, gameOver, quizComplete, currentQuestion]);

  const handleTimeout = useCallback(() => {
    setLives(prev => {
      const newLives = prev - 1;
      if (newLives <= 0) {
        setGameOver(true);
      }
      return newLives;
    });
    setStreak(0);
    setCombo(1);
    handleNextQuestion();
  }, []);

  const handleAnswer = (index: number) => {
    if (showResult || gameOver || quizComplete) return;
    
    setSelectedAnswer(index);
    setShowResult(true);
    
    const isCorrect = index === question.correct;
    setAnswerResult(isCorrect);
    
    if (isCorrect) {
      const basePoints = 100;
      const timeBonus = Math.floor(timeLeft * 2);
      const comboMultiplier = Math.min(combo, 5);
      const totalPoints = (basePoints + timeBonus) * comboMultiplier;
      
      setScore(prev => prev + totalPoints);
      setStreak(prev => prev + 1);
      setCombo(prev => Math.min(prev + 1, 5));
      
      if (streak >= 2) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 1000);
      }
    } else {
      setLives(prev => {
        const newLives = prev - 1;
        if (newLives <= 0) {
          setTimeout(() => setGameOver(true), 1500);
        }
        return newLives;
      });
      setStreak(0);
      setCombo(1);
    }

    setTimeout(() => {
      if (lives > 0 || isCorrect) {
        handleNextQuestion();
      }
    }, 1500);
  };

  const handleNextQuestion = () => {
    if (currentQuestion >= quiz.questions.length - 1) {
      setQuizComplete(true);
      setShowConfetti(true);
    } else {
      setCurrentQuestion(prev => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setAnswerResult(null);
      setTimeLeft(30);
    }
  };

  const handleRestart = () => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setLives(3);
    setScore(0);
    setStreak(0);
    setCombo(1);
    setTimeLeft(30);
    setGameOver(false);
    setQuizComplete(false);
    setShowConfetti(false);
    setAnswerResult(null);
  };

  if (gameOver) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="pt-24 pb-12">
          <div className="container mx-auto px-4 max-w-2xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card p-8 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
                className="w-24 h-24 mx-auto mb-6 rounded-full bg-destructive/20 flex items-center justify-center"
              >
                <span className="text-5xl">💔</span>
              </motion.div>
              
              <h1 className="text-3xl font-bold mb-2">Game Over!</h1>
              <p className="text-muted-foreground mb-8">You ran out of lives</p>
              
              <div className="glass-card p-6 mb-8">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-muted-foreground text-sm">Final Score</span>
                    <p className="font-gaming text-3xl text-primary">{score.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-sm">Questions</span>
                    <p className="font-gaming text-3xl text-foreground">{currentQuestion}/{quiz.questions.length}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-4 justify-center">
                <Button variant="gaming" size="lg" onClick={handleRestart}>
                  Try Again
                </Button>
                <Link to="/categories">
                  <Button variant="outline" size="lg">
                    Choose Another Quiz
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </main>
      </div>
    );
  }

  if (quizComplete) {
    const accuracy = Math.round((score / (quiz.questions.length * 100 * 5)) * 100);
    
    return (
      <div className="min-h-screen">
        <Confetti isActive={showConfetti} />
        <Navbar />
        <main className="pt-24 pb-12">
          <div className="container mx-auto px-4 max-w-2xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card p-8 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
                className="w-24 h-24 mx-auto mb-6 rounded-full bg-success/20 flex items-center justify-center"
              >
                <span className="text-5xl">🏆</span>
              </motion.div>
              
              <h1 className="text-3xl font-bold mb-2">Quiz Complete!</h1>
              <p className="text-muted-foreground mb-8">Great job finishing {quiz.name}!</p>
              
              <div className="glass-card p-6 mb-8">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <span className="text-muted-foreground text-sm">Score</span>
                    <p className="font-gaming text-2xl text-primary">{score.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-sm">Lives Left</span>
                    <p className="font-gaming text-2xl text-destructive">{lives}/3</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-sm">Max Streak</span>
                    <p className="font-gaming text-2xl text-warning">{streak}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-4 justify-center">
                <Button variant="gaming" size="lg" onClick={handleRestart}>
                  Play Again
                </Button>
                <Link to="/categories">
                  <Button variant="outline" size="lg">
                    More Quizzes
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Confetti isActive={showConfetti} />
      <Navbar />
      
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-3xl">
          {/* Top Bar */}
          <div className="flex items-center justify-between mb-8">
            <Link to="/categories">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Exit
              </Button>
            </Link>
            
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSoundEnabled(!soundEnabled)}
              >
                {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsPaused(!isPaused)}
              >
                {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
              </Button>
            </div>
          </div>

          {/* Game Stats */}
          <div className="glass-card p-4 mb-8">
            <div className="flex items-center justify-between">
              <LivesDisplay lives={lives} maxLives={3} />
              <TimerDisplay timeLeft={timeLeft} totalTime={30} />
              <ScoreDisplay score={score} combo={combo} />
            </div>
          </div>

          {/* Streak Badge */}
          <div className="flex justify-center mb-6">
            <StreakBadge streak={streak} />
          </div>

          {/* Question */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestion}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="mb-8"
            >
              <QuestionCard
                question={question.question}
                questionNumber={currentQuestion + 1}
                totalQuestions={quiz.questions.length}
                category={quiz.name}
              />
            </motion.div>
          </AnimatePresence>

          {/* Answer Options */}
          <div className="space-y-4">
            {question.options.map((option, index) => (
              <AnswerOption
                key={`${currentQuestion}-${index}`}
                option={option}
                index={index}
                selected={selectedAnswer === index}
                correct={showResult ? index === question.correct : null}
                disabled={showResult || isPaused}
                onClick={() => handleAnswer(index)}
              />
            ))}
          </div>

          {/* Pause Overlay */}
          <AnimatePresence>
            {isPaused && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-background/90 backdrop-blur-sm z-40 flex items-center justify-center"
              >
                <div className="glass-card p-8 text-center">
                  <h2 className="text-2xl font-bold mb-4">Game Paused</h2>
                  <Button variant="gaming" size="lg" onClick={() => setIsPaused(false)}>
                    <Play className="w-5 h-5 mr-2" />
                    Resume
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default QuizPage;

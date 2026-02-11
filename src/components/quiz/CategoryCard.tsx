import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface CategoryCardProps {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  color: string;
  quizCount: number;
  difficulty: "Easy" | "Medium" | "Hard";
}

export const CategoryCard = ({
  id,
  name,
  description,
  icon: Icon,
  color,
  quizCount,
  difficulty
}: CategoryCardProps) => {
  const navigate = useNavigate();
  const [showSetup, setShowSetup] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState(difficulty.toLowerCase());
  const [questionCount, setQuestionCount] = useState(15);
  const [quizMode, setQuizMode] = useState('normal');

  const difficultyColors = {
    Easy: "text-success",
    Medium: "text-warning",
    Hard: "text-destructive"
  };

  const handleStartQuiz = () => {
    navigate(`/quiz/${id}?difficulty=${selectedDifficulty}&questionCount=${questionCount}&mode=${quizMode}`);
    setShowSetup(false);
  };

  // Save last used difficulty
  const handleDifficultyChange = (val: string) => {
    setSelectedDifficulty(val);
    try { localStorage.setItem(`quiz-difficulty-${id}`, val); } catch {}
  };

  // Restore last used difficulty on mount
  useState(() => {
    try {
      const saved = localStorage.getItem(`quiz-difficulty-${id}`);
      if (saved) setSelectedDifficulty(saved);
    } catch {}
  });

  return (
    <>
      <motion.div
        whileHover={{ y: -8 }}
        className="category-card glass-card p-6 cursor-pointer group"
        onClick={() => setShowSetup(true)}
      >
        <div 
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110"
          style={{ background: `linear-gradient(135deg, ${color}20, ${color}40)` }}
        >
          <Icon className="w-8 h-8" style={{ color }} />
        </div>
        
        <h3 className="text-xl font-bold text-foreground mb-2">{name}</h3>
        <p className="text-muted-foreground text-sm mb-4 line-clamp-2">{description}</p>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{quizCount} quizzes</span>
          <span className={`text-sm font-medium ${difficultyColors[difficulty]}`}>
            {difficulty}
          </span>
        </div>
        
        <motion.div
          className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{ 
            background: `radial-gradient(circle at 50% 50%, ${color}10, transparent 70%)` 
          }}
        />
      </motion.div>

      {/* Quiz Setup Modal */}
      <Dialog open={showSetup} onOpenChange={setShowSetup}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}20` }}>
                <Icon className="w-5 h-5" style={{ color }} />
              </div>
              {name}
            </DialogTitle>
            <DialogDescription>
              Configure your quiz settings before starting
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-4">
            {/* Difficulty */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Difficulty</Label>
              <RadioGroup value={selectedDifficulty} onValueChange={handleDifficultyChange} className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="easy" id={`${id}-easy`} />
                  <Label htmlFor={`${id}-easy`} className="text-success font-medium">Easy</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="medium" id={`${id}-medium`} />
                  <Label htmlFor={`${id}-medium`} className="text-warning font-medium">Medium</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="hard" id={`${id}-hard`} />
                  <Label htmlFor={`${id}-hard`} className="text-destructive font-medium">Hard</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Question Count */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Number of Questions: {questionCount}</Label>
              <Slider
                value={[questionCount]}
                onValueChange={(val) => setQuestionCount(val[0])}
                min={10}
                max={30}
                step={5}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>10</span>
                <span>30</span>
              </div>
            </div>

            {/* Quiz Mode */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Quiz Mode</Label>
              <RadioGroup value={quizMode} onValueChange={setQuizMode} className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="normal" id={`${id}-normal`} />
                  <Label htmlFor={`${id}-normal`}>Normal</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="timed" id={`${id}-timed`} />
                  <Label htmlFor={`${id}-timed`}>Timed</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="practice" id={`${id}-practice`} />
                  <Label htmlFor={`${id}-practice`}>Practice</Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSetup(false)}>Cancel</Button>
            <Button onClick={handleStartQuiz}>
              Start Custom Quiz
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

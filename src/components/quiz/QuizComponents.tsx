import { motion, AnimatePresence } from "framer-motion";
import { Check, X } from "lucide-react";
import { QuestionImage } from "./QuestionImage";

interface AnswerOptionProps {
  option: string;
  index: number;
  selected: boolean;
  correct?: boolean | null;
  disabled: boolean;
  onClick: () => void;
}

const optionLabels = ["A", "B", "C", "D"];

// Kahoot-inspired distinct colors for each option
const kahootColors = [
  "from-[hsl(0,70%,50%)] to-[hsl(0,70%,40%)]",     // Red
  "from-[hsl(220,70%,50%)] to-[hsl(220,70%,40%)]",  // Blue
  "from-[hsl(45,90%,50%)] to-[hsl(45,90%,40%)]",    // Yellow/Gold
  "from-[hsl(142,70%,40%)] to-[hsl(142,70%,32%)]",  // Green
];

export const AnswerOption = ({
  option,
  index,
  selected,
  correct,
  disabled,
  onClick
}: AnswerOptionProps) => {
  const getStateClass = () => {
    if (correct === true) return "correct";
    if (correct === false && selected) return "incorrect animate-shake";
    if (selected) return "border-primary glow-primary";
    return "";
  };

  return (
    <motion.button
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.08 }}
      whileHover={!disabled ? { scale: 1.04, y: -2 } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
      className={`answer-option w-full text-left ${getStateClass()} ${disabled ? "disabled cursor-not-allowed" : ""} bg-gradient-to-br ${kahootColors[index]} !border-transparent`}
      onClick={onClick}
      disabled={disabled}
    >
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-gaming font-bold text-lg bg-black/20 text-white`}>
          {optionLabels[index]}
        </div>
        <span className="flex-1 text-white font-semibold text-base">{option}</span>
        <AnimatePresence>
          {correct === true && (
            <motion.div
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 500 }}
              className="w-8 h-8 rounded-full bg-white/30 flex items-center justify-center"
            >
              <Check className="w-5 h-5 text-white" />
            </motion.div>
          )}
          {correct === false && selected && (
            <motion.div
              initial={{ scale: 0, rotate: 90 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 500 }}
              className="w-8 h-8 rounded-full bg-white/30 flex items-center justify-center"
            >
              <X className="w-5 h-5 text-white" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.button>
  );
};

interface QuestionCardProps {
  question: string;
  questionNumber: number;
  totalQuestions: number;
  category: string;
  imageUrl?: string;
}

export const QuestionCard = ({
  question,
  questionNumber,
  totalQuestions,
  category,
  imageUrl,
}: QuestionCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-8"
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-muted-foreground uppercase tracking-wider">
          {category}
        </span>
        <span className="font-gaming text-primary">
          {questionNumber} / {totalQuestions}
        </span>
      </div>
      
      <div className="w-full progress-bar h-1.5 mb-6">
        <div 
          className="progress-bar-fill"
          style={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
        />
      </div>

      {imageUrl && (
        <QuestionImage imageUrl={imageUrl} alt={`Question ${questionNumber} image`} />
      )}
      
      <h2 className="text-2xl font-bold text-foreground leading-relaxed">
        {question}
      </h2>
    </motion.div>
  );
};

import { motion, AnimatePresence } from "framer-motion";
import { Check, X } from "lucide-react";

interface AnswerOptionProps {
  option: string;
  index: number;
  selected: boolean;
  correct?: boolean | null;
  disabled: boolean;
  onClick: () => void;
}

const optionLabels = ["A", "B", "C", "D"];

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
    if (correct === false && selected) return "incorrect";
    if (selected) return "border-primary glow-primary";
    return "";
  };

  return (
    <motion.button
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={!disabled ? { scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      className={`answer-option w-full text-left ${getStateClass()} ${disabled ? "disabled cursor-not-allowed" : ""}`}
      onClick={onClick}
      disabled={disabled}
    >
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-gaming font-bold text-lg ${
          selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
        }`}>
          {optionLabels[index]}
        </div>
        <span className="flex-1 text-foreground font-medium">{option}</span>
        <AnimatePresence>
          {correct === true && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-8 h-8 rounded-full bg-success flex items-center justify-center"
            >
              <Check className="w-5 h-5 text-success-foreground" />
            </motion.div>
          )}
          {correct === false && selected && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-8 h-8 rounded-full bg-destructive flex items-center justify-center"
            >
              <X className="w-5 h-5 text-destructive-foreground" />
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
}

export const QuestionCard = ({
  question,
  questionNumber,
  totalQuestions,
  category
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
      
      <h2 className="text-2xl font-bold text-foreground leading-relaxed">
        {question}
      </h2>
    </motion.div>
  );
};

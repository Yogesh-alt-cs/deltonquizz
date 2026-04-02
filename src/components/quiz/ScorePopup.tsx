import { motion, AnimatePresence } from "framer-motion";
import { Zap, Clock, Flame } from "lucide-react";

interface ScorePopupProps {
  show: boolean;
  points: number;
  timeBonus: number;
  streakBonus: number;
  isCorrect: boolean;
}

export const ScorePopup = ({ show, points, timeBonus, streakBonus, isCorrect }: ScorePopupProps) => {
  const total = points + timeBonus + streakBonus;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.5 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -40, scale: 0.8 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
          className="fixed inset-x-0 top-[45%] z-50 flex justify-center pointer-events-none"
        >
          <div className={`
            px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-md border
            ${isCorrect
              ? "bg-success/20 border-success/40 text-success"
              : "bg-destructive/20 border-destructive/40 text-destructive"
            }
          `}>
            {isCorrect ? (
              <div className="flex flex-col items-center gap-1">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.3, 1] }}
                  transition={{ duration: 0.4 }}
                  className="font-gaming text-3xl font-bold"
                >
                  +{total}
                </motion.div>
                <div className="flex items-center gap-3 text-xs opacity-80">
                  {points > 0 && (
                    <span className="flex items-center gap-1">
                      <Zap className="w-3 h-3" /> {points} pts
                    </span>
                  )}
                  {timeBonus > 0 && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> +{timeBonus} speed
                    </span>
                  )}
                  {streakBonus > 0 && (
                    <span className="flex items-center gap-1">
                      <Flame className="w-3 h-3" /> +{streakBonus} streak
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <motion.div
                initial={{ x: -10 }}
                animate={{ x: [−10, 10, -6, 6, 0] }}
                transition={{ duration: 0.4 }}
                className="font-gaming text-2xl font-bold"
              >
                ✗ Wrong!
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

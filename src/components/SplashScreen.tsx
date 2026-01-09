import { motion } from "framer-motion";
import logo from "@/assets/logo.png";

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  return (
    <motion.div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background"
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ delay: 2.2, duration: 0.5 }}
      onAnimationComplete={onComplete}
    >
      {/* Background gradient effects */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/20 blur-[100px]"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1.5, opacity: 0.5 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-primary/30 blur-[80px]"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1.2, opacity: 0.6 }}
          transition={{ duration: 1.2, delay: 0.2, ease: "easeOut" }}
        />
      </div>

      {/* Logo container */}
      <motion.div
        className="relative z-10 flex flex-col items-center gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        {/* Logo with glow effect */}
        <motion.div
          className="relative"
          initial={{ scale: 0.5, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ 
            type: "spring", 
            stiffness: 200, 
            damping: 15,
            delay: 0.2 
          }}
        >
          <motion.div
            className="absolute inset-0 rounded-3xl bg-primary/40 blur-xl"
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.4, 0.6, 0.4]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.img
            src={logo}
            alt="Delton Quizz"
            className="relative w-24 h-24 md:w-32 md:h-32 rounded-3xl shadow-2xl"
            whileHover={{ rotate: 10 }}
          />
        </motion.div>

        {/* Text logo */}
        <motion.div
          className="flex items-center gap-1"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <span className="font-gaming text-3xl md:text-4xl text-foreground tracking-wider">
            DELTON
          </span>
          <motion.span
            className="font-gaming text-3xl md:text-4xl text-primary tracking-wider"
            animate={{ 
              textShadow: [
                "0 0 10px hsl(var(--primary) / 0.5)",
                "0 0 20px hsl(var(--primary) / 0.8)",
                "0 0 10px hsl(var(--primary) / 0.5)"
              ]
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            QUIZZ
          </motion.span>
        </motion.div>

        {/* Tagline */}
        <motion.p
          className="text-muted-foreground text-sm md:text-base"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.5 }}
        >
          Learn. Play. Conquer.
        </motion.p>

        {/* Loading indicator */}
        <motion.div
          className="mt-8 flex items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.3 }}
        >
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full bg-primary"
                animate={{
                  y: [0, -8, 0],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  delay: i * 0.15,
                  ease: "easeInOut"
                }}
              />
            ))}
          </div>
        </motion.div>
      </motion.div>

      {/* Decorative particles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full bg-primary/60"
          style={{
            left: `${20 + i * 12}%`,
            top: `${30 + (i % 3) * 20}%`,
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ 
            opacity: [0, 0.8, 0],
            scale: [0, 1, 0],
            y: [0, -30, -60]
          }}
          transition={{
            duration: 1.5,
            delay: 0.8 + i * 0.15,
            repeat: Infinity,
            repeatDelay: 0.5
          }}
        />
      ))}
    </motion.div>
  );
};

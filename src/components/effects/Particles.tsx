import { motion } from "framer-motion";
import { useEffect, useState, useMemo } from "react";

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  delay: number;
}

export const Confetti = ({ isActive }: { isActive: boolean }) => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (isActive) {
      const colors = ["#6366F1", "#10B981", "#F59E0B", "#EF4444", "#EC4899"];
      const newParticles: Particle[] = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 4,
        delay: Math.random() * 0.5,
      }));
      setParticles(newParticles);

      const timeout = setTimeout(() => setParticles([]), 2000);
      return () => clearTimeout(timeout);
    }
  }, [isActive]);

  if (!isActive || particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            left: `${particle.x}%`,
            top: "100%",
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
          }}
          initial={{ y: 0, opacity: 1, rotate: 0 }}
          animate={{
            y: -window.innerHeight - 100,
            opacity: 0,
            rotate: Math.random() * 720 - 360,
          }}
          transition={{
            duration: 1.5 + Math.random(),
            delay: particle.delay,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
};

export const FloatingParticles = () => {
  const particles = useMemo(() => 
    Array.from({ length: 20 }, (_, i) => ({
      id: i,
      size: Math.random() * 4 + 2,
      x: Math.random() * 100,
      y: Math.random() * 100,
      duration: Math.random() * 10 + 15,
      delay: Math.random() * 5,
    })), []
  );

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full bg-primary/20"
          style={{
            width: particle.size,
            height: particle.size,
            left: `${particle.x}%`,
            top: `${particle.y}%`,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, 20, 0],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};

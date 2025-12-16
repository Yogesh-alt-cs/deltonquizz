import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

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
  const difficultyColors = {
    Easy: "text-success",
    Medium: "text-warning",
    Hard: "text-destructive"
  };

  return (
    <Link to={`/quiz/${id}`}>
      <motion.div
        whileHover={{ y: -8 }}
        className="category-card glass-card p-6 cursor-pointer group"
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
    </Link>
  );
};

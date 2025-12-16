import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Cpu, Globe, Sparkles, BookOpen, Palette, Music, Film, Dumbbell } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { CategoryCard } from "@/components/quiz/CategoryCard";
import { FloatingParticles } from "@/components/effects/Particles";

const allCategories = [
  {
    id: "engineering",
    name: "Engineering",
    description: "Test your knowledge of mechanical, electrical, and software engineering concepts",
    icon: Cpu,
    color: "#6366F1",
    quizCount: 24,
    difficulty: "Hard" as const
  },
  {
    id: "general",
    name: "General Knowledge",
    description: "Challenge yourself with trivia from history, science, geography and more",
    icon: Globe,
    color: "#10B981",
    quizCount: 56,
    difficulty: "Medium" as const
  },
  {
    id: "anime",
    name: "Anime & Manga",
    description: "How well do you know your favorite anime series and characters?",
    icon: Sparkles,
    color: "#EC4899",
    quizCount: 32,
    difficulty: "Easy" as const
  },
  {
    id: "science",
    name: "Science",
    description: "Explore physics, chemistry, biology and the wonders of the universe",
    icon: BookOpen,
    color: "#F59E0B",
    quizCount: 45,
    difficulty: "Medium" as const
  },
  {
    id: "art",
    name: "Art & Design",
    description: "From Renaissance masters to modern digital art movements",
    icon: Palette,
    color: "#8B5CF6",
    quizCount: 18,
    difficulty: "Easy" as const
  },
  {
    id: "music",
    name: "Music",
    description: "Test your knowledge of genres, artists, and music theory",
    icon: Music,
    color: "#EF4444",
    quizCount: 28,
    difficulty: "Medium" as const
  },
  {
    id: "movies",
    name: "Movies & TV",
    description: "From classic cinema to the latest streaming hits",
    icon: Film,
    color: "#06B6D4",
    quizCount: 42,
    difficulty: "Easy" as const
  },
  {
    id: "sports",
    name: "Sports",
    description: "Football, basketball, Olympics and more athletic trivia",
    icon: Dumbbell,
    color: "#22C55E",
    quizCount: 35,
    difficulty: "Medium" as const
  },
];

const CategoriesPage = () => {
  return (
    <div className="min-h-screen">
      <FloatingParticles />
      <Navbar />
      
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Quiz <span className="text-gradient">Categories</span>
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Choose from a wide variety of topics and test your knowledge. 
              Each category offers multiple quizzes with varying difficulty levels.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {allCategories.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <CategoryCard {...category} />
              </motion.div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default CategoriesPage;

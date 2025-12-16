import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Cpu, Globe, Sparkles, BookOpen, Calculator, Code, Trophy, Film, Music, Map, FlaskConical, Landmark, Wrench } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { CategoryCard } from "@/components/quiz/CategoryCard";
import { FloatingParticles } from "@/components/effects/Particles";
import { supabase } from "@/integrations/supabase/client";

const iconMap: Record<string, any> = {
  'Wrench': Wrench,
  'Brain': Globe,
  'Tv': Sparkles,
  'FlaskConical': FlaskConical,
  'Landmark': Landmark,
  'Cpu': Cpu,
  'Calculator': Calculator,
  'Code': Code,
  'Trophy': Trophy,
  'Film': Film,
  'Music': Music,
  'Map': Map,
};

const colorMap: Record<string, string> = {
  'from-blue-500 to-cyan-500': '#3B82F6',
  'from-purple-500 to-pink-500': '#A855F7',
  'from-orange-500 to-red-500': '#F97316',
  'from-green-500 to-emerald-500': '#22C55E',
  'from-amber-500 to-yellow-500': '#F59E0B',
  'from-indigo-500 to-violet-500': '#6366F1',
  'from-teal-500 to-cyan-500': '#14B8A6',
  'from-rose-500 to-pink-500': '#F43F5E',
  'from-lime-500 to-green-500': '#84CC16',
  'from-fuchsia-500 to-purple-500': '#D946EF',
  'from-sky-500 to-blue-500': '#0EA5E9',
  'from-emerald-500 to-teal-500': '#10B981',
};

const defaultCategories = [
  { id: "engineering", name: "Engineering", description: "Technical engineering concepts and problems", icon: Cpu, color: "#6366F1", quizCount: 30, difficulty: "Hard" as const },
  { id: "general-knowledge", name: "General Knowledge", description: "Test your knowledge on various topics", icon: Globe, color: "#10B981", quizCount: 30, difficulty: "Medium" as const },
  { id: "anime", name: "Anime", description: "Questions about popular anime series", icon: Sparkles, color: "#EC4899", quizCount: 30, difficulty: "Easy" as const },
  { id: "science", name: "Science", description: "Physics, Chemistry, Biology and more", icon: FlaskConical, color: "#22C55E", quizCount: 30, difficulty: "Medium" as const },
  { id: "history", name: "History", description: "Events and figures from the past", icon: Landmark, color: "#F59E0B", quizCount: 30, difficulty: "Medium" as const },
  { id: "technology", name: "Technology", description: "Computers, software, and digital world", icon: Cpu, color: "#8B5CF6", quizCount: 30, difficulty: "Medium" as const },
  { id: "mathematics", name: "Mathematics", description: "Numbers, algebra, calculus, and geometry", icon: Calculator, color: "#14B8A6", quizCount: 30, difficulty: "Hard" as const },
  { id: "programming", name: "Programming", description: "Coding challenges and programming concepts", icon: Code, color: "#F43F5E", quizCount: 30, difficulty: "Hard" as const },
  { id: "sports", name: "Sports", description: "Questions about various sports and athletes", icon: Trophy, color: "#84CC16", quizCount: 30, difficulty: "Easy" as const },
  { id: "movies-tv", name: "Movies & TV", description: "Film and television trivia", icon: Film, color: "#D946EF", quizCount: 30, difficulty: "Easy" as const },
  { id: "music", name: "Music", description: "Artists, songs, and music theory", icon: Music, color: "#0EA5E9", quizCount: 30, difficulty: "Medium" as const },
  { id: "geography", name: "Geography", description: "Countries, capitals, and landmarks", icon: Map, color: "#10B981", quizCount: 30, difficulty: "Medium" as const },
];

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string | null;
}

const CategoriesPage = () => {
  const [categories, setCategories] = useState(defaultCategories);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase.from('categories').select('*');
      if (data && data.length > 0) {
        const mappedCategories = data.map((cat: Category) => ({
          id: cat.slug,
          name: cat.name,
          description: cat.description || '',
          icon: iconMap[cat.icon || 'Globe'] || Globe,
          color: colorMap[cat.color || ''] || '#6366F1',
          quizCount: 30,
          difficulty: (cat.slug === 'engineering' || cat.slug === 'programming' || cat.slug === 'mathematics' ? 'Hard' : 
                      cat.slug === 'anime' || cat.slug === 'sports' || cat.slug === 'movies-tv' ? 'Easy' : 'Medium') as 'Easy' | 'Medium' | 'Hard',
        }));
        setCategories(mappedCategories);
      }
      setLoading(false);
    };
    fetchCategories();
  }, []);

  return (
    <div className="min-h-screen bg-background">
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
              Choose from a wide variety of topics. Each category generates 30 AI-powered questions with varying difficulty.
            </p>
          </motion.div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {categories.map((category, index) => (
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
          )}
        </div>
      </main>
    </div>
  );
};

export default CategoriesPage;

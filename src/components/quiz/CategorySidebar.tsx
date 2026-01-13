import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Stethoscope, FlaskConical, GraduationCap, Sparkles, 
  ChevronRight, X, Zap 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Category {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  subcategories?: string[];
}

interface CategorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onCategorySelect: (categoryId: string, difficulty: string) => void;
}

const categories: Category[] = [
  {
    id: 'biology',
    name: 'Biology / Medical',
    description: 'Doctor-level questions: NEET, Anatomy, Physiology, Pathology, Pharmacology',
    icon: <Stethoscope className="w-6 h-6" />,
    color: 'hsl(142, 76%, 36%)',
    subcategories: ['NEET Style', 'Anatomy', 'Physiology', 'Pathology', 'Pharmacology', 'Clinical MCQs']
  },
  {
    id: 'science',
    name: 'Science',
    description: 'Physics, Chemistry, Biology fundamentals and advanced concepts',
    icon: <FlaskConical className="w-6 h-6" />,
    color: 'hsl(217, 91%, 60%)',
    subcategories: ['Physics', 'Chemistry', 'Biology', 'Astronomy', 'Earth Science']
  },
  {
    id: 'competitive',
    name: 'Competitive Exams',
    description: 'Prep for UPSC, SSC, Banking, Railway and other competitive exams',
    icon: <GraduationCap className="w-6 h-6" />,
    color: 'hsl(45, 93%, 47%)',
    subcategories: ['UPSC', 'SSC', 'Banking', 'Railway', 'State PSC', 'Defence']
  },
  {
    id: 'custom',
    name: 'Custom Topic',
    description: 'Enter any topic and AI will generate relevant questions',
    icon: <Sparkles className="w-6 h-6" />,
    color: 'hsl(280, 87%, 65%)',
  }
];

const difficulties = [
  { id: 'easy', label: 'Easy', description: 'Basic concepts, simple vocabulary', color: 'text-success' },
  { id: 'medium', label: 'Medium', description: 'Moderate depth, standard complexity', color: 'text-warning' },
  { id: 'hard', label: 'Hard', description: 'Advanced concepts, expert level', color: 'text-destructive' }
];

export function CategorySidebar({ isOpen, onClose, onCategorySelect }: CategorySidebarProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [step, setStep] = useState<'category' | 'difficulty'>('category');

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setStep('difficulty');
  };

  const handleDifficultyClick = (difficulty: string) => {
    if (selectedCategory) {
      onCategorySelect(selectedCategory, difficulty);
      setStep('category');
      setSelectedCategory(null);
      onClose();
    }
  };

  const handleBack = () => {
    setStep('category');
    setSelectedCategory(null);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
            onClick={onClose}
          />
          
          {/* Sidebar */}
          <motion.div
            initial={{ x: -320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -320, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 h-full w-80 bg-card border-r border-border z-50 overflow-hidden"
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-primary" />
                  <h2 className="font-bold text-lg">
                    {step === 'category' ? 'Categories' : 'Select Difficulty'}
                  </h2>
                </div>
                <Button variant="ghost" size="icon" onClick={step === 'difficulty' ? handleBack : onClose}>
                  {step === 'difficulty' ? <ChevronRight className="w-5 h-5 rotate-180" /> : <X className="w-5 h-5" />}
                </Button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4">
                <AnimatePresence mode="wait">
                  {step === 'category' ? (
                    <motion.div
                      key="categories"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="space-y-3"
                    >
                      {categories.map((category, index) => (
                        <motion.button
                          key={category.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          onClick={() => handleCategoryClick(category.id)}
                          className={cn(
                            "w-full p-4 rounded-xl border-2 border-border text-left transition-all",
                            "hover:border-primary/50 hover:bg-primary/5 group"
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <div 
                              className="p-2 rounded-lg transition-colors"
                              style={{ backgroundColor: `${category.color}20`, color: category.color }}
                            >
                              {category.icon}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                                  {category.name}
                                </h3>
                                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                              </div>
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {category.description}
                              </p>
                              {category.subcategories && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {category.subcategories.slice(0, 3).map((sub) => (
                                    <span 
                                      key={sub} 
                                      className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
                                    >
                                      {sub}
                                    </span>
                                  ))}
                                  {category.subcategories.length > 3 && (
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                                      +{category.subcategories.length - 3} more
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.button>
                      ))}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="difficulty"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-4"
                    >
                      <div className="text-center mb-6">
                        <p className="text-muted-foreground text-sm">
                          Choose difficulty for{' '}
                          <span className="text-primary font-medium">
                            {categories.find(c => c.id === selectedCategory)?.name}
                          </span>
                        </p>
                      </div>

                      {difficulties.map((diff, index) => (
                        <motion.button
                          key={diff.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.1 }}
                          onClick={() => handleDifficultyClick(diff.id)}
                          className={cn(
                            "w-full p-5 rounded-xl border-2 border-border text-left transition-all",
                            "hover:border-primary hover:bg-primary/5"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className={cn("font-bold text-lg", diff.color)}>
                                {diff.label}
                              </h3>
                              <p className="text-sm text-muted-foreground mt-1">
                                {diff.description}
                              </p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-muted-foreground" />
                          </div>
                        </motion.button>
                      ))}

                      {/* Difficulty info for Biology/Medical */}
                      {selectedCategory === 'biology' && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-6 p-4 bg-muted/50 rounded-lg border border-border"
                        >
                          <h4 className="font-medium text-sm text-foreground mb-2">Medical Question Types:</h4>
                          <ul className="text-xs text-muted-foreground space-y-1">
                            <li>• <strong>Easy:</strong> Basic anatomy, terminology</li>
                            <li>• <strong>Medium:</strong> Physiological concepts, drug classes</li>
                            <li>• <strong>Hard:</strong> Clinical scenarios, differential diagnosis</li>
                          </ul>
                        </motion.div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

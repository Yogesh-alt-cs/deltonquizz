import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Trophy, Zap, Users, BookOpen, ArrowRight, Cpu, Globe, Sparkles, Heart, Star, Play, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/Navbar";
import { CategoryCard } from "@/components/quiz/CategoryCard";
import { Leaderboard } from "@/components/quiz/Leaderboard";
import { FloatingParticles } from "@/components/effects/Particles";
import { CategorySidebar } from "@/components/quiz/CategorySidebar";
import logo from "@/assets/logo.png";

const categories = [{
  id: "engineering",
  name: "Engineering",
  description: "Test your knowledge of mechanical, electrical, and software engineering concepts",
  icon: Cpu,
  color: "#6366F1",
  quizCount: 24,
  difficulty: "Hard" as const
}, {
  id: "general",
  name: "General Knowledge",
  description: "Challenge yourself with trivia from history, science, geography and more",
  icon: Globe,
  color: "#10B981",
  quizCount: 56,
  difficulty: "Medium" as const
}, {
  id: "anime",
  name: "Anime & Manga",
  description: "How well do you know your favorite anime series and characters?",
  icon: Sparkles,
  color: "#EC4899",
  quizCount: 32,
  difficulty: "Easy" as const
}];

const leaderboardData = [{
  rank: 1,
  username: "QuizMaster",
  score: 48750,
  badge: "Pro"
}, {
  rank: 2,
  username: "BrainStorm",
  score: 45200
}, {
  rank: 3,
  username: "TriviaKing",
  score: 42800
}, {
  rank: 4,
  username: "NerdAlert",
  score: 39500
}, {
  rank: 5,
  username: "SmartCookie",
  score: 37200
}];

const stats = [{
  label: "Active Players",
  value: "50K+",
  icon: Users
}, {
  label: "Quizzes Taken",
  value: "2M+",
  icon: BookOpen
}, {
  label: "Questions",
  value: "100K+",
  icon: Zap
}];

const Index = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const handleCategorySelect = (categoryId: string, difficulty: string, customTopic?: string) => {
    const params = new URLSearchParams({ difficulty });
    if (customTopic) {
      params.set('topic', customTopic);
    }
    navigate(`/quiz/${categoryId}?${params.toString()}`);
  };
  return <div className="min-h-screen">
      <FloatingParticles />
      <Navbar />
      <CategorySidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        onCategorySelect={handleCategorySelect}
      />
      
      <main className="pt-20">
        {/* Hero Section */}
        <section className="relative py-20 lg:py-32 overflow-hidden">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <motion.div initial={{
              opacity: 0,
              y: 30
            }} animate={{
              opacity: 1,
              y: 0
            }} transition={{
              duration: 0.6
            }}>
                <motion.div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 border border-primary/30 mb-6" initial={{
                opacity: 0,
                scale: 0.8
              }} animate={{
                opacity: 1,
                scale: 1
              }} transition={{
                delay: 0.2
              }}>
                  <Zap className="w-4 h-4 text-primary" />
                  <span className="text-sm text-primary font-medium">New: AI-powered quiz generation</span>
                </motion.div>

                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                  Learn. Play.
                  <span className="text-gradient block">Conquer.</span>
                </h1>
                
                <p className="text-lg text-muted-foreground mb-8 max-w-xl">
                  Transform your learning into an exciting adventure with gamified quizzes, 
                  compete on leaderboards, and challenge friends in the ultimate quiz experience.
                </p>

                <div className="flex flex-wrap gap-4">
                  <Button 
                    variant="gaming" 
                    size="lg" 
                    className="group"
                    onClick={() => setSidebarOpen(true)}
                  >
                    <Menu className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    Quick Start
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                  <Link to="/categories">
                    <Button variant="outline" size="lg" className="group">
                      <Play className="w-5 h-5" />
                      All Categories
                    </Button>
                  </Link>
                  <Link to="/join">
                    <Button variant="outline" size="lg">
                      Join with Code
                    </Button>
                  </Link>
                  <Link to="/create">
                    <Button variant="outline" size="lg">
                      Create Quiz
                    </Button>
                  </Link>
                </div>

                {/* Stats */}
                <div className="flex flex-wrap gap-8 mt-12">
                  {stats.map((stat, index) => <motion.div key={stat.label} initial={{
                  opacity: 0,
                  y: 20
                }} animate={{
                  opacity: 1,
                  y: 0
                }} transition={{
                  delay: 0.4 + index * 0.1
                }} className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                        <stat.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <span className="block font-gaming text-xl text-foreground">{stat.value}</span>
                        <span className="text-sm text-muted-foreground">{stat.label}</span>
                      </div>
                    </motion.div>)}
                </div>
              </motion.div>

              {/* Hero Visual */}
              <motion.div initial={{
              opacity: 0,
              scale: 0.9
            }} animate={{
              opacity: 1,
              scale: 1
            }} transition={{
              duration: 0.6,
              delay: 0.3
            }} className="relative hidden lg:block">
                <div className="relative">
                  {/* Main Card */}
                  <motion.div className="glass-card p-8 animate-float" animate={{
                  y: [0, -10, 0]
                }} transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}>
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-2">
                        <Heart className="w-6 h-6 text-destructive fill-destructive" />
                        <Heart className="w-6 h-6 text-destructive fill-destructive" />
                        <Heart className="w-6 h-6 text-destructive fill-destructive" />
                      </div>
                      <span className="font-gaming text-2xl text-primary">2,450</span>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="h-3 progress-bar">
                        <div className="progress-bar-fill" style={{
                        width: "60%"
                      }} />
                      </div>
                      <p className="text-foreground font-medium">What is the capital of Japan?</p>
                      
                      <div className="grid grid-cols-2 gap-3">
                        {["Tokyo", "Beijing", "Seoul", "Bangkok"].map((city, i) => <div key={city} className={`p-3 rounded-lg border ${i === 0 ? "bg-success/20 border-success" : "bg-muted border-border"}`}>
                            <span className="text-sm font-medium">{city}</span>
                          </div>)}
                      </div>
                    </div>
                  </motion.div>

                  {/* Floating Elements */}
                  <motion.div className="absolute -top-4 -right-4 glass-card p-3" animate={{
                  rotate: [0, 5, -5, 0]
                }} transition={{
                  duration: 6,
                  repeat: Infinity
                }}>
                    <div className="flex items-center gap-2">
                      <Star className="w-5 h-5 text-warning fill-warning" />
                      <span className="font-gaming text-warning">5 STREAK</span>
                    </div>
                  </motion.div>

                  <motion.div className="absolute -bottom-4 -left-4 glass-card p-3" animate={{
                  scale: [1, 1.05, 1]
                }} transition={{
                  duration: 2,
                  repeat: Infinity
                }}>
                    <div className="flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-warning" />
                      <span className="text-sm font-medium">Rank #24</span>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Background Gradient */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        </section>

        {/* Categories Section */}
        <section className="py-20 relative">
          <div className="container mx-auto px-4">
            <motion.div initial={{
            opacity: 0,
            y: 20
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }} className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Choose Your <span className="text-gradient">Challenge</span>
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                From technical engineering questions to pop culture trivia, 
                we have something for every curious mind.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((category, index) => <motion.div key={category.id} initial={{
              opacity: 0,
              y: 30
            }} whileInView={{
              opacity: 1,
              y: 0
            }} viewport={{
              once: true
            }} transition={{
              delay: index * 0.1
            }}>
                  <CategoryCard {...category} />
                </motion.div>)}
            </div>

            <motion.div className="text-center mt-10" initial={{
            opacity: 0
          }} whileInView={{
            opacity: 1
          }} viewport={{
            once: true
          }}>
              <Link to="/categories">
                <Button variant="outline" size="lg">
                  View All Categories
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Leaderboard Preview */}
        <section className="py-20 relative">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-start">
              <motion.div initial={{
              opacity: 0,
              x: -30
            }} whileInView={{
              opacity: 1,
              x: 0
            }} viewport={{
              once: true
            }}>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  Climb the <span className="text-gradient">Rankings</span>
                </h2>
                <p className="text-muted-foreground mb-8">
                  Compete with players worldwide. Answer questions, earn points, 
                  and climb to the top of the leaderboard to prove you're the ultimate quiz champion.
                </p>
                
                <div className="space-y-4 mb-8">
                  {["Earn points for correct answers", "Build streaks for bonus multipliers", "Weekly tournaments with prizes", "Compete in category-specific rankings"].map((feature, index) => <motion.div key={index} initial={{
                  opacity: 0,
                  x: -20
                }} whileInView={{
                  opacity: 1,
                  x: 0
                }} viewport={{
                  once: true
                }} transition={{
                  delay: index * 0.1
                }} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-success/20 flex items-center justify-center">
                        <Zap className="w-3 h-3 text-success" />
                      </div>
                      <span className="text-foreground">{feature}</span>
                    </motion.div>)}
                </div>

                <Link to="/leaderboard">
                  <Button variant="gaming" size="lg">
                    View Full Leaderboard
                    <Trophy className="w-5 h-5" />
                  </Button>
                </Link>
              </motion.div>

              <motion.div initial={{
              opacity: 0,
              x: 30
            }} whileInView={{
              opacity: 1,
              x: 0
            }} viewport={{
              once: true
            }} className="glass-card p-6">
                <Leaderboard entries={leaderboardData} title="Top Players" />
              </motion.div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 relative">
          <div className="container mx-auto px-4">
            <motion.div initial={{
            opacity: 0,
            y: 30
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }} className="glass-card p-12 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/10 pointer-events-none" />
              
              <img src={logo} alt="Delton Quizz" className="w-16 h-16 mx-auto rounded-xl mb-6" />
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to Test Your Knowledge?
              </h2>
              <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                Join thousands of players and start your quiz journey today. 
                No account required to start playing!
              </p>
              
              <div className="flex flex-wrap justify-center gap-4">
                <Link to="/quiz/general">
                  <Button variant="gaming" size="xl">
                    <Play className="w-6 h-6" />
                    Play Now
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 border-t border-border">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <img src={logo} alt="Delton Quizz" className="w-10 h-10 rounded-xl" />
                <span className="font-gaming text-lg">
                  DELTON<span className="text-primary">QUIZZ</span>
                </span>
              </div>
              
              <p className="text-sm text-muted-foreground text-justify">
                © 2026 Delton Quizz. Learning made fun.
              </p>
            </div>
          </div>
        </footer>
      </main>
    </div>;
};
export default Index;
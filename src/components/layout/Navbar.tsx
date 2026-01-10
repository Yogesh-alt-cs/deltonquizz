import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Trophy, BookOpen, User, Menu, X, Plus, Users, LogIn, LayoutDashboard, Swords, GraduationCap, Home, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import logo from "@/assets/logo.png";

export const Navbar = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, loading } = useAuth();

  const navItems = [
    { path: "/", label: "Home", icon: Home },
    { path: "/categories", label: "Categories", icon: BookOpen },
    { path: "/multiplayer", label: "Multiplayer", icon: Users },
    { path: "/tournament", label: "Tournament", icon: Swords },
    { path: "/study", label: "Study", icon: GraduationCap },
    { path: "/leaderboard", label: "Leaderboard", icon: Trophy },
    { path: "/friends", label: "Friends", icon: UserPlus },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center h-16 gap-4">
          {/* Logo - Fixed width */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <motion.img 
              src={logo}
              alt="Delton Quizz"
              className="w-9 h-9 rounded-xl"
              whileHover={{ rotate: 15, scale: 1.1 }}
              transition={{ type: "spring", stiffness: 400 }}
            />
            <span className="font-gaming text-lg text-foreground tracking-wider hidden sm:block">
              DELTON<span className="text-primary">QUIZZ</span>
            </span>
          </Link>

          {/* Desktop Navigation - Scrollable */}
          <div className="hidden lg:flex flex-1 min-w-0">
            <ScrollArea className="w-full">
              <div className="flex items-center gap-1 px-1 py-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  
                  return (
                    <Link key={item.path} to={item.path} className="shrink-0">
                      <motion.div
                        className={`px-3 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 whitespace-nowrap ${
                          isActive 
                            ? "bg-primary/20 text-primary shadow-sm" 
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-sm font-medium">{item.label}</span>
                      </motion.div>
                    </Link>
                  );
                })}
              </div>
              <ScrollBar orientation="horizontal" className="invisible" />
            </ScrollArea>
          </div>

          {/* Tablet Navigation - Horizontal scroll visible */}
          <div className="hidden md:flex lg:hidden flex-1 min-w-0">
            <ScrollArea className="w-full">
              <div className="flex items-center gap-1 px-1 py-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  
                  return (
                    <Link key={item.path} to={item.path} className="shrink-0">
                      <motion.div
                        className={`px-2.5 py-2 rounded-lg flex items-center gap-1.5 transition-all duration-200 whitespace-nowrap ${
                          isActive 
                            ? "bg-primary/20 text-primary shadow-sm" 
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-xs font-medium">{item.label}</span>
                      </motion.div>
                    </Link>
                  );
                })}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>

          {/* Desktop Action Buttons */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            <Link to="/join">
              <Button variant="outline" size="sm" className="h-9">
                <Users className="w-4 h-4 mr-1.5" />
                <span className="hidden xl:inline">Join Quiz</span>
                <span className="xl:hidden">Join</span>
              </Button>
            </Link>
            {!loading && (
              user ? (
                <>
                  <Link to="/dashboard">
                    <Button variant="outline" size="sm" className="h-9">
                      <LayoutDashboard className="w-4 h-4 xl:mr-1.5" />
                      <span className="hidden xl:inline">Dashboard</span>
                    </Button>
                  </Link>
                  <Link to="/create">
                    <Button variant="outline" size="sm" className="h-9">
                      <Plus className="w-4 h-4 xl:mr-1.5" />
                      <span className="hidden xl:inline">Create</span>
                    </Button>
                  </Link>
                  <Link to="/profile">
                    <Button variant="gaming" size="sm" className="h-9">
                      <User className="w-4 h-4 xl:mr-1.5" />
                      <span className="hidden xl:inline">Profile</span>
                    </Button>
                  </Link>
                </>
              ) : (
                <Link to="/auth">
                  <Button variant="gaming" size="sm" className="h-9">
                    <LogIn className="w-4 h-4 mr-1.5" />
                    Sign In
                  </Button>
                </Link>
              )
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-foreground ml-auto rounded-lg hover:bg-muted/60 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden py-4 border-t border-border/50"
          >
            <div className="flex flex-col gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                
                return (
                  <Link 
                    key={item.path} 
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <motion.div 
                      className={`px-4 py-3 rounded-lg flex items-center gap-3 transition-all duration-200 ${
                        isActive 
                          ? "bg-primary/20 text-primary" 
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                      }`}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </motion.div>
                  </Link>
                );
              })}
              <Link to="/join" onClick={() => setMobileMenuOpen(false)}>
                <motion.div 
                  className="px-4 py-3 rounded-lg flex items-center gap-3 text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all duration-200"
                  whileTap={{ scale: 0.98 }}
                >
                  <Users className="w-5 h-5" />
                  <span className="font-medium">Join Quiz</span>
                </motion.div>
              </Link>
              
              <div className="flex gap-2 mt-4 px-4">
                {user ? (
                  <>
                    <Link to="/dashboard" className="flex-1" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="outline" size="sm" className="w-full">
                        <LayoutDashboard className="w-4 h-4 mr-2" />
                        Dashboard
                      </Button>
                    </Link>
                    <Link to="/profile" className="flex-1" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="gaming" size="sm" className="w-full">
                        <User className="w-4 h-4 mr-2" />
                        Profile
                      </Button>
                    </Link>
                  </>
                ) : (
                  <Link to="/auth" className="flex-1" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="gaming" size="sm" className="w-full">
                      <LogIn className="w-4 h-4 mr-2" />
                      Sign In
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </nav>
  );
};
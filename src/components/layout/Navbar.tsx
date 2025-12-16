import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Gamepad2, Trophy, BookOpen, User, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export const Navbar = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { path: "/", label: "Home", icon: Gamepad2 },
    { path: "/categories", label: "Categories", icon: BookOpen },
    { path: "/leaderboard", label: "Leaderboard", icon: Trophy },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-3">
            <motion.div 
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center"
              whileHover={{ rotate: 15, scale: 1.1 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <Gamepad2 className="w-6 h-6 text-primary-foreground" />
            </motion.div>
            <span className="font-gaming text-xl text-foreground tracking-wider">
              DELTON<span className="text-primary">QUIZ</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link key={item.path} to={item.path}>
                  <motion.div
                    className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                      isActive 
                        ? "bg-primary/20 text-primary" 
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="font-medium">{item.label}</span>
                  </motion.div>
                </Link>
              );
            })}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Button variant="outline" size="sm">
              <User className="w-4 h-4 mr-2" />
              Sign In
            </Button>
            <Button variant="gaming" size="sm">
              Get Started
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-foreground"
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
            <div className="flex flex-col gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                
                return (
                  <Link 
                    key={item.path} 
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <div className={`px-4 py-3 rounded-lg flex items-center gap-3 ${
                      isActive 
                        ? "bg-primary/20 text-primary" 
                        : "text-muted-foreground"
                    }`}>
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </div>
                  </Link>
                );
              })}
              <div className="flex gap-2 mt-4 px-4">
                <Button variant="outline" size="sm" className="flex-1">
                  Sign In
                </Button>
                <Button variant="gaming" size="sm" className="flex-1">
                  Get Started
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </nav>
  );
};

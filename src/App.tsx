import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import QuizPage from "./pages/QuizPage";
import CategoriesPage from "./pages/CategoriesPage";
import LeaderboardPage from "./pages/LeaderboardPage";
import AuthPage from "./pages/AuthPage";
import CreateQuizPage from "./pages/CreateQuizPage";
import JoinQuizPage from "./pages/JoinQuizPage";
import ProfilePage from "./pages/ProfilePage";
import MultiplayerPage from "./pages/MultiplayerPage";
import DashboardPage from "./pages/DashboardPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/quiz/:quizId" element={<QuizPage />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/create" element={<CreateQuizPage />} />
            <Route path="/join" element={<JoinQuizPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/multiplayer" element={<MultiplayerPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

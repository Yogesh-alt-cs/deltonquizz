import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import AuthPage from "./pages/AuthPage";
import CategoriesPage from "./pages/CategoriesPage";
import QuizPage from "./pages/QuizPage";
import CreateQuizPage from "./pages/CreateQuizPage";
import ProfilePage from "./pages/ProfilePage";
import LeaderboardPage from "./pages/LeaderboardPage";
import JoinQuizPage from "./pages/JoinQuizPage";
import MultiplayerPage from "./pages/MultiplayerPage";
import DashboardPage from "./pages/DashboardPage";
import TournamentPage from "./pages/TournamentPage";
import StudyModePage from "./pages/StudyModePage";
import QuizActivityPage from "./pages/QuizActivityPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/quiz/:id" element={<QuizPage />} />
            <Route path="/create" element={<CreateQuizPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/join" element={<JoinQuizPage />} />
            <Route path="/multiplayer" element={<MultiplayerPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/tournament" element={<TournamentPage />} />
            <Route path="/tournament/:id" element={<TournamentPage />} />
            <Route path="/study" element={<StudyModePage />} />
            <Route path="/quiz-activity/:quizId" element={<QuizActivityPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Navbar } from '@/components/layout/Navbar';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Shield, Users, FileText, BarChart3, Search, Ban, CheckCircle,
  Trash2, Eye, ArrowLeft, Loader2, Crown, TrendingUp, BookOpen,
  Clock, AlertTriangle
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';

interface UserProfile {
  id: string;
  username: string | null;
  email?: string;
  total_score: number | null;
  total_quizzes_played: number | null;
  level: number | null;
  xp: number | null;
  created_at: string | null;
  is_admin: boolean | null;
  daily_streak: number | null;
}

interface QuizItem {
  id: string;
  title: string;
  description: string | null;
  difficulty: string | null;
  is_public: boolean | null;
  total_plays: number | null;
  created_at: string | null;
  creator_id: string | null;
}

export default function AdminPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
  const [stats, setStats] = useState({ totalUsers: 0, totalQuizzes: 0, totalSessions: 0, totalQuestions: 0 });
  const [loading, setLoading] = useState(true);
  const [searchUsers, setSearchUsers] = useState('');
  const [searchQuizzes, setSearchQuizzes] = useState('');

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      navigate('/');
      toast({ title: 'Access Denied', description: 'Admin privileges required.', variant: 'destructive' });
    }
  }, [user, isAdmin, authLoading, navigate]);

  useEffect(() => {
    if (isAdmin) fetchAll();
  }, [isAdmin]);

  const fetchAll = async () => {
    setLoading(true);
    const [profilesRes, quizzesRes, sessionsRes, questionsRes] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('quizzes').select('*').order('created_at', { ascending: false }),
      supabase.from('quiz_sessions').select('id', { count: 'exact', head: true }),
      supabase.from('questions').select('id', { count: 'exact', head: true }),
    ]);

    setUsers(profilesRes.data || []);
    setQuizzes(quizzesRes.data || []);
    setStats({
      totalUsers: profilesRes.data?.length || 0,
      totalQuizzes: quizzesRes.data?.length || 0,
      totalSessions: sessionsRes.count || 0,
      totalQuestions: questionsRes.count || 0,
    });
    setLoading(false);
  };

  const handleDeleteQuiz = async (quizId: string) => {
    // Delete questions first, then quiz
    await supabase.from('questions').delete().eq('quiz_id', quizId);
    const { error } = await supabase.from('quizzes').delete().eq('id', quizId);
    if (error) {
      toast({ title: 'Error', description: 'Failed to delete quiz. You may not have permission.', variant: 'destructive' });
    } else {
      toast({ title: 'Quiz Deleted', description: 'The quiz has been removed.' });
      setQuizzes(prev => prev.filter(q => q.id !== quizId));
    }
  };

  const handleTogglePublic = async (quizId: string, currentPublic: boolean | null) => {
    const { error } = await supabase.from('quizzes').update({ is_public: !currentPublic }).eq('id', quizId);
    if (error) {
      toast({ title: 'Error', description: 'Failed to update quiz visibility.', variant: 'destructive' });
    } else {
      setQuizzes(prev => prev.map(q => q.id === quizId ? { ...q, is_public: !currentPublic } : q));
      toast({ title: 'Updated', description: `Quiz is now ${!currentPublic ? 'public' : 'hidden'}.` });
    }
  };

  const filteredUsers = users.filter(u =>
    (u.username || '').toLowerCase().includes(searchUsers.toLowerCase()) ||
    u.id.toLowerCase().includes(searchUsers.toLowerCase())
  );

  const filteredQuizzes = quizzes.filter(q =>
    q.title.toLowerCase().includes(searchQuizzes.toLowerCase())
  );

  if (authLoading || !isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 pt-24">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-destructive/20 flex items-center justify-center">
              <Shield className="w-7 h-7 text-destructive" />
            </div>
            <div>
              <h1 className="text-3xl font-bold font-display text-foreground">Admin Dashboard</h1>
              <p className="text-muted-foreground text-sm">Manage users, quizzes, and platform analytics</p>
            </div>
          </div>

          {/* Stats Cards */}
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[
                  { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-primary' },
                  { label: 'Total Quizzes', value: stats.totalQuizzes, icon: BookOpen, color: 'text-success' },
                  { label: 'Quiz Sessions', value: stats.totalSessions, icon: TrendingUp, color: 'text-warning' },
                  { label: 'Total Questions', value: stats.totalQuestions, icon: FileText, color: 'text-destructive' },
                ].map((stat) => (
                  <Card key={stat.label} className="glass-card p-5">
                    <div className="flex items-center gap-3">
                      <stat.icon className={`w-8 h-8 ${stat.color}`} />
                      <div>
                        <p className="text-2xl font-bold text-foreground">{stat.value.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <Tabs defaultValue="users" className="space-y-6">
                <TabsList className="bg-card border border-border">
                  <TabsTrigger value="users"><Users className="w-4 h-4 mr-1.5" />Users</TabsTrigger>
                  <TabsTrigger value="quizzes"><BookOpen className="w-4 h-4 mr-1.5" />Quizzes</TabsTrigger>
                </TabsList>

                {/* Users Tab */}
                <TabsContent value="users" className="space-y-4">
                  <div className="relative max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Search users..." value={searchUsers} onChange={e => setSearchUsers(e.target.value)} className="pl-9 bg-card border-border" />
                  </div>

                  <div className="space-y-2">
                    {filteredUsers.map((u) => (
                      <Card key={u.id} className="glass-card p-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                            {u.is_admin ? <Crown className="w-5 h-5 text-warning" /> : <Users className="w-5 h-5 text-primary" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-foreground truncate">{u.username || 'Anonymous'}</p>
                              {u.is_admin && <span className="text-xs px-1.5 py-0.5 rounded bg-warning/20 text-warning font-medium">Admin</span>}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">ID: {u.id}</p>
                          </div>
                          <div className="hidden sm:flex items-center gap-6 text-sm text-muted-foreground shrink-0">
                            <div className="text-center">
                              <p className="font-bold text-foreground">{u.level || 1}</p>
                              <p className="text-xs">Level</p>
                            </div>
                            <div className="text-center">
                              <p className="font-bold text-foreground">{(u.total_score || 0).toLocaleString()}</p>
                              <p className="text-xs">Score</p>
                            </div>
                            <div className="text-center">
                              <p className="font-bold text-foreground">{u.total_quizzes_played || 0}</p>
                              <p className="text-xs">Quizzes</p>
                            </div>
                            <div className="text-center">
                              <p className="font-bold text-foreground">{u.daily_streak || 0}</p>
                              <p className="text-xs">Streak</p>
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground shrink-0">
                            {u.created_at && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{format(new Date(u.created_at), 'MMM d, yyyy')}</span>}
                          </div>
                        </div>
                      </Card>
                    ))}
                    {filteredUsers.length === 0 && (
                      <p className="text-center text-muted-foreground py-8">No users found.</p>
                    )}
                  </div>
                </TabsContent>

                {/* Quizzes Tab */}
                <TabsContent value="quizzes" className="space-y-4">
                  <div className="relative max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Search quizzes..." value={searchQuizzes} onChange={e => setSearchQuizzes(e.target.value)} className="pl-9 bg-card border-border" />
                  </div>

                  <div className="space-y-2">
                    {filteredQuizzes.map((q) => (
                      <Card key={q.id} className="glass-card p-4">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${q.is_public ? 'bg-success/20' : 'bg-destructive/20'}`}>
                            {q.is_public ? <CheckCircle className="w-5 h-5 text-success" /> : <Ban className="w-5 h-5 text-destructive" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-foreground truncate">{q.title}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              {q.difficulty && <span className="capitalize">{q.difficulty}</span>}
                              <span>•</span>
                              <span>{q.total_plays || 0} plays</span>
                              {q.created_at && (
                                <>
                                  <span>•</span>
                                  <span>{format(new Date(q.created_at), 'MMM d, yyyy')}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Button size="sm" variant="ghost" onClick={() => navigate(`/quiz/${q.id}`)} title="View">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleTogglePublic(q.id, q.is_public)} title={q.is_public ? 'Hide' : 'Make Public'}>
                              {q.is_public ? <Ban className="w-4 h-4 text-warning" /> : <CheckCircle className="w-4 h-4 text-success" />}
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleDeleteQuiz(q.id)} title="Delete" className="text-destructive hover:text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                    {filteredQuizzes.length === 0 && (
                      <p className="text-center text-muted-foreground py-8">No quizzes found.</p>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </motion.div>
      </main>
    </div>
  );
}

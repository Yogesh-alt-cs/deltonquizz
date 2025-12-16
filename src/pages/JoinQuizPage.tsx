import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/layout/Navbar';
import { Search, ArrowLeft, Users } from 'lucide-react';

export default function JoinQuizPage() {
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleJoin = async () => {
    if (!joinCode.trim()) {
      toast({ title: 'Error', description: 'Please enter a join code', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const { data: quiz, error } = await supabase
        .from('quizzes')
        .select('id, title')
        .eq('join_code', joinCode.toUpperCase())
        .maybeSingle();

      if (error) throw error;

      if (!quiz) {
        toast({ title: 'Not Found', description: 'No quiz found with that code', variant: 'destructive' });
        return;
      }

      toast({ title: 'Quiz Found!', description: `Joining "${quiz.title}"` });
      navigate(`/quiz/${quiz.id}`);
    } catch (error: any) {
      console.error('Error finding quiz:', error);
      toast({ title: 'Error', description: 'Failed to find quiz', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 pt-24">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md mx-auto"
        >
          <Card className="glass-card p-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', bounce: 0.5 }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 mb-6"
            >
              <Users className="w-8 h-8 text-primary" />
            </motion.div>

            <h1 className="text-2xl font-bold font-display text-foreground mb-2">
              Join a Quiz
            </h1>
            <p className="text-muted-foreground mb-8">
              Enter the 6-character code to join
            </p>

            <div className="space-y-4">
              <Input
                placeholder="Enter code (e.g., ABC123)"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                className="text-center text-2xl font-display tracking-widest uppercase"
                maxLength={6}
              />

              <Button
                className="w-full btn-gaming"
                onClick={handleJoin}
                disabled={loading || joinCode.length < 6}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Searching...
                  </div>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Join Quiz
                  </>
                )}
              </Button>
            </div>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}

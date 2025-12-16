import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/layout/Navbar';
import { Upload, Sparkles, FileText, Copy, ArrowLeft, Loader2 } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Course {
  id: string;
  name: string;
  code: string;
}

interface GeneratedQuestion {
  question_text: string;
  options: string[];
  correct_answer: number;
  explanation: string;
  points: number;
}

export default function CreateQuizPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [numQuestions, setNumQuestions] = useState(10);
  const [categoryId, setCategoryId] = useState('');
  const [courseId, setCourseId] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[]>([]);
  const [joinCode, setJoinCode] = useState('');
  const [createdQuizId, setCreatedQuizId] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchCategories();
  }, [user, navigate]);

  useEffect(() => {
    if (categoryId) {
      fetchCourses(categoryId);
    }
  }, [categoryId]);

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('*');
    if (data) setCategories(data);
  };

  const fetchCourses = async (catId: string) => {
    const { data } = await supabase
      .from('engineering_courses')
      .select('*')
      .eq('category_id', catId);
    if (data) setCourses(data);
  };

  const generateJoinCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleGenerateQuiz = async () => {
    if (!topic.trim()) {
      toast({ title: 'Error', description: 'Please enter a topic', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const selectedCourse = courses.find(c => c.id === courseId);
      const selectedCategory = categories.find(c => c.id === categoryId);

      const response = await supabase.functions.invoke('generate-quiz', {
        body: {
          topic,
          difficulty,
          numQuestions,
          category: selectedCategory?.name,
          course: selectedCourse?.name,
        },
      });

      if (response.error) throw response.error;

      const data = response.data;
      setTitle(data.title || `Quiz: ${topic}`);
      setDescription(data.description || '');
      setGeneratedQuestions(data.questions || []);

      toast({ title: 'Quiz Generated!', description: `${data.questions?.length || 0} questions created` });
    } catch (error: any) {
      console.error('Error generating quiz:', error);
      toast({ title: 'Error', description: error.message || 'Failed to generate quiz', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast({ title: 'Error', description: 'Please upload a PDF file', variant: 'destructive' });
      return;
    }

    setPdfLoading(true);
    try {
      // Read PDF as text (basic extraction)
      const text = await file.text();
      
      const response = await supabase.functions.invoke('parse-pdf-quiz', {
        body: {
          pdfText: text,
          numQuestions,
          difficulty,
        },
      });

      if (response.error) throw response.error;

      const data = response.data;
      setTitle(data.title || `Quiz from ${file.name}`);
      setDescription(data.description || '');
      setGeneratedQuestions(data.questions || []);

      toast({ title: 'PDF Processed!', description: `${data.questions?.length || 0} questions extracted` });
    } catch (error: any) {
      console.error('Error processing PDF:', error);
      toast({ title: 'Error', description: error.message || 'Failed to process PDF', variant: 'destructive' });
    } finally {
      setPdfLoading(false);
    }
  };

  const handleSaveQuiz = async () => {
    if (!title.trim() || generatedQuestions.length === 0) {
      toast({ title: 'Error', description: 'Please generate questions first', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const code = generateJoinCode();

      const { data: quiz, error: quizError } = await supabase
        .from('quizzes')
        .insert({
          title,
          description,
          category_id: categoryId || null,
          course_id: courseId || null,
          creator_id: user!.id,
          difficulty,
          time_limit_seconds: 30,
          join_code: code,
          is_public: true,
        })
        .select()
        .single();

      if (quizError) throw quizError;

      const questionsToInsert = generatedQuestions.map((q, index) => ({
        quiz_id: quiz.id,
        question_text: q.question_text,
        options: q.options,
        correct_answer: q.correct_answer,
        explanation: q.explanation,
        points: q.points || 10,
        order_index: index,
      }));

      const { error: questionsError } = await supabase
        .from('questions')
        .insert(questionsToInsert);

      if (questionsError) throw questionsError;

      setJoinCode(code);
      setCreatedQuizId(quiz.id);

      toast({ title: 'Quiz Saved!', description: 'Your quiz is ready to share' });
    } catch (error: any) {
      console.error('Error saving quiz:', error);
      toast({ title: 'Error', description: error.message || 'Failed to save quiz', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const copyJoinCode = () => {
    navigator.clipboard.writeText(joinCode);
    toast({ title: 'Copied!', description: 'Join code copied to clipboard' });
  };

  if (!user) return null;

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
          className="max-w-4xl mx-auto"
        >
          <h1 className="text-3xl font-bold font-display text-foreground mb-8">Create Quiz</h1>

          {createdQuizId ? (
            <Card className="glass-card p-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', bounce: 0.5 }}
              >
                <Sparkles className="w-16 h-16 text-primary mx-auto mb-4" />
              </motion.div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Quiz Created!</h2>
              <p className="text-muted-foreground mb-6">Share this code with others to let them join</p>
              
              <div className="flex items-center justify-center gap-4 mb-8">
                <div className="text-4xl font-display font-bold text-primary tracking-widest">
                  {joinCode}
                </div>
                <Button variant="outline" size="icon" onClick={copyJoinCode}>
                  <Copy className="w-5 h-5" />
                </Button>
              </div>

              <div className="flex gap-4 justify-center">
                <Button onClick={() => navigate(`/quiz/${createdQuizId}`)}>
                  Play Now
                </Button>
                <Button variant="outline" onClick={() => {
                  setCreatedQuizId(null);
                  setJoinCode('');
                  setGeneratedQuestions([]);
                  setTitle('');
                  setDescription('');
                }}>
                  Create Another
                </Button>
              </div>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* AI Generation Section */}
              <Card className="glass-card p-6">
                <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Generate with AI
                </h2>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <Input
                      placeholder="Enter topic (e.g., React Hooks, World War 2)"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                    />

                    <Select value={categoryId} onValueChange={setCategoryId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {courses.length > 0 && (
                      <Select value={courseId} onValueChange={setCourseId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select course (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          {courses.map((course) => (
                            <SelectItem key={course.id} value={course.id}>
                              {course.name} ({course.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  <div className="space-y-4">
                    <Select value={difficulty} onValueChange={setDifficulty}>
                      <SelectTrigger>
                        <SelectValue placeholder="Difficulty" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={numQuestions.toString()} onValueChange={(v) => setNumQuestions(parseInt(v))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Number of questions" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10 Questions</SelectItem>
                        <SelectItem value="20">20 Questions</SelectItem>
                        <SelectItem value="30">30 Questions</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button
                      className="w-full btn-gaming"
                      onClick={handleGenerateQuiz}
                      disabled={loading || !topic.trim()}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Generate Quiz
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </Card>

              {/* PDF Upload Section */}
              <Card className="glass-card p-6">
                <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Upload PDF
                </h2>

                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handlePdfUpload}
                    className="hidden"
                    id="pdf-upload"
                    disabled={pdfLoading}
                  />
                  <label
                    htmlFor="pdf-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    {pdfLoading ? (
                      <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                    ) : (
                      <Upload className="w-12 h-12 text-muted-foreground mb-4" />
                    )}
                    <span className="text-foreground font-medium">
                      {pdfLoading ? 'Processing PDF...' : 'Click to upload PDF'}
                    </span>
                    <span className="text-muted-foreground text-sm mt-1">
                      AI will extract questions from your document
                    </span>
                  </label>
                </div>
              </Card>

              {/* Generated Questions Preview */}
              {generatedQuestions.length > 0 && (
                <Card className="glass-card p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-foreground">
                      Generated Questions ({generatedQuestions.length})
                    </h2>
                    <Button onClick={handleSaveQuiz} disabled={loading}>
                      {loading ? 'Saving...' : 'Save & Create Quiz'}
                    </Button>
                  </div>

                  <div className="space-y-2 mb-4">
                    <Input
                      placeholder="Quiz Title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                    <Textarea
                      placeholder="Quiz Description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={2}
                    />
                  </div>

                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {generatedQuestions.map((q, index) => (
                      <div key={index} className="bg-background/50 rounded-lg p-4">
                        <p className="font-medium text-foreground mb-2">
                          {index + 1}. {q.question_text}
                        </p>
                        <ul className="space-y-1 text-sm">
                          {q.options.map((opt, optIndex) => (
                            <li
                              key={optIndex}
                              className={`pl-4 ${optIndex === q.correct_answer ? 'text-success font-medium' : 'text-muted-foreground'}`}
                            >
                              {String.fromCharCode(65 + optIndex)}. {opt}
                              {optIndex === q.correct_answer && ' ✓'}
                            </li>
                          ))}
                        </ul>
                        {q.explanation && (
                          <p className="text-xs text-muted-foreground mt-2 italic">
                            {q.explanation}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/layout/Navbar';
import { 
  Upload, Sparkles, FileText, Copy, ArrowLeft, Loader2, 
  ChevronRight, ChevronLeft, Check, BookOpen, Target, Settings,
  Trash2, Edit2, Plus
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.js`;

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

type WizardStep = 'source' | 'topic' | 'settings' | 'questions' | 'complete';

export default function CreateQuizPage() {
  const [step, setStep] = useState<WizardStep>('source');
  const [sourceType, setSourceType] = useState<'ai' | 'pdf' | null>(null);
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
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[]>([]);
  const [joinCode, setJoinCode] = useState('');
  const [createdQuizId, setCreatedQuizId] = useState<string | null>(null);
  const [pdfFileName, setPdfFileName] = useState('');
  const [pdfText, setPdfText] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const steps: { id: WizardStep; label: string; icon: React.ReactNode }[] = [
    { id: 'source', label: 'Source', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'topic', label: 'Topic', icon: <Target className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
    { id: 'questions', label: 'Review', icon: <FileText className="w-4 h-4" /> },
    { id: 'complete', label: 'Done', icon: <Check className="w-4 h-4" /> },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === step);

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

  // Extract text from PDF using PDF.js
  const extractPdfText = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n\n';
    }

    return fullText;
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast({ title: 'Error', description: 'Please upload a PDF file', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const extractedText = await extractPdfText(file);
      setPdfText(extractedText);
      setPdfFileName(file.name);
      
      // Auto-detect topic from filename
      const topicFromFile = file.name.replace('.pdf', '').replace(/[-_]/g, ' ');
      if (!topic) setTopic(topicFromFile);
      
      toast({ 
        title: 'PDF Loaded!', 
        description: `Extracted ${extractedText.length} characters from ${file.name}` 
      });
      
      // Move to topic step
      setStep('topic');
    } catch (error: any) {
      console.error('Error reading PDF:', error);
      toast({ title: 'Error', description: 'Failed to read PDF. Please try another file.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQuiz = async () => {
    if (sourceType === 'ai' && !topic.trim()) {
      toast({ title: 'Error', description: 'Please enter a topic', variant: 'destructive' });
      return;
    }

    if (sourceType === 'pdf' && !pdfText) {
      toast({ title: 'Error', description: 'Please upload a PDF first', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const selectedCourse = courses.find(c => c.id === courseId);
      const selectedCategory = categories.find(c => c.id === categoryId);

      let response;
      if (sourceType === 'pdf') {
        response = await supabase.functions.invoke('parse-pdf-quiz', {
          body: {
            pdfText,
            numQuestions,
            difficulty,
            topic: topic.trim() || undefined,
          },
        });
      } else {
        response = await supabase.functions.invoke('generate-quiz', {
          body: {
            topic,
            difficulty,
            numQuestions,
            category: selectedCategory?.name,
            course: selectedCourse?.name,
          },
        });
      }

      if (response.error) throw response.error;

      const data = response.data;
      setTitle(data.title || `Quiz: ${topic || pdfFileName}`);
      setDescription(data.description || '');
      setGeneratedQuestions(data.questions || []);
      setStep('questions');

      toast({ title: 'Questions Generated!', description: `${data.questions?.length || 0} questions created` });
    } catch (error: any) {
      console.error('Error generating quiz:', error);
      toast({ title: 'Error', description: error.message || 'Failed to generate quiz', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveQuiz = async () => {
    if (!title.trim() || generatedQuestions.length === 0) {
      toast({ title: 'Error', description: 'Please add questions first', variant: 'destructive' });
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
      setStep('complete');

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

  const deleteQuestion = (index: number) => {
    setGeneratedQuestions(prev => prev.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, field: string, value: any) => {
    setGeneratedQuestions(prev => prev.map((q, i) => 
      i === index ? { ...q, [field]: value } : q
    ));
  };

  const addNewQuestion = () => {
    setGeneratedQuestions(prev => [...prev, {
      question_text: 'New Question?',
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correct_answer: 0,
      explanation: '',
      points: 10,
    }]);
    setEditingIndex(generatedQuestions.length);
  };

  const canProceed = () => {
    switch (step) {
      case 'source': return sourceType !== null;
      case 'topic': return sourceType === 'pdf' ? !!pdfText : !!topic.trim();
      case 'settings': return true;
      case 'questions': return generatedQuestions.length > 0 && !!title.trim();
      default: return true;
    }
  };

  const goNext = () => {
    if (step === 'settings') {
      handleGenerateQuiz();
    } else if (step === 'questions') {
      handleSaveQuiz();
    } else {
      const nextIndex = currentStepIndex + 1;
      if (nextIndex < steps.length) {
        setStep(steps[nextIndex].id);
      }
    }
  };

  const goBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setStep(steps[prevIndex].id);
    }
  };

  const resetWizard = () => {
    setStep('source');
    setSourceType(null);
    setTitle('');
    setDescription('');
    setTopic('');
    setDifficulty('medium');
    setNumQuestions(10);
    setCategoryId('');
    setCourseId('');
    setGeneratedQuestions([]);
    setJoinCode('');
    setCreatedQuizId(null);
    setPdfFileName('');
    setPdfText('');
    setEditingIndex(null);
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
          <h1 className="text-3xl font-bold font-display text-foreground mb-2">Create Quiz</h1>
          <p className="text-muted-foreground mb-8">Follow the steps to create your perfect quiz</p>

          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-8 relative">
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-border -translate-y-1/2" />
            <div 
              className="absolute top-1/2 left-0 h-0.5 bg-primary -translate-y-1/2 transition-all duration-500"
              style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
            />
            {steps.map((s, idx) => (
              <div 
                key={s.id}
                className={`relative z-10 flex flex-col items-center ${
                  idx <= currentStepIndex ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    idx < currentStepIndex 
                      ? 'bg-primary text-primary-foreground' 
                      : idx === currentStepIndex 
                        ? 'bg-primary text-primary-foreground animate-pulse-glow' 
                        : 'bg-card border-2 border-border'
                  }`}
                >
                  {idx < currentStepIndex ? <Check className="w-5 h-5" /> : s.icon}
                </div>
                <span className="text-xs mt-2 hidden sm:block">{s.label}</span>
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {/* Step 1: Source Selection */}
            {step === 'source' && (
              <motion.div
                key="source"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <Card className="glass-card p-8">
                  <h2 className="text-xl font-semibold text-foreground mb-6 text-center">
                    How would you like to create your quiz?
                  </h2>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <button
                      onClick={() => setSourceType('ai')}
                      className={`p-8 rounded-xl border-2 transition-all text-left ${
                        sourceType === 'ai' 
                          ? 'border-primary bg-primary/10 glow-primary' 
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <Sparkles className={`w-12 h-12 mb-4 ${sourceType === 'ai' ? 'text-primary' : 'text-muted-foreground'}`} />
                      <h3 className="text-lg font-semibold text-foreground mb-2">AI Generation</h3>
                      <p className="text-muted-foreground text-sm">
                        Enter a topic and let AI create questions automatically based on your specifications.
                      </p>
                    </button>

                    <button
                      onClick={() => {
                        setSourceType('pdf');
                        fileInputRef.current?.click();
                      }}
                      className={`p-8 rounded-xl border-2 transition-all text-left ${
                        sourceType === 'pdf' 
                          ? 'border-primary bg-primary/10 glow-primary' 
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <FileText className={`w-12 h-12 mb-4 ${sourceType === 'pdf' ? 'text-primary' : 'text-muted-foreground'}`} />
                      <h3 className="text-lg font-semibold text-foreground mb-2">Upload PDF</h3>
                      <p className="text-muted-foreground text-sm">
                        Upload a document and AI will extract and create questions from its content.
                      </p>
                      {pdfFileName && (
                        <p className="text-primary text-sm mt-2 flex items-center gap-2">
                          <Check className="w-4 h-4" /> {pdfFileName}
                        </p>
                      )}
                    </button>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={handlePdfUpload}
                    className="hidden"
                    disabled={loading}
                  />
                </Card>
              </motion.div>
            )}

            {/* Step 2: Topic/Focus */}
            {step === 'topic' && (
              <motion.div
                key="topic"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <Card className="glass-card p-8">
                  <h2 className="text-xl font-semibold text-foreground mb-6">
                    {sourceType === 'pdf' ? 'Focus Your Quiz' : 'What topic should the quiz cover?'}
                  </h2>

                  {sourceType === 'pdf' && pdfFileName && (
                    <div className="mb-6 p-4 bg-primary/10 rounded-lg border border-primary/30">
                      <div className="flex items-center gap-3">
                        <FileText className="w-8 h-8 text-primary" />
                        <div>
                          <p className="font-medium text-foreground">{pdfFileName}</p>
                          <p className="text-sm text-muted-foreground">
                            {pdfText.length.toLocaleString()} characters extracted
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-muted-foreground mb-2 block">
                        {sourceType === 'pdf' ? 'Focus topic (optional - helps AI focus on specific content)' : 'Topic *'}
                      </label>
                      <Input
                        placeholder={sourceType === 'pdf' 
                          ? "e.g., Chapter 3: Neural Networks" 
                          : "e.g., React Hooks, World War 2, Machine Learning"
                        }
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        className="text-lg"
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-muted-foreground mb-2 block">Category (optional)</label>
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
                      </div>

                      {courses.length > 0 && (
                        <div>
                          <label className="text-sm text-muted-foreground mb-2 block">Course (optional)</label>
                          <Select value={courseId} onValueChange={setCourseId}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select course" />
                            </SelectTrigger>
                            <SelectContent>
                              {courses.map((course) => (
                                <SelectItem key={course.id} value={course.id}>
                                  {course.name} ({course.code})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Step 3: Settings */}
            {step === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <Card className="glass-card p-8">
                  <h2 className="text-xl font-semibold text-foreground mb-6">Quiz Settings</h2>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm text-muted-foreground mb-2 block">Difficulty Level</label>
                      <div className="grid grid-cols-3 gap-2">
                        {['easy', 'medium', 'hard'].map((d) => (
                          <button
                            key={d}
                            onClick={() => setDifficulty(d)}
                            className={`py-3 px-4 rounded-lg border-2 capitalize transition-all ${
                              difficulty === d 
                                ? 'border-primary bg-primary/10 text-primary' 
                                : 'border-border hover:border-primary/50 text-foreground'
                            }`}
                          >
                            {d}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm text-muted-foreground mb-2 block">Number of Questions</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[10, 20, 30].map((n) => (
                          <button
                            key={n}
                            onClick={() => setNumQuestions(n)}
                            className={`py-3 px-4 rounded-lg border-2 transition-all ${
                              numQuestions === n 
                                ? 'border-primary bg-primary/10 text-primary' 
                                : 'border-border hover:border-primary/50 text-foreground'
                            }`}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-card rounded-lg border border-border">
                    <h3 className="font-medium text-foreground mb-2">Summary</h3>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Source: {sourceType === 'pdf' ? `PDF (${pdfFileName})` : 'AI Generation'}</li>
                      <li>• Topic: {topic || 'General'}</li>
                      <li>• Difficulty: {difficulty}</li>
                      <li>• Questions: {numQuestions}</li>
                    </ul>
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Step 4: Questions Review */}
            {step === 'questions' && (
              <motion.div
                key="questions"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <Card className="glass-card p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-foreground">
                      Review & Edit Questions ({generatedQuestions.length})
                    </h2>
                    <Button variant="outline" size="sm" onClick={addNewQuestion}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Question
                    </Button>
                  </div>

                  <div className="space-y-4 mb-6">
                    <Input
                      placeholder="Quiz Title *"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="text-lg font-semibold"
                    />
                    <Textarea
                      placeholder="Quiz Description (optional)"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={2}
                    />
                  </div>

                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                    {generatedQuestions.map((q, index) => (
                      <motion.div 
                        key={index} 
                        layout
                        className="bg-background/50 rounded-lg p-4 border border-border"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            {editingIndex === index ? (
                              <div className="space-y-3">
                                <Textarea
                                  value={q.question_text}
                                  onChange={(e) => updateQuestion(index, 'question_text', e.target.value)}
                                  className="font-medium"
                                />
                                {q.options.map((opt, optIndex) => (
                                  <div key={optIndex} className="flex items-center gap-2">
                                    <button
                                      onClick={() => updateQuestion(index, 'correct_answer', optIndex)}
                                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                                        optIndex === q.correct_answer 
                                          ? 'border-success bg-success text-success-foreground' 
                                          : 'border-border'
                                      }`}
                                    >
                                      {optIndex === q.correct_answer && <Check className="w-3 h-3" />}
                                    </button>
                                    <Input
                                      value={opt}
                                      onChange={(e) => {
                                        const newOptions = [...q.options];
                                        newOptions[optIndex] = e.target.value;
                                        updateQuestion(index, 'options', newOptions);
                                      }}
                                      className="flex-1"
                                    />
                                  </div>
                                ))}
                                <Input
                                  placeholder="Explanation (optional)"
                                  value={q.explanation}
                                  onChange={(e) => updateQuestion(index, 'explanation', e.target.value)}
                                />
                                <Button size="sm" onClick={() => setEditingIndex(null)}>
                                  Done Editing
                                </Button>
                              </div>
                            ) : (
                              <>
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
                              </>
                            )}
                          </div>
                          
                          {editingIndex !== index && (
                            <div className="flex gap-2">
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => setEditingIndex(index)}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => deleteQuestion(index)}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Step 5: Complete */}
            {step === 'complete' && (
              <motion.div
                key="complete"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6"
              >
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
                    <Button variant="outline" onClick={resetWizard}>
                      Create Another
                    </Button>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Buttons */}
          {step !== 'complete' && (
            <div className="flex justify-between mt-8">
              <Button
                variant="outline"
                onClick={goBack}
                disabled={currentStepIndex === 0}
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back
              </Button>

              <Button
                onClick={goNext}
                disabled={!canProceed() || loading}
                className="btn-gaming"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {step === 'settings' ? 'Generating...' : step === 'questions' ? 'Saving...' : 'Loading...'}
                  </>
                ) : (
                  <>
                    {step === 'questions' ? 'Save Quiz' : step === 'settings' ? 'Generate Questions' : 'Continue'}
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}

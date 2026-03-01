"use client";

import { useState, useEffect } from "react";
import { gradeSubmission } from "@/lib/gemini";
import { generateShortPractice, updateBuffer, getBuffer, UserBuffer } from "@/lib/practice";
import { 
  Loader2, Sparkles, Trophy, BookOpen, AlertCircle, 
  ChevronRight, CheckCircle2, XCircle, Info, ArrowRight,
  PenTool, Brain, Bookmark, Plus, Trash2, Check
} from "lucide-react";
import { 
  generateExercise, gradeExercise, 
  Exercise, ExerciseGradingResponse, EXERCISE_CATEGORIES 
} from "@/lib/exercise";
import { getVault, addToVault, removeFromVault, VaultItem } from "@/lib/vault";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";

// Shared component for saving feedback
function SavedNoteButton({ onSave }: { onSave: () => Promise<void> }) {
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (isSaved || isSaving) return;
    setIsSaving(true);
    await onSave();
    setIsSaving(false);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <button 
      onClick={handleSave}
      disabled={isSaving}
      className={`absolute top-4 right-4 p-2 rounded-lg shadow-sm transition-all flex items-center gap-1 text-[10px] font-black uppercase tracking-tighter border ${
        isSaved 
          ? "bg-green-500 text-white border-green-600 scale-105" 
          : "bg-white border-amber-100 text-amber-500 hover:bg-amber-500 hover:text-white"
      }`}
    >
      {isSaving ? (
        <Loader2 size={14} className="animate-spin" />
      ) : isSaved ? (
        <>
          <Check size={14} />
          Saved!
        </>
      ) : (
        <>
          <Plus size={14} />
          Save to Vault
        </>
      )}
    </button>
  );
}

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"essay" | "exercise">("essay");
  const [buffer, setBuffer] = useState<UserBuffer>({ weaknesses: {}, mastered_vocab: [] });
  const [vault, setVault] = useState<VaultItem[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    setBuffer(getBuffer());
    // Fetch vault data on mount
    const initVault = async () => {
      const data = await getVault();
      setVault(data);
    };
    initVault();
  }, []);

  const refreshBuffer = () => setBuffer(getBuffer());
  const refreshVault = async () => {
    const data = await getVault();
    setVault(data);
  };

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin text-zinc-400" size={40} />
      </div>
    );
  }

  return (
    <main className="min-h-screen p-4 md:p-8 max-w-6xl mx-auto space-y-8 bg-[#fafafa]">
      <header className="flex flex-col md:flex-row items-center justify-between gap-4 border-b pb-6">
        <div className="text-center md:text-left space-y-1">
          <h1 className="font-serif text-3xl font-black tracking-tight text-zinc-900 flex items-center justify-center md:justify-start">
            Trust Me Bro I Didn't Use AI - IELTS Prep
          </h1>
          <p className="text-zinc-500 font-serif">Elevate your writing with precision feedback.</p>
        </div>
        
        <div className="flex bg-zinc-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab("essay")}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center ${
              activeTab === "essay" 
                ? "bg-white text-zinc-900 shadow-sm" 
                : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            <PenTool className="mr-2 h-4 w-4" />
            Essay Grader
          </button>
          <button
            onClick={() => setActiveTab("exercise")}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center ${
              activeTab === "exercise" 
                ? "bg-white text-zinc-900 shadow-sm" 
                : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            <Brain className="mr-2 h-4 w-4" />
            Micro-Exercises
          </button>
        </div>
      </header>

      {activeTab === "essay" ? (
        <EssayTab 
          buffer={buffer} 
          vault={vault}
          onBufferUpdate={refreshBuffer} 
          onVaultUpdate={refreshVault}
        />
      ) : (
        <ExerciseTab onVaultUpdate={refreshVault} />
      )}
    </main>
  );
}

function EssayTab({ 
  buffer, 
  vault,
  onBufferUpdate,
  onVaultUpdate
}: { 
  buffer: UserBuffer, 
  vault: VaultItem[],
  onBufferUpdate: () => void,
  onVaultUpdate: () => void
}) {
  const [taskType, setTaskType] = useState<"task1" | "task2">("task2");
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setError("");
  };

  const handleGrade = async () => {
    setIsLoading(true);
    setError("");
    setFeedback(null);
    try {
      const result = await gradeSubmission(prompt, response, taskType, imageFile);
      setFeedback(result);
      if (result.top_3_weaknesses) {
        updateBuffer(result.top_3_weaknesses);
        onBufferUpdate();
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong during grading.");
    } finally {
      setIsLoading(false);
    }
  };

  const startShortPractice = async () => {
    setIsGenerating(true);
    setError("");
    setFeedback(null);
    setResponse("");
    setImageFile(null);
    setImagePreview(null);
    try {
      const task = await generateShortPractice();
      setPrompt(`${task.instructions}\n\n${task.context}\n\n${task.prompt_text}`);
    } catch (err: any) {
      setError("Could not generate practice task. Is your API key correct?");
    } finally {
      setIsGenerating(false);
    }
  };

  const nextTask = () => {
    setFeedback(null);
    setResponse("");
    setPrompt("");
    setImageFile(null);
    setImagePreview(null);
  };

  const deleteFromVault = async (id: string) => {
    await removeFromVault(id);
    onVaultUpdate();
  };

  const displayPrompt = feedback?.prompt_text || prompt;
  const displayResponse = feedback?.user_response || response;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left: Stats & Vault */}
      <aside className="space-y-6 lg:col-span-1">
        {!feedback && (
          <div className="bg-white p-1 rounded-xl border flex mb-4">
            <button
              onClick={() => setTaskType("task1")}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                taskType === "task1" ? "bg-zinc-900 text-white shadow-md" : "text-zinc-500"
              }`}
            >
              IELTS Task 1
            </button>
            <button
              onClick={() => setTaskType("task2")}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                taskType === "task2" ? "bg-zinc-900 text-white shadow-md" : "text-zinc-500"
              }`}
            >
              IELTS Task 2
            </button>
          </div>
        )}

        {/* Learning Vault Sidebar */}
        <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
          <h2 className="font-bold flex items-center text-zinc-800">
            <Bookmark className="mr-2 h-4 w-4 text-amber-500 fill-amber-500" />
            Learning Vault
          </h2>
          {vault.length > 0 ? (
            <div className="space-y-3">
              {vault.slice(0, 5).map((item) => (
                <div key={item.id} className="p-3 bg-zinc-50 rounded-xl border border-zinc-100 group relative">
                  <div className="text-[10px] font-black uppercase text-amber-600 mb-1">{item.type.replace(/_/g, " ")}</div>
                  <p className="text-xs font-bold text-zinc-900 line-clamp-2">{item.after}</p>
                  <button 
                    onClick={() => deleteFromVault(item.id)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-zinc-400 hover:text-red-500"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
              {vault.length > 5 && (
                <p className="text-[10px] text-center text-zinc-400 font-bold uppercase tracking-widest pt-2">
                  + {vault.length - 5} more in history
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-zinc-400 italic text-center py-4 leading-relaxed">
              Grade an essay and save improvements to build your mastery bank.
            </p>
          )}
        </div>
        
        {!feedback && (
          <div className="bg-blue-50 border-blue-100 border p-4 rounded-xl space-y-2">
            <h3 className="text-blue-800 font-bold text-sm flex items-center">
              <AlertCircle className="mr-2 h-4 w-4" />
              Pro Tip
            </h3>
            <p className="text-blue-700 text-xs leading-relaxed">
              {taskType === "task1" 
                ? "Task 1 requires describing visual data. Upload the graph image so the AI can compare your writing with the actual data."
                : "Task 2 is a formal essay. Focus on clear arguments and a strong position throughout your writing."}
            </p>
          </div>
        )}

        {!feedback && (
          <button
            onClick={startShortPractice}
            disabled={isGenerating}
            className="w-full px-4 py-3 bg-white border-2 border-zinc-900 text-zinc-900 rounded-xl hover:bg-zinc-50 flex items-center justify-center font-bold transition-all disabled:opacity-50"
          >
            {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BookOpen className="mr-2 h-4 w-4" />}
            Quick Essay Practice
          </button>
        )}
      </aside>

      {/* Right: Workspace */}
      <div className="lg:col-span-2 space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-700">Practice Prompt</label>
            {feedback ? (
              <div className="w-full p-4 rounded-xl border-zinc-100 bg-zinc-50 text-zinc-600 text-sm italic">
                {displayPrompt}
              </div>
            ) : (
              <textarea
                className="w-full h-32 p-4 rounded-xl border-zinc-200 bg-white shadow-sm focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 transition-all outline-none"
                placeholder={taskType === "task1" ? "Describe the graph/chart..." : "Paste an IELTS Task 2 prompt here..."}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
            )}
          </div>

          {taskType === "task1" && !feedback && (
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-700">Graph/Chart Image</label>
              <div className="flex flex-col gap-4 p-4 border-2 border-dashed border-zinc-200 rounded-xl bg-white">
                {imagePreview ? (
                  <div className="relative group">
                    <img src={imagePreview} alt="Graph preview" className="max-h-64 mx-auto rounded-lg" />
                    <button 
                      onClick={() => { setImageFile(null); setImagePreview(null); }}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <XCircle className="h-5 w-5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-zinc-400">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                    />
                    <label htmlFor="image-upload" className="cursor-pointer flex flex-col items-center group">
                      <div className="p-4 rounded-full bg-zinc-50 group-hover:bg-zinc-100 transition-colors mb-2">
                        <Sparkles className="h-8 w-8 text-zinc-300 group-hover:text-zinc-400" />
                      </div>
                      <span className="text-sm font-medium group-hover:text-zinc-600">Click to upload the graph image</span>
                    </label>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-zinc-700">Your Response</label>
          {feedback ? (
            <div className="w-full p-8 rounded-2xl border-zinc-100 bg-white shadow-sm font-serif text-lg leading-relaxed text-zinc-800 whitespace-pre-wrap">
              {displayResponse}
            </div>
          ) : (
            <textarea
              className="w-full h-80 p-6 rounded-xl border-zinc-200 bg-white shadow-sm font-serif text-lg leading-relaxed focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 transition-all outline-none"
              placeholder="Start writing your response here..."
              value={response}
              onChange={(e) => setResponse(e.target.value)}
            />
          )}
        </div>

        {!feedback && (
          <button
            onClick={handleGrade}
            disabled={isLoading || !prompt || !response}
            className="w-full py-4 bg-zinc-900 text-white rounded-xl font-bold text-lg hover:bg-black transition-all disabled:opacity-50 flex items-center justify-center shadow-lg hover:shadow-xl active:scale-[0.98]"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Analyzing with Vibe...
              </>
            ) : (
              `Grade My ${taskType === "task1" ? "Report" : "Essay"}`
            )}
          </button>
        )}

        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 flex items-start">
            <AlertCircle className="mr-2 h-5 w-5 shrink-0 mt-0.5" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {feedback && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12 border-t pt-8">
            <div className="flex flex-col md:flex-row items-center justify-between p-6 bg-white border rounded-2xl shadow-sm gap-4">
              <div>
                <h2 className="text-2xl font-black text-zinc-900">Feedback Summary</h2>
                <p className="text-zinc-500 font-medium">{feedback.task_type === 'task1' ? 'Task 1 Report' : 'Task 2 Essay'} Mode</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-zinc-400 font-medium">Overall Band:</span>
                <div className="bg-zinc-900 text-white w-16 h-16 flex items-center justify-center rounded-2xl font-black text-3xl shadow-inner">
                  {feedback.overall_band_score}
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border shadow-sm">
              <h3 className="text-lg font-bold mb-3">Examiner's Note</h3>
              <p className="text-zinc-700 leading-relaxed italic border-l-4 pl-4 border-zinc-200">"{feedback.justification}"</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(feedback.pillars || {}).map(([key, value]: [string, any]) => {
                if (!value) return null;
                return (
                  <div key={key} className="p-5 bg-white border rounded-2xl hover:border-zinc-900 transition-colors group">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold capitalize text-zinc-800 group-hover:text-zinc-900">{key.replace(/_/g, " ")}</h4>
                      <span className="text-xl font-black text-zinc-900">{value.score}</span>
                    </div>
                    <p className="text-sm text-zinc-500 leading-snug">{value.feedback}</p>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Errors Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold flex items-center text-zinc-800">
                  <XCircle className="mr-2 h-5 w-5 text-red-500" />
                  Points to Correct
                </h3>
                <div className="space-y-3">
                  {(feedback.errors || []).map((error: any, idx: number) => (
                    <div key={idx} className="p-5 bg-white border border-red-50 rounded-2xl space-y-3 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-black uppercase tracking-widest text-red-400">{error.error_type}</span>
                        <div className="text-zinc-400 line-through text-sm font-medium">{error.original}</div>
                      </div>
                      <div className="text-zinc-900 font-bold text-lg bg-red-50/30 p-2 rounded-lg inline-block w-full flex items-center">
                        <ArrowRight className="h-4 w-4 mr-2 text-zinc-400" />
                        {error.suggestion}
                      </div>
                      <p className="text-xs text-zinc-500 italic">Reason: {error.issue}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Improvement Notes Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold flex items-center text-zinc-800">
                  <Sparkles className="mr-2 h-5 w-5 text-amber-500" />
                  Suggested Upgrades
                </h3>
                <div className="space-y-3">
                  {(feedback.improvement_notes || []).map((note: any, idx: number) => (
                    <div key={idx} className="p-5 bg-white border border-amber-50 rounded-2xl space-y-3 hover:shadow-md transition-shadow group relative">
                      <div className="text-xs font-black uppercase tracking-widest text-amber-500">{note.type.replace(/_/g, " ")}</div>
                      {note.before && (
                        <div className="text-zinc-400 text-sm italic">"{note.before}"</div>
                      )}
                      <div className="text-zinc-900 font-bold text-lg bg-amber-50/30 p-2 rounded-lg inline-block w-full flex items-center">
                        <ArrowRight className="h-4 w-4 mr-2 text-zinc-400" />
                        {note.after}
                      </div>
                      <p className="text-xs text-zinc-500">{note.reason}</p>
                      
                      <SavedNoteButton onSave={async () => {
                        await addToVault(note);
                        onVaultUpdate();
                      }} />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Improved Version */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-bold flex items-center text-zinc-800">
                <CheckCircle2 className="mr-2 h-5 w-5 text-zinc-900" />
                The Polished Version
              </h3>
              <div className="bg-zinc-900 text-zinc-100 p-8 rounded-3xl shadow-xl space-y-4 font-serif text-xl leading-relaxed">
                {feedback.improved_version}
              </div>
            </div>

            <button
              onClick={nextTask}
              className="w-full py-4 bg-zinc-100 text-zinc-900 border border-zinc-200 rounded-xl font-bold flex items-center justify-center hover:bg-zinc-200 transition-all gap-2 shadow-sm"
            >
              Start New Practice
              <ArrowRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ExerciseTab({ onVaultUpdate }: { onVaultUpdate: () => void }) {
  const [selectedCategory, setSelectedCategory] = useState<string>("lexical_resource");
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [userAnswer, setUserAnswer] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGrading, setIsGrading] = useState(false);
  const [gradingResult, setGradingResult] = useState<ExerciseGradingResponse | null>(null);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError("");
    setGradingResult(null);
    setUserAnswer("");
    try {
      const result = await generateExercise(selectedCategory);
      setExercise(result);
    } catch (err: any) {
      setError(err.message || "Failed to generate exercise. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGrade = async () => {
    if (!exercise || !userAnswer) return;
    setIsGrading(true);
    setError("");
    try {
      const result = await gradeExercise(exercise, userAnswer);
      setGradingResult(result);
    } catch (err: any) {
      setError("Failed to grade exercise. Please try again.");
    } finally {
      setIsGrading(false);
    }
  };

  const nextExercise = () => {
    setExercise(null);
    setGradingResult(null);
    setUserAnswer("");
  };

  const saveToVault = async (note: any) => {
    await addToVault(note);
    onVaultUpdate();
  };

  const displayExercise = gradingResult?.question || exercise;
  const displayAnswer = gradingResult?.user_answer || userAnswer;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Category Selection - Hide if exercise is active or graded */}
      {!exercise && !gradingResult && (
        <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4 animate-in fade-in duration-500">
          <h2 className="text-lg font-bold text-zinc-800">Choose a Skill to Practice</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(EXERCISE_CATEGORIES).map(([id, label]) => (
              <button
                key={id}
                onClick={() => setSelectedCategory(id)}
                className={`p-4 rounded-xl border text-sm font-bold transition-all text-left ${
                  selectedCategory === id 
                    ? "border-zinc-900 bg-zinc-900 text-white shadow-md" 
                    : "border-zinc-200 hover:border-zinc-400 bg-white text-zinc-600"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full py-4 bg-zinc-900 text-white rounded-xl font-bold flex items-center justify-center hover:bg-black transition-all disabled:opacity-50"
          >
            {isGenerating ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Brain className="mr-2 h-5 w-5" />}
            Generate New Exercise
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 flex items-center">
          <XCircle className="mr-2 h-5 w-5" />
          {error}
        </div>
      )}

      {displayExercise && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white p-8 rounded-2xl border shadow-sm space-y-6">
            <div className="space-y-2">
              <span className="px-3 py-1 bg-zinc-100 text-zinc-500 text-xs font-black uppercase rounded-full">
                {displayExercise.subcategory.replace(/_/g, " ")} • {displayExercise.topic}
              </span>
              <h3 className="text-xl font-bold text-zinc-900">{displayExercise.instruction}</h3>
            </div>
            
            <div className="p-6 bg-zinc-50 border border-zinc-100 rounded-xl font-serif text-lg text-zinc-800 italic leading-relaxed">
              "{displayExercise.stimulus}"
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-700">Your Answer</label>
              {gradingResult ? (
                <div className="w-full p-6 rounded-xl border-zinc-100 bg-zinc-50 font-serif text-lg leading-relaxed text-zinc-800 whitespace-pre-wrap">
                  {displayAnswer}
                </div>
              ) : (
                <textarea
                  className="w-full h-40 p-6 rounded-xl border-zinc-200 bg-white shadow-sm font-serif text-lg leading-relaxed focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 transition-all outline-none"
                  placeholder="Type your response here..."
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                />
              )}
            </div>

            {!gradingResult && (
              <button
                onClick={handleGrade}
                disabled={isGrading || !userAnswer}
                className="w-full py-4 bg-zinc-900 text-white rounded-xl font-bold flex items-center justify-center hover:bg-black transition-all disabled:opacity-50 shadow-lg"
              >
                {isGrading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <CheckCircle2 className="mr-2 h-5 w-5" />}
                Submit for Grading
              </button>
            )}
          </div>

          {gradingResult && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Summary Card */}
              <div className="bg-white p-6 rounded-2xl border shadow-sm flex items-center justify-between gap-6">
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-zinc-900">Task Performance</h3>
                  <p className="text-zinc-500">{gradingResult.feedback_summary}</p>
                </div>
                <div className={`flex flex-col items-center justify-center w-24 h-24 rounded-2xl shrink-0 font-black text-xs uppercase tracking-widest ${
                  gradingResult.task_completion === 'complete' ? 'bg-green-50 text-green-700 border border-green-100' :
                  gradingResult.task_completion === 'partial' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                  'bg-red-50 text-red-700 border border-red-100'
                }`}>
                  <span className="text-2xl mb-1">
                    {gradingResult.task_completion === 'complete' ? '100%' : 
                     gradingResult.task_completion === 'partial' ? '50%' : '0%'}
                  </span>
                  {gradingResult.task_completion}
                </div>
              </div>

              {/* Errors & Improvements */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-bold flex items-center text-zinc-800">
                    <XCircle className="mr-2 h-4 w-4 text-red-500" />
                    Points to Correct
                  </h4>
                  {gradingResult.errors.length > 0 ? (
                    gradingResult.errors.map((error, idx) => (
                      <div key={idx} className="p-4 bg-white border border-red-100 rounded-xl space-y-2">
                        <div className="flex justify-between items-start">
                          <span className="text-xs font-bold uppercase text-red-400">{error.error_type}</span>
                          <span className="text-zinc-400 line-through text-sm">{error.original}</span>
                        </div>
                        <div className="font-bold text-zinc-900 flex items-center">
                          <ArrowRight className="h-3 w-3 mr-2 text-zinc-400" />
                          {error.suggestion}
                        </div>
                        <p className="text-xs text-zinc-500 italic">Reason: {error.issue}</p>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 bg-green-50 text-green-700 border border-green-100 rounded-xl text-sm font-medium">
                      No errors found! Great job.
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <h4 className="font-bold flex items-center text-zinc-800">
                    <Sparkles className="mr-2 h-4 w-4 text-amber-500" />
                    Suggested Upgrades
                  </h4>
                  {gradingResult.improvement_notes.map((note, idx) => (
                    <div key={idx} className="p-4 bg-white border border-amber-100 rounded-xl space-y-2 group relative">
                      <div className="text-xs font-bold uppercase text-amber-500">{note.type.replace(/_/g, " ")}</div>
                      {note.before && (
                        <div className="text-zinc-400 text-sm italic">"{note.before}"</div>
                      )}
                      <div className="font-bold text-zinc-900 flex items-center">
                        <ArrowRight className="h-3 w-3 mr-2 text-zinc-400" />
                        {note.after}
                      </div>
                      <p className="text-xs text-zinc-500">{note.reason}</p>
                      
                      <SavedNoteButton onSave={async () => {
                        await addToVault(note);
                        onVaultUpdate();
                      }} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Improved Version */}
              <div className="bg-zinc-900 text-white p-8 rounded-2xl shadow-xl space-y-4">
                <h3 className="text-lg font-bold flex items-center text-zinc-400">
                  <CheckCircle2 className="mr-2 h-5 w-5 text-green-400" />
                  The Improved Version
                </h3>
                <p className="font-serif text-xl leading-relaxed">
                  {gradingResult.improved_version}
                </p>
              </div>

              <button
                onClick={nextExercise}
                className="w-full py-4 bg-zinc-100 text-zinc-900 border border-zinc-200 rounded-xl font-bold flex items-center justify-center hover:bg-zinc-200 transition-all gap-2 shadow-sm"
              >
                Next Exercise
                <ArrowRight size={18} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

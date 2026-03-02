"use client";

import Link from "next/link";
import { 
  PenTool, 
  Brain, 
  Bookmark, 
  ChevronRight, 
  Sparkles, 
  Trophy, 
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Zap
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

export default function LandingPage() {
  const { user, loading } = useAuth();

  return (
    <div className="min-h-screen bg-[#fafafa] text-zinc-900 font-sans">
      {/* Navigation */}
      <nav className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-zinc-900 text-white p-1.5 rounded-lg">
            <PenTool size={20} />
          </div>
          <span className="font-serif text-xl font-black tracking-tight">YeahIWroteThis</span>
        </div>
        <div className="flex items-center gap-6">
          {!loading && user ? (
            <Link 
              href="/practice" 
              className="px-5 py-2.5 bg-zinc-900 text-white rounded-xl font-bold text-sm hover:bg-black transition-all flex items-center gap-2 shadow-sm"
            >
              Go to Dashboard
              <ArrowRight size={16} />
            </Link>
          ) : (
            <>
              <Link href="/login" className="text-sm font-bold text-zinc-500 hover:text-zinc-900 transition-colors">
                Sign In
              </Link>
              <Link 
                href="/register" 
                className="px-5 py-2.5 bg-zinc-900 text-white rounded-xl font-bold text-sm hover:bg-black transition-all shadow-sm"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-5xl mx-auto px-6 pt-20 pb-32 text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-100 rounded-full text-amber-700 text-xs font-black uppercase tracking-widest animate-in fade-in slide-in-from-bottom-2 duration-700">
          <Sparkles size={14} />
          Powered by Gemini AI
        </div>
        <h1 className="text-5xl md:text-7xl font-serif font-black tracking-tight text-zinc-900 leading-[1.1] animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
          Trust Me Bro,<br />
          <span className="text-zinc-400 italic">I Didn't Use AI.</span>
        </h1>
        <p className="max-w-2xl mx-auto text-lg md:text-xl text-zinc-500 font-medium leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
          The open-source IELTS prep tool that actually helps you write better. Get granular feedback, targeted exercises, and native-level rewrites.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
          <Link 
            href={user ? "/practice" : "/register"} 
            className="w-full sm:w-auto px-8 py-4 bg-zinc-900 text-white rounded-2xl font-bold text-lg hover:bg-black transition-all flex items-center justify-center gap-2 shadow-xl hover:shadow-2xl hover:-translate-y-1 active:scale-95"
          >
            Try out my demo
            <ChevronRight size={20} />
          </Link>
          <a 
            href="https://github.com" 
            target="_blank" 
            className="w-full sm:w-auto px-8 py-4 bg-white border border-zinc-200 text-zinc-600 rounded-2xl font-bold text-lg hover:bg-zinc-50 transition-all flex items-center justify-center gap-2"
          >
            Star on GitHub
          </a>
        </div>
        
        {/* Social Proof/Stats */}
        <div className="pt-12 flex flex-wrap items-center justify-center gap-8 md:gap-16 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
          <div className="flex items-center gap-2">
            <Trophy size={24} />
            <span className="font-bold">Band 8.5+ Focus maybe</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck size={24} />
            <span className="font-bold">Privacy First</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap size={24} />
            <span className="font-bold">Instant Feedback</span>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="bg-white border-y border-zinc-100 py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center space-y-4 mb-20">
            <h2 className="text-3xl md:text-4xl font-serif font-black tracking-tight">Everything you need to ace IELTS.</h2>
            <p className="text-zinc-500 font-medium max-w-xl mx-auto">We focused on the three most critical pillars of writing improvement.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-8 rounded-3xl bg-[#fafafa] border border-zinc-100 space-y-6 hover:shadow-lg transition-all group">
              <div className="w-14 h-14 bg-zinc-900 text-white rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <PenTool size={28} />
              </div>
              <div className="space-y-3">
                <h3 className="text-xl font-bold">Full Essay Grader</h3>
                <p className="text-zinc-500 leading-relaxed">
                  Submit Task 1 & 2 essays and get examiner-style feedback. We break down your score by the four official IELTS pillars.
                </p>
              </div>
              <ul className="space-y-3 pt-4">
                {['Line-by-line corrections', 'Native-level rewrites', 'Estimated band score'].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm font-bold text-zinc-700">
                    <CheckCircle2 size={18} className="text-zinc-900" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Feature 2 */}
            <div className="p-8 rounded-3xl bg-[#fafafa] border border-zinc-100 space-y-6 hover:shadow-lg transition-all group">
              <div className="w-14 h-14 bg-zinc-900 text-white rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <Brain size={28} />
              </div>
              <div className="space-y-3">
                <h3 className="text-xl font-bold">Micro-Exercises</h3>
                <p className="text-zinc-500 leading-relaxed">
                  Short on time? Practice specific skills like Lexical Resource or Cohesion with AI-generated 10-minute drills.
                </p>
              </div>
              <ul className="space-y-3 pt-4">
                {['Targeted skill building', 'Immediate AI rating', 'Topic-specific prompts'].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm font-bold text-zinc-700">
                    <CheckCircle2 size={18} className="text-zinc-900" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Feature 3 */}
            <div className="p-8 rounded-3xl bg-[#fafafa] border border-zinc-100 space-y-6 hover:shadow-lg transition-all group">
              <div className="w-14 h-14 bg-zinc-900 text-white rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <Bookmark size={28} />
              </div>
              <div className="space-y-3">
                <h3 className="text-xl font-bold">Learning Vault</h3>
                <p className="text-zinc-500 leading-relaxed">
                  Never forget a correction. Save advanced vocabulary and grammatical fixes directly to your personal mastery bank.
                </p>
              </div>
              <ul className="space-y-3 pt-4">
                {['One-click saving', 'Personalized vocab bank', 'Review history anytime'].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm font-bold text-zinc-700">
                    <CheckCircle2 size={18} className="text-zinc-900" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6">
        <div className="max-w-4xl mx-auto bg-zinc-900 rounded-[3rem] p-12 md:p-20 text-center space-y-8 shadow-2xl relative overflow-hidden">
          {/* Decorative Elements */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-zinc-800 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl opacity-50" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-zinc-800 rounded-full translate-x-1/2 translate-y-1/2 blur-3xl opacity-50" />
          
          <h2 className="text-3xl md:text-5xl font-serif font-black text-white relative z-10">
            Ready to reach your<br />target band score? (Not guaranteed)
          </h2>
          <p className="text-zinc-400 font-medium text-lg relative z-10">
            Join me and other students(non for now) building their writing confidence with precision AI feedback.
          </p>
          <div className="pt-4 relative z-10">
            <Link 
              href={user ? "/practice" : "/register"} 
              className="px-10 py-5 bg-white text-zinc-900 rounded-2xl font-black text-xl hover:bg-zinc-100 transition-all inline-flex items-center gap-3 shadow-xl active:scale-95"
            >
              Start for Free
              <ArrowRight size={24} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-zinc-100 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2 grayscale opacity-50">
          <div className="bg-zinc-900 text-white p-1 rounded-md">
            <PenTool size={16} />
          </div>
          <span className="font-serif font-black tracking-tight">YeahIWroteThis</span>
        </div>
        <div className="flex items-center gap-8 text-sm font-bold text-zinc-400">
          <a href="#" className="hover:text-zinc-900 transition-colors">Privacy</a>
          <a href="#" className="hover:text-zinc-900 transition-colors">Terms</a>
          <a href="https://github.com" className="hover:text-zinc-900 transition-colors">GitHub</a>
        </div>
        <p className="text-sm text-zinc-400 font-medium">
          © 2026 YeahIWroteThis AI. Open Source.
        </p>
      </footer>
    </div>
  );
}

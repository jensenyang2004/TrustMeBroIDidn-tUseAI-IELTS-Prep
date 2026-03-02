"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Trophy, 
  Calendar, 
  Clock, 
  ChevronRight,
  TrendingUp,
  FileText,
  Activity,
  Bookmark,
  ChevronLeft,
  ArrowRight,
  Trash2,
  Loader2
} from "lucide-react";
import { getVault, VaultItem, removeFromVault } from "@/lib/vault";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

export default function UserPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [vault, setVault] = useState<VaultItem[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [activity, setActivity] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      if (!token) {
        setIsLoading(false);
        return;
      }

      const headers = { "Authorization": `Bearer ${token}` };

      try {
        const [vaultData, historyData, statsData, activityData] = await Promise.all([
          getVault(),
          fetch(`${API_URL}/api/user/history`, { headers }).then(res => res.json()),
          fetch(`${API_URL}/api/user/stats`, { headers }).then(res => res.json()),
          fetch(`${API_URL}/api/user/activity`, { headers }).then(res => res.json())
        ]);
        setVault(vaultData);
        setHistory(historyData);
        setStats(statsData);
        setActivity(activityData);
      } catch (error) {
        console.error("Failed to fetch user data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    if (user) {
      fetchData();
    }
  }, [user]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === 'left' 
        ? scrollLeft - clientWidth / 2 
        : scrollLeft + clientWidth / 2;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  const deleteFromVault = async (id: string) => {
    const ok = await removeFromVault(id);
    if (ok) {
      setVault(await getVault());
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin text-zinc-400" size={40} />
      </div>
    );
  }

  // Activity Grid Logic
  const weeks = 12;
  const days = 7;
  const today = new Date();
  
  return (
    <div className="p-8 max-w-5xl mx-auto space-y-10 pb-20">
      {/* Header Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
            <Trophy size={24} />
          </div>
          <div>
            <p className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Avg. Band</p>
            <p className="text-2xl font-black text-zinc-900">{stats?.avg_band || "0.0"}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
            <Activity size={24} />
          </div>
          <div>
            <p className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Total Tasks</p>
            <p className="text-2xl font-black text-zinc-900">{stats?.total_tasks || 0}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-green-50 rounded-xl text-green-600">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Credits</p>
            <p className="text-2xl font-black text-zinc-900">{stats?.credits || 0}</p>
          </div>
        </div>
      </div>

      {/* Learning Vault Horizontal Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
            <Bookmark className="text-amber-500 fill-amber-500" size={20} />
            Learning Vault
          </h2>
          <div className="flex gap-2">
            <button 
              onClick={() => scroll('left')}
              className="p-2 bg-white border rounded-full hover:bg-zinc-50 transition-colors shadow-sm"
            >
              <ChevronLeft size={16} />
            </button>
            <button 
              onClick={() => scroll('right')}
              className="p-2 bg-white border rounded-full hover:bg-zinc-50 transition-colors shadow-sm"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div 
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth pb-4 px-1"
        >
          {vault.length > 0 ? (
            vault.map((item) => (
              <div 
                key={item.id} 
                className="min-w-[300px] bg-white p-6 rounded-2xl border shadow-sm space-y-3 hover:border-amber-200 transition-colors relative group"
              >
                <div className="flex justify-between items-start">
                  <span className="px-2 py-0.5 bg-amber-50 text-amber-600 text-[10px] font-black uppercase rounded-md tracking-tighter">
                    {item.type.replace(/_/g, " ")}
                  </span>
                  <button 
                    onClick={() => deleteFromVault(item.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-300 hover:text-red-500"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="space-y-2">
                  {item.before && (
                    <div className="text-xs text-zinc-400 line-through italic">"{item.before}"</div>
                  )}
                  <div className="font-bold text-zinc-900 flex items-start gap-2">
                    <ArrowRight className="h-3 w-3 mt-1 shrink-0 text-amber-500" />
                    <span className="leading-tight">{item.after}</span>
                  </div>
                </div>
                <p className="text-[11px] text-zinc-500 leading-relaxed border-t pt-3">
                  {item.reason}
                </p>
              </div>
            ))
          ) : (
            <div className="w-full bg-zinc-50 border border-dashed border-zinc-200 rounded-2xl py-12 flex flex-col items-center justify-center text-zinc-400">
              <Bookmark size={32} className="mb-2 opacity-20" />
              <p className="text-sm italic">No items in your vault yet.</p>
            </div>
          )}
        </div>
      </section>

      {/* Contribution Grid Section */}
      <section className="bg-white p-8 rounded-2xl border shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
            <Calendar className="text-zinc-400" size={20} />
            Practice Activity
          </h2>
          <div className="flex items-center gap-2 text-xs font-medium text-zinc-400">
            <span>Less</span>
            <div className="flex gap-1">
              <div className="w-3 h-3 rounded-sm bg-zinc-50 border border-zinc-100" />
              <div className="w-3 h-3 rounded-sm bg-zinc-200" />
              <div className="w-3 h-3 rounded-sm bg-zinc-400" />
              <div className="w-3 h-3 rounded-sm bg-zinc-600" />
              <div className="w-3 h-3 rounded-sm bg-zinc-900" />
            </div>
            <span>More</span>
          </div>
        </div>

        <div className="flex gap-1 overflow-x-auto pb-2 no-scrollbar">
          {Array.from({ length: weeks }).map((_, w) => (
            <div key={w} className="flex flex-col gap-1 shrink-0">
              {Array.from({ length: days }).map((_, d) => {
                // Calculate date for this cell
                const date = new Date();
                date.setDate(today.getDate() - ((weeks - 1 - w) * 7 + (6 - d)));
                const dateKey = date.toISOString().split('T')[0];
                const count = activity[dateKey] || 0;
                
                const colors = [
                  "bg-zinc-50 border border-zinc-100",
                  "bg-zinc-200",
                  "bg-zinc-400",
                  "bg-zinc-600",
                  "bg-zinc-900"
                ];
                const colorIdx = Math.min(count, 4);
                
                return (
                  <div 
                    key={d} 
                    className={`w-3.5 h-3.5 rounded-sm transition-colors cursor-pointer hover:ring-1 hover:ring-zinc-300 ${colors[colorIdx]}`}
                    title={`${dateKey}: ${count} activities`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </section>

      {/* History List */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
          <Clock className="text-zinc-400" size={20} />
          Recent Submissions
        </h2>
        <div className="grid gap-3">
          {history.length > 0 ? (
            history.map((item) => (
              <div 
                key={item.id} 
                className="bg-white p-5 rounded-2xl border shadow-sm hover:shadow-md transition-all flex items-center justify-between group cursor-pointer active:scale-[0.99]"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl transition-colors ${
                    item.type.includes("Task") ? "bg-zinc-900 text-white group-hover:bg-black" : "bg-zinc-100 text-zinc-500 group-hover:bg-zinc-200"
                  }`}>
                    <FileText size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-zinc-900 line-clamp-1 max-w-md">{item.topic}</h3>
                    <div className="flex items-center gap-2 text-xs font-medium text-zinc-500 uppercase tracking-widest">
                      <span>{item.type}</span>
                      <span>•</span>
                      <span>{item.date}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Score</p>
                    <p className="text-lg font-black text-zinc-900">{item.score}</p>
                  </div>
                  <ChevronRight className="text-zinc-300 group-hover:text-zinc-900 transition-colors" size={20} />
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-zinc-400 italic bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
              No submissions yet. Start your first practice!
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

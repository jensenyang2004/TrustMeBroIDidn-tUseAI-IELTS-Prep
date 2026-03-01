"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  PenTool, 
  History, 
  Settings, 
  User as UserIcon,
  LogOut,
  Coins,
  Loader2
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./AuthProvider";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const [credits, setCredits] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCredits = async () => {
    try {
      const res = await fetch("http://localhost:5001/api/user/credits");
      const data = await res.json();
      setCredits(data.credits);
    } catch (err) {
      console.error("Failed to fetch credits");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCredits();
    const interval = setInterval(fetchCredits, 5000);
    return () => clearInterval(interval);
  }, [pathname]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const navItems = [
    { name: "Practice", href: "/", icon: PenTool },
    { name: "History", href: "/user", icon: History },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <div className="flex flex-col h-screen w-64 bg-white border-r border-zinc-200 sticky top-0">
      {/* User Profile Header */}
      <div className="p-6 border-b border-zinc-100 flex flex-col items-center">
        <div className="w-20 h-20 rounded-full bg-zinc-100 border-2 border-zinc-200 overflow-hidden mb-3">
          <div className="w-full h-full flex items-center justify-center text-zinc-400">
            {user?.user_metadata?.avatar_url ? (
              <img src={user.user_metadata.avatar_url} alt="User" className="w-full h-full object-cover" />
            ) : (
              <UserIcon size={40} />
            )}
          </div>
        </div>
        <h2 className="font-bold text-zinc-900 line-clamp-1">
          {user?.user_metadata?.full_name || user?.email?.split('@')[0] || "IELTS Candidate"}
        </h2>
        <p className="text-xs text-zinc-500 font-medium mb-4">Band 7.5 Target</p>
        
        {/* Credits Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 rounded-full border border-amber-100">
          <Coins size={14} className="text-amber-600" />
          <span className="text-xs font-black text-amber-700">
            {isLoading ? <Loader2 size={10} className="animate-spin" /> : `${credits ?? 0} Credits`}
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                isActive 
                  ? "bg-zinc-900 text-white shadow-md" 
                  : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
              }`}
            >
              <Icon size={20} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-zinc-100">
        <button 
          onClick={handleSignOut}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 transition-all"
        >
          <LogOut size={20} />
          Sign Out
        </button>
      </div>
    </div>
  );
}

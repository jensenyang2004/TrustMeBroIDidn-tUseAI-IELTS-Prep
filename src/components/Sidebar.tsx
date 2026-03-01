"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  PenTool, 
  History, 
  Settings, 
  LayoutDashboard, 
  User,
  LogOut
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { name: "Practice", href: "/", icon: PenTool },
    { name: "History", href: "/user", icon: History },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <div className="flex flex-col h-screen w-64 bg-white border-r border-zinc-200">
      {/* User Profile Header */}
      <div className="p-6 border-b border-zinc-100 flex flex-col items-center">
        <div className="w-20 h-20 rounded-full bg-zinc-100 border-2 border-zinc-200 overflow-hidden mb-3">
          {/* Placeholder for user photo */}
          <div className="w-full h-full flex items-center justify-center text-zinc-400">
            <User size={40} />
          </div>
        </div>
        <h2 className="font-bold text-zinc-900">IELTS Candidate</h2>
        <p className="text-xs text-zinc-500 font-medium">Band 7.5 Target</p>
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
        <button className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 transition-all">
          <LogOut size={20} />
          Sign Out
        </button>
      </div>
    </div>
  );
}

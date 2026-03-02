"use client";

import { Settings as SettingsIcon, Loader2 } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function SettingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin text-zinc-400" size={40} />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-3 border-b pb-6">
        <div className="p-3 bg-zinc-100 rounded-xl text-zinc-900">
          <SettingsIcon size={24} />
        </div>
        <div>
          <h1 className="text-3xl font-black text-zinc-900">Settings</h1>
          <p className="text-zinc-500 font-medium">Manage your profile and preferences.</p>
        </div>
      </div>

      <div className="bg-white p-8 rounded-2xl border shadow-sm space-y-6 text-center py-20 text-zinc-400">
        <p className="italic">Settings options coming soon...</p>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sparkles, Loader2, Mail, Lock, User, XCircle } from "lucide-react";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        }
      }
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
      // Auto login after signup might require email confirmation to be disabled in Supabase
      if (data.session) {
        router.push("/");
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#fafafa]">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-black tracking-tight text-zinc-900 flex items-center justify-center">
            <Sparkles className="mr-2 text-amber-500 fill-amber-500" />
            IELTS Vibe Tutor
          </h1>
          <p className="text-zinc-500 font-medium font-serif">Start your journey to Band 8.0+</p>
        </div>

        <div className="bg-white p-8 rounded-3xl border shadow-xl space-y-6">
          {success ? (
            <div className="text-center space-y-4 py-4">
              <div className="p-4 bg-green-50 text-green-700 rounded-2xl border border-green-100 font-bold">
                Account created! Please check your email for a confirmation link.
              </div>
              <Link href="/login" className="block w-full py-4 bg-zinc-900 text-white rounded-xl font-bold">
                Go to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-700">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-3.5 h-5 w-5 text-zinc-400" />
                  <input
                    type="text"
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-xl border-zinc-200 bg-zinc-50 focus:ring-2 focus:ring-zinc-900 transition-all outline-none text-zinc-900"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-700">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 h-5 w-5 text-zinc-400" />
                  <input
                    type="email"
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-xl border-zinc-200 bg-zinc-50 focus:ring-2 focus:ring-zinc-900 transition-all outline-none text-zinc-900"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-700">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 h-5 w-5 text-zinc-400" />
                  <input
                    type="password"
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-xl border-zinc-200 bg-zinc-50 focus:ring-2 focus:ring-zinc-900 transition-all outline-none text-zinc-900"
                    placeholder="Min 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 text-red-600 text-sm font-medium rounded-xl border border-red-100 flex items-center gap-2">
                  <XCircle size={16} />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-zinc-900 text-white rounded-xl font-bold text-lg hover:bg-black transition-all disabled:opacity-50 flex items-center justify-center"
              >
                {loading ? <Loader2 className="animate-spin" /> : "Create Account"}
              </button>
            </form>
          )}

          <div className="text-center text-sm font-medium">
            <span className="text-zinc-500">Already have an account? </span>
            <Link href="/login" className="text-zinc-900 hover:underline font-bold">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

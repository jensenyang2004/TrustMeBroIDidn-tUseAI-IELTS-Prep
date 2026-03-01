"use client";

import { Users, Github, Mail, ExternalLink } from "lucide-react";

export default function TeamPage() {
  return (
    <div className="p-8 max-w-4xl mx-auto space-y-10 pb-20">
      <div className="flex items-center gap-3 border-b pb-6">
        <div className="p-3 bg-zinc-100 rounded-xl text-zinc-900">
          <Users size={24} />
        </div>
        <div>
          <h1 className="text-3xl font-black tracking-tight text-zinc-900">Meet me - the team</h1>
          <p className="text-zinc-500 font-medium font-serif">If I didn't get a 7.5 on IELTS it'll be quite embarrassing.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Team Member Card */}
        <div className="bg-white p-8 rounded-3xl border shadow-sm hover:shadow-md transition-all space-y-6">
          <div className="w-32 h-32 mx-auto rounded-2xl bg-zinc-100 border-2 border-zinc-200 overflow-hidden shadow-inner">
            {/* Placeholder image */}
            <div className="w-full h-full flex items-center justify-center text-zinc-300 bg-zinc-50 font-black text-4xl">
              YZ
            </div>
          </div>
          
          <div className="text-center space-y-1">
            <h2 className="text-xl font-black text-zinc-900">Jensen Yang</h2>
            <p className="text-zinc-500 font-medium text-sm">Hard-grinding IELTS preparer</p>
          </div>

          <div className="flex flex-col gap-3">
            <a 
              href="https://github.com/jensenyang2004" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl hover:bg-zinc-100 transition-colors group"
            >
              <div className="flex items-center gap-3 text-zinc-700">
                <Github size={20} />
                <span className="font-bold text-sm">GitHub Profile</span>
              </div>
              <ExternalLink size={16} className="text-zinc-300 group-hover:text-zinc-900" />
            </a>

            <a 
              href="jenseniu0810@gmail.com" 
              className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl hover:bg-zinc-100 transition-colors group"
            >
              <div className="flex items-center gap-3 text-zinc-700">
                <Mail size={20} />
                <span className="font-bold text-sm">Email Me</span>
              </div>
              <ExternalLink size={16} className="text-zinc-300 group-hover:text-zinc-900" />
            </a>
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-zinc-900 text-zinc-100 p-8 rounded-3xl shadow-xl flex flex-col justify-center space-y-4">
          <h3 className="text-xl font-black italic">"Trust Me Bro I Didn't Use AI"</h3>
          <p className="text-zinc-400 font-serif leading-relaxed">
          I was going to sit down and grinding on a IELTS writing. But then I thought, "Why write practice essays when you can spend 2 entire days building an app that solves a problem you don’t actually have yet?" So here I'm, traded 4 IELTS essays for 2 days of frantic coding. My English hasn't improved, but my technical debt certainly has.          </p>
          <div className="pt-4 flex gap-2">
            <div className="h-1 w-8 bg-amber-500 rounded-full" />
            <div className="h-1 w-4 bg-zinc-700 rounded-full" />
            <div className="h-1 w-4 bg-zinc-700 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

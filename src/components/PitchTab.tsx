import React from 'react';
import { Sparkles, Target, Flame, Swords, Mountain, Bot, Cpu, Rocket, CheckCircle } from 'lucide-react';
import { PenguinMascot } from './PenguinMascot/PenguinMascot';

interface PitchTabProps {
  onNavigateToTab: (tab: 'today' | 'battle' | 'profile') => void;
}

export const PitchTab: React.FC<PitchTabProps> = ({ onNavigateToTab }) => {
  return (
    <div className="space-y-6 pb-24 text-[#E8F4F8] animate-fade-in">
      {/* Banner / Header */}
      <div className="bg-gradient-to-br from-[#1E2D45] via-[#1A1F2E] to-[#0F1419] p-5 rounded-2xl border border-[#87CEEB]/30 shadow-xl relative overflow-hidden">
        <div className="absolute -right-6 -bottom-6 opacity-10 pointer-events-none">
          <PenguinMascot state="celebrating" size="large" />
        </div>

        <div className="flex items-center gap-2 mb-2">
          <span className="px-2.5 py-0.5 rounded-full bg-[#87CEEB]/20 text-[#87CEEB] text-[10px] font-extrabold tracking-wider uppercase border border-[#87CEEB]/30">
            Patchamomma 2026 Pitch Doc
          </span>
          <span className="px-2 py-0.5 rounded-full bg-[#F59E0B]/20 text-[#F59E0B] text-[10px] font-bold">
            Project Showcase
          </span>
        </div>

        <h1 className="text-2xl font-black tracking-tight text-[#E8F4F8]">
          hAIbuild <span className="text-[#87CEEB]">🐧</span>
        </h1>
        <p className="text-xs text-[#A0B8D4] mt-1 leading-relaxed max-w-sm">
          A gamified daily habit platform built for staying current in AI/ML & mastering engineering interview prep.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => onNavigateToTab('today')}
            className="px-3.5 py-2 rounded-xl bg-[#87CEEB] text-[#0F1419] hover:bg-[#1E90FF] hover:text-white transition text-xs font-bold flex items-center gap-1.5 shadow cursor-pointer"
          >
            <Rocket className="w-3.5 h-3.5" />
            <span>Launch Today's Focus</span>
          </button>
          <button
            onClick={() => onNavigateToTab('battle')}
            className="px-3.5 py-2 rounded-xl bg-[#212838] text-[#87CEEB] hover:bg-[#2A3F5F] transition text-xs font-bold border border-[#2A3F5F] flex items-center gap-1.5 cursor-pointer"
          >
            <Swords className="w-3.5 h-3.5" />
            <span>Try Solo Arena</span>
          </button>
        </div>
      </div>

      {/* The Problem & Solution */}
      <div className="grid grid-cols-1 gap-3">
        {/* Problem Card */}
        <div className="bg-[#1A1F2E] p-4 rounded-2xl border border-[#FF6B6B]/30 space-y-2 shadow-md">
          <div className="flex items-center gap-2 text-[#FF6B6B]">
            <Target className="w-4 h-4" />
            <h3 className="text-xs font-extrabold uppercase tracking-wider">The Challenge</h3>
          </div>
          <p className="text-xs text-[#A0B8D4] leading-relaxed">
            AI/ML evolves daily, making technical interview prep overwhelming. Engineers struggle to maintain a consistent daily learning habit across DSA, core ML math, and systems design.
          </p>
        </div>

        {/* Solution Card */}
        <div className="bg-[#1A1F2E] p-4 rounded-2xl border border-[#26D07C]/30 space-y-2 shadow-md">
          <div className="flex items-center gap-2 text-[#26D07C]">
            <CheckCircle className="w-4 h-4" />
            <h3 className="text-xs font-extrabold uppercase tracking-wider">The hAIbuild Solution</h3>
          </div>
          <p className="text-xs text-[#A0B8D4] leading-relaxed">
            Bite-sized daily lessons (DSA + ML Concept + Interview Q&A) paired with a 60s competitive ELO Arena and a Penguin Mountain Climb mascot that turns daily learning into an irresistible habit.
          </p>
        </div>
      </div>

      {/* Core Features Grid */}
      <div className="bg-[#1A1F2E] p-5 rounded-2xl border border-[#2A3F5F] shadow-lg space-y-4">
        <h2 className="text-xs font-bold uppercase text-[#87CEEB] tracking-wider flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          <span>Core Product Pillars</span>
        </h2>

        <div className="grid grid-cols-1 gap-3">
          {/* Pillar 1 */}
          <div className="p-3.5 rounded-xl bg-[#212838] border border-[#2A3F5F] flex items-start gap-3">
            <div className="p-2 rounded-lg bg-[#87CEEB]/10 text-[#87CEEB] shrink-0 mt-0.5">
              <Flame className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-[#E8F4F8]">1. Daily 3-Card Learning Engine</h4>
              <p className="text-[11px] text-[#A0B8D4] leading-relaxed">
                Curated daily lessons covering DSA algorithms with visual graph execution specs, intuitive ML concept analogies, and real-world interview Q&As.
              </p>
            </div>
          </div>

          {/* Pillar 2 */}
          <div className="p-3.5 rounded-xl bg-[#212838] border border-[#2A3F5F] flex items-start gap-3">
            <div className="p-2 rounded-lg bg-[#F59E0B]/10 text-[#F59E0B] shrink-0 mt-0.5">
              <Swords className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-[#E8F4F8]">2. 60-Second Timed Solo Arena</h4>
              <p className="text-[11px] text-[#A0B8D4] leading-relaxed">
                Test your knowledge under pressure! Earn competitive ELO rating points (start at 1200 ELO), view answer breakdowns, or battle infinite AI-generated questions.
              </p>
            </div>
          </div>

          {/* Pillar 3 */}
          <div className="p-3.5 rounded-xl bg-[#212838] border border-[#2A3F5F] flex items-start gap-3">
            <div className="p-2 rounded-lg bg-[#26D07C]/10 text-[#26D07C] shrink-0 mt-0.5">
              <Mountain className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-[#E8F4F8]">3. Gamified Mountain Climb & Penguin Mascot</h4>
              <p className="text-[11px] text-[#A0B8D4] leading-relaxed">
                Track your streak, level up with XP, and watch your mascot penguin scale the 1,000 milestone summit as you build long-term consistency.
              </p>
            </div>
          </div>

          {/* Pillar 4 */}
          <div className="p-3.5 rounded-xl bg-[#212838] border border-[#2A3F5F] flex items-start gap-3">
            <div className="p-2 rounded-lg bg-[#1E90FF]/10 text-[#1E90FF] shrink-0 mt-0.5">
              <Bot className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-[#E8F4F8]">4. Gemini AI Agent Co-Pilot</h4>
              <p className="text-[11px] text-[#A0B8D4] leading-relaxed">
                Powered by Google Gemini 2.5/3 via <code className="text-[#87CEEB]">@google/genai</code>. Provides real-time problem hints, simplified explanations, AI coach daily feedback, and dynamic question synthesis.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tech Stack & Architecture */}
      <div className="bg-[#1A1F2E] p-5 rounded-2xl border border-[#2A3F5F] shadow-lg space-y-3">
        <h2 className="text-xs font-bold uppercase text-[#5A7AA0] tracking-wider flex items-center gap-2">
          <Cpu className="w-4 h-4 text-[#87CEEB]" />
          <span>Technology & Architecture</span>
        </h2>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-3 rounded-xl bg-[#121722] border border-[#1E2D45] space-y-1">
            <span className="text-[10px] text-[#87CEEB] font-bold uppercase block">Frontend</span>
            <div className="font-semibold text-[#E8F4F8]">React 19 + TypeScript</div>
            <div className="text-[10px] text-[#5A7AA0]">Tailwind CSS, Lucide Icons</div>
          </div>

          <div className="p-3 rounded-xl bg-[#121722] border border-[#1E2D45] space-y-1">
            <span className="text-[10px] text-[#87CEEB] font-bold uppercase block">Backend & AI</span>
            <div className="font-semibold text-[#E8F4F8]">Express Node Server</div>
            <div className="text-[10px] text-[#5A7AA0]">@google/genai SDK</div>
          </div>

          <div className="p-3 rounded-xl bg-[#121722] border border-[#1E2D45] space-y-1">
            <span className="text-[10px] text-[#87CEEB] font-bold uppercase block">State & Storage</span>
            <div className="font-semibold text-[#E8F4F8]">Hybrid Offline-First</div>
            <div className="text-[10px] text-[#5A7AA0]">localStorage + API Sync</div>
          </div>

          <div className="p-3 rounded-xl bg-[#121722] border border-[#1E2D45] space-y-1">
            <span className="text-[10px] text-[#87CEEB] font-bold uppercase block">Hackathon</span>
            <div className="font-semibold text-[#E8F4F8]">Patchamomma 2026</div>
            <div className="text-[10px] text-[#5A7AA0]">Google AI Track</div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-gradient-to-r from-[#1A1F2E] via-[#212838] to-[#1A1F2E] p-5 rounded-2xl border border-[#26D07C]/40 text-center space-y-3 shadow-xl">
        <h3 className="text-base font-bold text-[#26D07C]">Ready to build your AI daily habit?</h3>
        <p className="text-xs text-[#A0B8D4] max-w-xs mx-auto">
          Start today's 3-step focus or jump straight into a 60-second practice battle!
        </p>
        <div className="flex justify-center gap-3 pt-1">
          <button
            onClick={() => onNavigateToTab('today')}
            className="px-5 py-2.5 rounded-xl bg-[#26D07C] text-[#0F1419] hover:bg-[#1fb369] transition font-bold text-xs shadow-md cursor-pointer"
          >
            Start Daily Focus
          </button>
          <button
            onClick={() => onNavigateToTab('profile')}
            className="px-5 py-2.5 rounded-xl bg-[#212838] text-[#87CEEB] border border-[#2A3F5F] hover:bg-[#2A3F5F] transition font-bold text-xs cursor-pointer"
          >
            View Profile Stats
          </button>
        </div>
      </div>
    </div>
  );
};

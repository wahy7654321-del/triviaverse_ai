import React from 'react';
import { HostProfile, AppMode } from '../types/trivia';
import { Volume2, VolumeX, Radio, Gamepad2, Sparkles, UserCheck } from 'lucide-react';
import { sound } from '../utils/audio';

interface NavbarProps {
  currentHost: HostProfile;
  appMode: AppMode;
  onSelectMode: (mode: AppMode) => void;
  onOpenHostModal: () => void;
  score: number;
  streak: number;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentHost,
  appMode,
  onSelectMode,
  onOpenHostModal,
  score,
  streak,
  isMuted,
  onToggleMute,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-4 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-rose-500/20 text-xl font-black text-white select-none">
            TV
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base sm:text-lg tracking-tight bg-gradient-to-r from-amber-400 via-rose-400 to-cyan-400 bg-clip-text text-transparent">
                TriviaVerse AI
              </span>
              <span className="hidden sm:inline-flex text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                LIVE SHOW
              </span>
            </div>
            <p className="text-[10px] text-slate-400 hidden sm:block">
              gemini-3.6-flash • Host Dinamis • Gemini 3.8 TTS • Live API • Search Grounding
            </p>
          </div>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 shadow-inner">
          <button
            onClick={() => onSelectMode('game')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              appMode === 'game'
                ? 'bg-gradient-to-r from-amber-500 to-rose-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Gamepad2 className="w-3.5 h-3.5" />
            <span>Kuis Arena</span>
          </button>

          <button
            onClick={() => onSelectMode('live-voice')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all relative ${
              appMode === 'live-voice'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Radio className="w-3.5 h-3.5 animate-pulse text-rose-400" />
            <span>Live Voice Studio</span>
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
          </button>
        </div>

        {/* Right Section: Host Quick Switcher & Audio */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Host Badge Button */}
          <button
            onClick={onOpenHostModal}
            className={`flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl border transition-all duration-200 hover:scale-102 ${currentHost.themeColor.secondary}`}
            title="Ganti atau Sesuaikan Kepribadian Host"
          >
            <span className="text-base sm:text-lg select-none">{currentHost.avatarEmoji}</span>
            <div className="text-left hidden md:block">
              <p className="text-[11px] font-bold text-slate-100 leading-none">{currentHost.name}</p>
              <p className="text-[9px] opacity-80">{currentHost.badge}</p>
            </div>
            <UserCheck className="w-3.5 h-3.5 opacity-60 hidden sm:block" />
          </button>

          {/* Score & Streak (Only in Game Mode) */}
          {appMode === 'game' && (
            <div className="hidden lg:flex items-center gap-2 text-xs font-bold">
              <div className="bg-slate-900 border border-slate-800 px-3 py-1 rounded-lg text-amber-400">
                ⭐ {score}
              </div>
              {streak > 1 && (
                <div className="bg-rose-950/80 border border-rose-800/80 px-2.5 py-1 rounded-lg text-rose-300 animate-pulse">
                  🔥 {streak}x
                </div>
              )}
            </div>
          )}

          {/* Audio Mute Toggle */}
          <button
            onClick={() => {
              if (isMuted) sound.playClick('bubble');
              onToggleMute();
            }}
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
              isMuted
                ? 'bg-rose-950/40 border-rose-800/60 text-rose-400'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-slate-100 hover:bg-slate-800'
            }`}
            title={isMuted ? 'Suara dimatikan (Klik untuk aktifkan)' : 'Suara aktif (Klik untuk matikan)'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};

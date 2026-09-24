import React from 'react';
import { HostProfile } from '../types/trivia';
import { Volume2, VolumeX, Sparkles, MessageSquare, Bot } from 'lucide-react';

interface HostAvatarProps {
  host: HostProfile;
  isSpeaking: boolean;
  isThinking?: boolean;
  mood?: 'neutral' | 'happy' | 'celebrating' | 'roasting' | 'thinking';
  speechText?: string;
  onReplayAudio?: () => void;
  hasAudio?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const HostAvatar: React.FC<HostAvatarProps> = ({
  host,
  isSpeaking,
  isThinking = false,
  mood = 'neutral',
  speechText,
  onReplayAudio,
  hasAudio = false,
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'w-16 h-16 text-2xl',
    md: 'w-24 h-24 text-4xl',
    lg: 'w-32 h-32 text-5xl',
    xl: 'w-44 h-44 text-7xl',
  };

  const getMoodBorder = () => {
    if (isThinking) return 'border-amber-400 ring-4 ring-amber-500/30 animate-pulse';
    if (mood === 'celebrating') return 'border-emerald-400 ring-4 ring-emerald-500/40 animate-bounce';
    if (mood === 'roasting') return 'border-rose-500 ring-4 ring-rose-500/40';
    if (isSpeaking) return 'border-cyan-400 ring-4 ring-cyan-500/40 scale-105';
    return host.themeColor.border;
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative group">
        {/* Glow halo background */}
        <div
          className={`absolute -inset-3 rounded-full blur-xl opacity-60 transition-all duration-500 ${
            isSpeaking ? 'opacity-90 scale-110' : ''
          }`}
          style={{ background: host.themeColor.gradient }}
        />

        {/* Dynamic soundwaves ring */}
        {isSpeaking && (
          <div className="absolute -inset-2 rounded-full border-2 border-dashed border-cyan-400/80 animate-spin" style={{ animationDuration: '8s' }} />
        )}

        {/* Main avatar orb */}
        <div
          className={`relative ${sizeClasses[size]} rounded-full flex items-center justify-center bg-slate-900 border-2 shadow-2xl transition-all duration-300 ${getMoodBorder()}`}
        >
          {/* Avatar expression icon */}
          <span
            className={`transition-transform duration-300 select-none ${
              isSpeaking ? 'scale-110' : 'group-hover:scale-105'
            }`}
          >
            {mood === 'celebrating'
              ? '🎉'
              : mood === 'roasting'
              ? '🔥'
              : isThinking
              ? '🤔'
              : host.avatarEmoji}
          </span>

          {/* Voice indicator badge */}
          {isSpeaking && (
            <div className="absolute -bottom-1 -right-1 bg-cyan-500 text-slate-950 p-1.5 rounded-full shadow-lg animate-pulse">
              <Volume2 className="w-3.5 h-3.5" />
            </div>
          )}

          {isThinking && (
            <div className="absolute -top-1 -right-1 bg-amber-500 text-slate-950 p-1 rounded-full shadow-lg animate-spin">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          )}
        </div>
      </div>

      {/* Host identity details */}
      <div className="mt-2.5 text-center">
        <div className="flex items-center justify-center gap-1.5">
          <span className="font-bold text-slate-100 tracking-tight text-sm md:text-base">
            {host.name}
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-slate-800 text-slate-300 border border-slate-700">
            Voice: {host.voice}
          </span>
        </div>
        <p className="text-xs text-slate-400">{host.title}</p>
      </div>

      {/* Interactive Speech Bubble if text is present */}
      {speechText && (
        <div className="relative mt-3 max-w-xs sm:max-w-md w-full">
          {/* Arrow */}
          <div className="w-3 h-3 bg-slate-800 border-l border-t border-slate-700 rotate-45 mx-auto -mb-1.5 z-10 relative" />
          
          <div className="bg-slate-800/95 backdrop-blur border border-slate-700 rounded-2xl p-3.5 shadow-xl text-center relative group">
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed italic">
              "{speechText}"
            </p>
            {hasAudio && onReplayAudio && (
              <button
                onClick={onReplayAudio}
                className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-cyan-400 hover:text-cyan-300 bg-cyan-950/60 hover:bg-cyan-900/60 px-2.5 py-1 rounded-full border border-cyan-800/60 transition-colors"
                title="Putar ulang suara TTS"
              >
                <Volume2 className="w-3 h-3" />
                Dengarkan Suara ({host.name})
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { HostProfile } from '../types/trivia';
import { HOSTS } from '../data/hosts';
import { HostAvatar } from './HostAvatar';
import { sound } from '../utils/audio';
import { X, Volume2, Check, Flame, Sparkles } from 'lucide-react';

interface HostSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentHost: HostProfile;
  onSelectHost: (host: HostProfile) => void;
}

export const HostSelectorModal: React.FC<HostSelectorModalProps> = ({
  isOpen,
  onClose,
  currentHost,
  onSelectHost,
}) => {
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePreviewVoice = async (host: HostProfile, e: React.MouseEvent) => {
    e.stopPropagation();
    sound.playClick('bubble');
    try {
      setPlayingVoiceId(host.id);
      sound.stopAllPlayback();

      const res = await fetch('/api/trivia/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: host.catchphrase,
          hostId: host.id,
        }),
      });

      if (!res.ok) throw new Error('Failed to generate preview audio');
      const data = await res.json();
      if (data.audioBase64) {
        sound.playPcmChunk(data.audioBase64, () => {
          setPlayingVoiceId(null);
        });
      } else {
        sound.speakWithBrowserTts(host.catchphrase, host.id, () => {
          setPlayingVoiceId(null);
        });
      }
    } catch (err) {
      console.warn('Voice preview error, using browser TTS:', err);
      sound.speakWithBrowserTts(host.catchphrase, host.id, () => {
        setPlayingVoiceId(null);
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
              <span>🎭 Karakter & Kepribadian AI Host</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Pilih pembawa acara kuis favorit Anda dengan suara Gemini 3.8 Flash TTS yang unik
            </p>
          </div>
          <button
            onClick={() => {
              sound.playModalClose();
              onClose();
            }}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Host Profiles List */}
        <div className="space-y-3 pt-4">
          {HOSTS.map((host) => {
            const isSelected = host.id === currentHost.id;
            const isPlaying = playingVoiceId === host.id;

            return (
              <div
                key={host.id}
                onClick={() => {
                  sound.playCardSelect();
                  onSelectHost(host);
                  onClose();
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  isSelected
                    ? 'bg-slate-800/90 border-cyan-500/60 ring-2 ring-cyan-500/20 shadow-lg'
                    : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/60 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="text-4xl p-2 rounded-2xl bg-slate-800/80 border border-slate-700 flex-shrink-0 select-none">
                    {host.avatarEmoji}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-base text-white">{host.name}</h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                        {host.voice}
                      </span>
                      {isSelected && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          Aktif
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-amber-400 font-semibold">{host.title}</p>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">{host.bio}</p>
                    <p className="text-[11px] text-slate-300 italic mt-1">{host.catchphrase}</p>
                  </div>
                </div>

                {/* Voice Preview Button */}
                <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                  <button
                    onClick={(e) => handlePreviewVoice(host, e)}
                    disabled={isPlaying}
                    className="px-3 py-2 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-800/60 text-cyan-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Dengarkan contoh suara Gemini 3.8 Flash TTS"
                  >
                    <Volume2 className={`w-3.5 h-3.5 ${isPlaying ? 'animate-pulse text-cyan-400' : ''}`} />
                    <span>{isPlaying ? 'Memutar...' : 'Cek Suara'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

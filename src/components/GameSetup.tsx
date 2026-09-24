import React, { useState } from 'react';
import { HostProfile } from '../types/trivia';
import { HOSTS } from '../data/hosts';
import { HostAvatar } from './HostAvatar';
import { Globe, Sparkles, Flame, Play, Search, HelpCircle, Shuffle } from 'lucide-react';
import { sound } from '../utils/audio';

interface GameSetupProps {
  currentHost: HostProfile;
  onSelectHost: (host: HostProfile) => void;
  onStartGame: (params: {
    topic: string;
    difficulty: string;
    count: number;
    useSearchGrounding: boolean;
    customPrompt: string;
    spiceLevel: number;
  }) => void;
  isLoading: boolean;
}

const PRESET_TOPICS = [
  { id: 'umum', label: '🧠 Pengetahuan Umum & Logika', searchRecommended: false },
  { id: 'terkini', label: '🌐 Berita & Tren Dunia 2025/2026', searchRecommended: true },
  { id: 'sains', label: '🔬 Sains, Alam & Antariksa', searchRecommended: false },
  { id: 'tech', label: '💻 Teknologi Terkini & AI', searchRecommended: true },
  { id: 'pop', label: '🎬 Musik, Film & Pop Culture', searchRecommended: true },
  { id: 'sejarah', label: '📜 Sejarah & Mitologi Kuno', searchRecommended: false },
];

export const GameSetup: React.FC<GameSetupProps> = ({
  currentHost,
  onSelectHost,
  onStartGame,
  isLoading,
}) => {
  const [selectedTopic, setSelectedTopic] = useState<string>(PRESET_TOPICS[0].label);
  const [customTopic, setCustomTopic] = useState<string>('');
  const [isCustom, setIsCustom] = useState<boolean>(false);
  const [difficulty, setDifficulty] = useState<string>('Sedang');
  const [count, setCount] = useState<number>(5);
  const [useSearchGrounding, setUseSearchGrounding] = useState<boolean>(false);
  const [spiceLevel, setSpiceLevel] = useState<number>(currentHost.defaultSpice);

  const handleTopicClick = (topic: typeof PRESET_TOPICS[0]) => {
    sound.playCardSelect();
    setIsCustom(false);
    setSelectedTopic(topic.label);
    if (topic.searchRecommended) {
      setUseSearchGrounding(true);
    }
  };

  const handleStart = () => {
    sound.playClick('crisp');
    const finalTopic = isCustom ? customTopic.trim() || 'Fakta Menarik' : selectedTopic;
    onStartGame({
      topic: finalTopic,
      difficulty,
      count,
      useSearchGrounding,
      customPrompt: isCustom ? customTopic : '',
      spiceLevel,
    });
  };

  const spiceLabels = [
    '🕊️ Santun & Suportif',
    '🎉 Asyik & Berimbang',
    '🌶️ Roasting Pedas & Sarkas',
    '🔥 Super Hype & Meledak-ledak',
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      {/* Hero Studio Banner */}
      <div className="relative rounded-3xl p-6 sm:p-8 overflow-hidden bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-xl">
        <div
          className="absolute -top-24 -right-24 w-80 h-80 rounded-full blur-3xl opacity-30 pointer-events-none"
          style={{ background: currentHost.themeColor.gradient }}
        />
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-3 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              Panggung Kuis Trivia Interaktif AI
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
              Tantang Dirimu Bersama{' '}
              <span className="bg-gradient-to-r from-amber-400 via-rose-400 to-pink-500 bg-clip-text text-transparent">
                {currentHost.name}
              </span>
            </h1>
            <p className="text-sm sm:text-base text-slate-300 max-w-xl">
              {currentHost.bio} Ditenagai model <span className="text-amber-400 font-semibold">gemini-3.6-flash</span> (low latency/temperature), narasi suara realistis <span className="text-cyan-400 font-semibold">Gemini 3.8 Flash TTS</span>, dan fakta terkini via <span className="text-emerald-400 font-semibold">Google Search Grounding</span>!
            </p>
          </div>

          <div className="flex-shrink-0">
            <HostAvatar
              host={currentHost}
              isSpeaking={false}
              size="lg"
              speechText={currentHost.catchphrase}
            />
          </div>
        </div>
      </div>

      {/* 1. Pilih Karakter AI Host */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>🎭 Pilih Host Kuis Anda</span>
              <span className="text-xs font-normal text-slate-400">
                (Setiap host punya suara dan kepribadian unik)
              </span>
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {HOSTS.map((host) => {
            const isSelected = host.id === currentHost.id;
            return (
              <button
                key={host.id}
                onClick={() => {
                  sound.playCardSelect();
                  onSelectHost(host);
                  setSpiceLevel(host.defaultSpice);
                }}
                className={`relative p-3.5 rounded-2xl text-left border transition-all duration-200 flex flex-col justify-between ${
                  isSelected
                    ? `bg-slate-800/90 shadow-xl ring-2 ring-offset-2 ring-offset-slate-950 ${host.themeColor.border}`
                    : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-850 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-3xl select-none">{host.avatarEmoji}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      {host.voice}
                    </span>
                  </div>
                  <h3 className="font-extrabold text-sm text-white leading-tight">{host.name}</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">{host.title}</p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-800/80">
                  <span className="text-[10px] font-semibold text-slate-300 block truncate">
                    {host.badge}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Topik Pertanyaan & Google Search Grounding */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>📚 Pilih Topik Kuis</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {PRESET_TOPICS.map((topic) => {
              const isSelected = !isCustom && selectedTopic === topic.label;
              return (
                <button
                  key={topic.id}
                  onClick={() => handleTopicClick(topic)}
                  className={`p-3 rounded-xl text-left text-xs font-semibold border transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-rose-500/15 border-rose-500/50 text-white shadow-md'
                      : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800/60'
                  }`}
                >
                  <span>{topic.label}</span>
                  {topic.searchRecommended && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                      Live Search
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Custom Topic Input */}
          <div className="mt-2">
            <button
              onClick={() => {
                sound.playClick('soft');
                setIsCustom(!isCustom);
              }}
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>{isCustom ? '← Gunakan Kategori Pilihan' : '✍️ Atau Tulis Topik Kustom Sendiri...'}</span>
            </button>

            {isCustom && (
              <div className="mt-2 relative">
                <input
                  type="text"
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  placeholder="Contoh: Film Studio Ghibli, Juara F1 2026, Penemuan Teleskop James Webb..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                />
              </div>
            )}
          </div>
        </div>

        {/* Setting Parameters */}
        <div className="space-y-4 bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
          <h3 className="text-sm font-bold text-slate-200">⚙️ Pengaturan Studio</h3>

          {/* Difficulty */}
          <div>
            <label className="text-xs font-medium text-slate-400 block mb-1.5">Tingkat Kesulitan</label>
            <div className="grid grid-cols-3 gap-1.5">
              {['Santai', 'Sedang', 'Jenius'].map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => {
                    sound.playClick('crisp');
                    setDifficulty(lvl);
                  }}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    difficulty === lvl
                      ? 'bg-amber-500 text-slate-950 shadow'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Question count */}
          <div>
            <label className="text-xs font-medium text-slate-400 block mb-1.5">Jumlah Pertanyaan</label>
            <div className="grid grid-cols-3 gap-1.5">
              {[5, 8, 10].map((num) => (
                <button
                  key={num}
                  onClick={() => {
                    sound.playClick('soft');
                    setCount(num);
                  }}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    count === num
                      ? 'bg-rose-500 text-white shadow'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {num} Soal
                </button>
              ))}
            </div>
          </div>

          {/* Spice Level */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-slate-400 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-rose-400" />
                <span>Intensitas Karakter Host</span>
              </label>
              <span className="text-[10px] font-bold text-amber-400">
                Level {spiceLevel}
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="4"
              value={spiceLevel}
              onChange={(e) => {
                sound.playClick('soft');
                setSpiceLevel(parseInt(e.target.value, 10));
              }}
              className="w-full accent-rose-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
            <p className="text-[11px] text-slate-300 mt-1 font-medium">
              {spiceLabels[spiceLevel - 1]}
            </p>
          </div>

          {/* Google Search Grounding Feature Switch */}
          <div className="pt-2 border-t border-slate-800">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={useSearchGrounding}
                onChange={(e) => {
                  sound.playClick('bubble');
                  setUseSearchGrounding(e.target.checked);
                }}
                className="mt-0.5 rounded border-slate-700 text-emerald-500 focus:ring-emerald-500/50 w-4 h-4 bg-slate-800"
              />
              <div className="text-xs">
                <span className="font-bold text-emerald-400 flex items-center gap-1">
                  <Search className="w-3 h-3" />
                  Google Search Grounding
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5 leading-snug">
                  Gunakan model <strong className="text-slate-300">gemini-3.5-flash</strong> dengan live search web untuk fakta paling baru & terverifikasi.
                </span>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Start Button */}
      <div className="pt-2 text-center">
        <button
          onClick={handleStart}
          disabled={isLoading}
          className="w-full sm:w-auto min-w-[280px] px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 hover:from-amber-400 hover:via-rose-400 hover:to-indigo-500 text-white font-black text-lg tracking-wide shadow-xl shadow-rose-500/25 transition-all duration-300 hover:scale-102 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 mx-auto cursor-pointer"
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
              <span>{currentHost.name} Sedang Menyiapkan Panggung...</span>
            </>
          ) : (
            <>
              <Play className="w-5 h-5 fill-current" />
              <span>Mulai Acara Kuis!</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

import React, { useEffect } from 'react';
import { HostProfile } from '../types/trivia';
import { HostAvatar } from './HostAvatar';
import confetti from 'canvas-confetti';
import { sound } from '../utils/audio';
import {
  Trophy,
  Flame,
  Award,
  RefreshCw,
  Radio,
  CheckCircle2,
  XCircle,
  Sparkles,
} from 'lucide-react';

interface GameOverSummaryProps {
  finalScore: number;
  history: Array<{
    question: any;
    selectedOption: number;
    isCorrect: boolean;
    earnedScore: number;
    hostComment?: string;
  }>;
  currentHost: HostProfile;
  onPlayAgain: () => void;
  onGoToLiveStudio: () => void;
}

export const GameOverSummary: React.FC<GameOverSummaryProps> = ({
  finalScore,
  history,
  currentHost,
  onPlayAgain,
  onGoToLiveStudio,
}) => {
  const totalQuestions = history.length;
  const correctCount = history.filter((h) => h.isCorrect).length;
  const accuracy = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

  useEffect(() => {
    if (accuracy >= 60) {
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {}
    }
  }, [accuracy]);

  const getVerdict = () => {
    if (accuracy === 100) {
      return {
        title: '🌟 MAHA GENIUS / SKOR SEMPURNA!',
        badge: 'Legenda Trivia',
        comment:
          currentHost.id === 'arya'
            ? 'Luar biasa! Tingkat kognisi Anda melampaui rata-rata peradaban modern. Saya resmi menobatkan Anda sebagai Mahaguru Kehormatan!'
            : currentHost.id === 'roro'
            ? 'Wah, saya sampai kehabisan kata-kata sinis. Anda benar-benar luar biasa pintar!'
            : currentHost.id === 'kiki'
            ? 'GILA PARAH! 100% BENAR SEMUA! Kamu adalah raja kuis paling hype di bumi!'
            : 'Performa tak bercela! Seluruh studio berdiri bertepuk tangan untuk Anda!',
      };
    }
    if (accuracy >= 60) {
      return {
        title: '🎉 PERFORMA HEBAT!',
        badge: 'Cendekiawan Handal',
        comment:
          currentHost.id === 'arya'
            ? 'Pencapaian yang sangat terhormat! Wawasan Anda sangat tajam.'
            : currentHost.id === 'roro'
            ? 'Lumayan bagus, setidaknya Anda tidak membuat saya mengantuk.'
            : currentHost.id === 'kiki'
            ? 'Keren banget vibe-nya! Sedikit lagi menuju gelar juara mutlak!'
            : 'Keputusan-keputusan Anda sangat tepat sasaran!',
      };
    }
    return {
      title: '💪 BUTUH PEMANASAN LAGI',
      badge: 'Pemain Pantang Menyerah',
      comment:
        currentHost.id === 'arya'
          ? 'Kegagalan adalah bahan bakar penelitian ilmiah. Mari belajar lagi dan coba tantangan berikutnya!'
          : currentHost.id === 'roro'
          ? 'Yah, setidaknya Anda sudah mencoba... meski tebakan Anda tadi agak ajaib.'
          : currentHost.id === 'kiki'
          ? 'Tetap santai dan gas terus! Jangan kapok main bareng aku ya!'
          : 'Panggung kuis selalu membuka kesempatan kedua. Siapkan strategi baru!',
    };
  };

  const verdict = getVerdict();

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-6">
      {/* Hero Victory Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-10 backdrop-blur text-center relative overflow-hidden shadow-2xl">
        <div
          className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ background: currentHost.themeColor.gradient }}
        />

        <div className="relative z-10 space-y-4 max-w-xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <Trophy className="w-3.5 h-3.5" />
            <span>{verdict.badge}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            {verdict.title}
          </h1>

          <div className="py-2">
            <HostAvatar
              host={currentHost}
              isSpeaking={false}
              size="lg"
              mood={accuracy >= 60 ? 'celebrating' : 'roasting'}
              speechText={verdict.comment}
            />
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-800">
            <div className="bg-slate-800/60 p-3 rounded-2xl border border-slate-700/60">
              <p className="text-[10px] uppercase font-bold text-slate-400">Total Skor</p>
              <p className="text-xl sm:text-2xl font-black text-amber-400 font-mono">
                {finalScore}
              </p>
            </div>
            <div className="bg-slate-800/60 p-3 rounded-2xl border border-slate-700/60">
              <p className="text-[10px] uppercase font-bold text-slate-400">Benar / Total</p>
              <p className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
                {correctCount} / {totalQuestions}
              </p>
            </div>
            <div className="bg-slate-800/60 p-3 rounded-2xl border border-slate-700/60">
              <p className="text-[10px] uppercase font-bold text-slate-400">Akurasi</p>
              <p className="text-xl sm:text-2xl font-black text-cyan-400 font-mono">
                {accuracy}%
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => {
                sound.playTransition('whoosh');
                onPlayAgain();
              }}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 hover:from-amber-400 hover:via-rose-400 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-rose-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-102"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Mainkan Babak Baru</span>
            </button>

            <button
              onClick={() => {
                sound.playTransition('warp');
                onGoToLiveStudio();
              }}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-cyan-500/40 text-cyan-300 hover:text-white font-bold text-sm flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-102 shadow-lg"
            >
              <Radio className="w-4 h-4 text-rose-400 animate-pulse" />
              <span>Ngobrol di Live Voice Studio</span>
            </button>
          </div>
        </div>
      </div>

      {/* Question Breakdown History */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <span>📝 Rekapitulasi Jawaban Anda</span>
        </h2>

        <div className="space-y-3">
          {history.map((item, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-2xl border backdrop-blur text-xs sm:text-sm ${
                item.isCorrect
                  ? 'bg-emerald-950/20 border-emerald-500/30'
                  : 'bg-rose-950/20 border-rose-500/30'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-400">#{idx + 1}</span>
                  {item.isCorrect ? (
                    <span className="flex items-center gap-1 text-emerald-400 font-bold">
                      <CheckCircle2 className="w-4 h-4" />
                      Benar (+{item.earnedScore} poin)
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-rose-400 font-bold">
                      <XCircle className="w-4 h-4" />
                      Salah
                    </span>
                  )}
                </div>
              </div>

              <p className="font-bold text-white text-sm sm:text-base mb-2">
                {item.question.question}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs mb-2">
                <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Pilihan Anda:</span>
                  <span className={item.isCorrect ? 'text-emerald-300 font-bold' : 'text-rose-300 font-bold'}>
                    {item.selectedOption >= 0
                      ? item.question.options[item.selectedOption]
                      : 'Waktu Habis'}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Kunci Jawaban:</span>
                  <span className="text-emerald-300 font-bold">
                    {item.question.options[item.question.correctIndex]}
                  </span>
                </div>
              </div>

              <p className="text-slate-300 text-xs leading-relaxed">
                {item.question.explanation}
              </p>

              {item.hostComment && (
                <div className="mt-2 pt-2 border-t border-slate-800/80 text-[11px] text-amber-300/90 italic">
                  💬 {currentHost.name}: "{item.hostComment}"
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

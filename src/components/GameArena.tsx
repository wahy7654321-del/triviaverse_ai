import React, { useState, useEffect, useRef } from 'react';
import { Question, HostProfile, Lifelines, GroundingSource } from '../types/trivia';
import { HostAvatar } from './HostAvatar';
import { sound } from '../utils/audio';
import {
  Volume2,
  Clock,
  Flame,
  Award,
  HelpCircle,
  Search,
  Sparkles,
  ArrowRight,
  ExternalLink,
  BookOpen,
  VolumeX,
} from 'lucide-react';

interface GameArenaProps {
  questions: Question[];
  currentHost: HostProfile;
  spiceLevel: number;
  isGroundedQuiz: boolean;
  quizGroundingSources?: GroundingSource[];
  onFinishGame: (finalScore: number, history: any[]) => void;
  onQuitToSetup: () => void;
}

const QUESTION_TIMER_SECONDS = 30;

export const GameArena: React.FC<GameArenaProps> = ({
  questions,
  currentHost,
  spiceLevel,
  isGroundedQuiz,
  quizGroundingSources = [],
  onFinishGame,
  onQuitToSetup,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIMER_SECONDS);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [highestStreak, setHighestStreak] = useState(0);

  // Lifelines
  const [lifelines, setLifelines] = useState<Lifelines>({
    fiftyFifty: true,
    askHost: true,
    webSearch: true,
  });
  const [disabledOptions, setDisabledOptions] = useState<number[]>([]);
  const [activeHint, setActiveHint] = useState<string | null>(null);
  const [isHintLoading, setIsHintLoading] = useState(false);

  // Host Dynamic Reaction State
  const [hostReaction, setHostReaction] = useState<string>('');
  const [hostMood, setHostMood] = useState<'neutral' | 'happy' | 'celebrating' | 'roasting' | 'thinking'>('neutral');
  const [isHostSpeaking, setIsHostSpeaking] = useState(false);
  const [lastAudioBase64, setLastAudioBase64] = useState<string | null>(null);
  const [isTtsLoading, setIsTtsLoading] = useState(false);

  // Fact check modal
  const [factCheckData, setFactCheckData] = useState<{ text: string; sources: GroundingSource[] } | null>(null);
  const [isFactChecking, setIsFactChecking] = useState(false);

  // History tracking
  const [history, setHistory] = useState<any[]>([]);

  const currentQ = questions[currentIndex] || questions[0];

  // Narration of question with gemini-3.8-flash-tts
  const readQuestionAudio = async (textToRead: string) => {
    try {
      setIsTtsLoading(true);
      setIsHostSpeaking(true);
      setHostMood('thinking');
      sound.stopAllPlayback();

      const res = await fetch('/api/trivia/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textToRead,
          hostId: currentHost.id,
        }),
      });

      if (!res.ok) throw new Error('Gagal memanggil TTS');
      const data = await res.json();
      if (data.audioBase64) {
        setLastAudioBase64(data.audioBase64);
        setHostMood('neutral');
        sound.playPcmChunk(data.audioBase64, () => {
          setIsHostSpeaking(false);
        });
      } else {
        // High quality fallback: Browser TTS with Indonesian voice tuned to host persona
        setHostMood('neutral');
        sound.speakWithBrowserTts(textToRead, currentHost.id, () => {
          setIsHostSpeaking(false);
        });
      }
    } catch {
      sound.speakWithBrowserTts(textToRead, currentHost.id, () => {
        setIsHostSpeaking(false);
      });
      setHostMood('neutral');
    } finally {
      setIsTtsLoading(false);
    }
  };

  // Trigger question narration on new question index
  useEffect(() => {
    setSelectedOption(null);
    setIsAnswered(false);
    setTimeLeft(QUESTION_TIMER_SECONDS);
    setDisabledOptions([]);
    setActiveHint(null);
    setHostReaction(currentQ.hostQuip || '');
    setHostMood('neutral');
    setFactCheckData(null);

    // Initial voice greeting for the question
    const narration = `${currentQ.hostQuip ? currentQ.hostQuip + '. ' : ''}Pertanyaan nomor ${currentIndex + 1}: ${currentQ.question}`;
    readQuestionAudio(narration);

    return () => {
      sound.stopAllPlayback();
    };
  }, [currentIndex]);

  // Timer countdown
  useEffect(() => {
    if (isAnswered) return;

    if (timeLeft <= 0) {
      // Time is up! Treat as incorrect timeout
      handleSelectAnswer(-1);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 5 && prev > 1) {
          sound.playCountdownWarning(prev <= 2);
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isAnswered]);

  // Handle Lifeline 1: 50:50
  const useFiftyFifty = () => {
    if (!lifelines.fiftyFifty || isAnswered) return;
    sound.playClick('bubble');
    sound.playLifeline();
    setLifelines((prev) => ({ ...prev, fiftyFifty: false }));

    const wrongIndices = [0, 1, 2, 3].filter((i) => i !== currentQ.correctIndex);
    // Shuffle and pick 2 to eliminate
    const shuffled = wrongIndices.sort(() => Math.random() - 0.5);
    setDisabledOptions([shuffled[0], shuffled[1]]);
  };

  // Handle Lifeline 2: Ask Host AI
  const useAskHost = async () => {
    if (!lifelines.askHost || isAnswered) return;
    sound.playClick('bubble');
    sound.playLifeline();
    setLifelines((prev) => ({ ...prev, askHost: false }));
    setIsHintLoading(true);
    setHostMood('thinking');

    try {
      const prompt = `Anda adalah ${currentHost.name}. Pemain meminta petunjuk Anda untuk pertanyaan ini:
"${currentQ.question}"
Pilihan jawaban: ${currentQ.options.join(', ')}
Jawaban yang benar sebenarnya adalah: "${currentQ.options[currentQ.correctIndex]}".

Beri petunjuk atau teka-teki cerdik dalam 1 kalimat pendek tanpa langsung membocorkan secara gamblang.`;

      const res = await fetch('/api/trivia/host-reaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hostId: currentHost.id,
          isCorrect: true,
          userAnswer: 'Petunjuk',
          correctAnswer: currentQ.options[currentQ.correctIndex],
          questionText: currentQ.question,
          spiceLevel,
          includeAudio: true,
        }),
      });

      const data = await res.json();
      setActiveHint(`💡 Petunjuk ${currentHost.name}: "${data.reaction}"`);
      if (data.audioBase64) {
        setIsHostSpeaking(true);
        sound.playPcmChunk(data.audioBase64, () => setIsHostSpeaking(false));
      }
    } catch (e) {
      setActiveHint(`💡 Petunjuk ${currentHost.name}: Perhatikan opsi yang paling relevan dengan konteks sains atau sejarah!`);
    } finally {
      setIsHintLoading(false);
      setHostMood('neutral');
    }
  };

  // Handle Lifeline 3: Web Search Grounding (gemini-3.5-flash with googleSearch)
  const useWebSearch = async () => {
    if (!lifelines.webSearch || isAnswered) return;
    sound.playClick('bubble');
    sound.playLifeline();
    setLifelines((prev) => ({ ...prev, webSearch: false }));
    setIsHintLoading(true);
    setHostMood('thinking');

    try {
      const res = await fetch('/api/trivia/fact-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: currentQ.question,
          answer: currentQ.options[currentQ.correctIndex],
          hostId: currentHost.id,
        }),
      });

      const data = await res.json();
      setActiveHint(`🌐 Fakta Google Search: ${data.text.slice(0, 180)}...`);
    } catch (e) {
      setActiveHint('🌐 Pencarian Web: Fakta ini banyak dibahas dalam literatur ilmiah terpercaya.');
    } finally {
      setIsHintLoading(false);
      setHostMood('neutral');
    }
  };

  // Handle Answer Selection
  const handleSelectAnswer = async (index: number) => {
    if (isAnswered) return;
    setIsAnswered(true);
    setSelectedOption(index);
    sound.stopAllPlayback();

    const isCorrect = index === currentQ.correctIndex;
    const isTimeout = index === -1;

    let pointsEarned = 0;
    let newStreak = streak;

    if (isCorrect) {
      sound.playCorrect();
      newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > highestStreak) setHighestStreak(newStreak);
      if (newStreak > 1) sound.playStreak(newStreak);
      if (newStreak >= 3) sound.playBonus();

      // Time bonus + streak multiplier
      const timeBonus = Math.floor(timeLeft * 5);
      const streakMultiplier = Math.min(newStreak, 4);
      pointsEarned = (100 + timeBonus) * streakMultiplier;
      setScore((prev) => prev + pointsEarned);
      setHostMood(newStreak >= 3 ? 'celebrating' : 'happy');
    } else {
      sound.playWrong();
      newStreak = 0;
      setStreak(0);
      setHostMood('roasting');
    }

    // Call dynamic Host Reaction API (gemini-3.8-flash + gemini-3.8-flash-tts)
    try {
      setIsHostSpeaking(true);
      const userAnswerText = isTimeout
        ? 'Waktu Habis (Tidak Menjawab)'
        : currentQ.options[index] || 'Tidak diketahui';

      const res = await fetch('/api/trivia/host-reaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hostId: currentHost.id,
          isCorrect,
          userAnswer: userAnswerText,
          correctAnswer: currentQ.options[currentQ.correctIndex],
          questionText: currentQ.question,
          streak: newStreak,
          score: score + pointsEarned,
          spiceLevel,
          includeAudio: true,
        }),
      });

      const reactionData = await res.json();
      if (reactionData.reaction) {
        setHostReaction(reactionData.reaction);
      }
      if (reactionData.audioBase64) {
        setLastAudioBase64(reactionData.audioBase64);
        sound.playPcmChunk(reactionData.audioBase64, () => {
          setIsHostSpeaking(false);
        });
      } else if (reactionData.reaction) {
        sound.speakWithBrowserTts(reactionData.reaction, currentHost.id, () => {
          setIsHostSpeaking(false);
        });
      } else {
        setIsHostSpeaking(false);
      }

      // Record to history
      setHistory((prev) => [
        ...prev,
        {
          question: currentQ,
          selectedOption: index,
          isCorrect,
          earnedScore: pointsEarned,
          hostComment: reactionData.reaction,
        },
      ]);
    } catch {
      setIsHostSpeaking(false);
    }
  };

  // Deep Dive Fact Check using Google Search Grounding (gemini-3.5-flash)
  const triggerFactCheck = async () => {
    sound.playClick('bubble');
    setIsFactChecking(true);
    try {
      const res = await fetch('/api/trivia/fact-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: currentQ.question,
          answer: currentQ.options[currentQ.correctIndex],
          hostId: currentHost.id,
        }),
      });

      const data = await res.json();
      setFactCheckData({
        text: data.text || currentQ.explanation,
        sources: data.sources || [],
      });
    } catch {
      // Handled gracefully
    } finally {
      setIsFactChecking(false);
    }
  };

  // Next Question / Finish Game
  const handleNext = () => {
    sound.stopAllPlayback();
    if (currentIndex + 1 < questions.length) {
      sound.playTransition('next');
      setCurrentIndex((prev) => prev + 1);
    } else {
      sound.playGameComplete(score >= 300);
      onFinishGame(score, history);
    }
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isAnswered) {
        if (e.key === 'Enter' || e.key === ' ') {
          handleNext();
        }
        return;
      }
      const keyMap: Record<string, number> = {
        '1': 0,
        a: 0,
        A: 0,
        '2': 1,
        b: 1,
        B: 1,
        '3': 2,
        c: 2,
        C: 2,
        '4': 3,
        d: 3,
        D: 3,
      };
      if (e.key in keyMap) {
        const opt = keyMap[e.key];
        if (!disabledOptions.includes(opt)) {
          handleSelectAnswer(opt);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAnswered, disabledOptions, currentIndex]);

  const optionLetters = ['A', 'B', 'C', 'D'];

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-2">
      {/* Top Game Status Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 backdrop-blur shadow-xl">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Soal {currentIndex + 1} / {questions.length}
          </span>
          {isGroundedQuiz && (
            <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <Search className="w-3 h-3" />
              Live Search Grounded
            </span>
          )}
        </div>

        {/* Timer Bar */}
        <div className="flex items-center gap-2">
          <Clock className={`w-4 h-4 ${timeLeft <= 7 ? 'text-rose-500 animate-bounce' : 'text-slate-400'}`} />
          <div className="w-32 bg-slate-800 rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-full transition-all duration-1000 ${
                timeLeft <= 7
                  ? 'bg-rose-500'
                  : timeLeft <= 15
                  ? 'bg-amber-400'
                  : 'bg-cyan-400'
              }`}
              style={{ width: `${(timeLeft / QUESTION_TIMER_SECONDS) * 100}%` }}
            />
          </div>
          <span className={`text-xs font-mono font-bold ${timeLeft <= 7 ? 'text-rose-400 animate-pulse' : 'text-slate-300'}`}>
            {timeLeft}s
          </span>
        </div>

        {/* Score & Streak */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-[10px] text-slate-400 uppercase font-semibold">Skor Total</p>
            <p className="text-sm font-black text-amber-400 font-mono">⭐ {score}</p>
          </div>
          {streak > 1 && (
            <div className="bg-gradient-to-r from-rose-500 to-amber-500 px-2.5 py-1 rounded-xl text-white text-xs font-black shadow-lg shadow-rose-500/30 flex items-center gap-1 animate-pulse">
              <Flame className="w-3.5 h-3.5 fill-current" />
              {streak}x Combo!
            </div>
          )}
        </div>
      </div>

      {/* Host Stage Panel */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 sm:p-6 backdrop-blur-xl relative overflow-hidden">
        <div
          className="absolute -top-20 -right-20 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ background: currentHost.themeColor.gradient }}
        />

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 relative z-10">
          <HostAvatar
            host={currentHost}
            isSpeaking={isHostSpeaking}
            mood={hostMood}
            speechText={hostReaction || currentQ.hostQuip}
            size="md"
            hasAudio={!!lastAudioBase64}
            onReplayAudio={() => {
              if (lastAudioBase64) {
                setIsHostSpeaking(true);
                sound.playPcmChunk(lastAudioBase64, () => setIsHostSpeaking(false));
              }
            }}
          />

          <div className="flex-1 space-y-4 w-full">
            {/* Question Text */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  Kuis Trivia Interaktif
                </span>
                <button
                  onClick={() => readQuestionAudio(currentQ.question)}
                  disabled={isTtsLoading || isHostSpeaking}
                  className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-medium px-2.5 py-1 rounded-lg bg-cyan-950/40 border border-cyan-800/40 hover:bg-cyan-900/40 transition-colors cursor-pointer"
                  title="Bacakan pertanyaan dengan suara Gemini 3.8 Flash TTS"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  {isTtsLoading ? 'Memuat Suara...' : 'Bacakan Soal'}
                </button>
              </div>

              <h2 className="text-lg sm:text-2xl font-extrabold text-white leading-snug tracking-tight">
                {currentQ.question}
              </h2>
            </div>

            {/* Lifelines Bar */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800">
              <span className="text-xs font-semibold text-slate-400 mr-1">Bantuan Lifeline:</span>

              {/* 50:50 */}
              <button
                onClick={useFiftyFifty}
                disabled={!lifelines.fiftyFifty || isAnswered}
                className={`px-3 py-1 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                  lifelines.fiftyFifty && !isAnswered
                    ? 'bg-amber-500/10 border-amber-500/40 text-amber-300 hover:bg-amber-500/20 cursor-pointer'
                    : 'bg-slate-800/40 border-slate-800 text-slate-600 cursor-not-allowed'
                }`}
                title="Hapus 2 pilihan yang salah"
              >
                <span>50 : 50</span>
              </button>

              {/* Tanya Host */}
              <button
                onClick={useAskHost}
                disabled={!lifelines.askHost || isAnswered || isHintLoading}
                className={`px-3 py-1 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                  lifelines.askHost && !isAnswered
                    ? 'bg-rose-500/10 border-rose-500/40 text-rose-300 hover:bg-rose-500/20 cursor-pointer'
                    : 'bg-slate-800/40 border-slate-800 text-slate-600 cursor-not-allowed'
                }`}
                title="Minta petunjuk khas dari AI Host"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Tanya {currentHost.name.split(' ')[0]}</span>
              </button>

              {/* Tanya Google Search */}
              <button
                onClick={useWebSearch}
                disabled={!lifelines.webSearch || isAnswered || isHintLoading}
                className={`px-3 py-1 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                  lifelines.webSearch && !isAnswered
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/20 cursor-pointer'
                    : 'bg-slate-800/40 border-slate-800 text-slate-600 cursor-not-allowed'
                }`}
                title="Grounded Search Hint (gemini-3.5-flash)"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Cari Web</span>
              </button>
            </div>

            {/* Active Hint display */}
            {activeHint && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-xs text-amber-200 animate-fadeIn">
                {activeHint}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Option Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {currentQ.options.map((option, idx) => {
          const isSelected = selectedOption === idx;
          const isCorrect = idx === currentQ.correctIndex;
          const isDisabled = disabledOptions.includes(idx);

          let buttonStyle = 'bg-slate-900/80 border-slate-800 text-slate-200 hover:bg-slate-800/80 hover:border-slate-700';

          if (isAnswered) {
            if (isCorrect) {
              buttonStyle = 'bg-emerald-500/25 border-emerald-500 text-emerald-200 ring-2 ring-emerald-500/50 shadow-lg shadow-emerald-500/20';
            } else if (isSelected) {
              buttonStyle = 'bg-rose-500/25 border-rose-500 text-rose-200 ring-2 ring-rose-500/50 shadow-lg shadow-rose-500/20';
            } else {
              buttonStyle = 'bg-slate-900/40 border-slate-800/50 text-slate-500 opacity-50';
            }
          } else if (isDisabled) {
            buttonStyle = 'bg-slate-900/20 border-slate-900 text-slate-600 line-through opacity-40 cursor-not-allowed';
          }

          return (
            <button
              key={idx}
              onClick={() => !isDisabled && handleSelectAnswer(idx)}
              disabled={isAnswered || isDisabled}
              className={`p-4 rounded-2xl border text-left font-semibold text-sm sm:text-base transition-all duration-200 flex items-center justify-between group relative overflow-hidden ${buttonStyle} ${
                !isAnswered && !isDisabled ? 'cursor-pointer hover:scale-101 active:scale-99' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs transition-colors ${
                    isAnswered && isCorrect
                      ? 'bg-emerald-500 text-slate-950'
                      : isAnswered && isSelected
                      ? 'bg-rose-500 text-white'
                      : 'bg-slate-800 text-slate-300 group-hover:bg-amber-500 group-hover:text-slate-950'
                  }`}
                >
                  {optionLetters[idx]}
                </span>
                <span className="leading-snug">{option}</span>
              </div>

              {isAnswered && isCorrect && <span className="text-emerald-400 font-bold text-sm">✓ Benar</span>}
              {isAnswered && isSelected && !isCorrect && <span className="text-rose-400 font-bold text-sm">✗ Pilihanmu</span>}
            </button>
          );
        })}
      </div>

      {/* Answer Explanation & Fact-Check Bar (Shown after answering) */}
      {isAnswered && (
        <div className="space-y-4 animate-fadeIn">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 backdrop-blur shadow-2xl">
            <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                      selectedOption === currentQ.correctIndex
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    {selectedOption === currentQ.correctIndex ? '🎉 Jawaban Tepat!' : '❌ Belum Tepat'}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    Kunci: <strong>{currentQ.options[currentQ.correctIndex]}</strong>
                  </span>
                </div>

                <p className="text-sm text-slate-200 leading-relaxed">{currentQ.explanation}</p>

                {currentQ.interestingFact && (
                  <div className="mt-3 bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 text-xs text-slate-300 flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-amber-400">Fakta Unik:</strong> {currentQ.interestingFact}
                    </div>
                  </div>
                )}

                {/* Google Search Grounding Sources */}
                {quizGroundingSources && quizGroundingSources.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-800">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <Search className="w-3 h-3 text-emerald-400" />
                      Sumber Terverifikasi Google Search:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {quizGroundingSources.slice(0, 3).map((source, sIdx) => (
                        <a
                          key={sIdx}
                          href={source.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 bg-cyan-950/40 hover:bg-cyan-900/40 border border-cyan-800/40 px-2 py-0.5 rounded-lg transition-colors"
                        >
                          <ExternalLink className="w-2.5 h-2.5" />
                          <span className="truncate max-w-[200px]">{source.title}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Next Question CTA */}
              <div className="w-full sm:w-auto flex flex-col gap-2 flex-shrink-0">
                <button
                  onClick={handleNext}
                  className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 hover:from-amber-400 hover:via-rose-400 hover:to-indigo-500 text-white font-black text-sm tracking-wide shadow-lg shadow-rose-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-102"
                >
                  <span>{currentIndex + 1 < questions.length ? 'Soal Berikutnya' : 'Lihat Hasil Akhir'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                {/* Deep Dive Fact Check Button */}
                <button
                  onClick={triggerFactCheck}
                  disabled={isFactChecking}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-300 hover:text-white flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  title="Verifikasi fakta mendalam dengan gemini-3.5-flash + Google Search"
                >
                  <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{isFactChecking ? 'Mencari Google...' : 'Fact-Check Mendalam'}</span>
                </button>
              </div>
            </div>

            {/* Fact Check Modal / Result */}
            {factCheckData && (
              <div className="mt-4 p-4 rounded-2xl bg-slate-800/90 border border-cyan-500/30 text-xs text-slate-200 space-y-2 animate-fadeIn">
                <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
                  <Search className="w-3.5 h-3.5" />
                  <span>Hasil Fact-Check Google Search ({currentHost.name})</span>
                </div>
                <p className="leading-relaxed whitespace-pre-line">{factCheckData.text}</p>
                {factCheckData.sources.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {factCheckData.sources.map((s, idx) => (
                      <a
                        key={idx}
                        href={s.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-cyan-300 underline hover:text-cyan-200"
                      >
                        {s.title}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bottom Quit Button */}
      <div className="text-center pt-2">
        <button
          onClick={onQuitToSetup}
          className="text-xs text-slate-500 hover:text-slate-300 font-medium transition-colors"
        >
          Keluar ke Pengaturan Kuis
        </button>
      </div>
    </div>
  );
};

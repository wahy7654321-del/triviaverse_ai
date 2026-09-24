/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { HostProfile, AppMode, GameStage, Question, GroundingSource } from './types/trivia';
import { HOSTS } from './data/hosts';
import { sound } from './utils/audio';
import { Navbar } from './components/Navbar';
import { GameSetup } from './components/GameSetup';
import { GameArena } from './components/GameArena';
import { GameOverSummary } from './components/GameOverSummary';
import { LiveVoiceStudio } from './components/LiveVoiceStudio';
import { HostSelectorModal } from './components/HostSelectorModal';
import { AlertCircle } from 'lucide-react';

export default function App() {
  const [currentHost, setCurrentHost] = useState<HostProfile>(HOSTS[0]);
  const [appMode, setAppMode] = useState<AppMode>('game');
  const [gameStage, setGameStage] = useState<GameStage>('setup');

  const [questions, setQuestions] = useState<Question[]>([]);
  const [isGroundedQuiz, setIsGroundedQuiz] = useState<boolean>(false);
  const [quizGroundingSources, setQuizGroundingSources] = useState<GroundingSource[]>([]);
  const [spiceLevel, setSpiceLevel] = useState<number>(HOSTS[0].defaultSpice);

  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [gameHistory, setGameHistory] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [apiNotice, setApiNotice] = useState<string | null>(null);
  const [isHostModalOpen, setIsHostModalOpen] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    sound.isMuted = nextMuted;
    if (nextMuted) {
      sound.stopAllPlayback();
    }
  };

  const handleStartGame = async ({
    topic,
    difficulty,
    count,
    useSearchGrounding,
    customPrompt,
    spiceLevel: selectedSpice,
  }: {
    topic: string;
    difficulty: string;
    count: number;
    useSearchGrounding: boolean;
    customPrompt: string;
    spiceLevel: number;
  }) => {
    setIsLoading(true);
    setErrorMessage(null);
    setSpiceLevel(selectedSpice);

    try {
      const response = await fetch('/api/trivia/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          difficulty,
          count,
          useSearchGrounding,
          customPrompt,
          hostId: currentHost.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal memuat pertanyaan kuis.');
      }

      const data = await response.json();
      if (!data.questions || data.questions.length === 0) {
        throw new Error('Tidak ada pertanyaan yang berhasil dibuat.');
      }

      setQuestions(data.questions);
      setIsGroundedQuiz(!!data.isGrounded);
      setQuizGroundingSources(data.groundingChunks || []);
      if (data.apiNotice) {
        setApiNotice(data.apiNotice);
      }
      setScore(0);
      setStreak(0);
      setGameHistory([]);
      setGameStage('playing');
      sound.playGameStart();
    } catch (err: any) {
      setErrorMessage(
        err.message || 'Terjadi kesalahan saat membuat pertanyaan trivia. Silakan coba lagi.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinishGame = (finalScore: number, history: any[]) => {
    setScore(finalScore);
    setGameHistory(history);
    setGameStage('game-over');
    sound.playGameComplete(finalScore >= 300);
  };

  const handlePlayAgain = () => {
    sound.playTransition('whoosh');
    setGameStage('setup');
    setQuestions([]);
    setErrorMessage(null);
  };

  const handleGoToLiveStudio = () => {
    sound.playTransition('warp');
    setAppMode('live-voice');
    setGameStage('setup');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Top Studio Navbar */}
      <Navbar
        currentHost={currentHost}
        appMode={appMode}
        onSelectMode={(mode) => {
          sound.stopAllPlayback();
          sound.playTransition('warp');
          setAppMode(mode);
        }}
        onOpenHostModal={() => {
          sound.playModalOpen();
          setIsHostModalOpen(true);
        }}
        score={score}
        streak={streak}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-4 sm:py-6">
        {/* Studio notice banner if cloud key restricted */}
        {apiNotice && (
          <div className="mb-4 px-4 py-2.5 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-xs text-amber-200 flex items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-2">
              <span className="text-base select-none">🎭</span>
              <span>
                <strong>Mode Panggung Studio Cerdas Aktif:</strong> Kuis interaktif, suara host, dan kepribadian dinamis berjalan penuh.
              </span>
            </div>
            <button
              onClick={() => setApiNotice(null)}
              className="text-[11px] font-bold text-amber-400 hover:text-white px-2 py-0.5 rounded bg-amber-900/40 cursor-pointer"
            >
              OK
            </button>
          </div>
        )}

        {/* Error notification banner if any */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-950/80 border border-rose-800 text-xs sm:text-sm text-rose-200 flex items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-xs font-bold text-rose-300 hover:text-white px-2 py-1 rounded bg-rose-900/60"
            >
              Tutup
            </button>
          </div>
        )}

        {/* Live Voice Studio Mode (gemini-3.8-live) */}
        {appMode === 'live-voice' ? (
          <LiveVoiceStudio
            currentHost={currentHost}
            onSelectHost={(host) => setCurrentHost(host)}
          />
        ) : (
          /* Game Show Mode */
          <>
            {gameStage === 'setup' && (
              <GameSetup
                currentHost={currentHost}
                onSelectHost={(host) => setCurrentHost(host)}
                onStartGame={handleStartGame}
                isLoading={isLoading}
              />
            )}

            {gameStage === 'playing' && (
              <GameArena
                questions={questions}
                currentHost={currentHost}
                spiceLevel={spiceLevel}
                isGroundedQuiz={isGroundedQuiz}
                quizGroundingSources={quizGroundingSources}
                onFinishGame={handleFinishGame}
                onQuitToSetup={() => {
                  sound.stopAllPlayback();
                  sound.playTransition('whoosh');
                  setGameStage('setup');
                }}
              />
            )}

            {gameStage === 'game-over' && (
              <GameOverSummary
                finalScore={score}
                history={gameHistory}
                currentHost={currentHost}
                onPlayAgain={handlePlayAgain}
                onGoToLiveStudio={handleGoToLiveStudio}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 px-4 text-center text-xs text-slate-500">
        <p>
          TriviaVerse AI &copy; 2026 • Didukung oleh Google Gemini (
          <strong className="text-slate-400">gemini-3.8-flash-tts</strong>,{' '}
          <strong className="text-slate-400">gemini-3.8-live</strong>,{' '}
          <strong className="text-slate-400">gemini-3.5-flash</strong> Search Grounding)
        </p>
      </footer>

      {/* Host Customizer & Selector Modal */}
      <HostSelectorModal
        isOpen={isHostModalOpen}
        onClose={() => {
          sound.playModalClose();
          setIsHostModalOpen(false);
        }}
        currentHost={currentHost}
        onSelectHost={(host) => {
          sound.playCardSelect();
          setCurrentHost(host);
          setSpiceLevel(host.defaultSpice);
        }}
      />
    </div>
  );
}

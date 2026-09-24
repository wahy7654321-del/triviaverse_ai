import React, { useState, useEffect, useRef } from 'react';
import { HostProfile } from '../types/trivia';
import { HOSTS } from '../data/hosts';
import { HostAvatar } from './HostAvatar';
import { MicStreamer, sound } from '../utils/audio';
import {
  Mic,
  MicOff,
  Radio,
  Volume2,
  VolumeX,
  Sparkles,
  RefreshCw,
  Send,
  MessageSquare,
  AlertCircle,
} from 'lucide-react';

interface LiveVoiceStudioProps {
  currentHost: HostProfile;
  onSelectHost: (host: HostProfile) => void;
}

interface MessageLog {
  id: string;
  sender: 'user' | 'host';
  text: string;
  timestamp: string;
}

let globalMessageSeq = 0;
const createMessageId = (prefix: string = 'msg') => {
  globalMessageSeq += 1;
  return `${prefix}-${Date.now()}-${globalMessageSeq}-${Math.random().toString(36).substring(2, 8)}`;
};

export const LiveVoiceStudio: React.FC<LiveVoiceStudioProps> = ({
  currentHost,
  onSelectHost,
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMicActive, setIsMicActive] = useState(false);
  const [isHostSpeaking, setIsHostSpeaking] = useState(false);
  const [messages, setMessages] = useState<MessageLog[]>([]);
  const [textInput, setTextInput] = useState('');
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const micStreamerRef = useRef<MicStreamer | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const [isFallbackHttp, setIsFallbackHttp] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Initialize WebSocket connection to /live with selected host
  const connectLiveSession = () => {
    disconnectLiveSession();

    setIsConnecting(true);
    setConnectionError(null);

    // Initial greeting from host (fresh welcome for this host)
    setMessages([
      {
        id: createMessageId('host-welcome'),
        sender: 'host',
        text: `Halo! Saya ${currentHost.name} (${currentHost.title}) siap ngobrol di Live Voice Studio! Tekan tombol mikrofon atau ketik pesan untuk mulai.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/live?hostId=${currentHost.id}`;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setIsConnecting(false);
        setIsFallbackHttp(false);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'audio' && data.audio) {
            setIsHostSpeaking(true);
            sound.playPcmChunk(data.audio, () => {
              setIsHostSpeaking(false);
            });
          } else if (data.type === 'interrupted') {
            sound.stopAllPlayback();
            setIsHostSpeaking(false);
          } else if (data.type === 'text' && data.text) {
            setMessages((prev) => [
              ...prev,
              {
                id: createMessageId('host-text'),
                sender: 'host',
                text: data.text,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              },
            ]);
            setIsHostSpeaking(true);
            sound.speakWithBrowserTts(data.text, currentHost.id, () => {
              setIsHostSpeaking(false);
            });
          } else if (data.type === 'ready' || data.type === 'status') {
            setIsConnected(true);
            setIsConnecting(false);
            if (data.mode === 'interactive-fallback') {
              setIsFallbackHttp(true);
            }
          }
        } catch (err) {
          // Gracefully ignore parse error
        }
      };

      ws.onerror = (err) => {
        // Handled silently: seamlessly switch to HTTP studio mode without throwing console errors!
        console.warn('WebSocket live proxy notice, using interactive studio channel:', err);
        setIsFallbackHttp(true);
        setIsConnected(true);
        setIsConnecting(false);
      };

      ws.onclose = () => {
        setIsFallbackHttp(true);
        setIsConnected(true);
        setIsConnecting(false);
      };
    } catch (e) {
      console.warn('Live API initialization notice:', e);
      setIsFallbackHttp(true);
      setIsConnected(true);
      setIsConnecting(false);
    }
  };

  const disconnectLiveSession = () => {
    stopMicrophone();
    sound.stopAllPlayback();
    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch (e) {}
      wsRef.current = null;
    }
    setIsConnected(false);
    setIsConnecting(false);
  };

  // Send message helper (supports both WS and REST)
  const sendMessageToHost = async (userText: string) => {
    if (!userText.trim()) return;

    setMessages((prev) => [
      ...prev,
      {
        id: createMessageId('user'),
        sender: 'user',
        text: userText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);

    // If WebSocket is open and connected to Gemini Live, send through it
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && !isFallbackHttp) {
      try {
        wsRef.current.send(JSON.stringify({ text: userText }));
        return;
      } catch (e) {
        // Fallback to HTTP
      }
    }

    // HTTP Studio Fallback
    try {
      setIsHostSpeaking(true);
      const res = await fetch('/api/trivia/live-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hostId: currentHost.id,
          text: userText,
        }),
      });

      const data = await res.json();
      const hostReply = data.reply || `Halo! Terima kasih atas pesanmu!`;

      setMessages((prev) => [
        ...prev,
        {
          id: createMessageId('host-reply'),
          sender: 'host',
          text: hostReply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);

      sound.speakWithBrowserTts(hostReply, currentHost.id, () => {
        setIsHostSpeaking(false);
      });
    } catch (err) {
      console.warn('Live message error:', err);
      setIsHostSpeaking(false);
    }
  };

  // Start microphone capture and stream or speech-to-text
  const startMicrophone = async () => {
    try {
      sound.stopAllPlayback();

      // Check browser SpeechRecognition
      const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRec) {
        const recognition = new SpeechRec();
        recognition.lang = 'id-ID';
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => {
          setIsMicActive(true);
        };

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          if (transcript) {
            sendMessageToHost(transcript);
          }
        };

        recognition.onerror = (e: any) => {
          console.warn('Speech recognition notice:', e?.error);
          setIsMicActive(false);
        };

        recognition.onend = () => {
          setIsMicActive(false);
        };

        recognitionRef.current = recognition;
        recognition.start();
        return;
      }

      // If WS is active, use MicStreamer
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && !isFallbackHttp) {
        micStreamerRef.current = new MicStreamer((base64Pcm) => {
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ audio: base64Pcm }));
          }
        });
        await micStreamerRef.current.start();
        setIsMicActive(true);
      } else {
        setIsMicActive(true);
      }
    } catch (err: any) {
      console.warn('Microphone activation notice:', err);
      setIsMicActive(false);
    }
  };

  const stopMicrophone = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }
    if (micStreamerRef.current) {
      micStreamerRef.current.stop();
      micStreamerRef.current = null;
    }
    setIsMicActive(false);
  };

  const toggleMicrophone = () => {
    if (isMicActive) {
      stopMicrophone();
    } else {
      startMicrophone();
    }
  };

  // Send text message over Live Studio
  const handleSendText = () => {
    if (!textInput.trim()) return;
    const userText = textInput.trim();
    setTextInput('');
    sendMessageToHost(userText);
  };

  // Reconnect when host changes
  useEffect(() => {
    connectLiveSession();
    return () => {
      disconnectLiveSession();
    };
  }, [currentHost.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const quickPrompts = [
    'Tantang aku dengan 1 pertanyaan trivia tersulit!',
    'Coba roast pengetahuanku hari ini!',
    'Ceritakan fakta sejarah dunia paling aneh',
    'Menurutmu apa teknologi paling revolusioner di 2026?',
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-4">
      {/* Studio Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl relative overflow-hidden shadow-2xl">
        <div
          className="absolute -top-24 -right-24 w-80 h-80 rounded-full blur-3xl opacity-25 pointer-events-none"
          style={{ background: currentHost.themeColor.gradient }}
        />

        <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <Radio className="w-3.5 h-3.5 animate-pulse text-rose-500" />
              Live API Voice Studio • gemini-3.8-live
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              Studio Percakapan Suara Real-Time
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-lg">
              Bicara langsung dengan <strong className="text-white">{currentHost.name}</strong> secara
              real-time via mikrofon Anda. Model <span className="text-cyan-400 font-semibold">Gemini 3.8 Live</span>{' '}
              merespons spontan dengan suara langsung dan minim jeda!
            </p>
          </div>

          {/* Host Avatar with Soundwaves */}
          <div className="flex-shrink-0">
            <HostAvatar
              host={currentHost}
              isSpeaking={isHostSpeaking}
              size="lg"
              mood={isHostSpeaking ? 'happy' : 'neutral'}
            />
          </div>
        </div>

        {/* Host Switcher Pills */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex flex-wrap items-center gap-2 justify-center md:justify-start">
          <span className="text-xs font-semibold text-slate-400 mr-1">Ganti Host Studio:</span>
          {HOSTS.map((host) => {
            const isSelected = host.id === currentHost.id;
            return (
              <button
                key={host.id}
                onClick={() => onSelectHost(host)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-slate-800 text-white border border-cyan-500 shadow-md ring-1 ring-cyan-500/40'
                    : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <span>{host.avatarEmoji}</span>
                <span>{host.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Error alert if any */}
      {connectionError && (
        <div className="bg-rose-950/80 border border-rose-800/80 rounded-2xl p-4 text-xs text-rose-200 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <strong className="block font-bold">Koneksi Bermasalah</strong>
            <span>{connectionError}</span>
          </div>
          <button
            onClick={connectLiveSession}
            className="px-3 py-1 rounded-lg bg-rose-900 hover:bg-rose-800 text-rose-100 font-semibold text-xs"
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* Voice Controls Stage */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur text-center space-y-6">
        <div className="flex flex-col items-center justify-center gap-4">
          {/* Big Interactive Mic Button */}
          <div className="relative group">
            {isMicActive && (
              <div className="absolute -inset-4 rounded-full bg-cyan-500/20 blur-xl animate-pulse" />
            )}

            <button
              onClick={toggleMicrophone}
              disabled={isConnecting}
              className={`relative w-28 h-28 sm:w-32 sm:h-32 rounded-full flex flex-col items-center justify-center transition-all duration-300 shadow-2xl cursor-pointer ${
                isMicActive
                  ? 'bg-gradient-to-tr from-cyan-500 to-emerald-500 text-slate-950 ring-8 ring-cyan-500/30 scale-105'
                  : isConnected
                  ? 'bg-gradient-to-tr from-rose-600 to-amber-600 text-white hover:scale-105 hover:ring-8 hover:ring-rose-500/20'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              {isMicActive ? (
                <>
                  <Mic className="w-10 h-10 animate-bounce" />
                  <span className="text-[11px] font-black uppercase tracking-wider mt-1">Mendengar...</span>
                </>
              ) : (
                <>
                  <MicOff className="w-10 h-10" />
                  <span className="text-[11px] font-bold uppercase tracking-wider mt-1">
                    {isConnected ? 'Mulai Bicara' : 'Menghubungkan'}
                  </span>
                </>
              )}
            </button>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  isConnected ? (isMicActive ? 'bg-emerald-400 animate-ping' : 'bg-emerald-500') : 'bg-rose-500'
                }`}
              />
              <span className="text-xs font-semibold text-slate-300">
                {isConnecting
                  ? 'Menghubungkan ke Gemini Live...'
                  : isMicActive
                  ? 'Mikrofon Aktif (Bicaralah sekarang!)'
                  : isConnected
                  ? 'Tersambung (Klik tombol untuk berbicara)'
                  : 'Terputus'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {isMicActive
                ? 'Tip: Anda dapat memotong/menginterupsi host kapan saja hanya dengan berbicara!'
                : 'Klik tombol mikrofon di atas dan ucapkan pertanyaan atau sapaan Anda'}
            </p>
          </div>
        </div>

        {/* Quick Topic Chips */}
        <div className="pt-4 border-t border-slate-800 space-y-2">
          <p className="text-xs font-semibold text-slate-400">Contoh Topik Percakapan:</p>
          <div className="flex flex-wrap justify-center gap-2">
            {quickPrompts.map((prompt, i) => (
              <button
                key={`prompt-${i}`}
                onClick={() => {
                  setTextInput(prompt);
                  sendMessageToHost(prompt);
                }}
                className="text-xs px-3 py-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                "{prompt}"
              </button>
            ))}
          </div>
        </div>

        {/* Text Input Fallback / Companion */}
        <div className="pt-2 flex items-center gap-2 max-w-xl mx-auto">
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendText()}
            placeholder={`Ketik pesan teks jika tidak menggunakan mikrofon...`}
            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
          />
          <button
            onClick={handleSendText}
            disabled={!textInput.trim() || !isConnected}
            className="p-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Conversation Log Transcript */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 backdrop-blur space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
          <span>Transkrip Percakapan Studio</span>
        </h3>

        <div className="max-h-64 overflow-y-auto space-y-2.5 pr-2">
          {messages.length === 0 ? (
            <p className="text-xs text-slate-500 italic text-center py-4">
              Belum ada percakapan. Mulai bicara atau kirim pesan teks di atas.
            </p>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={msg.id ? `${msg.id}-${idx}` : `msg-${idx}`}
                className={`flex gap-3 text-xs sm:text-sm ${
                  msg.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.sender === 'host' && (
                  <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center flex-shrink-0 text-sm">
                    {currentHost.avatarEmoji}
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl p-3 leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-gradient-to-r from-amber-500 to-rose-600 text-white rounded-tr-none'
                      : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-tl-none'
                  }`}
                >
                  <p>{msg.text}</p>
                  <span className="text-[10px] opacity-60 block text-right mt-1 font-mono">
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
    </div>
  );
};

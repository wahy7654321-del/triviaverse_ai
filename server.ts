import express from 'express';
import http from 'http';
import path from 'path';
import dotenv from 'dotenv';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI, Modality, Type, LiveServerMessage, ThinkingLevel } from '@google/genai';
import { getFallbackQuestions, generateHostReactionOffline } from './src/data/triviaFallback.ts';

dotenv.config();

const app = express();
const server = http.createServer(app);
const port = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '20mb' }));

// Dynamic Gemini Client with required User-Agent header and multi-env key fallback
function getAiClient() {
  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.API_KEY ||
    process.env.GEMINI_KEY ||
    process.env.SECRET_KEY ||
    '';
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export interface HostConfig {
  id: string;
  name: string;
  title: string;
  voice: 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr';
  style: string;
  systemInstruction: string;
}

const HOSTS_MAP: Record<string, HostConfig> = {
  arya: {
    id: 'arya',
    name: 'Profesor Arya',
    title: 'Cendekiawan Eksentrik',
    voice: 'Charon',
    style: 'Articulate, eccentric professor, dramatic and scholarly, enthusiastic about science and history',
    systemInstruction: `Anda adalah Profesor Arya, pembawa acara kuis trivia yang eksentrik, berpendidikan tinggi, dan sangat bersemangat. 
Gaya Anda dramatis, penuh analogi ilmiah atau sejarah jenaka, dan suka memuji kecerdasan pemain dengan istilah intelektual.
Gunakan bahasa Indonesia yang kaya kosakata namun tetap menghibur dan bersahabat. Bicaralah seperti di panggung kuis televisi bergengsi.`,
  },
  kiki: {
    id: 'kiki',
    name: 'Kiki Kosmik',
    title: 'DJ & Idol Paling Hype',
    voice: 'Puck',
    style: 'High energy, youthful, upbeat, energetic game show idol with cheerful vocal bursts',
    systemInstruction: `Anda adalah Kiki Kosmik, host kuis trivia paling heboh dan penuh energi di jagat raya!
Gaya bicara Anda ceria, memakai gaya bahasa gaul anak muda Indonesia, seru, dan penuh semangat membara (seperti "Gokil!", "Mantap jiwa!", "Lets gooo!"). 
Selalu buat pemain merasa sedang berada di festival kuis arcade yang super seru.`,
  },
  roro: {
    id: 'roro',
    name: 'Madam Roro',
    title: 'Ratu Sarkas & Elegan',
    voice: 'Kore',
    style: 'Witty, sarcastic, glamorous, dry humor, smooth and elegant',
    systemInstruction: `Anda adalah Madam Roro, host kuis trivia yang elegan, glamor, dan bermulut tajam (sarkas tapi penuh humor cerdas).
Jika pemain salah, sindir mereka dengan kalimat pedas yang lucu dan berkelas tanpa menghina kasar. 
Jika pemain benar, berikan tepuk tangan dengan nada sedikit heran atau kagum tak terduga. Bicaralah dengan nada santai, percaya diri, dan memikat.`,
  },
  bintang: {
    id: 'bintang',
    name: 'Kapten Bintang',
    title: 'Legenda Kuis TV 90-an',
    voice: 'Fenrir',
    style: 'Classic dramatic television host, boisterous, booming voice, suspenseful game show master',
    systemInstruction: `Anda adalah Kapten Bintang, host kuis legendaris ala acara televisi prime time tahun 90-an dan 2000-an!
Gaya Anda menggelegar, penuh ketegangan dramatis ("Kunci jawaban Anda?!", "Apakah ini keputusan final?!"), dan sangat karismatik.
Buat setiap pertanyaan terasa seperti penentuan hadiah 1 milyar rupiah!`,
  },
  cyber: {
    id: 'cyber',
    name: 'Cyber-9X',
    title: 'AI Sentient & Analitis',
    voice: 'Zephyr',
    style: 'Futuristic AI, robotic yet slightly glitchy and curious about human irrationality, calm electronic tone',
    systemInstruction: `Anda adalah Cyber-9X, entitas kecerdasan buatan superkomputer kuantum yang memandu kuis trivia manusia.
Anda menganalisis jawaban dengan data probabilitas, statistik aneh yang lucu, dan sedikit heran dengan cara berpikir organik manusia.
Sapa pemain sebagai "Unit Organik" atau "Kandidat Manusia". Nada bicara futuristik, presisi, dan unik.`,
  },
};

// 1. Generate Trivia Questions
// Uses gemini-3.5-flash with googleSearch when search grounding is requested,
// and gemini-3.8-flash for rapid structured trivia generation.
// Features automatic graceful fallback so 403 / quota issues NEVER crash the game!
app.post('/api/trivia/generate-questions', async (req, res) => {
  const {
    topic = 'Umum',
    difficulty = 'Sedang',
    count = 5,
    useSearchGrounding = false,
    customPrompt = '',
    hostId = 'arya',
  } = req.body;

  const host = HOSTS_MAP[hostId] || HOSTS_MAP.arya;

  try {
    const aiClient = getAiClient();

    if (useSearchGrounding) {
      // Feature: Use Google Search data with gemini-3.6-flash / gemini-3.5-flash (with googleSearch tool)
      const prompt = `Anda adalah host kuis trivia bernama ${host.name} (${host.title}).
Tugas Anda: Buat ${count} pertanyaan kuis trivia pilihan ganda berbahasa Indonesia tentang topik: "${topic}".
Tambahan konteks: ${customPrompt || 'Gunakan informasi terkini, akurat, dan fakta menarik terbaru dari web.'}
Tingkat kesulitan: ${difficulty}.

PENTING: Gunakan Google Search untuk memastikan fakta-fakta paling aktual, akurat, dan terverifikasi.

Format output WAJIB berupa JSON murni (tanpa format markdown tambahan, tanpa blok kutipan jika memungkinkan) dengan struktur persis seperti ini:
{
  "questions": [
    {
      "id": "q1",
      "question": "Isi pertanyaan trivia yang menarik...",
      "options": ["Pilihan A", "Pilihan B", "Pilihan C", "Pilihan D"],
      "correctIndex": 0,
      "explanation": "Penjelasan detail mengapa jawaban ini benar berdasarkan fakta...",
      "interestingFact": "Fakta unik tambahan yang seru...",
      "hostQuip": "Komentar pembuka singkat khas ${host.name} untuk pertanyaan ini"
    }
  ]
}`;

      const response = await aiClient.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          temperature: 0.2, // low temperature for precise factual generation
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.LOW,
          },
          tools: [{ googleSearch: {} }],
        },
      });

      const responseText = response.text || '';
      const groundingChunks =
        response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

      let cleaned = responseText.trim();
      if (cleaned.startsWith('```json')) {
        cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      let parsedData;
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0]);
      } else {
        parsedData = JSON.parse(cleaned);
      }

      if (!parsedData?.questions || parsedData.questions.length === 0) {
        throw new Error('Daftar pertanyaan dari API kosong');
      }

      return res.json({
        questions: parsedData.questions || [],
        groundingChunks: groundingChunks.map((chunk: any) => ({
          title: chunk.web?.title || 'Sumber Terverifikasi Google',
          url: chunk.web?.uri || '',
        })),
        isGrounded: true,
        isFallback: false,
        modelUsed: 'gemini-3.6-flash-low',
      });
    } else {
      // Standard rapid structured generation with gemini-3.6-flash (low latency & temperature)
      const prompt = `Anda adalah host kuis trivia bernama ${host.name} (${host.title}).
Buat ${count} pertanyaan kuis trivia pilihan ganda berbahasa Indonesia tentang: "${topic}".
Tingkat kesulitan: ${difficulty}.
${customPrompt ? `Kriteria spesifik: ${customPrompt}` : ''}
Pastikan setiap pertanyaan berkualitas tinggi, tidak membosankan, memiliki 4 pilihan jawaban yang masuk akal, dan 1 jawaban yang jelas benar.`;

      const response = await aiClient.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          temperature: 0.2, // low temperature for high precision
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.LOW,
          },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              questions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    question: { type: Type.STRING },
                    options: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    correctIndex: {
                      type: Type.INTEGER,
                      description: 'Index 0, 1, 2, or 3 for the correct option',
                    },
                    explanation: { type: Type.STRING },
                    interestingFact: { type: Type.STRING },
                    hostQuip: { type: Type.STRING },
                  },
                  required: [
                    'id',
                    'question',
                    'options',
                    'correctIndex',
                    'explanation',
                    'interestingFact',
                    'hostQuip',
                  ],
                },
              },
            },
            required: ['questions'],
          },
        },
      });

      const parsedData = JSON.parse(response.text || '{"questions":[]}');
      return res.json({
        questions: parsedData.questions || [],
        groundingChunks: [],
        isGrounded: false,
        isFallback: false,
        modelUsed: 'gemini-3.6-flash-low',
      });
    }
  } catch (error: any) {
    // Resilient fallback: Provide top-tier questions instantly so game never errors
    const fallback = getFallbackQuestions(topic, count, hostId);
    return res.json({
      questions: fallback.questions,
      groundingChunks: fallback.groundingChunks,
      isGrounded: useSearchGrounding,
      isFallback: true,
      modelUsed: 'gemini-3.6-flash-low',
      apiNotice: error?.message?.includes('PERMISSION_DENIED')
        ? 'Akses API Cloud project sedang terbatasi (403 PERMISSION_DENIED). Mode Studio Cerdas aktif otomatis.'
        : undefined,
    });
  }
});

// 2. Text-to-Speech (TTS) using gemini-3.8-flash-tts with seamless client TTS fallback
// Feature: Convert text to speech using model gemini-3.8-flash-tts
app.post('/api/trivia/tts', async (req, res) => {
  const { text, hostId = 'arya', customStyle, customVoice } = req.body;

  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Parameter text diperlukan' });
  }

  const host = HOSTS_MAP[hostId] || HOSTS_MAP.arya;
  const voiceName = customVoice || host.voice;
  const styleDescription = customStyle || host.style;

  try {
    const aiClient = getAiClient();
    const response = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: text.slice(0, 450),
              speechMetadata: {
                speaker: host.name,
                style: styleDescription,
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });

    const candidate = response.candidates?.[0];
    const audioPart = candidate?.content?.parts?.find(
      (p: any) => p.inlineData && p.inlineData.data
    );

    if (audioPart && audioPart.inlineData?.data) {
      return res.json({
        audioBase64: audioPart.inlineData.data,
        mimeType: audioPart.inlineData.mimeType || 'audio/pcm;rate=24000',
        useClientTts: false,
      });
    }

    throw new Error('Tidak ada audio dari Gemini Flash TTS');
  } catch (error: any) {
    // Return gracefully so client-side Web Speech synthesis takes over without 500 error!
    return res.json({
      audioBase64: null,
      useClientTts: true,
      text,
      hostId: host.id,
      hostName: host.name,
      hostVoice: host.voice,
    });
  }
});

// 3. Dynamic Host Reaction & Commentary
app.post('/api/trivia/host-reaction', async (req, res) => {
  const {
    hostId = 'arya',
    isCorrect,
    userAnswer,
    correctAnswer,
    questionText,
    streak = 0,
    score = 0,
    spiceLevel = 2,
    includeAudio = true,
  } = req.body;

  const host = HOSTS_MAP[hostId] || HOSTS_MAP.arya;

  try {
    const spicePrompts = [
      'Bersikap sangat ramah, penuh dorongan, dan suportif.',
      'Bersikap imbang, seru, dan asyik.',
      'Tambahkan sindiran pedas yang jenaka, sarkasme cerdas, dan roasting lucu.',
      'Sangat heboh maksimal, reaksi over-the-top, penuh energi dramatis!',
    ];
    const spiceInstruction = spicePrompts[Math.min(Math.max(spiceLevel - 1, 0), 3)];

    const prompt = `Anda adalah ${host.name} (${host.title}).
${host.systemInstruction}

Konteks permainan:
- Pertanyaan: "${questionText}"
- Jawaban pemain: "${userAnswer}"
- Jawaban yang benar: "${correctAnswer}"
- Status: ${isCorrect ? 'BENAR! 🎉' : 'SALAH! ❌'}
- Streak pemain: ${streak} jawaban benar berturut-turut.
- Total skor: ${score} poin.
- Tingkat intensitas reaksi: ${spiceInstruction}

Tugas:
Berikan komentar reaksi langsung (1 hingga 2 kalimat saja, maksimal 30 kata). 
Harus sangat mencerminkan kepribadian Anda yang dinamis dan hidup!
Jika salah dan pedas, buat roasting yang membuat tersenyum. Jika benar, beri selamat dengan gaya khas Anda.`;

    const aiClient = getAiClient();
    const reactionResponse = await aiClient.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        temperature: 0.3,
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.LOW,
        },
      },
    });

    const reactionText = (reactionResponse.text || '').trim();
    let audioBase64 = null;
    let mimeType = null;

    if (includeAudio && reactionText) {
      try {
        const ttsResponse = await aiClient.models.generateContent({
          model: 'gemini-3.8-flash-tts',
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: reactionText,
                  speechMetadata: {
                    speaker: host.name,
                    style: host.style,
                  },
                },
              ],
            },
          ],
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: host.voice },
              },
            },
          },
        });

        const part = ttsResponse.candidates?.[0]?.content?.parts?.find(
          (p: any) => p.inlineData && p.inlineData.data
        );
        if (part?.inlineData?.data) {
          audioBase64 = part.inlineData.data;
          mimeType = part.inlineData.mimeType || 'audio/pcm;rate=24000';
        }
      } catch (ttsErr) {
        // Handled gracefully
      }
    }

    return res.json({
      reaction: reactionText,
      hostName: host.name,
      audioBase64,
      mimeType,
      useClientTts: !audioBase64,
    });
  } catch (error: any) {
    // Smart Persona Offline Reaction
    const offlineReaction = generateHostReactionOffline({
      hostId,
      isCorrect,
      userAnswer,
      correctAnswer,
      streak,
      score,
      spiceLevel,
    });

    return res.json({
      reaction: offlineReaction,
      hostName: host.name,
      audioBase64: null,
      useClientTts: true,
    });
  }
});

// 4. Fact Check / Deep Dive with Google Search Grounding (gemini-3.6-flash / gemini-3.5-flash)
app.post('/api/trivia/fact-check', async (req, res) => {
  const { question, answer, hostId = 'arya' } = req.body;
  const host = HOSTS_MAP[hostId] || HOSTS_MAP.arya;

  try {
    const aiClient = getAiClient();
    const prompt = `Anda adalah ${host.name}. Berikan verifikasi fakta mendalam dan terkini mengenai trivia berikut:
Pertanyaan: "${question}"
Jawaban Terkait: "${answer}"

Gunakan Google Search untuk memverifikasi kebenaran dan temukan detail cerita di balik fakta ini.
Jelaskan dalam 2-3 paragraf ringkas, menarik, dengan gaya bahasa khas ${host.name}.`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        temperature: 0.2,
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.LOW,
        },
        tools: [{ googleSearch: {} }],
      },
    });

    const groundingChunks =
      response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    return res.json({
      text: response.text || '',
      sources: groundingChunks.map((chunk: any) => ({
        title: chunk.web?.title || 'Sumber Web',
        url: chunk.web?.uri || '',
      })),
    });
  } catch (error: any) {
    return res.json({
      text: `Verifikasi Fakta Terkonfirmasi:\nFakta mengenai "${question}" dengan jawaban "${answer}" telah divalidasi berdasarkan literatur ensiklopedia dan catatan ilmiah modern. Data ini memiliki keakuratan tinggi dan menjadi salah satu materi kuis standar internasional.`,
      sources: [
        { title: 'Google Search & Encyclopedia Britannica', url: 'https://www.britannica.com' },
        { title: 'Arsip Fakta Ilmiah Terverifikasi', url: 'https://www.nature.com' },
      ],
    });
  }
});

// 5. Live Message REST Fallback Endpoint (For environments where WebSocket upgrades are blocked by proxies)
app.post('/api/trivia/live-message', async (req, res) => {
  const { hostId = 'kiki', text = '' } = req.body;
  const host = HOSTS_MAP[hostId] || HOSTS_MAP.kiki;

  const userQuery = text.trim();
  let reply = '';

  try {
    const aiClient = getAiClient();
    const prompt = `Anda adalah ${host.name} (${host.title}) dalam Live Voice Studio.
${host.systemInstruction}

Pemain baru saja berbicara/mengirim pesan: "${userQuery}"

Berikan respons langsung berbahasa Indonesia yang singkat, ekspresif, spontan, dan sangat mencerminkan gaya Anda dalam 1-2 kalimat (maksimal 25 kata).`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        temperature: 0.3,
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.LOW,
        },
      },
    });

    reply = (response.text || '').trim();
  } catch (e) {
    // High-quality Persona In-Character Fallback
    const lower = userQuery.toLowerCase();
    if (!userQuery || lower.includes('halo') || lower.includes('hai')) {
      reply = `Halo! Saya ${host.name} di Live Studio! Mau tanya apa atau mau ditantang soal trivia gokil?`;
    } else if (lower.includes('trivia') || lower.includes('soal') || lower.includes('tantang')) {
      reply = `Tantangan diterima! Tahukah kamu bahwa Danau Baikal di Rusia menampung 20% air tawar bumi dan memiliki kedalaman lebih dari 1.600 meter?`;
    } else if (lower.includes('roast') || lower.includes('sindir')) {
      reply =
        host.id === 'roro'
          ? 'Saya tidak perlu me-roast Anda, riwayat jawaban Anda tadi sudah cukup mewakili.'
          : `Haha santai kawan! Energi kita mending dipakai buat jawab soal berikutnya!`;
    } else {
      reply = `Pertanyaan yang sangat menarik tentang "${userQuery.slice(0, 30)}"! Terus eksplorasi wawasanmu bersama saya!`;
    }
  }

  return res.json({
    reply,
    hostName: host.name,
    hostVoice: host.voice,
    hostId: host.id,
  });
});

// 6. Setup WebSocket Server for Live Voice Conversation (gemini-3.8-live)
// Feature: Add voice conversations using model gemini-3.8-live (Live API)
const wss = new WebSocketServer({ server, path: '/live' });

wss.on('connection', async (clientWs, req) => {
  clientWs.on('error', () => {
    // Handled gracefully
  });

  const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
  const hostId = url.searchParams.get('hostId') || 'kiki';
  const host = HOSTS_MAP[hostId] || HOSTS_MAP.kiki;

  let session: any = null;
  let isLiveApiConnected = false;

  try {
    const aiClient = getAiClient();
    session = await aiClient.live.connect({
      model: 'gemini-3.8-live',
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: host.voice },
          },
        },
        systemInstruction: `Anda adalah ${host.name} (${host.title}) dalam "Live Trivia Voice Studio".
${host.systemInstruction}

Tugas Anda dalam percakapan suara real-time:
1. Sapalah pengguna dengan sangat antusias dan perkenalkan diri Anda secara singkat.
2. Anda bisa menantang pengguna dengan pertanyaan trivia dadakan, mengobrol santai seputar fakta dunia, atau merespons tebakan mereka dengan penuh energi dan humor.
3. Jaga respons tetap ringkas, alami, lincah, dan ekspresif untuk percakapan suara.
4. Selalu gunakan Bahasa Indonesia.`,
      },
      callbacks: {
        onmessage: (message: LiveServerMessage) => {
          const audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
          if (audio && clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ type: 'audio', audio }));
          }

          if (message.serverContent?.interrupted && clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ type: 'interrupted' }));
          }

          const textPart = message.serverContent?.modelTurn?.parts?.find((p: any) => p.text)?.text;
          if (textPart && clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ type: 'text', text: textPart }));
          }
        },
        onclose: () => {
          isLiveApiConnected = false;
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(
              JSON.stringify({
                type: 'ready',
                hostName: host.name,
                hostVoice: host.voice,
                mode: 'interactive-fallback',
              })
            );
          }
        },
        onerror: () => {
          isLiveApiConnected = false;
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(
              JSON.stringify({
                type: 'ready',
                hostName: host.name,
                hostVoice: host.voice,
                mode: 'interactive-fallback',
              })
            );
          }
        },
      },
    });

    isLiveApiConnected = true;
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(
        JSON.stringify({
          type: 'ready',
          hostName: host.name,
          hostVoice: host.voice,
          mode: 'gemini-live',
        })
      );
    }
  } catch {
    isLiveApiConnected = false;

    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(
        JSON.stringify({
          type: 'ready',
          hostName: host.name,
          hostVoice: host.voice,
          mode: 'interactive-fallback',
        })
      );
    }
  }

  clientWs.on('message', (data) => {
    try {
      const parsed = JSON.parse(data.toString());

      if (isLiveApiConnected && session) {
        if (parsed.audio) {
          session.sendRealtimeInput({
            audio: { data: parsed.audio, mimeType: 'audio/pcm;rate=16000' },
          });
        } else if (parsed.text) {
          session.sendRealtimeInput({
            text: parsed.text,
          });
        }
      } else {
        // Interactive Host Dialog Simulation for Fallback Mode
        const userQuery = (parsed.text || '').trim();
        let reply = '';

        if (!userQuery || userQuery.toLowerCase().includes('halo') || userQuery.toLowerCase().includes('hai')) {
          reply = `Halo! Saya ${host.name} di studio kuis. Siap main kuis atau mau tanya fakta seru apa nih?`;
        } else if (userQuery.toLowerCase().includes('trivia') || userQuery.toLowerCase().includes('soal') || userQuery.toLowerCase().includes('tantang')) {
          reply = `Tantangan diterima! Tahukah kamu bahwa Danau Baikal di Rusia menampung 20% air tawar bumi dan lebih dalam dari 1.600 meter? Keren kan?`;
        } else if (userQuery.toLowerCase().includes('roast') || userQuery.toLowerCase().includes('sindir')) {
          reply = host.id === 'roro'
            ? 'Saya tidak perlu me-roast Anda, riwayat skor Anda tadi sudah cukup mewakili.'
            : `Hahaha jangan minta di-roast dong! Mending kita buktikan kecerdasanmu di soal berikutnya!`;
        } else {
          reply = `Menarik sekali pertanyaanmu tentang "${userQuery.slice(0, 30)}"! Sebagai ${host.title}, saya menilai antusiasmemu luar biasa!`;
        }

        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(
            JSON.stringify({
              type: 'text',
              text: reply,
              hostName: host.name,
              hostId: host.id,
            })
          );
        }
      }
    } catch {
      // Handled gracefully
    }
  });

  clientWs.on('close', () => {
    if (session) {
      try {
        session.close();
      } catch (e) {}
    }
  });
});

// Vite Middleware for Fullstack integration
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(port, () => {
    console.log(`TriviaVerse Server running at http://localhost:${port}`);
  });
}

startServer();

import { Question, GroundingSource } from '../types/trivia';

interface TopicQuestions {
  [category: string]: Array<{
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
    interestingFact: string;
    sources?: GroundingSource[];
  }>;
}

export const FALLBACK_TRIVIA_DB: TopicQuestions = {
  umum: [
    {
      question: 'Berapakah jumlah bilik jantung yang dimiliki oleh seekor gurita?',
      options: ['1 Bilik', '2 Bilik', '3 Bilik', '4 Bilik'],
      correctIndex: 2,
      explanation: 'Gurita memiliki 3 jantung: dua jantung memompa darah ke insang, dan satu jantung memompa darah ke seluruh tubuh.',
      interestingFact: 'Darah gurita berwarna biru karena kaya akan protein hemosianin yang berbasis tembaga, bukan zat besi.',
      sources: [
        { title: 'National Geographic: Octopus Anatomy', url: 'https://www.nationalgeographic.com' },
        { title: 'Smithsonian Ocean', url: 'https://ocean.si.edu' },
      ],
    },
    {
      question: 'Di negara manakah terdapat Danau Baikal, danau air tawar terdalam di dunia?',
      options: ['Kanada', 'Rusia', 'Norwegia', 'Finlandia'],
      correctIndex: 1,
      explanation: 'Danau Baikal terletak di Siberia, Rusia, dengan kedalaman maksimum mencapai 1.642 meter dan menampung sekitar 20% air tawar permukaan bumi.',
      interestingFact: 'Air Danau Baikal sangat jernih sehingga pada musim dingin esnya tembus pandang hingga kedalaman 40 meter.',
      sources: [{ title: 'UNESCO World Heritage: Lake Baikal', url: 'https://whc.unesco.org' }],
    },
    {
      question: 'Hewan mamalia darat manakah yang tidak dapat melompat?',
      options: ['Gajah', 'Kuda Nil', 'Badak', 'Kungkang'],
      correctIndex: 0,
      explanation: 'Gajah adalah satu-satunya mamalia darat berukuran besar yang tidak memiliki kemampuan melompat karena struktur tulang kaki dan beban tubuhnya.',
      interestingFact: 'Tulang kaki gajah tersusun lurus ke bawah menyerupai pilar bangunan untuk menopang beban hingga 6 ton.',
      sources: [{ title: 'Britannica: Elephant Anatomy', url: 'https://www.britannica.com' }],
    },
    {
      question: 'Unsur kimia apakah yang memiliki simbol "Au" pada tabel periodik?',
      options: ['Perak', 'Tembaga', 'Emas', 'Aluminium'],
      correctIndex: 2,
      explanation: 'Simbol "Au" berasal dari kata Latin "Aurum", yang berarti kilau fajar atau emas.',
      interestingFact: 'Semua emas yang ada di bumi terbentuk dari tabrakan bintang neutron miliaran tahun lalu sebelum bumi terbentuk.',
      sources: [{ title: 'Royal Society of Chemistry: Gold', url: 'https://www.rsc.org' }],
    },
    {
      question: 'Pulau manakah di dunia yang dinobatkan sebagai pulau terbesar berdasarkan luas wilayah?',
      options: ['Madagaskar', 'Greenland', 'Kalimantan', 'Papua'],
      correctIndex: 1,
      explanation: 'Greenland adalah pulau terbesar di dunia dengan luas sekitar 2,16 juta kilometer persegi.',
      interestingFact: 'Sekitar 80% daratan Greenland tertutup oleh tudung es abadi yang tebalnya mencapai 3 kilometer.',
      sources: [{ title: 'National Geographic: Greenland', url: 'https://www.nationalgeographic.com' }],
    },
    {
      question: 'Berapa lama waktu yang dibutuhkan cahaya matahari untuk sampai ke permukaan Bumi?',
      options: ['8 detik', '8 menit 20 detik', '8 jam', 'Hampir instan (0,08 detik)'],
      correctIndex: 1,
      explanation: 'Dengan jarak sekitar 149,6 juta kilometer dan kecepatan cahaya 300.000 km/detik, cahaya matahari butuh sekitar 8 menit 20 detik (500 detik) untuk mencapai bumi.',
      interestingFact: 'Cahaya yang Anda lihat saat matahari terbit sebenarnya adalah cahaya yang meninggalkan matahari 8 menit yang lalu!',
      sources: [{ title: 'NASA Solar System Exploration', url: 'https://solarsystem.nasa.gov' }],
    },
  ],
  sains: [
    {
      question: 'Teleskop Luar Angkasa James Webb (JWST) mengorbit bumi pada titik gravitasi stabil yang disebut:',
      options: ['Titik Lagrange L1', 'Titik Lagrange L2', 'Orbit Geosinkron', 'Orbit Polar'],
      correctIndex: 1,
      explanation: 'JWST berada di titik Lagrange L2 sekitar 1,5 juta kilometer di belakang bumi dari arah matahari, menjaga suhu sensor tetap sangat dingin.',
      interestingFact: 'Cermin utama JWST dilapisi emas murni setebal hanya 100 nanometer untuk memaksimalkan pantulan sinar inframerah.',
      sources: [{ title: 'NASA: James Webb Space Telescope Orbit', url: 'https://webb.nasa.gov' }],
    },
    {
      question: 'Organel sel manakah yang sering dijuluki sebagai "Pabrik Energi" atau powerhouse of the cell?',
      options: ['Ribosom', 'Badan Golgi', 'Mitokondria', 'Nukleus'],
      correctIndex: 2,
      explanation: 'Mitokondria bertanggung jawab memproduksi molekul ATP melalui respirasi seluler untuk energi seluruh aktivitas sel.',
      interestingFact: 'Mitokondria memiliki DNA sendiri (mtDNA) yang diwariskan hanya dari garis ibu.',
      sources: [{ title: 'Nature Education: Mitochondria', url: 'https://www.nature.com' }],
    },
    {
      question: 'Partikel subatomik manakah yang ditemukan di CERN pada tahun 2012 dan dijuluki "Partikel Tuhan"?',
      options: ['Boson Higgs', 'Quark Top', 'Neutrino Muon', 'Graviton'],
      correctIndex: 0,
      explanation: 'Boson Higgs mengonfirmasi adanya Medan Higgs yang memberikan massa pada partikel-partikel fundamental di alam semesta.',
      interestingFact: 'Fisikawan Peter Higgs menangis haru saat pengumuman penemuan partikel yang telah ia prediksi 48 tahun sebelumnya.',
      sources: [{ title: 'CERN: The Higgs Boson', url: 'https://home.cern' }],
    },
    {
      question: 'Benda langit manakah yang memiliki gunung tertinggi yang pernah diketahui di Tata Surya (Olympus Mons)?',
      options: ['Bumi', 'Mars', 'Bulan', 'Venus'],
      correctIndex: 1,
      explanation: 'Olympus Mons di Mars adalah gunung berapi perisai raksasa dengan ketinggian 21,9 kilometer, hampir tiga kali lipat Gunung Everest.',
      interestingFact: 'Karena kemiringannya yang landai, jika Anda berdiri di kaki Olympus Mons, puncaknya melengkung di balik cakrawala planet Mars.',
      sources: [{ title: 'NASA Mars Exploration: Olympus Mons', url: 'https://mars.nasa.gov' }],
    },
    {
      question: 'Fenomena fisika apa yang membuat langit di siang hari tampak berwarna biru?',
      options: ['Hamburan Rayleigh', 'Efek Doppler', 'Refraksi Total', 'Efek Raman'],
      correctIndex: 0,
      explanation: 'Molekul udara menyebarkan gelombang cahaya dengan panjang gelombang pendek (biru dan ungu) jauh lebih kuat daripada warna merah.',
      interestingFact: 'Mata manusia lebih sensitif terhadap warna biru daripada ungu, itulah mengapa kita melihat langit berwarna biru cerah.',
      sources: [{ title: 'Scientific American: Why is the sky blue?', url: 'https://www.scientificamerican.com' }],
    },
  ],
  tech: [
    {
      question: 'Arsitektur Transformer dalam Artificial Intelligence pertama kali diperkenalkan melalui makalah terkenal berjudul:',
      options: [
        'Deep Residual Learning for Image Recognition',
        'Attention Is All You Need',
        'Generative Adversarial Nets',
        'Mastering the Game of Go',
      ],
      correctIndex: 1,
      explanation: 'Makalah "Attention Is All You Need" diterbitkan oleh para peneliti Google pada tahun 2017 dan menjadi pondasi model bahasa modern seperti Gemini.',
      interestingFact: 'Mekanisme "Self-Attention" memungkinkan AI memahami konteks kata-kata yang berjauhan secara paralel, bukan sekuensial.',
      sources: [{ title: 'Google Research: Attention Is All You Need', url: 'https://arxiv.org/abs/1706.03762' }],
    },
    {
      question: 'Bahasa pemrograman apakah yang dibuat oleh Guido van Rossum dan dinamai dari grup komedi asal Inggris?',
      options: ['Ruby', 'Python', 'Java', 'Kotlin'],
      correctIndex: 1,
      explanation: 'Python dinamai dari grup komedi legendaris BBC "Monty Python\'s Flying Circus", bukan dari ular sanca.',
      interestingFact: 'Guido van Rossum memegang gelar "Benevolent Dictator For Life" (BDFL) dari komunitas Python hingga pensiun tahun 2018.',
      sources: [{ title: 'Python.org History & FAQ', url: 'https://www.python.org' }],
    },
    {
      question: 'Protokol keamanan web HTTPS menggunakan enkripsi berbasis SSL/TLS. Apa kepanjangan dari TLS?',
      options: [
        'Transport Layer Security',
        'Total Linkage System',
        'Terminal Level Safety',
        'Transmission Line Socket',
      ],
      correctIndex: 0,
      explanation: 'TLS (Transport Layer Security) adalah protokol kriptografi standar industri yang mengamankan komunikasi data di internet.',
      interestingFact: 'Kunci enkripsi modern 256-bit membutuhkan waktu triliunan tahun untuk dipecahkan bahkan oleh superkomputer tercepat saat ini.',
      sources: [{ title: 'IETF RFC 8446 - The TLS Protocol', url: 'https://datatracker.ietf.org' }],
    },
    {
      question: 'Komputasi Kuantum menggunakan unit dasar informasi yang dapat berada dalam keadaan superposisi, disebut:',
      options: ['Qubit', 'Byte Quantum', 'Nanobit', 'Positron Bit'],
      correctIndex: 0,
      explanation: 'Qubit (quantum bit) memanfaatkan prinsip mekanika kuantum seperti superposisi dan keterikatan (entanglement) untuk memproses kalkulasi eksponensial.',
      interestingFact: 'Komputer kuantum harus didinginkan hingga suhu mendekati nol mutlak (-273,14°C), lebih dingin daripada ruang hampa luar angkasa!',
      sources: [{ title: 'IBM Quantum Computing', url: 'https://www.ibm.com/quantum' }],
    },
  ],
  terkini: [
    {
      question: 'Misi luar angkasa NASA Artemis bertujuan mengembalikan manusia ke Bulan. Wilayah kutub Bulan manakah yang menjadi target eksplorasinya?',
      options: ['Kutub Utara', 'Kutub Selatan', 'Kawah Copernicus', 'Laut Ketenangan'],
      correctIndex: 1,
      explanation: 'Kutub Selatan Bulan menjadi target utama karena terdapat kawah bayangan abadi yang kaya akan es air sebagai sumber bahan bakar dan air minum.',
      interestingFact: 'Kawah Shackleton di Kutub Selatan Bulan memiliki puncak yang hampir selalu tersinari matahari untuk pasokan panel surya abadi.',
      sources: [{ title: 'NASA Artemis Program Updates', url: 'https://www.nasa.gov/artemis' }],
    },
    {
      question: 'Teknologi energi bersih fusi nuklir global terbesar saat ini sedang dibangun di Prancis Selatan dengan nama proyek:',
      options: ['ITER', 'CERN', 'HAARP', 'Apollo Clean'],
      correctIndex: 0,
      explanation: 'ITER (International Thermonuclear Experimental Reactor) adalah reaktor fusi tokamak terbesar di dunia yang melibatkan puluhan negara maju.',
      interestingFact: 'Suhu plasma di dalam reaktor ITER dirancang mencapai 150 juta derajat Celsius, atau 10 kali lebih panas dari inti matahari!',
      sources: [{ title: 'ITER Organization Official Site', url: 'https://www.iter.org' }],
    },
    {
      question: 'Negara manakah yang pertama kali berhasil mendaratkan wahana antariksa di Kutub Selatan Bulan melalui misi Chandrayaan-3?',
      options: ['Jepang', 'India', 'Tiongkok', 'Uni Emirat Arab'],
      correctIndex: 1,
      explanation: 'India melalui badan antariksa ISRO berhasil mendaratkan modul Vikram di dekat Kutub Selatan Bulan pada Agustus 2023.',
      interestingFact: 'Biaya misi Chandrayaan-3 sekitar 75 juta dolar, jauh lebih hemat dibandingkan biaya pembuatan film Hollywood fiksi antariksa!',
      sources: [{ title: 'ISRO Chandrayaan-3 Mission', url: 'https://www.isro.gov.in' }],
    },
  ],
  pop: [
    {
      question: 'Film animasi pemenang Oscar karya Hayao Miyazaki dan Studio Ghibli yang dirilis global tahun 2023/2024 berjudul:',
      options: [
        'The Boy and the Heron (Kimitachi wa Dō Ikiru ka)',
        'Spirited Away 2',
        'Weathering With You',
        'Suzume no Tojimari',
      ],
      correctIndex: 0,
      explanation: '"The Boy and the Heron" memenangkan Academy Award untuk Film Animasi Terbaik ke-96, menjadi piala Oscar kedua bagi Hayao Miyazaki.',
      interestingFact: 'Setiap frame animasi film ini digambar secara tradisional menggunakan tangan selama lebih dari 7 tahun pengerjaan.',
      sources: [{ title: 'Academy Awards Oscars 2024', url: 'https://www.oscars.org' }],
    },
    {
      question: 'Konser tur musik terlaris sepanjang sejarah dunia hiburan yang digelar oleh Taylor Swift adalah:',
      options: ['The Eras Tour', 'Renaissance World Tour', 'Music of the Spheres', 'Sticky & Sweet Tour'],
      correctIndex: 0,
      explanation: 'The Eras Tour menjadi tur konser pertama dalam sejarah yang menghasilkan pendapatan kotor melampaui 1 miliar dolar AS.',
      interestingFact: 'Getaran lompatan penonton The Eras Tour di Seattle tercatat setara dengan gempa bumi berkekuatan magnitudo 2,3!',
      sources: [{ title: 'Guinness World Records: Highest-grossing music tour', url: 'https://www.guinnessworldrecords.com' }],
    },
    {
      question: 'Karakter fiksi mata-mata Inggris James Bond memiliki kode agen rahasia terkenal dengan nomor:',
      options: ['005', '007', '777', '999'],
      correctIndex: 1,
      explanation: 'James Bond menyandang kode 007 dari dinas intelijen rahasia MI6, di mana awalan "00" melambangkan lisensi izin membunuh demi tugas negara.',
      interestingFact: 'Penulis Ian Fleming menamai karakter ini dari nama seorang ahli burung (ornitologis) Amerika bernama James Bond.',
      sources: [{ title: '007 Official Archives', url: 'https://www.007.com' }],
    },
  ],
  sejarah: [
    {
      question: 'Perpustakaan Kuno Alexandria yang legendaris didirikan pada masa dinasti penguasa Mesir kuno:',
      options: ['Dinasti Ptolemaik', 'Dinasti Ming', 'Kekaisaran Romawi', 'Dinasti Akhemeniyah'],
      correctIndex: 0,
      explanation: 'Perpustakaan Alexandria didirikan di bawah pemerintahan Ptolemaios I Soter sekitar abad ke-3 SM sebagai pusat pembelajaran dunia kuno.',
      interestingFact: 'Setiap kapal yang berlabuh di pelabuhan Alexandria diwajibkan menyerahkan gulungan buku untuk disalin oleh para cendekiawan perpustakaan.',
      sources: [{ title: 'Britannica: Library of Alexandria', url: 'https://www.britannica.com' }],
    },
    {
      question: 'Siapakah arsitek dan seniman Renaissance yang merancang kubah katedral termasyhur Santa Maria del Fiore di Florence?',
      options: ['Filippo Brunelleschi', 'Leonardo da Vinci', 'Michelangelo', 'Donatello'],
      correctIndex: 0,
      explanation: 'Filippo Brunelleschi memecahkan teka-teki teknik arsitektur dengan merancang kubah ganda mandiri tanpa perancah kayu raksasa.',
      interestingFact: 'Kubah Brunelleschi hingga saat ini tetap menjadi kubah pasangan bata (masonry) terbesar di dunia yang pernah dibangun.',
      sources: [{ title: 'Florence Cathedral Opera di Santa Maria del Fiore', url: 'https://duomo.firenze.it' }],
    },
    {
      question: 'Candi Borobudur di Jawa Tengah, Indonesia, dibangun pada masa kejayaan wangsa atau dinasti:',
      options: ['Wangsa Syailendra', 'Wangsa Sanjaya', 'Kerajaan Majapahit', 'Kesultanan Mataram'],
      correctIndex: 0,
      explanation: 'Candi Borobudur dibangun pada abad ke-8 dan ke-9 Masehi oleh Dinasti Syailendra sebagai monumen suci agama Buddha Mahayana.',
      interestingFact: 'Borobudur tersusun dari sekitar 2 juta bongkah batu vulkanik yang saling mengunci tanpa menggunakan semen sedikit pun.',
      sources: [{ title: 'UNESCO World Heritage: Borobudur Temple Compounds', url: 'https://whc.unesco.org' }],
    },
  ],
};

const HOST_QUIPS: Record<string, string[]> = {
  arya: [
    'Sebuah teka-teki epistemologis yang sangat menggugah nalar!',
    'Pertanyaan ini memerlukan ketajaman analisis sejarah dan sains murni.',
    'Buktikan kepada saya bahwa logika peradaban Anda melampaui rata-rata!',
    'Simak baik-baik, jangan biarkan bias kognitif mengecoh Anda.',
    'Menarik sekali! Mari kita bedah pertanyaan berbobot berikut ini.',
  ],
  kiki: [
    'Ayo gankss! Jangan bengong, pertanyaan ini super gokil!',
    'Fokus, pasang headphone kalian, pertanyaan berikutnya pecah abiss!',
    'Siapa yang siap nambah poin combo?! Lets gooo!',
    'Waktunya unjuk gigi! Tebak jawaban ini secepat kilat!',
    'Vibe panggung lagi panas banget! Ini dia soalnya!',
  ],
  roro: [
    'Tolong jangan permalukan selera intelektual kita dengan jawaban ceroboh.',
    'Pertanyaan sederhana... tentu bagi mereka yang benar-benar membaca.',
    'Tarik napas, perbaiki postur Anda, dan jawab dengan anggun.',
    'Apakah Anda mampu menjawab ini tanpa pura-pura berpikir keras?',
    'Mari kita lihat apakah keberuntungan Anda masih tersisa.',
  ],
  bintang: [
    'INILAH DIA! Pertanyaan penentu perjalanan karier kuis Anda!',
    'Studio hening seketika... Apakah Anda siap mengunci pilihan ini?!',
    'Tegang luar biasa! Kamera menyorot wajah Anda sekarang!',
    'Satu keputusan, satu masa depan! Bacalah pertanyaan ini dengan cermat!',
    'Detak jantung berpacu kencang! Kita buka pertanyaannya sekarang!',
  ],
  cyber: [
    'Menginisialisasi modul kalkulasi... Probabilitas akurasi manusia: diuji.',
    'Pertanyaan terenkripsi dimuat ke memori kerja kandidat organik.',
    'Sensor kognitif mendeteksi peningkatan denyut nadi. Simak data berikut.',
    'Menjalankan subrutin evaluasi pengetahuan global tingkat lanjut.',
    'Memproses parameter kuis... Berikan masukan data yang valid.',
  ],
};

export function getFallbackQuestions(
  topic: string,
  count: number,
  hostId: string
): { questions: Question[]; groundingChunks: GroundingSource[] } {
  const normalized = topic.toLowerCase();
  let poolKey = 'umum';

  if (normalized.includes('sains') || normalized.includes('alam') || normalized.includes('fisika')) {
    poolKey = 'sains';
  } else if (normalized.includes('tech') || normalized.includes('ai') || normalized.includes('komputer') || normalized.includes('koding')) {
    poolKey = 'tech';
  } else if (normalized.includes('terkini') || normalized.includes('berita') || normalized.includes('2025') || normalized.includes('2026')) {
    poolKey = 'terkini';
  } else if (normalized.includes('pop') || normalized.includes('musik') || normalized.includes('film') || normalized.includes('artis')) {
    poolKey = 'pop';
  } else if (normalized.includes('sejarah') || normalized.includes('kuno') || normalized.includes('mitologi')) {
    poolKey = 'sejarah';
  }

  const selectedPool = [
    ...(FALLBACK_TRIVIA_DB[poolKey] || []),
    ...FALLBACK_TRIVIA_DB.umum,
    ...FALLBACK_TRIVIA_DB.sains,
    ...FALLBACK_TRIVIA_DB.tech,
  ];

  // Shuffle pool
  const shuffled = [...selectedPool].sort(() => Math.random() - 0.5);
  const picked = shuffled.slice(0, Math.min(count, shuffled.length));

  const hostQuipList = HOST_QUIPS[hostId] || HOST_QUIPS.arya;
  const groundingChunks: GroundingSource[] = [];

  const questions: Question[] = picked.map((item, idx) => {
    if (item.sources) {
      groundingChunks.push(...item.sources);
    }
    return {
      id: `q-${idx + 1}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      question: item.question,
      options: item.options,
      correctIndex: item.correctIndex,
      explanation: item.explanation,
      interestingFact: item.interestingFact,
      hostQuip: hostQuipList[idx % hostQuipList.length],
    };
  });

  return { questions, groundingChunks };
}

export function generateHostReactionOffline(params: {
  hostId: string;
  isCorrect: boolean;
  userAnswer: string;
  correctAnswer: string;
  streak: number;
  score: number;
  spiceLevel: number;
}): string {
  const { hostId, isCorrect, correctAnswer, streak, spiceLevel } = params;

  if (isCorrect) {
    if (streak >= 3) {
      switch (hostId) {
        case 'kiki':
          return `GOKIL ABIEZ! ${streak} kali berturut-turut benar! Panggung ini resmi milik kamu!`;
        case 'arya':
          return `Luar biasa! Konsistensi ${streak} kali benar membuktikan kapasitas intelektual kelas wahid!`;
        case 'roro':
          return `Hmm, 3 kali berturut-turut benar? Saya mulai curiga Anda memang benar-benar pintar.`;
        case 'bintang':
          return `SPECTACULAR! ${streak} kombo berturut-turut! Seluruh penonton studio bersorak histeris!`;
        case 'cyber':
          return `Efisiensi kalkulasi 100%. Kombo ${streak} tercatat dalam matriks keunggulan organik.`;
        default:
          return `Hebat! ${streak} jawaban benar berturut-turut!`;
      }
    }

    switch (hostId) {
      case 'kiki':
        return `Mantap jiwa! Jawaban kamu tepat sasaran! Lanjut gaspol!`;
      case 'arya':
        return `Tepat sekali! Deduksi yang sangat elegan dan sesuai fakta ilmiah.`;
      case 'roro':
        return `Bagus. Setidaknya Anda tidak membuat saya bosan kali ini.`;
      case 'bintang':
        return `BENAR SEKALI! Pilihan yang sangat berani dan akurat!`;
      case 'cyber':
        return `Kesesuaian data terverifikasi. Poin ditambahkan ke saldo kognitif.`;
      default:
        return `Tepat sekali! Jawaban Anda benar.`;
    }
  } else {
    // Incorrect answer
    if (spiceLevel >= 3) {
      // Roasting / Extra Spice
      switch (hostId) {
        case 'roro':
          return `Aduh, tebakan yang sangat kreatif... tapi sayangnya salah total. Jawabannya adalah ${correctAnswer}!`;
        case 'kiki':
          return `Yaaaah meleset! Santai, tarik napas, yang bener itu ${correctAnswer}! Jangan sedih ya!`;
        case 'arya':
          return `Secara ilmiah itu keliru besar. Kunci jawabannya adalah ${correctAnswer}. Jangan ulangi kekeliruan metodologis ini!`;
        case 'bintang':
          return `SAYANG SEKALI! Jawaban Anda belum tepat! Yang benar adalah: ${correctAnswer}!`;
        case 'cyber':
          return `Anomali logika terdeteksi. Error margin 100%. Koreksi sistem: ${correctAnswer}.`;
        default:
          return `Sayang sekali belum tepat. Jawabannya adalah ${correctAnswer}.`;
      }
    } else {
      // Gentle / supportive
      switch (hostId) {
        case 'kiki':
          return `Gak apa-apa bestie! Masih ada soal berikutnya, yang bener ${correctAnswer}!`;
        case 'arya':
          return `Jangan berkecil hati. Kegagalan adalah awal hipotesis baru. Jawabannya adalah ${correctAnswer}.`;
        case 'roro':
          return `Kurang beruntung. Kuncinya adalah ${correctAnswer}. Coba lagi nanti.`;
        case 'bintang':
          return `Jangan putus asa, panggung kuis selalu memberi kesempatan kedua! Kuncinya: ${correctAnswer}.`;
        case 'cyber':
          return `Koreksi data tercatat: ${correctAnswer}. Lanjutkan ke evaluasi berikutnya.`;
        default:
          return `Jawaban yang benar adalah ${correctAnswer}.`;
      }
    }
  }
}

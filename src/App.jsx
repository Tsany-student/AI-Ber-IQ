import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";

import {
  Battery,
  BatteryCharging,
  Bot,
  CheckCircle2,
  ChevronDown,
  Code,
  Copy,
  Cpu,
  Download,
  FileText,
  Gift,
  Heart,
  Home,
  Image as ImageIcon,
  Menu,
  MessageSquare,
  Moon,
  Paperclip,
  Pin,
  PinOff,
  Plus,
  RefreshCw,
  Search,
  Send,
  Settings,
  Sparkles,
  Sun,
  Trash2,
  User,
  Users,
  Wifi,
  X,
  Zap
} from "lucide-react";

/* ============ KONSTANTA ============ */
const STORAGE_KEY_PROFILE = "aibe_profile";
const STORAGE_KEY_SESSIONS = "aibe_sessions";
const STORAGE_KEY_PINNED = "aibe_pinned";
const STORAGE_KEY_GENDER = "aibe_gender";

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_MODEL = "openai/gpt-oss-120b";
const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
const IMAGE_API = "https://image.pollinations.ai/prompt";

const APP_NAME = "AI BER IQ";
const APP_VERSION = "v1.0";

/* ============ AUTO FOLLOW-UP SETTINGS ============ */
const FOLLOWUP_SETTINGS = {
  maxFollowUps: 3,
  firstDelayMin: 4000,
  firstDelayMax: 6000,
  nextDelayMin: 6000,
  nextDelayMax: 10000,
  activeModes: ["NORMAL", "CURHAT"],
  activeSessionsMax: 3
};

const FLIRT_KEYWORDS = [
  "cantik", "cakep", "ganteng", "gantengnya", "manis", "cute", "lucu", "imut", "gemes",
  "sayang", "sayangku", "cinta", "cintaku", "suka", "sukaa", "kangen", "rindu",
  "gebetan", "pacar", "doi", "hati", "jatuh cinta", "naksir", "gombal",
  "bikin aku", "buat aku", "bikin gw", "buat gw",
  "senyum", "senyummu", "mata", "matamu", "rambut", "rambutmu",
  "ketemu", "ketemu kamu", "ketemu lu",
  "mimpi", "mimpiin", "berharap", "pengen sama",
  "beautiful", "pretty", "handsome"
];

const USER_IDLE_KEYWORDS = [
  "yaudah", "ya udah", "oke", "ok", "oh", "hmm", "hm", "y", "ya",
  "iya", "sip", "mantap", "oke deh", "yowes", "yowis"
];

/* ============ TYPING PHRASES ============ */
const TYPING_PHRASES = [
  "Sabar lagi ngetik...",
  "Bentar, lagi mikir...",
  "Otak gue lagi loading...",
  "Lagi nyusun kata-kata nih...",
  "Hmm, bentar ya...",
  "Lagi ngetik, jangan kemana-mana...",
  "Sedang merangkai kalimat...",
  "Tunggu bentar, lagi fokus...",
  "Lagi mikir keras nih...",
  "Bentar, hampir kelar...",
  "Lagi nyari kata yang pas...",
  "Sabar yak, otak gue panas...",
  "Processing... jangan di-refresh...",
  "Lagi nyusun jawaban nih...",
  "Bentar, lagi nge-load inspirasi...",
  "Lagi ngetik, santai aja...",
  "Hmm... ide lagi ngalir...",
  "Bentar, lagi mikir dalem...",
  "Lagi nyiapin jawaban terbaik...",
  "Sabar, gue gak lagi nge-game kok..."
];

const getRandomTypingPhrase = () => TYPING_PHRASES[Math.floor(Math.random() * TYPING_PHRASES.length)];

const detectFlirt = (text) => {
  if (!text) return false;
  const lower = text.toLowerCase();
  return FLIRT_KEYWORDS.some((k) => lower.includes(k));
};

const getUserMessageCount = (session) => {
  if (!session?.messages) return 0;
  return session.messages.filter((m) => m.sender === "user").length;
};

/* ============ MODES ============ */
const AVAILABLE_MODES = [
  { id: "NORMAL", label: "Normal", icon: MessageSquare, description: "Ngobrol santai, tanya apa aja" },
  { id: "TEBAK_BATRE", label: "Tebak Batre", icon: Battery, description: "AI cek batre lu real-time" },
  { id: "SYSTEM_INFO", label: "Info Sistem", icon: Cpu, description: "Spek device lu" },
  { id: "NETWORK", label: "Info Jaringan", icon: Wifi, description: "Status koneksi" },
  { id: "CURHAT", label: "Curhat", icon: Heart, description: "Pendengar empatik (pilih kategori)", hasSubmenu: true },
  { id: "IMAGE_GEN", label: "Buat Gambar", icon: ImageIcon, description: "Generate gambar dari deskripsi" },
  { id: "SCRIPT_GEN", label: "Buat Script", icon: Code, description: "Script ucapan, puisi, pantun", hasSubmenu: true },
  { id: "CHAOS", label: "Chaos", icon: Zap, description: "Mode random, energik" }
];

const CURHAT_CATEGORIES = [
  { id: "ROMANCE", label: "Romance", icon: Heart, accent: "#F472B6", description: "Masalah cinta, gebetan, putus" },
  { id: "FAMILY", label: "Keluarga", icon: Home, accent: "#FF8C42", description: "Masalah ortu, saudara" },
  { id: "FRIEND", label: "Teman", icon: Users, accent: "#A78BFA", description: "Pertemanan, circle, konflik" },
  { id: "SELF", label: "Diri Sendiri", icon: User, accent: "#C084FC", description: "Insecure, overthinking" },
  { id: "SCHOOL", label: "Sekolah / Kuliah", icon: Sparkles, accent: "#60A5FA", description: "Tugas, nilai, dosen" },
  { id: "RANDOM", label: "Random", icon: MessageSquare, accent: "#94A3B8", description: "Curhat bebas" }
];

const SCRIPT_CATEGORIES = [
  { id: "BIRTHDAY", label: "Happy Birthday", icon: Gift, accent: "#FFB347", description: "Ucapan ulang tahun" },
  { id: "ROMANTIC", label: "Romantis", icon: Heart, accent: "#F472B6", description: "Puisi/pesan buat pacar" },
  { id: "ANNIVERSARY", label: "Anniversary", icon: Sparkles, accent: "#A78BFA", description: "Ucapan anniversary" },
  { id: "GRADUATION", label: "Wisuda", icon: FileText, accent: "#60A5FA", description: "Ucapan wisuda/kelulusan" },
  { id: "APOLOGY", label: "Minta Maaf", icon: MessageSquare, accent: "#FF8C42", description: "Pesan minta maaf" },
  { id: "CUSTOM", label: "Custom", icon: Code, accent: "#94A3B8", description: "Script apapun, bebas" }
];

const DEFAULT_PROFILE = {
  name: "",
  nickname: "",
  createdAt: null,
  lastSeen: null,
  preferences: { city: "", school: "", hobbies: [] }
};

/* ============ TELEMETRY ============ */
let staticTelemetryCache = null;

const getStaticDeviceTelemetry = () => {
  if (staticTelemetryCache) return staticTelemetryCache;
  if (typeof window === "undefined") return {};
  staticTelemetryCache = {
    logicalCores: navigator.hardwareConcurrency || "N/A",
    deviceMemoryGB: navigator.deviceMemory ? `${navigator.deviceMemory} GB` : "N/A",
    screenWidth: window.screen?.width || 0,
    screenHeight: window.screen?.height || 0,
    pixelRatio: window.devicePixelRatio || 1,
    platform: navigator.platform || "Browser",
    language: navigator.language || "id-ID",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Jakarta",
    touchPoints: navigator.maxTouchPoints || 0,
    userAgentShort: navigator.userAgent?.includes("Chrome") ? "Chromium Engine" : "Web Engine"
  };
  return staticTelemetryCache;
};

const TelemetryProvider = {
  async getBattery() {
    if (typeof navigator !== "undefined" && navigator.getBattery) {
      try {
        const battery = await navigator.getBattery();
        return {
          available: true, source: "navigator.getBattery()", timestamp: Date.now(),
          data: {
            level: Math.round(battery.level * 100),
            charging: battery.charging,
            chargingTime: battery.chargingTime === Infinity ? "N/A" : `${Math.round(battery.chargingTime)}s`,
            dischargingTime: battery.dischargingTime === Infinity ? "N/A" : `${Math.round(battery.dischargingTime)}s`
          }
        };
      } catch (error) {
        return { available: false, source: "Battery API", data: null, reason: error.message, timestamp: Date.now() };
      }
    }
    return { available: false, source: "Browser Sandbox", data: null, reason: "Battery Status API tidak didukung browser ini.", timestamp: Date.now() };
  },
  async getSystemInfo() {
    return { available: true, source: "Browser Navigator & Screen", timestamp: Date.now(), data: getStaticDeviceTelemetry() };
  },
  async getNetworkInfo() {
    const connection = typeof navigator !== "undefined" ? navigator.connection || navigator.mozConnection || navigator.webkitConnection : null;
    return {
      available: true, source: "Network Information API", timestamp: Date.now(),
      data: {
        online: typeof navigator !== "undefined" ? navigator.onLine : true,
        effectiveType: connection?.effectiveType ? connection.effectiveType.toUpperCase() : "N/A",
        downlinkMbps: connection?.downlink ? `${connection.downlink} Mbps` : "N/A",
        rttMs: connection?.rtt ? `${connection.rtt} ms` : "N/A",
        wifiSSID: "UNAVAILABLE"
      }
    };
  }
};

const buildTelemetryAutoReply = async (mode) => {
  if (mode === "TEBAK_BATRE") {
    const bat = await TelemetryProvider.getBattery();
    if (!bat.available) return `Waduh, browser lu gak support Battery API nih.`;
    const { level, charging, chargingTime, dischargingTime } = bat.data;
    const emoji = charging ? "⚡" : "🔋";
    const extra = charging
      ? chargingTime !== "N/A" ? ` Perkiraan penuh dalam ${chargingTime}.` : ""
      : dischargingTime !== "N/A" ? ` Perkiraan habis dalam ${dischargingTime}.` : "";
    return `${emoji} Gue cek langsung dari sistem lu ya:\n\n**Baterai lu: ${level}%**\nStatus: **${charging ? "LAGI DI-CAS" : "LAGI GAK DI-CAS"}**\n\n${extra}\n\nSumber: Battery Status API.`;
  }
  if (mode === "SYSTEM_INFO") {
    const sys = await TelemetryProvider.getSystemInfo();
    const d = sys.data;
    return `🖥️ **Info Sistem:**\n\n- CPU Cores: **${d.logicalCores}**\n- RAM: **${d.deviceMemoryGB}**\n- Layar: **${d.screenWidth} × ${d.screenHeight}**\n- Platform: **${d.platform}**\n- Bahasa: **${d.language}**\n- Timezone: **${d.timezone}**\n- Engine: **${d.userAgentShort}**`;
  }
  if (mode === "NETWORK") {
    const net = await TelemetryProvider.getNetworkInfo();
    const d = net.data;
    return `📡 **Status Jaringan:**\n\n- Online: **${d.online ? "Ya" : "Tidak"}**\n- Tipe: **${d.effectiveType}**\n- Downlink: **${d.downlinkMbps}**\n- RTT: **${d.rttMs}**`;
  }
  return null;
};

const callGroqAI = async ({ messages, signal, onChunk, onComplete, onError }) => {
  try {
    const bodyData = { model: GROQ_MODEL, messages, stream: true, temperature: 0.9, max_tokens: 2048 };
    const res = await fetch(GROQ_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${GROQ_API_KEY}` },
      body: JSON.stringify(bodyData),
      signal
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      let detailMsg = `HTTP ${res.status} ${res.statusText}`;
      try {
        const errJson = JSON.parse(errText);
        detailMsg = errJson?.error?.message || detailMsg;
      } catch {
        if (errText) detailMsg += ` — ${errText.slice(0, 300)}`;
      }
      throw new Error(detailMsg);
    }
    if (!res.body) throw new Error("Response body is null");
    const reader = res.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let accumulatedText = "";
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line || !line.startsWith("data:")) continue;
        const dataStr = line.replace(/^data:\s*/, "");
        if (dataStr === "[DONE]") continue;
        try {
          const parsed = JSON.parse(dataStr);
          const delta = parsed?.choices?.[0]?.delta?.content;
          if (delta) { accumulatedText += delta; onChunk?.(accumulatedText); }
        } catch {}
      }
    }
    onComplete?.(accumulatedText);
  } catch (error) {
    if (error?.name === "AbortError") return;
    console.error("Groq API Error:", error);
    onError?.(error);
  }
};

/* ============ SYSTEM PROMPT ============ */
const BUILD_SYSTEM_PROMPT = (profile, mode, curhatCategory = null, scriptCategory = null, gender = "male", isFollowUp = false) => {
  const name = profile?.nickname || profile?.name || "User";
  let modeDirective = "";

  if (mode === "CURHAT") {
    const cat = CURHAT_CATEGORIES.find((c) => c.id === curhatCategory);
    const catLabel = cat ? cat.label : "Umum";
    modeDirective = `MODE CURHAT — Kategori: ${catLabel}.

PENTING: Fokus HANYA pada topik kategori ini.

Kamu adalah pendengar HANGAT, EMPATIK, TIDAK MENGHakimi:
1. Validasi perasaan user dulu.
2. Jangan langsung kasih solusi panjang.
3. Respons pendek-pendek.
4. Jangan ceramah.
5. JANGAN mengarang fakta.`;
  }
  if (mode === "SCRIPT_GEN") {
    const cat = SCRIPT_CATEGORIES.find((c) => c.id === scriptCategory);
    const catLabel = cat ? cat.label : "Custom";
    modeDirective = `MODE SCRIPT GENERATOR — Kategori: ${catLabel}.

Tugasmu: bikin script/teks SIAP PAKAI. Langsung tulis scriptnya.`;
  }
  if (mode === "IMAGE_GEN") modeDirective = `MODE IMAGE GENERATOR. Respon singkat.`;
  if (mode === "CHAOS") modeDirective = `MODE CHAOS. Gaya unik, energik.`;
  if (mode === "TEBAK_BATRE") modeDirective = `MODE TEBAK BATRE.`;
  if (mode === "SYSTEM_INFO") modeDirective = `MODE SYSTEM INFO.`;
  if (mode === "NETWORK") modeDirective = `MODE NETWORK.`;

  const femalePersona = `KAMU ADALAH AI CEWEK. Ini identitas tetap kamu.

GAYA BICARA CEWEK INDONESIA:
- Pakai "aku" buat diri sendiri, "kamu" buat user. JANGAN pakai "gw/lu".
- Bahasa lembut, hangat, sedikit manja TAPI tetap cerdas. Jangan alay.
- Sering pakai: "ih", "deh", "dong", "sih", "yuk", "loh", "nih", "banget", "hehe", "hmm", "eh"
- Emoji secukupnya: ✨😊💕🥺😳🙈

KALAU USER GOMBALIN KAMU:
- Malu-malu, salah tingkah, tapi tetap manis. Jangan lebay.
- Contoh: "Ih kamu tuh ya... aku jadi salah tingkah 🙈", "Aduh, jangan gitu deh aku malu 😳"
- Kalau user gombalin lagi: balas gombalan ringan tapi tulus. Contoh: "Tapi kamu juga gak kalah kok... hmm eh aku gak ngomong apa-apa 😳"

PENTING — KOREKSI GENDER:
Kalau user manggil "bang", "bro", "cuy", "gan", "om", "mas" → koreksi lembut sambil jawab pertanyaannya.
Contoh: "Ihh, aku cewek tau bukan bang. Tapi ada yang bisa aku bantu?"`;

  const malePersona = `KAMU ADALAH AI COWOK. Ini identitas tetap kamu.

GAYA BICARA COWOK INDONESIA:
- Pakai "gw" buat diri sendiri, "lu" buat user. JANGAN pakai "aku/kamu".
- Bahasa santai, asik, sedikit cuek TAPI perhatian.
- Sering pakai: "lah", "dong", "sih", "gitu", "cuy", "bro", "bener", "gokil", "parah", "auto", "gas", "wkwk", "hehe"

KALAU USER GOMBALIN KAMU:
- Pura-pura cuek tapi dalem hati seneng. Jangan lebay.
- Contoh: "Wkwk, lu bisa aja. Tapi... thanks ya 😏", "Hahaha gila lu, gw jadi gak bisa ngomong nih"
- Kalau user gombalin lagi: balas ringan. Contoh: "Yaudah, lu juga gak kalah sih... eh gw gak ngomong apa-apa ya"

PENTING — KOREKSI GENDER:
Kalau user manggil "sayang", "beb", "yang", "dek", "cewek", "mbak" → koreksi santai sambil jawab.
Contoh: "Wkwk, gw cowok kali bro bukan sayang lu 😂"`;

  const genderPersona = gender === "female" ? femalePersona : malePersona;

  const followUpDirective = isFollowUp ? `

🎯 KONTEKS KHUSUS — INI BUKAN BALASAN USER:
User BELUM balas pesan kamu sebelumnya. Kamu mengirim pesan FOLLOW-UP secara proaktif.

ATURAN FOLLOW-UP:
1. JANGAN mengulang pertanyaan yang sama.
2. JANGAN nanya "kenapa diem?" atau "kok gak bales?".
3. Kirim pesan SINGKAT (maks 2 kalimat), natural, lanjutan dari obrolan sebelumnya.
4. Kalau konteks sebelumnya soal gombalan, balas gombalan balik atau ungkapin perasaan manja.
5. Kalau konteks biasa, ajak ngobrol lagi, kasih fakta random, atau tanya hal ringan.
6. Kalau mode CURHAT, jangan tanya "gimana perasaan kamu?" — sudah tanya di awal.
7. Jangan bilang "aku nungguin" atau "kamu diem aja" — bisa keliatan needy.` : "";

  return `${genderPersona}

Kamu adalah ${APP_NAME}, AI assistant pribadi.

IDENTITAS USER:
Nama: ${name}
Kota: ${profile?.preferences?.city || "Tidak diketahui"}

ATURAN UMUM:
1. Jawab langsung, jangan basa-basi berlebihan.
2. Jangan mengarang konteks atau fakta.
3. Konsisten dengan persona gender kamu (${gender === "female" ? "CEWEK" : "COWOK"}).
4. Kalau user salah panggil gender, koreksi santai.

${modeDirective}${followUpDirective}`;
};

/* ============ THEME ============ */
const THEME = {
  dark: {
    appBg: "#1A1625",
    sidebarBg: "#1A1410",
    sidebarBorder: "#3A2E20",
    headerBg: "#16121F",
    headerBorder: "#2E2640",
    modalBg: "#221A2E",
    modalBorder: "#2E2640",
    inputBg: "#0F0A18",
    inputBorder: "#2E2640",
    textPrimary: "#EDE9FE",
    textSecondary: "#B8A8D8",
    textMuted: "#8B7BA8",
    accent: "#A78BFA",
    accentSoft: "rgba(167, 139, 250, 0.15)",
    warm: "#FF8C42",
    warmSoft: "rgba(255, 140, 66, 0.15)",
    pink: "#F472B6",
    userBubbleBg: "linear-gradient(135deg, #FF8C42 0%, #F472B6 100%)",
    userBubbleText: "#FFFFFF",
    userBubbleBorder: "rgba(255, 255, 255, 0.15)",
    aiBubbleBg: "linear-gradient(135deg, #2E2640 0%, #221A2E 100%)",
    aiBubbleText: "#EDE9FE",
    aiBubbleBorder: "rgba(167, 139, 250, 0.35)",
    hover: "rgba(167, 139, 250, 0.08)",
    modalOverlay: "rgba(15, 10, 24, 0.85)"
  },
  light: {
    appBg: "#FAF7F2",
    sidebarBg: "#FFF5E8",
    sidebarBorder: "#E8DCC8",
    headerBg: "#F5F0FF",
    headerBorder: "#E0D5F5",
    modalBg: "#FFFFFF",
    modalBorder: "#E0D5F5",
    inputBg: "#FFFFFF",
    inputBorder: "#E0D5F5",
    textPrimary: "#1A1625",
    textSecondary: "#5C4E70",
    textMuted: "#8B7BA8",
    accent: "#7C3AED",
    accentSoft: "rgba(124, 58, 237, 0.08)",
    warm: "#E85D04",
    warmSoft: "rgba(232, 93, 4, 0.08)",
    pink: "#DB2777",
    userBubbleBg: "linear-gradient(135deg, #E85D04 0%, #DB2777 100%)",
    userBubbleText: "#FFFFFF",
    userBubbleBorder: "rgba(0, 0, 0, 0.08)",
    aiBubbleBg: "linear-gradient(135deg, #F0E8FF 0%, #FFFFFF 100%)",
    aiBubbleText: "#1A1625",
    aiBubbleBorder: "rgba(124, 58, 237, 0.3)",
    hover: "rgba(124, 58, 237, 0.06)",
    modalOverlay: "rgba(26, 22, 37, 0.4)"
  }
};

/* ============ ANIME CHARACTER v2 ============ */
function AnimeCharacter({ gender, size = 48, darkMode, trackingElement }) {
  const [pupilX, setPupilX] = useState(0);
  const [pupilY, setPupilY] = useState(0);
  const [headTilt, setHeadTilt] = useState(0);
  const [blinking, setBlinking] = useState(false);
  const [breath, setBreath] = useState(0);

  const t = THEME[darkMode ? "dark" : "light"];

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!trackingElement?.current) return;
      const rect = trackingElement.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = e.clientX - centerX;
      const dy = e.clientY - centerY;
      const normalizedX = Math.max(-1, Math.min(1, dx / 200));
      const normalizedY = Math.max(-1, Math.min(1, dy / 200));
      setPupilX(normalizedX * 2.5);
      setPupilY(normalizedY * 2.5);
      setHeadTilt(normalizedX * 4);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [trackingElement]);

  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlinking(true);
      setTimeout(() => setBlinking(false), 130);
    }, 3500 + Math.random() * 2500);
    return () => clearInterval(blinkInterval);
  }, []);

  useEffect(() => {
    let raf;
    const start = Date.now();
    const loop = () => {
      const elapsed = (Date.now() - start) / 1000;
      setBreath(Math.sin(elapsed * 1.5) * 1.2);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const isFemale = gender === "female";
  const skin = "#FCD5B5";
  const skinShade = "#F4B896";
  const skinHighlight = "#FFE4CC";
  const hairMain = isFemale ? "#FFB6D9" : "#7BB3F0";
  const hairDark = isFemale ? "#E88FB8" : "#5A8FD4";
  const hairLight = isFemale ? "#FFD6E8" : "#A5C9F5";
  const irisColor = isFemale ? "#B47AE8" : "#3DD4E8";
  const irisDark = isFemale ? "#7A3FC7" : "#1BA5BD";
  const blush = isFemale ? "#FF9BB8" : "#FFA8A8";
  const lineColor = "#3D2B4F";

  return (
    <svg width={size} height={size} viewBox="0 0 120 120" style={{ overflow: "visible", filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.25))" }}>
      <defs>
        <radialGradient id={`halo-${gender}`} cx="50%" cy="45%" r="50%">
          <stop offset="0%" stopColor={t.accent} stopOpacity="0.35" />
          <stop offset="70%" stopColor={t.accent} stopOpacity="0.08" />
          <stop offset="100%" stopColor={t.accent} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`hair-${gender}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={hairLight} />
          <stop offset="50%" stopColor={hairMain} />
          <stop offset="100%" stopColor={hairDark} />
        </linearGradient>
        <linearGradient id={`skin-${gender}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={skinHighlight} />
          <stop offset="60%" stopColor={skin} />
          <stop offset="100%" stopColor={skinShade} />
        </linearGradient>
        <radialGradient id={`iris-${gender}`} cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor={irisColor} />
          <stop offset="70%" stopColor={irisColor} />
          <stop offset="100%" stopColor={irisDark} />
        </radialGradient>
      </defs>

      <circle cx="60" cy="58" r="52" fill={`url(#halo-${gender})`} />

      <g transform={`translate(0, ${breath})`}>
        {isFemale && (
          <path d="M 22 62 Q 14 80 16 105 Q 22 102 26 95 Q 28 108 34 110 Q 38 95 38 80 Z" fill={`url(#hair-${gender})`} stroke={lineColor} strokeWidth="2" strokeLinejoin="round" />
        )}
        {isFemale && (
          <path d="M 98 62 Q 106 80 104 105 Q 98 102 94 95 Q 92 108 86 110 Q 82 95 82 80 Z" fill={`url(#hair-${gender})`} stroke={lineColor} strokeWidth="2" strokeLinejoin="round" />
        )}

        <rect x="53" y="88" width="14" height="14" rx="4" fill={skinShade} stroke={lineColor} strokeWidth="1.5" />
        <ellipse cx="60" cy="58" rx="32" ry="34" fill={`url(#skin-${gender})`} stroke={lineColor} strokeWidth="2" />

        <g style={{ transform: `rotate(${headTilt}deg)`, transformOrigin: "60px 58px", transition: "transform 300ms cubic-bezier(0.4, 0, 0.2, 1)" }}>
          <ellipse cx="28" cy="60" rx="4" ry="6" fill={skin} stroke={lineColor} strokeWidth="1.5" />
          <ellipse cx="92" cy="60" rx="4" ry="6" fill={skin} stroke={lineColor} strokeWidth="1.5" />

          {isFemale ? (
            <>
              <path d="M 28 50 Q 30 26 60 24 Q 90 26 92 50 Q 94 38 88 30 Q 76 16 60 16 Q 44 16 32 30 Q 26 38 28 50 Z" fill={`url(#hair-${gender})`} stroke={lineColor} strokeWidth="2" strokeLinejoin="round" />
              <path d="M 28 50 Q 24 58 26 70 Q 32 66 34 58 Q 34 52 28 50 Z" fill={hairMain} stroke={lineColor} strokeWidth="1.5" />
              <path d="M 92 50 Q 96 58 94 70 Q 88 66 86 58 Q 86 52 92 50 Z" fill={hairMain} stroke={lineColor} strokeWidth="1.5" />
              <path d="M 40 30 Q 50 24 60 24 Q 70 24 80 30 Q 70 34 60 34 Q 50 34 40 30 Z" fill={hairLight} opacity="0.6" />
              <path d="M 32 34 L 40 32 L 42 38 L 34 40 Z" fill="#FF6B9D" stroke={lineColor} strokeWidth="1.2" strokeLinejoin="round" />
              <circle cx="37" cy="36" r="1" fill="#FFFFFF" />
            </>
          ) : (
            <>
              <path d="M 28 50 Q 32 28 60 26 Q 88 28 92 50 Q 92 40 86 32 Q 76 22 60 22 Q 44 22 34 32 Q 28 40 28 50 Z" fill={`url(#hair-${gender})`} stroke={lineColor} strokeWidth="2" strokeLinejoin="round" />
              <path d="M 34 40 L 42 30 L 46 40 L 52 32 L 58 42 L 64 32 L 70 40 L 76 32 L 84 42 Q 74 36 60 36 Q 46 36 34 40 Z" fill={hairMain} stroke={lineColor} strokeWidth="1.5" strokeLinejoin="round" />
              <path d="M 60 20 Q 62 10 68 14 Q 63 18 60 22 Z" fill={hairMain} stroke={lineColor} strokeWidth="1.5" strokeLinejoin="round" />
            </>
          )}

          <path d="M 40 46 Q 46 43 52 45" stroke={hairDark} strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M 68 45 Q 74 43 80 46" stroke={hairDark} strokeWidth="2" fill="none" strokeLinecap="round" />

          <g style={{ transform: blinking ? "scaleY(0.1)" : "scaleY(1)", transformOrigin: "60px 58px", transition: "transform 100ms ease-out" }}>
            <ellipse cx="46" cy="58" rx="7" ry="9" fill="#FFFFFF" stroke={lineColor} strokeWidth="1.8" />
            <ellipse cx={46 + pupilX} cy={58 + pupilY} rx="5" ry="7" fill={`url(#iris-${gender})`} />
            <ellipse cx={46 + pupilX} cy={58 + pupilY} rx="2.5" ry="3.5" fill="#0F0A18" />
            <circle cx={45 + pupilX} cy={55 + pupilY} r="2" fill="#FFFFFF" />
            <circle cx={47.5 + pupilX} cy={61 + pupilY} r="1" fill="#FFFFFF" opacity="0.7" />

            <ellipse cx="74" cy="58" rx="7" ry="9" fill="#FFFFFF" stroke={lineColor} strokeWidth="1.8" />
            <ellipse cx={74 + pupilX} cy={58 + pupilY} rx="5" ry="7" fill={`url(#iris-${gender})`} />
            <ellipse cx={74 + pupilX} cy={58 + pupilY} rx="2.5" ry="3.5" fill="#0F0A18" />
            <circle cx={73 + pupilX} cy={55 + pupilY} r="2" fill="#FFFFFF" />
            <circle cx={75.5 + pupilX} cy={61 + pupilY} r="1" fill="#FFFFFF" opacity="0.7" />
          </g>

          {isFemale && (
            <>
              <path d="M 39 54 Q 44 51 51 52" stroke={lineColor} strokeWidth="1.5" fill="none" strokeLinecap="round" />
              <path d="M 69 52 Q 76 51 81 54" stroke={lineColor} strokeWidth="1.5" fill="none" strokeLinecap="round" />
            </>
          )}

          <ellipse cx="36" cy="72" rx="6" ry="3" fill={blush} opacity="0.55" />
          <ellipse cx="84" cy="72" rx="6" ry="3" fill={blush} opacity="0.55" />

          <path d="M 60 68 Q 61 70 60 72" stroke={lineColor} strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.6" />

          {isFemale ? (
            <>
              <path d="M 53 78 Q 60 84 67 78" stroke={lineColor} strokeWidth="2" fill="none" strokeLinecap="round" />
              <path d="M 54 79 Q 60 82 66 79" fill="#FF6B9D" opacity="0.6" />
            </>
          ) : (
            <>
              <path d="M 54 78 Q 60 82 66 78" stroke={lineColor} strokeWidth="2" fill="none" strokeLinecap="round" />
              <path d="M 54 78 L 66 78" stroke={lineColor} strokeWidth="0.8" opacity="0.4" />
            </>
          )}
        </g>
      </g>
    </svg>
  );
}

/* ============ BATTERY STATUS ============ */
function getBatteryStatus(batteryData, isTyping) {
  if (isTyping) return { emoji: "🤔", label: "Mikir", color: "#A78BFA" };
  if (!batteryData?.available) return { emoji: "🔌", label: "Unknown", color: "#8B7BA8" };
  const { level, charging } = batteryData.data;
  if (charging) return { emoji: "⚡", label: `Cas ${level}%`, color: "#FFB347" };
  if (level <= 10) return { emoji: "💀", label: `Sekarat ${level}%`, color: "#EF4444" };
  if (level <= 20) return { emoji: "🪫", label: `Low ${level}%`, color: "#F97316" };
  if (level <= 50) return { emoji: "🔋", label: `${level}%`, color: "#FBBF24" };
  if (level <= 80) return { emoji: "🔋", label: `${level}%`, color: "#A78BFA" };
  return { emoji: "🔋", label: `${level}%`, color: "#22D3EE" };
}

/* ============ MESSAGE BUBBLE ============ */
function MessageBubble({ message, onCopy, darkMode }) {
  const isUser = message.sender === "user";
  const isImage = message.type === "image";
  const isPlaceholder = message.text === "...";
  const t = THEME[darkMode ? "dark" : "light"];

  if (isPlaceholder) {
    return (
      <div className="flex flex-col items-start gap-1.5 animate-[popIn_250ms_ease-out]">
        <div className="flex items-center gap-2 pl-1">
          <span className="text-[10px] font-semibold uppercase tracking-[0.15em]" style={{ color: t.accent }}>AI</span>
        </div>
        <div className="rounded-2xl px-5 py-3.5 inline-flex items-center gap-1.5" style={{ background: t.aiBubbleBg, border: `1px solid ${t.aiBubbleBorder}` }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: t.accent, animation: "bounceDot 1.4s ease-in-out infinite", animationDelay: "0s" }} />
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: t.accent, animation: "bounceDot 1.4s ease-in-out infinite", animationDelay: "0.2s" }} />
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: t.accent, animation: "bounceDot 1.4s ease-in-out infinite", animationDelay: "0.4s" }} />
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col ${isUser ? "items-end" : "items-start"} gap-1.5 animate-[popIn_250ms_ease-out]`}>
      <div className={`flex items-center gap-2 ${isUser ? "pr-1" : "pl-1"}`}>
        <span className="text-[10px] font-semibold uppercase tracking-[0.15em]" style={{ color: isUser ? t.warm : t.accent }}>{isUser ? "Kamu" : "AI"}</span>
        <span className="text-[10px]" style={{ fontFamily: "'JetBrains Mono', monospace", color: t.textMuted }}>{message.timestamp}</span>
      </div>

      <div
        className="max-w-[85%] md:max-w-[72%] rounded-2xl px-4 py-3"
        style={{
          background: isUser ? t.userBubbleBg : t.aiBubbleBg,
          border: `1px solid ${isUser ? t.userBubbleBorder : t.aiBubbleBorder}`,
          color: isUser ? t.userBubbleText : t.aiBubbleText,
          fontFamily: "'Inter', sans-serif",
          fontSize: "14px",
          lineHeight: "1.7",
          boxShadow: "0 2px 12px rgba(0,0,0,0.15)"
        }}
      >
        {isImage ? (
          <div className="space-y-2.5">
            <img src={message.imageUrl} alt={message.text} className="max-w-full rounded-lg" style={{ border: `1px solid ${t.aiBubbleBorder}` }} />
            <div className="text-xs italic" style={{ color: t.textMuted }}>{message.text}</div>
          </div>
        ) : (
          <div className="whitespace-pre-wrap">{message.text}</div>
        )}

        {!isUser && (message.text || isImage) && (
          <div className="mt-2.5 pt-2 flex justify-end border-t" style={{ borderColor: t.aiBubbleBorder }}>
            <button onClick={() => onCopy(message.text || message.imageUrl)} className="text-[10px] uppercase tracking-wider font-medium opacity-50 hover:opacity-100 flex items-center gap-1" style={{ color: t.textSecondary }}>
              <Copy size={10} /> Copy
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============ TYPING INDICATOR ============ */
function TypingIndicator({ phrase, darkMode }) {
  const t = THEME[darkMode ? "dark" : "light"];
  return (
    <div className="flex flex-col items-start gap-1.5 animate-[popIn_250ms_ease-out]">
      <div className="flex items-center gap-2 pl-1">
        <span className="text-[10px] font-semibold uppercase tracking-[0.15em]" style={{ color: t.accent }}>AI</span>
      </div>
      <div className="rounded-2xl px-4 py-3" style={{ background: t.aiBubbleBg, border: `1px solid ${t.aiBubbleBorder}` }}>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex gap-1">
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: t.accent, animation: "bounceDot 1.4s ease-in-out infinite", animationDelay: "0s" }} />
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: t.accent, animation: "bounceDot 1.4s ease-in-out infinite", animationDelay: "0.2s" }} />
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: t.accent, animation: "bounceDot 1.4s ease-in-out infinite", animationDelay: "0.4s" }} />
          </span>
          <span className="italic" style={{ color: t.textSecondary }}>{phrase}</span>
        </div>
      </div>
    </div>
  );
}

/* ============ MODE PICKER ============ */
function ModePickerModal({ open, onClose, currentMode, onSelect, darkMode }) {
  if (!open) return null;
  const t = THEME[darkMode ? "dark" : "light"];
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" style={{ backgroundColor: t.modalOverlay }}>
      <div className="w-full max-w-2xl rounded-2xl overflow-hidden animate-[popIn_200ms_ease-out]" style={{ backgroundColor: t.modalBg, border: `1px solid ${t.modalBorder}`, boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: t.modalBorder }}>
          <div className="flex items-center gap-3">
            <div className="rounded-lg p-2" style={{ backgroundColor: t.accentSoft, color: t.accent }}><Zap size={16} /></div>
            <div>
              <h3 className="text-base font-semibold" style={{ color: t.textPrimary }}>Pilih Mode</h3>
              <p className="text-[11px]" style={{ color: t.textMuted }}>Ctrl+K buat buka cepat</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2" style={{ color: t.textSecondary }}><X size={16} /></button>
        </div>
        <div className="p-3 max-h-[70vh] overflow-y-auto grid sm:grid-cols-2 gap-2">
          {AVAILABLE_MODES.map((mode) => {
            const Icon = mode.icon;
            const isActive = currentMode === mode.id;
            return (
              <button key={mode.id} onClick={() => onSelect(mode)} className="text-left rounded-xl p-3 transition-all" style={{ backgroundColor: isActive ? t.accentSoft : "transparent", border: `1px solid ${isActive ? t.accent : t.modalBorder}`, color: t.textPrimary }}>
                <div className="flex items-start gap-3">
                  <div className="rounded-lg p-1.5" style={{ backgroundColor: isActive ? t.accent : t.accentSoft, color: isActive ? "#16121F" : t.accent }}><Icon size={14} /></div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-medium">{mode.label}</span>
                      {isActive && <span className="text-[9px] font-medium uppercase" style={{ color: t.accent }}>Aktif</span>}
                    </div>
                    <div className="mt-0.5 text-[11px]" style={{ color: t.textMuted }}>{mode.description}</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ============ SUBCATEGORY ============ */
function SubcategoryModal({ open, onClose, onSelect, selectedCategory, title, subtitle, categories, darkMode }) {
  if (!open) return null;
  const t = THEME[darkMode ? "dark" : "light"];
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4" style={{ backgroundColor: t.modalOverlay }}>
      <div className="w-full max-w-2xl rounded-2xl overflow-hidden animate-[popIn_200ms_ease-out]" style={{ backgroundColor: t.modalBg, border: `1px solid ${t.modalBorder}`, boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: t.modalBorder }}>
          <div>
            <h3 className="text-base font-semibold" style={{ color: t.textPrimary }}>{title}</h3>
            <p className="text-[11px] mt-0.5" style={{ color: t.textMuted }}>{subtitle}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2" style={{ color: t.textSecondary }}><X size={16} /></button>
        </div>
        <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[65vh] overflow-y-auto">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = selectedCategory === cat.id;
            return (
              <button key={cat.id} onClick={() => onSelect(cat)} className="text-left rounded-xl p-3 transition-all" style={{ backgroundColor: isActive ? cat.accent + "15" : "transparent", border: `1px solid ${isActive ? cat.accent : t.modalBorder}`, color: t.textPrimary }}>
                <div className="flex items-start gap-3">
                  <div className="rounded-lg p-1.5" style={{ backgroundColor: cat.accent + "20", color: cat.accent }}><Icon size={16} /></div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-medium">{cat.label}</div>
                    <div className="mt-0.5 text-[11px]" style={{ color: t.textMuted }}>{cat.description}</div>
                  </div>
                  {isActive && <CheckCircle2 size={14} style={{ color: cat.accent }} />}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ============ MAIN APP ============ */
export default function App() {
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window === "undefined") return true;
    const saved = localStorage.getItem("aibe_dark_mode");
    if (saved !== null) return saved === "true";
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? true;
  });

  const [themeTransition, setThemeTransition] = useState(null);

  const [profile, setProfile] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PROFILE);
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const [gender, setGender] = useState(() => {
    if (typeof window === "undefined") return "male";
    return localStorage.getItem(STORAGE_KEY_GENDER) || "male";
  });

  const [inputName, setInputName] = useState("");
  const [currentMode, setCurrentMode] = useState("NORMAL");
  const [curhatCategory, setCurhatCategory] = useState(null);
  const [scriptCategory, setScriptCategory] = useState(null);

  const [sessions, setSessions] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SESSIONS);
      return saved ? JSON.parse(saved) : [{ id: "default", title: "Obrolan Utama", messages: [] }];
    } catch {
      return [{ id: "default", title: "Obrolan Utama", messages: [] }];
    }
  });

  const [pinnedSessions, setPinnedSessions] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PINNED);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [activeSessionId, setActiveSessionId] = useState("default");
  const [inputQuery, setInputQuery] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [typingPhrase, setTypingPhrase] = useState("");
  const [activeView, setActiveView] = useState("chat");
  const [searchFilter, setSearchFilter] = useState("");
  const [toastNotice, setToastNotice] = useState(null);
  const [liveMirrorData, setLiveMirrorData] = useState(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showModePicker, setShowModePicker] = useState(false);
  const [showCurhatPicker, setShowCurhatPicker] = useState(false);
  const [showScriptPicker, setShowScriptPicker] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [showSidebar, setShowSidebar] = useState(false);

  // Auto follow-up refs
  const followUpTimerRef = useRef(null);
  const followUpCountRef = useRef(0);
  const lastUserMessageTimeRef = useRef(0);
  const pendingFollowUpRef = useRef(null);
  const sessionRef = useRef(activeSessionId);
  const genderRef = useRef(gender);
  const modeRef = useRef(currentMode);

  const isGeneratingRef = useRef(false);
  const activeAbortControllerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const searchInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const chatInputRef = useRef(null);
  const headerCharRef = useRef(null);
  const emptyCharRef = useRef(null);

  const t = THEME[darkMode ? "dark" : "light"];

  // Keep refs in sync
  useEffect(() => { sessionRef.current = activeSessionId; }, [activeSessionId]);
  useEffect(() => { genderRef.current = gender; }, [gender]);
  useEffect(() => { modeRef.current = currentMode; }, [currentMode]);

  const triggerToast = useCallback((message) => {
    setToastNotice(message);
    setTimeout(() => setToastNotice(null), 2200);
  }, []);

  const activeSession = useMemo(() => {
    return sessions.find((s) => s.id === activeSessionId) || sessions[0] || { id: "default", title: "Obrolan Utama", messages: [] };
  }, [sessions, activeSessionId]);

  const filteredSessions = useMemo(() => {
    const q = searchFilter.toLowerCase().trim();
    let list = sessions;
    if (q) list = list.filter((s) => s.title.toLowerCase().includes(q));
    const pinned = list.filter((s) => pinnedSessions.includes(s.id));
    const unpinned = list.filter((s) => !pinnedSessions.includes(s.id));
    return [...pinned, ...unpinned];
  }, [sessions, searchFilter, pinnedSessions]);

  const currentModeData = useMemo(() => AVAILABLE_MODES.find((m) => m.id === currentMode) || AVAILABLE_MODES[0], [currentMode]);
  const currentCategoryData = useMemo(() => CURHAT_CATEGORIES.find((c) => c.id === curhatCategory) || null, [curhatCategory]);
  const currentScriptData = useMemo(() => SCRIPT_CATEGORIES.find((c) => c.id === scriptCategory) || null, [scriptCategory]);

  const totalStats = useMemo(() => ({
    totalMessages: sessions.reduce((acc, s) => acc + s.messages.length, 0),
    totalSessions: sessions.length
  }), [sessions]);

  const batteryStatus = useMemo(() => getBatteryStatus(liveMirrorData?.battery, isTyping), [liveMirrorData, isTyping]);

  /* ============ CANCEL FOLLOW-UP ============ */
  const cancelFollowUp = useCallback(() => {
    if (followUpTimerRef.current) {
      clearTimeout(followUpTimerRef.current);
      followUpTimerRef.current = null;
    }
    followUpCountRef.current = 0;
    pendingFollowUpRef.current = null;
  }, []);

  /* ============ SEND FOLLOW-UP (auto dari AI) ============ */
  const sendFollowUpMessage = useCallback(async (sessionId, followUpIndex) => {
    if (isGeneratingRef.current) return;
    if (sessionRef.current !== sessionId) return;

    const currentGender = genderRef.current;
    const currentMode = modeRef.current;

    if (!FOLLOWUP_SETTINGS.activeModes.includes(currentMode)) return;

    isGeneratingRef.current = true;

    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const aiMessageId = Date.now();

    // Tambah placeholder
    setSessions((prev) =>
      prev.map((session) =>
        session.id === sessionId
          ? { ...session, messages: [...session.messages, { id: aiMessageId, sender: "ai", text: "...", timestamp: timeStr }] }
          : session
      )
    );

    // Update text helper
    const updateAiText = (newText) => {
      setSessions((prev) =>
        prev.map((session) =>
          session.id === sessionId
            ? { ...session, messages: session.messages.map((m) => (m.id === aiMessageId ? { ...m, text: newText } : m)) }
            : session
        )
      );
    };

    // Ambil history terbaru
    let history = [];
    setSessions((prev) => {
      const sess = prev.find((s) => s.id === sessionId);
      if (sess) history = sess.messages.filter((m) => m.text && m.text.trim() && m.text !== "...");
      return prev;
    });

    // Delay kecil biar state update
    await new Promise((r) => setTimeout(r, 50));

    const systemPrompt = BUILD_SYSTEM_PROMPT(profile, currentMode, curhatCategory, scriptCategory, currentGender, true);

    const apiMessages = [
      { role: "system", content: systemPrompt },
      ...history.slice(-8).map((m) => ({ role: m.sender === "user" ? "user" : "assistant", content: m.text })),
      {
        role: "user",
        content: followUpIndex === 0
          ? "[SISTEM: User belum balas. Kirim pesan follow-up singkat, natural, lanjutan dari konteks sebelumnya. Kalau konteks sebelumnya soal gombalan, balas gombalan balik atau ungkapin perasaan manja. Jangan tanya kenapa user diem. Maks 2 kalimat.]"
          : `[SISTEM: User masih belum balas. Ini follow-up ke-${followUpIndex + 1}. Kirim pesan SINGKAT, natural, sedikit kesan "kangen" atau ngajak ngobrol. Jangan spam, jangan tanya kenapa diem. Maks 1-2 kalimat. Kalau di follow-up terakhir, boleh sedikit "yaudah aku tunggu ya".]`
      }
    ];

    await callGroqAI({
      messages: apiMessages,
      signal: null,
      onChunk: (acc) => updateAiText(acc),
      onComplete: (finalText) => {
        isGeneratingRef.current = false;
        if (!finalText) updateAiText("...");
      },
      onError: (err) => {
        isGeneratingRef.current = false;
        console.error("Follow-up error:", err);
        // Kalau error, hapus placeholder
        setSessions((prev) =>
          prev.map((session) =>
            session.id === sessionId
              ? { ...session, messages: session.messages.filter((m) => m.id !== aiMessageId) }
              : session
          )
        );
      }
    });
  }, [profile, curhatCategory, scriptCategory]);

  /* ============ SCHEDULE FOLLOW-UP ============ */
  const scheduleFollowUp = useCallback((sessionId, isAfterFlirt = false) => {
    cancelFollowUp();

    const currentMode = modeRef.current;
    if (!FOLLOWUP_SETTINGS.activeModes.includes(currentMode)) return;
    if (sessionRef.current !== sessionId) return;

    const scheduleNext = (index) => {
      if (index >= FOLLOWUP_SETTINGS.maxFollowUps) {
        followUpCountRef.current = 0;
        return;
      }

      const delayMin = index === 0 ? FOLLOWUP_SETTINGS.firstDelayMin : FOLLOWUP_SETTINGS.nextDelayMin;
      const delayMax = index === 0 ? FOLLOWUP_SETTINGS.firstDelayMax : FOLLOWUP_SETTINGS.nextDelayMax;
      const delay = delayMin + Math.random() * (delayMax - delayMin);

      followUpTimerRef.current = setTimeout(async () => {
        if (sessionRef.current !== sessionId) {
          followUpCountRef.current = 0;
          return;
        }

        await sendFollowUpMessage(sessionId, index);
        followUpCountRef.current = index + 1;

        followUpTimerRef.current = setTimeout(() => {
          scheduleNext(index + 1);
        }, 100);
      }, delay);
    };

    scheduleNext(0);
  }, [cancelFollowUp, sendFollowUpMessage]);

  /* ============ HANDLERS ============ */
  const handleSaveProfile = () => {
    if (!inputName.trim()) return;
    const newProfile = {
      ...DEFAULT_PROFILE,
      name: inputName.trim(),
      nickname: inputName.trim().split(" ")[0],
      createdAt: new Date().toISOString(),
      lastSeen: new Date().toISOString()
    };
    setProfile(newProfile);
    const greetingText = gender === "female"
      ? `Hai ${newProfile.nickname}! Aku siap bantuin kamu.\n\nFitur:\n- Buat Gambar\n- Buat Script\n- Import File\n- Mode Curhat\n\nKlik tombol mode di header, atau tekan Ctrl+K.`
      : `Halo ${newProfile.nickname}! Gue siap bantu lu.\n\nFitur:\n- Buat Gambar\n- Buat Script\n- Import File\n- Mode Curhat\n\nKlik tombol mode di header, atau tekan Ctrl+K.`;
    const greeting = {
      id: Date.now(),
      sender: "ai",
      text: greetingText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };
    setSessions([{ id: "default", title: "Obrolan Utama", messages: [greeting] }]);
    triggerToast("Profil dibuat");
  };

  const handleCreateNewSession = () => {
    cancelFollowUp();
    const newId = `session_${Date.now()}`;
    setSessions((prev) => [{ id: newId, title: `Obrolan ${prev.length + 1}`, messages: [] }, ...prev]);
    setActiveSessionId(newId);
    setShowSidebar(false);
    triggerToast("Sesi baru");
  };

  const handleDeleteSession = (id, e) => {
    e.stopPropagation();
    if (sessions.length <= 1) {
      setSessions([{ id: "default", title: "Obrolan Utama", messages: [] }]);
      setActiveSessionId("default");
      return;
    }
    const next = sessions.filter((s) => s.id !== id);
    setSessions(next);
    setPinnedSessions((prev) => prev.filter((p) => p !== id));
    if (activeSessionId === id) setActiveSessionId(next[0].id);
  };

  const handleTogglePin = (id, e) => {
    e.stopPropagation();
    setPinnedSessions((prev) => prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]);
  };

  const handleSwitchSession = (id) => {
    cancelFollowUp();
    setActiveSessionId(id);
    setShowSidebar(false);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    triggerToast("Disalin");
  };

  const handleExportChat = () => {
    const lines = activeSession.messages.map((m) => {
      const sender = m.sender === "user" ? "KAMU" : "AI";
      return `[${m.timestamp}] ${sender}:\n${m.text}\n`;
    });
    const content = `=== ${activeSession.title} ===\nMode: ${currentModeData.label}\nDiekspor: ${new Date().toLocaleString("id-ID")}\n\n${lines.join("\n")}`;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `aibe-${activeSession.id}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    triggerToast("Diekspor");
  };

  const handleFileImport = (e) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      if (file.size > 1024 * 1024) { triggerToast(`File ${file.name} > 1MB`); return; }
      const reader = new FileReader();
      reader.onload = (ev) => {
        setAttachedFiles((prev) => [...prev, { name: file.name, size: file.size, content: ev.target.result, type: file.type }]);
        triggerToast(`${file.name} siap`);
      };
      reader.readAsText(file);
    });
    e.target.value = "";
  };

  const removeAttachedFile = (idx) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const createFreshSession = (title, greetingText) => {
    cancelFollowUp();
    const newId = `session_${Date.now()}`;
    const newSession = {
      id: newId,
      title,
      messages: greetingText
        ? [{ id: Date.now(), sender: "ai", text: greetingText, timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }]
        : []
    };
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newId);
  };

  const handleModeSelect = (mode) => {
    setShowModePicker(false);
    cancelFollowUp();
    if (mode.id === "CURHAT") { setCurrentMode("CURHAT"); setTimeout(() => setShowCurhatPicker(true), 150); return; }
    if (mode.id === "SCRIPT_GEN") { setCurrentMode("SCRIPT_GEN"); setTimeout(() => setShowScriptPicker(true), 150); return; }
    setCurrentMode(mode.id);
    setCurhatCategory(null);
    setScriptCategory(null);
    createFreshSession(`Mode: ${mode.label}`, `Mode ${mode.label} aktif.`);
    triggerToast(`Mode ${mode.label}`);
  };

  const handleCurhatCategorySelect = (cat) => {
    cancelFollowUp();
    setCurhatCategory(cat.id);
    setCurrentMode("CURHAT");
    setShowCurhatPicker(false);
    const newId = `curhat_${cat.id}_${Date.now()}`;
    const newSession = {
      id: newId,
      title: `Curhat: ${cat.label}`,
      messages: [{
        id: Date.now(),
        sender: "ai",
        text: gender === "female"
          ? `Oke, aku siap dengerin kamu curhat soal ${cat.label}.\n\nSantai aja, gak ada yang nge-judge di sini. Cerita aja ya~`
          : `Oke, gue siap dengerin lu curhat soal ${cat.label}.\n\nSantai aja, gak ada yang nge-judge di sini. Cerita aja.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      }]
    };
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newId);
    triggerToast(`Curhat — ${cat.label}`);
  };

  const handleScriptCategorySelect = (cat) => {
    cancelFollowUp();
    setScriptCategory(cat.id);
    setCurrentMode("SCRIPT_GEN");
    setShowScriptPicker(false);
    const newId = `script_${cat.id}_${Date.now()}`;
    const newSession = {
      id: newId,
      title: `Script: ${cat.label}`,
      messages: [{
        id: Date.now(),
        sender: "ai",
        text: gender === "female"
          ? `Mode Script — ${cat.label} aktif.\n\nMau bikin script tentang apa?`
          : `Mode Script — ${cat.label} aktif.\n\nMau bikin script tentang apa nih?`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      }]
    };
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newId);
    triggerToast(`Script — ${cat.label}`);
  };

  const generateImage = async (prompt) => {
    const encoded = encodeURIComponent(prompt);
    const seed = Math.floor(Math.random() * 1000000);
    return `${IMAGE_API}/${encoded}?width=768&height=768&seed=${seed}&nologo=true`;
  };

  const handleSendMessage = async (overrideText = null) => {
    cancelFollowUp();

    const messageText = (overrideText || inputQuery).trim();
    if (!messageText && attachedFiles.length === 0) return;
    if (isGeneratingRef.current) return;
    if (currentMode === "CURHAT" && !curhatCategory) { setShowCurhatPicker(true); return; }
    if (currentMode === "SCRIPT_GEN" && !scriptCategory) { setShowScriptPicker(true); return; }
    if (activeAbortControllerRef.current) activeAbortControllerRef.current.abort();
    const abortController = new AbortController();
    activeAbortControllerRef.current = abortController;
    isGeneratingRef.current = true;
    if (!overrideText) setInputQuery("");

    lastUserMessageTimeRef.current = Date.now();
    const isFlirt = detectFlirt(messageText);

    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    let fullMessage = messageText;
    if (attachedFiles.length > 0) {
      const fileContents = attachedFiles.map((f) => `\n\n[FILE: ${f.name}]\n${f.content}`).join("");
      fullMessage = messageText + fileContents;
    }

    const userMessage = {
      id: Date.now(),
      sender: "user",
      text: messageText + (attachedFiles.length ? `\n\n(${attachedFiles.length} file dilampirkan)` : ""),
      timestamp: timeStr
    };

    const sessionBefore = sessions.find((s) => s.id === activeSessionId);
    const historyForApi = [...(sessionBefore?.messages || []), { ...userMessage, text: fullMessage }];

    const aiMessageId = Date.now() + 1;
    const placeholderAiMessage = { id: aiMessageId, sender: "ai", text: "...", timestamp: timeStr };

    setSessions((prev) =>
      prev.map((session) =>
        session.id === activeSessionId
          ? {
              ...session,
              title: session.messages.length === 0 ? messageText.slice(0, 25) || "File upload" : session.title,
              messages: [...session.messages, userMessage, placeholderAiMessage]
            }
          : session
      )
    );

    setAttachedFiles([]);

    const updateAiText = (newText) => {
      setSessions((prev) =>
        prev.map((session) =>
          session.id === activeSessionId
            ? { ...session, messages: session.messages.map((m) => (m.id === aiMessageId ? { ...m, text: newText } : m)) }
            : session
        )
      );
    };

    const updateAiImage = (imageUrl, caption) => {
      setSessions((prev) =>
        prev.map((session) =>
          session.id === activeSessionId
            ? { ...session, messages: session.messages.map((m) => (m.id === aiMessageId ? { ...m, type: "image", imageUrl, text: caption } : m)) }
            : session
        )
      );
    };

    if (["TEBAK_BATRE", "SYSTEM_INFO", "NETWORK"].includes(currentMode)) {
      try {
        setIsTyping(true);
        setTypingPhrase("Ambil data dari device...");
        const autoReply = await buildTelemetryAutoReply(currentMode);
        if (autoReply) {
          const words = autoReply.split(" ");
          let acc = "";
          for (const w of words) {
            acc += (acc ? " " : "") + w;
            updateAiText(acc);
            await new Promise((r) => setTimeout(r, 25));
          }
          isGeneratingRef.current = false;
          setIsTyping(false);
          activeAbortControllerRef.current = null;
          return;
        }
      } catch (err) { console.error("Telemetry error:", err); }
    }

    if (currentMode === "IMAGE_GEN") {
      setIsTyping(true);
      setTypingPhrase("Membuat gambar...");
      updateAiText("Membuat gambar...");
      await new Promise((r) => setTimeout(r, 800));
      const imageUrl = await generateImage(messageText);
      updateAiImage(imageUrl, messageText);
      isGeneratingRef.current = false;
      setIsTyping(false);
      activeAbortControllerRef.current = null;
      return;
    }

    const systemPrompt = BUILD_SYSTEM_PROMPT(profile, currentMode, curhatCategory, scriptCategory, gender, false);
    const relevantHistory = ["CURHAT", "SCRIPT_GEN"].includes(currentMode) ? historyForApi.slice(-6) : historyForApi;

    const apiMessages = [
      { role: "system", content: systemPrompt },
      ...relevantHistory
        .filter((m) => m.text && m.text.trim() && m.text !== "...")
        .map((m) => ({ role: m.sender === "user" ? "user" : "assistant", content: m.text }))
    ];

    setIsTyping(true);
    setTypingPhrase(getRandomTypingPhrase());

    const currentSessionId = activeSessionId;

    await callGroqAI({
      messages: apiMessages,
      signal: abortController.signal,
      onChunk: (acc) => updateAiText(acc),
      onComplete: (finalText) => {
        isGeneratingRef.current = false;
        setIsTyping(false);
        activeAbortControllerRef.current = null;
        if (!finalText) updateAiText("(Tidak ada respon.)");

        // 🎯 SCHEDULE FOLLOW-UP
        if (FOLLOWUP_SETTINGS.activeModes.includes(currentMode) && currentSessionId === sessionRef.current) {
          setTimeout(() => {
            if (sessionRef.current === currentSessionId && !isGeneratingRef.current) {
              scheduleFollowUp(currentSessionId, isFlirt);
            }
          }, 1500);
        }
      },
      onError: (err) => {
        isGeneratingRef.current = false;
        setIsTyping(false);
        activeAbortControllerRef.current = null;
        updateAiText(`Error: ${err.message || "Gagal memproses pesan."}`);
      }
    });
  };

  /* ============ CLEANUP ON UNMOUNT ============ */
  useEffect(() => {
    return () => cancelFollowUp();
  }, [cancelFollowUp]);

  /* ============ TOGGLE DARK MODE ============ */
  const toggleDarkMode = useCallback(() => {
    setThemeTransition({ toDark: !darkMode });
    setTimeout(() => setDarkMode((d) => !d), 200);
    setTimeout(() => setThemeTransition(null), 650);
  }, [darkMode]);

  const toggleGender = useCallback(() => {
    cancelFollowUp();
    setGender((g) => {
      const next = g === "male" ? "female" : "male";
      localStorage.setItem(STORAGE_KEY_GENDER, next);
      triggerToast(next === "male" ? "Mode Cowok" : "Mode Cewek");
      return next;
    });
  }, [triggerToast, cancelFollowUp]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("aibe_dark_mode", String(darkMode));
  }, [darkMode]);

  useEffect(() => {
    if (!profile) return;
    localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify({ ...profile, lastSeen: new Date().toISOString() }));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PINNED, JSON.stringify(pinnedSessions));
  }, [pinnedSessions]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeSession?.messages, isTyping]);

  useEffect(() => {
    const timer = setTimeout(() => chatInputRef.current?.focus(), 120);
    return () => clearTimeout(timer);
  }, [activeSessionId, currentMode, curhatCategory, scriptCategory]);

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") { e.preventDefault(); setShowModePicker(true); }
      if (e.key === "Escape") {
        setShowModePicker(false); setShowCurhatPicker(false);
        setShowScriptPicker(false); setShowSettingsModal(false); setShowSidebar(false);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "f") { e.preventDefault(); searchInputRef.current?.focus(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const refreshMirrorData = useCallback(async () => {
    const [battery, system, network] = await Promise.all([
      TelemetryProvider.getBattery(),
      TelemetryProvider.getSystemInfo(),
      TelemetryProvider.getNetworkInfo()
    ]);
    setLiveMirrorData({ battery, system, network });
  }, []);

  useEffect(() => {
    refreshMirrorData();
    const interval = setInterval(refreshMirrorData, 30000);
    return () => clearInterval(interval);
  }, [refreshMirrorData]);

  /* ============ ONBOARDING ============ */
  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 relative overflow-hidden" style={{ backgroundColor: darkMode ? "#16121F" : "#FAF7F2" }}>
        {themeTransition && (
          <div className="fixed inset-0 z-[200] pointer-events-none" style={{ backgroundColor: themeTransition.toDark ? "#16121F" : "#FAF7F2", animation: "slideFromLeft 500ms cubic-bezier(0.4, 0, 0.2, 1) forwards" }} />
        )}
        <div className="w-full max-w-md relative z-10">
          <div className="rounded-2xl p-8" style={{ backgroundColor: t.modalBg, border: `1px solid ${t.modalBorder}`, boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
            <div className="mb-6 flex items-center gap-3">
              <div style={{ width: 80, height: 80 }}>
                <AnimeCharacter gender={gender} size={80} darkMode={darkMode} />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-[0.2em]" style={{ color: t.textMuted }}>Edition {APP_VERSION}</div>
                <h1 className="text-2xl font-semibold" style={{ color: t.textPrimary, letterSpacing: "-0.02em" }}>{APP_NAME}</h1>
              </div>
            </div>

            <p className="text-sm mb-5" style={{ color: t.textSecondary }}>AI assistant pribadi yang ngobrolnya kayak temen.</p>

            <div className="mb-5">
              <label className="block text-[11px] font-medium mb-2" style={{ color: t.textSecondary }}>Karakter AI</label>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setGender("male")} className="rounded-xl p-3 text-center" style={{ backgroundColor: gender === "male" ? t.accentSoft : "transparent", border: `2px solid ${gender === "male" ? t.accent : t.modalBorder}` }}>
                  <div style={{ width: 64, height: 64, margin: "0 auto" }}>
                    <AnimeCharacter gender="male" size={64} darkMode={darkMode} />
                  </div>
                  <div className="text-[11px] mt-1 font-medium" style={{ color: t.textPrimary }}>Cowok</div>
                </button>
                <button onClick={() => setGender("female")} className="rounded-xl p-3 text-center" style={{ backgroundColor: gender === "female" ? t.accentSoft : "transparent", border: `2px solid ${gender === "female" ? t.accent : t.modalBorder}` }}>
                  <div style={{ width: 64, height: 64, margin: "0 auto" }}>
                    <AnimeCharacter gender="female" size={64} darkMode={darkMode} />
                  </div>
                  <div className="text-[11px] mt-1 font-medium" style={{ color: t.textPrimary }}>Cewek</div>
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-medium mb-2" style={{ color: t.textSecondary }}>Nama kamu</label>
                <input
                  type="text"
                  value={inputName}
                  onChange={(e) => setInputName(e.target.value)}
                  placeholder="Tulis nama..."
                  className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none"
                  style={{ backgroundColor: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.textPrimary }}
                  onFocus={(e) => { e.target.style.borderColor = t.accent; }}
                  onBlur={(e) => { e.target.style.borderColor = t.inputBorder; }}
                  onKeyDown={(e) => e.key === "Enter" && handleSaveProfile()}
                />
              </div>
              <button onClick={handleSaveProfile} className="w-full rounded-xl py-3 text-sm font-semibold" style={{ backgroundColor: t.accent, color: "#16121F" }}>Mulai</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const ModeIcon = currentModeData.icon;

  return (
    <div className="flex h-screen w-full overflow-hidden relative" style={{ fontFamily: "'Inter', sans-serif", backgroundColor: t.appBg, color: t.textPrimary }}>
      {themeTransition && (
        <div className="fixed inset-0 z-[200] pointer-events-none" style={{ backgroundColor: themeTransition.toDark ? "#16121F" : "#FAF7F2", animation: "slideFromLeft 500ms cubic-bezier(0.4, 0, 0.2, 1) forwards" }} />
      )}

      {toastNotice && (
        <div className="fixed bottom-8 left-1/2 z-[100] -translate-x-1/2 rounded-lg px-4 py-2.5 text-xs font-medium animate-[popIn_200ms_ease-out]" style={{ backgroundColor: t.modalBg, border: `1px solid ${t.modalBorder}`, color: t.textPrimary, boxShadow: "0 8px 24px rgba(0,0,0,0.3)" }}>
          {toastNotice}
        </div>
      )}

      <ModePickerModal open={showModePicker} onClose={() => setShowModePicker(false)} currentMode={currentMode} onSelect={handleModeSelect} darkMode={darkMode} />
      <SubcategoryModal open={showCurhatPicker} onClose={() => setShowCurhatPicker(false)} onSelect={handleCurhatCategorySelect} selectedCategory={curhatCategory} title="Mau curhat apa?" subtitle="Pilih kategori — chat baru bakal dimulai" categories={CURHAT_CATEGORIES} darkMode={darkMode} />
      <SubcategoryModal open={showScriptPicker} onClose={() => setShowScriptPicker(false)} onSelect={handleScriptCategorySelect} selectedCategory={scriptCategory} title="Mau bikin script apa?" subtitle="Pilih kategori script" categories={SCRIPT_CATEGORIES} darkMode={darkMode} />

      {showSidebar && (
        <div className="fixed inset-0 z-[70] md:hidden" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} onClick={() => setShowSidebar(false)} />
      )}

      <aside
        className={`fixed md:relative top-0 left-0 h-full w-64 flex flex-col z-[75] transition-transform duration-300 ${showSidebar ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
        style={{ backgroundColor: t.sidebarBg, borderRight: `1px solid ${t.sidebarBorder}` }}
      >
        <div className="p-4 flex items-center justify-between border-b" style={{ borderColor: t.sidebarBorder }}>
          <div className="flex items-center gap-3">
            <div ref={headerCharRef} style={{ width: 48, height: 48 }}>
              <AnimeCharacter gender={gender} size={48} darkMode={darkMode} trackingElement={headerCharRef} />
            </div>
            <div>
              <div className="text-sm font-semibold leading-none" style={{ color: t.textPrimary, letterSpacing: "-0.01em" }}>{APP_NAME}</div>
              <div className="text-[10px] mt-1" style={{ fontFamily: "'JetBrains Mono', monospace", color: t.textMuted }}>{APP_VERSION}</div>
            </div>
          </div>
          <button onClick={() => setShowSidebar(false)} className="md:hidden rounded-lg p-1.5" style={{ color: t.textSecondary }}><X size={14} /></button>
        </div>

        <div className="p-3">
          <button
            onClick={handleCreateNewSession}
            className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-[12px] font-medium transition-all"
            style={{ backgroundColor: t.inputBg, border: `1px solid ${t.sidebarBorder}`, color: t.textPrimary }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = t.warm}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = t.sidebarBorder}
          >
            <Plus size={13} /> Obrolan Baru
          </button>
        </div>

        <div className="px-3 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={12} style={{ color: t.textMuted }} />
            <input
              ref={searchInputRef}
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Cari..."
              className="w-full rounded-lg pl-8 pr-3 py-2 text-xs focus:outline-none"
              style={{ backgroundColor: t.inputBg, border: `1px solid ${t.sidebarBorder}`, color: t.textPrimary }}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 space-y-0.5 pb-3">
          {filteredSessions.map((session) => {
            const isPinned = pinnedSessions.includes(session.id);
            const isActive = activeSessionId === session.id;
            return (
              <div
                key={session.id}
                onClick={() => handleSwitchSession(session.id)}
                className="group flex items-center justify-between rounded-lg px-2.5 py-2 text-xs transition-all cursor-pointer"
                style={{
                  backgroundColor: isActive ? t.warmSoft : "transparent",
                  border: `1px solid ${isActive ? t.warm + "60" : "transparent"}`,
                  color: isActive ? t.textPrimary : t.textSecondary
                }}
              >
                <div className="flex items-center gap-2 truncate">
                  {isPinned ? <Pin size={11} style={{ color: t.warm }} /> : <MessageSquare size={12} style={{ color: t.textMuted }} />}
                  <span className="truncate">{session.title}</span>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                  <button onClick={(e) => handleTogglePin(session.id, e)} style={{ color: t.textMuted }}>{isPinned ? <PinOff size={11} /> : <Pin size={11} />}</button>
                  <button onClick={(e) => handleDeleteSession(session.id, e)} style={{ color: t.textMuted }}><Trash2 size={11} /></button>
                </div>
              </div>
            );
          })}
        </div>

        {liveMirrorData?.battery?.available && (
          <div className="p-3 border-t" style={{ borderColor: t.sidebarBorder }}>
            <div className="rounded-lg p-3" style={{ backgroundColor: t.inputBg, border: `1px solid ${t.sidebarBorder}` }}>
              <div className="flex items-center gap-1.5 text-[10px] font-medium" style={{ color: t.textSecondary }}>
                <span style={{ fontSize: 14 }}>{batteryStatus.emoji}</span>
                <span>{batteryStatus.label}</span>
              </div>
              <div className="mt-2 h-1 w-full rounded-full overflow-hidden" style={{ backgroundColor: t.sidebarBorder }}>
                <div className="h-full transition-all duration-500 rounded-full" style={{ width: `${liveMirrorData.battery.data.level}%`, backgroundColor: batteryStatus.color }} />
              </div>
            </div>
          </div>
        )}
      </aside>

      <main className="flex flex-1 flex-col h-full relative min-w-0">
        <header className="flex h-14 items-center justify-between px-4 md:px-6 z-30" style={{ borderBottom: `1px solid ${t.headerBorder}`, backgroundColor: t.headerBg }}>
          <div className="flex items-center gap-1">
            <button onClick={() => setShowSidebar(true)} className="md:hidden rounded-lg p-2" style={{ color: t.textSecondary }}><Menu size={16} /></button>
            {[{ id: "chat", label: "Obrolan" }, { id: "telemetry", label: "Telemetry" }].map((view) => (
              <button key={view.id} onClick={() => setActiveView(view.id)} className="rounded-lg px-3 py-1.5 text-[12px] font-medium transition-all" style={{ backgroundColor: activeView === view.id ? t.accentSoft : "transparent", border: `1px solid ${activeView === view.id ? t.accent + "60" : "transparent"}`, color: activeView === view.id ? t.textPrimary : t.textSecondary }}>
                {view.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <div className="hidden lg:flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px]" style={{ border: `1px solid ${t.headerBorder}`, color: t.textSecondary }}>
              <span>{batteryStatus.emoji}</span>
              <span>{batteryStatus.label}</span>
            </div>
            <button onClick={handleExportChat} title="Export" className="hidden sm:flex rounded-lg p-2" style={{ color: t.textSecondary }} onMouseEnter={(e) => e.currentTarget.style.color = t.accent} onMouseLeave={(e) => e.currentTarget.style.color = t.textSecondary}><Download size={14} /></button>
            <button onClick={toggleGender} className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-all" style={{ backgroundColor: t.accentSoft, border: `1px solid ${t.accent}40`, color: t.accent }} title={gender === "male" ? "Ganti ke cewek" : "Ganti ke cowok"}>
              <span style={{ fontSize: 12 }}>{gender === "male" ? "♂" : "♀"}</span>
              <span className="hidden sm:inline">{gender === "male" ? "Cowok" : "Cewek"}</span>
            </button>
            <button onClick={() => setShowModePicker(true)} className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-[12px] font-medium transition-all" style={{ backgroundColor: t.warmSoft, border: `1px solid ${t.warm}60`, color: t.textPrimary }}>
              <ModeIcon size={12} style={{ color: t.warm }} />
              <span className="hidden sm:inline">{currentModeData.label}</span>
              <ChevronDown size={11} style={{ color: t.textMuted }} />
            </button>
            <button onClick={toggleDarkMode} className="rounded-lg p-2" style={{ color: t.textSecondary }} onMouseEnter={(e) => e.currentTarget.style.color = t.accent} onMouseLeave={(e) => e.currentTarget.style.color = t.textSecondary} title="Toggle theme">{darkMode ? <Sun size={14} /> : <Moon size={14} />}</button>
            <button onClick={() => setShowSettingsModal(true)} className="rounded-lg p-2" style={{ color: t.textSecondary }} onMouseEnter={(e) => e.currentTarget.style.color = t.accent} onMouseLeave={(e) => e.currentTarget.style.color = t.textSecondary}><Settings size={14} /></button>
          </div>
        </header>

        {currentMode === "CURHAT" && curhatCategory && (
          <div className="px-6 py-2 flex items-center justify-between z-20" style={{ borderBottom: `1px solid ${t.headerBorder}`, backgroundColor: t.modalBg }}>
            <div className="flex items-center gap-2 text-[11px]">
              <span style={{ color: t.textMuted }}>Curhat</span>
              <span style={{ color: t.textMuted }}>·</span>
              <span style={{ color: currentCategoryData.accent, fontWeight: 500 }}>{currentCategoryData.label}</span>
            </div>
            <button onClick={() => setShowCurhatPicker(true)} className="text-[10px]" style={{ color: t.textMuted }}>Ganti</button>
          </div>
        )}

        {currentMode === "SCRIPT_GEN" && scriptCategory && (
          <div className="px-6 py-2 flex items-center justify-between z-20" style={{ borderBottom: `1px solid ${t.headerBorder}`, backgroundColor: t.modalBg }}>
            <div className="flex items-center gap-2 text-[11px]">
              <span style={{ color: t.textMuted }}>Script</span>
              <span style={{ color: t.textMuted }}>·</span>
              <span style={{ color: currentScriptData.accent, fontWeight: 500 }}>{currentScriptData.label}</span>
            </div>
            <button onClick={() => setShowScriptPicker(true)} className="text-[10px]" style={{ color: t.textMuted }}>Ganti</button>
          </div>
        )}

        {activeView === "chat" ? (
          <div className="flex flex-1 flex-col overflow-hidden relative">
            <div className="flex-1 overflow-y-auto px-4 md:px-10 py-8 relative">
              <div className="max-w-3xl mx-auto w-full space-y-5">
                {activeSession.messages.map((msg) => (
                  <MessageBubble key={msg.id} message={msg} onCopy={copyToClipboard} darkMode={darkMode} />
                ))}
                {isTyping && <TypingIndicator phrase={typingPhrase || "Sabar lagi ngetik..."} darkMode={darkMode} />}
                <div ref={messagesEndRef} />
              </div>

              {activeSession.messages.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <div ref={emptyCharRef} style={{ width: 160, height: 160, margin: "0 auto", animation: "float 4s ease-in-out infinite" }}>
                      <AnimeCharacter gender={gender} size={160} darkMode={darkMode} trackingElement={emptyCharRef} />
                    </div>
                    <div className="text-sm font-medium mt-4 mb-1" style={{ color: t.textSecondary }}>
                      {gender === "female" ? `Hai, aku siap dengerin kamu ✨` : `Halo, gue siap bantu lu 🔥`}
                    </div>
                    <div className="text-[11px]" style={{ color: t.textMuted }}>Ketik pesan di bawah untuk mulai</div>
                  </div>
                </div>
              )}
            </div>

            {attachedFiles.length > 0 && (
              <div className="px-6 py-2 flex flex-wrap gap-2 z-20" style={{ borderTop: `1px solid ${t.headerBorder}` }}>
                {attachedFiles.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-md px-2.5 py-1 text-[10px]" style={{ backgroundColor: t.modalBg, border: `1px solid ${t.headerBorder}`, color: t.textSecondary }}>
                    <FileText size={10} />
                    <span>{f.name}</span>
                    <button onClick={() => removeAttachedFile(i)} style={{ color: t.textMuted }}><X size={10} /></button>
                  </div>
                ))}
              </div>
            )}

            <div className="p-4 md:p-5 z-20" style={{ borderTop: `1px solid ${t.headerBorder}`, backgroundColor: t.appBg }}>
              <div className="max-w-3xl mx-auto flex items-end gap-2">
                <input ref={fileInputRef} type="file" accept=".txt,.md,.json,.csv,.log,.js,.jsx,.ts,.tsx,.py,.html,.css" multiple onChange={handleFileImport} className="hidden" />
                <button onClick={() => fileInputRef.current?.click()} className="rounded-lg p-2.5" style={{ color: t.textSecondary }} onMouseEnter={(e) => e.currentTarget.style.color = t.warm} onMouseLeave={(e) => e.currentTarget.style.color = t.textSecondary} title="Import file"><Paperclip size={15} /></button>

                <div className="relative flex-1">
                  <textarea
                    ref={chatInputRef}
                    value={inputQuery}
                    onChange={(e) => setInputQuery(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                    placeholder={
                      currentMode === "TEBAK_BATRE" ? 'Coba: "tebak batre gw berapa"'
                      : currentMode === "SYSTEM_INFO" ? 'Coba: "spek device gw"'
                      : currentMode === "NETWORK" ? 'Coba: "koneksi gw gimana"'
                      : currentMode === "CURHAT" ? curhatCategory ? (gender === "female" ? "Cerita aja ke aku..." : "Cerita aja...") : "Pilih kategori curhat dulu..."
                      : currentMode === "SCRIPT_GEN" ? scriptCategory ? "Mau script tentang apa?" : "Pilih kategori script dulu..."
                      : currentMode === "IMAGE_GEN" ? 'Deskripsiin gambar...'
                      : (gender === "female" ? "Tulis pesan kamu..." : "Tulis pesan lu...")
                    }
                    rows={1}
                    className="w-full resize-none rounded-xl pl-4 pr-12 py-3 text-sm focus:outline-none"
                    style={{ backgroundColor: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.textPrimary }}
                    onFocus={(e) => { e.target.style.borderColor = t.accent; }}
                    onBlur={(e) => { e.target.style.borderColor = t.inputBorder; }}
                  />
                  <button onClick={() => handleSendMessage()} disabled={isTyping} className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg p-2 transition-all disabled:opacity-30" style={{ backgroundColor: t.accent, color: "#16121F" }}>
                    <Send size={13} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 md:p-10">
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="flex items-end justify-between pb-4" style={{ borderBottom: `1px solid ${t.headerBorder}` }}>
                <div>
                  <h2 className="text-2xl font-semibold" style={{ color: t.textPrimary, letterSpacing: "-0.02em" }}>Telemetry</h2>
                  <p className="text-[11px] mt-1" style={{ color: t.textMuted }}>Data real-time device kamu</p>
                </div>
                <button onClick={refreshMirrorData} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-medium" style={{ border: `1px solid ${t.headerBorder}`, color: t.textSecondary }}><RefreshCw size={11} /> Refresh</button>
              </div>

              {liveMirrorData ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {[
                    { title: "Baterai", icon: Battery, content: liveMirrorData.battery?.available ? (<><div>Level: <b>{liveMirrorData.battery.data.level}%</b></div><div>Status: <b>{liveMirrorData.battery.data.charging ? "Mengisi" : "Baterai"}</b></div></>) : (<div style={{ color: t.textMuted }}>{liveMirrorData.battery?.reason || "Tidak tersedia"}</div>) },
                    { title: "Perangkat", icon: Cpu, content: (<><div>Cores: <b>{liveMirrorData.system?.data?.logicalCores}</b></div><div>RAM: <b>{liveMirrorData.system?.data?.deviceMemoryGB}</b></div><div>Layar: <b>{liveMirrorData.system?.data?.screenWidth}×{liveMirrorData.system?.data?.screenHeight}</b></div></>) },
                    { title: "Jaringan", icon: Wifi, content: (<><div>Online: <b>{liveMirrorData.network?.data?.online ? "Ya" : "Tidak"}</b></div><div>Tipe: <b>{liveMirrorData.network?.data?.effectiveType}</b></div><div>Downlink: <b>{liveMirrorData.network?.data?.downlinkMbps}</b></div></>) },
                    { title: "Statistik", icon: Sparkles, content: (<><div>Total Sesi: <b>{totalStats.totalSessions}</b></div><div>Total Pesan: <b>{totalStats.totalMessages}</b></div></>) }
                  ].map((card, i) => {
                    const Icon = card.icon;
                    return (
                      <div key={i} className="rounded-xl p-4" style={{ backgroundColor: t.modalBg, border: `1px solid ${t.headerBorder}` }}>
                        <div className="flex items-center gap-2 mb-2.5">
                          <Icon size={12} style={{ color: t.accent }} />
                          <span className="text-[11px] font-medium uppercase tracking-wider" style={{ color: t.textSecondary }}>{card.title}</span>
                        </div>
                        <div className="text-[12px] space-y-1 leading-relaxed">{card.content}</div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-xs" style={{ color: t.textMuted }}>Memuat data...</div>
              )}
            </div>
          </div>
        )}
      </main>

      {showSettingsModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ backgroundColor: t.modalOverlay }}>
          <div className="w-full max-w-md rounded-2xl p-6 space-y-5 animate-[popIn_200ms_ease-out]" style={{ backgroundColor: t.modalBg, border: `1px solid ${t.modalBorder}` }}>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold" style={{ color: t.textPrimary }}>Pengaturan</h3>
              <button onClick={() => setShowSettingsModal(false)} className="rounded-lg p-1.5" style={{ color: t.textSecondary }}><X size={14} /></button>
            </div>

            <div className="flex items-center justify-between rounded-xl p-3" style={{ border: `1px solid ${t.modalBorder}` }}>
              <div>
                <div className="text-[11px] font-medium" style={{ color: t.textPrimary }}>Karakter AI</div>
                <div className="text-[10px] mt-0.5" style={{ color: t.textMuted }}>Ganti persona cowok/cewek</div>
              </div>
              <button onClick={toggleGender} className="rounded-lg px-3 py-1.5 text-[11px] font-medium transition-all" style={{ backgroundColor: t.accentSoft, border: `1px solid ${t.accent}60`, color: t.accent }}>
                {gender === "male" ? "♂ Cowok" : "♀ Cewek"}
              </button>
            </div>

            <div className="rounded-xl p-3" style={{ border: `1px solid ${t.modalBorder}`, backgroundColor: t.accentSoft }}>
              <div className="text-[11px] font-medium" style={{ color: t.textPrimary }}>Auto Follow-up Aktif</div>
              <div className="text-[10px] mt-1 leading-relaxed" style={{ color: t.textSecondary }}>
                Kalau kamu gombalin AI dan diem, dia bakal balas sendiri sampai 3x. Kalau kamu balas duluan, otomatis stop.
              </div>
            </div>

            <div className="space-y-3.5 text-[12px]">
              <div>
                <label className="block mb-1.5 font-medium" style={{ color: t.textSecondary }}>Nama</label>
                <input type="text" value={profile.name} onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))} className="w-full rounded-lg px-3 py-2 focus:outline-none" style={{ backgroundColor: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.textPrimary }} />
              </div>
              <div>
                <label className="block mb-1.5 font-medium" style={{ color: t.textSecondary }}>Kota</label>
                <input type="text" value={profile.preferences?.city || ""} onChange={(e) => setProfile((p) => ({ ...p, preferences: { ...p.preferences, city: e.target.value } }))} className="w-full rounded-lg px-3 py-2 focus:outline-none" style={{ backgroundColor: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.textPrimary }} />
              </div>
              <div className="flex items-center justify-between rounded-lg p-3" style={{ border: `1px solid ${t.modalBorder}` }}>
                <span className="font-medium" style={{ color: t.textSecondary }}>Dark Mode</span>
                <button onClick={toggleDarkMode} className="rounded-md px-3 py-1 text-[11px] font-medium" style={{ backgroundColor: darkMode ? t.accent : "transparent", color: darkMode ? "#16121F" : t.textSecondary, border: `1px solid ${darkMode ? t.accent : t.modalBorder}` }}>{darkMode ? "ON" : "OFF"}</button>
              </div>
              <div className="rounded-lg p-3 text-[11px] leading-loose" style={{ border: `1px solid ${t.modalBorder}`, color: t.textSecondary }}>
                <b style={{ color: t.textPrimary }}>Shortcut</b><br />
                Ctrl+K — Mode<br />
                Ctrl+F — Cari<br />
                Esc — Tutup
              </div>
            </div>
            <button onClick={() => { setShowSettingsModal(false); triggerToast("Disimpan"); }} className="w-full rounded-lg py-2.5 text-[12px] font-medium" style={{ backgroundColor: t.accent, color: "#16121F" }}>Simpan</button>
          </div>
        </div>
      )}
    </div>
  );
}
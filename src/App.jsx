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
const STORAGE_KEY_PROFILE = "iq_nya_loh_profile";
const STORAGE_KEY_SESSIONS = "iq_nya_loh_sessions";
const STORAGE_KEY_PINNED = "iq_nya_loh_pinned";

const GROQ_API_KEY = "";
const GROQ_MODEL = "openai/gpt-oss-120b";
const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
const IMAGE_API = "https://image.pollinations.ai/prompt";

const DEFAULT_PROFILE = {
  name: "",
  nickname: "",
  createdAt: null,
  lastSeen: null,
  preferences: { city: "", school: "", hobbies: [] }
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

/* ============ CURHAT CATEGORIES ============ */
const CURHAT_CATEGORIES = [
  { id: "ROMANCE", label: "Romance", icon: Heart, gradient: "from-pink-500/20 to-rose-500/20", border: "border-pink-500/30", text: "text-pink-400", bg: "bg-pink-500/20", description: "Masalah cinta, gebetan, putus" },
  { id: "FAMILY", label: "Keluarga", icon: Home, gradient: "from-amber-500/20 to-orange-500/20", border: "border-amber-500/30", text: "text-amber-400", bg: "bg-amber-500/20", description: "Masalah ortu, saudara" },
  { id: "FRIEND", label: "Teman", icon: Users, gradient: "from-sky-500/20 to-blue-500/20", border: "border-sky-500/30", text: "text-sky-400", bg: "bg-sky-500/20", description: "Pertemanan, circle, konflik" },
  { id: "SELF", label: "Diri Sendiri", icon: User, gradient: "from-violet-500/20 to-purple-500/20", border: "border-violet-500/30", text: "text-violet-400", bg: "bg-violet-500/20", description: "Insecure, overthinking" },
  { id: "SCHOOL", label: "Sekolah / Kuliah", icon: Sparkles, gradient: "from-emerald-500/20 to-teal-500/20", border: "border-emerald-500/30", text: "text-emerald-400", bg: "bg-emerald-500/20", description: "Tugas, nilai, dosen" },
  { id: "RANDOM", label: "Random", icon: MessageSquare, gradient: "from-slate-500/20 to-gray-500/20", border: "border-slate-500/30", text: "text-slate-300", bg: "bg-slate-500/20", description: "Curhat bebas" }
];

/* ============ SCRIPT CATEGORIES ============ */
const SCRIPT_CATEGORIES = [
  { id: "BIRTHDAY", label: "Happy Birthday", icon: Gift, gradient: "from-pink-500/20 to-yellow-500/20", border: "border-pink-500/30", text: "text-pink-400", bg: "bg-pink-500/20", description: "Ucapan ulang tahun" },
  { id: "ROMANTIC", label: "Romantis", icon: Heart, gradient: "from-rose-500/20 to-pink-500/20", border: "border-rose-500/30", text: "text-rose-400", bg: "bg-rose-500/20", description: "Puisi/pesan buat pacar" },
  { id: "ANNIVERSARY", label: "Anniversary", icon: Sparkles, gradient: "from-violet-500/20 to-fuchsia-500/20", border: "border-violet-500/30", text: "text-violet-400", bg: "bg-violet-500/20", description: "Ucapan anniversary" },
  { id: "GRADUATION", label: "Wisuda", icon: FileText, gradient: "from-emerald-500/20 to-teal-500/20", border: "border-emerald-500/30", text: "text-emerald-400", bg: "bg-emerald-500/20", description: "Ucapan wisuda/kelulusan" },
  { id: "APOLOGY", label: "Minta Maaf", icon: MessageSquare, gradient: "from-sky-500/20 to-blue-500/20", border: "border-sky-500/30", text: "text-sky-400", bg: "bg-sky-500/20", description: "Pesan minta maaf" },
  { id: "CUSTOM", label: "Custom", icon: Code, gradient: "from-slate-500/20 to-gray-500/20", border: "border-slate-500/30", text: "text-slate-300", bg: "bg-slate-500/20", description: "Script apapun, bebas" }
];

/* ============ MOOD ============ */
const MOOD_KEYWORDS = {
  SEDIH: { label: "Sedih", emoji: "😢", color: "text-blue-400" },
  SENANG: { label: "Senang", emoji: "😊", color: "text-yellow-400" },
  MARAH: { label: "Marah", emoji: "😠", color: "text-red-400" },
  CEMAS: { label: "Cemas", emoji: "😰", color: "text-purple-400" },
  NETRAL: { label: "Netral", emoji: "😐", color: "text-slate-400" },
  BINGUNG: { label: "Bingung", emoji: "🤔", color: "text-amber-400" },
  CINTA: { label: "Cinta", emoji: "💕", color: "text-pink-400" }
};

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

const detectMood = (text) => {
  if (!text) return "NETRAL";
  const lower = text.toLowerCase();
  if (/(sedih|nangis|galau|patah hati|kecewa|hancur|down)/.test(lower)) return "SEDIH";
  if (/(senang|bahagia|happy|seneng|syukur|alhamdulillah|mantap|keren)/.test(lower)) return "SENANG";
  if (/(marah|kesel|bete|emosi|jengkel|kesal|muak)/.test(lower)) return "MARAH";
  if (/(cemas|takut|khawatir|panik|deg-degan|overthinking|insecure)/.test(lower)) return "CEMAS";
  if (/(bingung|gak tau|ga tau|galau|ragu|dilema)/.test(lower)) return "BINGUNG";
  if (/(cinta|suka|gebetan|doi|pacar|sayang|rindu|kangen)/.test(lower)) return "CINTA";
  return "NETRAL";
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

const BUILD_SYSTEM_PROMPT = (profile, mode, curhatCategory = null, scriptCategory = null) => {
  const name = profile?.nickname || profile?.name || "User";
  let modeDirective = "";

  if (mode === "CURHAT") {
    const cat = CURHAT_CATEGORIES.find((c) => c.id === curhatCategory);
    const catLabel = cat ? cat.label : "Umum";
    modeDirective = `MODE CURHAT — Kategori: ${catLabel}.

PENTING: Fokus HANYA pada topik kategori ini. Jangan bahas topik lain dari chat sebelumnya.

Kamu adalah pendengar HANGAT, EMPATIK, TIDAK MENGHakimi:
1. Validasi perasaan user dulu.
2. Jangan langsung kasih solusi panjang. Tanya dulu.
3. Respons pendek-pendek, kayak ngobrol sama temen deket.
4. Jangan ceramah.
5. Tone: Romance (lembut & puitis), Family (bijak & sabar), Friend (santai & suportif), Self (reflektif & menenangkan), School (praktis & menyemangati), Random (fleksibel).
6. JANGAN mengarang fakta tentang tempat/institusi.`;
  }
  if (mode === "SCRIPT_GEN") {
    const cat = SCRIPT_CATEGORIES.find((c) => c.id === scriptCategory);
    const catLabel = cat ? cat.label : "Custom";
    modeDirective = `MODE SCRIPT GENERATOR — Kategori: ${catLabel}.

Tugasmu: bikin script/teks yang SIAP PAKAI.
- Langsung tulis scriptnya
- Bisa puisi, pantun, ucapan, caption, surat, atau dialog
- Sesuaikan tone dengan kategori
- Kalau user minta variasi, kasih 2-3 versi
- Bungkus dalam code block kalau perlu`;
  }
  if (mode === "IMAGE_GEN") modeDirective = `MODE IMAGE GENERATOR. Respon singkat aja.`;
  if (mode === "CHAOS") modeDirective = `MODE CHAOS. Gaya unik, energik, kadang ALL CAPS, tetap faktual.`;
  if (mode === "TEBAK_BATRE") modeDirective = `MODE TEBAK BATRE. Jawab akurat dari payload.`;
  if (mode === "SYSTEM_INFO") modeDirective = `MODE SYSTEM INFO.`;
  if (mode === "NETWORK") modeDirective = `MODE NETWORK.`;

  return `Kamu adalah IQ NYA LOH v8.0, AI assistant pribadi.

IDENTITAS:
Pengguna: ${name}
Kota: ${profile?.preferences?.city || "Tidak diketahui"}
Gaya: santai, natural, cerdas.
Bahasa: Indonesia. Pakai 'gw/lu' kalau user pakai.

ATURAN:
1. Jawab langsung.
2. Jangan mengarang konteks.
3. Jangan mulai dengan template.
4. Jangan ulang pertanyaan.

${modeDirective}`;
};

/* ============ THEME HELPER ============ */
const getTheme = (darkMode) => darkMode ? {
  bg: "bg-slate-950 text-slate-100",
  bgSoft: "bg-slate-900/40",
  bgModal: "bg-slate-900",
  border: "border-white/10",
  card: "bg-white/5 border-white/10",
  input: "bg-white/5 border-white/10 text-white placeholder-slate-500",
  textPrimary: "text-white",
  textSecondary: "text-slate-400",
  textMuted: "text-slate-500",
  hover: "hover:bg-white/5 hover:text-white",
  headerBg: "bg-slate-900/20",
  modalOverlay: "bg-black/70"
} : {
  bg: "bg-slate-50 text-slate-900",
  bgSoft: "bg-white",
  bgModal: "bg-white",
  border: "border-slate-200",
  card: "bg-white border-slate-200 shadow-sm",
  input: "bg-white border-slate-200 text-slate-900 placeholder-slate-400",
  textPrimary: "text-slate-900",
  textSecondary: "text-slate-600",
  textMuted: "text-slate-500",
  hover: "hover:bg-slate-100 hover:text-slate-900",
  headerBg: "bg-white",
  modalOverlay: "bg-black/40"
};

/* ============ UI: MESSAGE BUBBLE ============ */
function MessageBubble({ message, onCopy, darkMode }) {
  const isUser = message.sender === "user";
  const isImage = message.type === "image";

  const aiBubbleClass = darkMode
    ? "rounded-bl-md border border-white/10 bg-white/[0.04] text-slate-200"
    : "rounded-bl-md border border-slate-200 bg-slate-100 text-slate-800";

  return (
    <div className={`flex gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="mt-1 h-7 w-7 shrink-0 rounded-full bg-violet-600/30 border border-violet-500/40 flex items-center justify-center">
          <Bot size={14} className="text-violet-400" />
        </div>
      )}
      <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${isUser ? "rounded-br-md bg-violet-600 text-white" : aiBubbleClass}`}>
        {isImage ? (
          <div className="space-y-2">
            <img src={message.imageUrl} alt={message.text} className="rounded-xl max-w-full" />
            <div className="text-xs opacity-60 italic">{message.text}</div>
          </div>
        ) : (
          <div className="whitespace-pre-wrap text-sm leading-6">{message.text}</div>
        )}
        <div className="mt-2 flex items-center justify-between gap-4">
          <span className="text-[10px] opacity-40">{message.timestamp}</span>
          {!isUser && (message.text || isImage) && (
            <button onClick={() => onCopy(message.text || message.imageUrl)} className="opacity-40 transition hover:opacity-100">
              <Copy size={12} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============ UI: TYPING INDICATOR ============ */
function TypingIndicator({ phrase, darkMode }) {
  const aiBubbleClass = darkMode
    ? "border-white/10 bg-white/[0.04]"
    : "border-slate-200 bg-slate-100";

  return (
    <div className="flex gap-2.5 justify-start">
      <div className="mt-1 h-7 w-7 shrink-0 rounded-full bg-violet-600/30 border border-violet-500/40 flex items-center justify-center">
        <Bot size={14} className="text-violet-400" />
      </div>
      <div className={`rounded-2xl rounded-bl-md px-4 py-3 border ${aiBubbleClass}`}>
        <div className="flex items-center gap-2 text-xs">
          <div className="flex gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="h-1.5 w-1.5 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="h-1.5 w-1.5 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
          <span className="text-violet-500 dark:text-violet-400 font-medium italic">{phrase}</span>
        </div>
      </div>
    </div>
  );
}

/* ============ UI: MODE PICKER ============ */
function ModePickerModal({ open, onClose, currentMode, onSelect, darkMode }) {
  if (!open) return null;
  const t = getTheme(darkMode);

  return (
    <div className={`fixed inset-0 z-[80] flex items-center justify-center p-4 backdrop-blur-sm ${t.modalOverlay}`}>
      <div className={`w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden ${t.bgModal} ${t.border}`}>
        <div className={`flex items-center justify-between border-b p-5 ${t.border}`}>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-violet-600/20 p-2 text-violet-500 border border-violet-500/30">
              <Zap size={18} />
            </div>
            <div>
              <h3 className={`text-sm font-bold ${t.textPrimary}`}>Pilih Mode</h3>
              <p className={`text-[10px] mt-0.5 ${t.textMuted}`}>Ctrl+K buat buka cepat</p>
            </div>
          </div>
          <button onClick={onClose} className={`rounded-xl p-2 transition ${t.textSecondary} ${t.hover}`}>
            <X size={18} />
          </button>
        </div>
        <div className="p-3 max-h-[70vh] overflow-y-auto space-y-2">
          {AVAILABLE_MODES.map((mode) => {
            const Icon = mode.icon;
            const isActive = currentMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => onSelect(mode)}
                className={`group w-full text-left rounded-2xl border p-3.5 transition ${
                  isActive
                    ? "border-violet-500/50 bg-violet-600/20"
                    : `${t.border} ${darkMode ? "bg-white/[0.02] hover:bg-white/[0.06]" : "bg-slate-50 hover:bg-slate-100"}`
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`rounded-xl p-2 ${isActive ? "bg-violet-500/30 text-violet-500" : darkMode ? "bg-white/5 text-slate-400" : "bg-slate-200 text-slate-600"}`}>
                    <Icon size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${isActive ? (darkMode ? "text-white" : "text-violet-700") : t.textPrimary}`}>{mode.label}</span>
                      {isActive && <span className="rounded-full bg-violet-500/30 px-2 py-0.5 text-[9px] font-bold text-violet-500">AKTIF</span>}
                      {mode.hasSubmenu && <span className="rounded-full bg-pink-500/20 px-2 py-0.5 text-[9px] font-bold text-pink-500">SUBMENU</span>}
                    </div>
                    <div className={`mt-1 text-[11px] leading-relaxed ${t.textMuted}`}>{mode.description}</div>
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

/* ============ UI: SUBCATEGORY MODAL ============ */
function SubcategoryModal({ open, onClose, onSelect, selectedCategory, title, subtitle, categories, headerIcon: HeaderIcon, headerColor, darkMode }) {
  if (!open) return null;
  const t = getTheme(darkMode);

  return (
    <div className={`fixed inset-0 z-[90] flex items-center justify-center p-4 backdrop-blur-sm ${t.modalOverlay}`}>
      <div className={`w-full max-w-xl rounded-3xl border shadow-2xl overflow-hidden ${t.bgModal} ${t.border}`}>
        <div className={`relative border-b p-5 ${t.border}`}>
          <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 via-violet-500/10 to-transparent pointer-events-none" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`rounded-xl p-2 border ${headerColor || "bg-pink-500/20 text-pink-500 border-pink-500/30"}`}>
                {HeaderIcon && <HeaderIcon size={18} />}
              </div>
              <div>
                <h3 className={`text-sm font-bold ${t.textPrimary}`}>{title}</h3>
                <p className={`text-[10px] mt-0.5 ${t.textMuted}`}>{subtitle}</p>
              </div>
            </div>
            <button onClick={onClose} className={`relative rounded-xl p-2 transition ${t.textSecondary} ${t.hover}`}>
              <X size={18} />
            </button>
          </div>
        </div>
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => onSelect(cat)}
                className={`group relative overflow-hidden rounded-2xl border p-4 text-left transition ${
                  isActive ? `${cat.border} ${cat.bg}` : `${t.border} ${darkMode ? `bg-gradient-to-br ${cat.gradient} hover:border-white/20` : `bg-gradient-to-br ${cat.gradient} hover:border-slate-400`} hover:scale-[1.02]`
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`rounded-xl p-2 ${cat.bg} ${cat.text}`}>
                    <Icon size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className={`text-sm font-bold ${cat.text}`}>{cat.label}</div>
                    <div className={`mt-1 text-[11px] leading-relaxed ${t.textSecondary}`}>{cat.description}</div>
                  </div>
                  {isActive && <CheckCircle2 size={16} className={cat.text} />}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ============ APP ============ */
export default function App() {
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window === "undefined") return true;
    const saved = localStorage.getItem("iq_dark_mode");
    if (saved !== null) return saved === "true";
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? true;
  });

  const [profile, setProfile] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PROFILE);
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const [inputName, setInputName] = useState("");
  const [currentMode, setCurrentMode] = useState("NORMAL");
  const [curhatCategory, setCurhatCategory] = useState(null);
  const [scriptCategory, setScriptCategory] = useState(null);
  const [currentMood, setCurrentMood] = useState("NETRAL");

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

  const isGeneratingRef = useRef(false);
  const activeAbortControllerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const searchInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const chatInputRef = useRef(null);

  const triggerToast = useCallback((message) => {
    setToastNotice(message);
    setTimeout(() => setToastNotice(null), 2500);
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
  const moodData = MOOD_KEYWORDS[currentMood] || MOOD_KEYWORDS.NETRAL;

  const totalStats = useMemo(() => ({
    totalMessages: sessions.reduce((acc, s) => acc + s.messages.length, 0),
    totalSessions: sessions.length
  }), [sessions]);

  const t = getTheme(darkMode);

  /* ============ EFFECTS ============ */
  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("iq_dark_mode", String(darkMode));
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
    const timer = setTimeout(() => {
      chatInputRef.current?.focus();
    }, 120);
    return () => clearTimeout(timer);
  }, [activeSessionId, currentMode, curhatCategory, scriptCategory]);

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setShowModePicker(true);
      }
      if (e.key === "Escape") {
        setShowModePicker(false);
        setShowCurhatPicker(false);
        setShowScriptPicker(false);
        setShowSettingsModal(false);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
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
    const greeting = {
      id: Date.now(),
      sender: "ai",
      text: `Halo ${newProfile.nickname}! IQ NYA LOH v8.0 aktif.\n\nFitur:\n- 🎨 Buat Gambar\n- ✍️ Buat Script\n- 📎 Import File\n- 💬 Mode Curhat\n\nKlik tombol mode di header, atau tekan Ctrl+K.`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };
    setSessions([{ id: "default", title: "Obrolan Utama", messages: [greeting] }]);
    triggerToast("Profil berhasil dibuat!");
  };

  const handleCreateNewSession = () => {
    const newId = `session_${Date.now()}`;
    setSessions((prev) => [{ id: newId, title: `Obrolan ${prev.length + 1}`, messages: [] }, ...prev]);
    setActiveSessionId(newId);
    triggerToast("Sesi baru dibuat");
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
    triggerToast(pinnedSessions.includes(id) ? "Unpinned" : "Pinned!");
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    triggerToast("Teks disalin!");
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
    a.download = `iq-nya-loh-${activeSession.id}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    triggerToast("Chat diekspor!");
  };

  const handleFileImport = (e) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      if (file.size > 1024 * 1024) {
        triggerToast(`File ${file.name} terlalu besar (max 1MB)`);
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        setAttachedFiles((prev) => [...prev, {
          name: file.name,
          size: file.size,
          content: ev.target.result,
          type: file.type
        }]);
        triggerToast(`File ${file.name} siap dikirim`);
      };
      reader.readAsText(file);
    });
    e.target.value = "";
  };

  const removeAttachedFile = (idx) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const createFreshSession = (title, greetingText) => {
    const newId = `session_${Date.now()}`;
    const newSession = {
      id: newId,
      title,
      messages: greetingText
        ? [{
            id: Date.now(),
            sender: "ai",
            text: greetingText,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          }]
        : []
    };
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newId);
  };

  const handleModeSelect = (mode) => {
    setShowModePicker(false);

    if (mode.id === "CURHAT") {
      setCurrentMode("CURHAT");
      setTimeout(() => setShowCurhatPicker(true), 150);
      return;
    }

    if (mode.id === "SCRIPT_GEN") {
      setCurrentMode("SCRIPT_GEN");
      setTimeout(() => setShowScriptPicker(true), 150);
      return;
    }

    setCurrentMode(mode.id);
    setCurhatCategory(null);
    setScriptCategory(null);
    createFreshSession(`Mode: ${mode.label}`, `Mode **${mode.label}** aktif. Silakan mulai.`);

    triggerToast(`Mode ${mode.label} — obrolan baru`);
  };

  const handleCurhatCategorySelect = (cat) => {
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
        text: `Oke, kita mulai dari awal ya. Gue siap dengerin lu curhat soal **${cat.label}**.\n\nSantai aja, gak ada yang nge-judge di sini. Cerita aja.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      }]
    };
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newId);

    triggerToast(`Mode Curhat — ${cat.label} — obrolan baru`);
  };

  const handleScriptCategorySelect = (cat) => {
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
        text: `Mode **Script — ${cat.label}** aktif.\n\nMau bikin script tentang apa? Contoh: "buatkan ucapan ulang tahun buat sahabat gw"`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      }]
    };
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newId);

    triggerToast(`Mode Script — ${cat.label} — obrolan baru`);
  };

  const generateImage = async (prompt) => {
    const encoded = encodeURIComponent(prompt);
    const seed = Math.floor(Math.random() * 1000000);
    return `${IMAGE_API}/${encoded}?width=768&height=768&seed=${seed}&nologo=true`;
  };

  const handleSendMessage = async (overrideText = null) => {
    const messageText = (overrideText || inputQuery).trim();
    if (!messageText && attachedFiles.length === 0) return;
    if (isGeneratingRef.current) return;

    if (currentMode === "CURHAT" && !curhatCategory) {
      setShowCurhatPicker(true);
      return;
    }

    if (currentMode === "SCRIPT_GEN" && !scriptCategory) {
      setShowScriptPicker(true);
      return;
    }

    if (activeAbortControllerRef.current) activeAbortControllerRef.current.abort();
    const abortController = new AbortController();
    activeAbortControllerRef.current = abortController;
    isGeneratingRef.current = true;

    if (!overrideText) setInputQuery("");

    const detectedMood = detectMood(messageText);
    if (detectedMood !== "NETRAL") setCurrentMood(detectedMood);

    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    let fullMessage = messageText;
    if (attachedFiles.length > 0) {
      const fileContents = attachedFiles.map((f) => `\n\n[FILE: ${f.name}]\n${f.content}`).join("");
      fullMessage = messageText + fileContents;
    }

    const userMessage = {
      id: Date.now(),
      sender: "user",
      text: messageText + (attachedFiles.length ? `\n\n📎 ${attachedFiles.length} file` : ""),
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

    // Telemetry
    if (["TEBAK_BATRE", "SYSTEM_INFO", "NETWORK"].includes(currentMode)) {
      try {
        setIsTyping(true);
        setTypingPhrase("Ambil data real dari device...");
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
          setTimeout(() => chatInputRef.current?.focus(), 80);
          return;
        }
      } catch (err) {
        console.error("Telemetry error:", err);
      }
    }

    // IMAGE GEN
    if (currentMode === "IMAGE_GEN") {
      setIsTyping(true);
      setTypingPhrase("Lagi bikin gambar...");
      updateAiText("🎨 Lagi bikin gambar... bentar ya...");
      await new Promise((r) => setTimeout(r, 800));
      const imageUrl = await generateImage(messageText);
      updateAiImage(imageUrl, messageText);
      isGeneratingRef.current = false;
      setIsTyping(false);
      activeAbortControllerRef.current = null;
      setTimeout(() => chatInputRef.current?.focus(), 80);
      return;
    }

    // LLM
    const systemPrompt = BUILD_SYSTEM_PROMPT(profile, currentMode, curhatCategory, scriptCategory);

    const relevantHistory = ["CURHAT", "SCRIPT_GEN"].includes(currentMode)
      ? historyForApi.slice(-6)
      : historyForApi;

    const apiMessages = [
      { role: "system", content: systemPrompt },
      ...relevantHistory
        .filter((m) => m.text && m.text.trim() && m.text !== "...")
        .map((m) => ({
          role: m.sender === "user" ? "user" : "assistant",
          content: m.text
        }))
    ];

    setIsTyping(true);
    setTypingPhrase(getRandomTypingPhrase());

    await callGroqAI({
      messages: apiMessages,
      signal: abortController.signal,
      onChunk: (acc) => updateAiText(acc),
      onComplete: (finalText) => {
        isGeneratingRef.current = false;
        setIsTyping(false);
        activeAbortControllerRef.current = null;
        if (!finalText) updateAiText("(Tidak ada respon.)");
        setTimeout(() => chatInputRef.current?.focus(), 80);
      },
      onError: (err) => {
        isGeneratingRef.current = false;
        setIsTyping(false);
        activeAbortControllerRef.current = null;
        updateAiText(`[Error]: ${err.message || "Gagal memproses pesan."}`);
        setTimeout(() => chatInputRef.current?.focus(), 80);
      }
    });
  };

  /* ============ ONBOARDING ============ */
  if (!profile) {
    return (
      <div className={`flex min-h-screen items-center justify-center px-4 ${t.bg}`}>
        <div className={`w-full max-w-md rounded-3xl border p-8 shadow-2xl backdrop-blur-xl ${t.bgModal} ${t.border}`}>
          <div className="mb-6 flex justify-center">
            <div className="rounded-2xl bg-violet-600/20 p-4 text-violet-500 border border-violet-500/30">
              <Bot size={40} />
            </div>
          </div>
          <h1 className={`text-center text-2xl font-black tracking-tight ${t.textPrimary}`}>
            IQ NYA LOH <span className="text-violet-500">v8.0</span>
          </h1>
          <p className={`mt-2 text-center text-sm ${t.textSecondary}`}>AI Assistant Pribadi Realtime</p>
          <div className="mt-8 space-y-4">
            <div>
              <label className={`block text-xs font-semibold uppercase ${t.textSecondary}`}>Nama Pengguna</label>
              <input
                type="text"
                value={inputName}
                onChange={(e) => setInputName(e.target.value)}
                placeholder="Masukkan nama Anda..."
                className={`mt-2 w-full rounded-2xl border px-4 py-3 text-sm focus:border-violet-500 focus:outline-none ${t.input}`}
                onKeyDown={(e) => e.key === "Enter" && handleSaveProfile()}
              />
            </div>
            <button onClick={handleSaveProfile} className="w-full rounded-2xl bg-violet-600 py-3.5 text-sm font-bold text-white transition hover:bg-violet-500">
              Mulai Aplikasi
            </button>
          </div>
        </div>
      </div>
    );
  }

  const ModeIcon = currentModeData.icon;

  /* ============ RENDER ============ */
  return (
    <div className={`flex h-screen w-full overflow-hidden font-sans ${t.bg}`}>
      {toastNotice && (
        <div className={`fixed bottom-20 left-1/2 z-[100] -translate-x-1/2 rounded-full border px-4 py-2 text-xs font-semibold shadow-2xl backdrop-blur-md ${t.bgModal} ${t.border} ${t.textPrimary}`}>
          {toastNotice}
        </div>
      )}

      <ModePickerModal open={showModePicker} onClose={() => setShowModePicker(false)} currentMode={currentMode} onSelect={handleModeSelect} darkMode={darkMode} />
      <SubcategoryModal
        open={showCurhatPicker}
        onClose={() => setShowCurhatPicker(false)}
        onSelect={handleCurhatCategorySelect}
        selectedCategory={curhatCategory}
        title="Mau curhat tentang apa?"
        subtitle="Pilih kategori — chat baru bakal dimulai"
        categories={CURHAT_CATEGORIES}
        headerIcon={Heart}
        headerColor="bg-pink-500/20 text-pink-500 border-pink-500/30"
        darkMode={darkMode}
      />
      <SubcategoryModal
        open={showScriptPicker}
        onClose={() => setShowScriptPicker(false)}
        onSelect={handleScriptCategorySelect}
        selectedCategory={scriptCategory}
        title="Mau bikin script apa?"
        subtitle="Pilih kategori script"
        categories={SCRIPT_CATEGORIES}
        headerIcon={Code}
        headerColor="bg-violet-500/20 text-violet-500 border-violet-500/30"
        darkMode={darkMode}
      />

      {/* SIDEBAR */}
      <aside className={`hidden md:flex w-64 flex-col border-r backdrop-blur-xl ${t.bgSoft} ${t.border}`}>
        <div className={`p-4 border-b flex items-center justify-between ${t.border}`}>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-violet-600/20 p-2 text-violet-500 border border-violet-500/30">
              <Bot size={20} />
            </div>
            <div>
              <div className={`text-sm font-bold ${t.textPrimary}`}>IQ NYA LOH</div>
              <div className="text-[10px] text-violet-500 font-mono">v8.0 • {totalStats.totalMessages} pesan</div>
            </div>
          </div>
          <button onClick={() => setDarkMode(!darkMode)} className={`${t.textSecondary} hover:text-violet-500 transition`}>
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>

        <div className="p-3">
          <button onClick={handleCreateNewSession} className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600/20 border border-violet-500/30 px-4 py-2.5 text-xs font-bold text-violet-500 transition hover:bg-violet-600/30">
            <Plus size={16} /> OBROLAN BARU
          </button>
        </div>

        <div className="px-3 pb-2">
          <div className="relative">
            <Search className={`absolute left-3 top-2.5 ${t.textMuted}`} size={14} />
            <input
              ref={searchInputRef}
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Cari... (Ctrl+F)"
              className={`w-full rounded-xl border pl-9 pr-3 py-2 text-xs focus:outline-none ${t.input}`}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 space-y-1">
          {filteredSessions.map((session) => {
            const isPinned = pinnedSessions.includes(session.id);
            const isActive = activeSessionId === session.id;
            return (
              <div
                key={session.id}
                onClick={() => setActiveSessionId(session.id)}
                className={`group flex items-center justify-between rounded-xl px-3 py-2.5 text-xs transition cursor-pointer ${
                  isActive ? "bg-violet-600 text-white font-medium" : `${t.textSecondary} ${t.hover}`
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  {isPinned ? <Pin size={12} className="text-amber-500" /> : <MessageSquare size={14} />}
                  <span className="truncate">{session.title}</span>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                  <button onClick={(e) => handleTogglePin(session.id, e)} className="hover:text-amber-500">
                    {isPinned ? <PinOff size={12} /> : <Pin size={12} />}
                  </button>
                  <button onClick={(e) => handleDeleteSession(session.id, e)} className="hover:text-red-500">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {liveMirrorData?.battery?.available && (
          <div className={`p-3 border-t ${t.border}`}>
            <div className={`rounded-xl border p-3 ${t.card}`}>
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-emerald-500">
                {liveMirrorData.battery.data.charging ? <BatteryCharging size={12} /> : <Battery size={12} />}
                Live Battery
              </div>
              <div className="mt-2 flex items-end justify-between">
                <div className={`text-2xl font-black ${t.textPrimary}`}>{liveMirrorData.battery.data.level}%</div>
                <div className={`text-[10px] ${t.textMuted}`}>
                  {liveMirrorData.battery.data.charging ? "Mengisi..." : "Baterai"}
                </div>
              </div>
              <div className={`mt-2 h-1.5 w-full overflow-hidden rounded-full ${darkMode ? "bg-white/10" : "bg-slate-200"}`}>
                <div
                  className={`h-full transition-all duration-500 ${liveMirrorData.battery.data.charging ? "bg-emerald-500" : "bg-violet-500"}`}
                  style={{ width: `${liveMirrorData.battery.data.level}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* MAIN */}
      <main className={`flex flex-1 flex-col h-full relative ${t.bg}`}>
        <header className={`flex h-16 items-center justify-between border-b px-4 md:px-6 backdrop-blur-xl ${t.border} ${t.headerBg}`}>
          <div className="flex items-center gap-2">
            <button onClick={() => setActiveView("chat")} className={`rounded-xl px-3 md:px-4 py-2 text-xs font-bold transition ${activeView === "chat" ? "bg-violet-600 text-white" : `${t.textSecondary} hover:text-violet-500`}`}>Obrolan</button>
            <button onClick={() => setActiveView("telemetry")} className={`rounded-xl px-3 md:px-4 py-2 text-xs font-bold transition ${activeView === "telemetry" ? "bg-violet-600 text-white" : `${t.textSecondary} hover:text-violet-500`}`}>Telemetry</button>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <div className={`hidden sm:flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-[10px] font-semibold ${t.card}`}>
              <span>{moodData.emoji}</span>
              <span className={moodData.color}>{moodData.label}</span>
            </div>

            <button onClick={handleExportChat} title="Export" className={`hidden sm:flex rounded-xl border p-2 transition ${t.card} ${t.hover}`}>
              <Download size={16} />
            </button>

            <button
              onClick={() => setShowModePicker(true)}
              className={`group flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition hover:border-violet-500/40 ${t.card}`}
            >
              <ModeIcon size={14} className="text-violet-500" />
              <span className={`hidden sm:inline ${t.textPrimary}`}>
                {currentModeData.label}
                {curhatCategory && currentMode === "CURHAT" && <span className={t.textMuted}> • {currentCategoryData?.label}</span>}
                {scriptCategory && currentMode === "SCRIPT_GEN" && <span className={t.textMuted}> • {currentScriptData?.label}</span>}
              </span>
              <ChevronDown size={14} className={t.textMuted} />
            </button>

            <button onClick={() => setShowSettingsModal(true)} className={`rounded-xl border p-2 transition ${t.card} ${t.hover}`}>
              <Settings size={16} />
            </button>
          </div>
        </header>

        {/* Banner Curhat */}
        {currentMode === "CURHAT" && curhatCategory && (
          <div className={`border-b ${currentCategoryData.border} bg-gradient-to-r ${currentCategoryData.gradient} px-6 py-2 flex items-center justify-between`}>
            <div className="flex items-center gap-2 text-xs">
              {currentCategoryData.icon && <currentCategoryData.icon size={14} className={currentCategoryData.text} />}
              <span className={t.textSecondary}>Mode Curhat:</span>
              <span className={`font-bold ${currentCategoryData.text}`}>{currentCategoryData.label}</span>
            </div>
            <button onClick={() => setShowCurhatPicker(true)} className={`text-[10px] hover:text-violet-500 transition ${t.textMuted}`}>
              Ganti kategori (reset chat)
            </button>
          </div>
        )}

        {/* Banner Script */}
        {currentMode === "SCRIPT_GEN" && scriptCategory && (
          <div className={`border-b ${currentScriptData.border} bg-gradient-to-r ${currentScriptData.gradient} px-6 py-2 flex items-center justify-between`}>
            <div className="flex items-center gap-2 text-xs">
              {currentScriptData.icon && <currentScriptData.icon size={14} className={currentScriptData.text} />}
              <span className={t.textSecondary}>Mode Script:</span>
              <span className={`font-bold ${currentScriptData.text}`}>{currentScriptData.label}</span>
            </div>
            <button onClick={() => setShowScriptPicker(true)} className={`text-[10px] hover:text-violet-500 transition ${t.textMuted}`}>
              Ganti kategori
            </button>
          </div>
        )}

        {activeView === "chat" ? (
          <div className="flex flex-1 flex-col h-[calc(100vh-4rem)]">
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {activeSession.messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} onCopy={copyToClipboard} darkMode={darkMode} />
              ))}
              {isTyping && <TypingIndicator phrase={typingPhrase || "Sabar lagi ngetik..."} darkMode={darkMode} />}
              <div ref={messagesEndRef} />
            </div>

            {attachedFiles.length > 0 && (
              <div className={`px-4 py-2 border-t flex flex-wrap gap-2 ${t.border}`}>
                {attachedFiles.map((f, i) => (
                  <div key={i} className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-[10px] ${t.card}`}>
                    <FileText size={12} className="text-violet-500" />
                    <span className={t.textPrimary}>{f.name}</span>
                    <span className={t.textMuted}>({(f.size / 1024).toFixed(1)}KB)</span>
                    <button onClick={() => removeAttachedFile(i)} className="hover:text-red-500">
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className={`p-4 border-t backdrop-blur-md ${t.border} ${t.bgSoft}`}>
              <div className="max-w-4xl mx-auto relative flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.md,.json,.csv,.log,.js,.jsx,.ts,.tsx,.py,.html,.css"
                  multiple
                  onChange={handleFileImport}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className={`rounded-xl border p-2.5 transition ${t.card} ${t.hover}`}
                  title="Import file"
                >
                  <Paperclip size={16} />
                </button>

                <div className="relative flex-1">
                  <textarea
                    ref={chatInputRef}
                    value={inputQuery}
                    onChange={(e) => setInputQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder={
                      currentMode === "TEBAK_BATRE" ? 'Coba: "tebak batre gw berapa"'
                      : currentMode === "SYSTEM_INFO" ? 'Coba: "spek device gw"'
                      : currentMode === "NETWORK" ? 'Coba: "koneksi gw gimana"'
                      : currentMode === "CURHAT" ? curhatCategory ? "Cerita aja..." : "Pilih kategori curhat dulu..."
                      : currentMode === "SCRIPT_GEN" ? scriptCategory ? "Mau script tentang apa?" : "Pilih kategori script dulu..."
                      : currentMode === "IMAGE_GEN" ? 'Deskripsiin gambar, contoh: "kucing lucu pake topi"'
                      : "Tulis pesan..."
                    }
                    rows={1}
                    className={`w-full resize-none rounded-2xl border pl-4 pr-12 py-3.5 text-sm focus:border-violet-500 focus:outline-none ${t.input}`}
                  />
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={isTyping}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl bg-violet-600 p-2.5 text-white transition hover:bg-violet-500 disabled:opacity-50"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <h2 className={`text-lg font-bold ${t.textPrimary}`}>Telemetry Live Mirror</h2>
                <button onClick={refreshMirrorData} className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${t.card} ${t.hover}`}>
                  <RefreshCw size={14} /> Refresh
                </button>
              </div>

              {liveMirrorData ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className={`rounded-2xl border p-4 space-y-3 ${t.card}`}>
                    <div className="flex items-center gap-2 text-violet-500 font-bold text-xs uppercase">
                      <Battery size={16} /> Baterai
                    </div>
                    {liveMirrorData.battery?.available ? (
                      <div className={`text-xs space-y-1 ${t.textPrimary}`}>
                        <div>Level: <b>{liveMirrorData.battery.data.level}%</b></div>
                        <div>Status: <b>{liveMirrorData.battery.data.charging ? "Mengisi ⚡" : "Baterai 🔋"}</b></div>
                      </div>
                    ) : (
                      <div className={`text-xs ${t.textMuted}`}>{liveMirrorData.battery?.reason || "Tidak tersedia"}</div>
                    )}
                  </div>

                  <div className={`rounded-2xl border p-4 space-y-3 ${t.card}`}>
                    <div className="flex items-center gap-2 text-violet-500 font-bold text-xs uppercase">
                      <Cpu size={16} /> Perangkat
                    </div>
                    <div className={`text-xs space-y-1 ${t.textPrimary}`}>
                      <div>Cores: {liveMirrorData.system?.data?.logicalCores}</div>
                      <div>RAM: {liveMirrorData.system?.data?.deviceMemoryGB}</div>
                      <div>Layar: {liveMirrorData.system?.data?.screenWidth}x{liveMirrorData.system?.data?.screenHeight}</div>
                    </div>
                  </div>

                  <div className={`rounded-2xl border p-4 space-y-3 ${t.card}`}>
                    <div className="flex items-center gap-2 text-violet-500 font-bold text-xs uppercase">
                      <Wifi size={16} /> Jaringan
                    </div>
                    <div className={`text-xs space-y-1 ${t.textPrimary}`}>
                      <div>Online: {liveMirrorData.network?.data?.online ? "Ya" : "Tidak"}</div>
                      <div>Tipe: {liveMirrorData.network?.data?.effectiveType}</div>
                      <div>Downlink: {liveMirrorData.network?.data?.downlinkMbps}</div>
                      <div>RTT: {liveMirrorData.network?.data?.rttMs}</div>
                    </div>
                  </div>

                  <div className={`rounded-2xl border p-4 space-y-3 ${t.card}`}>
                    <div className="flex items-center gap-2 text-violet-500 font-bold text-xs uppercase">
                      <Sparkles size={16} /> Statistik
                    </div>
                    <div className={`text-xs space-y-1 ${t.textPrimary}`}>
                      <div>Total Sesi: <b>{totalStats.totalSessions}</b></div>
                      <div>Total Pesan: <b>{totalStats.totalMessages}</b></div>
                      <div>Mood: <b>{moodData.emoji} {moodData.label}</b></div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className={`text-xs ${t.textMuted}`}>Memuat data...</div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* SETTINGS */}
      {showSettingsModal && (
        <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm ${t.modalOverlay}`}>
          <div className={`w-full max-w-md rounded-3xl border p-6 space-y-4 ${t.bgModal} ${t.border}`}>
            <div className="flex items-center justify-between">
              <h3 className={`text-sm font-bold ${t.textPrimary}`}>Pengaturan</h3>
              <button onClick={() => setShowSettingsModal(false)} className={`${t.textMuted} hover:text-violet-500`}>
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className={`block mb-1 ${t.textSecondary}`}>Nama</label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                  className={`w-full rounded-xl border px-3 py-2 focus:outline-none ${t.input}`}
                />
              </div>
              <div>
                <label className={`block mb-1 ${t.textSecondary}`}>Kota</label>
                <input
                  type="text"
                  value={profile.preferences?.city || ""}
                  onChange={(e) => setProfile((p) => ({ ...p, preferences: { ...p.preferences, city: e.target.value } }))}
                  className={`w-full rounded-xl border px-3 py-2 focus:outline-none ${t.input}`}
                />
              </div>
              <div className={`flex items-center justify-between rounded-xl border p-3 ${t.card}`}>
                <span className={t.textSecondary}>Dark Mode</span>
                <button onClick={() => setDarkMode(!darkMode)} className={`rounded-lg px-3 py-1 text-xs font-bold transition ${darkMode ? "bg-violet-600 text-white" : "bg-slate-200 text-slate-700"}`}>
                  {darkMode ? "ON" : "OFF"}
                </button>
              </div>
              <div className={`rounded-xl border p-3 text-[10px] ${t.card} ${t.textMuted}`}>
                <b>Shortcut:</b><br />
                Ctrl+K = Mode<br />
                Ctrl+F = Cari<br />
                Esc = Tutup
              </div>
            </div>
            <button
              onClick={() => {
                setShowSettingsModal(false);
                triggerToast("Pengaturan disimpan");
              }}
              className="w-full rounded-xl bg-violet-600 py-2.5 text-xs font-bold text-white transition hover:bg-violet-500"
            >
              Simpan
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
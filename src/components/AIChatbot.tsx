import { useState, useCallback, useRef, useEffect } from "react";
import { X, Mic, MicOff, PhoneOff } from "@/components/ui/Icons";
import { Card } from "@/components/ui/card";
import { ConversationProvider, useConversation } from "@elevenlabs/react";
import { useAuth } from "@/context/AuthContext";

const HeadsetIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
    <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z" />
    <path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
  </svg>
);

const SendIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M22 2 11 13" /><path d="M22 2 15 22 11 13 2 9l20-7z" />
  </svg>
);

const _origWarn  = console.warn.bind(console);
const _origError = console.error.bind(console);
console.warn = (...a: unknown[]) => {
  if (typeof a[0] === "string" && a[0].includes("WebSocket is already in CLOSING or CLOSED")) return;
  _origWarn(...a);
};
console.error = (...a: unknown[]) => {
  if (typeof a[0] === "string" && a[0].includes("WebSocket is already in CLOSING or CLOSED")) return;
  _origError(...a);
};

const AGENT_ID = import.meta.env.VITE_ELEVENLABS_AGENT_ID as string;

// Wolof n'est pas une langue STT native d'ElevenLabs.
// On passe la langue via dynamicVariables → le prompt agent doit inclure :
// "Si {{langue}} est 'wolof', réponds exclusivement en wolof."
// Pas d'override STT : la détection auto reconnaît suffisamment bien le wolof.
const LANGUAGES = [
  { code: "fr", label: "Français", sttOverride: "fr" as const },
  { code: "en", label: "English",  sttOverride: "en" as const },
] as const;
type LangCode = (typeof LANGUAGES)[number]["code"];

const UI: Record<LangCode, {
  idle: string; speaking: string; listening: string;
  connecting: string; start: string; end: string;
  errorMic: string; placeholder: string; footer: string;
}> = {
  fr: {
    idle:        "Appuyez sur Démarrer pour parler à Monsieur NIANG.",
    speaking:    "Monsieur NIANG parle…",
    listening:   "À votre écoute…",
    connecting:  "Connexion…",
    start:       "Démarrer",
    end:         "Terminer",
    errorMic:    "Microphone inaccessible. Vérifiez les autorisations.",
    placeholder: "Écrire un message…",
    footer:      "Assistant vocal · 24h/24 · 7j/7",
  },
  en: {
    idle:        "Press Start to talk to Mr. NIANG.",
    speaking:    "Mr. NIANG is speaking…",
    listening:   "Listening…",
    connecting:  "Connecting…",
    start:       "Start",
    end:         "End call",
    errorMic:    "Microphone unavailable. Check your permissions.",
    placeholder: "Type a message…",
    footer:      "Voice assistant · Available 24/7",
  },
};

function AudioBars({ active, speaking }: { active: boolean; speaking: boolean }) {
  const bars = [3, 5, 4, 6, 3, 5, 4];
  return (
    <div className="flex items-end gap-[3px] h-6">
      {bars.map((h, i) => (
        <div
          key={i}
          className={`w-1 rounded-full transition-all duration-150 ${
            active ? (speaking ? "bg-purple-400" : "bg-blue-400") : "bg-gray-300"
          }`}
          style={{
            height: active ? `${h * 4}px` : "4px",
            animationDelay: `${i * 80}ms`,
            animation: active ? `pulse ${0.5 + i * 0.1}s ease-in-out infinite alternate` : "none",
          }}
        />
      ))}
    </div>
  );
}

function ChatWidget({
  onClose,
  lang,
  setLang,
  user,
}: {
  onClose:  () => void;
  lang:     LangCode;
  setLang:  (l: LangCode) => void;
  user:     ReturnType<typeof useAuth>["user"];
}) {
  const audioRef  = useRef<HTMLAudioElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);
  const t = UI[lang];

  const [micError,   setMicError]   = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string>("");
  const [textInput,  setTextInput]  = useState("");

  const conversation = useConversation({
    onConnect:    () => { setMicError(null); },
    onDisconnect: () => { setTranscript(""); },
    onError:      (message: string) => {
      console.error("ElevenLabs error:", message);
      setMicError(message || "Erreur de connexion au service vocal.");
    },
    onMessage: (props: { message: string; source: string }) => {
      if (props?.message) setTranscript(props.message);
    },
  });

  useEffect(() => {
    const unlock = () => { audioRef.current?.play().catch(() => {}); };
    document.addEventListener("click", unlock, { once: true });
    return () => document.removeEventListener("click", unlock);
  }, []);

  const startConversation = useCallback(async () => {
    if (!AGENT_ID) { setMicError("Agent non configuré."); return; }
    setMicError(null);
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });

      const entry = LANGUAGES.find(l => l.code === lang)!;

      const dynamicVariables: Record<string, string | number | boolean> = {
        platform: "Papy Services Assurances",
        langue: lang === "fr" ? "français" : "english",
      };
      if (user?.full_name || user?.fullName) {
        dynamicVariables.userName = user.full_name ?? user.fullName ?? "";
      }
      if (user?.role) {
        dynamicVariables.userRole = user.role;
      }

      conversation.startSession({
        agentId: AGENT_ID,
        connectionType: "websocket",
        overrides: { agent: { language: entry.sttOverride } },
        dynamicVariables,
      });
    } catch (err: any) {
      const isDenied = err?.name === "NotAllowedError" || err?.name === "PermissionDeniedError";
      setMicError(isDenied ? t.errorMic : String(err?.message ?? t.errorMic));
    }
  }, [conversation, lang, t, user]);

  const stopConversation = useCallback(() => {
    if (conversation.status === "connected" || conversation.status === "connecting") {
      try { conversation.endSession(); } catch {}
    }
  }, [conversation]);

  const sendText = useCallback(() => {
    const msg = textInput.trim();
    if (!msg || conversation.status !== "connected") return;
    conversation.sendUserMessage(msg);
    setTextInput("");
    inputRef.current?.focus();
  }, [conversation, textInput]);

  const handleClose = useCallback(() => {
    stopConversation();
    onClose();
  }, [stopConversation, onClose]);

  const isConnected  = conversation.status === "connected";
  const isConnecting = conversation.status === "connecting";
  const isSpeaking   = conversation.isSpeaking;

  const displayMessage = isConnecting
    ? t.connecting
    : isConnected
      ? transcript || (isSpeaking ? t.speaking : t.listening)
      : t.idle;

  return (
    <Card className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 w-[calc(100vw-2rem)] max-w-[340px] shadow-2xl z-50 flex flex-col overflow-hidden rounded-2xl border border-border">
      <audio ref={audioRef} src="data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=" />

      {/* En-tête */}
      <div className="bg-brand text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative w-9 h-9 bg-white/20 rounded-full flex items-center justify-center font-bold text-sm shrink-0">
            MN
            {isConnected && (
              <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white" />
            )}
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-sm leading-tight">Monsieur NIANG</h3>
            <p className="text-[10px] opacity-75 truncate">Papy Services Assurances</p>
          </div>
        </div>
        <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-white/20 transition-colors shrink-0" aria-label="Fermer">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Sélecteur de langue — masqué pendant une session */}
      {!isConnected && !isConnecting && (
        <div className="flex border-b bg-white">
          {LANGUAGES.map(l => (
            <button
              key={l.code}
              onClick={() => setLang(l.code)}
              className={`flex-1 py-2 text-xs font-medium transition-colors ${
                lang === l.code ? "bg-brand text-white" : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      )}

      {/* Zone principale */}
      <div className="flex flex-col items-center justify-center py-6 px-5 gap-4 bg-gray-50">

        {/* Cercle micro */}
        <div className="flex flex-col items-center gap-3">
          <div
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
              isConnected
                ? isSpeaking ? "bg-brand scale-110 shadow-xl" : "bg-brand shadow-md"
                : isConnecting ? "bg-brand animate-pulse opacity-70"
                : "bg-gray-200"
            }`}
          >
            {isConnected
              ? <Mic className="w-9 h-9 text-white" />
              : <MicOff className="w-9 h-9 text-gray-400" />}
          </div>
          <AudioBars active={isConnected} speaking={isSpeaking} />
        </div>

        {/* Message d'état / transcript */}
        <div className="text-center min-h-[36px] px-2">
          <p
            className={`text-sm leading-snug transition-colors ${
              isConnecting ? "text-brand font-medium animate-pulse" :
              isConnected && isSpeaking ? "text-brand font-medium" :
              isConnected ? "text-green-600 font-medium" :
              "text-gray-500"
            }`}
          >
            {displayMessage}
          </p>
        </div>

        {/* Erreur */}
        {micError && (
          <p className="text-xs text-red-500 text-center bg-red-50 border border-red-200 rounded-lg px-3 py-2 w-full">
            {micError}
          </p>
        )}

        {/* Boutons voix */}
        <div className="flex gap-3">
          {!isConnected && !isConnecting && (
            <button
              onClick={startConversation}
              disabled={!AGENT_ID}
              className="flex items-center gap-2 px-6 py-2.5 bg-brand disabled:bg-gray-300 text-white rounded-full font-semibold text-sm hover:bg-brand-dark active:scale-95 transition-all shadow-md"
            >
              <Mic className="w-4 h-4" />
              {t.start}
            </button>
          )}
          {isConnecting && (
            <button disabled className="flex items-center gap-2 px-6 py-2.5 bg-gray-200 text-gray-400 rounded-full font-semibold text-sm cursor-not-allowed">
              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              {t.connecting}
            </button>
          )}
          {isConnected && (
            <button
              onClick={stopConversation}
              className="flex items-center gap-2 px-6 py-2.5 bg-red-500 text-white rounded-full font-semibold text-sm hover:bg-red-600 active:scale-95 transition-all shadow-md"
            >
              <PhoneOff className="w-4 h-4" />
              {t.end}
            </button>
          )}
        </div>

        {/* Saisie texte — optionnelle, visible uniquement en session */}
        {isConnected && (
          <div className="flex items-center gap-2 w-full bg-white border border-gray-200 rounded-xl px-3 py-2">
            <input
              ref={inputRef}
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendText()}
              placeholder={t.placeholder}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400 min-w-0"
            />
            <button
              onClick={sendText}
              disabled={!textInput.trim()}
              className="w-7 h-7 flex items-center justify-center rounded-lg bg-brand disabled:bg-gray-200 text-white disabled:text-gray-400 hover:bg-brand-dark transition-colors shrink-0"
              aria-label="Envoyer"
            >
              <SendIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Pied de page */}
      <div className="px-4 py-2 bg-white border-t text-center">
        <p className="text-[10px] text-gray-400">{t.footer}</p>
      </div>
    </Card>
  );
}

export const AIChatbot = () => {
  const { user }  = useAuth();
  const [isOpen,  setIsOpen]  = useState(false);
  const [lang,    setLang]    = useState<LangCode>("fr");
  const [hasAnim, setHasAnim] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setHasAnim(false), 5000);
    return () => clearTimeout(t);
  }, []);

  return (
    <ConversationProvider>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          aria-label="Ouvrir l'assistant vocal"
          className={`fixed bottom-6 right-6 w-14 h-14 bg-brand hover:bg-brand-dark rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50 ${
            hasAnim ? "animate-pulse" : ""
          }`}
        >
          <HeadsetIcon className="w-7 h-7 text-white" />
        </button>
      )}
      {isOpen && (
        <ChatWidget
          onClose={() => setIsOpen(false)}
          lang={lang}
          setLang={setLang}
          user={user}
        />
      )}
    </ConversationProvider>
  );
};

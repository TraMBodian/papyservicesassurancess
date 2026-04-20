import { useState, useCallback, useRef, useEffect } from "react";
import { X, Mic, MicOff, PhoneOff } from "lucide-react";

// Icône casque (headset) — source : iconer.app
const HeadsetIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
    <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z" />
    <path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
  </svg>
);
import { Card } from "@/components/ui/card";
import { ConversationProvider, useConversation } from "@elevenlabs/react";

const AGENT_ID = import.meta.env.VITE_ELEVENLABS_AGENT_ID as string;

// Masquer l'erreur bénigne du SDK ElevenLabs (WebSocket déjà fermé)
const _origWarn = console.warn.bind(console);
const _origError = console.error.bind(console);
console.warn = (...a: unknown[]) => {
  if (typeof a[0] === "string" && a[0].includes("WebSocket is already in CLOSING or CLOSED")) return;
  _origWarn(...a);
};
console.error = (...a: unknown[]) => {
  if (typeof a[0] === "string" && a[0].includes("WebSocket is already in CLOSING or CLOSED")) return;
  _origError(...a);
};

const LANGUAGES = [
  { code: "fr", label: "Français" },
  { code: "wo", label: "Wolof" },
];

const TEXT = {
  fr: {
    start: "Démarrer",
    connecting: "Connexion...",
    end: "Terminer",
    speaking: "Monsieur NIANG parle...",
    listening: "À votre écoute...",
    idle: "Appuyez sur Démarrer pour parler à Monsieur NIANG.",
    footer: "Disponible 24h/24 · 7j/7",
  },
  wo: {
    start: "Toog",
    connecting: "Yégël...",
    end: "Jebal",
    speaking: "Monsieur NIANG wax...",
    listening: "Dëgg na la...",
    idle: "Topp Toog ngir wax ak Monsieur NIANG.",
    footer: "Am na 24/24 · 7/7",
  },
};

const ChatWidget = ({ onClose, lang, setLang }: {
  onClose: () => void;
  lang: "fr" | "wo";
  setLang: (l: "fr" | "wo") => void;
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const t = TEXT[lang];

  const conversation = useConversation({
    onConnect: () => console.log("ElevenLabs: connecté"),
    onDisconnect: () => console.log("ElevenLabs: déconnecté"),
    onError: (error: unknown) => console.error("ElevenLabs erreur:", error),
  });

  useEffect(() => {
    const unlock = () => {
      if (audioRef.current) audioRef.current.play().catch(() => {});
    };
    document.addEventListener("click", unlock, { once: true });
    return () => document.removeEventListener("click", unlock);
  }, []);

  const startConversation = useCallback(async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      conversation.startSession({
        agentId: AGENT_ID,
        connectionType: "websocket",
      });
    } catch (err) {
      console.error("Impossible de démarrer la conversation:", err);
    }
  }, [conversation]);

  const stopConversation = useCallback(() => {
    if (conversation.status === "connected" || conversation.status === "connecting") {
      try { conversation.endSession(); } catch {}
    }
  }, [conversation]);

  const handleClose = useCallback(() => {
    if (conversation.status === "connected" || conversation.status === "connecting") {
      try { conversation.endSession(); } catch {}
    }
    onClose();
  }, [conversation, onClose]);

  const isConnected = conversation.status === "connected";
  const isConnecting = conversation.status === "connecting";

  return (
    <Card className="fixed bottom-6 right-6 w-80 shadow-2xl z-50 flex flex-col overflow-hidden rounded-2xl">
      <audio ref={audioRef} src="data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=" />

      {/* Header */}
      <div className="bg-blue-600 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-bold text-sm">
            MN
          </div>
          <div>
            <h3 className="font-bold text-sm">Monsieur NIANG</h3>
            <p className="text-xs opacity-80">Papy Services Assurances</p>
          </div>
        </div>
        <button onClick={handleClose} className="hover:bg-white/20 p-1 rounded transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Sélecteur de langue */}
      {!isConnected && !isConnecting && (
        <div className="flex border-b bg-white">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => setLang(l.code as "fr" | "wo")}
              className={`flex-1 py-2 text-xs font-medium transition-colors ${
                lang === l.code
                  ? "bg-blue-600 text-white"
                  : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      )}

      {/* Visualizer */}
      <div className="flex flex-col items-center justify-center py-10 px-6 gap-6 bg-gray-50">
        <div className="relative flex items-center justify-center">
          <div
            className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 ${
              isConnected
                ? conversation.isSpeaking
                  ? "bg-gradient-to-br from-blue-500 to-purple-600 scale-110 shadow-lg shadow-blue-300 animate-pulse"
                  : "bg-gradient-to-br from-blue-400 to-purple-500 shadow-md"
                : "bg-gray-200"
            }`}
          >
            {isConnected ? (
              <Mic className="w-10 h-10 text-white" />
            ) : (
              <MicOff className="w-10 h-10 text-gray-400" />
            )}
          </div>
          {isConnected && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white" />
          )}
        </div>

        <div className="text-center">
          {isConnecting && (
            <p className="text-sm text-blue-600 font-medium animate-pulse">{t.connecting}</p>
          )}
          {isConnected && conversation.isSpeaking && (
            <p className="text-sm text-purple-600 font-medium">{t.speaking}</p>
          )}
          {isConnected && !conversation.isSpeaking && (
            <p className="text-sm text-green-600 font-medium">{t.listening}</p>
          )}
          {!isConnected && !isConnecting && (
            <p className="text-sm text-gray-500">{t.idle}</p>
          )}
        </div>

        <div className="flex gap-4">
          {!isConnected && !isConnecting && (
            <button
              onClick={startConversation}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-full font-medium text-sm hover:opacity-90 transition-opacity shadow-md"
            >
              <Mic className="w-4 h-4" />
              {t.start}
            </button>
          )}
          {isConnecting && (
            <button disabled className="flex items-center gap-2 px-5 py-2.5 bg-gray-300 text-gray-500 rounded-full font-medium text-sm cursor-not-allowed">
              <Mic className="w-4 h-4" />
              {t.connecting}
            </button>
          )}
          {isConnected && (
            <button
              onClick={stopConversation}
              className="flex items-center gap-2 px-5 py-2.5 bg-red-500 text-white rounded-full font-medium text-sm hover:bg-red-600 transition-colors shadow-md"
            >
              <PhoneOff className="w-4 h-4" />
              {t.end}
            </button>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-2 bg-white border-t text-center">
        <p className="text-xs text-gray-400">{t.footer}</p>
      </div>
    </Card>
  );
};

export const AIChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [lang, setLang] = useState<"fr" | "wo">("fr");

  return (
    <ConversationProvider>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-16 h-16 bg-blue-600 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform z-50 animate-pulse"
        >
          <HeadsetIcon className="w-8 h-8 text-white" />
        </button>
      )}
      {isOpen && (
        <ChatWidget onClose={() => setIsOpen(false)} lang={lang} setLang={setLang} />
      )}
    </ConversationProvider>
  );
};

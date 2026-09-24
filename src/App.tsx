import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, 
  Plus, 
  History, 
  Settings, 
  LogOut, 
  Send, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX,
  User as UserIcon,
  Trash2,
  Menu,
  X,
  Sparkles,
  ChevronRight,
  ChevronDown,
  Image as ImageIcon,
  Download,
  Waves,
  Zap,
  Copy,
  Monitor,
  Smartphone,
  Tablet,
  Maximize2,
  Minimize2,
  Gamepad2,
  Box,
  Paperclip,
  Camera,
  FolderDown,
  Layers,
  Check,
  CheckCircle2,
  Compass,
  ExternalLink
} from 'lucide-react';
import Markdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { cn } from './lib/utils';
import { User, Chat, Message } from './types';
import { generateSpeech, generateImage, streamTetagpt } from './services/gemini';
import { generateOfflineResponse } from './services/offlineSimulator';
import { LandingPage } from './components/LandingPage';
import { ExportModal } from './components/ExportModal';
import { downloadStandaloneHtml, downloadProjectZip } from './lib/projectExporter';
import { 
  extractOrGenerate3DModel,
  downloadAutoCadDxf,
  downloadBlenderPythonScript
} from './lib/cadBlenderExporter';
import { 
  auth as firebaseAuth, 
  onAuthStateChanged, 
  signOut as firebaseSignOut,
  db,
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  where,
  orderBy,
  deleteDoc,
  serverTimestamp
} from './services/firebase';
import { AuthModal } from './components/AuthModal';

const getSafeApiKey = (): string => {
  try {
    const customKey = localStorage.getItem('teta_custom_api_key') || localStorage.getItem('teta_custom_gemini_key');
    if (customKey) return customKey;
    
    // Check vite env
    const viteKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
    if (viteKey) return viteKey;
    
    if (typeof process !== "undefined" && process.env) {
      return process.env.GEMINI_API_KEY || "";
    }
  } catch (err) {
    // Ignore
  }
  return "";
};

const extractDomainOrUrl = (text: string): { url: string; domain: string } | null => {
  if (!text) return null;
  const httpMatch = text.match(/https?:\/\/[^\s]+/i);
  if (httpMatch) {
    try {
      const parsed = new URL(httpMatch[0]);
      return { url: httpMatch[0], domain: parsed.hostname.replace('www.', '') };
    } catch (e) {
      return { url: httpMatch[0], domain: httpMatch[0] };
    }
  }
  const domainMatch = text.match(/(?:(?:clone|replicate|copy|make|build)\s+)?([a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?)/i);
  if (domainMatch && domainMatch[1]) {
    const dom = domainMatch[1].trim();
    return { url: `https://${dom}`, domain: dom.split('/')[0].replace('www.', '') };
  }
  return null;
};

// Unique & Amazing TETA Logo Component
const TetaLogo = ({ className = "w-8 h-8", animated = true }: { className?: string; animated?: boolean }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="teta-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#10b981" />
        <stop offset="100%" stopColor="#059669" />
      </linearGradient>
      <filter id="glow">
        <feGaussianBlur stdDeviation="2" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
    
    {/* Outer Hexagon Frame */}
    <motion.path
      d="M50 5 L89 27.5 V72.5 L50 95 L11 72.5 V27.5 Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      initial={animated ? { pathLength: 0, opacity: 0, rotateY: 0 } : {}}
      animate={animated ? { 
        pathLength: 1, 
        opacity: 0.3,
        rotateY: [0, 360],
      } : {}}
      transition={{ 
        pathLength: { duration: 2, repeat: Infinity, repeatType: "reverse" },
        rotateY: { duration: 10, repeat: Infinity, ease: "linear" }
      }}
    />

    {/* Stylized 'T' Core */}
    <motion.path
      d="M30 35 H70 M50 35 V75"
      stroke="url(#teta-gradient)"
      strokeWidth="12"
      strokeLinecap="round"
      filter="url(#glow)"
      initial={animated ? { pathLength: 0, scale: 0.8, z: 0 } : {}}
      animate={animated ? { 
        pathLength: 1, 
        scale: 1,
        z: [0, 20, 0]
      } : {}}
      transition={{ 
        duration: 1.5, 
        ease: "easeOut",
        z: { duration: 3, repeat: Infinity, ease: "easeInOut" }
      }}
    />

    {/* Tech Accents */}
    <motion.circle
      cx="50" cy="75" r="4"
      fill="url(#teta-gradient)"
      initial={animated ? { scale: 0 } : {}}
      animate={animated ? { scale: [0, 1.5, 1] } : {}}
      transition={{ delay: 1, duration: 0.5 }}
    />
    
    <motion.path
      d="M25 25 L35 15 M75 25 L65 15 M25 75 L35 85 M75 75 L65 85"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      opacity="0.5"
      initial={animated ? { opacity: 0 } : {}}
      animate={animated ? { opacity: [0, 0.5, 0] } : {}}
      transition={{ duration: 3, repeat: Infinity }}
    />
  </svg>
);

// Splash Screen Component
const SplashScreen = ({ onComplete }: { onComplete: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 3000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
      className="fixed inset-0 z-[1000] bg-[#050505] flex flex-col items-center justify-center overflow-hidden"
    >
      {/* Background Ambient Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-8">
        <motion.div
          initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ 
            type: "spring",
            stiffness: 100,
            damping: 15,
            duration: 1
          }}
        >
          <TetaLogo className="w-32 h-32 text-emerald-500" />
        </motion.div>

        <div className="space-y-2 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-4xl font-black tracking-tighter text-white"
          >
            TETA <span className="text-emerald-500">GPT</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="text-[10px] font-bold text-neutral-500 uppercase tracking-[0.3em]"
          >
            The Future of Intelligence
          </motion.p>
        </div>

        {/* Loading Bar */}
        <div className="w-48 h-[2px] bg-neutral-900 rounded-full overflow-hidden mt-4">
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: "0%" }}
            transition={{ duration: 2.5, ease: "easeInOut" }}
            className="w-full h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
          />
        </div>
      </div>

      {/* Footer Text */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-12 text-[10px] text-neutral-500 font-medium uppercase tracking-widest"
      >
        Powered by TetaGPT.co
      </motion.div>
    </motion.div>
  );
};

// Instructions Page Component
const InstructionsPage = ({ onComplete }: { onComplete: () => void }) => {
  const instructions = [
    {
      title: "Builder Mode",
      icon: <Zap className="w-6 h-6 text-emerald-500" />,
      description: "Generate full-stack web applications and components with a single prompt.",
      color: "from-emerald-500/20 to-cyan-500/20"
    },
    {
      title: "Game Mode",
      icon: <Gamepad2 className="w-6 h-6 text-emerald-500" />,
      description: "Create interactive 2D games using HTML5 Canvas and advanced game logic.",
      color: "from-purple-500/20 to-pink-500/20"
    },
    {
      title: "3D Mode",
      icon: <Box className="w-6 h-6 text-emerald-500" />,
      description: "Model stunning 3D scenes and experiences using Three.js and modern graphics.",
      color: "from-blue-500/20 to-indigo-500/20"
    },
    {
      title: "Clone Mode",
      icon: <Copy className="w-6 h-6 text-emerald-500" />,
      description: "Drop a website link and TetaGPT will replicate its design and layout instantly.",
      color: "from-orange-500/20 to-red-500/20"
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[1000] bg-[#050505] flex flex-col items-center justify-center p-6 overflow-y-auto no-scrollbar"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        whileHover={{ opacity: 1 }}
        className="absolute top-6 right-6 z-[1001]"
      >
        <button 
          onClick={onComplete}
          className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500 hover:text-emerald-500 transition-all flex items-center gap-2 group"
        >
          Skip <X className="w-3 h-3 group-hover:rotate-90 transition-transform" />
        </button>
      </motion.div>

      <div className="max-w-4xl w-full space-y-12 py-12 relative">
        <div className="text-center space-y-6">
          <motion.div
            initial={{ scale: 0.5, opacity: 0, rotate: -20 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 100, damping: 15 }}
            className="relative inline-block"
          >
            <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full animate-pulse" />
            <TetaLogo className="w-24 h-24 mx-auto text-emerald-500 relative z-10" />
          </motion.div>
          <div className="space-y-2">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl md:text-7xl font-black tracking-tighter text-white uppercase leading-none"
            >
              Master <span className="text-emerald-500">TETA GPT</span>
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-neutral-500 text-lg md:text-xl font-bold uppercase tracking-widest"
            >
              Your Creative Journey Starts Here
            </motion.p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {instructions.map((item, idx) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 30, rotateX: -15 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              transition={{ delay: 0.3 + idx * 0.1, type: "spring", stiffness: 100 }}
              whileHover={{ y: -5, rotateX: 5, translateZ: 20 }}
              className={cn(
                "p-8 glass-card rounded-[3rem] border border-white/5 space-y-6 transition-all group relative overflow-hidden preserve-3d",
                "hover:border-emerald-500/30"
              )}
            >
              <div className={cn("absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity duration-500", item.color)} />
              
              <div className="relative z-10 space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 shadow-inner">
                  {item.icon}
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-white uppercase tracking-tight group-hover:text-emerald-500 transition-colors">{item.title}</h3>
                  <p className="text-neutral-500 text-sm leading-relaxed font-medium group-hover:text-neutral-400 transition-colors">{item.description}</p>
                </div>
              </div>

              <div className="absolute bottom-4 right-8 opacity-0 group-hover:opacity-20 transition-opacity">
                <Sparkles className="w-12 h-12 text-emerald-500" />
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="flex flex-col items-center gap-6 pt-8"
        >
          <button
            onClick={onComplete}
            className="group relative px-16 py-6 bg-emerald-500 text-black rounded-full font-black uppercase tracking-[0.3em] text-sm transition-all shadow-[0_20px_50px_rgba(16,185,129,0.4)] hover:shadow-[0_25px_60px_rgba(16,185,129,0.5)] hover:scale-105 active:scale-95 overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out" />
            <span className="relative z-10">Initialize Engine</span>
          </button>
          <p className="text-[10px] text-neutral-600 font-black uppercase tracking-[0.4em]">Ready for Deployment</p>
        </motion.div>
      </div>
    </motion.div>
  );
};

// Custom Thinking Animation
const ThinkingAnimation = () => (
  <div className="flex items-center gap-1.5 px-2">
    {[0, 1, 2].map((i) => (
      <motion.div
        key={i}
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.3, 1, 0.3],
        }}
        transition={{
          duration: 1,
          repeat: Infinity,
          delay: i * 0.2,
        }}
        className="w-2 h-2 bg-emerald-500 rounded-full"
      />
    ))}
  </div>
);

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isCodingMode, setIsCodingMode] = useState(false);
  const [isGameMode, setIsGameMode] = useState(false);
  const [is3DMode, setIs3DMode] = useState(false);
  const [isCloneMode, setIsCloneMode] = useState(false);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [showSource, setShowSource] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [threeDTarget, setThreeDTarget] = useState<'game' | 'standalone'>('standalone');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [generatedCode, setGeneratedCode] = useState('');
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportCategory, setExportCategory] = useState<'cad3d' | 'web'>('web');
  const [cadFeedback, setCadFeedback] = useState<string | null>(null);

  const handleDownloadBlenderQuick = () => {
    if (!generatedCode) return;
    const currentTitle = chats.find(c => c.id === currentChatId)?.title || 'Tetagpt_3D_Scene';
    const model = extractOrGenerate3DModel(generatedCode, currentTitle, '3D Scene');
    downloadBlenderPythonScript(model);
    setCadFeedback('Blender Python script (.py) downloaded!');
    setTimeout(() => setCadFeedback(null), 3000);
  };

  const handleDownloadAutoCadQuick = () => {
    if (!generatedCode) return;
    const currentTitle = chats.find(c => c.id === currentChatId)?.title || 'Tetagpt_3D_Scene';
    const model = extractOrGenerate3DModel(generatedCode, currentTitle, '3D Scene');
    downloadAutoCadDxf(model);
    setCadFeedback('AutoCAD 3D DXF (.dxf) downloaded!');
    setTimeout(() => setCadFeedback(null), 3000);
  };

  const openExportFor3D = () => {
    setExportCategory('cad3d');
    setShowExportModal(true);
  };
  const [cloneSourceDomain, setCloneSourceDomain] = useState<string | null>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [showSplash, setShowSplash] = useState(false);
  const [showLanding, setShowLanding] = useState(true);
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [customApiKey, setCustomApiKey] = useState(localStorage.getItem('teta_custom_api_key') || localStorage.getItem('teta_custom_gemini_key') || '');
  const [isStaticDeployment, setIsStaticDeployment] = useState(false);
  const [forceOffline, setForceOffline] = useState(localStorage.getItem('teta_force_offline') === 'true');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        if (document.fullscreenElement) {
          document.exitFullscreen?.().catch(() => {});
        }
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  const handleGetStarted = (initialPrompt?: string, mode?: string) => {
    setShowLanding(false);
    setShowSplash(true);

    if (mode) {
      if (mode === 'builder') {
        setIsCodingMode(true);
        setIsGameMode(false);
        setIs3DMode(false);
        setIsCloneMode(false);
      } else if (mode === 'game') {
        setIsCodingMode(false);
        setIsGameMode(true);
        setIs3DMode(false);
        setIsCloneMode(false);
      } else if (mode === '3d') {
        setIsCodingMode(false);
        setIsGameMode(false);
        setIs3DMode(true);
        setIsCloneMode(false);
      } else if (mode === 'clone') {
        setIsCodingMode(false);
        setIsGameMode(false);
        setIs3DMode(false);
        setIsCloneMode(true);
      }
    }

    if (initialPrompt && initialPrompt.trim()) {
      setInput(initialPrompt);
      setPendingPrompt(initialPrompt);
    }
  };
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
      if (firebaseUser) {
        console.log("Firebase user loaded:", firebaseUser.uid);
        const loggedInUser: User = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || 'Teta Developer',
          email: firebaseUser.email || '',
          picture: firebaseUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${firebaseUser.uid}`,
          created_at: firebaseUser.metadata.creationTime || new Date().toISOString(),
          isGuest: false
        };
        setUser(loggedInUser);
        localStorage.setItem('teta_user', JSON.stringify(loggedInUser));
      } else {
        console.log("No Firebase user active. Checking guest cache...");
        const local = localStorage.getItem('teta_user');
        if (local) {
          try {
            const parsed = JSON.parse(local);
            if (parsed.isGuest) {
              setUser(parsed);
              return;
            }
          } catch (e) {}
        }
        const fallbackUser: User = {
          id: 'local_guest_user',
          name: 'Offline Explorer',
          email: 'offline@teta.co',
          picture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=offline',
          created_at: new Date().toISOString(),
          isGuest: true
        };
        setUser(fallbackUser);
        localStorage.setItem('teta_user', JSON.stringify(fallbackUser));
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Setup Speech Recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsRecording(false);
        if (isVoiceMode) {
          // Auto-send in voice mode
          sendMessageManually(transcript);
        }
      };

      recognitionRef.current.onerror = () => {
        setIsRecording(false);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }

    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (mobile) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isVoiceMode]);

  useEffect(() => {
    if (user) {
      fetchChats();
    }
  }, [user]);

  useEffect(() => {
    if (currentChatId) {
      fetchMessages(currentChatId);
    } else {
      setMessages([]);
    }
  }, [currentChatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchChats = async () => {
    if (!user) return;

    if (user && !user.isGuest) {
      try {
        const q = query(collection(db, `users/${user.id}/chats`), orderBy('created_at', 'desc'));
        const snapshot = await getDocs(q);
        const loadedChats: Chat[] = [];
        snapshot.forEach(docSnap => {
          const data = docSnap.data();
          loadedChats.push({
            id: docSnap.id,
            user_id: data.user_id || user.id,
            title: data.title || 'New Conversation',
            created_at: data.created_at?.toDate?.() ? data.created_at.toDate().toISOString() : (data.created_at || new Date().toISOString())
          });
        });
        setChats(loadedChats);
        localStorage.setItem('teta_chats', JSON.stringify(loadedChats));
      } catch (err) {
        console.error("Firestore fetchChats error:", err);
      }
      return;
    }

    if (isStaticDeployment || forceOffline) {
      const local = localStorage.getItem('teta_chats');
      if (local) {
        setChats(JSON.parse(local));
      } else {
        setChats([]);
      }
      return;
    }

    try {
      const res = await fetch('/api/chats');
      if (res.ok) {
        const data = await res.json();
        setChats(data);
        localStorage.setItem('teta_chats', JSON.stringify(data));
      } else {
        throw new Error('Server chats unreachable');
      }
    } catch (err) {
      setIsStaticDeployment(true);
      const local = localStorage.getItem('teta_chats');
      if (local) {
        setChats(JSON.parse(local));
      } else {
        setChats([]);
      }
    }
  };

  const fetchMessages = async (chatId: string) => {
    if (!user) return;

    if (user && !user.isGuest) {
      try {
        const q = query(collection(db, `users/${user.id}/chats/${chatId}/messages`), orderBy('created_at', 'asc'));
        const snapshot = await getDocs(q);
        const loadedMsgs: Message[] = [];
        snapshot.forEach(docSnap => {
          const data = docSnap.data();
          loadedMsgs.push({
            id: docSnap.id,
            chat_id: chatId,
            role: data.role,
            content: data.content,
            created_at: data.created_at?.toDate?.() ? data.created_at.toDate().toISOString() : (data.created_at || new Date().toISOString())
          });
        });
        setMessages(loadedMsgs);
        localStorage.setItem(`teta_messages_${chatId}`, JSON.stringify(loadedMsgs));
      } catch (err) {
        console.error("Firestore fetchMessages error:", err);
      }
      return;
    }

    if (isStaticDeployment || forceOffline) {
      const local = localStorage.getItem(`teta_messages_${chatId}`);
      if (local) {
        setMessages(JSON.parse(local));
      } else {
        setMessages([]);
      }
      return;
    }

    try {
      const res = await fetch(`/api/chats/${chatId}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
        localStorage.setItem(`teta_messages_${chatId}`, JSON.stringify(data));
      } else {
        throw new Error('Messages fetch error');
      }
    } catch (err) {
      setIsStaticDeployment(true);
      const local = localStorage.getItem(`teta_messages_${chatId}`);
      if (local) {
        setMessages(JSON.parse(local));
      } else {
        setMessages([]);
      }
    }
  };

  const createNewChat = async () => {
    const id = Math.random().toString(36).substring(7);
    const title = 'New Conversation';

    if (user && !user.isGuest) {
      try {
        await setDoc(doc(db, `users/${user.id}/chats`, id), {
          id,
          user_id: user.id,
          title,
          created_at: serverTimestamp()
        });
        await fetchChats();
        setCurrentChatId(id);
        setMessages([]);
        if (window.innerWidth <= 768) setIsSidebarOpen(false);
      } catch (err) {
        console.error("Firestore createNewChat error:", err);
      }
      return;
    }
    
    if (isStaticDeployment || forceOffline) {
      console.warn('Offline mode: creating chat via localStorage');
      const local = localStorage.getItem('teta_chats');
      const loadedChats: Chat[] = local ? JSON.parse(local) : [];
      const newChatObj: Chat = {
        id,
        user_id: user?.id || 'local_guest_user',
        title,
        created_at: new Date().toISOString()
      };
      const updated = [newChatObj, ...loadedChats];
      localStorage.setItem('teta_chats', JSON.stringify(updated));
      setChats(updated);
      setCurrentChatId(id);
      setMessages([]);
      if (window.innerWidth <= 768) setIsSidebarOpen(false);
      return;
    }

    try {
      const res = await fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, title }),
      });
      if (res.ok) {
        await fetchChats();
        setCurrentChatId(id);
        if (window.innerWidth <= 768) setIsSidebarOpen(false);
      } else {
        throw new Error('Failed to post new chat to backend');
      }
    } catch (err) {
      setIsStaticDeployment(true);
      console.warn('Offline mode failover: creating chat via localStorage');
      const local = localStorage.getItem('teta_chats');
      const loadedChats: Chat[] = local ? JSON.parse(local) : [];
      const newChatObj: Chat = {
        id,
        user_id: user?.id || 'local_guest_user',
        title,
        created_at: new Date().toISOString()
      };
      const updated = [newChatObj, ...loadedChats];
      localStorage.setItem('teta_chats', JSON.stringify(updated));
      setChats(updated);
      setCurrentChatId(id);
      setMessages([]);
      if (window.innerWidth <= 768) setIsSidebarOpen(false);
    }
  };

  const deleteChat = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();

    if (user && !user.isGuest) {
      try {
        const msgsSnapshot = await getDocs(collection(db, `users/${user.id}/chats/${id}/messages`));
        const deletePromises = msgsSnapshot.docs.map(docSnap => deleteDoc(docSnap.ref));
        await Promise.all(deletePromises);
        await deleteDoc(doc(db, `users/${user.id}/chats`, id));
        if (currentChatId === id) {
          setCurrentChatId(null);
          setMessages([]);
        }
        await fetchChats();
      } catch (err) {
        console.error("Firestore deleteChat error:", err);
      }
      return;
    }

    if (isStaticDeployment || forceOffline) {
      console.warn('Offline mode: deleting chat via localStorage');
      const local = localStorage.getItem('teta_chats');
      const loadedChats: Chat[] = local ? JSON.parse(local) : [];
      const filtered = loadedChats.filter(c => c.id !== id);
      localStorage.setItem('teta_chats', JSON.stringify(filtered));
      localStorage.removeItem(`teta_messages_${id}`);
      
      setChats(filtered);
      if (currentChatId === id) {
        setCurrentChatId(null);
        setMessages([]);
      }
      return;
    }

    try {
      const res = await fetch(`/api/chats/${id}`, { method: 'DELETE' });
      if (res.ok) {
        if (currentChatId === id) setCurrentChatId(null);
        await fetchChats();
      } else {
        throw new Error('Failed to delete chat API');
      }
    } catch (err) {
      setIsStaticDeployment(true);
      console.warn('Offline mode: deleting chat via localStorage');
      const local = localStorage.getItem('teta_chats');
      const loadedChats: Chat[] = local ? JSON.parse(local) : [];
      const filtered = loadedChats.filter(c => c.id !== id);
      localStorage.setItem('teta_chats', JSON.stringify(filtered));
      localStorage.removeItem(`teta_messages_${id}`);
      
      setChats(filtered);
      if (currentChatId === id) {
        setCurrentChatId(null);
        setMessages([]);
      }
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Could add a toast here
  };

  const downloadSourceCode = () => {
    if (!generatedCode) return;
    setShowExportModal(true);
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      setIsFullscreen(true);
      try {
        if (previewContainerRef.current && previewContainerRef.current.requestFullscreen) {
          previewContainerRef.current.requestFullscreen().catch(() => {});
        } else if (document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen().catch(() => {});
        }
      } catch (e) {
        // Fallback to in-app fullscreen CSS overlay
      }
    } else {
      if (document.fullscreenElement) {
        document.exitFullscreen?.().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const sendMessageManually = async (text: string) => {
    if (!text.trim() || isLoading) return;
    setInput(text);
    await sendMessage(undefined, text);
  };

  const sendMessage = async (e?: React.FormEvent, overrideInput?: string) => {
    e?.preventDefault();
    const messageText = overrideInput || input;
    if (!messageText.trim() && !selectedImage || isLoading) return;

    const currentImage = selectedImage;
    setSelectedImage(null);

    let chatId = currentChatId;
    if (!chatId) {
      const newId = Math.random().toString(36).substring(7);
      const title = messageText.slice(0, 30) + (messageText.length > 30 ? '...' : '');
      if (user && !user.isGuest) {
        try {
          await setDoc(doc(db, `users/${user.id}/chats`, newId), {
            id: newId,
            user_id: user.id,
            title: title || 'New 3D/Code Project',
            created_at: serverTimestamp()
          });
          await fetchChats();
        } catch (err) {
          console.error("Firestore new chat error:", err);
        }
      } else {
        try {
          const res = await fetch('/api/chats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: newId, title: title || 'New 3D/Code Project' }),
          });
          if (res.ok) {
            await fetchChats();
          } else {
            throw new Error('Failed to create chat in REST endpoint');
          }
        } catch (err) {
          console.warn('Offline mode: creating chat metadata offline');
          const local = localStorage.getItem('teta_chats');
          const loadedChats = local ? JSON.parse(local) : [];
          const newChatObj: Chat = {
            id: newId,
            user_id: user?.id || 'local_guest_user',
            title: title || 'New 3D/Code Project',
            created_at: new Date().toISOString()
          };
          loadedChats.unshift(newChatObj);
          localStorage.setItem('teta_chats', JSON.stringify(loadedChats));
          setChats(loadedChats);
        }
      }
      chatId = newId;
      setCurrentChatId(newId);
    }

    const userMsgId = Math.random().toString(36).substring(7);
    const userMsg: Message = {
      id: userMsgId,
      chat_id: chatId,
      role: 'user',
      content: currentImage ? `${messageText}\n\n![Reference Image](${currentImage})` : messageText,
      created_at: new Date().toISOString()
    };

    setMessages(prev => {
      const updated = [...prev, userMsg];
      localStorage.setItem(`teta_messages_${chatId}`, JSON.stringify(updated));
      return updated;
    });
    setInput('');

    if (messageText.toLowerCase().includes('coding mode on')) {
      setIsCodingMode(true);
      setIsGameMode(false);
      setIs3DMode(false);
      setIsLoading(false);
      return;
    }

    if (messageText.toLowerCase().includes('coding mode off')) {
      setIsCodingMode(false);
      setIsLoading(false);
      return;
    }

    if (messageText.toLowerCase().includes('game mode on')) {
      setIsGameMode(true);
      setIsCodingMode(false);
      setIs3DMode(false);
      setIsLoading(false);
      return;
    }

    if (messageText.toLowerCase().includes('game mode off')) {
      setIsGameMode(false);
      setIsLoading(false);
      return;
    }

    if (messageText.toLowerCase().includes('3d mode on')) {
      setIs3DMode(true);
      setIsCodingMode(false);
      setIsGameMode(false);
      setIsLoading(false);
      return;
    }

    if (messageText.toLowerCase().includes('3d mode off')) {
      setIs3DMode(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // --- Core Offline Check & Simulation ---
    if (!navigator.onLine || forceOffline) {
      console.warn('Navigator Offline state or Force Offline active: running local simulated assistant.');
      await handleOfflineSimulation(messageText, chatId);
      return;
    }

    const key = getSafeApiKey();
    if (isStaticDeployment && !key) {
      console.warn('Running in static deployment without custom key: falling back to simulator.');
      await handleOfflineSimulation(messageText, chatId);
      return;
    }

    try {
      if (user && !user.isGuest) {
        try {
          await setDoc(doc(db, `users/${user.id}/chats/${chatId}/messages`, userMsgId), {
            id: userMsgId,
            role: 'user',
            content: userMsg.content,
            created_at: serverTimestamp()
          });
        } catch (e) {
          console.error("Firestore user message write error:", e);
        }
      } else if (!isStaticDeployment) {
        try {
          await fetch(`/api/chats/${chatId}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userMsg),
          });
        } catch (postErr) {
          console.warn('Failed to post message to backend - failover to localStorage saving.');
        }
      }

      const isImageRequest = /generate image|draw|create an image|show me an image/i.test(messageText);

      if (isImageRequest && !currentImage) {
        let imageUrl = '';
        try {
          imageUrl = (await generateImage(messageText, customApiKey)) || '';
        } catch (imgErr) {
          console.error("Image generation error:", imgErr);
        }

        const aiMsgId = Math.random().toString(36).substring(7);
        const content = imageUrl ? `![Generated Image](${imageUrl})` : "I couldn't generate the image. Please try again.";
        
        const aiMsg: Message = {
          id: aiMsgId,
          chat_id: chatId!,
          role: 'model',
          content,
          created_at: new Date().toISOString()
        };

        setMessages(prev => {
          const updated = [...prev, aiMsg];
          localStorage.setItem(`teta_messages_${chatId}`, JSON.stringify(updated));
          return updated;
        });

        if (user && !user.isGuest) {
          try {
            await setDoc(doc(db, `users/${user.id}/chats/${chatId}/messages`, aiMsgId), {
              id: aiMsgId,
              role: 'model',
              content,
              created_at: serverTimestamp()
            });
          } catch (e) {
            console.error("Firestore image reply write error:", e);
          }
        } else if (!isStaticDeployment) {
          try {
            await fetch(`/api/chats/${chatId}/messages`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(aiMsg),
            });
          } catch(e) {}
        }

      } else {
        const domainMatch = extractDomainOrUrl(messageText);
        if (domainMatch) {
          setSourceUrl(domainMatch.url);
          setCloneSourceDomain(domainMatch.domain);
        }

        let systemInstruction = "Your name is Tetagpt, an autonomous cosmic AI creation engine by tetagpt.co. Always identify yourself as such if asked about your name or origin.";
        
        if (currentImage) {
          systemInstruction = `You are a master UI/UX reverse-engineer and full-stack frontend architect.
The user has provided a SCREENSHOT of a mobile app or website.
Your mission is to generate an ACCURATELY EXACT, PIXEL-PERFECT, HIGH-FIDELITY, FUNCTIONAL CLONE of what is shown in the screenshot:

1. Visual Analysis & Hierarchy:
   - If it is a MOBILE APP: Recreate the entire mobile layout with meticulous precision: status bar (time, wifi, battery icons), top header/navbar with back/action icons, segmented tabs, stories or avatar bubbles, card feeds, badges, floating action button, and bottom tab bar with authentic icons and active indicator.
   - If it is a WEBSITE: Recreate top announcement bar, brand navbar with logo & menu links, hero section, CTA buttons, feature grids, cards, statistics, and footer.
2. Color Palette & Typography:
   - Extract the exact hex colors (backgrounds, surfaces, cards, accents, borders, gradients).
   - Match font weights, uppercase/lowercase text, letter-spacing, and badge styles using Google Fonts (Inter, Plus Jakarta Sans, Poppins) and Tailwind CSS classes.
3. Realistic Content & Icons:
   - Replicate the exact headlines, labels, menu items, and button text visible in the screenshot.
   - For icons, render clean SVG or FontAwesome icons (<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">).
4. Interactivity:
   - Make buttons interactive (hover & tap feedback).
   - Make tabs switchable, inputs editable, and search functional on mock data.
5. Standalone Output:
   - Output a single complete HTML file with embedded CSS and JS (using Tailwind CSS CDN <script src="https://cdn.tailwindcss.com"></script>).
   - Include <meta name="viewport" content="width=device-width, initial-scale=1.0">.
   - Fully responsive for mobile and desktop screens.
   - Wrap the entire code in a single markdown \`\`\`html ... \`\`\` code block.
Your name is Tetagpt, an autonomous cosmic AI creation engine by tetagpt.co.`;
        } else if (isCloneMode || domainMatch) {
          const targetName = domainMatch?.domain || (sourceUrl ? new URL(sourceUrl).hostname : 'the target website');
          systemInstruction = `You are an elite web architect specializing in website cloning.
The user wants to create an exact clone of: ${domainMatch?.url || sourceUrl || messageText}.
Your goal is to create an ACCURATELY EXACT, PIXEL-PERFECT, HIGH-FIDELITY CLONE of ${targetName}:

1. Visual Identity & Brand Fidelity:
   - Match the exact color scheme, fonts, gradients, and design language of ${targetName} (e.g. Netflix dark theme & carousel, Apple minimalist typography & glassmorphic frosted navbar, Airbnb coral #FF385C & pill search bar, Stripe vibrant mesh gradients, Spotify dark neon green #1DB954).
   - Load Tailwind CSS CDN: <script src="https://cdn.tailwindcss.com"></script>.
   - Load FontAwesome CDN: <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">.
2. Structure & Sections:
   - Exact navigation bar with logo, menu links, search bar, sign-in/action buttons.
   - High-impact hero section with authentic headlines, subtext, and dual CTA buttons.
   - Product showcase, card grids with realistic images/icons, testimonials, pricing, or statistics.
   - Comprehensive multi-column footer with links and social icons.
3. Realistic Interactivity:
   - Mobile responsive menu toggle (hamburger menu).
   - Working tabs, interactive filters, modal dialogs, and smooth transitions.
4. Output:
   - Single standalone HTML file with <meta name="viewport" content="width=device-width, initial-scale=1.0">.
   - Wrap the entire code in a single markdown \`\`\`html ... \`\`\` code block.
Your name is Tetagpt, an autonomous cosmic AI creation engine by tetagpt.co.`;
        } else if (isGameMode) {
          systemInstruction = "You are a professional game developer. When asked to build a game, provide a SINGLE block of self-contained HTML, CSS, and JavaScript (using Canvas API or standard Web APIs) that can run in any browser and play offline. Support dual inputs: keyboard controls (Arrow keys/WASD) for desktop AND responsive on-screen touch controls (Virtual D-Pad/tap buttons) so the game is 100% playable on mobile screens and in fullscreen! Include score tracking, high score saved to localStorage, pause/restart buttons, particle effects, and synthesized sound effects using the Web Audio API. Wrap the code in a single markdown ```html ... ``` code block. Your name is Tetagpt, an autonomous cosmic AI creation engine by tetagpt.co.";
        } else if (is3DMode) {
          systemInstruction = `You are a world-class 3D character artist, graphics engineer, and CAD modeler.
When asked to create a 3D model, character, creature, or object (whether from a PHOTO REFERENCE or detailed text description):

1. COMPREHENSIVE VISUAL DECONSTRUCTION (FROM PHOTO REFERENCE OR DETAILED TEXT):
   - Scrutinize any provided image or text prompt in extreme detail.
   - For CHARACTERS / HUMANOIDS (anime, warriors, samurai, superheroes, avatars, soldiers):
     * Head & Face: Proportions, facial planes, glowing visor or eyes, ears/horns, detailed sculpted hair/helmet/crest.
     * Torso & Attire: Segmented chest armor plates, collar, abdominal belt, tactical pouches or garments.
     * Arms & Hands: Shoulders (pauldrons), upper arms, forearms/gauntlets, hands/fists.
     * Pelvis & Legs: Armored hip plates, thighs, knee guards, calf boots, and feet.
     * Signature Weapons & Accessories: Glowing energy blade/katana, blaster, cape, wings, backpack, emblems.
   - For ROBOTS / MECHS: Heavy cockpit sensor, armored chassis, plasma reactor core, shoulder weapon pods, hydraulic bipedal limbs, thrusters.
   - For CREATURES / MONSTERS: Articulated snout, horns, scales, segmented spine, wings with membranes, quadruped/biped limbs, claws, tail.
   - For WEAPONS / HARD-SURFACE: Blade edges, fuller energy channels, crossguard gems, hilt wrap, pommel counterweights.
   - COLOR PALETTE EXTRACTION: Extract exact authentic colors, metallic sheens, and vibrant emissive accents (neon cyan, amber, red, violet) from the reference image or description.

2. TECHNICAL EXECUTION (Three.js & OrbitControls):
   - Provide a SINGLE, complete, self-contained HTML file (using Three.js r128: <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script> and OrbitControls: <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script>).
   - Build compound geometries (BoxGeometry, CylinderGeometry, SphereGeometry, ConeGeometry, TorusGeometry, LatheGeometry, ExtrudeGeometry) combined into hierarchical THREE.Group() structures (characterGroup, headGroup, torsoGroup, leftArmGroup, rightArmGroup, legsGroup, weaponGroup).
   - Use MeshStandardMaterial with authentic roughness, metalness, and emissive properties.
   - Enable shadow casting and receiving on all meshes (castShadow = true, receiveShadow = true).
   - STUDIO 3-POINT LIGHTING RIG:
     * Directional Key Light with shadow map for dramatic highlights.
     * Ambient / Fill light for soft shadow fill.
     * Colorful Rim / Back light (cyan, amber, or magenta) to accentuate the character's silhouette and contours!
     * Floor / Pedestal: Glowing circular platform or grid stage, subtle floating ambient dust/ember particles.
   - INTERACTIVE CONTROLS & ANIMATIONS:
     * OrbitControls with smooth damping (enableDamping: true, dampingFactor: 0.05).
     * Idle animation loop: subtle breathing/bobbing motion, floating hover, glowing pulse on emissive weapons/eyes.
     * In-scene UI Overlay: Add a sleek translucent floating bar at the top or bottom with buttons:
       - 🔄 "Auto-Rotate" toggle
       - 🕸️ "Wireframe" toggle
       - 💡 "Lighting" toggle (Studio / Dramatic / Cyberpunk)
       - 🎯 "Center Camera" view reset

3. EXPORT-READY MESHES:
   - Use clean modular mesh naming so the user can easily download native Autodesk AutoCAD (.dxf) and Blender Python (.py / .obj) files using the download buttons in the top toolbar.

4. Output format:
   - Single standalone HTML file wrapped in a single markdown \`\`\`html ... \`\`\` code block.
Your name is Tetagpt, an autonomous cosmic AI creation engine by tetagpt.co.`;
        } else if (isCodingMode) {
          systemInstruction = "You are a professional web developer. When asked to build an app or website, provide a SINGLE block of code containing HTML, CSS, and JavaScript that can run in a browser. Your code MUST be fully mobile-responsive and include the `<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">` tag. Use modern CSS techniques like Flexbox, Grid, and Tailwind CSS via CDN. Ensure all elements scale correctly on small screens and in fullscreen. Wrap the code in a single markdown ```html ... ``` code block. Your name is Tetagpt, an autonomous cosmic AI creation engine by tetagpt.co.";
        }

        const aiMsgId = Math.random().toString(36).substring(7);
        let fullContent = '';
        
        setMessages(prev => {
          const updated: Message[] = [...prev, {
            id: aiMsgId,
            chat_id: chatId!,
            role: 'model',
            content: '',
            created_at: new Date().toISOString()
          }];
          localStorage.setItem(`teta_messages_${chatId}`, JSON.stringify(updated));
          return updated;
        });

        await streamTetagpt({
          messages: [...messages, userMsg],
          systemInstruction,
          image: currentImage,
          isCloneMode,
          customKey: customApiKey,
          onChunk: (chunkText) => {
            fullContent += chunkText;
            setMessages(prev => {
              const updated = prev.map(m => m.id === aiMsgId ? { ...m, content: fullContent } : m);
              localStorage.setItem(`teta_messages_${chatId}`, JSON.stringify(updated));
              return updated;
            });
            
            if (isCodingMode || isGameMode || is3DMode || isCloneMode) {
              const codeMatch = fullContent.match(/```(?:html|javascript|css)?\n([\s\S]*?)```/);
              if (codeMatch) {
                setGeneratedCode(codeMatch[1]);
              }
            }
          }
        });

        if (user && !user.isGuest) {
          try {
            await setDoc(doc(db, `users/${user.id}/chats/${chatId}/messages`, aiMsgId), {
              id: aiMsgId,
              role: 'model',
              content: fullContent,
              created_at: serverTimestamp()
            });
          } catch (e) {
            console.error("Firestore stream save error:", e);
          }
        } else if (!isStaticDeployment) {
          try {
            await fetch(`/api/chats/${chatId}/messages`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                id: aiMsgId,
                role: 'model',
                content: fullContent
              }),
            });
          } catch(e) {}
        }

        if (autoSpeak || isVoiceMode) {
          speak(fullContent);
        }
      }

    } catch (error) {
      console.error('Chat error: Falling back to offline simulator:', error);
      await handleOfflineSimulation(messageText, chatId);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOfflineSimulation = async (text: string, finalChatId: string) => {
    try {
      const offlineResult = generateOfflineResponse(text, isCodingMode, isGameMode, is3DMode, isCloneMode, threeDTarget);
      
      const aiMsgId = Math.random().toString(36).substring(7);
      const placeholderMsg: Message = {
        id: aiMsgId,
        chat_id: finalChatId,
        role: 'model',
        content: '',
        created_at: new Date().toISOString()
      };

      setMessages(prev => {
        const updated = [...prev, placeholderMsg];
        localStorage.setItem(`teta_messages_${finalChatId}`, JSON.stringify(updated));
        return updated;
      });

      // Simulating genuine progressive printed text stream
      const fullContent = offlineResult.message + (offlineResult.code ? `\n\n\`\`\`html\n${offlineResult.code}\n\`\`\`` : "");
      let currentChunk = '';
      const words = fullContent.split(' ');
      let wordIndex = 0;

      await new Promise<void>((resolve) => {
        const timer = setInterval(() => {
          if (wordIndex >= words.length) {
            clearInterval(timer);
            resolve();
            return;
          }
          currentChunk += (wordIndex === 0 ? '' : ' ') + words.slice(wordIndex, wordIndex + 4).join(' ');
          wordIndex += 4;

          setMessages(prev => {
            const updated = prev.map(m => m.id === aiMsgId ? { ...m, content: currentChunk } : m);
            localStorage.setItem(`teta_messages_${finalChatId}`, JSON.stringify(updated));
            return updated;
          });

          if (offlineResult.code) {
            setGeneratedCode(offlineResult.code);
          }
        }, 15);
      });

      if (user && !user.isGuest) {
        try {
          await setDoc(doc(db, `users/${user.id}/chats/${finalChatId}/messages`, aiMsgId), {
            id: aiMsgId,
            role: 'model',
            content: fullContent,
            created_at: serverTimestamp()
          });
        } catch (e) {
          console.error("Firestore offline msg save error:", e);
        }
      }

      if (autoSpeak || isVoiceMode) {
        speak(offlineResult.message);
      }

    } catch (simErr) {
      console.error('Failed simulation:', simErr);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if ((isVoiceMode || autoSpeak) && !isRecording && !isSpeaking && !isLoading && !input) {
      // Small delay to ensure no accidental triggers
      const timer = setTimeout(() => {
        toggleRecording();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isVoiceMode, autoSpeak, isRecording, isSpeaking, isLoading, input]);

  const toggleRecording = () => {
    if (!recognitionRef.current) return;
    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (err) {
        console.error("Speech recognition already started or failed", err);
        setIsRecording(false);
      }
    }
  };

  const speak = async (text: string) => {
    // Stop any existing speech
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    
    setIsSpeaking(true);
    try {
      const audioUrl = await generateSpeech(text, customApiKey);
      if (audioUrl) {
        const audio = new Audio(audioUrl);
        audio.onended = () => {
          setIsSpeaking(false);
          if (isVoiceMode || autoSpeak) {
            setTimeout(() => toggleRecording(), 500);
          }
        };
        audio.onerror = () => {
          console.error("Audio playback error");
          setIsSpeaking(false);
          if (isVoiceMode || autoSpeak) toggleRecording();
        };
        
        try {
          await audio.play();
        } catch (playError) {
          console.warn("Autoplay blocked or failed, falling back to system TTS", playError);
          fallbackSpeak(text);
        }
      } else {
        fallbackSpeak(text);
      }
    } catch (error) {
      console.error("Speech generation failed", error);
      fallbackSpeak(text);
    }
  };

  const fallbackSpeak = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => {
        setIsSpeaking(false);
        if (isVoiceMode || autoSpeak) {
          setTimeout(() => toggleRecording(), 500);
        }
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        if (isVoiceMode || autoSpeak) toggleRecording();
      };
      window.speechSynthesis.speak(utterance);
    } else {
      setIsSpeaking(false);
      if (isVoiceMode || autoSpeak) toggleRecording();
    }
  };

  if (showLanding) {
    return (
      <div className="min-h-screen bg-[#070707] text-white">
        <LandingPage 
          onGetStarted={handleGetStarted} 
          onOpenSettings={() => setShowSettingsModal(true)} 
          onOpenAuth={() => setShowAuthModal(true)}
          user={user}
        />
        <AuthModal 
          isOpen={showAuthModal} 
          onClose={() => setShowAuthModal(false)} 
          onAuthSuccess={(u) => {
            setUser(u);
            setShowAuthModal(false);
          }} 
        />
        {/* Render Settings Modal directly on top of landing page if needed */}
        <AnimatePresence>
          {showSettingsModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 15 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 15 }}
                transition={{ type: "spring", duration: 0.4 }}
                className="w-full max-w-lg bg-neutral-900 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.8)] relative"
              >
                <div className="p-6 md:p-8 border-b border-white/5 flex items-center justify-between bg-white/5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                      <Settings className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                      <h3 className="font-black text-white text-base truncate uppercase tracking-wider">Engine Settings</h3>
                      <p className="text-[10px] text-neutral-400 font-semibold uppercase tracking-widest">Environment & Core Keys</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowSettingsModal(false)}
                    className="p-2 hover:bg-white/5 rounded-full transition-all text-neutral-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6 md:p-8 space-y-6">
                  {/* Custom Key */}
                  <div className="space-y-2">
                    <label className="block text-xs font-black uppercase tracking-widest text-neutral-400">Tetagpt API Key</label>
                    <div className="relative">
                      <input
                        type="password"
                        placeholder="Paste your Tetagpt API key..."
                        value={customApiKey}
                        onChange={(e) => setCustomApiKey(e.target.value)}
                        className="w-full bg-neutral-950 border border-white/5 rounded-2xl py-4 px-5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all font-mono"
                      />
                    </div>
                    <p className="text-[10px] text-neutral-500 leading-relaxed font-semibold">
                      Stored securely and only in your local browser history. Powers live AI generation, cloning, games, and 3D modeling.
                    </p>
                    <div className="flex gap-2.5 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          localStorage.setItem('teta_custom_api_key', customApiKey);
                          localStorage.setItem('teta_custom_gemini_key', customApiKey);
                          setIsStaticDeployment(false); // test with custom key
                          setTimeout(() => {
                            window.location.reload();
                          }, 500);
                        }}
                        className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-black py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                      >
                        Save API Key
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCustomApiKey('');
                          localStorage.removeItem('teta_custom_api_key');
                          localStorage.removeItem('teta_custom_gemini_key');
                          setTimeout(() => {
                            window.location.reload();
                          }, 500);
                        }}
                        className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all border border-white/5"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  <hr className="border-white/5" />

                  {/* Simulated Offline Mode Toggle */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="block text-xs font-black uppercase tracking-widest text-neutral-400">Offline Simulator Only</label>
                        <p className="text-[10px] text-neutral-500 leading-relaxed max-w-[320px]">
                          Force all modes to work 100% offline using local AI model presets and immediate template responders.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const nextVal = !forceOffline;
                          setForceOffline(nextVal);
                          localStorage.setItem('teta_force_offline', nextVal ? 'true' : 'false');
                        }}
                        className={cn(
                          "w-12 h-6 rounded-full p-1 transition-all duration-300 shrink-0",
                          forceOffline ? "bg-emerald-500 flex justify-end" : "bg-neutral-800 flex justify-start border border-white/5"
                        )}
                      >
                        <motion.div layout className="w-4 h-4 rounded-full bg-white shadow-md animate-none" />
                      </button>
                    </div>
                  </div>

                  <hr className="border-white/5" />

                  {/* Diagnostics Panel */}
                  <div className="p-4 rounded-2xl bg-neutral-950 border border-white/5 space-y-2">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500">Diagnostics Telemetry</h4>
                    
                    <div className="grid grid-cols-2 gap-3 text-[10px] uppercase font-black tracking-wider">
                      <div className="space-y-0.5">
                        <span className="text-neutral-500">Host Mode:</span>
                        <p className="text-neutral-200">
                          {isStaticDeployment ? "Static Client Only (Netlify)" : "Full Stack Server (Node)"}
                        </p>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-neutral-500">Internet Hook:</span>
                        <p className={navigator.onLine ? "text-emerald-400" : "text-amber-500"}>
                          {navigator.onLine ? "● Connected" : "○ Disconnected"}
                        </p>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-neutral-500">API Resolver:</span>
                        <p className="text-neutral-200">
                          {forceOffline ? "Offline Sim Active" : (customApiKey ? "Direct User Key" : (isStaticDeployment ? "Offline Sim (No Key)" : "System Proxy Gateway"))}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="fixed inset-0 bg-[#070707] flex items-center justify-center font-mono text-[10px] text-zinc-500 uppercase tracking-widest bg-black h-screen w-screen z-50">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping mr-3" />
        Synchronizing compiler...
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#0A0A0A] text-neutral-200 overflow-hidden font-sans">
      <AnimatePresence mode="wait">
        {showSplash && (
          <SplashScreen key="splash" onComplete={() => {
            setShowSplash(false);
            if (pendingPrompt) {
              setShowInstructions(false);
              sendMessageManually(pendingPrompt);
              setPendingPrompt(null);
            } else {
              setShowInstructions(true);
            }
          }} />
        )}
        {showInstructions && (
          <InstructionsPage key="instructions" onComplete={() => setShowInstructions(false)} />
        )}
      </AnimatePresence>

      {/* Sidebar Overlay for Mobile */}
      <AnimatePresence>
        {isSidebarOpen && isMobile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence mode="wait">
        {isSidebarOpen && (
          <motion.aside
            initial={{ x: -320, opacity: 0, rotateY: -10 }}
            animate={{ x: 0, opacity: 1, rotateY: 0 }}
            exit={{ x: -320, opacity: 0, rotateY: -10 }}
            transition={{ type: "spring", stiffness: 200, damping: 25 }}
            className={cn(
              "w-72 glass-panel flex flex-col z-40 transition-all preserve-3d",
              isMobile ? "fixed inset-y-0 left-0" : "relative"
            )}
          >
            <div className="p-6 flex items-center justify-between border-b border-white/5 bg-white/5 backdrop-blur-xl">
              <div className="flex items-center gap-3 text-emerald-500">
                <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                  <TetaLogo className="w-6 h-6" />
                </div>
                <div>
                  <span className="font-black tracking-tight text-lg text-white">TETAGPT</span>
                  <span className="block text-[8px] font-black tracking-[0.2em] text-emerald-400 uppercase">Cosmic Builder</span>
                </div>
              </div>
              {isMobile && (
                <button onClick={() => setIsSidebarOpen(false)} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            <div className="p-6">
              <motion.button 
                whileHover={{ scale: 1.02, translateZ: 10 }}
                whileTap={{ scale: 0.98 }}
                onClick={createNewChat}
                className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl bg-emerald-500 text-black hover:bg-emerald-400 transition-all text-sm font-black uppercase tracking-widest shadow-[0_10px_30px_rgba(16,185,129,0.3)]"
              >
                <Plus className="w-5 h-5" />
                New Chat
              </motion.button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 space-y-2 py-2">
              <div className="px-3 py-2 text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] opacity-50">Recent Conversations</div>
              {chats.map((chat) => (
                <motion.div
                  key={chat.id}
                  whileHover={{ x: 4, translateZ: 5 }}
                  onClick={() => {
                    setCurrentChatId(chat.id);
                    if (isMobile) setIsSidebarOpen(false);
                  }}
                  className={cn(
                    "group flex items-center gap-3 px-4 py-3.5 rounded-2xl cursor-pointer transition-all text-sm font-medium border preserve-3d",
                    currentChatId === chat.id 
                      ? "bg-emerald-500/10 border-emerald-500/20 text-white shadow-lg" 
                      : "hover:bg-white/5 border-transparent text-neutral-400 hover:text-neutral-200"
                  )}
                >
                  <MessageSquare className="w-4 h-4 shrink-0 opacity-50 group-hover:opacity-100" />
                  <span className="truncate flex-1">{chat.title}</span>
                  <button 
                    onClick={(e) => deleteChat(e, chat.id)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/20 hover:text-red-400 rounded-lg transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              ))}
            </div>

            <div className="p-6 border-t border-white/5 flex flex-col gap-3">
              <div className="flex items-center gap-4 p-4 glass-card rounded-2xl border border-white/5 shadow-xl">
                <img src={user.picture} className="w-10 h-10 rounded-xl border border-white/10 shadow-lg animate-none" alt={user.name} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold truncate text-white">{user.name}</p>
                    {user.isGuest && (
                      <span className="text-[8px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full font-black uppercase tracking-tighter border border-emerald-500/20">Guest</span>
                    )}
                  </div>
                  <p className="text-[10px] text-neutral-500 truncate font-medium">{user.email}</p>
                </div>
              </div>

              {user.isGuest ? (
                <button 
                  onClick={() => setShowAuthModal(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black uppercase tracking-widest transition-all shadow-[0_4px_15px_rgba(16,185,129,0.2)]"
                >
                  <Sparkles className="w-4 h-4 text-black animate-pulse" />
                  Sign In / Sign Up
                </button>
              ) : (
                <button 
                  onClick={async () => {
                    await firebaseSignOut(firebaseAuth);
                    localStorage.removeItem('teta_user');
                    window.location.reload();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-black uppercase tracking-widest transition-all"
                >
                  <LogOut className="w-4 h-4 text-red-400" />
                  Sign Out
                </button>
              )}

              <button 
                onClick={() => setShowSettingsModal(true)}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 text-white text-xs font-black uppercase tracking-widest transition-all"
              >
                <Settings className="w-4 h-4 text-emerald-500" />
                Settings & API Key
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative min-w-0">
        {/* Header */}
        <header className="h-16 md:h-20 border-b border-white/5 flex items-center justify-between px-3 md:px-8 bg-white/5 backdrop-blur-2xl sticky top-0 z-20 preserve-3d shadow-2xl">
          <div className="flex items-center gap-2 md:gap-6">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 md:p-3 hover:bg-white/5 rounded-2xl transition-all border border-transparent hover:border-white/10"
            >
              {isSidebarOpen ? <X className="w-5 h-5 md:w-6 md:h-6" /> : <Menu className="w-5 h-5 md:w-6 md:h-6" />}
            </button>
            <h2 className="font-black text-sm tracking-tighter flex items-center gap-2 md:gap-3 truncate">
              <div className="p-1 md:p-1.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                <Sparkles className="w-3 h-3 md:w-4 md:h-4 text-emerald-500 shrink-0" />
              </div>
              <span className="hidden xs:inline text-white uppercase tracking-wider text-[9px] md:text-[11px] font-black">Tetagpt Cosmic Builder</span>
              <span className="text-neutral-700 font-normal hidden xs:inline">/</span> 
              <span className="truncate max-w-[100px] md:max-w-none text-neutral-400 font-bold text-xs md:text-sm">
                {currentChatId ? chats.find(c => c.id === currentChatId)?.title : 'New Chat'}
              </span>
            </h2>
          </div>

          <div className="flex items-center gap-1.5 md:gap-3">
            {/* Desktop Mode Buttons */}
            <div className="hidden sm:flex items-center gap-1.5 md:gap-3">
              <motion.button 
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsVoiceMode(!isVoiceMode)}
                className={cn(
                  "p-2 md:p-2.5 rounded-xl md:rounded-2xl transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest border shrink-0",
                  isVoiceMode ? "text-emerald-500 bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.2)]" : "text-neutral-500 hover:bg-white/5 border-transparent"
                )}
              >
                <Waves className="w-4 h-4 md:w-5 md:h-5" />
                <span className="hidden lg:inline">Voice</span>
              </motion.button>
              <div className="w-[1px] h-6 bg-white/5 mx-1" />
              <motion.button 
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setIsCodingMode(!isCodingMode);
                  setIsGameMode(false);
                  setIs3DMode(false);
                  setIsCloneMode(false);
                }}
                className={cn(
                  "p-2 md:p-2.5 rounded-xl md:rounded-2xl transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest border shrink-0",
                  isCodingMode ? "text-emerald-500 bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.2)]" : "text-neutral-500 hover:bg-white/5 border-transparent"
                )}
              >
                <Zap className="w-4 h-4 md:w-5 md:h-5" />
                <span className="hidden lg:inline">Builder</span>
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setIsGameMode(!isGameMode);
                  setIsCodingMode(false);
                  setIs3DMode(false);
                  setIsCloneMode(false);
                }}
                className={cn(
                  "p-2 md:p-2.5 rounded-xl md:rounded-2xl transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest border shrink-0",
                  isGameMode ? "text-emerald-500 bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.2)]" : "text-neutral-500 hover:bg-white/5 border-transparent"
                )}
              >
                <Gamepad2 className="w-4 h-4 md:w-5 md:h-5" />
                <span className="hidden lg:inline">Game</span>
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setIs3DMode(!is3DMode);
                  setIsCodingMode(false);
                  setIsGameMode(false);
                  setIsCloneMode(false);
                }}
                className={cn(
                  "p-2 md:p-2.5 rounded-xl md:rounded-2xl transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest border shrink-0",
                  is3DMode ? "text-emerald-500 bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.2)]" : "text-neutral-500 hover:bg-white/5 border-transparent"
                )}
              >
                <Box className="w-4 h-4 md:w-5 md:h-5" />
                <span className="hidden lg:inline">3D</span>
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setIsCloneMode(!isCloneMode);
                  setIsCodingMode(false);
                  setIsGameMode(false);
                  setIs3DMode(false);
                }}
                className={cn(
                  "p-2 md:p-2.5 rounded-xl md:rounded-2xl transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest border shrink-0",
                  isCloneMode ? "text-emerald-500 bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.2)]" : "text-neutral-500 hover:bg-white/5 border-transparent"
                )}
              >
                <Copy className="w-4 h-4 md:w-5 md:h-5" />
                <span className="hidden lg:inline">Clone</span>
              </motion.button>
            </div>

            {/* Mobile Mode Selector */}
            <div className="sm:hidden relative">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-500 text-[10px] font-black uppercase tracking-widest"
              >
                {isCodingMode ? <Zap className="w-3 h-3" /> : isGameMode ? <Gamepad2 className="w-3 h-3" /> : is3DMode ? <Box className="w-3 h-3" /> : isCloneMode ? <Copy className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
                {isCodingMode ? 'Builder' : isGameMode ? 'Game' : is3DMode ? '3D' : isCloneMode ? 'Clone' : 'Mode'}
                <ChevronDown className={cn("w-3 h-3 transition-transform text-white/40", showMobileMenu ? "rotate-180" : "")} />
              </motion.button>

              <AnimatePresence>
                {showMobileMenu && (
                  <>
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setShowMobileMenu(false)}
                      className="fixed inset-0 z-40"
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 top-full mt-2 w-48 bg-[#0A0A0A] border border-white/10 rounded-2xl p-2 shadow-2xl z-50 overflow-hidden"
                    >
                      <button 
                        onClick={() => { setIsCodingMode(true); setIsGameMode(false); setIs3DMode(false); setIsCloneMode(false); setShowMobileMenu(false); }}
                        className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", isCodingMode ? "bg-emerald-500 text-black" : "text-neutral-400 hover:bg-white/5")}
                      >
                        <Zap className="w-4 h-4" /> Builder
                      </button>
                      <button 
                        onClick={() => { setIsGameMode(true); setIsCodingMode(false); setIs3DMode(false); setIsCloneMode(false); setShowMobileMenu(false); }}
                        className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", isGameMode ? "bg-emerald-500 text-black" : "text-neutral-400 hover:bg-white/5")}
                      >
                        <Gamepad2 className="w-4 h-4" /> Game
                      </button>
                      <button 
                        onClick={() => { setIs3DMode(true); setIsCodingMode(false); setIsGameMode(false); setIsCloneMode(false); setShowMobileMenu(false); }}
                        className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", is3DMode ? "bg-emerald-500 text-black" : "text-neutral-400 hover:bg-white/5")}
                      >
                        <Box className="w-4 h-4" /> 3D Mode
                      </button>
                      <button 
                        onClick={() => { setIsCloneMode(true); setIsCodingMode(false); setIsGameMode(false); setIs3DMode(false); setShowMobileMenu(false); }}
                        className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", isCloneMode ? "bg-emerald-500 text-black" : "text-neutral-400 hover:bg-white/5")}
                      >
                        <Copy className="w-4 h-4" /> Clone
                      </button>
                      <div className="h-[1px] bg-white/5 my-1" />
                      <button 
                        onClick={() => { setIsVoiceMode(!isVoiceMode); setShowMobileMenu(false); }}
                        className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", isVoiceMode ? "text-emerald-500" : "text-neutral-400 hover:bg-white/5")}
                      >
                        <Waves className="w-4 h-4" /> Voice Mode
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <div className="w-[1px] h-8 bg-white/5 mx-1 hidden sm:block shrink-0" />
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setAutoSpeak(!autoSpeak)}
              className={cn(
                "p-2 md:p-3 rounded-xl md:rounded-2xl transition-all border shrink-0",
                autoSpeak ? "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" : "text-neutral-500 border-transparent hover:bg-white/5"
              )}
              title="Auto-speak replies"
            >
              {autoSpeak ? <Volume2 className="w-4 h-4 md:w-5 md:h-5" /> : <VolumeX className="w-4 h-4 md:w-5 md:h-5" />}
            </motion.button>
          </div>
        </header>

        {/* Voice Mode Overlay */}
        <AnimatePresence>
          {isVoiceMode && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute inset-0 z-30 bg-[#0A0A0A] flex flex-col items-center justify-center p-6 text-center space-y-12"
            >
              <button 
                onClick={() => setIsVoiceMode(false)}
                className="absolute top-6 right-6 p-3 hover:bg-neutral-900 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="space-y-4">
                <TetaLogo className="w-24 h-24 mx-auto text-emerald-500" />
                <h3 className="text-3xl font-bold tracking-tighter">TETA Voice Assistant</h3>
                <p className="text-neutral-400 max-w-md">I'm listening. Speak naturally and I'll respond instantly.</p>
              </div>

              <div className="relative">
                <motion.div
                  animate={{
                    scale: isRecording || isSpeaking ? [1, 1.2, 1] : 1,
                    opacity: isRecording || isSpeaking ? [0.5, 1, 0.5] : 0.2,
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 bg-emerald-500 rounded-full blur-3xl"
                />
                <button
                  onClick={toggleRecording}
                  className={cn(
                    "relative w-32 h-32 rounded-full flex items-center justify-center transition-all shadow-2xl",
                    isRecording ? "bg-red-500 scale-110" : "bg-emerald-500"
                  )}
                >
                  {isRecording ? <MicOff className="w-12 h-12 text-white" /> : <Mic className="w-12 h-12 text-black" />}
                </button>
              </div>

              <div className="h-12 flex items-center justify-center">
                {isRecording && <p className="text-emerald-500 font-bold animate-pulse uppercase tracking-widest text-sm">Listening...</p>}
                {isSpeaking && <p className="text-emerald-500 font-bold uppercase tracking-widest text-sm">Speaking...</p>}
                {isLoading && <ThinkingAnimation />}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Messages or Studio (Builder/Game) */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {(isCodingMode || isGameMode || is3DMode || isCloneMode) ? (
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-[#050505]">
              {/* Left Side: Context Sidebar (Collapsible on Mobile) */}
              <div className={cn(
                "lg:w-80 border-r border-white/5 flex flex-col overflow-hidden transition-all duration-500 glass-panel preserve-3d",
                isMobile ? "h-0" : "h-full"
              )}>
                <div className="p-6 border-b border-white/5 flex items-center justify-between text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] bg-white/5 backdrop-blur-xl">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
                    Context
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-transparent">
                  {messages.map((msg) => (
                    <motion.div 
                      key={msg.id} 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={cn("text-xs space-y-2", msg.role === 'user' ? "text-right" : "text-left")}
                    >
                      <span className="text-[10px] text-neutral-600 font-black uppercase tracking-widest">{msg.role}</span>
                      <p className={cn(
                        "p-4 rounded-2xl border backdrop-blur-md transition-all duration-300", 
                        msg.role === 'user' 
                          ? "bg-neutral-900/50 border-white/5 text-neutral-400" 
                          : "bg-emerald-500/5 border-emerald-500/10 text-neutral-300 shadow-[0_0_20px_rgba(16,185,129,0.05)]"
                      )}>
                        {msg.content.slice(0, 150)}{msg.content.length > 150 ? '...' : ''}
                      </p>
                    </motion.div>
                  ))}
                  {messages.length === 0 && (
                    <div className="text-center py-12 text-neutral-600 italic text-xs font-medium">
                      No context yet. Start {isGameMode ? 'developing' : is3DMode ? 'modeling' : 'building'}!
                    </div>
                  )}
                </div>
              </div>

              {/* Right Side: Studio View */}
              <div className="flex-1 flex flex-col overflow-hidden relative perspective-1000">
                {/* Modern Toolbar */}
                <div className="h-auto min-h-[3.5rem] border-b border-white/5 flex flex-col sm:flex-row items-center justify-between px-3 md:px-6 py-2 sm:py-0 bg-white/5 backdrop-blur-2xl z-20 shadow-xl gap-2 sm:gap-0">
                  <div className="flex items-center gap-2 md:gap-3 w-full sm:w-auto overflow-x-auto no-scrollbar pb-0.5 sm:pb-0">
                    <button 
                      onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                      className="lg:hidden p-2.5 text-neutral-500 hover:text-white bg-white/5 rounded-xl border border-white/5 shrink-0"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                    <div className="flex bg-neutral-900/80 p-1 rounded-2xl border border-white/5 backdrop-blur-md shadow-inner shrink-0">
                      <button 
                        onClick={() => setActiveTab('preview')}
                        className={cn(
                          "px-3 sm:px-6 h-9 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 relative overflow-hidden",
                          activeTab === 'preview' ? "bg-emerald-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.4)]" : "text-neutral-500 hover:text-neutral-300"
                        )}
                      >
                        {isGameMode ? <Gamepad2 className="w-3.5 h-3.5" /> : is3DMode ? <Box className="w-3.5 h-3.5" /> : <Zap className="w-3.5 h-3.5" />}
                        <span className="xs:inline">{isGameMode ? 'Play' : is3DMode ? '3D View' : 'Preview'}</span>
                      </button>
                      <button 
                        onClick={() => setActiveTab('code')}
                        className={cn(
                          "px-3 sm:px-6 h-9 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
                          activeTab === 'code' ? "bg-emerald-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.4)]" : "text-neutral-500 hover:text-neutral-300"
                        )}
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span className="xs:inline">Code</span>
                      </button>
                    </div>

                    {activeTab === 'preview' && !isGameMode && !is3DMode && (
                      <div className="flex bg-neutral-900/80 p-1 rounded-2xl border border-white/5 backdrop-blur-md shrink-0 sm:flex hidden">
                        <button 
                          onClick={() => setPreviewDevice('mobile')}
                          className={cn("p-2 rounded-xl transition-all", previewDevice === 'mobile' ? "bg-emerald-500 text-black shadow-lg" : "text-neutral-600 hover:text-neutral-400")}
                        >
                          <Smartphone className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setPreviewDevice('tablet')}
                          className={cn("p-2 rounded-xl transition-all", previewDevice === 'tablet' ? "bg-emerald-500 text-black shadow-lg" : "text-neutral-600 hover:text-neutral-400")}
                        >
                          <Tablet className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setPreviewDevice('desktop')}
                          className={cn("p-2 rounded-xl transition-all", previewDevice === 'desktop' ? "bg-emerald-500 text-black shadow-lg" : "text-neutral-600 hover:text-neutral-400")}
                        >
                          <Monitor className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    {activeTab === 'preview' && !isGameMode && !is3DMode && isMobile && (
                      <button 
                        onClick={() => {
                          const devices: Array<'mobile' | 'tablet' | 'desktop'> = ['mobile', 'tablet', 'desktop'];
                          const nextIdx = (devices.indexOf(previewDevice) + 1) % devices.length;
                          setPreviewDevice(devices[nextIdx]);
                        }}
                        className="p-2.5 bg-neutral-900/80 border border-white/5 text-emerald-500 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest sm:hidden"
                      >
                        {previewDevice === 'mobile' ? <Smartphone className="w-4 h-4" /> : previewDevice === 'tablet' ? <Tablet className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
                        {previewDevice}
                      </button>
                    )}
                    {isCloneMode && sourceUrl && (
                      <div className="flex bg-neutral-900/50 p-1 rounded-2xl border border-white/5 shrink-0">
                        <button 
                          onClick={() => setShowSource(false)}
                          className={cn(
                            "px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                            !showSource ? "bg-emerald-500 text-black shadow-lg" : "text-neutral-500 hover:text-neutral-300"
                          )}
                        >
                          Clone
                        </button>
                        <button 
                          onClick={() => setShowSource(true)}
                          className={cn(
                            "px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                            showSource ? "bg-emerald-500 text-black shadow-lg" : "text-neutral-500 hover:text-neutral-300"
                          )}
                        >
                          Source
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 md:gap-3 w-full sm:w-auto justify-end">
                    {cadFeedback && (
                      <motion.span 
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/20"
                      >
                        {cadFeedback}
                      </motion.span>
                    )}

                    {generatedCode && is3DMode && (
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        {/* Quick Blender Download */}
                        <button
                          onClick={handleDownloadBlenderQuick}
                          className="px-2.5 sm:px-3 py-1.5 sm:py-2 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-400 hover:bg-amber-500 hover:text-black transition-all flex items-center gap-1.5 shadow-lg shrink-0 text-[10px] font-black uppercase tracking-wider"
                          title="Download Blender File (.py auto-importer script)"
                        >
                          <Box className="w-3.5 h-3.5 text-amber-400" />
                          <span>Blender <span className="hidden md:inline">(.py)</span></span>
                        </button>

                        {/* Quick AutoCAD Download */}
                        <button
                          onClick={handleDownloadAutoCadQuick}
                          className="px-2.5 sm:px-3 py-1.5 sm:py-2 bg-sky-500/10 border border-sky-500/30 rounded-2xl text-sky-400 hover:bg-sky-500 hover:text-black transition-all flex items-center gap-1.5 shadow-lg shrink-0 text-[10px] font-black uppercase tracking-wider"
                          title="Download AutoCAD File (3D .dxf CAD format)"
                        >
                          <Compass className="w-3.5 h-3.5 text-sky-400" />
                          <span>AutoCAD <span className="hidden md:inline">(.dxf)</span></span>
                        </button>

                        {/* Full 3D CAD & Local Exporter */}
                        <button 
                          onClick={openExportFor3D}
                          className="p-2 sm:px-3.5 sm:py-2 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl text-emerald-400 hover:bg-emerald-500 hover:text-black transition-all flex items-center gap-1.5 shadow-lg shrink-0 text-[10px] font-black uppercase tracking-wider"
                          title="Full 3D CAD & Blender Studio Export Modal"
                        >
                          <FolderDown className="w-4 h-4" />
                          <span className="hidden sm:inline">CAD Suite</span>
                        </button>
                      </div>
                    )}

                    {generatedCode && !is3DMode && (
                      <button 
                        onClick={() => {
                          setExportCategory('web');
                          setShowExportModal(true);
                        }}
                        className="p-2 sm:px-4 sm:py-2 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl text-emerald-400 hover:bg-emerald-500 hover:text-black transition-all flex items-center gap-2 shadow-lg shrink-0"
                        title="Export & Run Locally (Single HTML or Project ZIP)"
                      >
                        <FolderDown className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase hidden sm:inline tracking-widest">Run Locally / Download</span>
                      </button>
                    )}

                    {activeTab === 'preview' && (
                      <button 
                        onClick={toggleFullscreen}
                        className={cn(
                          "p-2.5 rounded-2xl border transition-all shadow-lg shrink-0",
                          isFullscreen ? "bg-emerald-500 border-emerald-600 text-black" : "bg-neutral-900/80 border-white/5 text-neutral-400 hover:text-white"
                        )}
                        title="Full Screen (PC & Mobile)"
                      >
                        <Maximize2 className="w-4 h-4" />
                      </button>
                    )}
                    {activeTab === 'code' && generatedCode && (
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => copyToClipboard(generatedCode)}
                          className="p-2.5 bg-neutral-900/80 border border-white/5 rounded-2xl text-neutral-400 hover:text-white transition-all flex items-center gap-2 shadow-lg"
                          title="Copy Code"
                        >
                          <Copy className="w-4 h-4" />
                          <span className="text-[10px] font-black uppercase hidden sm:inline tracking-widest">Copy</span>
                        </button>
                      </div>
                    )}
                    <button 
                      onClick={() => {
                        setIsCodingMode(false);
                        setIsGameMode(false);
                        setIs3DMode(false);
                        setIsCloneMode(false);
                        setSourceUrl(null);
                        setCloneSourceDomain(null);
                      }}
                      className="h-10 px-4 md:px-5 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-red-500 hover:text-white transition-all flex items-center gap-2 shadow-lg whitespace-nowrap"
                    >
                      <X className="w-4 h-4" />
                      <span className="hidden xs:inline">Exit {isGameMode ? 'Game' : is3DMode ? '3D' : isCloneMode ? 'Clone' : 'Builder'}</span>
                    </button>
                  </div>
                </div>

                {/* Content Area */}
                <div 
                  ref={previewContainerRef}
                  className={cn(
                    "flex-1 overflow-hidden relative bg-[#050505] preserve-3d",
                    isFullscreen && "fixed inset-0 z-[120] bg-[#050505] flex flex-col w-screen h-screen"
                  )}
                >
                  {isFullscreen && (
                    <div className="h-14 bg-neutral-900/95 backdrop-blur-xl border-b border-white/10 px-4 md:px-6 flex items-center justify-between z-[130] shrink-0 shadow-2xl">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                          <TetaLogo className="w-4 h-4 text-emerald-400" />
                          <span className="text-[11px] font-black uppercase tracking-widest text-emerald-400">
                            {isGameMode ? 'Game Fullscreen' : is3DMode ? '3D Fullscreen' : isCloneMode ? 'Clone Fullscreen' : 'App Fullscreen'}
                          </span>
                        </div>

                        {!isGameMode && !is3DMode && (
                          <div className="hidden sm:flex bg-neutral-950 p-1 rounded-xl border border-white/10">
                            <button
                              onClick={() => setPreviewDevice('desktop')}
                              className={cn(
                                "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5",
                                previewDevice === 'desktop' ? "bg-emerald-500 text-black" : "text-neutral-400 hover:text-white"
                              )}
                            >
                              <Monitor className="w-3.5 h-3.5" />
                              Desktop
                            </button>
                            <button
                              onClick={() => setPreviewDevice('mobile')}
                              className={cn(
                                "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5",
                                previewDevice === 'mobile' ? "bg-emerald-500 text-black" : "text-neutral-400 hover:text-white"
                              )}
                            >
                              <Smartphone className="w-3.5 h-3.5" />
                              Mobile Phone
                            </button>
                            <button
                              onClick={() => setPreviewDevice('tablet')}
                              className={cn(
                                "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5",
                                previewDevice === 'tablet' ? "bg-emerald-500 text-black" : "text-neutral-400 hover:text-white"
                              )}
                            >
                              <Tablet className="w-3.5 h-3.5" />
                              Tablet
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {generatedCode && is3DMode && (
                          <>
                            <button
                              onClick={handleDownloadBlenderQuick}
                              className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500 hover:text-black text-amber-300 border border-amber-500/30 text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-md"
                              title="Download Blender Python (.py) Script"
                            >
                              <Box className="w-3.5 h-3.5" />
                              <span>Blender</span>
                            </button>
                            <button
                              onClick={handleDownloadAutoCadQuick}
                              className="px-3 py-1.5 rounded-xl bg-sky-500/15 hover:bg-sky-500 hover:text-black text-sky-300 border border-sky-500/30 text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-md"
                              title="Download AutoCAD (.dxf) File"
                            >
                              <Compass className="w-3.5 h-3.5" />
                              <span>AutoCAD</span>
                            </button>
                          </>
                        )}
                        {generatedCode && (
                          <button
                            onClick={() => {
                              if (is3DMode) setExportCategory('cad3d');
                              else setExportCategory('web');
                              setShowExportModal(true);
                            }}
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500 hover:text-black text-emerald-400 border border-emerald-500/30 text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-md"
                          >
                            <FolderDown className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">{is3DMode ? 'CAD Suite' : 'Run Locally'}</span>
                          </button>
                        )}
                        <button
                          onClick={toggleFullscreen}
                          className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 border border-white/10"
                          title="Exit Fullscreen (ESC)"
                        >
                          <Minimize2 className="w-4 h-4" />
                          <span className="hidden sm:inline">Exit</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {activeTab === 'preview' ? (
                    <div className={cn(
                      "w-full h-full flex items-center justify-center perspective-1000",
                      isFullscreen 
                        ? "p-0 bg-black" 
                        : "p-4 sm:p-6 md:p-10 bg-neutral-950/50"
                    )}>
                      <motion.div 
                        initial={{ rotateX: 10, y: 20, opacity: 0 }}
                        animate={{ rotateX: 0, y: 0, opacity: 1 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className={cn(
                          "bg-white transition-all duration-500 overflow-hidden relative preserve-3d shadow-2xl",
                          isFullscreen && (isGameMode || is3DMode || previewDevice === 'desktop')
                            ? "w-full h-full rounded-none border-none shadow-none"
                            : isFullscreen && previewDevice === 'mobile'
                            ? (isMobile ? "w-full h-full rounded-none border-none" : "w-[390px] h-[844px] max-h-[94vh] rounded-[3rem] border-[10px] border-neutral-900 shadow-2xl")
                            : isFullscreen && previewDevice === 'tablet'
                            ? (isMobile ? "w-full h-full rounded-none border-none" : "w-[768px] h-[1024px] max-h-[94vh] rounded-[2.5rem] border-[10px] border-neutral-900 shadow-2xl")
                            : !isGameMode && !is3DMode && previewDevice === 'mobile'
                            ? "w-[375px] h-[667px] max-h-full rounded-[3.5rem] border-[12px] border-neutral-900"
                            : !isGameMode && !is3DMode && previewDevice === 'tablet'
                            ? "w-[768px] h-[1024px] max-h-full rounded-[3rem] border-[12px] border-neutral-900"
                            : "w-full h-full rounded-3xl border border-white/5"
                        )}
                      >
                        {showSource && sourceUrl ? (
                          <iframe 
                            src={sourceUrl}
                            className="w-full h-full border-none bg-white"
                            title="Source Preview"
                          />
                        ) : generatedCode ? (
                          <iframe 
                            srcDoc={generatedCode}
                            className="w-full h-full border-none bg-white"
                            title="Preview"
                            sandbox="allow-scripts allow-modals allow-forms allow-same-origin"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-neutral-400 bg-[#050505] p-6 sm:p-12 text-center space-y-6 overflow-y-auto">
                            <div className="relative">
                              <div className="absolute inset-0 bg-emerald-500/20 blur-[60px] rounded-full animate-pulse" />
                              <motion.div 
                                animate={{ rotateY: 360 }}
                                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                                className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-[2rem] bg-neutral-900 border border-white/5 flex items-center justify-center shadow-2xl preserve-3d"
                              >
                                {isGameMode ? <Gamepad2 className="w-10 h-10 sm:w-12 sm:h-12 text-emerald-500" /> : is3DMode ? <Box className="w-10 h-10 sm:w-12 sm:h-12 text-emerald-500" /> : isCloneMode ? <Copy className="w-10 h-10 sm:w-12 sm:h-12 text-emerald-500" /> : <Zap className="w-10 h-10 sm:w-12 sm:h-12 text-emerald-500" />}
                              </motion.div>
                            </div>
                            
                            <div className="space-y-2 max-w-lg mx-auto">
                              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tighter uppercase">
                                Tetagpt {isGameMode ? 'Game Engine' : is3DMode ? '3D Modeler' : isCloneMode ? 'Website & App Cloner' : 'Builder'}
                              </h2>
                              <p className="text-xs sm:text-sm text-neutral-400 font-medium leading-relaxed">
                                {isGameMode 
                                  ? "Create interactive arcade, canvas, and WebGL games with mobile touch and desktop keyboard controls." 
                                  : is3DMode 
                                  ? "Generate stunning 3D models and scenes using Three.js with full orbit controls."
                                  : isCloneMode
                                  ? "Enter any domain or upload a screenshot to generate an accurately exact, pixel-perfect copy of any website or mobile app."
                                  : "Your vision, coded in seconds. Describe your app below to begin."}
                              </p>
                            </div>

                            {/* Clone Mode Interactive Presets and Screenshot Upload */}
                            {isCloneMode && (
                              <div className="w-full max-w-md space-y-3 pt-2">
                                <div className="p-3 bg-neutral-900/90 border border-white/10 rounded-2xl space-y-2.5">
                                  <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider block text-left">
                                    ⚡ 1-Click Popular Website Clones:
                                  </span>
                                  <div className="flex flex-wrap gap-1.5 justify-center">
                                    {[
                                      { name: 'Apple', domain: 'apple.com' },
                                      { name: 'Netflix', domain: 'netflix.com' },
                                      { name: 'Airbnb', domain: 'airbnb.com' },
                                      { name: 'Stripe', domain: 'stripe.com' },
                                      { name: 'Spotify', domain: 'spotify.com' },
                                      { name: 'Linear', domain: 'linear.app' },
                                      { name: 'Instagram', domain: 'instagram.com' }
                                    ].map(preset => (
                                      <button
                                        key={preset.domain}
                                        onClick={() => sendMessageManually(`Create an exact pixel-perfect clone of ${preset.domain}`)}
                                        className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-emerald-500 hover:text-black text-neutral-300 text-[11px] font-bold transition-all border border-white/5"
                                      >
                                        {preset.name}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                <label className="cursor-pointer block p-4 rounded-2xl border-2 border-dashed border-white/15 hover:border-emerald-500/50 bg-white/[0.02] hover:bg-emerald-500/5 transition-all text-center group">
                                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                                  <div className="flex items-center justify-center gap-2 text-neutral-300 group-hover:text-emerald-400 text-xs font-bold">
                                    <Camera className="w-4 h-4" />
                                    <span>Upload Screenshot to Clone Mobile App or Website</span>
                                  </div>
                                  <p className="text-[10px] text-neutral-500 mt-1">
                                    Replicates layout, colors, typography, cards & interactive states
                                  </p>
                                </label>
                              </div>
                            )}
                          </div>
                        )}
                      </motion.div>
                    </div>
                  ) : (
                    <div className="w-full h-full overflow-auto bg-[#050505] p-6">
                      <div className="glass-panel rounded-3xl overflow-hidden border border-white/5">
                        <SyntaxHighlighter 
                          language="html" 
                          style={atomDark}
                          customStyle={{ margin: 0, padding: '2.5rem', background: 'transparent', fontSize: '14px', lineHeight: '1.7' }}
                          showLineNumbers
                        >
                          {generatedCode || "// No code generated yet. Start prompting!"}
                        </SyntaxHighlighter>
                      </div>
                    </div>
                  )}
                  
                  {isLoading && (
                    <div className={cn(
                      "absolute flex items-center justify-center z-30 transition-all duration-500",
                      activeTab === 'preview' && generatedCode 
                        ? "bottom-8 right-8 inset-auto" 
                        : "inset-0 bg-black/80 backdrop-blur-2xl"
                    )}>
                      <motion.div 
                        initial={{ scale: 0.9, opacity: 0, rotateX: -20 }}
                        animate={{ scale: 1, opacity: 1, rotateX: 0 }}
                        className={cn(
                          "glass-panel shadow-[0_0_100px_rgba(16,185,129,0.1)] flex flex-col items-center gap-8 text-center preserve-3d transition-all duration-500",
                          activeTab === 'preview' && generatedCode 
                            ? "p-6 rounded-3xl w-64" 
                            : "p-12 rounded-[3.5rem] max-w-sm w-full"
                        )}
                      >
                        <div className="relative">
                          <div className={cn(
                            "absolute inset-0 bg-emerald-500/30 blur-[40px] rounded-full animate-pulse",
                            activeTab === 'preview' && generatedCode ? "blur-[20px]" : "blur-[40px]"
                          )} />
                          <TetaLogo className={cn(
                            "text-emerald-500 relative z-10 transition-all duration-500",
                            activeTab === 'preview' && generatedCode ? "w-10 h-10" : "w-20 h-20"
                          )} />
                        </div>
                        <div className="space-y-3">
                          <p className={cn(
                            "font-black text-white tracking-tighter uppercase transition-all duration-500",
                            activeTab === 'preview' && generatedCode ? "text-sm" : "text-2xl"
                          )}>
                            {isGameMode ? 'Developing' : is3DMode ? 'Modeling' : isCloneMode ? 'Cloning' : isCodingMode ? 'Coding' : 'Crafting'}
                          </p>
                          {!(activeTab === 'preview' && generatedCode) && (
                            <p className="text-xs text-neutral-500 leading-relaxed font-bold uppercase tracking-widest opacity-70 max-w-[200px] mx-auto">
                              {isGameMode 
                                ? "Implementing game loops & physics" 
                                : is3DMode 
                                ? "Rendering 3D geometry & textures"
                                : isCloneMode
                                ? "Analyzing & replicating website"
                                : isCodingMode
                                ? "Building full-stack web application"
                                : "Generating visual components"}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {[0, 1, 2].map(i => (
                            <motion.div 
                              key={i}
                              animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                              transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                              className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                            />
                          ))}
                        </div>
                      </motion.div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-8 perspective-1000">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-8 max-w-2xl mx-auto">
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0, rotateY: -30 }}
                    animate={{ scale: 1, opacity: 1, rotateY: 0 }}
                    transition={{ type: "spring", stiffness: 100, damping: 20 }}
                    className="w-24 h-24 bg-emerald-500/10 border border-emerald-500/20 rounded-[2.5rem] flex items-center justify-center shadow-[0_0_60px_rgba(16,185,129,0.15)] preserve-3d"
                  >
                    <TetaLogo className="w-12 h-12 text-emerald-500" />
                  </motion.div>
                  <div className="space-y-3">
                    <h3 className="text-3xl md:text-5xl font-black tracking-tighter text-white">How can I help you today?</h3>
                    <p className="text-neutral-400 text-sm md:text-lg max-w-lg mx-auto leading-relaxed">TETA GPT is ready to assist with coding, creative writing, analysis, or just a friendly conversation.</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
                    {[
                      "Generate an image of a futuristic city",
                      "Draw a cute robot holding a flower",
                      "Write a React hook for local storage",
                      "Explain quantum computing simply"
                    ].map((suggestion, idx) => (
                      <motion.button
                        key={suggestion}
                        initial={{ opacity: 0, y: 20, rotateX: -10 }}
                        animate={{ opacity: 1, y: 0, rotateX: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        whileHover={{ scale: 1.02, rotateX: 5, translateZ: 10 }}
                        onClick={() => sendMessageManually(suggestion)}
                        className="p-5 text-left text-sm font-bold glass-card rounded-2xl transition-all text-neutral-400 hover:text-white group flex items-center justify-between preserve-3d"
                      >
                        {suggestion}
                        <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-black transition-all">
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="max-w-4xl mx-auto w-full space-y-10 py-8">
                  {messages.map((msg) => (
                    <motion.div
                      initial={{ opacity: 0, y: 20, rotateX: -5 }}
                      animate={{ opacity: 1, y: 0, rotateX: 0 }}
                      key={msg.id}
                      className={cn(
                        "flex gap-4 md:gap-8 preserve-3d",
                        msg.role === 'user' ? "flex-row-reverse" : ""
                      )}
                    >
                      <motion.div 
                        whileHover={{ rotateY: 180, scale: 1.1 }}
                        className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border transition-all duration-500 preserve-3d shadow-xl",
                          msg.role === 'user' ? "bg-neutral-800 border-white/10" : "bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.15)]"
                        )}
                      >
                        {msg.role === 'user' ? (
                          <UserIcon className="w-6 h-6 text-neutral-400" />
                        ) : (
                          <TetaLogo className="w-6 h-6 text-emerald-500" />
                        )}
                      </motion.div>
                      <div className={cn(
                        "flex-1 space-y-3 min-w-0",
                        msg.role === 'user' ? "text-right" : ""
                      )}>
                        <div className={cn(
                          "prose prose-invert max-w-none text-[15px] leading-relaxed",
                          msg.role === 'user' 
                            ? "glass-card p-4 md:p-6 rounded-2xl md:rounded-3xl inline-block text-left border border-white/5 shadow-2xl preserve-3d" 
                            : "p-0 md:p-2"
                        )}>
                          <Markdown
                            components={{
                              img: ({ src, alt }) => (
                                <motion.div 
                                  whileHover={{ scale: 1.05, rotateY: 5, translateZ: 20 }}
                                  className="relative group mt-6 md:mt-8 preserve-3d"
                                >
                                  <img 
                                    src={src} 
                                    alt={alt} 
                                    className="rounded-3xl border border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.5)] max-w-full h-auto" 
                                    referrerPolicy="no-referrer"
                                  />
                                  <a 
                                    href={src} 
                                    download="teta-generated.png"
                                    className="absolute top-6 right-6 p-3 bg-black/60 backdrop-blur-2xl rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-emerald-500 hover:text-black shadow-2xl"
                                  >
                                    <Download className="w-5 h-5" />
                                  </a>
                                </motion.div>
                              )
                            }}
                          >
                            {msg.content}
                          </Markdown>
                        </div>

                        {/* 3D CAD & Blender Quick Actions for Model responses */}
                        {msg.role === 'model' && (is3DMode || msg.content.includes('three.min.js') || msg.content.includes('CAD & Blender')) && (
                          <div className="mt-3 p-3.5 rounded-2xl bg-neutral-950/80 border border-emerald-500/20 flex flex-wrap items-center justify-between gap-3 shadow-lg">
                            <div className="flex items-center gap-2.5">
                              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                <Box className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="text-[11px] font-black uppercase tracking-wider text-white flex items-center gap-2">
                                  <span>3D Model Ready for CAD & Blender</span>
                                  <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 text-[9px]">1-Click Export</span>
                                </div>
                                <div className="text-[10px] text-neutral-400">
                                  Download native AutoCAD (.dxf) & Blender (.py / .obj) files
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <button
                                onClick={handleDownloadBlenderQuick}
                                className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500 hover:text-black text-amber-300 border border-amber-500/30 text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-md"
                                title="Download Blender Python Script (.py)"
                              >
                                <Box className="w-3.5 h-3.5" />
                                Blender (.py)
                              </button>
                              <button
                                onClick={handleDownloadAutoCadQuick}
                                className="px-3 py-1.5 rounded-xl bg-sky-500/15 hover:bg-sky-500 hover:text-black text-sky-300 border border-sky-500/30 text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-md"
                                title="Download Autodesk AutoCAD File (.dxf)"
                              >
                                <Compass className="w-3.5 h-3.5" />
                                AutoCAD (.dxf)
                              </button>
                              <button
                                onClick={openExportFor3D}
                                className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500 hover:text-black text-emerald-300 border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-md"
                                title="Open Full 3D CAD & Blender Studio Modal"
                              >
                                <FolderDown className="w-3.5 h-3.5" />
                                CAD Suite
                              </button>
                            </div>
                          </div>
                        )}

                        {msg.role === 'model' && msg.content && !msg.content.includes('![Generated Image]') && (
                          <motion.button 
                            whileHover={{ scale: 1.1, x: 5 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => speak(msg.content)}
                            className="p-2 text-neutral-500 hover:text-emerald-500 transition-all bg-white/5 rounded-lg border border-transparent hover:border-white/5 shadow-lg"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </motion.button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                  {isLoading && (
                    <div className="flex gap-8">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                        <TetaLogo className="w-5 h-5 text-emerald-500 animate-pulse" />
                      </div>
                      <ThinkingAnimation />
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-3 md:p-10 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A] to-transparent perspective-1000">
          <div className="max-w-4xl mx-auto relative flex flex-col gap-3">
            {selectedImage && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="relative inline-flex items-center gap-3 p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl group self-start shadow-xl"
              >
                <img 
                  src={selectedImage} 
                  alt="Selected reference" 
                  className="w-14 h-14 md:w-16 md:h-16 object-cover rounded-xl border border-emerald-500/40 shadow-xl"
                />
                <div className="text-left pr-6">
                  <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider flex items-center gap-1">
                    {is3DMode ? '🖼️ Photo Reference Loaded for 3D Modeling' : '📸 Screenshot Loaded for Exact Clone'}
                  </span>
                  <p className="text-[11px] text-neutral-300 font-medium max-w-xs truncate">
                    {is3DMode ? 'Tetagpt will deconstruct anatomy, proportions, geometry & textures into 3D' : 'Ready to replicate layout, typography, colors & interactive components'}
                  </p>
                </div>
                <button 
                  onClick={() => setSelectedImage(null)}
                  className="absolute -top-2 -right-2 p-1 bg-red-500 hover:bg-red-400 text-white rounded-full shadow-lg"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            )}

            {isCloneMode && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-2 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/5 shadow-2xl overflow-x-auto no-scrollbar scroll-smooth"
              >
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900/50 rounded-xl border border-white/5 shrink-0">
                  <span className="text-[10px] font-black uppercase text-neutral-400 tracking-widest">Clone Target:</span>
                  <button
                    type="button"
                    onClick={() => setPreviewDevice('desktop')}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all",
                      previewDevice === 'desktop' ? "bg-emerald-500 text-black shadow-md" : "text-neutral-400 hover:text-white"
                    )}
                  >
                    Website Clone
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewDevice('mobile')}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all",
                      previewDevice === 'mobile' ? "bg-emerald-500 text-black shadow-md" : "text-neutral-400 hover:text-white"
                    )}
                  >
                    Mobile App Clone
                  </button>
                </div>
                <label className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30 shrink-0 text-[10px] font-black uppercase tracking-wider transition-all">
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  <Camera className="w-3.5 h-3.5" />
                  <span>Upload Screenshot</span>
                </label>
              </motion.div>
            )}
            
            {is3DMode && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-2 p-2.5 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/5 shadow-2xl"
              >
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth">
                  {/* Photo Reference Upload Button */}
                  <label className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 rounded-xl border border-emerald-500/30 shrink-0 text-[10px] font-black uppercase tracking-wider transition-all shadow-md">
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    <Camera className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Upload Photo / Character Reference</span>
                  </label>

                  <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-900/50 rounded-xl border border-white/5 shrink-0">
                    <span className="text-[10px] font-black uppercase text-neutral-400 tracking-widest hidden xs:inline">Type:</span>
                    <button 
                      type="button"
                      onClick={() => setThreeDTarget('standalone')}
                      className={cn(
                        "px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all",
                        threeDTarget === 'standalone' ? "bg-emerald-500 text-black shadow-md" : "text-neutral-400 hover:text-white"
                      )}
                    >
                      Character / Scene
                    </button>
                    <button 
                      type="button"
                      onClick={() => setThreeDTarget('game')}
                      className={cn(
                        "px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all",
                        threeDTarget === 'game' ? "bg-emerald-500 text-black shadow-md" : "text-neutral-400 hover:text-white"
                      )}
                    >
                      Game Asset
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-500/10 rounded-xl border border-sky-500/20 shrink-0 text-sky-400 text-[10px] font-black uppercase tracking-wider">
                    <Compass className="w-3.5 h-3.5 text-sky-400" />
                    <span>AutoCAD & Blender Ready</span>
                  </div>
                </div>

                {/* Quick 3D Inspiration Starters */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
                  <span className="text-[9px] font-black uppercase text-neutral-500 tracking-wider shrink-0 pl-1">Ideas:</span>
                  <button
                    type="button"
                    onClick={() => setInput("A detailed 3D cyberpunk samurai warrior character with a demon kabuto helmet, glowing cyan optical visor, segmented carbon-fiber chest armor, dual shoulder pauldrons, articulated gauntlets, and holding a glowing energy katana on an illuminated pedestal stage.")}
                    className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-emerald-500/20 hover:text-emerald-300 text-neutral-400 text-[10px] font-medium tracking-wide whitespace-nowrap transition-all border border-white/5 hover:border-emerald-500/30 shrink-0"
                  >
                    🦸 Cyber Samurai
                  </button>
                  <button
                    type="button"
                    onClick={() => setInput("An armored heavy assault sci-fi mech robot with dual shoulder-mounted missile pods, a central glowing plasma reactor core, articulated hydraulic bipedal legs, heavy steel gauntlets, and rear propulsion thrusters.")}
                    className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-emerald-500/20 hover:text-emerald-300 text-neutral-400 text-[10px] font-medium tracking-wide whitespace-nowrap transition-all border border-white/5 hover:border-emerald-500/30 shrink-0"
                  >
                    🤖 Heavy Assault Mech
                  </button>
                  <button
                    type="button"
                    onClick={() => setInput("A mythical emerald elemental dragon creature with jagged obsidian horns, glowing amber eyes, segmented spinal ridges, wide membrane wings, articulated claws, and a barbed tail perched on a cracked magma rock pedestal.")}
                    className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-emerald-500/20 hover:text-emerald-300 text-neutral-400 text-[10px] font-medium tracking-wide whitespace-nowrap transition-all border border-white/5 hover:border-emerald-500/30 shrink-0"
                  >
                    🐉 Elemental Dragon
                  </button>
                  <button
                    type="button"
                    onClick={() => setInput("A legendary sci-fi energy blade katana with a luminous cyan plasma core, faceted titanium crossguard with embedded power gem, textured braided hilt grip, and displayed on a futuristic floating weapon rack.")}
                    className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-emerald-500/20 hover:text-emerald-300 text-neutral-400 text-[10px] font-medium tracking-wide whitespace-nowrap transition-all border border-white/5 hover:border-emerald-500/30 shrink-0"
                  >
                    ⚔️ Legendary Energy Blade
                  </button>
                  <button
                    type="button"
                    onClick={() => setInput("A sleek aerodynamic high-speed cyber hovercraft vehicle with dual rear jet thrusters, glowing cyan cockpit glass canopy, rear spoiler wings, and angular stealth armor plating.")}
                    className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-emerald-500/20 hover:text-emerald-300 text-neutral-400 text-[10px] font-medium tracking-wide whitespace-nowrap transition-all border border-white/5 hover:border-emerald-500/30 shrink-0"
                  >
                    🏎️ Cyber Hovercraft
                  </button>
                </div>
              </motion.div>
            )}

            <motion.form 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              onSubmit={sendMessage}
              className="relative group preserve-3d"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-[2rem] blur opacity-10 group-focus-within:opacity-20 transition duration-1000" />
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder={is3DMode ? "Upload character photo or describe in detail (e.g. Cyberpunk samurai with glowing katana, anime hero, mech warrior)..." : isCloneMode ? "Enter domain to clone (e.g. apple.com, stripe.com) or upload screenshot..." : isGameMode ? "Describe game mechanics (e.g. Retro Space shooter, Platformer)..." : "Ask Tetagpt to build..."}
                rows={1}
                className="w-full bg-neutral-900/80 backdrop-blur-3xl border border-white/5 rounded-[2rem] py-4 md:py-5 pl-12 sm:pl-14 md:pl-16 pr-20 sm:pr-24 md:pr-28 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all resize-none text-sm md:text-base min-h-[56px] md:min-h-[64px] max-h-48 shadow-2xl text-white"
              />
              <div className="absolute left-2.5 sm:left-3 md:left-4 bottom-2 md:bottom-4">
                <label className="cursor-pointer group/upload">
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  <div className="p-2 md:p-2.5 rounded-xl bg-white/5 text-neutral-500 group-hover/upload:text-emerald-500 transition-all">
                    <Paperclip className="w-4 h-4 md:w-5 md:h-5" />
                  </div>
                </label>
              </div>
              <div className="absolute right-2 md:right-3 bottom-1.5 md:bottom-3 flex items-center gap-1 md:gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={toggleRecording}
                  className={cn(
                    "p-2 md:p-3 rounded-xl sm:rounded-2xl transition-all border shadow-lg",
                    isRecording ? "bg-red-500 text-white border-red-600 shadow-[0_0_20px_rgba(239,68,68,0.4)]" : "bg-white/5 text-neutral-400 border-white/5 hover:text-white"
                  )}
                >
                  {isRecording ? <MicOff className="w-3.5 h-3.5 md:w-5 md:h-5" /> : <Mic className="w-3.5 h-3.5 md:w-5 md:h-5" />}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className={cn(
                    "p-2 md:p-3 rounded-xl sm:rounded-2xl transition-all shadow-lg border",
                    input.trim() && !isLoading ? "bg-emerald-500 text-black border-emerald-600 shadow-[0_0_20px_rgba(16,185,129,0.3)]" : "bg-neutral-800 text-neutral-600 border-neutral-700"
                  )}
                >
                  <Send className="w-3.5 h-3.5 md:w-5 md:h-5" />
                </motion.button>
              </div>
            </motion.form>
            <p className="text-[10px] text-center mt-1 text-neutral-700 font-black uppercase tracking-[0.3em] opacity-40">
              TETA Intelligence Ready
            </p>
          </div>
        </div>
      </main>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettingsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="w-full max-w-lg bg-neutral-900 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.8)] relative"
            >
              <div className="p-6 md:p-8 border-b border-white/5 flex items-center justify-between bg-white/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                    <Settings className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <h3 className="font-black text-white text-base truncate uppercase tracking-wider">Engine Settings</h3>
                    <p className="text-[10px] text-neutral-400 font-semibold uppercase tracking-widest">Environment & Core Keys</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="p-2 hover:bg-white/5 rounded-full transition-all text-neutral-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 md:p-8 space-y-6">
                {/* Custom Key */}
                <div className="space-y-2">
                  <label className="block text-xs font-black uppercase tracking-widest text-neutral-400">Tetagpt API Key</label>
                  <div className="relative">
                    <input
                      type="password"
                      placeholder="Paste your Tetagpt API key..."
                      value={customApiKey}
                      onChange={(e) => setCustomApiKey(e.target.value)}
                      className="w-full bg-neutral-950 border border-white/5 rounded-2xl py-4 px-5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all font-mono"
                    />
                  </div>
                  <p className="text-[10px] text-neutral-500 leading-relaxed font-semibold">
                    Stored securely and only in your local browser history. Powers live AI generation, cloning, games, and 3D modeling.
                  </p>
                  <div className="flex gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        localStorage.setItem('teta_custom_api_key', customApiKey);
                        localStorage.setItem('teta_custom_gemini_key', customApiKey);
                        setIsStaticDeployment(false); // test with custom key
                        setTimeout(() => {
                          window.location.reload();
                        }, 500);
                      }}
                      className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-black py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                    >
                      Save API Key
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCustomApiKey('');
                        localStorage.removeItem('teta_custom_api_key');
                        localStorage.removeItem('teta_custom_gemini_key');
                        setTimeout(() => {
                          window.location.reload();
                        }, 500);
                      }}
                      className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all border border-white/5"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <hr className="border-white/5" />

                {/* Simulated Offline Mode Toggle */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-xs font-black uppercase tracking-widest text-neutral-400">Offline Simulator Only</label>
                      <p className="text-[10px] text-neutral-500 leading-relaxed max-w-[320px]">
                        Force all modes to work 100% offline using local AI model presets and immediate template responders.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const nextVal = !forceOffline;
                        setForceOffline(nextVal);
                        localStorage.setItem('teta_force_offline', nextVal ? 'true' : 'false');
                      }}
                      className={cn(
                        "w-12 h-6 rounded-full p-1 transition-all duration-300 shrink-0",
                        forceOffline ? "bg-emerald-500 flex justify-end" : "bg-neutral-800 flex justify-start border border-white/5"
                      )}
                    >
                      <motion.div layout className="w-4 h-4 rounded-full bg-white shadow-md animate-none" />
                    </button>
                  </div>
                </div>

                <hr className="border-white/5" />

                {/* Diagnostics Panel */}
                <div className="p-4 rounded-2xl bg-neutral-950 border border-white/5 space-y-2">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500">Diagnostics Telemetry</h4>
                  
                  <div className="grid grid-cols-2 gap-3 text-[10px] uppercase font-black tracking-wider">
                    <div className="space-y-0.5">
                      <span className="text-neutral-500">Host Mode:</span>
                      <p className="text-neutral-200">
                        {isStaticDeployment ? "Static Client Only (Netlify)" : "Full Stack Server (Node)"}
                      </p>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-neutral-500">Internet Hook:</span>
                      <p className={navigator.onLine ? "text-emerald-400" : "text-amber-500"}>
                        {navigator.onLine ? "● Connected" : "○ Disconnected"}
                      </p>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-neutral-500">API Resolver:</span>
                      <p className="text-neutral-200">
                        {forceOffline ? "Offline Sim Active" : (customApiKey ? "Direct User Key" : (isStaticDeployment ? "Offline Sim (No Key)" : "System Proxy Gateway"))}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
        onAuthSuccess={(u) => {
          setUser(u);
          setShowAuthModal(false);
        }} 
      />
      {/* Export & Run Locally Modal */}
      <ExportModal 
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        code={generatedCode}
        projectName={chats.find(c => c.id === currentChatId)?.title || 'Tetagpt Cosmic Project'}
        projectType={isGameMode ? 'game' : is3DMode ? '3d' : isCloneMode ? 'clone' : 'app'}
        domainOrSource={cloneSourceDomain || sourceUrl || undefined}
        defaultCategory={exportCategory}
      />
    </div>
  );
}

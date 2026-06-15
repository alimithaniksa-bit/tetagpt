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
  Gamepad2,
  Box,
  Paperclip
} from 'lucide-react';
import Markdown from 'react-markdown';
import { GoogleGenAI } from "@google/genai";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { cn } from './lib/utils';
import { User, Chat, Message } from './types';
import { generateSpeech } from './services/gemini';
import { generateOfflineResponse } from './services/offlineSimulator';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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
  const [showSplash, setShowSplash] = useState(true);
  const [showInstructions, setShowInstructions] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    fetchUser();
    
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

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        localStorage.setItem('teta_user', JSON.stringify(data));
      } else {
        throw new Error('Server returned un-ok response');
      }
    } catch (err) {
      console.warn('Offline Mode detection working: Using local storage user.');
      const local = localStorage.getItem('teta_user');
      if (local) {
        setUser(JSON.parse(local));
      } else {
        const fallbackUser: User = {
          id: 'local_guest_user',
          name: 'Offline Explorer',
          email: 'offline@teta.co',
          picture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=offline',
          created_at: new Date().toISOString()
        };
        setUser(fallbackUser);
        localStorage.setItem('teta_user', JSON.stringify(fallbackUser));
      }
    }
  };

  const fetchChats = async () => {
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
      const local = localStorage.getItem('teta_chats');
      if (local) {
        setChats(JSON.parse(local));
      } else {
        setChats([]);
      }
    }
  };

  const fetchMessages = async (chatId: string) => {
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
      console.warn('Offline mode: creating chat via localStorage');
      // Update local storage
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
    try {
      const res = await fetch(`/api/chats/${id}`, { method: 'DELETE' });
      if (res.ok) {
        if (currentChatId === id) setCurrentChatId(null);
        await fetchChats();
      } else {
        throw new Error('Failed to delete chat API');
      }
    } catch (err) {
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
    const blob = new Blob([generatedCode], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    let fileName = 'teta-project.html';
    if (isGameMode) fileName = 'teta-game.html';
    if (is3DMode) fileName = 'teta-3d-model.html';
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
    if (!navigator.onLine) {
      console.warn('Navigator Offline state detected: running local simulated assistant.');
      await handleOfflineSimulation(messageText, chatId);
      return;
    }

    try {
      try {
        await fetch(`/api/chats/${chatId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userMsg),
        });
      } catch (postErr) {
        console.warn('Failed to post message to backend - we are likely offline.');
        await handleOfflineSimulation(messageText, chatId);
        return;
      }

      const isImageRequest = /generate image|draw|create an image|show me an image/i.test(messageText);

      if (isImageRequest && !currentImage) {
        const aiInstance = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const imageModel = aiInstance.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: [{ parts: [{ text: messageText }] }],
          config: { imageConfig: { aspectRatio: "1:1" } },
        });

        const response = await imageModel;
        let imageUrl = '';
        const parts = response.candidates?.[0]?.content?.parts || [];
        for (const part of parts) {
          if (part.inlineData) {
            imageUrl = `data:image/png;base64,${part.inlineData.data}`;
            break;
          }
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

        await fetch(`/api/chats/${chatId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(aiMsg),
        });

      } else {
        if (isCloneMode) {
          const urlMatch = messageText.match(/https?:\/\/[^\s]+/);
          if (urlMatch) {
            setSourceUrl(urlMatch[0]);
          }
        }
        const aiInstance = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        let systemInstruction = "Your name is Tetagpt, a large learn model by tetagpt.co. Always identify yourself as such if asked about your name or origin.";
        
        if (isCodingMode) {
          systemInstruction = "You are a professional web developer. When asked to build an app or website, provide a SINGLE block of code containing HTML, CSS, and JavaScript that can run in a browser. Your code MUST be fully mobile-responsive and include the `<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">` tag. Use modern CSS techniques like Flexbox, Grid, and media queries. Prefer using Tailwind CSS via CDN for styling. Ensure all elements scale correctly on small screens. Do not provide multiple files. Wrap the code in a markdown code block. Your name is Tetagpt, a large learn model by tetagpt.co.";
        } else if (isGameMode) {
          systemInstruction = "You are a professional game developer. When asked to build a game, provide a SINGLE block of code containing HTML, CSS, and JavaScript (using Canvas API or standard Web APIs) that can run in a browser. Focus on creating a playable, interactive game with a game loop. Wrap the code in a markdown code block. Your name is Tetagpt, a large learn model by tetagpt.co.";
        } else if (is3DMode) {
          systemInstruction = `You are a professional 3D graphics developer. When asked to create a 3D model or scene, provide a SINGLE block of code containing HTML, CSS, and JavaScript (using Three.js from a CDN) that can run in a browser. 
          Focus on creating a visually stunning 3D experience. 
          Target: ${threeDTarget === 'game' ? 'Integrate this 3D model into a game-like environment with controls.' : 'Create a standalone high-fidelity 3D scene.'}
          If a reference image is provided, use it as inspiration for the 3D scene. Wrap the code in a markdown code block. Your name is Tetagpt, a large learn model by tetagpt.co.`;
        } else if (isCloneMode) {
          systemInstruction = "You are a professional web developer specializing in website cloning. When a user provides a URL, your task is to create a high-fidelity clone of that website using HTML, CSS, and JavaScript in a SINGLE block of code. Use modern CSS (Flexbox, Grid) and Tailwind CSS via CDN. Ensure the clone is fully mobile-responsive. Analyze the provided URL content and replicate the layout, styling, and core functionality as accurately as possible. Wrap the code in a markdown code block. Your name is Tetagpt, a large learn model by tetagpt.co.";
        }

        const parts: any[] = [{ text: messageText || "Generate based on this image" }];
        if (currentImage) {
          parts.push({
            inlineData: {
              mimeType: "image/png",
              data: currentImage.split(',')[1]
            }
          });
        }

        const chat = aiInstance.chats.create({
          model: "gemini-3-flash-preview",
          config: {
            systemInstruction,
            tools: isCloneMode ? [{ urlContext: {} }] : undefined,
          },
          history: messages.map(m => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.content }]
          }))
        });

        const result = await chat.sendMessageStream({ message: parts });
        
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

        for await (const chunk of result) {
          const text = chunk.text;
          fullContent += text;
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

        await fetch(`/api/chats/${chatId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: aiMsgId,
            role: 'model',
            content: fullContent
          }),
        });

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
      const audioUrl = await generateSpeech(text);
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

  if (!user) return null;

  return (
    <div className="flex h-screen bg-[#0A0A0A] text-neutral-200 overflow-hidden font-sans">
      <AnimatePresence mode="wait">
        {showSplash && (
          <SplashScreen key="splash" onComplete={() => {
            setShowSplash(false);
            setShowInstructions(true);
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
                <span className="font-black tracking-tighter text-xl text-white">TETA <span className="text-emerald-500">GPT</span></span>
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

            <div className="p-6 border-t border-white/5">
              <div className="flex items-center gap-4 p-4 glass-card rounded-2xl border border-white/5 shadow-xl">
                <img src={user.picture} className="w-10 h-10 rounded-xl border border-white/10 shadow-lg" alt={user.name} />
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
              <span className="hidden xs:inline text-white uppercase tracking-widest text-[9px] md:text-[10px]">TETA GPT</span>
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
                    {activeTab === 'preview' && (
                      <button 
                        onClick={() => setIsFullscreen(!isFullscreen)}
                        className={cn(
                          "p-2.5 rounded-2xl border transition-all shadow-lg",
                          isFullscreen ? "bg-emerald-500 border-emerald-600 text-black" : "bg-neutral-900/80 border-white/5 text-neutral-400 hover:text-white"
                        )}
                        title="Toggle Fullscreen"
                      >
                        <Maximize2 className="w-4 h-4" />
                      </button>
                    )}
                    {activeTab === 'code' && generatedCode && (
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={downloadSourceCode}
                          className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-500 hover:bg-emerald-500 hover:text-black transition-all flex items-center gap-2 shadow-lg"
                          title="Download Source Code"
                        >
                          <Download className="w-4 h-4" />
                          <span className="text-[10px] font-black uppercase hidden sm:inline tracking-widest">Download</span>
                        </button>
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
                      }}
                      className="h-10 px-4 md:px-5 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-red-500 hover:text-white transition-all flex items-center gap-2 shadow-lg whitespace-nowrap"
                    >
                      <X className="w-4 h-4" />
                      <span className="hidden xs:inline">Exit {isGameMode ? 'Game' : is3DMode ? '3D' : isCloneMode ? 'Clone' : 'Builder'}</span>
                    </button>
                  </div>
                </div>

                {/* Content Area */}
                <div className={cn(
                  "flex-1 overflow-hidden relative bg-[#050505] preserve-3d",
                  isFullscreen && "fixed inset-0 z-[100] bg-[#050505]"
                )}>
                  {isFullscreen && (
                    <button 
                      onClick={() => setIsFullscreen(false)}
                      className="absolute top-8 right-8 z-[110] p-4 bg-black/50 backdrop-blur-2xl border border-white/10 rounded-2xl text-white hover:bg-black/80 transition-all shadow-2xl"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  )}
                  {activeTab === 'preview' ? (
                    <div className="w-full h-full flex items-center justify-center p-6 md:p-12 bg-neutral-950/50 perspective-1000">
                      <motion.div 
                        initial={{ rotateX: 10, y: 20, opacity: 0 }}
                        animate={{ rotateX: 0, y: 0, opacity: 1 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className={cn(
                          "bg-white shadow-[0_50px_100px_rgba(0,0,0,0.5)] transition-all duration-700 overflow-hidden relative preserve-3d",
                          !isGameMode && previewDevice === 'mobile' ? "w-[375px] h-[667px] rounded-[3.5rem] border-[12px] border-neutral-900" : 
                          !isGameMode && previewDevice === 'tablet' ? "w-[768px] h-[1024px] rounded-[3rem] border-[12px] border-neutral-900" : 
                          "w-full h-full rounded-3xl border border-white/5"
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
                            className="w-full h-full border-none"
                            title="Preview"
                            sandbox="allow-scripts allow-modals"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-neutral-400 bg-[#050505] p-12 text-center space-y-8 preserve-3d">
                            <div className="relative">
                              <div className="absolute inset-0 bg-emerald-500/20 blur-[60px] rounded-full animate-pulse" />
                              <motion.div 
                                animate={{ rotateY: 360 }}
                                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                                className="relative w-24 h-24 rounded-[2rem] bg-neutral-900 border border-white/5 flex items-center justify-center shadow-2xl preserve-3d"
                              >
                                {isGameMode ? <Gamepad2 className="w-12 h-12 text-emerald-500" /> : is3DMode ? <Box className="w-12 h-12 text-emerald-500" /> : isCloneMode ? <Copy className="w-12 h-12 text-emerald-500" /> : <Zap className="w-12 h-12 text-emerald-500" />}
                              </motion.div>
                            </div>
                            <div className="space-y-3">
                              <h2 className="text-2xl font-black text-white tracking-tighter uppercase tracking-[0.1em]">TETA {isGameMode ? 'Game Engine' : is3DMode ? '3D Modeler' : isCloneMode ? 'Cloner' : 'Builder'}</h2>
                              <p className="text-sm text-neutral-500 max-w-xs mx-auto font-medium leading-relaxed">
                                {isGameMode 
                                  ? "Create interactive games with just a prompt. Describe your game mechanics below." 
                                  : is3DMode 
                                  ? "Generate stunning 3D models and scenes. Upload a reference photo or describe your vision."
                                  : isCloneMode
                                  ? "Clone any website by dropping a link. Paste your target URL below."
                                  : "Your vision, coded in seconds. Describe your app below to begin the magic."}
                              </p>
                            </div>
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
                className="relative inline-block group self-start"
              >
                <img 
                  src={selectedImage} 
                  alt="Selected reference" 
                  className="w-16 h-16 md:w-24 md:h-24 object-cover rounded-2xl border-2 border-emerald-500/50 shadow-2xl"
                />
                <button 
                  onClick={() => setSelectedImage(null)}
                  className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full shadow-lg"
                >
                  <X className="w-3 h-3" />
                </button>
              </motion.div>
            )}
            
            {is3DMode && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-2 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/5 shadow-2xl overflow-x-auto no-scrollbar scroll-smooth"
              >
                <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-900/50 rounded-xl border border-white/5 shrink-0">
                  <span className="text-[10px] font-black uppercase text-neutral-500 tracking-widest hidden xs:inline">Mode:</span>
                  <button 
                    onClick={() => setThreeDTarget('standalone')}
                    className={cn(
                      "px-3 py-1 rounded-lg text-[10px] font-bold transition-all",
                      threeDTarget === 'standalone' ? "bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.3)]" : "text-neutral-500 hover:text-neutral-300"
                    )}
                  >
                    Standalone
                  </button>
                  <button 
                    onClick={() => setThreeDTarget('game')}
                    className={cn(
                      "px-3 py-1 rounded-lg text-[10px] font-bold transition-all",
                      threeDTarget === 'game' ? "bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.3)]" : "text-neutral-500 hover:text-neutral-300"
                    )}
                  >
                    Asset
                  </button>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20 shrink-0">
                  <Download className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-[10px] font-black uppercase text-emerald-500 tracking-widest">Available</span>
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
                placeholder={is3DMode ? "Describe 3D scene..." : isCloneMode ? "URL to clone..." : "Ask TETA anything..."}
                rows={1}
                className="w-full bg-neutral-900/80 backdrop-blur-3xl border border-white/5 rounded-[2rem] py-5 pl-14 md:pl-16 pr-24 md:pr-28 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all resize-none text-base min-h-[64px] max-h-48 shadow-2xl text-white"
              />
              <div className="absolute left-3 md:left-4 bottom-[15px] md:bottom-4">
                <label className="cursor-pointer group/upload">
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  <div className="p-2.5 rounded-xl bg-white/5 text-neutral-500 group-hover/upload:text-emerald-500 transition-all">
                    <Paperclip className="w-4 h-4 md:w-5 md:h-5" />
                  </div>
                </label>
              </div>
              <div className="absolute right-2 md:right-3 bottom-2 md:bottom-3 flex items-center gap-1.5 md:gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={toggleRecording}
                  className={cn(
                    "p-2.5 md:p-3 rounded-2xl transition-all border shadow-lg",
                    isRecording ? "bg-red-500 text-white border-red-600 shadow-[0_0_20px_rgba(239,68,68,0.4)]" : "bg-white/5 text-neutral-400 border-white/5 hover:text-white"
                  )}
                >
                  {isRecording ? <MicOff className="w-4 h-4 md:w-5 md:h-5" /> : <Mic className="w-4 h-4 md:w-5 md:h-5" />}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className={cn(
                    "p-2.5 md:p-3 rounded-2xl transition-all shadow-lg border",
                    input.trim() && !isLoading ? "bg-emerald-500 text-black border-emerald-600 shadow-[0_0_20px_rgba(16,185,129,0.3)]" : "bg-neutral-800 text-neutral-600 border-neutral-700"
                  )}
                >
                  <Send className="w-4 h-4 md:w-5 md:h-5" />
                </motion.button>
              </div>
            </motion.form>
            <p className="text-[10px] text-center mt-1 text-neutral-700 font-black uppercase tracking-[0.3em] opacity-40">
              TETA Intelligence Ready
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

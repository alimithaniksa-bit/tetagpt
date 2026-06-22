import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, 
  Gamepad2, 
  Box, 
  Copy, 
  Plus, 
  Play, 
  ArrowRight, 
  Settings, 
  Shield, 
  Workflow, 
  Cpu, 
  Layers, 
  Monitor, 
  CheckCircle, 
  ExternalLink,
  Sparkles,
  Waves
} from 'lucide-react';
import { cn } from '../lib/utils';

interface LandingPageProps {
  onGetStarted: (initialPrompt?: string, targetMode?: string) => void;
  onOpenSettings: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onOpenSettings }) => {
  const [activeTab, setActiveTab] = useState<'builder' | 'game' | '3d' | 'clone'>('builder');
  const [promptInput, setPromptInput] = useState('');
  const [typedFeatureIndex, setTypedFeatureIndex] = useState(0);
  const [typingText, setTypingText] = useState('');

  const featuredPrompts = [
    { text: "Build a beautiful cryptocurrency dashboard with real-time trading charts...", mode: "builder" },
    { text: "Design an 80s arcade space shooter game with a high score tracker...", mode: "game" },
    { text: "Model an interactive spinning 3D galaxy cluster with OrbitControls...", mode: "3d" },
    { text: "Clone the visual aesthetic and responsive layout of Apple Store landing...", mode: "clone" }
  ];

  // Typing effect for the search placeholder
  useEffect(() => {
    let active = true;
    let index = 0;
    let isDeleting = false;
    let text = '';
    const currentFullText = featuredPrompts[typedFeatureIndex].text;

    const tick = () => {
      if (!active) return;
      const fullText = featuredPrompts[typedFeatureIndex].text;

      if (!isDeleting) {
        text = fullText.substring(0, index + 1);
        index++;
        if (text === fullText) {
          isDeleting = true;
          setTimeout(tick, 3000); // Wait before starting delete
          return;
        }
      } else {
        text = fullText.substring(0, index - 1);
        index--;
        if (text === '') {
          isDeleting = false;
          setTypedFeatureIndex((prev) => (prev + 1) % featuredPrompts.length);
          setTimeout(tick, 500);
          return;
        }
      }

      setTypingText(text);
      const delta = isDeleting ? 30 : 60;
      setTimeout(tick, delta);
    };

    tick();
    return () => {
      active = false;
    };
  }, [typedFeatureIndex]);

  const handleLaunchWithPrompt = (textToLaunch?: string, mode?: string) => {
    onGetStarted(textToLaunch || promptInput, mode);
  };

  const tabsInfo = [
    {
      id: 'builder' as const,
      label: 'Builder Mode',
      icon: <Zap className="w-5 h-5 text-emerald-400" />,
      tagline: 'Generate rich SaaS pages, utilities & multi-view apps',
      desc: 'Formulate bespoke UI flows, analytics grids, custom tools, and client-side database integrations fully wired with interactive states.',
      color: 'border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10'
    },
    {
      id: 'game' as const,
      label: 'Game Mode',
      icon: <Gamepad2 className="w-5 h-5 text-purple-400" />,
      tagline: 'Craft complete interactive 2D canvas retro games',
      desc: 'Build arcade physics tables, shooting simulators, obstacle runs, or puzzles using state loops and sound synthesizers perfectly packaged.',
      color: 'border-purple-500/20 bg-purple-500/5 hover:bg-purple-500/10'
    },
    {
      id: '3d' as const,
      label: '3D Mode',
      icon: <Box className="w-5 h-5 text-blue-400" />,
      tagline: 'Render gorgeous WebGL stages and 3D scenes',
      desc: 'Initialize customized Three.js configurations, coordinate controls, apply lighting matrices, and implement orbital animation timelines.',
      color: 'border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10'
    },
    {
      id: 'clone' as const,
      label: 'Clone Mode',
      icon: <Copy className="w-5 h-5 text-orange-400" />,
      tagline: 'Deconstruct and replicate existing layouts',
      desc: 'Paste any reference URL to reverse-engineer its components, colors, spacing ratios, and structural sections into standard Tailwind layers.',
      color: 'border-orange-500/20 bg-orange-500/5 hover:bg-orange-500/10'
    }
  ];

  return (
    <div className="w-full min-h-screen bg-[#070707] text-white overflow-x-hidden font-sans relative selection:bg-emerald-500 selection:text-black">
      
      {/* Background Orbs & Cosmic Grid Pattern */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Ambient glows */}
        <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] bg-emerald-500/5 blur-[200px] rounded-full pointer-events-none" />
        <div className="absolute top-[40%] right-[-5%] w-[500px] h-[500px] bg-purple-500/5 blur-[180px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[10%] left-[-10%] w-[700px] h-[700px] bg-blue-500/5 blur-[220px] rounded-full pointer-events-none" />
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:4rem_4rem]" />
        {/* Subtle horizontal mask */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#070707] via-transparent to-[#070707] opacity-80" />
      </div>

      {/* Modern Header / Navigation Bar */}
      <header className="fixed top-0 inset-x-0 h-20 bg-[#070707]/80 backdrop-blur-md border-b border-white/5 z-50 flex items-center justify-between px-6 md:px-12">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.15)] animate-pulse">
            <svg className="w-6 h-6 text-emerald-500" viewBox="0 0 100 100" fill="none">
              <polygon points="50,15 85,35 85,75 50,95 15,75 15,35" stroke="currentColor" strokeWidth="8" />
              <polygon points="50,25 75,40 75,70 50,85 25,70 25,40" stroke="currentColor" strokeWidth="4" strokeDasharray="5,2" />
              <circle cx="50" cy="55" r="10" fill="currentColor" />
            </svg>
          </div>
          <div>
            <span className="font-black text-xl tracking-tight text-white uppercase">TETA<span className="text-emerald-500">GPT</span></span>
            <span className="block text-[8px] tracking-[0.2em] font-bold text-neural-500 text-neutral-400">COSMIC BUILDER</span>
          </div>
        </div>

        {/* Navigation Middle Links */}
        <nav className="hidden lg:flex items-center gap-8 text-xs font-black uppercase tracking-widest text-neutral-400">
          <a href="#features" className="hover:text-emerald-400 transition-colors">Workspace Modes</a>
          <a href="#how-it-works" className="hover:text-emerald-400 transition-colors">Compilation Engine</a>
          <a href="#showcase" className="hover:text-emerald-400 transition-colors">Showcase Hub</a>
          <button onClick={onOpenSettings} className="hover:text-emerald-400 transition-colors flex items-center gap-1.5">
            <Settings className="w-3.5 h-3.5 text-emerald-500" /> API Settings
          </button>
        </nav>

        {/* Action Button */}
        <div className="flex items-center gap-3">
          <button 
            onClick={onOpenSettings} 
            className="lg:hidden p-2 bg-neutral-900 border border-white/5 rounded-xl text-neutral-400 hover:text-white"
            title="API Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
          <button 
            onClick={() => handleLaunchWithPrompt()}
            className="group relative inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black uppercase tracking-widest transition-all shadow-[0_10px_35px_rgba(16,185,129,0.2)]"
          >
            Launch Builder
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 pt-24 md:pt-32 pb-16 md:pb-24 px-4 sm:px-6 md:px-12 max-w-7xl mx-auto space-y-24 md:space-y-36">
        
        {/* HERO SECTION */}
        <section className="text-center space-y-8 md:space-y-10 max-w-4xl mx-auto py-6 md:py-12 relative">
          
          {/* Sparkly Launch Tag */}
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400 mx-auto"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Empowered by Gemini 2.5 & 3-Flash Engines
          </motion.div>

          {/* Big Impressive Headline */}
          <div className="space-y-4">
            <motion.h1 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, type: "spring" }}
              className="text-4xl sm:text-5xl md:text-8xl font-extrabold tracking-tighter uppercase leading-[0.9] text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-neutral-400"
            >
              The Full-Stack <br />
              <span className="text-emerald-500">Autonomous AI</span> <br />
              Creation Engine
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              transition={{ delay: 0.4, duration: 1 }}
              className="text-neutral-400 text-xs sm:text-sm md:text-lg max-w-2xl mx-auto font-medium leading-relaxed px-2"
            >
              Transform simple English instructions into production-ready full-stack layouts, 2D arcade physics engines, interactive Three.js 3D levels, and stunning frontend clones.
            </motion.p>
          </div>

          {/* Direct Sandbox Interactive Input bar */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="w-full max-w-3xl mx-auto flex flex-col sm:relative mt-6 md:mt-8 select-none px-2"
          >
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                <Zap className="w-5 h-5 text-emerald-500" />
              </div>
              <input
                type="text"
                value={promptInput}
                onChange={(e) => setPromptInput(e.target.value)}
                placeholder={typingText || "Describe your digital dream layout..."}
                className="w-full py-4 sm:py-5 pl-14 pr-5 sm:pr-44 bg-neutral-900/60 border border-white/5 rounded-2xl sm:rounded-3xl text-sm md:text-base text-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/30 transition-all placeholder:text-neutral-600 font-medium font-mono shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleLaunchWithPrompt();
                }}
              />
            </div>
            <div className="mt-3 sm:mt-0 sm:absolute sm:inset-y-2 sm:right-2">
              <button 
                onClick={() => handleLaunchWithPrompt()}
                className="w-full sm:h-full py-3.5 sm:py-0 px-6 bg-emerald-500 hover:bg-emerald-400 text-black rounded-xl sm:rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shrink-0 group shadow-md"
              >
                Assemble App
                <Play className="w-3.5 h-3.5 fill-current" />
              </button>
            </div>
          </motion.div>

          {/* Prompt quick tags */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            transition={{ delay: 0.8 }}
            className="flex flex-wrap items-center justify-center gap-2 text-[10px] font-black uppercase tracking-wider text-neutral-500 px-2"
          >
            <span>Try these templates:</span>
            {featuredPrompts.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setPromptInput(p.text);
                  handleLaunchWithPrompt(p.text, p.mode);
                }}
                className="px-2.5 py-1 sm:py-1.5 rounded-lg border border-white/5 bg-white/5 hover:bg-emerald-500/10 hover:border-emerald-500/20 text-neutral-400 hover:text-emerald-400 transition-all font-mono text-[9px] sm:text-[10px]"
              >
                {p.mode === 'builder' ? '📁' : p.mode === 'game' ? '👾' : p.mode === '3d' ? '🪐' : '📋'} {p.text.substring(0, window.innerWidth < 640 ? 15 : 30)}...
              </button>
            ))}
          </motion.div>

          {/* Call to actions other link */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-[11px] font-semibold uppercase tracking-widest text-neutral-400">
            <span className="flex items-center gap-1.5"><Shield className="w-4 h-4 text-emerald-500" /> Stored locally</span>
            <span className="flex items-center gap-1.5"><Cpu className="w-4 h-4 text-purple-400" /> Ultra-low Latency</span>
            <span className="flex items-center gap-1.5"><Workflow className="w-4 h-4 text-blue-400" /> Multi-engine Auto-compile</span>
          </div>

        </section>

        {/* WORKSPACE MODES & PREVIEW SHOWCASE */}
        <section id="features" className="space-y-10 md:space-y-14">
          <div className="text-center space-y-3 px-2">
            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-emerald-500">Unmatched Modality</h2>
            <p className="text-2xl sm:text-3xl md:text-5xl font-black tracking-tight text-white uppercase">Engineered for absolute creation</p>
            <p className="text-xs sm:text-sm text-neutral-400 max-w-xl mx-auto font-medium">Select your specialization matrix. Every engine compile runs safely in an isolated, sandboxed environment.</p>
          </div>

          {/* Tabs Selector Side and Showcase on the right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-stretch" id="showcase">
            
            {/* Tabs List (5-cols) */}
            <div className="lg:col-span-5 flex flex-col justify-center gap-3 sm:gap-4 px-2">
              {tabsInfo.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border text-left transition-all duration-300 flex items-start gap-3 sm:gap-4 group/item",
                      isActive 
                        ? "bg-white/5 border-white/10 shadow-[0_15px_30px_rgba(0,0,0,0.6)]" 
                        : "bg-transparent border-transparent text-neutral-400 hover:text-white"
                    )}
                  >
                    <div className={cn(
                      "p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border shrink-0 transition-all",
                      isActive ? "bg-[#0c0c0c] border-white/10 shadow-inner" : "bg-white/5 border-transparent group-hover/item:border-white/5"
                    )}>
                      {tab.icon}
                    </div>
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-xs sm:text-sm md:text-base text-white tracking-tight uppercase">{tab.label}</span>
                        {isActive && <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />}
                      </div>
                      <p className="text-[9px] sm:text-[10px] text-neutral-400 font-bold uppercase tracking-wider">{tab.tagline}</p>
                      <AnimatePresence>
                        {isActive && (
                          <motion.p 
                             initial={{ opacity: 0, height: 0 }}
                             animate={{ opacity: 0.7, height: "auto" }}
                             exit={{ opacity: 0, height: 0 }}
                             className="text-[11px] sm:text-xs text-neutral-300 leading-relaxed font-semibold pt-2"
                          >
                            {tab.desc}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Showcase Visualizer Panel (7-cols) */}
            <div className="lg:col-span-7 flex flex-col justify-center px-2">
              <div className="relative w-full aspect-square sm:aspect-[4/3] bg-neutral-950 rounded-[1.5rem] sm:rounded-[2.5rem] border border-white/10 overflow-hidden shadow-[0_45px_100px_rgba(0,0,0,0.8)] flex flex-col">
                
                {/* Visualizer header / window chrome */}
                <div className="h-12 sm:h-14 border-b border-white/5 bg-[#0b0b0b] px-4 sm:px-6 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-rose-500/50" />
                    <span className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-amber-500/50" />
                    <span className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-emerald-500/50" />
                    <span className="text-[8px] sm:text-[10px] text-neutral-500 font-mono pl-2 sm:pl-4 leading-none uppercase tracking-widest flex items-center gap-1.5">
                      <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      SYSTEM_PREVIEW://{activeTab}_pipeline_active
                    </span>
                  </div>
                  <div className="text-[8px] sm:text-[10px] bg-white/5 text-neutral-400 px-2 sm:px-3 py-0.5 sm:py-1 rounded-md border border-white/5 uppercase tracking-widest font-mono">
                    Sandbox Active
                  </div>
                </div>

                {/* Simulated Content Frames */}
                <div className="flex-1 p-8 overflow-hidden relative flex flex-col justify-center items-center">
                  
                  {activeTab === 'builder' && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="w-full h-full flex flex-col gap-4 justify-between"
                    >
                      {/* Code Terminal Output simulator */}
                      <div className="flex-1 rounded-2xl bg-black border border-white/5 p-5 font-mono text-[10px] md:text-xs text-neutral-300 space-y-3 overflow-hidden shadow-inner relative">
                        <div className="absolute top-3 right-3 text-[8px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded uppercase font-bold tracking-widest">Compiler</div>
                        <p className="text-emerald-500 font-black">❯ npx vite-bundle build</p>
                        <p className="text-neutral-500">[System] Compiling source tree with modules...</p>
                        <p className="text-neutral-300 text-[11px] leading-relaxed select-all">
                          <span className="text-purple-400">import</span> React, &#123; useState &#125; <span className="text-purple-400">from</span> <span className="text-emerald-400">'react'</span>;<br/>
                          <span className="text-purple-400">import</span> &#123; LineChart, Tooltip, ResponsiveContainer &#125; <span className="text-purple-400">from</span> <span className="text-emerald-400">'recharts'</span>;<br/>
                          <span className="text-neutral-500">// Real-time state binding generated automatically ...</span>
                        </p>
                        <p className="text-emerald-500">✓ Bundle generated: dist/index.html (3.4MB)</p>
                      </div>

                      {/* Mock Render View */}
                      <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between shadow-lg">
                        <div className="space-y-1">
                          <span className="text-[8px] font-black uppercase text-neutral-500 tracking-wider">Module Status</span>
                          <p className="text-xs font-black uppercase text-white tracking-widest">Live Crypto Terminal Preview</p>
                        </div>
                        <button 
                          onClick={() => handleLaunchWithPrompt("Build a gorgeous cryptocurrency dashboard with real-time trading charts...", "builder")}
                          className="py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-black text-[10px] font-black uppercase tracking-widest rounded-xl transition-all"
                        >
                          Initialize Live Creator
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'game' && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="w-full h-full flex flex-col justify-between"
                    >
                      {/* Game preview simulator */}
                      <div className="flex-1 rounded-[2rem] bg-neutral-900 border-2 border-dashed border-white/10 flex flex-col items-center justify-center relative overflow-hidden group/canvas shadow-2xl">
                        
                        <div className="absolute top-4 left-4 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-full px-3 py-1 text-[8px] font-black tracking-widest uppercase">
                          👾 RETRO ARCADE SCREEN
                        </div>

                        {/* Pixel Art Grid canvas simulation */}
                        <div className="space-y-4 text-center">
                          <div className="relative inline-block w-16 h-16 bg-purple-500/10 border border-purple-500/20 rounded-2xl flex items-center justify-center animate-bounce">
                            <Gamepad2 className="w-8 h-8 text-purple-400" />
                          </div>
                          <div className="space-y-1">
                            <h4 className="text-xs font-black uppercase text-white tracking-widest">Interactive Game Loop</h4>
                            <p className="text-[10px] text-neutral-500 uppercase tracking-widest max-w-[250px] mx-auto leading-relaxed">
                              60FPS GameLoop, Custom Canvas Render, Audio Oscillators Synthesis.
                            </p>
                          </div>
                        </div>

                        {/* Controller keys UI simulation */}
                        <div className="absolute bottom-4 inset-x-0 flex justify-center gap-1.5">
                          <span className="px-2 py-1 bg-black/60 rounded text-[8px] font-mono border border-white/5 uppercase text-neutral-400">← Move Left</span>
                          <span className="px-2 py-1 bg-black/60 rounded text-[8px] font-mono border border-white/5 uppercase text-neutral-400">Space: Fire</span>
                          <span className="px-2 py-1 bg-black/60 rounded text-[8px] font-mono border border-white/5 uppercase text-neutral-400">→ Move Right</span>
                        </div>
                      </div>

                      <div className="pt-4 flex items-center justify-between">
                        <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Includes synthesizer audio feedback</span>
                        <button 
                          onClick={() => handleLaunchWithPrompt("Design an 80s arcade space shooter game with high score tracker...", "game")}
                          className="py-2.5 px-4 bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-purple-500/10 hover:shadow-purple-500/20"
                        >
                          Compile Game Mode
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === '3d' && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="w-full h-full flex flex-col justify-between"
                    >
                      {/* ThreeJS simulator container */}
                      <div className="flex-1 rounded-[2.5rem] bg-indigo-950/20 border border-indigo-500/10 flex items-center justify-center relative overflow-hidden">
                        
                        {/* Spinning 3D Orbit Simulator wires (Pure CSS visual) */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-48 h-48 rounded-full border-2 border-dashed border-indigo-500/10 animate-[spin_12s_linear_infinite]" />
                          <div className="absolute w-36 h-36 rounded-full border border-indigo-500/20 rotate-45 animate-[spin_8s_linear_infinite_reverse]" />
                          <div className="absolute w-24 h-24 rounded-full border-2 border-dashed border-indigo-500/30 rotate-12 animate-[spin_4s_linear_infinite]" />
                          
                          {/* Floating wireframe geometric gem shape */}
                          <div className="relative w-12 h-12 flex items-center justify-center">
                            <Box className="w-12 h-12 text-blue-400 animate-pulse" />
                          </div>
                        </div>

                        <div className="absolute top-4 right-4 text-[8px] bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full px-3 py-1 uppercase font-black tracking-widest">
                          WebGL Three.js Canvas
                        </div>
                      </div>

                      <div className="pt-4 flex items-center justify-between">
                        <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Orbital controls, fog & light matrices supported</span>
                        <button 
                          onClick={() => handleLaunchWithPrompt("Model an interactive spinning 3D galaxy cluster with OrbitControls...", "3d")}
                          className="py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20"
                        >
                          Launch 3D WebGL
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'clone' && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="w-full h-full flex flex-col justify-between"
                    >
                      {/* URL input field and structure clone wireframe simulation */}
                      <div className="flex-1 rounded-3xl bg-neutral-900 border border-white/5 p-6 space-y-4 flex flex-col justify-between">
                        
                        {/* URL input header */}
                        <div className="flex items-center gap-2.5 bg-neutral-950 p-2.5 rounded-2xl border border-white/5">
                          <span className="text-[10px] text-neutral-500 font-mono pl-2">Source URL:</span>
                          <div className="flex-1 text-xs text-neutral-300 font-mono truncate select-all">
                            https://example-brand.com/landing
                          </div>
                          <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 border border-amber-500/25 rounded text-[8px] font-bold uppercase shrink-0">Deconstructing</span>
                        </div>

                        {/* Visual breakdown wireframes */}
                        <div className="flex-1 grid grid-cols-12 gap-3 pt-2">
                          <div className="col-span-8 rounded-xl bg-white/5 border border-white/5 p-3 flex flex-col justify-between">
                            <span className="text-[8px] font-mono text-neutral-500 uppercase">Replicating Header Section</span>
                            <div className="w-full h-1 bg-neutral-700 rounded-full" />
                            <div className="w-3/4 h-1 bg-neutral-700 rounded-full" />
                          </div>
                          <div className="col-span-4 rounded-xl bg-dashed border-2 border-white/5 p-3 flex flex-col items-center justify-center text-center">
                            <Copy className="w-5 h-5 text-orange-400 animate-pulse" />
                            <span className="text-[6px] font-mono text-neutral-500 uppercase mt-1">Grid Structure</span>
                          </div>
                        </div>

                      </div>

                      <div className="pt-4 flex items-center justify-between">
                        <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Reconstruct styles, flexbox & custom grid divisions</span>
                        <button 
                          onClick={() => handleLaunchWithPrompt("Clone the visual aesthetic and responsive layout of Apple Store landing...", "clone")}
                          className="py-2.5 px-4 bg-orange-600 hover:bg-orange-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-orange-500/10 hover:shadow-orange-500/20"
                        >
                          Execute Cloner
                        </button>
                      </div>
                    </motion.div>
                  )}

                </div>
              </div>
            </div>

          </div>
        </section>

        {/* COMPILATION ENGINE AND HOW IT WORKS */}
        <section id="how-it-works" className="space-y-12 md:space-y-16">
          <div className="text-center space-y-3 px-2">
            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-cyan-400">Core Pipeline Orchestrator</h2>
            <p className="text-2xl sm:text-3xl md:text-5xl font-black tracking-tight text-white uppercase">The Compilation Lifecycle</p>
            <p className="text-xs sm:text-sm text-neutral-400 max-w-xl mx-auto font-medium">Watch your high-level natural instructions materialize step-by-step through our direct compilation pipelines.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 px-2">
            
            {/* Step 1 */}
            <div className="p-6 sm:p-8 bg-neutral-900/50 rounded-2xl sm:rounded-[2.5rem] border border-white/5 space-y-6 flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute top-4 right-6 text-5xl sm:text-6xl font-black text-white/5">01</div>
              <div className="space-y-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-xl sm:rounded-2xl flex items-center justify-center">
                  <Cpu className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
                </div>
                <h3 className="font-extrabold text-base sm:text-lg text-white uppercase tracking-tight">Direct Contextual Parsing</h3>
                <p className="text-xs text-neutral-400 leading-relaxed font-semibold">TetaGPT analyzes your query instructions, determines target architecture modes, and optimizes execution variables to construct the source layout blueprint.</p>
              </div>
              <div className="pt-2 text-[10px] text-emerald-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 animate-pulse" /> High-speed vector modeling
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-6 sm:p-8 bg-neutral-900/50 rounded-2xl sm:rounded-[2.5rem] border border-white/5 space-y-6 flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute top-4 right-6 text-5xl sm:text-6xl font-black text-white/5">02</div>
              <div className="space-y-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-500/10 border border-purple-500/20 rounded-xl sm:rounded-2xl flex items-center justify-center">
                  <Workflow className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
                </div>
                <h3 className="font-extrabold text-base sm:text-lg text-white uppercase tracking-tight">Real-Time Hot Compilation</h3>
                <p className="text-xs text-neutral-400 leading-relaxed font-semibold">Our hot module compiler constructs fully functional JSX code blocks, structures stylesheets, links libraries, and optimizes runtime logic loops instantly.</p>
              </div>
              <div className="pt-2 text-[10px] text-purple-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 animate-pulse" /> Isolated code boxing system
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-6 sm:p-8 bg-neutral-900/50 rounded-2xl sm:rounded-[2.5rem] border border-white/5 space-y-6 flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute top-4 right-6 text-5xl sm:text-6xl font-black text-white/5">03</div>
              <div className="space-y-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500/10 border border-blue-500/20 rounded-xl sm:rounded-2xl flex items-center justify-center">
                  <Layers className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
                </div>
                <h3 className="font-extrabold text-base sm:text-lg text-white uppercase tracking-tight">Instant Sandboxed Execute</h3>
                <p className="text-xs text-neutral-400 leading-relaxed font-semibold">Review your live working product fully built directly on mobile, desktop or tablet preview frames. Easily copy final assets or download clean compilation packages.</p>
              </div>
              <div className="pt-2 text-[10px] text-blue-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 animate-pulse" /> Multi-viewport responsive frame
              </div>
            </div>

          </div>
        </section>

        {/* METRICS & BENCHMARK STATISTICS PANEL */}
        <section className="p-6 sm:p-8 md:p-12 bg-gradient-to-r from-neutral-900 to-[#121212] border border-white/5 rounded-2xl sm:rounded-[3rem] shadow-[0_30px_70px_rgba(0,0,0,0.7)] relative overflow-hidden mx-2">
          <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none" />
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center">
            <div className="lg:col-span-5 space-y-3 sm:space-y-4">
              <span className="text-[10px] font-black uppercase text-emerald-500 tracking-[0.35em] block">Teta Benchmark Analytics</span>
              <h3 className="text-xl sm:text-2xl md:text-4xl font-extrabold text-white tracking-tight leading-none uppercase">Engineered to shatter limitations</h3>
              <p className="text-xs text-neutral-400 leading-relaxed font-semibold">TetaGPT represents a massive leap in generative code compilation, maintaining structured output validation without sandbox escape vulnerabilities.</p>
            </div>
            
            <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
              <div className="p-4 sm:p-6 bg-[#090909] border border-white/5 rounded-xl sm:rounded-2xl text-center space-y-1 shadow-inner">
                <span className="text-xl sm:text-2xl md:text-3xl font-black text-white font-mono">0ms</span>
                <p className="text-[9px] text-neutral-500 font-bold uppercase tracking-wider">Stream Delay</p>
              </div>
              <div className="p-4 sm:p-6 bg-[#090909] border border-white/5 rounded-xl sm:rounded-2xl text-center space-y-1 shadow-inner">
                <span className="text-xl sm:text-2xl md:text-3xl font-black text-emerald-400 font-mono">100%</span>
                <p className="text-[9px] text-neutral-500 font-bold uppercase tracking-wider">Local Sandboxed</p>
              </div>
              <div className="p-4 sm:p-6 bg-[#090909] border border-white/5 rounded-xl sm:rounded-2xl text-center space-y-1 shadow-inner">
                <span className="text-xl sm:text-2xl md:text-3xl font-black text-purple-400 font-mono">60 FPS</span>
                <p className="text-[9px] text-neutral-500 font-bold uppercase tracking-wider">Game Canvas rate</p>
              </div>
              <div className="p-4 sm:p-6 bg-[#090909] border border-white/5 rounded-xl sm:rounded-2xl text-center space-y-1 shadow-inner">
                <span className="text-xl sm:text-2xl md:text-3xl font-black text-indigo-400 font-mono">3D API</span>
                <p className="text-[9px] text-neutral-500 font-bold uppercase tracking-wider">Three.js Engine</p>
              </div>
            </div>
          </div>
        </section>

        {/* CALL TO ACTION BOTTOM CARD */}
        <section className="p-8 sm:p-12 md:p-16 rounded-2xl sm:rounded-[4rem] bg-[#0c0c0c] border border-white/10 text-center space-y-6 sm:space-y-8 relative overflow-hidden shadow-2xl mx-2">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:2rem_2rem]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none" />

          <div className="space-y-3 sm:space-y-4 max-w-2xl mx-auto relative z-10">
            <h3 className="text-2xl sm:text-4xl md:text-6xl font-black text-white tracking-tighter uppercase leading-none">Assemble Your Concept Immediately</h3>
            <p className="text-neutral-400 text-[10px] sm:text-xs md:text-sm font-semibold max-w-lg mx-auto leading-relaxed uppercase tracking-wider">
              No registration, no waiting. Experience direct natural language compilation dynamically on your browser container today.
            </p>
          </div>

          <div className="max-w-md mx-auto relative z-10 px-2">
            <button 
              onClick={() => handleLaunchWithPrompt()}
              className="w-full inline-flex items-center justify-center gap-3 px-6 sm:px-8 py-4 sm:py-5 rounded-xl sm:rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs sm:text-sm font-black uppercase tracking-widest transition-all shadow-[0_15px_40px_rgba(16,185,129,0.3)] hover:scale-[1.02] active:scale-[0.98]"
            >
              Get Started with TETA GPT
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="border-t border-white/5 py-12 px-6 md:px-12 text-center text-xs text-neutral-500 space-y-4 relative z-10">
        <div className="flex items-center justify-center gap-2 text-white/40">
          <span className="font-extrabold uppercase tracking-widest text-[10px]">TETA <span className="text-emerald-500">GPT</span></span>
          <span className="w-1.5 h-1.5 rounded-full bg-neutral-600" />
          <span className="font-mono text-[9px]">v2.5.0 STABLE</span>
        </div>
        <p className="font-medium">© {new Date().getFullYear()} TetaGPT. All rights reserved. Powered by Teta Technologies & Gemini AI.</p>
        <div className="flex justify-center gap-6 text-[10px] font-bold uppercase tracking-widest text-[#555] pt-2">
          <span>Local Storage Persistence</span>
          <span>•</span>
          <span>WebGL acceleration required</span>
          <span>•</span>
          <span>Hot Compilation Node</span>
        </div>
      </footer>

    </div>
  );
};

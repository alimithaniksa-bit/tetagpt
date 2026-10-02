import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Settings, 
  X, 
  KeyRound, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ExternalLink, 
  Eye, 
  EyeOff, 
  Trash2,
  Cpu,
  Wifi,
  Radio
} from 'lucide-react';
import { cn } from '../lib/utils';
import { cleanApiKey, validateGeminiKey } from '../services/gemini';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  customApiKey: string;
  onSaveApiKey: (key: string) => void;
  forceOffline: boolean;
  onToggleForceOffline: (val: boolean) => void;
  isStaticDeployment: boolean;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  customApiKey,
  onSaveApiKey,
  forceOffline,
  onToggleForceOffline,
  isStaticDeployment,
}) => {
  const [apiKeyInput, setApiKeyInput] = useState(customApiKey);
  const [showKey, setShowKey] = useState(false);
  const [testingStatus, setTestingStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState<string>('');
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  useEffect(() => {
    setApiKeyInput(customApiKey);
  }, [customApiKey, isOpen]);

  if (!isOpen) return null;

  const handleTestKey = async () => {
    const cleaned = cleanApiKey(apiKeyInput);
    if (!cleaned) {
      setTestingStatus('error');
      setTestMessage("Please paste a valid Gemini API key (starts with 'AIzaSy' and is ~39 characters).");
      return;
    }

    setTestingStatus('testing');
    setTestMessage('Verifying connection with Google Gemini AI Engine...');

    try {
      const result = await validateGeminiKey(cleaned);
      if (result.valid) {
        setTestingStatus('success');
        setTestMessage(result.message);
        // Automatically save when valid
        onSaveApiKey(cleaned);
        setSaveFeedback('Key Verified & Saved!');
        setTimeout(() => setSaveFeedback(null), 3000);
      } else {
        setTestingStatus('error');
        setTestMessage(result.message || 'Key validation rejected by Gemini API.');
      }
    } catch (err: any) {
      setTestingStatus('error');
      setTestMessage(err?.message || 'Error communicating with Gemini service.');
    }
  };

  const handleSave = () => {
    const cleaned = cleanApiKey(apiKeyInput) || '';
    onSaveApiKey(cleaned);
    setSaveFeedback(cleaned ? 'Key Saved Successfully!' : 'Key Cleared');
    setTimeout(() => {
      setSaveFeedback(null);
      onClose();
    }, 1200);
  };

  const handleClear = () => {
    setApiKeyInput('');
    onSaveApiKey('');
    setTestingStatus('idle');
    setTestMessage('');
    setSaveFeedback('Key Cleared. Using system default.');
    setTimeout(() => setSaveFeedback(null), 2500);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          transition={{ type: "spring", duration: 0.4 }}
          className="w-full max-w-lg bg-neutral-900 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.8)] relative"
        >
          {/* Header */}
          <div className="p-6 md:p-8 border-b border-white/5 flex items-center justify-between bg-white/5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-emerald-400">
                <Settings className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-white text-base truncate uppercase tracking-wider">Engine Settings</h3>
                <p className="text-[10px] text-neutral-400 font-semibold uppercase tracking-widest">Environment & Gemini API Access</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-white/5 rounded-full transition-all text-neutral-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 md:p-8 space-y-6 max-h-[80vh] overflow-y-auto">
            {/* Google Gemini API Key Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-neutral-200">
                  <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                  Google Gemini API Key
                </label>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 transition-colors"
                >
                  Get free API key <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="relative">
                <input
                  type={showKey ? "text" : "password"}
                  placeholder="Paste your Gemini API key (AIzaSy...)"
                  value={apiKeyInput}
                  onChange={(e) => {
                    setApiKeyInput(e.target.value);
                    setTestingStatus('idle');
                    setTestMessage('');
                  }}
                  className="w-full bg-neutral-950 border border-white/10 rounded-2xl py-3.5 pl-4 pr-12 text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white p-1 transition-colors"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Status Message */}
              {testingStatus !== 'idle' && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "p-3 rounded-xl text-xs flex items-start gap-2.5 leading-relaxed font-medium",
                    testingStatus === 'testing' && "bg-neutral-800 text-neutral-300 border border-neutral-700",
                    testingStatus === 'success' && "bg-emerald-950/60 text-emerald-300 border border-emerald-500/30",
                    testingStatus === 'error' && "bg-rose-950/60 text-rose-300 border border-rose-500/30"
                  )}
                >
                  {testingStatus === 'testing' && <Loader2 className="w-4 h-4 animate-spin text-neutral-400 shrink-0 mt-0.5" />}
                  {testingStatus === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />}
                  {testingStatus === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />}
                  <span className="flex-1">{testMessage}</span>
                </motion.div>
              )}

              {saveFeedback && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold text-center flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  {saveFeedback}
                </motion.div>
              )}

              <p className="text-[11px] text-neutral-400 leading-relaxed">
                Your key is stored safely in your browser local storage. It unlocks direct access to Google Gemini 3.1 & 3.8 models for instant code, chat, 3D modeling, and cloning.
              </p>

              {/* Actions */}
              <div className="flex gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={handleTestKey}
                  disabled={testingStatus === 'testing' || !apiKeyInput.trim()}
                  className="bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white py-2.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border border-white/10 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-1.5"
                >
                  {testingStatus === 'testing' ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <Radio className="w-3.5 h-3.5 text-emerald-400" />
                      Test Key
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-black py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.98]"
                >
                  Save Key
                </button>

                {apiKeyInput && (
                  <button
                    type="button"
                    onClick={handleClear}
                    title="Clear key"
                    className="bg-neutral-850 hover:bg-rose-500/20 text-neutral-400 hover:text-rose-300 p-2.5 rounded-xl transition-all border border-white/5"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <hr className="border-white/5" />

            {/* Offline Simulator Switch */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-neutral-300">Offline Simulator Only</label>
                  <p className="text-[10px] text-neutral-400 leading-relaxed max-w-[320px]">
                    Force all responses to run offline using local template synthesizers and prebuilt 3D & game models.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onToggleForceOffline(!forceOffline)}
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
            <div className="p-4 rounded-2xl bg-neutral-950 border border-white/5 space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5" />
                  Engine Telemetry
                </h4>
                <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest">
                  @google/genai v1.29
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-[10px] uppercase font-bold tracking-wider">
                <div className="space-y-0.5">
                  <span className="text-neutral-500 text-[9px]">Gemini Key:</span>
                  <p className={customApiKey ? "text-emerald-400 truncate" : "text-neutral-400"}>
                    {customApiKey ? `● Active (${customApiKey.slice(0, 6)}...${customApiKey.slice(-4)})` : "○ Using System Proxy"}
                  </p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-neutral-500 text-[9px]">Network Status:</span>
                  <p className={navigator.onLine ? "text-emerald-400 flex items-center gap-1" : "text-amber-500"}>
                    <Wifi className="w-3 h-3 inline" /> {navigator.onLine ? "Online" : "Offline"}
                  </p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-neutral-500 text-[9px]">Host Environment:</span>
                  <p className="text-neutral-300 truncate">
                    {isStaticDeployment ? "Static Client" : "Node Express Backend"}
                  </p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-neutral-500 text-[9px]">Active Engine:</span>
                  <p className="text-emerald-400 truncate">
                    {forceOffline ? "Offline Presets" : (customApiKey ? "Direct User Key" : "Full Stack Gateway")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

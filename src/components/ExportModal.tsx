import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Download, 
  FileCode, 
  Archive, 
  Terminal, 
  Smartphone, 
  Copy, 
  Check, 
  ExternalLink,
  Sparkles,
  Gamepad2,
  Box,
  Layers,
  Cpu
} from 'lucide-react';
import { downloadStandaloneHtml, downloadProjectZip, ProjectExportOptions } from '../lib/projectExporter';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  code: string;
  projectName: string;
  projectType: 'game' | '3d' | 'clone' | 'app';
  domainOrSource?: string;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  code,
  projectName,
  projectType,
  domainOrSource
}) => {
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'download' | 'instructions'>('download');
  const [isExportingZip, setIsExportingZip] = useState(false);

  if (!isOpen) return null;

  const copyCommand = (cmd: string, label: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(label);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const handleDownloadHtml = () => {
    downloadStandaloneHtml({
      code,
      projectName,
      projectType,
      domainOrSource
    });
  };

  const handleDownloadZip = async () => {
    setIsExportingZip(true);
    try {
      await downloadProjectZip({
        code,
        projectName,
        projectType,
        domainOrSource
      });
    } catch (err) {
      console.error('Failed to export zip:', err);
    } finally {
      setIsExportingZip(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-xl">
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="w-full max-w-2xl bg-neutral-900 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-[0_50px_120px_rgba(0,0,0,0.9)] relative flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-6 md:p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.03]">
            <div className="flex items-center gap-3.5">
              <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-emerald-400">
                {projectType === 'game' ? (
                  <Gamepad2 className="w-6 h-6" />
                ) : projectType === '3d' ? (
                  <Box className="w-6 h-6" />
                ) : (
                  <Layers className="w-6 h-6" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-white text-lg sm:text-xl tracking-tight uppercase">
                    Export & Run Locally
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                    {projectType}
                  </span>
                </div>
                <p className="text-xs text-neutral-400 font-medium">
                  {projectName || 'Tetagpt Cosmic Project'} {domainOrSource ? `• Clone of ${domainOrSource}` : ''}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2.5 rounded-xl hover:bg-white/10 text-neutral-400 hover:text-white transition-all border border-transparent hover:border-white/5"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-white/5 px-6 pt-3 bg-black/20 gap-2">
            <button
              onClick={() => setActiveTab('download')}
              className={`pb-3 px-4 text-xs font-black uppercase tracking-widest transition-all border-b-2 ${
                activeTab === 'download'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-neutral-400 hover:text-white'
              }`}
            >
              Downloads & Packages
            </button>
            <button
              onClick={() => setActiveTab('instructions')}
              className={`pb-3 px-4 text-xs font-black uppercase tracking-widest transition-all border-b-2 ${
                activeTab === 'instructions'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-neutral-400 hover:text-white'
              }`}
            >
              How to Run Locally
            </button>
          </div>

          {/* Body */}
          <div className="p-6 md:p-8 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
            {activeTab === 'download' ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Standalone HTML Card */}
                  <div className="p-5 rounded-3xl bg-neutral-950/60 border border-white/5 hover:border-emerald-500/30 transition-all space-y-4 flex flex-col justify-between group">
                    <div className="space-y-2">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                        <FileCode className="w-6 h-6" />
                      </div>
                      <h4 className="text-sm font-black text-white uppercase tracking-wider">
                        Standalone Single File
                      </h4>
                      <p className="text-xs text-neutral-400 leading-relaxed">
                        Instant single <code className="text-emerald-400 font-mono">.html</code> file with all styles and scripts bundled. Double-click to run on any computer offline.
                      </p>
                    </div>
                    <button
                      onClick={handleDownloadHtml}
                      className="w-full py-3.5 px-4 rounded-xl bg-white/5 hover:bg-emerald-500 hover:text-black border border-white/10 hover:border-emerald-500 text-neutral-200 text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg"
                    >
                      <Download className="w-4 h-4" />
                      Download .HTML
                    </button>
                  </div>

                  {/* Full ZIP Bundle Card */}
                  <div className="p-5 rounded-3xl bg-neutral-950/60 border border-white/5 hover:border-emerald-500/30 transition-all space-y-4 flex flex-col justify-between group">
                    <div className="space-y-2">
                      <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform">
                        <Archive className="w-6 h-6" />
                      </div>
                      <h4 className="text-sm font-black text-white uppercase tracking-wider">
                        Complete Project .ZIP
                      </h4>
                      <p className="text-xs text-neutral-400 leading-relaxed">
                        Includes <code className="text-purple-400 font-mono">index.html</code>, <code className="text-purple-400 font-mono">package.json</code>, and local runner script for seamless local server testing.
                      </p>
                    </div>
                    <button
                      onClick={handleDownloadZip}
                      disabled={isExportingZip}
                      className="w-full py-3.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:scale-[1.02] active:scale-[0.98]"
                    >
                      {isExportingZip ? (
                        <Cpu className="w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                      {isExportingZip ? 'Packaging ZIP...' : 'Download Project .ZIP'}
                    </button>
                  </div>
                </div>

                {/* Quick Run Terminal Commands */}
                <div className="p-5 rounded-3xl bg-neutral-950 border border-white/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase tracking-widest text-neutral-400 flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-emerald-400" />
                      Instant Local Server Commands
                    </span>
                    <span className="text-[10px] text-neutral-500 font-mono">Run in project folder</span>
                  </div>

                  {/* Node command */}
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-black/60 border border-white/5 font-mono text-xs text-neutral-300">
                    <span>npx serve .</span>
                    <button
                      onClick={() => copyCommand('npx serve .', 'npx')}
                      className="p-1.5 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white transition-all flex items-center gap-1.5 text-[10px]"
                    >
                      {copiedCmd === 'npx' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedCmd === 'npx' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>

                  {/* Python command */}
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-black/60 border border-white/5 font-mono text-xs text-neutral-300">
                    <span>python3 -m http.server 8000</span>
                    <button
                      onClick={() => copyCommand('python3 -m http.server 8000', 'python')}
                      className="p-1.5 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white transition-all flex items-center gap-1.5 text-[10px]"
                    >
                      {copiedCmd === 'python' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedCmd === 'python' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6 text-sm text-neutral-300">
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1.5">
                    <h5 className="font-bold text-white flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs">1</span>
                      Method 1: Direct Double-Click (Zero Setup)
                    </h5>
                    <p className="text-xs text-neutral-400 pl-7 leading-relaxed">
                      Download the <code className="text-emerald-400">.html</code> file and simply double-click it. It will open in your default browser. Ideal for fast previews, website clones, and 2D canvas games.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1.5">
                    <h5 className="font-bold text-white flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs">2</span>
                      Method 2: Local HTTP Server (Best for 3D Scenes & WebGL)
                    </h5>
                    <p className="text-xs text-neutral-400 pl-7 leading-relaxed">
                      Download the <code className="text-purple-400">.zip</code> bundle, extract it into a folder, open your terminal in that folder, and run:
                    </p>
                    <div className="pl-7 pt-1 font-mono text-xs text-emerald-400">
                      npx serve . &nbsp;&nbsp;or&nbsp;&nbsp; python3 -m http.server 8000
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1.5">
                    <h5 className="font-bold text-white flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs">3</span>
                      <Smartphone className="w-4 h-4 text-blue-400" />
                      Testing on Mobile / Phone
                    </h5>
                    <p className="text-xs text-neutral-400 pl-7 leading-relaxed">
                      Connect your phone to the same Wi-Fi as your computer. Run the local server, check your computer's local IP address (e.g. <code className="text-blue-400">192.168.1.50</code>), and visit <code className="text-blue-400">http://&lt;your-ip&gt;:8000</code> in your phone's browser!
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-white/5 bg-neutral-950 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-neutral-400 text-xs">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Created with Tetagpt Cosmic Builder</span>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={handleDownloadHtml}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 text-xs font-bold uppercase tracking-wider transition-all border border-white/10"
              >
                Download HTML
              </button>
              <button
                onClick={handleDownloadZip}
                disabled={isExportingZip}
                className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                <Download className="w-4 h-4" />
                Download .ZIP Bundle
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

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
  Sparkles,
  Gamepad2,
  Box,
  Layers,
  Cpu,
  Compass,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { downloadStandaloneHtml, downloadProjectZip } from '../lib/projectExporter';
import { 
  extractOrGenerate3DModel,
  downloadAutoCadDxf,
  downloadAutoCadPackageZip,
  downloadBlenderPythonScript,
  downloadBlenderPackageZip,
  downloadWavefrontObjFiles,
  downloadMaster3DCadBlenderZip
} from '../lib/cadBlenderExporter';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  code: string;
  projectName: string;
  projectType: 'game' | '3d' | 'clone' | 'app';
  domainOrSource?: string;
  defaultCategory?: 'cad3d' | 'web';
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  code,
  projectName,
  projectType,
  domainOrSource,
  defaultCategory
}) => {
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [downloadSuccessMessage, setDownloadSuccessMessage] = useState<string | null>(null);
  
  // Choose default active tab based on projectType
  const [activeTab, setActiveTab] = useState<'cad3d' | 'download' | 'instructions'>(
    defaultCategory === 'cad3d' || projectType === '3d' ? 'cad3d' : 'download'
  );
  
  const [isExportingZip, setIsExportingZip] = useState(false);
  const [isExportingCad, setIsExportingCad] = useState(false);
  const [isExportingBlender, setIsExportingBlender] = useState(false);
  const [isExportingMaster, setIsExportingMaster] = useState(false);

  if (!isOpen) return null;

  const showSuccessFeedback = (msg: string) => {
    setDownloadSuccessMessage(msg);
    setTimeout(() => setDownloadSuccessMessage(null), 3500);
  };

  const copyCommand = (cmd: string, label: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(label);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  // --- Web Downloads ---
  const handleDownloadHtml = () => {
    downloadStandaloneHtml({
      code,
      projectName,
      projectType,
      domainOrSource
    });
    showSuccessFeedback('HTML file downloaded successfully!');
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
      showSuccessFeedback('Project ZIP bundle downloaded!');
    } catch (err) {
      console.error('Failed to export zip:', err);
    } finally {
      setIsExportingZip(false);
    }
  };

  // --- 3D CAD & Blender Downloads ---
  const getModelData = () => {
    return extractOrGenerate3DModel(code, projectName, domainOrSource || '');
  };

  const handleDownloadAutoCadDxf = () => {
    const model = getModelData();
    downloadAutoCadDxf(model);
    showSuccessFeedback('AutoCAD DXF (.dxf) file downloaded!');
  };

  const handleDownloadAutoCadBundle = async () => {
    setIsExportingCad(true);
    try {
      const model = getModelData();
      await downloadAutoCadPackageZip(model);
      showSuccessFeedback('AutoCAD 3D Package (.zip) downloaded!');
    } catch (err) {
      console.error('CAD export error:', err);
    } finally {
      setIsExportingCad(false);
    }
  };

  const handleDownloadBlenderScript = () => {
    const model = getModelData();
    downloadBlenderPythonScript(model);
    showSuccessFeedback('Blender Python script (.py) downloaded!');
  };

  const handleDownloadBlenderBundle = async () => {
    setIsExportingBlender(true);
    try {
      const model = getModelData();
      await downloadBlenderPackageZip(model);
      showSuccessFeedback('Blender 3D Package (.zip) downloaded!');
    } catch (err) {
      console.error('Blender export error:', err);
    } finally {
      setIsExportingBlender(false);
    }
  };

  const handleDownloadObj = () => {
    const model = getModelData();
    downloadWavefrontObjFiles(model);
    showSuccessFeedback('Universal Wavefront 3D (.obj) downloaded!');
  };

  const handleDownloadMasterZip = async () => {
    setIsExportingMaster(true);
    try {
      const model = getModelData();
      await downloadMaster3DCadBlenderZip(model, code);
      showSuccessFeedback('Master 3D CAD & Blender Studio Bundle downloaded!');
    } catch (err) {
      console.error('Master bundle export error:', err);
    } finally {
      setIsExportingMaster(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-xl">
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="w-full max-w-3xl bg-neutral-900 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-[0_50px_120px_rgba(0,0,0,0.95)] relative flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="p-5 md:p-7 border-b border-white/5 flex items-center justify-between bg-white/[0.03]">
            <div className="flex items-center gap-3.5">
              <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-emerald-400">
                {projectType === '3d' ? (
                  <Compass className="w-6 h-6" />
                ) : projectType === 'game' ? (
                  <Gamepad2 className="w-6 h-6" />
                ) : (
                  <Layers className="w-6 h-6" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-white text-lg sm:text-xl tracking-tight uppercase">
                    {projectType === '3d' ? '3D CAD & Blender Exporter' : 'Export & Run Locally'}
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                    {projectType}
                  </span>
                </div>
                <p className="text-xs text-neutral-400 font-medium">
                  {projectName || 'Tetagpt Cosmic 3D Model'} {domainOrSource ? `• ${domainOrSource}` : ''}
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

          {/* Feedback Banner */}
          <AnimatePresence>
            {downloadSuccessMessage && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-emerald-500/15 border-b border-emerald-500/30 px-6 py-2.5 flex items-center justify-between text-xs text-emerald-300 font-bold"
              >
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  {downloadSuccessMessage}
                </span>
                <span className="text-[10px] uppercase font-black tracking-widest text-emerald-400/80">Ready to use</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Tabs */}
          <div className="flex border-b border-white/5 px-4 sm:px-6 pt-3 bg-black/20 gap-2 overflow-x-auto">
            {/* 3D CAD & Blender tab */}
            <button
              onClick={() => setActiveTab('cad3d')}
              className={`pb-3 px-3 sm:px-4 text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all border-b-2 flex items-center gap-2 ${
                activeTab === 'cad3d'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-neutral-400 hover:text-white'
              }`}
            >
              <Box className="w-3.5 h-3.5" />
              Blender & AutoCAD Files
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 text-[9px] font-bold">New</span>
            </button>

            {/* Web & Standalone HTML tab */}
            <button
              onClick={() => setActiveTab('download')}
              className={`pb-3 px-3 sm:px-4 text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all border-b-2 flex items-center gap-2 ${
                activeTab === 'download'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-neutral-400 hover:text-white'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              HTML & ZIP Bundle
            </button>

            {/* How to use tab */}
            <button
              onClick={() => setActiveTab('instructions')}
              className={`pb-3 px-3 sm:px-4 text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all border-b-2 flex items-center gap-2 ${
                activeTab === 'instructions'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-neutral-400 hover:text-white'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              Setup Guides
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-5 md:p-7 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
            {/* TAB 1: 3D CAD & BLENDER EXPORTS */}
            {activeTab === 'cad3d' && (
              <div className="space-y-6">
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-neutral-300 leading-relaxed">
                    <span className="font-bold text-white block mb-0.5">High-Fidelity 3D Engineering & Modeling Export</span>
                    Download native files designed specifically for <span className="text-emerald-400 font-bold">Blender (v3.0 - v4.2+)</span> and <span className="text-sky-400 font-bold">Autodesk AutoCAD (2000 - 2026)</span> with exact 3D coordinates, materials, layers, and cameras!
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* CARD 1: BLENDER 3D SUITE */}
                  <div className="p-5 rounded-3xl bg-neutral-950/70 border border-white/5 hover:border-amber-500/30 transition-all space-y-4 flex flex-col justify-between group">
                    <div className="space-y-2.5">
                      <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
                        {/* Blender icon representation */}
                        <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                        </svg>
                      </div>
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-black text-white uppercase tracking-wider">
                          Blender 3D Studio
                        </h4>
                        <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                          .PY / .OBJ
                        </span>
                      </div>
                      <p className="text-xs text-neutral-400 leading-relaxed">
                        Automatic Python generator creates native meshes, Principled BSDF materials with RGB colors, 3-point studio lighting, and centered camera in Blender.
                      </p>
                    </div>

                    <div className="space-y-2 pt-2">
                      <button
                        onClick={handleDownloadBlenderScript}
                        className="w-full py-3 px-4 rounded-xl bg-amber-500/15 hover:bg-amber-500 hover:text-black border border-amber-500/30 text-amber-300 text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                      >
                        <FileCode className="w-4 h-4" />
                        Download Blender Script (.py)
                      </button>

                      <button
                        onClick={handleDownloadBlenderBundle}
                        disabled={isExportingBlender}
                        className="w-full py-3 px-4 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-neutral-200 text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                      >
                        {isExportingBlender ? <Cpu className="w-4 h-4 animate-spin" /> : <Archive className="w-4 h-4 text-amber-400" />}
                        {isExportingBlender ? 'Packaging Blender ZIP...' : 'Download Blender Pack (.zip)'}
                      </button>
                    </div>
                  </div>

                  {/* CARD 2: AUTODESK AUTOCAD SUITE */}
                  <div className="p-5 rounded-3xl bg-neutral-950/70 border border-white/5 hover:border-sky-500/30 transition-all space-y-4 flex flex-col justify-between group">
                    <div className="space-y-2.5">
                      <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 group-hover:scale-105 transition-transform">
                        <Compass className="w-6 h-6" />
                      </div>
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-black text-white uppercase tracking-wider">
                          Autodesk AutoCAD
                        </h4>
                        <span className="text-[10px] font-mono text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-500/20">
                          .DXF (3D CAD)
                        </span>
                      </div>
                      <p className="text-xs text-neutral-400 leading-relaxed">
                        Full 3D Drawing Exchange Format (.dxf) with <code className="text-sky-300 font-mono">3DFACE</code> geometry, dedicated layers, color indexing, and setup script for instant CAD drafting.
                      </p>
                    </div>

                    <div className="space-y-2 pt-2">
                      <button
                        onClick={handleDownloadAutoCadDxf}
                        className="w-full py-3 px-4 rounded-xl bg-sky-500/15 hover:bg-sky-500 hover:text-black border border-sky-500/30 text-sky-300 text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Download AutoCAD File (.dxf)
                      </button>

                      <button
                        onClick={handleDownloadAutoCadBundle}
                        disabled={isExportingCad}
                        className="w-full py-3 px-4 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-neutral-200 text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                      >
                        {isExportingCad ? <Cpu className="w-4 h-4 animate-spin" /> : <Archive className="w-4 h-4 text-sky-400" />}
                        {isExportingCad ? 'Packaging CAD ZIP...' : 'Download AutoCAD Bundle (.zip)'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* ADDITIONAL EXPORTS: UNIVERSAL OBJ & MASTER PACK */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Universal OBJ */}
                  <div className="p-4 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-purple-400" />
                        <span className="text-xs font-bold text-white uppercase">Universal Wavefront 3D</span>
                      </div>
                      <p className="text-[11px] text-neutral-400">
                        Compatible with Maya, Cinema 4D, 3ds Max, Unity, Unreal.
                      </p>
                    </div>
                    <button
                      onClick={handleDownloadObj}
                      className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-[11px] font-bold uppercase tracking-wider transition-all whitespace-nowrap"
                    >
                      .OBJ Model
                    </button>
                  </div>

                  {/* Master 3D CAD & Blender Studio Bundle */}
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-black text-emerald-300 uppercase">Master 3D Studio Pack</span>
                      </div>
                      <p className="text-[11px] text-neutral-300">
                        Includes AutoCAD .dxf, Blender .py, .obj, and WebGL viewer!
                      </p>
                    </div>
                    <button
                      onClick={handleDownloadMasterZip}
                      disabled={isExportingMaster}
                      className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-[11px] font-black uppercase tracking-wider transition-all whitespace-nowrap shadow-lg flex items-center gap-1.5"
                    >
                      {isExportingMaster ? <Cpu className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                      {isExportingMaster ? 'Building...' : 'Master .ZIP'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: WEB RUNNER & STANDALONE HTML */}
            {activeTab === 'download' && (
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
                        Instant single <code className="text-emerald-400 font-mono">.html</code> file with all styles and 3D scripts bundled. Double-click to run on any computer offline.
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
                  <div className="p-5 rounded-3xl bg-neutral-950/60 border border-white/5 hover:border-purple-500/30 transition-all space-y-4 flex flex-col justify-between group">
                    <div className="space-y-2">
                      <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform">
                        <Archive className="w-6 h-6" />
                      </div>
                      <h4 className="text-sm font-black text-white uppercase tracking-wider">
                        Complete Web Project .ZIP
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
            )}

            {/* TAB 3: SETUP INSTRUCTIONS */}
            {activeTab === 'instructions' && (
              <div className="space-y-5 text-sm text-neutral-300">
                {/* BLENDER GUIDE */}
                <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2">
                  <h5 className="font-black text-amber-300 flex items-center gap-2 uppercase tracking-wide text-xs">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs">1</span>
                    How to Open in Blender
                  </h5>
                  <div className="text-xs text-neutral-300 pl-7 space-y-2 leading-relaxed">
                    <p>
                      <strong>Method A (Python Auto-Builder):</strong> Open Blender, click the <strong>Scripting</strong> tab at the top, click <strong>Open</strong> and choose <code className="text-amber-400 font-mono">import_to_blender.py</code>, then press <strong>Run Script (Alt + P)</strong>. All objects, materials, lights, and camera are built automatically!
                    </p>
                    <p>
                      <strong>Method B (Wavefront OBJ):</strong> In Blender, go to <strong>File &gt; Import &gt; Wavefront (.obj)</strong> and select the exported <code className="text-amber-400 font-mono">.obj</code> file.
                    </p>
                  </div>
                </div>

                {/* AUTOCAD GUIDE */}
                <div className="p-5 rounded-2xl bg-sky-500/10 border border-sky-500/20 space-y-2">
                  <h5 className="font-black text-sky-300 flex items-center gap-2 uppercase tracking-wide text-xs">
                    <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center text-xs">2</span>
                    How to Open in Autodesk AutoCAD
                  </h5>
                  <div className="text-xs text-neutral-300 pl-7 space-y-2 leading-relaxed">
                    <p>
                      1. Open <strong>AutoCAD</strong>, click <strong>File &gt; Open</strong> (or type <code className="text-sky-300 font-mono">OPEN</code>), switch file type dropdown to <strong>DXF (*.dxf)</strong>, and select the exported <code className="text-sky-300 font-mono">.dxf</code> file.
                    </p>
                    <p>
                      2. In the AutoCAD command line, type <code className="text-sky-300 font-mono">SHADEMODE</code> and choose <strong>REALISTIC</strong> or <strong>CONCEPTUAL</strong>. Use <code className="text-sky-300 font-mono">3DORBIT</code> to rotate in full 3D space!
                    </p>
                  </div>
                </div>

                {/* WEB/LOCAL SERVER GUIDE */}
                <div className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-2">
                  <h5 className="font-black text-white flex items-center gap-2 uppercase tracking-wide text-xs">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs">3</span>
                    Running WebGL Viewer Locally
                  </h5>
                  <div className="text-xs text-neutral-400 pl-7 space-y-1.5 leading-relaxed">
                    <p>
                      Double-click the <code className="text-emerald-400 font-mono">.html</code> file directly, or run <code className="text-emerald-400 font-mono">npx serve .</code> in your extracted folder for full 60fps WebGL rendering.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-5 md:p-6 border-t border-white/5 bg-neutral-950 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-neutral-400 text-xs">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Created with Tetagpt Cosmic Builder</span>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap justify-end">
              {projectType === '3d' && (
                <>
                  <button
                    onClick={handleDownloadBlenderScript}
                    className="px-3.5 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/25 text-xs font-bold uppercase tracking-wider transition-all"
                  >
                    Blender .PY
                  </button>
                  <button
                    onClick={handleDownloadAutoCadDxf}
                    className="px-3.5 py-2.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/25 text-xs font-bold uppercase tracking-wider transition-all"
                  >
                    AutoCAD .DXF
                  </button>
                </>
              )}
              <button
                onClick={handleDownloadHtml}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 text-xs font-bold uppercase tracking-wider transition-all border border-white/10"
              >
                HTML
              </button>
              <button
                onClick={handleDownloadMasterZip}
                disabled={isExportingMaster}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                <Download className="w-4 h-4" />
                {isExportingMaster ? 'Packaging...' : 'Download Master Pack'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

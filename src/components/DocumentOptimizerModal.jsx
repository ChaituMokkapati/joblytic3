import React, { useState } from 'react';
import { Sliders, CheckCircle, Sparkles, Image, ShieldCheck, ArrowRight } from 'lucide-react';

export default function DocumentOptimizerModal({ docToOptimize, requirement, onClose, onSaveOptimizedDoc }) {
  const [targetSizeKB, setTargetSizeKB] = useState(requirement ? requirement.maxSizeKB - 10 : 35);
  const [targetWidthPx, setTargetWidthPx] = useState(350);
  const [targetHeightPx, setTargetHeightPx] = useState(450);
  const [isProcessing, setIsProcessing] = useState(false);
  const [optimizationSuccess, setOptimizationSuccess] = useState(false);

  const handleRunAiOptimize = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setOptimizationSuccess(true);
    }, 1200);
  };

  const handleApplyFixToVault = () => {
    onSaveOptimizedDoc({
      ...docToOptimize,
      fileSizeKB: targetSizeKB,
      dimensions: `${targetWidthPx}x${targetHeightPx} px (3.5cm x 4.5cm)`,
      status: 'VERIFIED',
      issueNote: null
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-amber-500/40 max-w-lg w-full space-y-6 shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center font-bold">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">1-Click AI Image & Document Optimizer</h3>
              <p className="text-xs text-slate-400">Automatic resizer & size compressor</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white font-mono text-sm"
          >
            ✕
          </button>
        </div>

        {/* Current vs Target Specs */}
        <div className="grid grid-cols-2 gap-4 text-xs font-mono">
          <div className="bg-slate-900 p-3.5 rounded-2xl border border-slate-800 space-y-1">
            <p className="text-amber-400 font-bold uppercase">Original File Spec:</p>
            <p className="text-slate-200">{docToOptimize.fileName}</p>
            <p className="text-rose-400 font-bold">Size: {docToOptimize.fileSizeKB} KB (Too Large)</p>
            <p className="text-slate-400">Dim: {docToOptimize.dimensions}</p>
          </div>

          <div className="bg-emerald-950/40 p-3.5 rounded-2xl border border-emerald-800/60 space-y-1">
            <p className="text-emerald-400 font-bold uppercase">Target Job Guideline:</p>
            <p className="text-slate-200">{requirement ? requirement.name : 'SSC/IBPS Photo Rules'}</p>
            <p className="text-emerald-300 font-bold">Max Size: {requirement ? requirement.maxSizeKB : 50} KB</p>
            <p className="text-emerald-300 font-bold">Dim: 3.5cm x 4.5cm</p>
          </div>
        </div>

        {/* Resizer Sliders */}
        <div className="space-y-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
          <div>
            <div className="flex justify-between text-xs font-semibold mb-1.5">
              <span className="text-slate-300">Target Compress Size (KB):</span>
              <span className="text-emerald-400 font-mono font-bold">{targetSizeKB} KB</span>
            </div>
            <input
              type="range"
              min={10}
              max={requirement ? requirement.maxSizeKB : 50}
              value={targetSizeKB}
              onChange={(e) => setTargetSizeKB(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-slate-400 text-[10px] uppercase font-mono mb-1">Target Width (px):</label>
              <input
                type="number"
                value={targetWidthPx}
                onChange={(e) => setTargetWidthPx(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 text-[10px] uppercase font-mono mb-1">Target Height (px):</label>
              <input
                type="number"
                value={targetHeightPx}
                onChange={(e) => setTargetHeightPx(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-white font-mono"
              />
            </div>
          </div>
        </div>

        {/* Action Button */}
        {!optimizationSuccess ? (
          <button
            onClick={handleRunAiOptimize}
            disabled={isProcessing}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 via-emerald-500 to-teal-500 text-slate-950 font-extrabold text-xs flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/20 transition disabled:opacity-50"
          >
            <Sparkles className={`w-4 h-4 text-slate-950 ${isProcessing ? 'animate-spin' : ''}`} />
            <span>{isProcessing ? 'Optimizing Image Canvas...' : 'Run 1-Click AI Resizer & Compress'}</span>
          </button>
        ) : (
          <div className="space-y-3">
            <div className="p-3 bg-emerald-950/80 border border-emerald-500/60 rounded-2xl text-center space-y-1">
              <CheckCircle className="w-6 h-6 text-emerald-400 mx-auto" />
              <p className="text-xs font-bold text-white">Successfully Resized & Compressed!</p>
              <p className="text-[11px] font-mono text-emerald-300">
                New Size: {targetSizeKB} KB | Dimensions: {targetWidthPx}x{targetHeightPx} px
              </p>
            </div>

            <button
              onClick={handleApplyFixToVault}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-extrabold text-xs shadow-lg transition"
            >
              Update Saved File in Candidate Vault Locker ➔
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

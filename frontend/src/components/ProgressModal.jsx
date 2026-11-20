import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';
import { Loader2, Satellite, CheckCircle } from 'lucide-react';

export default function ProgressModal() {
  const { isAnalyzing, analysisProgress, analysisStep } = useAppStore();

  if (!isAnalyzing) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-forest-card border border-forest-border max-w-md w-full rounded-2xl p-6 shadow-2xl space-y-5"
        >
          {/* Header */}
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-guardian-500/20 border border-guardian-500/40 flex items-center justify-center text-guardian-400">
              <Satellite className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">Satellite Earth Observation Pipeline</h3>
              <p className="text-xs text-slate-400">GreenShieldAI Processing Engine</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-300">Analysis Progress</span>
              <span className="text-guardian-400 font-mono">{analysisProgress}%</span>
            </div>
            <div className="h-2.5 w-full bg-forest-dark rounded-full overflow-hidden border border-forest-border">
              <motion.div
                className="h-full bg-gradient-to-r from-guardian-500 via-emerald-400 to-teal-400 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${analysisProgress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          {/* Current Step Description */}
          <div className="bg-forest-dark/80 rounded-xl p-3 border border-forest-border/80 text-xs text-slate-300 flex items-center space-x-2.5">
            <Loader2 className="w-4 h-4 text-guardian-400 animate-spin shrink-0" />
            <p className="leading-relaxed">{analysisStep || 'Executing multi-temporal satellite differencing...'}</p>
          </div>

          {/* Features note */}
          <p className="text-[11px] text-slate-400 text-center">
            Retrieving dry-season median composites (Sentinel-2 Harmonized L2A) and computing 1km vulnerability grid.
          </p>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

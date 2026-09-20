import React from 'react';
import { Database, ShieldCheck, Sparkles, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function Header({
  activeProvider = 'simulation',
  providerInfo = null,
  isConnected = true
}) {
  const isReal = activeProvider === 'real' || activeProvider === 'authorized_linkedin';
  const realProviderStatus = providerInfo?.providers?.find(p => p.id === 'real')?.status || 'not_configured';

  return (
    <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-xl sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-sky-400 flex items-center justify-center shadow-lg shadow-brand-500/20 ring-1 ring-white/20">
            <Database className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg text-white tracking-tight">
                LinkedIn Research & Data Collection Tool
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20">
                <Sparkles className="w-3 h-3" /> Production Suite
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Dynamic schema projection • Multi-page adapter • Intelligent composite deduplication
            </p>
          </div>
        </div>

        {/* Dynamic Provider & Connection Status */}
        <div className="flex items-center gap-3">
          {/* Provider Mode Pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs">
            <span className="text-slate-400 font-medium hidden md:inline">Data Source:</span>
            {isReal ? (
              <span className="text-emerald-400 font-semibold uppercase tracking-wider text-[11px] flex items-center gap-1">
                Authorized Provider
              </span>
            ) : (
              <span className="text-amber-400 font-semibold uppercase tracking-wider text-[11px] flex items-center gap-1">
                Simulation Mode
              </span>
            )}
          </div>

          {/* Real Connection Status Pill */}
          {isReal ? (
            realProviderStatus === 'connected' ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Connected</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Not Configured</span>
              </div>
            )
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
              <span>Test Sandbox</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

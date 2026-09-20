import React, { useState } from 'react';
import { 
  Activity, CheckCircle2, XCircle, AlertTriangle, 
  Terminal, ChevronDown, ChevronUp, StopCircle, RefreshCw,
  Users, CopyCheck, AlertCircle, Layers
} from 'lucide-react';

export default function JobStatusCard({
  jobState,
  onCancel,
  onOpenFailedDrawer
}) {
  const [showLogs, setShowLogs] = useState(true);

  if (!jobState) return null;

  const { status, progress, metrics, query, limit, recentLogs = [], error } = jobState;

  const getStatusBadge = () => {
    switch (status) {
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/15 border border-brand-500/30 text-brand-400 text-xs font-semibold animate-pulse">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" /> In Progress (Page {progress?.currentPage || 1})
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" /> Collection Completed
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-semibold">
            <XCircle className="w-3.5 h-3.5" /> Collection Failed
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-semibold">
            <AlertTriangle className="w-3.5 h-3.5" /> Cancelled by User
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-700 text-slate-300 text-xs font-semibold">
            <Activity className="w-3.5 h-3.5" /> Initializing...
          </span>
        );
    }
  };

  const percent = progress?.percent || 0;
  const uniqueCount = progress?.uniqueRecords || metrics?.unique || 0;
  const duplicateCount = progress?.duplicateRecords || metrics?.duplicates || 0;
  const failedCount = progress?.failedRecords || metrics?.failed || 0;
  const currentPage = progress?.currentPage || metrics?.pagesProcessed || 1;

  return (
    <div className="glass-panel rounded-2xl p-6 space-y-5 animate-fade-in">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-base font-semibold text-white">
              Data Collection Status
            </h2>
            {getStatusBadge()}
          </div>
          <p className="text-xs text-slate-400">
            Query: <span className="text-slate-200 font-medium">"{query}"</span> • Target Limit: <span className="text-slate-200 font-medium">{limit} records</span>
          </p>
        </div>

        {status === 'in_progress' && (
          <button
            onClick={onCancel}
            className="px-3.5 py-1.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 hover:bg-rose-500/25 text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <StopCircle className="w-3.5 h-3.5" />
            Stop Job
          </button>
        )}
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 font-medium">Collection Progress</span>
          <span className="text-brand-400 font-bold font-mono">{percent}%</span>
        </div>
        <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden relative">
          <div
            className={`h-full transition-all duration-300 rounded-full ${
              status === 'completed'
                ? 'bg-emerald-500'
                : status === 'failed'
                ? 'bg-rose-500'
                : 'bg-gradient-to-r from-brand-600 to-sky-400'
            }`}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* Metric Counters Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Unique Records */}
        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-medium">Unique Records</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-emerald-400 font-mono">
            {uniqueCount}
          </div>
          <p className="text-[11px] text-slate-500">Passed deduplication</p>
        </div>

        {/* Duplicate Count */}
        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-medium">Duplicates Filtered</span>
            <CopyCheck className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-amber-400 font-mono">
            {duplicateCount}
          </div>
          <p className="text-[11px] text-slate-500">Canonical fingerprint match</p>
        </div>

        {/* Failed / Incomplete Count */}
        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-medium">Failed / Missing</span>
            <AlertCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="flex items-center justify-between">
            <div className="text-xl font-bold text-rose-400 font-mono">
              {failedCount}
            </div>
            {failedCount > 0 && (
              <button
                type="button"
                onClick={onOpenFailedDrawer}
                className="text-[11px] text-rose-400 hover:underline font-medium"
              >
                Inspect
              </button>
            )}
          </div>
          <p className="text-[11px] text-slate-500">Isolated gracefully</p>
        </div>

        {/* Pages Processed */}
        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-medium">Current Page</span>
            <Layers className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-xl font-bold text-sky-400 font-mono">
            Page {currentPage}
          </div>
          <p className="text-[11px] text-slate-500">Multi-page pagination</p>
        </div>
      </div>

      {/* Error Message if Failed */}
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>Error details: {error}</span>
        </div>
      )}

      {/* Live Log Console */}
      <div className="rounded-xl border border-slate-800/90 bg-slate-950/90 overflow-hidden">
        <button
          type="button"
          onClick={() => setShowLogs(!showLogs)}
          className="w-full px-4 py-2.5 flex items-center justify-between bg-slate-900/90 text-xs text-slate-400 hover:text-slate-200 transition"
        >
          <div className="flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-brand-400" />
            <span className="font-semibold uppercase tracking-wider text-[11px]">Real-Time Execution Logs</span>
            <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] text-slate-400">{recentLogs.length} events</span>
          </div>
          {showLogs ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showLogs && (
          <div className="p-3 font-mono text-xs max-h-36 overflow-y-auto space-y-1 text-slate-300 bg-slate-950">
            {recentLogs.length === 0 ? (
              <p className="text-slate-600 italic">No log entries yet...</p>
            ) : (
              recentLogs.map((log, idx) => (
                <div key={idx} className="flex items-start gap-2 leading-relaxed">
                  <span className="text-slate-600 shrink-0 text-[10px]">
                    {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : '--:--:--'}
                  </span>
                  <span
                    className={`shrink-0 text-[10px] uppercase font-bold px-1 rounded ${
                      log.level === 'error'
                        ? 'bg-rose-500/20 text-rose-400'
                        : log.level === 'warn'
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-brand-500/20 text-brand-400'
                    }`}
                  >
                    {log.level}
                  </span>
                  <span className="break-all">{log.message}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

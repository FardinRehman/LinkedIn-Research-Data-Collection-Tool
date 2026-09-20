import React from 'react';
import { X, AlertCircle, ShieldAlert, Code2 } from 'lucide-react';

export default function FailedRecordsDrawer({ isOpen, onClose, failedItems = [] }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl relative overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">
                Incomplete & Failed Records Diagnostic ({failedItems.length})
              </h3>
              <p className="text-xs text-slate-400">
                These records were gracefully isolated without interrupting the collection pipeline
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-3 flex-1">
          {failedItems.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              No failed or corrupted records recorded.
            </div>
          ) : (
            failedItems.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between text-rose-400 font-medium">
                  <span className="flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Record #{idx + 1}
                  </span>
                  <span className="bg-rose-500/10 px-2 py-0.5 rounded text-[11px] border border-rose-500/20">
                    {item.reason}
                  </span>
                </div>

                <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto">
                  <div className="flex items-center gap-1 text-slate-500 mb-1">
                    <Code2 className="w-3 h-3" /> Raw Upstream Payload:
                  </div>
                  <pre>{JSON.stringify(item.raw, null, 2)}</pre>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex justify-end bg-slate-900/90">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
          >
            Close Diagnostics
          </button>
        </div>
      </div>
    </div>
  );
}

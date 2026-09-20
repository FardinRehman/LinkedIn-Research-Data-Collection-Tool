import React, { useState } from 'react';
import { Download, FileSpreadsheet, FileText, FileCode, Loader2 } from 'lucide-react';
import { triggerExport } from '../../services/api';

export default function ExportToolbar({ jobId, totalRecords = 0, records = [], fields = [] }) {
  const [downloadingFormat, setDownloadingFormat] = useState(null);

  const handleExport = async (format) => {
    if (!jobId || totalRecords === 0) return;
    setDownloadingFormat(format);

    try {
      await triggerExport(jobId, format, records, fields);
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setTimeout(() => {
        setDownloadingFormat(null);
      }, 1200);
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-slate-900/90 border border-slate-800">
      <div className="flex items-center gap-2">
        <Download className="w-4 h-4 text-brand-400" />
        <span className="text-xs font-semibold text-slate-200">
          Export Collected Results:
        </span>
        <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
          {totalRecords} Unique Records
        </span>
      </div>

      <div className="flex items-center gap-2">
        {/* CSV Export */}
        <button
          onClick={() => handleExport('csv')}
          disabled={totalRecords === 0 || downloadingFormat !== null}
          className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 hover:border-emerald-500/50 hover:bg-slate-750 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {downloadingFormat === 'csv' ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
          ) : (
            <FileText className="w-3.5 h-3.5 text-emerald-400" />
          )}
          <span>CSV</span>
        </button>

        {/* Excel Export */}
        <button
          onClick={() => handleExport('xlsx')}
          disabled={totalRecords === 0 || downloadingFormat !== null}
          className="px-3.5 py-1.5 rounded-lg bg-emerald-600/20 border border-emerald-500/30 hover:bg-emerald-600/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
        >
          {downloadingFormat === 'xlsx' ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-300" />
          ) : (
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
          )}
          <span>Excel (.XLSX)</span>
        </button>

        {/* JSON Export */}
        <button
          onClick={() => handleExport('json')}
          disabled={totalRecords === 0 || downloadingFormat !== null}
          className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 hover:border-sky-500/50 hover:bg-slate-750 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {downloadingFormat === 'json' ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-400" />
          ) : (
            <FileCode className="w-3.5 h-3.5 text-sky-400" />
          )}
          <span>JSON</span>
        </button>
      </div>
    </div>
  );
}

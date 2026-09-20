import React, { useState } from 'react';
import { 
  Search, ExternalLink, Copy, Check, ChevronLeft, ChevronRight, 
  Table, Sparkles, Filter, Database
} from 'lucide-react';
import ExportToolbar from './ExportToolbar';

export default function DynamicDataTable({
  jobId,
  fields = [],
  records = [],
  totalRecords = 0,
  page = 1,
  limit = 25,
  onPageChange,
  searchTerm = '',
  onSearchChange,
  isLoading = false
}) {
  const [copiedKey, setCopiedKey] = useState(null);

  const handleCopy = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const totalPages = Math.ceil(totalRecords / limit) || 1;

  const renderCellContent = (value, fieldKey, rowId) => {
    if (value === undefined || value === null || value === '') {
      return <span className="text-slate-600 italic">-</span>;
    }

    const strVal = String(value);

    // Profile URL or Company URL
    if (strVal.startsWith('http://') || strVal.startsWith('https://')) {
      const isLinkedIn = strVal.includes('linkedin.com');
      const cellId = `${rowId}_${fieldKey}`;
      return (
        <div className="flex items-center gap-1.5 max-w-[220px]">
          <a
            href={strVal}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-400 hover:text-brand-300 truncate text-xs flex items-center gap-1 group font-medium"
            title={strVal}
          >
            <span className="truncate">{strVal.replace(/^https?:\/\/(www\.)?/, '')}</span>
            <ExternalLink className="w-3 h-3 opacity-70 group-hover:opacity-100 shrink-0" />
          </a>
          <button
            onClick={() => handleCopy(strVal, cellId)}
            className="p-1 rounded text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition shrink-0"
            title="Copy URL"
          >
            {copiedKey === cellId ? (
              <Check className="w-3 h-3 text-emerald-400" />
            ) : (
              <Copy className="w-3 h-3" />
            )}
          </button>
        </div>
      );
    }

    // Funding Stage or Industry badge
    if (fieldKey.toLowerCase().includes('stage') || fieldKey.toLowerCase().includes('round')) {
      return (
        <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 whitespace-nowrap">
          {strVal}
        </span>
      );
    }

    if (fieldKey.toLowerCase().includes('industry') || fieldKey.toLowerCase().includes('category')) {
      return (
        <span className="inline-flex px-2 py-0.5 rounded-lg text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700/60 whitespace-nowrap">
          {strVal}
        </span>
      );
    }

    return <span className="text-slate-200 text-xs">{strVal}</span>;
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Export Toolbar */}
      <ExportToolbar jobId={jobId} totalRecords={totalRecords} records={records} fields={fields} />

      {/* Table Container */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
        {/* Table Header Controls */}
        <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-900/90">
          <div className="flex items-center gap-2">
            <Table className="w-4 h-4 text-brand-400" />
            <h3 className="text-sm font-semibold text-white">
              Collected Dataset
            </h3>
            <span className="text-xs text-slate-400">
              ({totalRecords} unique {totalRecords === 1 ? 'item' : 'items'})
            </span>
          </div>

          {/* Quick Search inside collected dataset */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Filter within results..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950/90 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition"
            />
          </div>
        </div>

        {/* Dynamic Table Render */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                <th className="py-3 px-4 w-12 text-center text-slate-600">#</th>
                {fields.map((field) => (
                  <th key={field.key} className="py-3 px-4 font-semibold whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span>{field.label || field.key}</span>
                      {field.isCustom && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          Custom
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850 bg-slate-900/50">
              {records.length === 0 ? (
                <tr>
                  <td
                    colSpan={fields.length + 1}
                    className="py-12 text-center text-slate-500 text-xs"
                  >
                    {searchTerm ? (
                      <div>No records match your filter "{searchTerm}".</div>
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Database className="w-8 h-8 text-slate-700" />
                        <p>No records collected yet. Run a search task above.</p>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                records.map((row, index) => {
                  const globalRowNumber = (page - 1) * limit + index + 1;
                  return (
                    <tr
                      key={row._id || index}
                      className="hover:bg-brand-500/5 transition duration-150"
                    >
                      <td className="py-3 px-4 text-center text-xs text-slate-500 font-mono">
                        {globalRowNumber}
                      </td>
                      {fields.map((field) => (
                        <td key={field.key} className="py-3 px-4 text-xs">
                          {renderCellContent(row[field.key], field.key, row._id || index)}
                        </td>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalRecords > limit && (
          <div className="p-3.5 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-950/70 text-xs text-slate-400">
            <div>
              Showing <span className="text-white font-medium">{(page - 1) * limit + 1}</span> to{' '}
              <span className="text-white font-medium">
                {Math.min(page * limit, totalRecords)}
              </span>{' '}
              of <span className="text-white font-medium">{totalRecords}</span> entries
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-750 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Prev
              </button>

              <div className="px-3 py-1 font-mono text-slate-300">
                Page <span className="font-bold text-brand-400">{page}</span> of {totalPages}
              </div>

              <button
                type="button"
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-750 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

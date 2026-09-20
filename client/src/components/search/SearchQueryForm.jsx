import React from 'react';
import { 
  Search, Play, Loader2, Sparkles, Hash, AlertCircle, 
  ShieldCheck, ShieldAlert, Cpu, Database
} from 'lucide-react';
import FieldSelector from './FieldSelector';

export default function SearchQueryForm({
  query,
  setQuery,
  limit,
  setLimit,
  fields,
  onToggleField,
  onSelectAll,
  onDeselectAll,
  onAddField,
  onRemoveCustomField,
  activePreset,
  onSelectPreset,
  provider,
  onSelectProvider,
  providerInfo,
  onSubmit,
  isLoading,
  error
}) {
  const exampleQueries = [
    { label: 'CTO startup India', category: 'PEOPLE' },
    { label: 'FinTech companies India', category: 'COMPANIES' },
    { label: 'VP of AI & ML Engineering', category: 'PEOPLE' },
    { label: 'SaaS Startups Series A', category: 'COMPANIES' }
  ];

  const selectedFieldsCount = fields.filter(f => f.selected).length;
  const isReal = provider === 'real' || provider === 'authorized_linkedin';
  const realConfig = providerInfo?.providers?.find(p => p.id === 'real');
  const isRealConfigured = Boolean(realConfig?.isConfigured);

  return (
    <form onSubmit={onSubmit} className="glass-panel rounded-2xl p-6 space-y-6">
      {/* Top Bar: Data Source Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-200">
            Search Parameters & Data Provider
          </h2>
          <p className="text-xs text-slate-400">
            Choose data collection source and define query parameters
          </p>
        </div>

        {/* Provider Switcher Buttons */}
        <div className="flex items-center p-1 bg-slate-950/80 border border-slate-800 rounded-xl">
          <button
            type="button"
            onClick={() => onSelectProvider('simulation')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
              !isReal
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Simulation Mode</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectProvider('real')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
              isReal
                ? isRealConfigured
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Authorized Real Provider</span>
          </button>
        </div>
      </div>

      {/* Notice if Real Provider is selected but not configured */}
      {isReal && !isRealConfigured && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-1.5 animate-fade-in">
          <div className="flex items-center gap-2 font-semibold">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Real Provider Credentials Required</span>
          </div>
          <p className="text-slate-300">
            The application strictly enforces compliance and <strong>will not fabricate fake data</strong> in Real mode.
            To connect to live data, configure <code className="text-amber-300 bg-slate-900 px-1.5 py-0.5 rounded">LINKEDIN_API_KEY</code> and <code className="text-amber-300 bg-slate-900 px-1.5 py-0.5 rounded">LINKEDIN_API_BASE_URL</code> in <code className="text-amber-300 bg-slate-900 px-1.5 py-0.5 rounded">server/.env</code>.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {/* Search Query Input & Limit */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-9 space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              LinkedIn Search Query
            </label>
            <div className="relative">
              <Search className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. CTO startup India, FinTech companies India..."
                disabled={isLoading}
                className="w-full pl-11 pr-4 py-3 bg-slate-950/80 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition disabled:opacity-50"
              />
            </div>
          </div>

          <div className="lg:col-span-3 space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Target Limit
            </label>
            <div className="relative">
              <Hash className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                disabled={isLoading}
                className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition disabled:opacity-50 cursor-pointer"
              >
                <option value={10}>10 Records</option>
                <option value={25}>25 Records</option>
                <option value={50}>50 Records</option>
                <option value={100}>100 Records</option>
                <option value={250}>250 Records</option>
              </select>
            </div>
          </div>
        </div>

        {/* Example Query Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] text-slate-400 font-medium mr-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" /> Suggestions:
          </span>
          {exampleQueries.map((ex) => (
            <button
              key={ex.label}
              type="button"
              onClick={() => {
                setQuery(ex.label);
                onSelectPreset(ex.category);
              }}
              disabled={isLoading}
              className="text-xs px-2.5 py-1 rounded-lg bg-slate-800/60 border border-slate-700/60 text-slate-300 hover:text-white hover:border-brand-500/40 hover:bg-slate-800 transition"
            >
              {ex.label}
            </button>
          ))}
        </div>
      </div>

      {/* Dynamic Field Configuration Section */}
      <FieldSelector
        fields={fields}
        onToggleField={onToggleField}
        onSelectAll={onSelectAll}
        onDeselectAll={onDeselectAll}
        onAddField={onAddField}
        onRemoveCustomField={onRemoveCustomField}
        activePreset={activePreset}
        onSelectPreset={onSelectPreset}
      />

      {/* Error Alert */}
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-800">
        <div className="flex items-center gap-2 text-xs text-slate-400 hidden sm:flex">
          <span className="w-2 h-2 rounded-full bg-brand-500"></span>
          <span>Dynamic schema projection • Canonical composite deduplication • Non-circumventing</span>
        </div>

        <button
          type="submit"
          disabled={isLoading || !query.trim() || selectedFieldsCount === 0}
          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-brand-600 to-sky-500 hover:from-brand-500 hover:to-sky-400 text-white text-sm font-semibold shadow-lg shadow-brand-500/25 flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Collecting Data...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-white" />
              <span>Start Collection Job</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}

import React, { useState } from 'react';
import { CheckSquare, Square, Plus, Trash2, Sparkles, SlidersHorizontal } from 'lucide-react';
import CustomFieldModal from './CustomFieldModal';

export default function FieldSelector({
  fields = [],
  onToggleField,
  onSelectAll,
  onDeselectAll,
  onAddField,
  onRemoveCustomField,
  activePreset,
  onSelectPreset
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const selectedCount = fields.filter(f => f.selected).length;

  return (
    <div className="space-y-4">
      {/* Header with Counter and Global Toggles */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-brand-400" />
          <h3 className="text-sm font-semibold text-slate-200">
            Output Fields Configuration
          </h3>
          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20">
            {selectedCount} of {fields.length} selected
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={onSelectAll}
            className="text-slate-400 hover:text-brand-400 font-medium transition"
          >
            Select All
          </button>
          <span className="text-slate-700">|</span>
          <button
            type="button"
            onClick={onDeselectAll}
            className="text-slate-400 hover:text-rose-400 font-medium transition"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Preset Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-slate-400 mr-1">Quick Presets:</span>
        <button
          type="button"
          onClick={() => onSelectPreset('PEOPLE')}
          className={`px-3 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-1.5 ${
            activePreset === 'PEOPLE'
              ? 'bg-brand-600 text-white shadow-sm shadow-brand-500/30'
              : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 border border-slate-700/60'
          }`}
        >
          <span>👤</span> People / CTO Profiles
        </button>
        <button
          type="button"
          onClick={() => onSelectPreset('COMPANIES')}
          className={`px-3 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-1.5 ${
            activePreset === 'COMPANIES'
              ? 'bg-brand-600 text-white shadow-sm shadow-brand-500/30'
              : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 border border-slate-700/60'
          }`}
        >
          <span>🏢</span> Company / Startup Discovery
        </button>
      </div>

      {/* Dynamic Fields Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
        {fields.map((field) => {
          const isSelected = Boolean(field.selected);
          return (
            <div
              key={field.key}
              onClick={() => onToggleField(field.key)}
              className={`group flex items-center justify-between p-2.5 rounded-xl border cursor-pointer select-none transition-all duration-150 ${
                isSelected
                  ? 'bg-brand-500/10 border-brand-500/40 text-white shadow-sm'
                  : 'bg-slate-850/60 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0 pr-1">
                {isSelected ? (
                  <CheckSquare className="w-4 h-4 text-brand-400 shrink-0" />
                ) : (
                  <Square className="w-4 h-4 text-slate-600 group-hover:text-slate-400 shrink-0" />
                )}
                <span className="text-xs font-medium truncate">
                  {field.label || field.key}
                </span>
              </div>

              {field.isCustom && (
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
                    Custom
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveCustomField(field.key);
                    }}
                    className="p-1 rounded text-slate-500 hover:text-rose-400 transition"
                    title="Remove custom field"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {/* Add Custom Field Trigger Card */}
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 p-2.5 rounded-xl border border-dashed border-slate-700 bg-slate-900/40 text-brand-400 hover:border-brand-500/60 hover:bg-brand-500/5 hover:text-brand-300 text-xs font-semibold transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add Custom Field</span>
        </button>
      </div>

      {/* Interactive Modal */}
      <CustomFieldModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddField={onAddField}
        existingKeys={fields.map(f => f.key)}
      />
    </div>
  );
}

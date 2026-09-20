import React, { useState } from 'react';
import { X, Plus, Sparkles, Check } from 'lucide-react';
import { normalizeFieldKey } from '../../types/fields';

export default function CustomFieldModal({ isOpen, onClose, onAddField, existingKeys = [] }) {
  const [fieldLabel, setFieldLabel] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const keyPreview = normalizeFieldKey(fieldLabel);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = fieldLabel.trim();
    if (!trimmed) {
      setError('Please enter a field name');
      return;
    }
    const key = normalizeFieldKey(trimmed);
    if (!key) {
      setError('Field name contains no valid alphanumeric characters');
      return;
    }
    if (existingKeys.includes(key)) {
      setError(`Field "${trimmed}" (key: "${key}") is already added`);
      return;
    }

    onAddField({
      key,
      label: trimmed,
      isCustom: true,
      selected: true
    });

    setFieldLabel('');
    setError('');
    onClose();
  };

  const quickSuggestions = [
    'Funding Stage',
    'Tech Stack',
    'Annual Revenue',
    'Total Employees',
    'Key Investors',
    'Founded Year',
    'Hiring Status'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-md shadow-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <div className="w-9 h-9 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400">
            <Plus className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-base">Add Custom Output Field</h3>
            <p className="text-xs text-slate-400">Define dynamic properties for your research task</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Field Label / Column Title
            </label>
            <input
              type="text"
              value={fieldLabel}
              onChange={(e) => {
                setFieldLabel(e.target.value);
                if (error) setError('');
              }}
              placeholder="e.g. Funding Stage, Tech Stack"
              autoFocus
              className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition"
            />
            {error && <p className="mt-1.5 text-xs text-rose-400">{error}</p>}
          </div>

          {keyPreview && (
            <div className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 text-xs text-slate-400 flex items-center justify-between">
              <span>Data Key Preview:</span>
              <code className="text-brand-400 font-mono bg-slate-900/80 px-2 py-0.5 rounded border border-slate-700">
                {keyPreview}
              </code>
            </div>
          )}

          <div>
            <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Popular Custom Suggestions:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {quickSuggestions.map((sug) => (
                <button
                  key={sug}
                  type="button"
                  onClick={() => {
                    setFieldLabel(sug);
                    setError('');
                  }}
                  className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:border-brand-500/50 hover:text-white transition"
                >
                  + {sug}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-md shadow-brand-600/30 flex items-center gap-1.5 transition"
            >
              <Check className="w-3.5 h-3.5" />
              Add Field to Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

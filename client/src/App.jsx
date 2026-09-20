import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/layout/Header';
import SearchQueryForm from './components/search/SearchQueryForm';
import JobStatusCard from './components/monitor/JobStatusCard';
import DynamicDataTable from './components/results/DynamicDataTable';
import FailedRecordsDrawer from './components/error/FailedRecordsDrawer';
import { PRESETS } from './types/fields';
import { createJob, getJobResults, getFailedRecords, cancelJob, getProviders } from './services/api';
import { useJobStream } from './hooks/useJobStream';

export default function App() {
  // Search & Configuration State
  const [query, setQuery] = useState(PRESETS.PEOPLE.defaultQuery);
  const [limit, setLimit] = useState(50);
  const [activePreset, setActivePreset] = useState('PEOPLE');
  const [fields, setFields] = useState(PRESETS.PEOPLE.fields);

  // Provider State
  const [activeProvider, setActiveProvider] = useState('simulation');
  const [providerInfo, setProviderInfo] = useState(null);

  // Job Execution State
  const [activeJobId, setActiveJobId] = useState(null);
  const [isStartingJob, setIsStartingJob] = useState(false);
  const [formError, setFormError] = useState('');

  // Results & Table State
  const [results, setResults] = useState([]);
  const [resultFields, setResultFields] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [tablePage, setTablePage] = useState(1);
  const [tableSearch, setTableSearch] = useState('');
  const [isLoadingResults, setIsLoadingResults] = useState(false);

  // Diagnostic Drawer State
  const [isFailedDrawerOpen, setIsFailedDrawerOpen] = useState(false);
  const [failedItems, setFailedItems] = useState([]);

  // Load provider health and configuration on startup
  useEffect(() => {
    getProviders()
      .then((res) => {
        if (res?.data) {
          setProviderInfo(res.data);
          if (res.data.activeProvider) {
            setActiveProvider(res.data.activeProvider);
          }
        }
      })
      .catch((err) => {
        console.warn('Failed to load provider info:', err);
      });
  }, []);

  // Fetch results for the current job
  const fetchResults = useCallback(async (jobId, page = 1, search = '') => {
    if (!jobId) return;
    setIsLoadingResults(true);
    try {
      const res = await getJobResults(jobId, { page, limit: 25, search });
      if (res?.data) {
        setResults(res.data.records || []);
        setResultFields(res.data.fields || []);
        setTotalRecords(res.data.pagination?.total || 0);
        setTablePage(res.data.pagination?.page || 1);
      }
    } catch (err) {
      console.error('Failed to fetch job results:', err);
    } finally {
      setIsLoadingResults(false);
    }
  }, []);

  // Completion callback when job finishes
  const handleJobCompleted = useCallback(async (finalJobState) => {
    const id = finalJobState?.jobId || finalJobState?.id || activeJobId;
    if (id) {
      await fetchResults(id, 1, '');
      try {
        const failedRes = await getFailedRecords(id);
        setFailedItems(failedRes?.data?.items || []);
      } catch (err) {
        console.warn('Failed to load failure diagnostics:', err);
      }
    }
  }, [fetchResults, activeJobId]);

  // Hook for live SSE / client progress stream
  const {
    jobState,
    isConnected,
    status: jobStatus,
    isFinished
  } = useJobStream(activeJobId, handleJobCompleted);

  // Fallback trigger to guarantee results are fetched once job is completed
  useEffect(() => {
    if (activeJobId && jobState?.status === 'completed' && results.length === 0) {
      fetchResults(activeJobId, 1, tableSearch);
    }
  }, [activeJobId, jobState?.status, results.length, tableSearch, fetchResults]);

  // Preset switching
  const handleSelectPreset = (presetKey) => {
    const preset = PRESETS[presetKey];
    if (preset) {
      setActivePreset(presetKey);
      setFields(preset.fields);
      setQuery(preset.defaultQuery);
      setFormError('');
    }
  };

  // Field toggles
  const handleToggleField = (key) => {
    setFields(prev =>
      prev.map(f => (f.key === key ? { ...f, selected: !f.selected } : f))
    );
  };

  const handleSelectAll = () => {
    setFields(prev => prev.map(f => ({ ...f, selected: true })));
  };

  const handleDeselectAll = () => {
    setFields(prev => prev.map(f => ({ ...f, selected: false })));
  };

  const handleAddField = (newField) => {
    setFields(prev => [...prev, newField]);
  };

  const handleRemoveCustomField = (key) => {
    setFields(prev => prev.filter(f => f.key !== key));
  };

  // Form submission / Job launch
  const handleStartCollection = async (e) => {
    e.preventDefault();
    setFormError('');

    const selectedFields = fields.filter(f => f.selected);
    if (!query.trim()) {
      setFormError('Please enter a valid search query');
      return;
    }
    if (selectedFields.length === 0) {
      setFormError('Please select at least one output field');
      return;
    }

    setIsStartingJob(true);
    setResults([]);
    setTotalRecords(0);
    setFailedItems([]);

    try {
      const selectedCategory = activePreset === 'COMPANIES' ? 'companies' : 'people';
      const res = await createJob({
        query: query.trim(),
        limit,
        fields: selectedFields,
        category: selectedCategory,
        provider: activeProvider
      });

      if (res?.data?.jobId) {
        setActiveJobId(res.data.jobId);
      }
    } catch (err) {
      console.error('Job creation failed:', err);
      setFormError(err.response?.data?.error?.message || 'Failed to start data collection job');
    } finally {
      setIsStartingJob(false);
    }
  };

  const handleCancel = async () => {
    if (activeJobId) {
      try {
        await cancelJob(activeJobId);
      } catch (err) {
        console.error('Cancel job error:', err);
      }
    }
  };

  const handleTablePageChange = (newPage) => {
    fetchResults(activeJobId, newPage, tableSearch);
  };

  const handleTableSearchChange = (term) => {
    setTableSearch(term);
    fetchResults(activeJobId, 1, term);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      {/* Top Navigation */}
      <Header
        activeProvider={activeProvider}
        providerInfo={providerInfo}
        isConnected={isConnected}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Research Query & Dynamic Field Configuration */}
        <section>
          <SearchQueryForm
            query={query}
            setQuery={setQuery}
            limit={limit}
            setLimit={setLimit}
            fields={fields}
            onToggleField={handleToggleField}
            onSelectAll={handleSelectAll}
            onDeselectAll={handleDeselectAll}
            onAddField={handleAddField}
            onRemoveCustomField={handleRemoveCustomField}
            activePreset={activePreset}
            onSelectPreset={handleSelectPreset}
            provider={activeProvider}
            onSelectProvider={setActiveProvider}
            providerInfo={providerInfo}
            onSubmit={handleStartCollection}
            isLoading={isStartingJob || jobStatus === 'in_progress'}
            error={formError}
          />
        </section>

        {/* Live Progress & Metric Monitor */}
        {activeJobId && jobState && (
          <section>
            <JobStatusCard
              jobState={jobState}
              onCancel={handleCancel}
              onOpenFailedDrawer={() => setIsFailedDrawerOpen(true)}
            />
          </section>
        )}

        {/* Results Dynamic Data Table */}
        {activeJobId && (results.length > 0 || isFinished) && (
          <section>
            <DynamicDataTable
              jobId={activeJobId}
              fields={resultFields.length > 0 ? resultFields : fields.filter(f => f.selected)}
              records={results}
              totalRecords={totalRecords}
              page={tablePage}
              limit={25}
              onPageChange={handleTablePageChange}
              searchTerm={tableSearch}
              onSearchChange={handleTableSearchChange}
              isLoading={isLoadingResults}
            />
          </section>
        )}
      </main>

      {/* Failed Records Inspection Drawer */}
      <FailedRecordsDrawer
        isOpen={isFailedDrawerOpen}
        onClose={() => setIsFailedDrawerOpen(false)}
        failedItems={failedItems}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-500">
        <p>LinkedIn Research & Data Collection Platform • Production-grade architecture with dynamic schema projection</p>
      </footer>
    </div>
  );
}

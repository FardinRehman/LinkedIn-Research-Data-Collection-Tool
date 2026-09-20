import { useState, useEffect, useRef, useCallback } from 'react';
import { getJobStatus, checkBackend } from '../services/api';

export function useJobStream(jobId, onJobCompleted) {
  const [jobState, setJobState] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [streamError, setStreamError] = useState(null);
  const eventSourceRef = useRef(null);
  const pollingTimerRef = useRef(null);
  const completedCalledRef = useRef(false);

  const cleanup = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (pollingTimerRef.current) {
      clearInterval(pollingTimerRef.current);
      pollingTimerRef.current = null;
    }
    setIsConnected(false);
  }, []);

  const handleUpdate = useCallback((data) => {
    if (!data) return;
    setJobState(data);
    const isTerminal = ['completed', 'failed', 'cancelled'].includes(data.status);
    
    if (isTerminal && !completedCalledRef.current) {
      completedCalledRef.current = true;
      if (onJobCompleted) {
        onJobCompleted(data);
      }
      cleanup();
    }
  }, [onJobCompleted, cleanup]);

  useEffect(() => {
    if (!jobId) {
      setJobState(null);
      return;
    }

    completedCalledRef.current = false;
    setStreamError(null);

    let isMounted = true;

    async function initStream() {
      const hasBackend = await checkBackend();

      if (!isMounted) return;

      if (!hasBackend) {
        // Standalone Client Mode (GitHub Pages)
        setIsConnected(true);
        // Fast polling loop on client engine
        pollingTimerRef.current = setInterval(async () => {
          try {
            const res = await getJobStatus(jobId);
            if (res?.data && isMounted) {
              handleUpdate(res.data);
            }
          } catch (err) {
            console.warn('Client job poll error:', err);
          }
        }, 300);
        return;
      }

      // Backend SSE Mode
      try {
        const initialRes = await getJobStatus(jobId);
        if (initialRes?.data && isMounted) {
          handleUpdate(initialRes.data);
        }
      } catch (err) {
        console.warn('Initial job status fetch failed:', err);
      }

      const eventUrl = `/api/jobs/${jobId}/events`;
      const es = new EventSource(eventUrl);
      eventSourceRef.current = es;

      es.onopen = () => {
        if (isMounted) {
          setIsConnected(true);
          setStreamError(null);
        }
      };

      es.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (isMounted) {
            handleUpdate(payload);
          }
        } catch (parseErr) {
          console.error('SSE JSON parse error:', parseErr);
        }
      };

      es.onerror = () => {
        if (isMounted) {
          setIsConnected(false);
          // Fallback to polling
          if (!pollingTimerRef.current) {
            pollingTimerRef.current = setInterval(async () => {
              try {
                const res = await getJobStatus(jobId);
                if (res?.data && isMounted) {
                  handleUpdate(res.data);
                }
              } catch (pollErr) {
                console.error('Polling error:', pollErr);
              }
            }, 1000);
          }
        }
      };
    }

    initStream();

    return () => {
      isMounted = false;
      cleanup();
    };
  }, [jobId, handleUpdate, cleanup]);

  return {
    jobState,
    isConnected,
    streamError,
    status: jobState?.status || 'idle',
    progress: jobState?.progress || { percent: 0, processedRecords: 0, uniqueRecords: 0, duplicateRecords: 0, failedRecords: 0, currentPage: 0 },
    metrics: jobState?.metrics || { unique: 0, duplicates: 0, failed: 0 },
    logs: jobState?.recentLogs || [],
    isFinished: ['completed', 'failed', 'cancelled'].includes(jobState?.status),
    isSuccess: jobState?.status === 'completed'
  };
}

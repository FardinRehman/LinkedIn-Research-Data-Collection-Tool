import { useState, useEffect, useRef, useCallback } from 'react';
import { getJobStatus } from '../services/api';

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

    // Initial fetch to get state immediately
    getJobStatus(jobId)
      .then((res) => {
        if (res?.data) {
          handleUpdate(res.data);
        }
      })
      .catch((err) => {
        console.warn('Initial job status fetch failed:', err);
      });

    // Setup Server-Sent Events (SSE)
    const eventUrl = `/api/jobs/${jobId}/events`;
    const es = new EventSource(eventUrl);
    eventSourceRef.current = es;

    es.onopen = () => {
      setIsConnected(true);
      setStreamError(null);
    };

    es.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        handleUpdate(payload);
      } catch (parseErr) {
        console.error('SSE JSON parse error:', parseErr);
      }
    };

    es.onerror = () => {
      setIsConnected(false);
      // If SSE errors out, fallback to light polling
      if (!pollingTimerRef.current) {
        pollingTimerRef.current = setInterval(async () => {
          try {
            const res = await getJobStatus(jobId);
            if (res?.data) {
              handleUpdate(res.data);
            }
          } catch (pollErr) {
            console.error('Polling error:', pollErr);
          }
        }, 1200);
      }
    };

    return () => {
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

/**
 * Session Activity Heartbeat & Idle Inactivity Guard
 * Implements #session-sliding-heartbeat architectural standard.
 */
import { useState, useEffect, useRef, useCallback } from 'react';

interface UseSessionHeartbeatOptions {
  timeoutMinutes?: number;
  onIdleTimeout?: () => void;
}

export function useSessionHeartbeat({
  timeoutMinutes = 15,
  onIdleTimeout,
}: UseSessionHeartbeatOptions = {}) {
  const [isIdleLocked, setIsIdleLocked] = useState(false);
  const lastActiveRef = useRef(Date.now());

  const resetActivity = useCallback(() => {
    lastActiveRef.current = Date.now();
  }, []);

  const unlock = useCallback(() => {
    resetActivity();
    setIsIdleLocked(false);
  }, [resetActivity]);

  useEffect(() => {
    let lastThrottledCall = 0;

    const handleUserActivity = () => {
      const now = Date.now();
      // Throttle activity updates to once every 10 seconds:
      if (now - lastThrottledCall > 10000) {
        lastThrottledCall = now;
        lastActiveRef.current = now;
      }
    };

    window.addEventListener('mousemove', handleUserActivity, { passive: true });
    window.addEventListener('keydown', handleUserActivity, { passive: true });
    window.addEventListener('scroll', handleUserActivity, { passive: true });
    window.addEventListener('touchstart', handleUserActivity, { passive: true });

    // Check idle status every 30 seconds
    const interval = setInterval(() => {
      const elapsed = Date.now() - lastActiveRef.current;
      const thresholdMs = timeoutMinutes * 60 * 1000;

      if (elapsed > thresholdMs && !isIdleLocked) {
        setIsIdleLocked(true);
        if (onIdleTimeout) onIdleTimeout();
      }
    }, 30000);

    return () => {
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('scroll', handleUserActivity);
      window.removeEventListener('touchstart', handleUserActivity);
      clearInterval(interval);
    };
  }, [timeoutMinutes, isIdleLocked, onIdleTimeout]);

  return { isIdleLocked, unlock, resetActivity };
}

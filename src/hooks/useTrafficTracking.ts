import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

// Generate a unique session ID
const getSessionId = () => {
  let sessionId = sessionStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    sessionStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
};

// Get device type
const getDeviceType = () => {
  const ua = navigator.userAgent;
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet';
  }
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
    return 'mobile';
  }
  return 'desktop';
};

// Get browser name
const getBrowserName = () => {
  const ua = navigator.userAgent;
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Chrome') && !ua.includes('Edg')) return 'Chrome';
  if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
  if (ua.includes('Edg')) return 'Edge';
  if (ua.includes('Opera') || ua.includes('OPR')) return 'Opera';
  return 'Unknown';
};

// Get OS name
const getOSName = () => {
  const ua = navigator.userAgent;
  if (ua.includes('Windows')) return 'Windows';
  if (ua.includes('Mac')) return 'MacOS';
  if (ua.includes('Linux')) return 'Linux';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
  return 'Unknown';
};

export const useTrafficTracking = () => {
  const location = useLocation();
  const sessionStartTime = useRef<number>(Date.now());
  const lastPagePath = useRef<string>(location.pathname);
  const sessionId = useRef<string>(getSessionId());
  const [isInitialized, setIsInitialized] = useState(false);

  // Track page view via edge function
  const trackPageView = async (path: string, isNewSession: boolean = false) => {
    try {
      const response = await fetch(
        'https://ybvfsxsapsshhtqpvukr.supabase.co/functions/v1/track-analytics',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId: sessionId.current,
            userId: null, // Will be set by edge function if authenticated
            pagePath: path,
            pageTitle: document.title,
            referrer: document.referrer,
            userAgent: navigator.userAgent,
            deviceType: getDeviceType(),
            browser: getBrowserName(),
            os: getOSName(),
            isNewSession,
            entryPage: isNewSession ? path : undefined,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to track page view');
      }
    } catch (error) {
      console.error('Error tracking page view:', error);
    }
  };

  // Initialize session (now handled by edge function)
  const initSession = async () => {
    // Session creation is now handled by track-analytics edge function
    // when isNewSession flag is true
  };

  // Update session duration (now done via edge function periodically)
  const updateSessionDuration = async () => {
    // Session duration updates are now handled by periodic calls to track-analytics
    // This prevents direct client access to sessions table
  };

  // Track on route change
  useEffect(() => {
    if (isInitialized && location.pathname !== lastPagePath.current) {
      trackPageView(location.pathname);
      lastPagePath.current = location.pathname;
    }
  }, [location.pathname, isInitialized]);

  // Initialize session on mount with delay
  useEffect(() => {
    // Delay initialization to ensure all providers are ready
    const timeoutId = setTimeout(() => {
      initSession();
      trackPageView(location.pathname, true); // Mark as new session
      setIsInitialized(true);
    }, 100);

    // Update duration before unload
    const handleBeforeUnload = () => {
      if (isInitialized) {
        updateSessionDuration();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // Update duration periodically (every 30 seconds)
    const interval = setInterval(() => {
      if (isInitialized) {
        updateSessionDuration();
      }
    }, 30000);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      clearInterval(interval);
      if (isInitialized) {
        updateSessionDuration();
      }
    };
  }, []);
};

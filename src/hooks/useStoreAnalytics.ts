import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

interface AnalyticsConfig {
  tenantId: string;
  enabled?: boolean;
}

interface PerformanceMetrics {
  ttfb_ms?: number;
  fcp_ms?: number;
  lcp_ms?: number;
  fid_ms?: number;
  cls?: number;
  dom_interactive_ms?: number;
  dom_complete_ms?: number;
}

type ClientGeo = { lat: number; lng: number; accuracy?: number };

// Get or create session ID
function getSessionId(): string {
  let sessionId = sessionStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = uuidv4();
    sessionStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
}

// Get or create visitor ID (persisted across sessions)
function getVisitorId(): string {
  let visitorId = localStorage.getItem('analytics_visitor_id');
  if (!visitorId) {
    visitorId = uuidv4();
    localStorage.setItem('analytics_visitor_id', visitorId);
  }
  return visitorId;
}

function readStoredGeo(): ClientGeo | null {
  try {
    const raw = sessionStorage.getItem('analytics_geo');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.lat !== 'number' || typeof parsed?.lng !== 'number') return null;
    return parsed as ClientGeo;
  } catch {
    return null;
  }
}

async function getClientGeoOnce(): Promise<ClientGeo | null> {
  const cached = readStoredGeo();
  if (cached) return cached;

  if (!('geolocation' in navigator)) return null;

  // Only prompt once per tab session.
  const prompted = sessionStorage.getItem('analytics_geo_prompted');
  if (prompted === '1') return null;
  sessionStorage.setItem('analytics_geo_prompted', '1');

  return await new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const geo: ClientGeo = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        };
        sessionStorage.setItem('analytics_geo', JSON.stringify(geo));
        resolve(geo);
      },
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 10 * 60 * 1000 }
    );
  });
}

// Detect device type
function getDeviceType(): string {
  const ua = navigator.userAgent;
  if (/tablet|ipad|playbook|silk/i.test(ua)) return 'tablet';
  if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) return 'mobile';
  return 'desktop';
}

// Detect browser
function getBrowser(): string {
  const ua = navigator.userAgent;
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Safari')) return 'Safari';
  if (ua.includes('Edge')) return 'Edge';
  if (ua.includes('Opera')) return 'Opera';
  return 'Other';
}

// Detect OS
function getOS(): string {
  const ua = navigator.userAgent;
  if (ua.includes('Windows')) return 'Windows';
  if (ua.includes('Mac')) return 'macOS';
  if (ua.includes('Linux')) return 'Linux';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
  return 'Other';
}

export function useStoreAnalytics({ tenantId, enabled = true }: AnalyticsConfig) {
  const sessionId = useRef(getSessionId());
  const visitorId = useRef(getVisitorId());
  const pageViewCount = useRef(0);
  const sessionStartTime = useRef(Date.now());
  const currentPage = useRef(window.location.pathname);
  const lastTrackedPath = useRef<string | null>(null);
  const hasEnded = useRef(false);

  const track = useCallback(
    async (type: string, data: Record<string, unknown> = {}) => {
      if (!enabled || !tenantId) return;

      try {
        const { error } = await supabase.functions.invoke('track-analytics', {
          headers: { 'x-tenant-id': tenantId },
          body: {
            type,
            session_id: sessionId.current,
            visitor_id: visitorId.current,
            data,
          },
        });
        if (error) console.warn('Analytics tracking failed:', error);
      } catch (err) {
        console.warn('Analytics tracking error:', err);
      }
    },
    [tenantId, enabled]
  );

  const trackEvent = useCallback(
    (eventType: string, eventData: Record<string, unknown> = {}) => {
      void track('event', {
        event_type: eventType,
        event_data: eventData,
        page_url: window.location.pathname,
      });
    },
    [track]
  );

  const trackPageView = useCallback(() => {
    pageViewCount.current++;
    currentPage.current = window.location.pathname;

    void track('page_view', {
      page_url: window.location.pathname,
      page_title: document.title,
      // This is relative within the SPA lifecycle; still useful as a proxy
      load_time_ms: Math.round(performance.now()),
    });
  }, [track]);

  const endSession = useCallback(() => {
    if (hasEnded.current) return;
    hasEnded.current = true;

    const duration = Math.round((Date.now() - sessionStartTime.current) / 1000);
    void track('session_end', {
      duration_seconds: duration,
      page_views: pageViewCount.current,
      exit_page: currentPage.current,
      is_bounce: pageViewCount.current <= 1,
    });
  }, [track]);

  // Track session start + attach lifecycle handlers
  useEffect(() => {
    if (!enabled || !tenantId) return;

    let disposed = false;

    const boot = async () => {
      // Check if this is a new session (30 min timeout)
      const lastActivity = sessionStorage.getItem('analytics_last_activity');
      const isNewSession = !lastActivity || Date.now() - parseInt(lastActivity) > 30 * 60 * 1000;

      if (isNewSession) {
        hasEnded.current = false;
        sessionId.current = uuidv4();
        sessionStorage.setItem('analytics_session_id', sessionId.current);
        sessionStartTime.current = Date.now();
        pageViewCount.current = 0;
        lastTrackedPath.current = null;

        // Best-effort: use browser geolocation when allowed (much more accurate than IP).
        const geo = await getClientGeoOnce();
        if (disposed) return;

        void track('session_start', {
          device_type: getDeviceType(),
          browser: getBrowser(),
          os: getOS(),
          referrer: document.referrer || null,
          landing_page: window.location.pathname,
          geo_lat: geo?.lat ?? null,
          geo_lng: geo?.lng ?? null,
          geo_accuracy_m: geo?.accuracy ?? null,
        });
      }

      sessionStorage.setItem('analytics_last_activity', Date.now().toString());
    };

    void boot();

    const onVisibilityChange = () => {
      // When the user backgrounds the tab/app, treat it as session end.
      if (document.visibilityState === 'hidden') {
        endSession();
      } else {
        sessionStorage.setItem('analytics_last_activity', Date.now().toString());
      }
    };

    const onPageHide = () => endSession();
    const onBeforeUnload = () => endSession();

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('pagehide', onPageHide);
    window.addEventListener('beforeunload', onBeforeUnload);

    return () => {
      disposed = true;
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('pagehide', onPageHide);
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, [tenantId, enabled, track, endSession]);

  // Track SPA route changes (poll window.location.pathname)
  useEffect(() => {
    if (!enabled || !tenantId) return;

    const tick = () => {
      const path = window.location.pathname;
      if (path !== lastTrackedPath.current) {
        lastTrackedPath.current = path;
        sessionStorage.setItem('analytics_last_activity', Date.now().toString());
        trackPageView();
      }
    };

    // Initial tick
    tick();

    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [tenantId, enabled, trackPageView]);

  // Track performance metrics
  useEffect(() => {
    if (!enabled || !tenantId) return;

    const observer = new PerformanceObserver((list) => {
      const metrics: PerformanceMetrics = {};

      for (const entry of list.getEntries()) {
        if (entry.entryType === 'navigation') {
          const nav = entry as PerformanceNavigationTiming;
          metrics.ttfb_ms = Math.round(nav.responseStart - nav.requestStart);
          metrics.dom_interactive_ms = Math.round(nav.domInteractive);
          metrics.dom_complete_ms = Math.round(nav.domComplete);
        }
        if (entry.entryType === 'paint' && entry.name === 'first-contentful-paint') {
          metrics.fcp_ms = Math.round(entry.startTime);
        }
        if (entry.entryType === 'largest-contentful-paint') {
          metrics.lcp_ms = Math.round(entry.startTime);
        }
        if (entry.entryType === 'first-input') {
          metrics.fid_ms = Math.round((entry as PerformanceEventTiming).processingStart - entry.startTime);
        }
        if (entry.entryType === 'layout-shift' && !(entry as any).hadRecentInput) {
          metrics.cls = (metrics.cls || 0) + (entry as any).value;
        }
      }

      if (Object.keys(metrics).length > 0) {
        void track('performance', {
          ...metrics,
          page_url: window.location.pathname,
          device_type: getDeviceType(),
          connection_type: (navigator as any).connection?.effectiveType || null,
        });
      }
    });

    try {
      observer.observe({
        entryTypes: ['navigation', 'paint', 'largest-contentful-paint', 'first-input', 'layout-shift'],
      });
    } catch {
      // Some entry types may not be supported
    }

    return () => observer.disconnect();
  }, [tenantId, enabled, track]);

  return { trackEvent, trackPageView };
}


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

  const track = useCallback(async (type: string, data: Record<string, unknown> = {}) => {
    if (!enabled || !tenantId) return;

    try {
      const { data: funcData, error } = await supabase.functions.invoke('track-analytics', {
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
  }, [tenantId, enabled]);

  const trackEvent = useCallback((eventType: string, eventData: Record<string, unknown> = {}) => {
    track('event', {
      event_type: eventType,
      event_data: eventData,
      page_url: window.location.pathname,
    });
  }, [track]);

  const trackPageView = useCallback(() => {
    pageViewCount.current++;
    currentPage.current = window.location.pathname;

    track('page_view', {
      page_url: window.location.pathname,
      page_title: document.title,
      load_time_ms: performance.now(),
    });
  }, [track]);

  // Track session start on mount
  useEffect(() => {
    if (!enabled || !tenantId) return;

    // Check if this is a new session
    const lastActivity = sessionStorage.getItem('analytics_last_activity');
    const isNewSession = !lastActivity || (Date.now() - parseInt(lastActivity)) > 30 * 60 * 1000; // 30 min timeout

    if (isNewSession) {
      sessionId.current = uuidv4();
      sessionStorage.setItem('analytics_session_id', sessionId.current);
      sessionStartTime.current = Date.now();

      track('session_start', {
        device_type: getDeviceType(),
        browser: getBrowser(),
        os: getOS(),
        referrer: document.referrer || null,
        landing_page: window.location.pathname,
      });
    }

    // Update last activity
    sessionStorage.setItem('analytics_last_activity', Date.now().toString());

    // Track initial page view
    trackPageView();

    // Track session end on page unload
    const handleUnload = () => {
      const duration = Math.round((Date.now() - sessionStartTime.current) / 1000);
      
      // Use sendBeacon for reliable delivery
      navigator.sendBeacon?.(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/track-analytics`,
        JSON.stringify({
          type: 'session_end',
          session_id: sessionId.current,
          visitor_id: visitorId.current,
          data: {
            duration_seconds: duration,
            page_views: pageViewCount.current,
            exit_page: currentPage.current,
            is_bounce: pageViewCount.current <= 1,
          },
        })
      );
    };

    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [tenantId, enabled, track, trackPageView]);

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
        track('performance', {
          ...metrics,
          page_url: window.location.pathname,
          device_type: getDeviceType(),
          connection_type: (navigator as any).connection?.effectiveType || null,
        });
      }
    });

    try {
      observer.observe({ entryTypes: ['navigation', 'paint', 'largest-contentful-paint', 'first-input', 'layout-shift'] });
    } catch (e) {
      // Some entry types may not be supported
    }

    return () => observer.disconnect();
  }, [tenantId, enabled, track]);

  return { trackEvent, trackPageView };
}

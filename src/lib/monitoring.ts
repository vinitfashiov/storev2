/**
 * Frontend monitoring and error tracking
 */

interface ErrorContext {
  url?: string;
  userId?: string;
  tenantId?: string;
  userAgent?: string;
  [key: string]: any;
}

class FrontendMonitor {
  private static instance: FrontendMonitor;

  static getInstance(): FrontendMonitor {
    if (!FrontendMonitor.instance) {
      FrontendMonitor.instance = new FrontendMonitor();
    }
    return FrontendMonitor.instance;
  }

  private initialized = false;

  /**
   * Initialize error tracking
   */
  init() {
    if (this.initialized) return;
    this.initialized = true;

    // Track unhandled errors
    window.addEventListener('error', (event) => {
      this.logError(new Error(event.message), {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
      });
    });

    // Track unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.logError(event.reason, {
        type: 'unhandledrejection',
      });
    });

    // Track performance
    if ('PerformanceObserver' in window) {
      try {
        const perfObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'navigation') {
              const navEntry = entry as PerformanceNavigationTiming;
              this.logPerformance({
                dns: navEntry.domainLookupEnd - navEntry.domainLookupStart,
                tcp: navEntry.connectEnd - navEntry.connectStart,
                request: navEntry.responseStart - navEntry.requestStart,
                response: navEntry.responseEnd - navEntry.responseStart,
                dom: navEntry.domContentLoadedEventEnd - navEntry.responseEnd,
                load: navEntry.loadEventEnd - navEntry.fetchStart,
              });
            }
          }
        });
        perfObserver.observe({ entryTypes: ['navigation'] });
      } catch (e) {
        console.warn('Performance tracking not available:', e);
      }
    }
  }

  /**
   * Log error
   */
  logError(error: Error | unknown, context?: ErrorContext): void {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    const logEntry = {
      level: 'error',
      message: errorMessage,
      stack: errorStack,
      context: {
        ...context,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
      },
    };

    console.error('Error logged:', logEntry);

    // Send to monitoring service (e.g., Supabase Edge Function)
    // You can create an edge function to receive these logs
    this.sendToBackend('/functions/v1/log-error', logEntry).catch(() => {
      // Fail silently - don't break the app
    });
  }

  /**
   * Log performance metric
   */
  logPerformance(metric: Record<string, number>): void {
    // Only log slow performance
    const total = Object.values(metric).reduce((a, b) => a + b, 0);
    if (total > 3000) {
      console.warn('Slow performance detected:', metric);
      this.sendToBackend('/functions/v1/log-performance', {
        metric,
        url: window.location.href,
        timestamp: new Date().toISOString(),
      }).catch(() => {
        // Fail silently
      });
    }
  }

  /**
   * Track custom event
   */
  trackEvent(eventName: string, properties?: Record<string, any>): void {
    console.log('Event tracked:', eventName, properties);

    // Send to analytics backend
    this.sendToBackend('/functions/v1/track-event', {
      event: eventName,
      properties,
      url: window.location.href,
      timestamp: new Date().toISOString(),
    }).catch(() => {
      // Fail silently
    });
  }

  private async sendToBackend(endpoint: string, data: any): Promise<void> {
    // Only send in production
    if (import.meta.env.MODE === 'development') {
      return;
    }

    try {
      // Use the proxy endpoint instead of raw VITE_SUPABASE_URL
      const supabaseUrl = '/supabase-api';

      await fetch(`${supabaseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
    } catch (error) {
      // Fail silently - monitoring should not break the app
      console.warn('Failed to send monitoring data:', error);
    }
  }
}

export const frontendMonitor = FrontendMonitor.getInstance();


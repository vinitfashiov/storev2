/**
 * Performance Utilities
 * 
 * Helpers for optimizing app performance:
 * - Request deduplication
 * - Debouncing/throttling
 * - Memory caching
 * - Prefetching
 */

// ===========================================
// IN-MEMORY CACHE WITH TTL
// ===========================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private maxSize = 100;

  set<T>(key: string, data: T, ttlMs: number = 60000): void {
    // Evict oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Get all keys matching a pattern
  getKeysMatching(pattern: string): string[] {
    return Array.from(this.cache.keys()).filter(key => key.includes(pattern));
  }

  // Invalidate all keys matching a pattern
  invalidatePattern(pattern: string): void {
    this.getKeysMatching(pattern).forEach(key => this.cache.delete(key));
  }
}

export const memoryCache = new MemoryCache();

// ===========================================
// REQUEST DEDUPLICATION
// ===========================================

const pendingRequests = new Map<string, Promise<any>>();

/**
 * Deduplicate concurrent requests with the same key
 * If a request with the same key is already in progress, return that promise
 */
export async function dedupeRequest<T>(
  key: string,
  requestFn: () => Promise<T>
): Promise<T> {
  // Check if request is already in progress
  const pending = pendingRequests.get(key);
  if (pending) {
    return pending as Promise<T>;
  }

  // Start new request
  const promise = requestFn().finally(() => {
    pendingRequests.delete(key);
  });

  pendingRequests.set(key, promise);
  return promise;
}

// ===========================================
// DEBOUNCE & THROTTLE
// ===========================================

/**
 * Debounce function - delays execution until after wait ms have passed
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), wait);
  };
}

/**
 * Throttle function - limits execution to once per wait ms
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  wait: number
): (...args: Parameters<T>) => void {
  let lastTime = 0;
  let timeoutId: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    const now = Date.now();
    const remaining = wait - (now - lastTime);

    if (remaining <= 0) {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      lastTime = now;
      fn(...args);
    } else if (!timeoutId) {
      timeoutId = setTimeout(() => {
        lastTime = Date.now();
        timeoutId = null;
        fn(...args);
      }, remaining);
    }
  };
}

// ===========================================
// PREFETCHING
// ===========================================

/**
 * Prefetch a URL (for navigation or API calls)
 */
export function prefetchUrl(url: string): void {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = url;
      document.head.appendChild(link);
    });
  }
}

/**
 * Preload a URL with high priority
 */
export function preloadUrl(url: string, as: 'script' | 'style' | 'image' | 'fetch' = 'fetch'): void {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = url;
  link.as = as;
  document.head.appendChild(link);
}

// ===========================================
// BATCH UPDATES
// ===========================================

/**
 * Batch multiple state updates into one render
 */
export function batchUpdates(updates: (() => void)[]): void {
  // React 18+ automatically batches updates, but this ensures it
  queueMicrotask(() => {
    updates.forEach(update => update());
  });
}

// ===========================================
// IDLE CALLBACK HELPERS
// ===========================================

/**
 * Run a function when browser is idle
 */
export function runWhenIdle(fn: () => void, timeout: number = 5000): void {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(fn, { timeout });
  } else {
    setTimeout(fn, 100);
  }
}

/**
 * Run multiple functions when browser is idle, one at a time
 */
export function runQueueWhenIdle(fns: (() => void)[]): void {
  let index = 0;

  function runNext() {
    if (index < fns.length) {
      runWhenIdle(() => {
        fns[index]();
        index++;
        runNext();
      });
    }
  }

  runNext();
}

// ===========================================
// PERFORMANCE MEASUREMENT
// ===========================================

/**
 * Measure execution time of a function
 */
export async function measureTime<T>(
  name: string,
  fn: () => T | Promise<T>
): Promise<T> {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;
  
  if (import.meta.env.DEV) {
    console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`);
  }
  
  return result;
}

/**
 * Create a performance mark
 */
export function mark(name: string): void {
  if (import.meta.env.DEV && 'performance' in window) {
    performance.mark(name);
  }
}

/**
 * Measure between two marks
 */
export function measure(name: string, startMark: string, endMark: string): void {
  if (import.meta.env.DEV && 'performance' in window) {
    try {
      performance.measure(name, startMark, endMark);
      const entries = performance.getEntriesByName(name);
      if (entries.length > 0) {
        console.log(`📊 ${name}: ${entries[0].duration.toFixed(2)}ms`);
      }
    } catch (e) {
      // Marks might not exist
    }
  }
}

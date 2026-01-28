// Optimized Supabase client for maximum performance
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Performance-optimized Supabase client
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false, // Skip URL parsing for faster init
    flowType: 'pkce', // More secure and efficient
  },
  global: {
    headers: {
      'x-client-info': 'storekriti-web/1.0',
    },
    // Fetch with keepalive for faster subsequent requests
    fetch: (url, options = {}) => {
      return fetch(url, {
        ...options,
        keepalive: true,
      });
    },
  },
  db: {
    schema: 'public',
  },
  realtime: {
    params: {
      eventsPerSecond: 2, // Reduce realtime overhead
    },
  },
});

// Preload auth session on module load for faster initial check
supabase.auth.getSession();

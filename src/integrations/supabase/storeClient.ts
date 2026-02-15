// Isolated Supabase client for store customer authentication.
// Uses a separate localStorage key so store customer sessions
// do NOT interfere with the admin panel's Supabase session.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabaseStore = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
        // Different storage key from the admin client — this is the critical isolation.
        // Admin client uses the default key 'sb-<ref>-auth-token'.
        // This store client uses 'sb-store-customer-auth-token'.
        storageKey: 'sb-store-customer-auth-token',
        storage: localStorage,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        flowType: 'pkce',
    },
    global: {
        headers: {
            'x-client-info': 'storekriti-store/1.0',
        },
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
});

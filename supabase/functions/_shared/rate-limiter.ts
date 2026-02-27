import { SupabaseClient } from "jsr:@supabase/supabase-js@2";

export class RateLimiter {
    private client: SupabaseClient;

    constructor(client: SupabaseClient) {
        this.client = client;
    }

    /**
     * Check if a request is rate limited.
     * Uses a sliding window counter approach backed by Postgres.
     * @param key Unique identifier (e.g., "signup:1.2.3.4")
     * @param limit Max requests allowed
     * @param windowSeconds Time window in seconds
     * @returns true if allowed, false if limited
     */
    async check(key: string, limit: number, windowSeconds: number): Promise<boolean> {
        // Atomic transaction using Postgres RPC to avoid race conditions
        const { data, error } = await this.client.rpc("check_rate_limit", {
            p_key: key,
            p_limit: limit,
            p_window_seconds: windowSeconds
        });

        if (error) {
            console.error("Rate limiter error:", error);
            // Fail open on error
            return true;
        }

        return !!data;
    }
}

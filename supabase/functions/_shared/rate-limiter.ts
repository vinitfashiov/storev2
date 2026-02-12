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
        const now = new Date();
        const windowStart = new Date(now.getTime() - windowSeconds * 1000);

        // 1. Delete old entries (Housekeeping - could be done via cron)
        // For simplicity/robustness, we just reset the count if it's old

        // Upsert logic:
        // If exists and last_request > windowStart, increment count.
        // If exists and last_request < windowStart, reset count to 1.
        // If not exists, insert count = 1.

        // We can do this atomically with a PL/SQL function, but for now client-side logic:

        const { data, error } = await this.client
            .from("rate_limits")
            .select("*")
            .eq("key", key)
            .single();

        if (error && error.code !== "PGRST116") {
            console.error("Rate limiter error:", error);
            return true; // Fail open
        }

        if (!data) {
            // First request
            await this.client.from("rate_limits").insert({ key, count: 1, last_request: now });
            return true;
        }

        if (new Date(data.last_request) < windowStart) {
            // Window expired, reset
            await this.client.from("rate_limits").update({ count: 1, last_request: now }).eq("key", key);
            return true;
        }

        if (data.count >= limit) {
            return false; // Limited
        }

        // Increment
        await this.client.from("rate_limits").update({ count: data.count + 1, last_request: now }).eq("key", key);
        return true;
    }
}

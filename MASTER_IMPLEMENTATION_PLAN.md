# STOREKRITI - MASTER IMPLEMENTATION PLAN
## Enterprise-Grade, Zero-Crash, Rocket-Speed SaaS Platform

**Total Issues Found:** 87 bugs + 120+ performance improvements + 40+ enterprise features
**Estimated Phases:** 10 phases across ~8-10 weeks
**Goal:** Zero crashes, millisecond responses, enterprise reliability

---

## TABLE OF CONTENTS

1. [Phase 1: CRITICAL Security & Payment Fixes (Week 1)](#phase-1)
2. [Phase 2: Zero-Crash Error Handling & Boundaries (Week 1-2)](#phase-2)
3. [Phase 3: Backend Reliability & Atomicity (Week 2-3)](#phase-3)
4. [Phase 4: Rocket Speed - Frontend Performance (Week 3-4)](#phase-4)
5. [Phase 5: Rocket Speed - Backend & Database (Week 4-5)](#phase-5)
6. [Phase 6: Enterprise Edge Functions & Middleware (Week 5-6)](#phase-6)
7. [Phase 7: Enterprise Caching & CDN (Week 6-7)](#phase-7)
8. [Phase 8: Monitoring, Observability & Auto-Healing (Week 7-8)](#phase-8)
9. [Phase 9: Accessibility, PWA & Mobile Perfection (Week 8-9)](#phase-9)
10. [Phase 10: Final Hardening & Load Testing (Week 9-10)](#phase-10)

---

# PHASE 1: CRITICAL SECURITY & PAYMENT FIXES {#phase-1}
**Priority:** BLOCKING - Nothing else until these are done
**Timeline:** Week 1 (Days 1-5)
**Risk if skipped:** Data breach, financial loss, account takeover

## 1.1 Rotate Exposed Credentials (Day 1, ~2 hours)

**Files to change:**
- `.env`
- `.env.example`
- `.gitignore`

**Tasks:**
- [ ] 1.1.1 Rotate Supabase anon key in Supabase Dashboard → Project Settings → API
- [ ] 1.1.2 Rotate Supabase service role key
- [ ] 1.1.3 Remove `.env` from git history using `git filter-branch` or BFG
- [ ] 1.1.4 Ensure `.env` is in `.gitignore` (verify it's not tracked)
- [ ] 1.1.5 Create `.env.example` with placeholder values only (no real keys)
- [ ] 1.1.6 Update all deployment environments (Vercel, Supabase) with new keys
- [ ] 1.1.7 Verify app works with new keys

---

## 1.2 Fix OTP Generation - Use Cryptographic Randomness (Day 1, ~1 hour)

**Files to change:**
- `supabase/functions/admin-otp/index.ts` (line 13)
- `supabase/functions/store-customer-otp/index.ts` (line 14)

**Current (VULNERABLE):**
```typescript
function generateOTP(): string {
  return (100000 + Math.floor(Math.random() * 900000)).toString();
}
```

**New (SECURE):**
```typescript
function generateOTP(): string {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return String(100000 + (array[0] % 900000));
}
```

**Tasks:**
- [ ] 1.2.1 Replace `Math.random()` with `crypto.getRandomValues()` in admin-otp
- [ ] 1.2.2 Replace `Math.random()` with `crypto.getRandomValues()` in store-customer-otp
- [ ] 1.2.3 Test OTP generation produces valid 6-digit numbers
- [ ] 1.2.4 Verify OTP distribution is uniform (no bias)

---

## 1.3 Add Rate Limiting to ALL OTP Endpoints (Day 1-2, ~6 hours)

**Files to create:**
- `supabase/functions/_shared/rate-limiter.ts` (enhance existing)

**Files to change:**
- `supabase/functions/admin-otp/index.ts`
- `supabase/functions/store-customer-otp/index.ts`
- `supabase/functions/delivery-boy-auth/index.ts`

**New migration to create:**
- `supabase/migrations/YYYYMMDD_otp_rate_limiting.sql`

**Rate Limit Rules:**
```
OTP Send:     3 per hour per phone number
OTP Verify:   5 attempts per 15 minutes per phone number
OTP Resend:   3 per hour per phone number
Admin Login:  10 per hour per IP
Delivery Auth: 5 per hour per phone number
```

**Tasks:**
- [ ] 1.3.1 Create `otp_verification_attempts` table in new migration
- [ ] 1.3.2 Create `check_otp_rate_limit` PostgreSQL function with atomic counting
- [ ] 1.3.3 Add rate limit check before OTP send in admin-otp
- [ ] 1.3.4 Add rate limit check before OTP verify in admin-otp
- [ ] 1.3.5 Add rate limit check before OTP send in store-customer-otp
- [ ] 1.3.6 Add rate limit check before OTP verify in store-customer-otp
- [ ] 1.3.7 Add rate limit check in delivery-boy-auth
- [ ] 1.3.8 Return 429 with `Retry-After` header when rate limited
- [ ] 1.3.9 Add attempt tracking (record every failed verify attempt)
- [ ] 1.3.10 Clear attempts on successful verification
- [ ] 1.3.11 Add periodic cleanup cron for old attempt records (>24 hours)

---

## 1.4 Implement CORS Whitelist (Day 2, ~4 hours)

**Files to create:**
- `supabase/functions/_shared/cors.ts`

**Files to change (ALL 23 edge functions):**
- Every `index.ts` in `supabase/functions/*/`

**Allowed Origins:**
```typescript
const ALLOWED_ORIGINS = [
  'https://storekriti.com',
  'https://*.storekriti.com',
  'https://*.vercel.app',
  'http://localhost:8080',   // Dev only
  'http://localhost:5173',   // Vite dev
];
// PLUS: All verified custom domains from `custom_domains` table
```

**Tasks:**
- [ ] 1.4.1 Create `_shared/cors.ts` with `isOriginAllowed()` and `getCorsHeaders()` functions
- [ ] 1.4.2 Add function to dynamically load allowed custom domains from database (with cache)
- [ ] 1.4.3 Replace `corsHeaders` import with `getCorsHeaders(req)` in admin-otp
- [ ] 1.4.4 Replace in store-customer-otp
- [ ] 1.4.5 Replace in create-razorpay-order
- [ ] 1.4.6 Replace in verify-razorpay-payment
- [ ] 1.4.7 Replace in razorpay-webhook (keep webhook-specific validation)
- [ ] 1.4.8 Replace in ALL remaining 18 edge functions
- [ ] 1.4.9 Return 403 for unauthorized origins (not just empty header)
- [ ] 1.4.10 Add logging for rejected origins (detect attacks)
- [ ] 1.4.11 Test with legitimate origins
- [ ] 1.4.12 Test rejection of malicious origins

---

## 1.5 Fix Payment Webhook Idempotency (Day 2-3, ~5 hours)

**Files to change:**
- `supabase/functions/razorpay-webhook/index.ts`

**New migration:**
- `supabase/migrations/YYYYMMDD_webhook_idempotency.sql`

**Tasks:**
- [ ] 1.5.1 Add `UNIQUE` constraint on `payment_webhooks.razorpay_event_id`
- [ ] 1.5.2 Add `processed` boolean column to `payment_webhooks` table
- [ ] 1.5.3 Before processing any webhook: check if `razorpay_event_id` already exists
- [ ] 1.5.4 If exists and `processed = true`: return 200 immediately (skip processing)
- [ ] 1.5.5 If exists and `processed = false`: retry processing
- [ ] 1.5.6 After successful processing: set `processed = true`
- [ ] 1.5.7 Wrap entire webhook handler in try-catch with proper status codes
- [ ] 1.5.8 Add refund amount validation (cannot exceed order total)
- [ ] 1.5.9 Test with duplicate webhook payloads
- [ ] 1.5.10 Test with concurrent webhooks for same event

---

## 1.6 Fix Order Creation Race Condition (Day 3, ~3 hours)

**Files to change:**
- `supabase/functions/verify-razorpay-payment/index.ts`

**New migration:**
- `supabase/migrations/YYYYMMDD_order_uniqueness.sql`

**Tasks:**
- [ ] 1.6.1 Add `UNIQUE(order_number, tenant_id)` constraint on orders table
- [ ] 1.6.2 Replace SELECT-then-INSERT pattern with INSERT...ON CONFLICT
- [ ] 1.6.3 Handle duplicate key error gracefully (return existing order)
- [ ] 1.6.4 Wrap payment intent + order + coupon in atomic database function
- [ ] 1.6.5 Add `await` to delivery assignment (not fire-and-forget)
- [ ] 1.6.6 Add error handling for delivery assignment failure
- [ ] 1.6.7 Add transaction rollback on partial failure

---

## 1.7 Fix Open Redirect in OAuth Callback (Day 3, ~2 hours)

**Files to change:**
- `supabase/functions/razorpay-oauth-callback/index.ts`
- `supabase/functions/razorpay-oauth-init/index.ts`

**Tasks:**
- [ ] 1.7.1 Create `isValidRedirectUrl()` function with host whitelist
- [ ] 1.7.2 Validate `redirectUrl` before using in `Response.redirect()`
- [ ] 1.7.3 If invalid redirect, redirect to `/` instead
- [ ] 1.7.4 Log invalid redirect attempts
- [ ] 1.7.5 Same fix for razorpay-oauth-init

---

## 1.8 Fix Delivery Boy Session Security (Day 3, ~2 hours)

**Files to change:**
- `supabase/functions/delivery-boy-auth/index.ts`

**Tasks:**
- [ ] 1.8.1 Replace `crypto.randomUUID()` session tokens with signed JWTs
- [ ] 1.8.2 Include `tenant_id` and `delivery_boy_id` in JWT payload
- [ ] 1.8.3 Set JWT expiration to 24 hours (not 7 days)
- [ ] 1.8.4 Implement actual session revocation on logout (DELETE from sessions table)
- [ ] 1.8.5 Validate both token AND tenant_id on every authenticated request
- [ ] 1.8.6 Add rate limiting to delivery auth endpoint

---

## 1.9 Remove Plaintext Password from Responses (Day 4, ~3 hours)

**Files to change:**
- `supabase/functions/admin-otp/index.ts`
- `supabase/functions/store-customer-otp/index.ts`

**Tasks:**
- [ ] 1.9.1 Stop returning passwords in HTTP response body
- [ ] 1.9.2 Use Supabase `signInWithPassword` internally, return only session token
- [ ] 1.9.3 Ensure client-side auth flow works with token-only response
- [ ] 1.9.4 Update Auth.tsx and StoreAuth.tsx to use new token-based response
- [ ] 1.9.5 Test signup + signin flow end-to-end

---

## 1.10 Add Security Headers to Vercel (Day 4, ~2 hours)

**Files to change:**
- `vercel.json`

**Headers to add:**
```json
{
  "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline' https://checkout.razorpay.com; ...",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "Permissions-Policy": "geolocation=(), camera=(), microphone=()"
}
```

**Tasks:**
- [ ] 1.10.1 Add `headers` section to vercel.json
- [ ] 1.10.2 Add Content-Security-Policy (allow Razorpay, Supabase, self)
- [ ] 1.10.3 Add X-Content-Type-Options: nosniff
- [ ] 1.10.4 Add X-Frame-Options: DENY
- [ ] 1.10.5 Add Strict-Transport-Security (HSTS)
- [ ] 1.10.6 Add Referrer-Policy
- [ ] 1.10.7 Add Permissions-Policy
- [ ] 1.10.8 Test that app still works with CSP restrictions
- [ ] 1.10.9 Test Razorpay checkout still loads under CSP

---

## 1.11 Fix Amount Validation on Payment Endpoints (Day 4, ~2 hours)

**Files to change:**
- `supabase/functions/create-razorpay-order/index.ts`
- `supabase/functions/create-upgrade-order/index.ts`
- `supabase/functions/verify-razorpay-payment/index.ts`

**Tasks:**
- [ ] 1.11.1 Validate amount is positive number, not zero, not negative
- [ ] 1.11.2 Validate amount doesn't exceed max (e.g., Rs 10,00,000)
- [ ] 1.11.3 Validate amount matches payment intent amount (for verification)
- [ ] 1.11.4 Add payment amount mismatch detection and incident logging
- [ ] 1.11.5 Block order fulfillment on amount mismatch (hold for review)
- [ ] 1.11.6 Create `payment_incidents` table for mismatch tracking

---

## 1.12 Fix errorResponse() Missing Parameters (Day 5, ~1 hour)

**Files to change:**
- `supabase/functions/store-signup/index.ts`
- `supabase/functions/log-error/index.ts`
- `supabase/functions/log-performance/index.ts`

**Tasks:**
- [ ] 1.12.1 Fix all calls to `errorResponse()` to include `req` as first parameter
- [ ] 1.12.2 Search for any other functions with same issue
- [ ] 1.12.3 Add TypeScript strict parameter checking

---

**Phase 1 Total: ~33 hours | 47 tasks | MUST complete before any production traffic**

---

# PHASE 2: ZERO-CRASH ERROR HANDLING & BOUNDARIES {#phase-2}
**Priority:** CRITICAL - Makes app uncrashable
**Timeline:** Week 1-2 (Days 4-8)

## 2.1 Create Enterprise Error Boundary System (Day 4-5, ~4 hours)

**Files to create:**
- `src/components/ErrorBoundary.tsx` (enhance existing)
- `src/components/error/CheckoutErrorBoundary.tsx`
- `src/components/error/AuthErrorBoundary.tsx`
- `src/components/error/DashboardErrorBoundary.tsx`
- `src/components/error/StoreErrorBoundary.tsx`

**Tasks:**
- [ ] 2.1.1 Enhance existing ErrorBoundary with error reporting to backend
- [ ] 2.1.2 Create CheckoutErrorBoundary with cart recovery (save cart to localStorage before crash)
- [ ] 2.1.3 Create AuthErrorBoundary with "retry login" fallback UI
- [ ] 2.1.4 Create DashboardErrorBoundary with "reload section" option
- [ ] 2.1.5 Create StoreErrorBoundary with "back to store home" fallback
- [ ] 2.1.6 Each boundary shows user-friendly message (not stack trace)
- [ ] 2.1.7 Each boundary sends error to `log-error` edge function
- [ ] 2.1.8 Add retry button that resets error state and re-renders children

---

## 2.2 Wrap ALL Critical Routes in Error Boundaries (Day 5, ~3 hours)

**Files to change:**
- `src/App.tsx`
- `src/pages/Dashboard.tsx`
- `src/pages/Auth.tsx`
- `src/routes/StoreRoutes.tsx`
- `src/pages/store/CheckoutPage.tsx`
- All admin pages in `src/pages/admin/`

**Tasks:**
- [ ] 2.2.1 Wrap `<Routes>` in App.tsx with top-level ErrorBoundary
- [ ] 2.2.2 Wrap Auth.tsx component with AuthErrorBoundary
- [ ] 2.2.3 Wrap Dashboard and all admin routes with DashboardErrorBoundary
- [ ] 2.2.4 Wrap CheckoutPage.tsx with CheckoutErrorBoundary
- [ ] 2.2.5 Wrap store home and product pages with StoreErrorBoundary
- [ ] 2.2.6 Wrap each lazy-loaded route in individual Suspense + ErrorBoundary
- [ ] 2.2.7 Add fallback UI for Suspense (loading skeletons, not spinners)

---

## 2.3 Fix Auth Flow - Zero Crash (Day 5-6, ~5 hours)

**Files to change:**
- `src/contexts/AuthContext.tsx`
- `src/pages/Auth.tsx`

**Tasks:**
- [ ] 2.3.1 Add `mounted` ref flag to prevent state updates after unmount
- [ ] 2.3.2 Add AbortController to `getSession()` promise
- [ ] 2.3.3 Fix `signOut()` error in session init (wrap in try-catch)
- [ ] 2.3.4 Add timeout (5 seconds) to all `supabase.functions.invoke()` calls
- [ ] 2.3.5 Validate API response shapes with Zod before using data
- [ ] 2.3.6 Fix redirect race condition (check both `user` AND `profile` before redirect)
- [ ] 2.3.7 Add separate loading states: `phoneLoading`, `otpLoading`, `signInLoading`
- [ ] 2.3.8 Add AbortController to prevent double OTP send
- [ ] 2.3.9 Fix countdown timer cleanup on unmount
- [ ] 2.3.10 Add retry button for failed sign-in after OTP
- [ ] 2.3.11 Replace unbounded `dataCache` Map with LRU cache (max 20 entries)
- [ ] 2.3.12 Add cache invalidation by prefix for tenant switching

---

## 2.4 Fix Store Auth Flow - Zero Crash (Day 6, ~3 hours)

**Files to change:**
- `src/contexts/StoreAuthContext.tsx`
- `src/pages/store/StoreAuth.tsx` (or StoreLogin/StoreSignup)

**Tasks:**
- [ ] 2.4.1 Fix duplicate `toast.success()` calls (lines 179-180, 235-236)
- [ ] 2.4.2 Add tenant ID validation before API calls
- [ ] 2.4.3 Add error handling for `refreshCustomer()` failure
- [ ] 2.4.4 Add AbortController for request cancellation
- [ ] 2.4.5 Add timeout to all function invocations
- [ ] 2.4.6 Validate response shapes with Zod

---

## 2.5 Fix Checkout Flow - Zero Crash (Day 6-7, ~6 hours)

**Files to change:**
- `src/pages/store/CheckoutPage.tsx`

**Tasks:**
- [ ] 2.5.1 Add AbortController to prevent double form submission
- [ ] 2.5.2 Add timeout (5s) to Razorpay script loading with retry UI
- [ ] 2.5.3 Add error handling for address save (currently ignored)
- [ ] 2.5.4 Add error handling for coupon redemption operations (currently ignored)
- [ ] 2.5.5 Add error handling for delivery assignment (currently only console.error)
- [ ] 2.5.6 Fix Razorpay payment handler memory leak (mounted flag)
- [ ] 2.5.7 Memoize `getImageUrl` function with useCallback
- [ ] 2.5.8 Debounce zone matching (300ms) instead of every keystroke
- [ ] 2.5.9 Parallel fetch for settings + zones + slots (Promise.all instead of sequential)
- [ ] 2.5.10 Fix coupon discount recalculation (prevent infinite loop)
- [ ] 2.5.11 Add loading states: `loadingAddresses`, `loadingZones`, `loadingSlots`
- [ ] 2.5.12 Clear appliedCoupon on coupon error (prevent stale discount)
- [ ] 2.5.13 Validate cart items before submission (price > 0, stock available)
- [ ] 2.5.14 Save cart to localStorage before payment (recovery on crash)

---

## 2.6 Fix Supabase Client Isolation (Day 7, ~3 hours)

**Files to change:**
- `src/integrations/supabase/client.ts`
- `src/integrations/supabase/storeClient.ts`
- `src/contexts/StoreAuthContext.tsx`

**Tasks:**
- [ ] 2.6.1 Use separate localStorage key prefixes for admin vs store client
- [ ] 2.6.2 Admin client: `sb-admin-auth-token` storage key
- [ ] 2.6.3 Store client: `sb-store-auth-token` storage key
- [ ] 2.6.4 Verify admin logout doesn't affect store session
- [ ] 2.6.5 Verify store logout doesn't affect admin session
- [ ] 2.6.6 Test multi-tab scenario (admin in one tab, store in another)

---

## 2.7 Add Auth Guard to Dashboard (Day 7, ~2 hours)

**Files to change:**
- `src/pages/Dashboard.tsx`

**Tasks:**
- [ ] 2.7.1 Add redirect to `/auth` if user is null and loading is false
- [ ] 2.7.2 Add role check (only `owner` or `super_admin` can access dashboard)
- [ ] 2.7.3 Show unauthorized page for wrong roles
- [ ] 2.7.4 Add loading skeleton while auth state resolving

---

## 2.8 Add Global Request Timeout & Retry Utility (Day 8, ~3 hours)

**Files to create:**
- `src/lib/request-utils.ts`

**Tasks:**
- [ ] 2.8.1 Create `withTimeout(promise, ms)` utility
- [ ] 2.8.2 Create `withRetry(fn, maxRetries, backoff)` utility
- [ ] 2.8.3 Create `invokeFunction(name, body, options)` wrapper for all edge function calls
- [ ] 2.8.4 Default timeout: 5 seconds for auth, 10 seconds for payments, 15 seconds for shipping
- [ ] 2.8.5 Default retry: 2 retries with exponential backoff (500ms, 1000ms)
- [ ] 2.8.6 Replace all direct `supabase.functions.invoke()` calls with this wrapper
- [ ] 2.8.7 Add request deduplication for identical concurrent requests

---

## 2.9 Fix useCart Error Handling (Day 8, ~2 hours)

**Files to change:**
- `src/hooks/useCart.tsx`

**Tasks:**
- [ ] 2.9.1 Add `error` state to hook return value
- [ ] 2.9.2 Differentiate "cart empty" from "network error" in fetchCart
- [ ] 2.9.3 Add retry mechanism for failed cart fetches
- [ ] 2.9.4 Show error toast on cart operation failures (not just addToCart)
- [ ] 2.9.5 Memoize `getSubtotal` with useMemo (not recalculated every render)

---

**Phase 2 Total: ~31 hours | 55 tasks | Makes app uncrashable for users**

---

# PHASE 3: BACKEND RELIABILITY & ATOMICITY {#phase-3}
**Priority:** HIGH - Prevents data corruption
**Timeline:** Week 2-3 (Days 8-15)

## 3.1 Create Atomic Transaction Helper (Day 8-9, ~5 hours)

**Files to create:**
- `supabase/functions/_shared/transactions.ts`
- `supabase/migrations/YYYYMMDD_atomic_operations.sql`

**Tasks:**
- [ ] 3.1.1 Create `create_order_with_payment` PostgreSQL function (atomic order + payment intent + coupon)
- [ ] 3.1.2 Create `process_payment_webhook` PostgreSQL function (atomic payment update + order update)
- [ ] 3.1.3 Create `redeem_coupon_atomic` PostgreSQL function (atomic redemption + usage increment)
- [ ] 3.1.4 All functions use `BEGIN...COMMIT...ROLLBACK` pattern
- [ ] 3.1.5 Add `SELECT FOR UPDATE` where needed to prevent race conditions
- [ ] 3.1.6 Update verify-razorpay-payment to use `create_order_with_payment`
- [ ] 3.1.7 Update razorpay-webhook to use `process_payment_webhook`

---

## 3.2 Fix Coupon Race Conditions (Day 9, ~3 hours)

**Files to change:**
- `supabase/functions/validate-coupon/index.ts`
- New migration for atomic coupon operations

**Tasks:**
- [ ] 3.2.1 Create `validate_and_reserve_coupon` PostgreSQL function (SELECT FOR UPDATE + check limits)
- [ ] 3.2.2 Add per-customer usage limit checking
- [ ] 3.2.3 Atomic usage increment (not check-then-increment)
- [ ] 3.2.4 Add coupon reservation (5-minute hold during checkout)
- [ ] 3.2.5 Release reservation if checkout fails
- [ ] 3.2.6 Add periodic cleanup of expired reservations

---

## 3.3 Fix Rate Limiter Race Condition (Day 10, ~2 hours)

**Files to change:**
- `supabase/migrations/20260226_rate_limiter_fix.sql` (update)
- `supabase/functions/_shared/rate-limiter.ts`

**Tasks:**
- [ ] 3.3.1 Use `SELECT ... FOR UPDATE` in `check_rate_limit` function
- [ ] 3.3.2 Wrap in explicit transaction
- [ ] 3.3.3 Test with 100 concurrent requests
- [ ] 3.3.4 Verify counter accuracy under load

---

## 3.4 Add Input Validation to ALL Edge Functions (Day 10-11, ~6 hours)

**Files to create:**
- `supabase/functions/_shared/validators.ts`

**Files to change:** All 23 edge functions

**Tasks:**
- [ ] 3.4.1 Create Zod schemas for every function's request body
- [ ] 3.4.2 Add `validateRequest(req, schema)` utility function
- [ ] 3.4.3 Apply validation at entry point of every function
- [ ] 3.4.4 Return 400 with specific validation error messages
- [ ] 3.4.5 Validate UUIDs, phone numbers, email addresses, amounts
- [ ] 3.4.6 Add max payload size check (1MB limit)
- [ ] 3.4.7 Sanitize string inputs (trim, remove control characters)

---

## 3.5 Add Request Timeouts to All External API Calls (Day 11, ~3 hours)

**Files to change:**
- `supabase/functions/create-razorpay-order/index.ts`
- `supabase/functions/shiprocket-create-shipment/index.ts`
- `supabase/functions/verify-domain-dns/index.ts`
- All functions with external `fetch()` calls

**Tasks:**
- [ ] 3.5.1 Create `fetchWithTimeout(url, options, timeoutMs)` utility
- [ ] 3.5.2 Razorpay API calls: 10-second timeout
- [ ] 3.5.3 Shiprocket API calls: 15-second timeout
- [ ] 3.5.4 Vercel DNS API calls: 10-second timeout
- [ ] 3.5.5 Fast2SMS API calls: 5-second timeout
- [ ] 3.5.6 Return 504 Gateway Timeout if external call times out

---

## 3.6 Fix Shiprocket Webhook & Shipment Issues (Day 12, ~3 hours)

**Files to change:**
- `supabase/functions/shiprocket-webhook/index.ts`
- `supabase/functions/shiprocket-create-shipment/index.ts`

**Tasks:**
- [ ] 3.6.1 Add webhook retry queue (return 202 instead of 404 when shipment not found)
- [ ] 3.6.2 Add idempotency check for shipment creation (UNIQUE on order_id)
- [ ] 3.6.3 Handle Shiprocket duplicate order error gracefully
- [ ] 3.6.4 Validate Shiprocket API response structure
- [ ] 3.6.5 Add order status validation (only create shipment if confirmed)

---

## 3.7 Fix Domain Verification Security (Day 12, ~2 hours)

**Files to change:**
- `supabase/functions/verify-domain-dns/index.ts`

**Tasks:**
- [ ] 3.7.1 Add domain format validation (regex + TLD check)
- [ ] 3.7.2 Add UUID validation for domain_id
- [ ] 3.7.3 URL-encode domain in API calls to prevent injection
- [ ] 3.7.4 Validate Vercel API response before trusting

---

## 3.8 Encrypt OAuth Tokens at Rest (Day 13, ~4 hours)

**Files to create:**
- `supabase/functions/_shared/encryption.ts`

**Files to change:**
- `supabase/functions/razorpay-oauth-callback/index.ts`
- `supabase/functions/create-razorpay-order/index.ts` (decrypt when using token)

**Tasks:**
- [ ] 3.8.1 Create AES-256-GCM encryption/decryption functions
- [ ] 3.8.2 Store `ENCRYPTION_KEY` as Supabase secret (not in code)
- [ ] 3.8.3 Encrypt OAuth access token before database insert
- [ ] 3.8.4 Encrypt OAuth refresh token before database insert
- [ ] 3.8.5 Decrypt when needed for API calls
- [ ] 3.8.6 Migrate existing plaintext tokens to encrypted versions

---

## 3.9 Add File Upload Security (Day 13, ~2 hours)

**New migration:**
- `supabase/migrations/YYYYMMDD_file_upload_security.sql`

**Tasks:**
- [ ] 3.9.1 Add file type whitelist (images, PDFs, documents only)
- [ ] 3.9.2 Add file size limit (50MB max)
- [ ] 3.9.3 Update storage RLS policy with type/size checks
- [ ] 3.9.4 Block executable file types (.exe, .sh, .bat, .js, .html)
- [ ] 3.9.5 Validate MIME type matches file extension

---

## 3.10 Add Edge Function Middleware Pattern (Day 14, ~4 hours)

**Files to create:**
- `supabase/functions/_shared/middleware.ts`

**Tasks:**
- [ ] 3.10.1 Create `withCors(handler)` middleware
- [ ] 3.10.2 Create `withRateLimit(handler, config)` middleware
- [ ] 3.10.3 Create `withValidation(handler, schema)` middleware
- [ ] 3.10.4 Create `withLogging(handler)` middleware (request ID, timing)
- [ ] 3.10.5 Create `withTimeout(handler, ms)` middleware
- [ ] 3.10.6 Create `compose(...middlewares)` to chain them
- [ ] 3.10.7 Refactor all edge functions to use middleware pattern:
  ```typescript
  serve(compose(
    withCors,
    withRateLimit({ max: 60, windowSeconds: 60 }),
    withLogging,
    withValidation(requestSchema),
    withTimeout(10000),
    handler
  ));
  ```

---

**Phase 3 Total: ~34 hours | 52 tasks | Prevents all data corruption**

---

# PHASE 4: ROCKET SPEED - FRONTEND PERFORMANCE {#phase-4}
**Priority:** HIGH - Makes every click feel instant
**Timeline:** Week 3-4 (Days 15-22)
**Target:** < 100ms for any UI interaction, < 1.5s page load

## 4.1 Add Aggressive Cache-Control Headers (Day 15, ~1 hour)

**Files to change:**
- `vercel.json`

**Cache Strategy:**
```
Static assets (JS/CSS/images): max-age=31536000, immutable (1 year, content-hashed)
HTML (index.html):             max-age=0, must-revalidate (always fresh)
API proxy responses:           s-maxage=60, stale-while-revalidate=3600
Fonts:                         max-age=31536000, immutable
```

**Tasks:**
- [ ] 4.1.1 Add Cache-Control for `/assets/*` → 1 year, immutable
- [ ] 4.1.2 Add Cache-Control for `/*.js` → 1 year, immutable
- [ ] 4.1.3 Add Cache-Control for `/*.css` → 1 year, immutable
- [ ] 4.1.4 Add Cache-Control for `/index.html` → no-cache, must-revalidate
- [ ] 4.1.5 Add Cache-Control for `/supabase-api/*` → s-maxage=60, stale-while-revalidate=3600
- [ ] 4.1.6 Add Early Hints (`Link` header) for critical JS/CSS bundles
- [ ] 4.1.7 Add `Vary: Accept-Encoding` header

---

## 4.2 Optimize Bundle Splitting & Size (Day 15-16, ~4 hours)

**Files to change:**
- `vite.config.ts`
- `src/App.tsx`

**Tasks:**
- [ ] 4.2.1 Split vendor-ui into `vendor-ui-core` (dialog, dropdown - used everywhere) and `vendor-ui-heavy` (calendar, carousel - few pages)
- [ ] 4.2.2 Add named chunks for lazy routes: `/* webpackChunkName: "dashboard" */`
- [ ] 4.2.3 Add bundle size limits with rollup-plugin-visualizer
- [ ] 4.2.4 Set performance budget: main chunk < 150KB, total initial < 400KB
- [ ] 4.2.5 Move `react-globe.gl` to fully dynamic import (only on analytics page)
- [ ] 4.2.6 Move GrapesJS plugins to separate chunk (only on page builder)
- [ ] 4.2.7 Enable CSS code splitting (separate CSS files per route)
- [ ] 4.2.8 Add content hash to all output filenames for long-term caching:
  ```typescript
  output: {
    entryFileNames: 'assets/[name].[hash].js',
    chunkFileNames: 'assets/[name].[hash].js',
    assetFileNames: 'assets/[name].[hash][extname]'
  }
  ```
- [ ] 4.2.9 Verify tree-shaking removes unused code from date-fns, lodash, etc.
- [ ] 4.2.10 Add build size report to CI/CD pipeline

---

## 4.3 Smart Preloading Strategy (Day 16, ~3 hours)

**Files to change:**
- `src/App.tsx`
- `src/pages/Dashboard.tsx`

**Tasks:**
- [ ] 4.3.1 Replace "preload all 40+ pages" with "preload top 5 based on user role"
- [ ] 4.3.2 Owner: Preload Dashboard, Products, Orders, Categories, Settings
- [ ] 4.3.3 Super Admin: Preload SuperAdminDashboard, DataBrowser, Stores
- [ ] 4.3.4 Add hover-based preloading on nav links:
  ```typescript
  <NavLink onMouseEnter={() => import('./admin/AdminProducts')} />
  ```
- [ ] 4.3.5 Add intersection-observer preloading for below-fold sections
- [ ] 4.3.6 Preload next page data (not just code) on idle
- [ ] 4.3.7 Track which pages users visit most; adjust preload order over time

---

## 4.4 Image Optimization System (Day 17-18, ~6 hours)

**Files to change:**
- `src/components/ui/optimized-image.tsx`

**Tasks:**
- [ ] 4.4.1 Add `<picture>` element with WebP + fallback JPEG/PNG
- [ ] 4.4.2 Add `srcset` with responsive sizes (400w, 800w, 1200w, 1920w)
- [ ] 4.4.3 Add `sizes` attribute for responsive loading
- [ ] 4.4.4 Implement Low-Quality Image Placeholder (LQIP) - tiny blurred preview
- [ ] 4.4.5 Add explicit `width` and `height` attributes to prevent CLS
- [ ] 4.4.6 Use IntersectionObserver for lazy loading (with 200px rootMargin)
- [ ] 4.4.7 Add image loading performance tracking
- [ ] 4.4.8 BannerImage: Use `eager` only on desktop, `lazy` on mobile
- [ ] 4.4.9 Product thumbnails: Load at 400px width (not full size)
- [ ] 4.4.10 Add batch preloading with concurrency limit (max 4 simultaneous)
- [ ] 4.4.11 Consider CDN image optimization (Cloudflare Image Resizing or imgix)

---

## 4.5 Virtual List & Scroll Optimization (Day 18, ~3 hours)

**Files to change:**
- `src/components/ui/virtual-list.tsx`

**Tasks:**
- [ ] 4.5.1 Throttle scroll handler to 16ms (60fps cap)
- [ ] 4.5.2 Use stable item keys (item.id instead of index)
- [ ] 4.5.3 Add scroll position restoration on navigation back
- [ ] 4.5.4 Detect scroll velocity; increase overscan for fast scrolling
- [ ] 4.5.5 Add loading skeleton during infinite scroll fetch
- [ ] 4.5.6 Fix `onEndReached` to not fire multiple times (500ms cooldown)
- [ ] 4.5.7 VirtualGrid: Make columns responsive to container width
- [ ] 4.5.8 Add CSS-based grid layout (replace absolute positioning)

---

## 4.6 React Query Optimization (Day 19, ~3 hours)

**Files to change:**
- `src/App.tsx` (query client config)
- All query hooks

**Tasks:**
- [ ] 4.6.1 Implement tiered staleTime per data type:
  ```
  User profile: 5 minutes
  Products: 2 minutes
  Orders: 30 seconds
  Settings: 10 minutes
  Analytics: 1 minute
  ```
- [ ] 4.6.2 Add `placeholderData` for instant UI (show cached while refetching)
- [ ] 4.6.3 Add `keepPreviousData` for pagination (no flash between pages)
- [ ] 4.6.4 Implement optimistic updates for cart operations
- [ ] 4.6.5 Implement optimistic updates for order status changes
- [ ] 4.6.6 Add `prefetchQuery` for next page data on pagination hover
- [ ] 4.6.7 Use `select` transform to reduce re-renders (only subscribe to needed fields)
- [ ] 4.6.8 Add error retry with exponential backoff (500ms, 1s, 2s)

---

## 4.7 Reduce Re-renders Across App (Day 19-20, ~4 hours)

**Files to change:**
- `src/contexts/DeliveryAuthContext.tsx`
- `src/contexts/GroceryLocationContext.tsx`
- `src/contexts/StoreAnalyticsContext.tsx`
- Various components

**Tasks:**
- [ ] 4.7.1 DeliveryAuthContext: Add change detection before setState (don't set same values)
- [ ] 4.7.2 GroceryLocationContext: Add AbortController for stale pincode checks
- [ ] 4.7.3 StoreAnalyticsContext: Scope session/visitor IDs per tenant
- [ ] 4.7.4 Batch multiple setState calls with `flushSync` or `startTransition`
- [ ] 4.7.5 Memoize expensive calculations in all contexts with useMemo
- [ ] 4.7.6 Use `React.memo` on heavy components (product cards, order rows)
- [ ] 4.7.7 Split large contexts into smaller, focused ones where appropriate

---

## 4.8 Skeleton Loading States Everywhere (Day 20-21, ~4 hours)

**Files to create:**
- `src/components/skeletons/DashboardSkeleton.tsx`
- `src/components/skeletons/ProductListSkeleton.tsx`
- `src/components/skeletons/OrderListSkeleton.tsx`
- `src/components/skeletons/CheckoutSkeleton.tsx`
- `src/components/skeletons/AdminPageSkeleton.tsx`

**Tasks:**
- [ ] 4.8.1 Create reusable skeleton components matching actual UI layout
- [ ] 4.8.2 Replace all spinner-only loading with skeletons
- [ ] 4.8.3 Dashboard: Show card skeletons while analytics load
- [ ] 4.8.4 Product list: Show product card skeletons while fetching
- [ ] 4.8.5 Orders: Show table row skeletons while fetching
- [ ] 4.8.6 Checkout: Show section skeletons for addresses, delivery, payment
- [ ] 4.8.7 Admin lazy routes: Show page skeleton during chunk load
- [ ] 4.8.8 Store pages: Show content skeleton while page builder data loads

---

## 4.9 Client-Side Navigation Speed (Day 21-22, ~3 hours)

**Files to change:**
- `src/App.tsx`
- `src/components/NavLink.tsx`
- `src/components/PreloadLink.tsx`

**Tasks:**
- [ ] 4.9.1 Use `startTransition` for route changes (keep old UI while loading new)
- [ ] 4.9.2 Add route data prefetching on link hover (200ms delay)
- [ ] 4.9.3 Add prefetch on link visible (IntersectionObserver)
- [ ] 4.9.4 Implement instant back/forward with cached views
- [ ] 4.9.5 Add progress bar at top of page during route transitions
- [ ] 4.9.6 Ensure no full-page blank flash between routes

---

**Phase 4 Total: ~31 hours | 65 tasks | Every interaction feels instant**

---

# PHASE 5: ROCKET SPEED - BACKEND & DATABASE {#phase-5}
**Priority:** HIGH - Makes API responses lightning fast
**Timeline:** Week 4-5 (Days 22-29)
**Target:** < 50ms for cached queries, < 200ms for database queries

## 5.1 Implement Cursor-Based Pagination (Day 22-23, ~6 hours)

**Files to change:**
- `src/lib/pagination.ts`
- All admin pages using pagination

**Tasks:**
- [ ] 5.1.1 Add `cursorPaginatedQuery()` function using keyset pagination
- [ ] 5.1.2 Use `WHERE id > :last_id ORDER BY id LIMIT :limit` instead of OFFSET
- [ ] 5.1.3 Support cursor-based pagination for products, orders, customers
- [ ] 5.1.4 Add `limit` validation (min 1, max 100)
- [ ] 5.1.5 Cache total count separately (recount only on data change)
- [ ] 5.1.6 Prefetch next page data on idle
- [ ] 5.1.7 Update frontend pagination controls to use cursor tokens
- [ ] 5.1.8 Support backward pagination (previous page)

---

## 5.2 Optimize Database Queries (Day 23-24, ~5 hours)

**New migration:**
- `supabase/migrations/YYYYMMDD_performance_indexes.sql`

**Tasks:**
- [ ] 5.2.1 Add composite indexes for common query patterns:
  ```sql
  CREATE INDEX idx_products_tenant_status ON products(tenant_id, status);
  CREATE INDEX idx_orders_tenant_created ON orders(tenant_id, created_at DESC);
  CREATE INDEX idx_customers_tenant_email ON customers(tenant_id, email);
  CREATE INDEX idx_analytics_tenant_type_time ON analytics_events(tenant_id, event_type, created_at);
  ```
- [ ] 5.2.2 Replace `listUsers()` with direct email lookup in OTP functions
- [ ] 5.2.3 Use `SELECT` with specific columns instead of `SELECT *`
- [ ] 5.2.4 Add `LIMIT` to all queries that could return large result sets
- [ ] 5.2.5 Optimize N+1 queries in razorpay-webhook (use JOIN)
- [ ] 5.2.6 Optimize N+1 queries in shiprocket-create-shipment (combine queries)
- [ ] 5.2.7 Add EXPLAIN ANALYZE for slow queries and optimize

---

## 5.3 Upgrade Edge Function Caching (Day 24-25, ~5 hours)

**Files to change:**
- `supabase/functions/_shared/cache.ts`

**Tasks:**
- [ ] 5.3.1 Replace FIFO eviction with LRU (track access time, evict least recently used)
- [ ] 5.3.2 Add expired entry cleanup on access (lazy cleanup)
- [ ] 5.3.3 Add periodic cleanup (every 60 seconds, remove expired)
- [ ] 5.3.4 Add cache statistics (hits, misses, evictions, hit ratio)
- [ ] 5.3.5 Make max size configurable per function
- [ ] 5.3.6 Add context-aware TTL:
  ```
  Tenant data: 3600s (1 hour)
  Store settings: 1800s (30 min)
  Products: 300s (5 min)
  Integrations: 600s (10 min)
  ```
- [ ] 5.3.7 Add batch get/set operations
- [ ] 5.3.8 Add cache prewarming on function cold start
- [ ] 5.3.9 Optimize domain lookup to single JOIN query (not 2 sequential queries)
- [ ] 5.3.10 Add request deduplication for concurrent identical queries

---

## 5.4 Add Database Connection Optimization (Day 25, ~2 hours)

**Files to change:**
- `src/integrations/supabase/client.ts`
- `supabase/functions/_shared/utils.ts`

**Tasks:**
- [ ] 5.4.1 Use `keepalive` selectively (only for high-frequency endpoints)
- [ ] 5.4.2 Add connection health checking (periodic ping)
- [ ] 5.4.3 Add automatic retry with exponential backoff for failed queries
- [ ] 5.4.4 Reduce Realtime event rate to 1/sec (from 2/sec) for battery saving
- [ ] 5.4.5 Add query result streaming for large datasets (paginated fetch)
- [ ] 5.4.6 Use `IN` queries for batch lookups instead of N individual queries

---

## 5.5 Implement Stale-While-Revalidate Pattern (Day 26, ~3 hours)

**Files to change:**
- `src/main.tsx` (service worker config)
- `vite.config.ts` (PWA config)

**Tasks:**
- [ ] 5.5.1 Add StaleWhileRevalidate for product listing API calls
- [ ] 5.5.2 Add StaleWhileRevalidate for store settings API calls
- [ ] 5.5.3 Keep NetworkFirst for auth and payment calls (must be fresh)
- [ ] 5.5.4 Reduce SW update check interval: 5min → 10min → 60min (exponential)
- [ ] 5.5.5 Use `navigator.sendBeacon` for monitoring data (guaranteed delivery on page close)
- [ ] 5.5.6 Implement soft update (no full page reload on SW update)

---

## 5.6 Add Response Compression (Day 26, ~2 hours)

**Files to change:**
- `supabase/functions/_shared/utils.ts`

**Tasks:**
- [ ] 5.6.1 Add gzip compression for responses > 1KB in edge functions
- [ ] 5.6.2 Set `Content-Encoding: gzip` header
- [ ] 5.6.3 Check `Accept-Encoding` header before compressing
- [ ] 5.6.4 Select only needed columns in edge function queries (reduce payload)

---

**Phase 5 Total: ~23 hours | 38 tasks | API responses in < 200ms**

---

# PHASE 6: ENTERPRISE EDGE FUNCTIONS & MIDDLEWARE {#phase-6}
**Priority:** MEDIUM-HIGH - Makes backend production-ready
**Timeline:** Week 5-6 (Days 29-36)

## 6.1 Implement Circuit Breaker Pattern (Day 29-30, ~5 hours)

**Files to create:**
- `supabase/functions/_shared/circuit-breaker.ts`

**Tasks:**
- [ ] 6.1.1 Create CircuitBreaker class with states: CLOSED, OPEN, HALF_OPEN
- [ ] 6.1.2 Track failure count per external service (Razorpay, Shiprocket, Fast2SMS, Vercel)
- [ ] 6.1.3 Open circuit after 5 consecutive failures
- [ ] 6.1.4 Return 503 immediately when circuit is open (don't make doomed API call)
- [ ] 6.1.5 Half-open: Allow 1 test request every 30 seconds
- [ ] 6.1.6 Close circuit when test request succeeds
- [ ] 6.1.7 Apply to all external API calls

---

## 6.2 Implement Saga Pattern for Multi-Step Operations (Day 30-31, ~6 hours)

**Files to create:**
- `supabase/functions/_shared/saga.ts`

**Tasks:**
- [ ] 6.2.1 Create Saga class with execute/compensate step pairs
- [ ] 6.2.2 Payment saga: Create intent → Create Razorpay order → Verify payment → Create order → Assign delivery
- [ ] 6.2.3 Each step has compensating action (rollback):
  ```
  Create intent → Delete intent
  Create Razorpay order → Cancel Razorpay order
  Create order → Cancel order
  Assign delivery → Unassign delivery
  ```
- [ ] 6.2.4 On failure at any step: execute compensating actions in reverse order
- [ ] 6.2.5 Log each saga step for debugging
- [ ] 6.2.6 Apply to verify-razorpay-payment flow

---

## 6.3 Add Distributed Request Tracing (Day 31-32, ~4 hours)

**Files to change:**
- `supabase/functions/_shared/middleware.ts`
- All edge functions

**Tasks:**
- [ ] 6.3.1 Generate `x-request-id` for each incoming request
- [ ] 6.3.2 Pass request-id through all internal calls and logs
- [ ] 6.3.3 Include request-id in all error responses
- [ ] 6.3.4 Log entry/exit for every function with timing
- [ ] 6.3.5 Log all external API calls with request-id, duration, status
- [ ] 6.3.6 Create structured JSON log format:
  ```json
  { "requestId": "...", "function": "...", "operation": "...", "duration": 50, "status": "success" }
  ```

---

## 6.4 Add Request Size & Rate Limits to All Functions (Day 32-33, ~4 hours)

**Tasks:**
- [ ] 6.4.1 Add Content-Length validation (max 1MB for most, 10MB for file uploads)
- [ ] 6.4.2 Return 413 Payload Too Large for oversized requests
- [ ] 6.4.3 Add per-function rate limits:
  ```
  Auth functions:     30 req/min per IP
  Payment functions:  10 req/min per user
  Webhook functions:  100 req/min per IP
  Analytics:          60 req/min per session
  Admin functions:    60 req/min per user
  ```
- [ ] 6.4.4 Add rate limit headers to responses (X-RateLimit-Remaining, X-RateLimit-Reset)

---

## 6.5 Implement Idempotency Key System (Day 33-34, ~4 hours)

**Files to create:**
- `supabase/functions/_shared/idempotency.ts`
- New migration for `idempotency_keys` table

**Tasks:**
- [ ] 6.5.1 Create `idempotency_keys` table (key, result, created_at, expires_at)
- [ ] 6.5.2 Client sends `Idempotency-Key` header with each mutation
- [ ] 6.5.3 Before processing: check if key exists → return cached result
- [ ] 6.5.4 After processing: store result with key (24-hour TTL)
- [ ] 6.5.5 Apply to payment creation, order creation, coupon redemption
- [ ] 6.5.6 Add periodic cleanup of expired keys

---

## 6.6 Add Health Check Endpoints (Day 34, ~2 hours)

**Files to create:**
- `supabase/functions/health/index.ts`

**Tasks:**
- [ ] 6.6.1 Create `/functions/v1/health` endpoint
- [ ] 6.6.2 Check database connectivity
- [ ] 6.6.3 Check external services (Razorpay, Shiprocket) status
- [ ] 6.6.4 Return component-level health status
- [ ] 6.6.5 Use for uptime monitoring (Uptime Robot, Pingdom, etc.)

---

**Phase 6 Total: ~25 hours | 30 tasks | Enterprise-grade backend reliability**

---

# PHASE 7: ENTERPRISE CACHING & CDN {#phase-7}
**Priority:** MEDIUM - Massive speed boost for repeat visits
**Timeline:** Week 6-7 (Days 36-43)

## 7.1 Implement Multi-Layer Caching Strategy (Day 36-37, ~5 hours)

**Architecture:**
```
Layer 1: Browser Cache (Cache-Control headers) → 0ms
Layer 2: Service Worker Cache (PWA) → 5ms
Layer 3: React Query Cache (in-memory) → 1ms
Layer 4: Edge Cache (Vercel/Cloudflare) → 10ms
Layer 5: Edge Function Cache (Deno in-memory) → 5ms
Layer 6: Database (PostgreSQL) → 50-200ms
```

**Tasks:**
- [ ] 7.1.1 Configure service worker cache tiers:
  ```
  Tier 1 (CacheFirst):  Fonts, static images, vendor JS
  Tier 2 (StaleWhileRevalidate): Product data, store settings, categories
  Tier 3 (NetworkFirst): Auth, payments, orders, real-time data
  ```
- [ ] 7.1.2 Configure React Query cache tiers:
  ```
  Static data (settings, categories): staleTime 10 minutes
  Semi-static (products, banners): staleTime 2 minutes
  Dynamic (orders, cart, analytics): staleTime 30 seconds
  Real-time (live sessions): staleTime 0 (always refetch)
  ```
- [ ] 7.1.3 Add edge cache rules to vercel.json for API responses
- [ ] 7.1.4 Implement cache invalidation on mutations (optimistic + background revalidate)
- [ ] 7.1.5 Add cache warming on app load (prefetch critical data)

---

## 7.2 Implement Optimistic Updates (Day 37-38, ~4 hours)

**Files to change:**
- `src/hooks/useCart.tsx`
- Admin order status updates
- Admin product updates

**Tasks:**
- [ ] 7.2.1 Cart add: Show item in cart immediately, revert on error
- [ ] 7.2.2 Cart remove: Remove item immediately, revert on error
- [ ] 7.2.3 Cart quantity update: Update count immediately, revert on error
- [ ] 7.2.4 Order status change: Update status immediately, revert on error
- [ ] 7.2.5 Product toggle (active/inactive): Toggle immediately, revert on error
- [ ] 7.2.6 Implement rollback UI (brief "undoing..." toast on error)

---

## 7.3 Add CDN Image Optimization (Day 38-39, ~4 hours)

**Tasks:**
- [ ] 7.3.1 Set up Supabase Storage image transformation (or Cloudflare Images)
- [ ] 7.3.2 Generate optimized URLs with width/height/quality parameters
- [ ] 7.3.3 Product thumbnails: 400x400, quality 80, WebP
- [ ] 7.3.4 Product detail: 800x800, quality 85, WebP
- [ ] 7.3.5 Banners: 1200x400, quality 90, WebP
- [ ] 7.3.6 Avatars: 100x100, quality 75, WebP
- [ ] 7.3.7 Add blur placeholder generation for all images

---

## 7.4 Implement Edge-Side Includes (ESI) for Store Pages (Day 39-40, ~4 hours)

**Tasks:**
- [ ] 7.4.1 Cache store home page at edge (1-minute TTL)
- [ ] 7.4.2 Cache product listing at edge (30-second TTL)
- [ ] 7.4.3 Cache product detail at edge (1-minute TTL)
- [ ] 7.4.4 Dynamic parts (cart count, auth status) loaded client-side
- [ ] 7.4.5 Invalidate cache on product/inventory change
- [ ] 7.4.6 Test with Vercel Edge Middleware

---

**Phase 7 Total: ~17 hours | 24 tasks | Sub-100ms responses for cached data**

---

# PHASE 8: MONITORING, OBSERVABILITY & AUTO-HEALING {#phase-8}
**Priority:** MEDIUM - Detect and fix issues before users notice
**Timeline:** Week 7-8 (Days 43-50)

## 8.1 Implement Core Web Vitals Tracking (Day 43-44, ~4 hours)

**Files to change:**
- `src/lib/monitoring.ts`

**Tasks:**
- [ ] 8.1.1 Track LCP (Largest Contentful Paint) - target < 2.5s
- [ ] 8.1.2 Track FID (First Input Delay) - target < 100ms
- [ ] 8.1.3 Track CLS (Cumulative Layout Shift) - target < 0.1
- [ ] 8.1.4 Track FCP (First Contentful Paint) - target < 1.8s
- [ ] 8.1.5 Track TTFB (Time to First Byte) - target < 600ms
- [ ] 8.1.6 Track Long Tasks (> 50ms JavaScript execution)
- [ ] 8.1.7 Send metrics with device info (memory, CPU cores, network type)
- [ ] 8.1.8 Implement 10% sampling for high-traffic (100% for errors)
- [ ] 8.1.9 Use `navigator.sendBeacon` for guaranteed delivery on page close

---

## 8.2 Implement Structured Logging (Day 44-45, ~4 hours)

**Files to change:**
- `supabase/functions/_shared/monitoring.ts`
- `src/lib/monitoring.ts`

**Tasks:**
- [ ] 8.2.1 Create structured JSON log format for backend
- [ ] 8.2.2 Include: timestamp, level, requestId, tenantId, operation, duration, status
- [ ] 8.2.3 Log all edge function entry/exit with timing
- [ ] 8.2.4 Log all external API calls
- [ ] 8.2.5 Log all database queries > 100ms
- [ ] 8.2.6 Batch frontend logs (queue + flush every 5 seconds or on 10 entries)
- [ ] 8.2.7 Lower performance threshold from 3000ms to 1000ms

---

## 8.3 Create Admin Monitoring Dashboard (Day 45-46, ~5 hours)

**Tasks:**
- [ ] 8.3.1 Add real-time error count widget to admin dashboard
- [ ] 8.3.2 Add API response time P95 widget
- [ ] 8.3.3 Add active users / live sessions count
- [ ] 8.3.4 Add payment success/failure rate widget
- [ ] 8.3.5 Add system health status (all services green/yellow/red)
- [ ] 8.3.6 Add alert for error rate > 1% (show notification in admin)

---

## 8.4 Implement Auto-Healing Patterns (Day 46-47, ~4 hours)

**Tasks:**
- [ ] 8.4.1 Auto-retry failed API calls (3x with exponential backoff)
- [ ] 8.4.2 Auto-reconnect WebSocket on disconnect
- [ ] 8.4.3 Auto-refresh auth token 5 minutes before expiry
- [ ] 8.4.4 Auto-clear stale cache entries on error
- [ ] 8.4.5 Auto-recover from service worker conflicts (soft reload)
- [ ] 8.4.6 Auto-fallback to direct Supabase URL if proxy fails

---

**Phase 8 Total: ~17 hours | 24 tasks | Issues detected and fixed automatically**

---

# PHASE 9: ACCESSIBILITY, PWA & MOBILE PERFECTION {#phase-9}
**Priority:** MEDIUM - Perfect experience for every user
**Timeline:** Week 8-9 (Days 50-57)

## 9.1 WCAG AA Accessibility Compliance (Day 50-52, ~8 hours)

**Tasks:**
- [ ] 9.1.1 Add ARIA labels to all form inputs (Auth.tsx, CheckoutPage.tsx, etc.)
- [ ] 9.1.2 Add `aria-required`, `aria-invalid`, `aria-describedby` to form fields
- [ ] 9.1.3 Fix color contrast: Replace `text-slate-400` with `text-slate-600` (meets 4.5:1 ratio)
- [ ] 9.1.4 Add `aria-live="polite"` region for dynamic content updates
- [ ] 9.1.5 Add skip-to-content link at top of every page
- [ ] 9.1.6 Add keyboard navigation support for all interactive elements
- [ ] 9.1.7 Add focus indicators (visible ring on tab navigation)
- [ ] 9.1.8 Ensure all modals trap focus and return focus on close
- [ ] 9.1.9 Add alt text to all images (product images, banners, etc.)
- [ ] 9.1.10 Test with screen reader (NVDA or VoiceOver)

---

## 9.2 PWA Optimization (Day 52-53, ~4 hours)

**Tasks:**
- [ ] 9.2.1 Add offline fallback page (show cached content when offline)
- [ ] 9.2.2 Add offline indicator banner ("You're offline - some features may be limited")
- [ ] 9.2.3 Queue failed mutations for retry when back online
- [ ] 9.2.4 Add push notification support (order updates, delivery status)
- [ ] 9.2.5 Optimize PWA install prompt timing (show after 2 minutes of engagement)
- [ ] 9.2.6 Add app shortcuts (quick access to cart, orders from home screen)

---

## 9.3 Mobile-Specific Optimizations (Day 53-54, ~4 hours)

**Tasks:**
- [ ] 9.3.1 Reduce preloading on mobile (only top 3 pages, not 5)
- [ ] 9.3.2 Use smaller image sizes on mobile (400px width max for product cards)
- [ ] 9.3.3 Reduce analytics polling interval on mobile (save battery)
- [ ] 9.3.4 Add touch-optimized interactions (larger tap targets, swipe gestures)
- [ ] 9.3.5 Optimize virtual list for mobile (smaller overscan, smaller items)
- [ ] 9.3.6 Add network-aware loading (reduce data on slow connections)

---

## 9.4 Client-Side Storage Management (Day 54-55, ~3 hours)

**Tasks:**
- [ ] 9.4.1 Create `StorageManager` class with quota management
- [ ] 9.4.2 Set max localStorage usage to 4MB
- [ ] 9.4.3 Add TTL-based auto-cleanup for old entries
- [ ] 9.4.4 Add graceful fallback to sessionStorage/memory when quota exceeded
- [ ] 9.4.5 Add safe JSON parse wrapper for all localStorage reads
- [ ] 9.4.6 Scope analytics IDs per tenant (prevent cross-store tracking)
- [ ] 9.4.7 Clear old store data for stores not visited in 30 days

---

## 9.5 Form Validation Improvements (Day 55-56, ~3 hours)

**Tasks:**
- [ ] 9.5.1 Add international phone number support (configurable per tenant)
- [ ] 9.5.2 Improve email validation regex (proper RFC compliance)
- [ ] 9.5.3 Add debounced real-time validation (300ms delay)
- [ ] 9.5.4 Show validation errors inline (not just toast)
- [ ] 9.5.5 Add form auto-save for checkout (save to sessionStorage every 5 seconds)
- [ ] 9.5.6 Prevent form submission on Enter key in single-field forms

---

**Phase 9 Total: ~22 hours | 33 tasks | Perfect experience for every user**

---

# PHASE 10: FINAL HARDENING & LOAD TESTING {#phase-10}
**Priority:** MEDIUM - Verify everything works under pressure
**Timeline:** Week 9-10 (Days 57-65)

## 10.1 Comprehensive RLS Policy Audit (Day 57-58, ~6 hours)

**Tasks:**
- [ ] 10.1.1 List ALL current RLS policies across all tables
- [ ] 10.1.2 Verify tenant isolation for every table with tenant_id
- [ ] 10.1.3 Test: User A cannot see User B's data (cross-tenant isolation)
- [ ] 10.1.4 Test: Customer cannot see other customer's orders
- [ ] 10.1.5 Test: Super admin can access all tenants
- [ ] 10.1.6 Remove any debug/test policies from migrations
- [ ] 10.1.7 Document all policies and their purpose

---

## 10.2 Security Penetration Testing (Day 58-59, ~4 hours)

**Tasks:**
- [ ] 10.2.1 Test OTP brute-force (verify rate limiting blocks it)
- [ ] 10.2.2 Test CORS rejection (verify unauthorized origins blocked)
- [ ] 10.2.3 Test SQL injection on all inputs (verify parameterized queries)
- [ ] 10.2.4 Test XSS on page builder content (verify DOMPurify sanitization)
- [ ] 10.2.5 Test CSS injection on page builder (verify CSS sanitizer)
- [ ] 10.2.6 Test concurrent payment submissions (verify no double-charging)
- [ ] 10.2.7 Test concurrent coupon redemptions (verify limits enforced)
- [ ] 10.2.8 Test webhook replay attacks (verify idempotency)

---

## 10.3 Load Testing (Day 59-60, ~4 hours)

**Scenarios to test:**
- [ ] 10.3.1 100 concurrent store page loads → all under 2 seconds
- [ ] 10.3.2 50 concurrent checkout submissions → no duplicates, no errors
- [ ] 10.3.3 1000 OTP requests per hour → rate limiting kicks in properly
- [ ] 10.3.4 100 concurrent webhook deliveries → all processed once, no duplicates
- [ ] 10.3.5 500 concurrent product listing requests → cached responses under 100ms
- [ ] 10.3.6 50 concurrent admin dashboard loads → analytics load under 3 seconds
- [ ] 10.3.7 Measure and record baseline performance metrics

---

## 10.4 Edge Case Testing (Day 60-61, ~4 hours)

**Tasks:**
- [ ] 10.4.1 Test with empty database (new tenant, no products, no orders)
- [ ] 10.4.2 Test with 10,000 products per store
- [ ] 10.4.3 Test with 100 items in cart
- [ ] 10.4.4 Test with expired session (graceful re-auth)
- [ ] 10.4.5 Test with network disconnection during checkout
- [ ] 10.4.6 Test with very slow network (3G simulation)
- [ ] 10.4.7 Test with browser back/forward during payment
- [ ] 10.4.8 Test with multiple tabs open (same store)
- [ ] 10.4.9 Test custom domain routing with real domain

---

## 10.5 Performance Benchmarking & Documentation (Day 61-62, ~3 hours)

**Tasks:**
- [ ] 10.5.1 Measure and document final performance metrics:
  ```
  - LCP: target < 2.0s (from ~3.5s)
  - FID: target < 50ms (from ~150ms)
  - CLS: target < 0.05 (from ~0.15)
  - TTFB: target < 400ms (from ~800ms)
  - API P95: target < 300ms (from ~1000ms)
  - Cache hit ratio: target > 70%
  - Error rate: target < 0.1%
  ```
- [ ] 10.5.2 Document all architectural decisions
- [ ] 10.5.3 Create runbook for common failure scenarios
- [ ] 10.5.4 Create deployment checklist
- [ ] 10.5.5 Set up uptime monitoring alerts

---

## 10.6 Database Maintenance Jobs (Day 62-63, ~3 hours)

**New migrations:**
- `supabase/migrations/YYYYMMDD_maintenance_jobs.sql`

**Tasks:**
- [ ] 10.6.1 Create cron job: Clean expired OTPs (hourly)
- [ ] 10.6.2 Create cron job: Clean expired rate limit entries (hourly)
- [ ] 10.6.3 Create cron job: Clean expired idempotency keys (daily)
- [ ] 10.6.4 Create cron job: Clean old analytics events > 90 days (weekly)
- [ ] 10.6.5 Create cron job: Clean old application logs > 30 days (daily)
- [ ] 10.6.6 Create cron job: Vacuum and analyze tables (weekly)
- [ ] 10.6.7 Create cron job: Clean expired coupon reservations (every 5 minutes)

---

**Phase 10 Total: ~24 hours | 40 tasks | Verified production-ready**

---

# GRAND TOTAL SUMMARY

| Phase | Focus | Hours | Tasks | Priority |
|-------|-------|-------|-------|----------|
| **Phase 1** | Critical Security & Payments | ~33h | 47 | BLOCKING |
| **Phase 2** | Zero-Crash Error Handling | ~31h | 55 | CRITICAL |
| **Phase 3** | Backend Reliability & Atomicity | ~34h | 52 | HIGH |
| **Phase 4** | Rocket Speed - Frontend | ~31h | 65 | HIGH |
| **Phase 5** | Rocket Speed - Backend & DB | ~23h | 38 | HIGH |
| **Phase 6** | Enterprise Edge Functions | ~25h | 30 | MEDIUM-HIGH |
| **Phase 7** | Enterprise Caching & CDN | ~17h | 24 | MEDIUM |
| **Phase 8** | Monitoring & Auto-Healing | ~17h | 24 | MEDIUM |
| **Phase 9** | Accessibility, PWA & Mobile | ~22h | 33 | MEDIUM |
| **Phase 10** | Final Hardening & Load Testing | ~24h | 40 | MEDIUM |
| **TOTAL** | **Complete Enterprise Platform** | **~257h** | **408 tasks** | |

---

# EXPECTED PERFORMANCE AFTER ALL PHASES

## Speed Targets (Before → After)

| Metric | Current (Estimated) | After Phase 4-5 | After Phase 7 | Target |
|--------|-------------------|-----------------|---------------|--------|
| **First Contentful Paint** | ~2.5s | ~1.5s | ~0.8s | < 1.0s |
| **Largest Contentful Paint** | ~3.5s | ~2.0s | ~1.2s | < 1.5s |
| **First Input Delay** | ~150ms | ~50ms | ~20ms | < 50ms |
| **Cumulative Layout Shift** | ~0.15 | ~0.05 | ~0.02 | < 0.05 |
| **Time to First Byte** | ~800ms | ~400ms | ~100ms | < 200ms |
| **Route Navigation** | ~500ms | ~150ms | ~50ms | < 100ms |
| **Button Click Response** | ~200ms | ~50ms | ~16ms | < 50ms |
| **API Response (cached)** | ~500ms | ~100ms | ~10ms | < 50ms |
| **API Response (uncached)** | ~1000ms | ~300ms | ~150ms | < 200ms |
| **Image Load** | ~2s | ~500ms | ~200ms | < 300ms |
| **Checkout Total Time** | ~8s | ~3s | ~2s | < 3s |

## Reliability Targets (Before → After)

| Metric | Current | After Phase 1-3 | After Phase 6-8 | Target |
|--------|---------|-----------------|-----------------|--------|
| **Error Rate** | ~2-5% | ~0.5% | ~0.05% | < 0.1% |
| **Uptime** | ~99% | ~99.5% | ~99.95% | > 99.9% |
| **Payment Success Rate** | ~90% | ~98% | ~99.5% | > 99% |
| **Data Consistency** | Partial | Strong | Full | 100% |
| **Zero Crash** | No | Mostly | Yes | Yes |
| **Cache Hit Ratio** | ~20% | ~50% | ~80% | > 70% |
| **Mean Time to Recovery** | Manual | ~5min | ~30s | < 1min |

## Capacity After All Phases

| Metric | Current | After Optimization |
|--------|---------|-------------------|
| **Stores** | 50-100 | 1,000-5,000 |
| **Orders/Day** | 500-2,000 | 50,000-100,000 |
| **Concurrent Users** | 50-200 | 5,000-10,000 |
| **Products Per Store** | 1,000-5,000 | 50,000+ |
| **API Requests/Day** | 50,000-100,000 | 5,000,000+ |
| **Payments/Day** | 200-1,000 | 30,000-50,000 |

---

# HOW TO USE THIS PLAN

1. **Start with Phase 1** - Security fixes are blocking. Don't skip.
2. **Phase 2 in parallel with Phase 1** - Error boundaries are independent.
3. **Phases 3-5 are sequential** - Backend before speed optimization.
4. **Phases 6-10 can be partially parallelized** - Independent modules.
5. **Each task has a checkbox** - Track completion as you go.
6. **Each phase has estimated hours** - Adjust based on actual velocity.
7. **Test after each phase** - Don't stack untested changes.

---

*Generated: 2026-02-27*
*Total: 10 Phases | 408 Tasks | ~257 Hours | Enterprise-Grade SaaS Platform*

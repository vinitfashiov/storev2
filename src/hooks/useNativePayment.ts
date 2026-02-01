/**
 * Hook to detect native app context and handle external payment flows
 * Works for both Admin subscription upgrades and Storefront order payments
 */

export interface NativePaymentConfig {
  orderId: string;
  keyId: string;
  amount: number; // in paise
  currency: string;
  name: string;
  description: string;
  callbackUrl: string;
  cancelUrl: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
}

/**
 * Detect if running inside a Capacitor native app
 */
export function isNativeApp(): boolean {
  return !!(window as any).Capacitor?.isNativePlatform?.();
}

/**
 * Detect if running inside any WebView (broader detection)
 */
export function isWebView(): boolean {
  const ua = navigator.userAgent.toLowerCase();
  // Android WebView patterns
  const androidWebView = ua.includes('wv') || 
    (ua.includes('android') && ua.includes('version/'));
  // iOS WebView patterns
  const iosWebView = /(iphone|ipod|ipad).*applewebkit(?!.*safari)/i.test(navigator.userAgent);
  
  return androidWebView || iosWebView || isNativeApp();
}

/**
 * Check if we should use external payment flow (recommended for native apps)
 */
export function shouldUseExternalPayment(): boolean {
  return isWebView() || isNativeApp();
}

/**
 * Build Razorpay Standard Checkout URL for external browser
 * This opens Razorpay in the system browser instead of SDK popup
 */
export function buildRazorpayCheckoutUrl(config: NativePaymentConfig): string {
  const params = new URLSearchParams({
    key_id: config.keyId,
    order_id: config.orderId,
    name: config.name,
    description: config.description,
    amount: config.amount.toString(),
    currency: config.currency,
    callback_url: config.callbackUrl,
    cancel_url: config.cancelUrl,
  });

  if (config.prefill?.name) {
    params.append('prefill[name]', config.prefill.name);
  }
  if (config.prefill?.email) {
    params.append('prefill[email]', config.prefill.email);
  }
  if (config.prefill?.contact) {
    params.append('prefill[contact]', config.prefill.contact);
  }

  return `https://api.razorpay.com/v1/checkout/embedded?${params.toString()}`;
}

/**
 * Open URL in external browser (for native apps) or same window (for web)
 */
export function openExternalUrl(url: string): void {
  if (isNativeApp()) {
    // For Capacitor apps, use Browser plugin or window.open with _system
    const Capacitor = (window as any).Capacitor;
    if (Capacitor?.Plugins?.Browser?.open) {
      Capacitor.Plugins.Browser.open({ url, presentationStyle: 'popover' });
    } else {
      // Fallback: open in system browser
      window.open(url, '_system');
    }
  } else {
    // For web or regular webview, redirect in same window
    window.location.href = url;
  }
}

/**
 * Generate callback URLs for payment redirect
 */
export function getPaymentCallbackUrls(type: 'upgrade' | 'order', params: Record<string, string>) {
  const baseUrl = import.meta.env.VITE_SUPABASE_URL;
  const appUrl = window.location.origin;
  
  // Edge function URL for server-side verification
  const callbackUrl = `${baseUrl}/functions/v1/payment-redirect-callback`;
  
  // Cancel URL - back to the app
  const cancelUrl = type === 'upgrade' 
    ? `${appUrl}/dashboard/upgrade?cancelled=true`
    : `${appUrl}/store/${params.store_slug}/checkout?cancelled=true`;
  
  return { callbackUrl, cancelUrl };
}

/**
 * Hook to manage native payment state and flow
 */
export function useNativePayment() {
  const isNative = isNativeApp();
  const inWebView = isWebView();
  const useExternal = shouldUseExternalPayment();

  return {
    isNativeApp: isNative,
    isWebView: inWebView,
    shouldUseExternalPayment: useExternal,
    buildCheckoutUrl: buildRazorpayCheckoutUrl,
    openExternalUrl,
    getCallbackUrls: getPaymentCallbackUrls,
  };
}

export default useNativePayment;

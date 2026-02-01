import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.storekriti.1stapp66',
  appName: '1st App',
  webDir: 'dist',
  server: {
    // Enable hot-reload for development
    url: 'https://ea082ccb-1b4d-44f3-97e2-ef77055ef51b.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    // App URL scheme for deep links
    App: {
      appId: 'com.storekriti.1stapp66',
      appName: '1st App',
    }
  },
  // Android specific configuration
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true
  }
};

export default config;

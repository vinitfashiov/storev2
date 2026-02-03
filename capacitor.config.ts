import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.storekriti.1stapp66',
  appName: '1st App',
  webDir: 'dist',
  plugins: {
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#ffffff',
    },
  },
};

export default config;

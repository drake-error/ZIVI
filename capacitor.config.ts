import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.zivi.app',
  appName: 'ZIVI',
  webDir: 'dist',
  server: {
    // This allows your app to talk to Supabase over the network
    allowNavigation: ['yzcotcrbmuhlsppnzuap.supabase.co']
  },
  android: {
    // This allows the app to send data even if the connection isn't "perfect"
    allowMixedContent: true
  }
};

export default config;
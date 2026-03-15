import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.kace.frostbite',
  appName: 'Frostbite',
  webDir: 'dist',
  ios: {
    // Allow the web content to extend into the safe area (notch/home indicator)
    // The game canvas fills the whole screen; React HUD uses padding to avoid cutoffs
    contentInset: 'always',
    // Use WebGL-accelerated rendering
    preferredContentMode: 'mobile',
    // Allow audio without user having to interact with a separate mute button
    backgroundColor: '#000000',
  },
  plugins: {
    Keyboard: {
      resize: 'none', // prevent viewport resize on soft keyboard (irrelevant for game, but safe)
    },
  },
};

export default config;

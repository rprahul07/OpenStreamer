import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface BrandingConfig {
  appName: string;
  accentColor: string;
  logoUri: string | null;
}

interface BrandingContextValue {
  branding: BrandingConfig;
  updateBranding: (config: Partial<BrandingConfig>) => Promise<void>;
  resetBranding: () => Promise<void>;
}

const DEFAULT_BRANDING: BrandingConfig = {
  appName: 'OpenStream',
  accentColor: '#00E5CC',
  logoUri: null,
};

const BRANDING_KEY = '@openstream_branding';
const BrandingContext = createContext<BrandingContextValue | null>(null);

export function BrandingProvider({ children }: { children: ReactNode }) {
  const [branding, setBranding] = useState<BrandingConfig>(DEFAULT_BRANDING);

  useEffect(() => {
    loadBranding();
  }, []);

  async function loadBranding() {
    try {
      const data = await AsyncStorage.getItem(BRANDING_KEY);
      if (data) setBranding(JSON.parse(data));
    } catch (e) {
      console.error('Failed to load branding:', e);
    }
  }

  async function updateBranding(config: Partial<BrandingConfig>) {
    const updated = { ...branding, ...config };
    setBranding(updated);
    await AsyncStorage.setItem(BRANDING_KEY, JSON.stringify(updated));
  }

  async function resetBranding() {
    setBranding(DEFAULT_BRANDING);
    await AsyncStorage.removeItem(BRANDING_KEY);
  }

  const value = useMemo(() => ({ branding, updateBranding, resetBranding }), [branding]);

  return <BrandingContext.Provider value={value}>{children}</BrandingContext.Provider>;
}

export function useBranding() {
  const ctx = useContext(BrandingContext);
  if (!ctx) throw new Error('useBranding must be used within BrandingProvider');
  return ctx;
}

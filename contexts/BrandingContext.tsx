import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '@/lib/api';
import { API_CONFIG } from '@/lib/config';

interface BrandingSettings {
  appName: string;
  appLogoUrl?: string;
  appIconUrl?: string;
  splashScreenUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  themeMode: 'light' | 'dark' | 'auto';
  fontFamily?: string;
  customCss?: string;
  footerText?: string;
  contactEmail?: string;
  socialLinks?: Record<string, string>;
}

interface BrandingContextType {
  branding: BrandingSettings;
  updateBranding: (updates: Partial<BrandingSettings>) => Promise<void>;
  resetBranding: () => Promise<void>;
  isLoading: boolean;
}

const BrandingContext = createContext<BrandingContextType | null>(null);

const DEFAULT_BRANDING: BrandingSettings = {
  appName: 'Academic Audio Platform',
  primaryColor: '#4F46E5',
  secondaryColor: '#10B981',
  accentColor: '#F59E0B',
  backgroundColor: '#FFFFFF',
  textColor: '#1F2937',
  themeMode: 'light',
  footerText: ' 2024 Academic Audio Platform',
  socialLinks: {},
};

export function BrandingProvider({ children }: { children: ReactNode }) {
  const [branding, setBranding] = useState<BrandingSettings>(DEFAULT_BRANDING);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadBranding();
  }, []);

  async function loadBranding() {
    try {
      // Try to load from API first
      const response = await apiClient.get('/api/settings/branding');
      
      if (response.data) {
        const apiBranding = response.data as any;
        const mergedBranding = {
          ...DEFAULT_BRANDING,
          ...apiBranding,
          // Handle color field name differences
          primaryColor: (apiBranding as any).primary_color || (apiBranding as any).primaryColor || DEFAULT_BRANDING.primaryColor,
          secondaryColor: (apiBranding as any).secondary_color || (apiBranding as any).secondaryColor || DEFAULT_BRANDING.secondaryColor,
          accentColor: (apiBranding as any).accent_color || (apiBranding as any).accentColor || DEFAULT_BRANDING.accentColor,
          backgroundColor: (apiBranding as any).background_color || (apiBranding as any).backgroundColor || DEFAULT_BRANDING.backgroundColor,
          textColor: (apiBranding as any).text_color || (apiBranding as any).textColor || DEFAULT_BRANDING.textColor,
          themeMode: (apiBranding as any).theme_mode || (apiBranding as any).themeMode || DEFAULT_BRANDING.themeMode,
          appLogoUrl: (apiBranding as any).app_logo_url || (apiBranding as any).appLogoUrl,
          appIconUrl: (apiBranding as any).app_icon_url || (apiBranding as any).appIconUrl,
          splashScreenUrl: (apiBranding as any).splash_screen_url || (apiBranding as any).splashScreenUrl,
          fontFamily: (apiBranding as any).font_family || (apiBranding as any).fontFamily,
          footerText: (apiBranding as any).footer_text || (apiBranding as any).footerText,
          contactEmail: (apiBranding as any).contact_email || (apiBranding as any).contactEmail,
          socialLinks: (apiBranding as any).social_links || (apiBranding as any).socialLinks,
        };
        
        setBranding(mergedBranding);
        await AsyncStorage.setItem('@branding_settings', JSON.stringify(mergedBranding));
      }
    } catch (error) {
      console.log('Failed to load branding from API, using cache:', error);
      
      // Fallback to cached branding
      try {
        const cached = await AsyncStorage.getItem('@branding_settings');
        if (cached) {
          setBranding(JSON.parse(cached));
        }
      } catch (cacheError) {
        console.error('Failed to load cached branding:', cacheError);
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function updateBranding(updates: Partial<BrandingSettings>) {
    try {
      const newBranding = { ...branding, ...updates };
      
      // Update locally immediately for responsiveness
      setBranding(newBranding);
      await AsyncStorage.setItem('@branding_settings', JSON.stringify(newBranding));
      
      // Try to update on backend
      try {
        const apiUpdates = {
          app_name: newBranding.appName,
          app_logo_url: newBranding.appLogoUrl,
          app_icon_url: newBranding.appIconUrl,
          splash_screen_url: newBranding.splashScreenUrl,
          primary_color: newBranding.primaryColor,
          secondary_color: newBranding.secondaryColor,
          accent_color: newBranding.accentColor,
          background_color: newBranding.backgroundColor,
          text_color: newBranding.textColor,
          theme_mode: newBranding.themeMode,
          font_family: newBranding.fontFamily,
          custom_css: newBranding.customCss,
          footer_text: newBranding.footerText,
          contact_email: newBranding.contactEmail,
          social_links: newBranding.socialLinks,
        };
        
        await apiClient.put('/api/settings/branding', apiUpdates);
      } catch (apiError) {
        console.error('Failed to update branding on backend:', apiError);
        // Continue with local update even if backend fails
      }
    } catch (error) {
      console.error('Failed to update branding:', error);
    }
  }

  async function resetBranding() {
    try {
      setBranding(DEFAULT_BRANDING);
      await AsyncStorage.setItem('@branding_settings', JSON.stringify(DEFAULT_BRANDING));
      
      // Try to reset on backend
      try {
        await apiClient.put('/api/settings/branding', {
          app_name: DEFAULT_BRANDING.appName,
          primary_color: DEFAULT_BRANDING.primaryColor,
          secondary_color: DEFAULT_BRANDING.secondaryColor,
          accent_color: DEFAULT_BRANDING.accentColor,
          background_color: DEFAULT_BRANDING.backgroundColor,
          text_color: DEFAULT_BRANDING.textColor,
          theme_mode: DEFAULT_BRANDING.themeMode,
        });
      } catch (apiError) {
        console.error('Failed to reset branding on backend:', apiError);
      }
    } catch (error) {
      console.error('Failed to reset branding:', error);
    }
  }

  const value = {
    branding,
    updateBranding,
    resetBranding,
    isLoading,
  };

  return <BrandingContext.Provider value={value}>{children}</BrandingContext.Provider>;
}

export function useBranding() {
  const ctx = useContext(BrandingContext);
  if (!ctx) throw new Error('useBranding must be used within BrandingProvider');
  return ctx;
}

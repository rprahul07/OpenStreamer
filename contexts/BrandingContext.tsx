import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '@/lib/api';
import { API_CONFIG } from '@/lib/config';
import { useAuth } from './AuthContext';

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
  const { user } = useAuth();
  const [branding, setBranding] = useState<BrandingSettings>(DEFAULT_BRANDING);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadBranding();
    }
  }, [user]);

  async function loadBranding() {
    try {
      // Try to load user-specific branding from API first
      const response = await apiClient.get('/api/settings/user/branding');
      
      if (response.data) {
        const apiBranding = response.data as any;
        const mergedBranding = {
          ...DEFAULT_BRANDING,
          ...apiBranding,
          // Handle field name conversions
          appName: apiBranding.app_name || DEFAULT_BRANDING.appName,
          appLogoUrl: apiBranding.app_logo_url,
          appIconUrl: apiBranding.app_icon_url,
          splashScreenUrl: apiBranding.splash_screen_url,
          primaryColor: apiBranding.primary_color || DEFAULT_BRANDING.primaryColor,
          secondaryColor: apiBranding.secondary_color || DEFAULT_BRANDING.secondaryColor,
          accentColor: apiBranding.accent_color || DEFAULT_BRANDING.accentColor,
          backgroundColor: apiBranding.background_color || DEFAULT_BRANDING.backgroundColor,
          textColor: apiBranding.text_color || DEFAULT_BRANDING.textColor,
          themeMode: apiBranding.theme_mode || DEFAULT_BRANDING.themeMode,
          fontFamily: apiBranding.font_family,
          footerText: apiBranding.footer_text || DEFAULT_BRANDING.footerText,
          contactEmail: apiBranding.contact_email,
          socialLinks: apiBranding.social_links ? JSON.parse(apiBranding.social_links) : DEFAULT_BRANDING.socialLinks,
        };
        
        setBranding(mergedBranding);
        await AsyncStorage.setItem(`@branding_settings_${user!.id}`, JSON.stringify(mergedBranding));
      }
    } catch (error) {
      console.log('Failed to load user branding from API, using cache:', error);
      
      // Fallback to cached branding
      try {
        const cached = await AsyncStorage.getItem(`@branding_settings_${user!.id}`);
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
      await AsyncStorage.setItem(`@branding_settings_${user!.id}`, JSON.stringify(newBranding));
      
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
          social_links: typeof newBranding.socialLinks === 'object' ? JSON.stringify(newBranding.socialLinks) : newBranding.socialLinks,
        };
        
        await apiClient.put('/api/settings/user/branding', apiUpdates);
      } catch (apiError) {
        console.error('Failed to update user branding on backend:', apiError);
        // Continue with local update even if backend fails
      }
    } catch (error) {
      console.error('Failed to update branding:', error);
    }
  }

  async function resetBranding() {
    try {
      setBranding(DEFAULT_BRANDING);
      await AsyncStorage.setItem(`@branding_settings_${user!.id}`, JSON.stringify(DEFAULT_BRANDING));
      
      // Try to reset on backend
      try {
        await apiClient.put('/api/settings/user/branding', {
          app_name: DEFAULT_BRANDING.appName,
          primary_color: DEFAULT_BRANDING.primaryColor,
          secondary_color: DEFAULT_BRANDING.secondaryColor,
          accent_color: DEFAULT_BRANDING.accentColor,
          background_color: DEFAULT_BRANDING.backgroundColor,
          text_color: DEFAULT_BRANDING.textColor,
          theme_mode: DEFAULT_BRANDING.themeMode,
        });
      } catch (apiError) {
        console.error('Failed to reset user branding on backend:', apiError);
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

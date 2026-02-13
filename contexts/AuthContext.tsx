import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient, type UserResponse } from '@/lib/api';

interface User {
  id: string;
  username: string;
  displayName: string;
  role: 'admin' | 'creator' | 'listener';
  academicRole?: 'TEACHER' | 'STUDENT';
  department?: string;
  academicYear?: number;
  classSection?: string;
}

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (username: string, password: string, displayName: string, role?: string, department?: string, academicYear?: number, classSection?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const SESSION_KEY = '@openstream_session';
const TOKEN_KEY = '@openstream_token';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSession();
  }, []);

  async function loadSession() {
    try {
      const session = await AsyncStorage.getItem(SESSION_KEY);
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      if (session && token) {
        setUser(JSON.parse(session));
        console.log('Session loaded for user:', JSON.parse(session).username);
      }
    } catch (e) {
      console.error('Failed to load session:', e);
    } finally {
      setIsLoading(false);
    }
  }

  async function login(username: string, password: string) {
    try {
      const response = await apiClient.login({ username, password });
      
      if (response.error) {
        return { success: false, error: response.error };
      }
      
      if (response.data) {
        const userData: User = {
          id: response.data.id,
          username: response.data.username,
          displayName: response.data.displayName,
          role: response.data.role,
          academicRole: response.data.academicRole,
          department: response.data.department,
          academicYear: response.data.academicYear,
          classSection: response.data.classSection,
        };
        
        setUser(userData);
        await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(userData));
        if (response.data.token) {
          await AsyncStorage.setItem(TOKEN_KEY, response.data.token);
          console.log('Token saved for user:', userData.username);
        }
        return { success: true };
      }
      
      return { success: false, error: 'Login failed' };
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }

  async function register(username: string, password: string, displayName: string, role?: string, department?: string, academicYear?: number, classSection?: string) {
    try {
      const response = await apiClient.register({ 
        username, 
        password, 
        displayName, 
        role: (role as 'admin' | 'creator' | 'listener') || 'creator',
        department,
        academicYear,
        classSection
      });
      
      if (response.error) {
        return { success: false, error: response.error };
      }
      
      if (response.data) {
        const userData: User = {
          id: response.data.id,
          username: response.data.username,
          displayName: response.data.displayName,
          role: response.data.role,
          academicRole: response.data.academicRole,
          department: response.data.department,
          academicYear: response.data.academicYear,
          classSection: response.data.classSection,
        };
        
        setUser(userData);
        await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(userData));
        if (response.data.token) {
          await AsyncStorage.setItem(TOKEN_KEY, response.data.token);
          console.log('Token saved for user:', userData.username);
        }
        return { success: true };
      }
      
      return { success: false, error: 'Registration failed' };
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }

  async function logout() {
    setUser(null);
    await AsyncStorage.removeItem(SESSION_KEY);
    await AsyncStorage.removeItem(TOKEN_KEY);
  }

  const value = useMemo(() => ({
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
  }), [user, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

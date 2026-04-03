import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ThemeColors {
  // Backgrounds
  background: string;
  surface: string;
  card: string;
  cardBorder: string;
  cardBorderSubtle: string;

  // Text
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textMuted: string;

  // Inputs
  inputBg: string;
  inputBorder: string;

  // Overlays & Modals
  overlay: string;
  modalGradientStart: string;
  modalGradientEnd: string;

  // Borders & Dividers
  divider: string;
  borderSubtle: string;

  // Accent
  accent: string;
  accentBg: string;
  accentMuted: string;
  purple: string;
  purpleBg: string;
  blue: string;
  blueBg: string;

  // Icons
  iconDefault: string;
  iconMuted: string;

  // Gradient for cards
  gradientStart: string;
  gradientEnd: string;

  // Special
  closeBtnBg: string;
  pillBg: string;
  innerCardBg: string;

  // Status colors (same in both)
  danger: string;
  dangerBg: string;
  success: string;
  successBg: string;
  warning: string;
  warningBg: string;

  // Tab bar
  tabBarBg: string;
  tabBarBorder: string;
  tabBarActive: string;
  tabBarInactive: string;

  // Calendar-specific
  calendarBg: string;
  calendarDayText: string;
  calendarDisabledText: string;
  calendarSelectedBg: string;
  calendarSelectedText: string;
  calendarTodayText: string;

  // Switch
  switchTrackTrue: string;
  switchTrackFalse: string;

  // Save button
  saveBtnBg: string;
  saveBtnText: string;
}

const DARK_COLORS: ThemeColors = {
  background: '#0A0A0A',
  surface: '#141414',
  card: 'rgba(20,20,20,0.95)',
  cardBorder: 'rgba(255,255,255,0.08)',
  cardBorderSubtle: 'rgba(255,255,255,0.05)',

  textPrimary: '#FFFFFF',
  textSecondary: '#D1D1D1',
  textTertiary: '#949494',
  textMuted: '#606060',

  inputBg: '#0A0A0A',
  inputBorder: 'rgba(255,255,255,0.05)',

  overlay: 'rgba(0,0,0,0.85)',
  modalGradientStart: '#1A1A1A',
  modalGradientEnd: '#0A0A0A',

  divider: 'rgba(255,255,255,0.05)',
  borderSubtle: 'rgba(255,255,255,0.05)',

  accent: '#00F0FF',
  accentBg: 'rgba(0, 240, 255, 0.1)',
  accentMuted: '#00F0FF',
  purple: '#8A2BE2',
  purpleBg: 'rgba(138, 43, 226, 0.1)',
  blue: '#3B82F6',
  blueBg: 'rgba(59, 130, 246, 0.1)',

  iconDefault: '#FFFFFF',
  iconMuted: '#A0A0A0',

  gradientStart: 'rgba(25,25,25,0.9)',
  gradientEnd: 'rgba(15,15,15,1)',

  closeBtnBg: 'rgba(255,255,255,0.05)',
  pillBg: 'rgba(255,255,255,0.03)',
  innerCardBg: 'rgba(0,0,0,0.3)',

  danger: '#EF4444',
  dangerBg: 'rgba(239, 68, 68, 0.1)',
  success: '#10B981',
  successBg: 'rgba(16, 185, 129, 0.1)',
  warning: '#F59E0B',
  warningBg: 'rgba(245, 158, 11, 0.1)',

  tabBarBg: 'rgba(15,15,15,0.95)',
  tabBarBorder: 'rgba(255,255,255,0.05)',
  tabBarActive: '#FFFFFF',
  tabBarInactive: '#A0A0A0',

  calendarBg: '#0A0A0A',
  calendarDayText: '#FFFFFF',
  calendarDisabledText: '#303030',
  calendarSelectedBg: 'rgba(0, 240, 255, 0.2)',
  calendarSelectedText: '#00F0FF',
  calendarTodayText: '#00F0FF',

  switchTrackTrue: '#00F0FF',
  switchTrackFalse: '#393939',

  saveBtnBg: '#FFFFFF',
  saveBtnText: '#0A0A0A',
};

const LIGHT_COLORS: ThemeColors = {
  background: '#F5F5F7',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  cardBorder: 'rgba(0,0,0,0.08)',
  cardBorderSubtle: 'rgba(0,0,0,0.05)',

  textPrimary: '#1A1A1A',
  textSecondary: '#4A4A4A',
  textTertiary: '#6B6B6B',
  textMuted: '#9E9E9E',

  inputBg: '#F0F0F2',
  inputBorder: 'rgba(0,0,0,0.08)',

  overlay: 'rgba(0,0,0,0.4)',
  modalGradientStart: '#FFFFFF',
  modalGradientEnd: '#F5F5F7',

  divider: 'rgba(0,0,0,0.06)',
  borderSubtle: 'rgba(0,0,0,0.05)',

  accent: '#0095A8',
  accentBg: 'rgba(0, 149, 168, 0.08)',
  accentMuted: '#0095A8',
  purple: '#7C3AED',
  purpleBg: 'rgba(124, 58, 237, 0.08)',
  blue: '#2563EB',
  blueBg: 'rgba(37, 99, 235, 0.08)',

  iconDefault: '#1A1A1A',
  iconMuted: '#6B6B6B',

  gradientStart: '#FFFFFF',
  gradientEnd: '#F5F5F7',

  closeBtnBg: 'rgba(0,0,0,0.05)',
  pillBg: 'rgba(0,0,0,0.03)',
  innerCardBg: 'rgba(0,0,0,0.03)',

  danger: '#DC2626',
  dangerBg: 'rgba(220, 38, 38, 0.08)',
  success: '#059669',
  successBg: 'rgba(5, 150, 105, 0.08)',
  warning: '#D97706',
  warningBg: 'rgba(217, 119, 6, 0.08)',

  tabBarBg: 'rgba(255,255,255,0.97)',
  tabBarBorder: 'rgba(0,0,0,0.08)',
  tabBarActive: '#1A1A1A',
  tabBarInactive: '#9E9E9E',

  calendarBg: '#F5F5F7',
  calendarDayText: '#1A1A1A',
  calendarDisabledText: '#C0C0C0',
  calendarSelectedBg: 'rgba(0, 149, 168, 0.15)',
  calendarSelectedText: '#0095A8',
  calendarTodayText: '#0095A8',

  switchTrackTrue: '#0095A8',
  switchTrackFalse: '#D1D1D1',

  saveBtnBg: '#1A1A1A',
  saveBtnText: '#FFFFFF',
};

interface ThemeContextType {
  isDark: boolean;
  colors: ThemeColors;
  toggleTheme: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'ledgr_theme';

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [isDark, setIsDark] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved === 'light') setIsDark(false);
      } catch {}
      setIsLoaded(true);
    })();
  }, []);

  const toggleTheme = async () => {
    const next = !isDark;
    setIsDark(next);
    await AsyncStorage.setItem(STORAGE_KEY, next ? 'dark' : 'light');
  };

  const colors = isDark ? DARK_COLORS : LIGHT_COLORS;

  if (!isLoaded) return null;

  return (
    <ThemeContext.Provider value={{ isDark, colors, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};

export const useThemeColors = () => {
  return useTheme().colors;
};

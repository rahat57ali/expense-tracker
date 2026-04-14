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
  background: '#F3F4F6',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  cardBorder: '#E5E7EB',
  cardBorderSubtle: '#F3F4F6',

  textPrimary: '#111827',
  textSecondary: '#4B5563',
  textTertiary: '#6B7280',
  textMuted: '#9CA3AF',

  inputBg: '#F9FAFB',
  inputBorder: '#E5E7EB',

  overlay: 'rgba(17, 24, 39, 0.4)',
  modalGradientStart: '#FFFFFF',
  modalGradientEnd: '#F9FAFB',

  divider: '#E5E7EB',
  borderSubtle: '#F3F4F6',

  accent: '#0EA5E9',
  accentBg: '#E0F2FE',
  accentMuted: '#38BDF8',
  purple: '#8B5CF6',
  purpleBg: '#EDE9FE',
  blue: '#3B82F6',
  blueBg: '#DBEAFE',

  iconDefault: '#111827',
  iconMuted: '#6B7280',

  gradientStart: '#FFFFFF',
  gradientEnd: '#E0F2FE',

  closeBtnBg: '#F3F4F6',
  pillBg: '#F3F4F6',
  innerCardBg: '#F9FAFB',

  danger: '#EF4444',
  dangerBg: '#FEE2E2',
  success: '#10B981',
  successBg: '#D1FAE5',
  warning: '#F59E0B',
  warningBg: '#FEF3C7',

  tabBarBg: 'rgba(255,255,255,0.98)',
  tabBarBorder: '#E5E7EB',
  tabBarActive: '#0EA5E9',
  tabBarInactive: '#9CA3AF',

  calendarBg: '#F3F4F6',
  calendarDayText: '#111827',
  calendarDisabledText: '#D1D5DB',
  calendarSelectedBg: '#E0F2FE',
  calendarSelectedText: '#0284C7',
  calendarTodayText: '#0EA5E9',

  switchTrackTrue: '#0EA5E9',
  switchTrackFalse: '#D1D5DB',

  saveBtnBg: '#111827',
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

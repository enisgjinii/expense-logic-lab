
import React, { createContext, useContext, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';

interface AppSettings {
  compactMode: boolean;
  animationsEnabled: boolean;
  highContrastMode: boolean;
  fontSize: 'small' | 'medium' | 'large';
}

interface AppSettingsContextType {
  settings: AppSettings;
  updateSettings: (settings: Partial<AppSettings>) => void;
}

const AppSettingsContext = createContext<AppSettingsContextType>({
  settings: {
    compactMode: false,
    animationsEnabled: true,
    highContrastMode: false,
    fontSize: 'medium',
  },
  updateSettings: () => {},
});

export const AppSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useLocalStorage<AppSettings>('appSettings', {
    compactMode: false,
    animationsEnabled: true,
    highContrastMode: false,
    fontSize: 'medium',
  });

  useEffect(() => {
    // Apply settings to document root
    const root = document.documentElement;
    
    // Compact mode
    root.classList.toggle('compact-mode', settings.compactMode);
    
    // Animations
    root.style.setProperty('--enable-animations', settings.animationsEnabled ? '1' : '0');
    
    // High contrast
    root.classList.toggle('high-contrast', settings.highContrastMode);
    
    // Font size
    root.setAttribute('data-font-size', settings.fontSize);
  }, [settings]);

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  return (
    <AppSettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </AppSettingsContext.Provider>
  );
};

export const useAppSettings = () => {
  const context = useContext(AppSettingsContext);
  if (!context) {
    throw new Error('useAppSettings must be used within AppSettingsProvider');
  }
  return context;
};

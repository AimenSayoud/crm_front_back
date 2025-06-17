// src/context/ThemeContext.tsx
'use client';

import React, { createContext, useState, useContext, useEffect } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
    sidebar: string;
    card: string;
    border: string;
    // Add more colors as needed
  };
}

const defaultColors = {
  light: {
    primary: '#0F766E', // teal-700 for focused/active
    secondary: '#031F28', // custom dark primary as secondary in light
    background: '#F9FAFB', // gray-50
    text: '#1F2937', // gray-800
    sidebar: '#E6F1F4', // light blueish sidebar
    card: '#FFFFFF', // white
    border: '#E5E7EB', // gray-200
  },
  dark: {
    primary: '#031F28', // custom dark primary
    secondary: '#1D4E5F', // accent teal
    background: '#02141B', // deeper dark
    text: '#E6F1F4', // lighter blueish text
    sidebar: '#05212B', // dark sidebar
    card: '#0A2C38', // dark card
    border: '#093142', // dark border
  },
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const colors = theme === 'light' ? defaultColors.light : defaultColors.dark;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
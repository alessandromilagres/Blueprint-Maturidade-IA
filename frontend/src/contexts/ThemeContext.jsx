import { createContext, useContext, useState, useEffect, useLayoutEffect } from 'react';

const ThemeContext = createContext();

// Definição dos 4 temas completos
export const COLOR_THEMES = {
  corporate: {
    id: 'corporate',
    name: 'Corporativo',
    description: 'Azul clássico, profissional',
    preview: ['#1e40af', '#3b82f6', '#f8fafc'],
    // Cores
    navBg: '#0f172a',
    navBgDark: '#020617',
    pageBg: '#f8fafc',
    pageBgDark: '#0f172a',
    cardBg: '#ffffff',
    cardBgDark: '#1e293b',
    cardBorder: '#e2e8f0',
    cardBorderDark: '#334155',
    // Primária
    primary: { 50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe', 300: '#93c5fd', 400: '#60a5fa', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8', 800: '#1e40af', 900: '#1e3a8a' },
    // Secundária (cinza azulado)
    secondary: { 50: '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0', 300: '#cbd5e1', 400: '#94a3b8', 500: '#64748b', 600: '#475569', 700: '#334155', 800: '#1e293b', 900: '#0f172a' },
    // Accent (cyan)
    accent: { 400: '#22d3ee', 500: '#06b6d4', 600: '#0891b2' },
    // Formas
    borderRadius: { sm: '0.375rem', md: '0.5rem', lg: '0.75rem', xl: '1rem', full: '9999px' },
    shadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    shadowLg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  },
  
  modern: {
    id: 'modern',
    name: 'Moderno',
    description: 'Roxo vibrante, bordas arredondadas',
    preview: ['#7c3aed', '#a855f7', '#faf5ff'],
    // Cores
    navBg: '#18122B',
    navBgDark: '#0c0a14',
    pageBg: '#faf5ff',
    pageBgDark: '#18122B',
    cardBg: '#ffffff',
    cardBgDark: '#2d2640',
    cardBorder: '#e9d5ff',
    cardBorderDark: '#4c1d95',
    // Primária (roxo)
    primary: { 50: '#faf5ff', 100: '#f3e8ff', 200: '#e9d5ff', 300: '#d8b4fe', 400: '#c084fc', 500: '#a855f7', 600: '#9333ea', 700: '#7c3aed', 800: '#6b21a8', 900: '#581c87' },
    // Secundária (slate com tom roxo)
    secondary: { 50: '#faf5ff', 100: '#f3e8ff', 200: '#ddd6fe', 300: '#c4b5fd', 400: '#a78bfa', 500: '#8b5cf6', 600: '#7c3aed', 700: '#6d28d9', 800: '#5b21b6', 900: '#4c1d95' },
    // Accent (rosa)
    accent: { 400: '#f472b6', 500: '#ec4899', 600: '#db2777' },
    // Formas mais arredondadas
    borderRadius: { sm: '0.5rem', md: '0.75rem', lg: '1rem', xl: '1.5rem', full: '9999px' },
    shadow: '0 4px 6px -1px rgb(147 51 234 / 0.1), 0 2px 4px -2px rgb(147 51 234 / 0.1)',
    shadowLg: '0 20px 25px -5px rgb(147 51 234 / 0.1), 0 8px 10px -6px rgb(147 51 234 / 0.1)',
  },
  
  nature: {
    id: 'nature',
    name: 'Natureza',
    description: 'Verde sereno, tons terrosos',
    preview: ['#166534', '#22c55e', '#f0fdf4'],
    // Cores
    navBg: '#14532d',
    navBgDark: '#052e16',
    pageBg: '#f0fdf4',
    pageBgDark: '#14532d',
    cardBg: '#ffffff',
    cardBgDark: '#1a3d2e',
    cardBorder: '#bbf7d0',
    cardBorderDark: '#166534',
    // Primária (verde)
    primary: { 50: '#f0fdf4', 100: '#dcfce7', 200: '#bbf7d0', 300: '#86efac', 400: '#4ade80', 500: '#22c55e', 600: '#16a34a', 700: '#15803d', 800: '#166534', 900: '#14532d' },
    // Secundária (stone/terroso)
    secondary: { 50: '#fafaf9', 100: '#f5f5f4', 200: '#e7e5e4', 300: '#d6d3d1', 400: '#a8a29e', 500: '#78716c', 600: '#57534e', 700: '#44403c', 800: '#292524', 900: '#1c1917' },
    // Accent (amber/dourado)
    accent: { 400: '#fbbf24', 500: '#f59e0b', 600: '#d97706' },
    // Formas suaves
    borderRadius: { sm: '0.5rem', md: '0.625rem', lg: '0.875rem', xl: '1.25rem', full: '9999px' },
    shadow: '0 1px 3px 0 rgb(22 101 52 / 0.1), 0 1px 2px -1px rgb(22 101 52 / 0.1)',
    shadowLg: '0 10px 15px -3px rgb(22 101 52 / 0.1), 0 4px 6px -4px rgb(22 101 52 / 0.1)',
  },
  
  sunset: {
    id: 'sunset',
    name: 'Sunset',
    description: 'Laranja quente, gradientes vibrantes',
    preview: ['#c2410c', '#f97316', '#fff7ed'],
    // Cores
    navBg: '#431407',
    navBgDark: '#1c0a04',
    pageBg: '#fffbeb',
    pageBgDark: '#431407',
    cardBg: '#ffffff',
    cardBgDark: '#5c2d0e',
    cardBorder: '#fed7aa',
    cardBorderDark: '#9a3412',
    // Primária (laranja)
    primary: { 50: '#fff7ed', 100: '#ffedd5', 200: '#fed7aa', 300: '#fdba74', 400: '#fb923c', 500: '#f97316', 600: '#ea580c', 700: '#c2410c', 800: '#9a3412', 900: '#7c2d12' },
    // Secundária (warm gray)
    secondary: { 50: '#fafaf9', 100: '#f5f5f4', 200: '#e7e5e4', 300: '#d6d3d1', 400: '#a8a29e', 500: '#78716c', 600: '#57534e', 700: '#44403c', 800: '#292524', 900: '#1c1917' },
    // Accent (vermelho/rosa)
    accent: { 400: '#fb7185', 500: '#f43f5e', 600: '#e11d48' },
    // Formas mais retas
    borderRadius: { sm: '0.25rem', md: '0.375rem', lg: '0.5rem', xl: '0.75rem', full: '9999px' },
    shadow: '0 1px 3px 0 rgb(234 88 12 / 0.15), 0 1px 2px -1px rgb(234 88 12 / 0.1)',
    shadowLg: '0 10px 15px -3px rgb(234 88 12 / 0.15), 0 4px 6px -4px rgb(234 88 12 / 0.1)',
  }
};

function getInitialDarkMode() {
  if (typeof window === 'undefined') return false;
  const saved = localStorage.getItem('darkMode');
  if (saved !== null) {
    return JSON.parse(saved);
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function getInitialColorTheme() {
  if (typeof window === 'undefined') return 'corporate';
  const saved = localStorage.getItem('colorTheme');
  if (saved && COLOR_THEMES[saved]) {
    return saved;
  }
  return 'corporate';
}

function applyColorTheme(themeId) {
  const theme = COLOR_THEMES[themeId];
  if (!theme) return;
  
  const root = document.documentElement;
  
  // Cores primárias
  Object.entries(theme.primary).forEach(([shade, color]) => {
    root.style.setProperty(`--color-primary-${shade}`, color);
  });
  
  // Cores secundárias
  Object.entries(theme.secondary).forEach(([shade, color]) => {
    root.style.setProperty(`--color-secondary-${shade}`, color);
  });
  
  // Cores accent
  Object.entries(theme.accent).forEach(([shade, color]) => {
    root.style.setProperty(`--color-accent-${shade}`, color);
  });
  
  // Cores de fundo
  root.style.setProperty('--nav-bg', theme.navBg);
  root.style.setProperty('--nav-bg-dark', theme.navBgDark);
  root.style.setProperty('--page-bg', theme.pageBg);
  root.style.setProperty('--page-bg-dark', theme.pageBgDark);
  root.style.setProperty('--card-bg', theme.cardBg);
  root.style.setProperty('--card-bg-dark', theme.cardBgDark);
  root.style.setProperty('--card-border', theme.cardBorder);
  root.style.setProperty('--card-border-dark', theme.cardBorderDark);
  
  // Border radius
  Object.entries(theme.borderRadius).forEach(([size, value]) => {
    root.style.setProperty(`--radius-${size}`, value);
  });
  
  // Shadows
  root.style.setProperty('--shadow', theme.shadow);
  root.style.setProperty('--shadow-lg', theme.shadowLg);
  
  // Definir atributo de tema para seletores CSS
  root.setAttribute('data-theme', themeId);
}

export function ThemeProvider({ children }) {
  const [darkMode, setDarkMode] = useState(getInitialDarkMode);
  const [colorTheme, setColorTheme] = useState(getInitialColorTheme);

  useLayoutEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [darkMode]);

  useLayoutEffect(() => {
    applyColorTheme(colorTheme);
  }, [colorTheme]);

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('colorTheme', colorTheme);
  }, [colorTheme]);

  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  const changeColorTheme = (themeId) => {
    if (COLOR_THEMES[themeId]) {
      setColorTheme(themeId);
    }
  };

  return (
    <ThemeContext.Provider value={{ 
      darkMode, 
      toggleDarkMode, 
      colorTheme, 
      changeColorTheme,
      colorThemes: COLOR_THEMES 
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

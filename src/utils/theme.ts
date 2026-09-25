export type ThemeMode = 'light' | 'dark';

export function getTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'light';
  const saved = localStorage.getItem('theme');
  if (saved === 'dark' || saved === 'light') return saved;
  // Check system preference fallback if needed, default to light
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

export function applyTheme(theme: ThemeMode) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
  localStorage.setItem('theme', theme);
  window.dispatchEvent(new CustomEvent('theme-change', { detail: { theme } }));
}

// Auto-initialize theme on load
if (typeof window !== 'undefined') {
  const current = getTheme();
  applyTheme(current);
}

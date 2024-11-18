export type Theme = 'system' | 'dark' | 'light';

export interface ThemeOption {
  value: Theme;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export function getSystemTheme(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function shouldUseDarkTheme(theme: Theme): boolean {
  return theme === 'system' ? getSystemTheme() : theme === 'dark';
}

export function setRootTheme(isDark: boolean): void {
  document.documentElement.classList.toggle('dark', isDark);
}
import type { ComponentType } from 'react';

export type Theme = 'system' | 'dark' | 'light';

export interface ThemeOption {
  value: Theme;
  label: string;
  icon: ComponentType<{ className?: string }>;
}

/**
 * OS のカラースキーム設定を取得するユーティリティ。
 * shouldUseDarkTheme から呼び出される。
 */
function getSystemTheme(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/**
 * テーマ設定からダークモードを使用すべきか判定する関数。
 * ThemeContext で利用される。
 */
export function shouldUseDarkTheme(theme: Theme): boolean {
  return theme === 'system' ? getSystemTheme() : theme === 'dark';
}

/**
 * HTML ルート要素にダークモード用クラスを付与する。
 * テーマ変更時に呼び出される。
 */
export function setRootTheme(isDark: boolean): void {
  document.documentElement.classList.toggle('dark', isDark);
}

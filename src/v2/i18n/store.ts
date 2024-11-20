import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import en from './locales/en';
import ja from './locales/ja';
import type { Language, Translations } from './types';

const translations: Record<Language, Translations> = { en, ja };

interface I18nState {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

export const useI18n = create<I18nState>()(
  persist(
    (set, get) => ({
      language: 'ja',
      setLanguage: (language: Language) => set({ language }),
      t: (key: string) => {
        const { language } = get();
        const translation = translations[language];
        return (
          key.split('.').reduce((obj, k) => obj?.[k], translation as any) || key
        );
      },
    }),
    {
      name: 'photo-gallery-language',
    },
  ),
);

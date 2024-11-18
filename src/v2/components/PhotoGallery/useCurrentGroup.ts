import { create } from 'zustand';

interface CurrentGroupState {
  currentGroup: string;
  setCurrentGroup: (group: string) => void;
}

export const useCurrentGroup = create<CurrentGroupState>((set) => ({
  currentGroup: '',
  setCurrentGroup: (group) => set({ currentGroup: group }),
}));
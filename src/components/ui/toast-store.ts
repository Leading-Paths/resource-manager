import { create } from 'zustand';

export type ToastTone = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  tone: ToastTone;
  message: string;
}

interface ToastStore {
  toasts: Toast[];
  push: (tone: ToastTone, message: string) => void;
  dismiss: (id: string) => void;
}

export const useToasts = create<ToastStore>((set) => ({
  toasts: [],
  push: (tone, message) =>
    set((s) => ({
      toasts: [...s.toasts, { id: Math.random().toString(36).slice(2), tone, message }],
    })),
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export function toast(tone: ToastTone, message: string) {
  useToasts.getState().push(tone, message);
}

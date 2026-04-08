import { create } from 'zustand';
import * as storage from '../utils/storage';
import { User } from '../api/auth';

interface AuthState {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Actions
  signIn: (token: string, user: User) => Promise<void>;
  signOut: () => Promise<void>;
  setUser: (user: User) => void;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isLoading: true,
  isAuthenticated: false,

  signIn: async (token, user) => {
    await storage.setItem('auth_token', token);
    set({ token, user, isAuthenticated: true });
  },

  signOut: async () => {
    await storage.deleteItem('auth_token');
    set({ token: null, user: null, isAuthenticated: false });
  },

  setUser: (user) => set({ user }),

  hydrate: async () => {
    try {
      const token = await storage.getItem('auth_token');
      if (token) {
        // Token exists — mark authenticated; screens will fetch profile lazily
        set({ token, isAuthenticated: true, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },
}));

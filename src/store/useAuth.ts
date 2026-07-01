import { create } from 'zustand';
import { User } from 'firebase/auth';

export interface AuthClaims {
  role?: string; // 'superadmin', 'admin', 'creator' etc.
  tenantId?: string;
  [key: string]: any;
}

interface AuthState {
  user: User | null;
  claims: AuthClaims | null;
  setAuth: (user: User | null, claims: AuthClaims | null) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  claims: null,
  isLoading: true,
  setAuth: (user, claims) => set({ user, claims, isLoading: false }),
  setIsLoading: (loading) => set({ isLoading: loading }),
}));

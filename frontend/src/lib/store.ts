import { create } from 'zustand';
import { User, Case } from '@discoveryintel/shared';

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  setAuth: (user, token) => {
    localStorage.setItem('token', token);
    set({ user, token });
  },
  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null });
  },
}));

interface CaseState {
  currentCase: Case | null;
  setCurrentCase: (caseData: Case | null) => void;
}

export const useCaseStore = create<CaseState>((set) => ({
  currentCase: null,
  setCurrentCase: (caseData) => set({ currentCase: caseData }),
}));

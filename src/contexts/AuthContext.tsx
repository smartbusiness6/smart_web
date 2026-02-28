// src/contexts/AuthContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';

// Types (basés sur tes interfaces existantes)
export interface User {
  id: number;
  nom: string;
  email: string;
  role: 'ADMIN' | 'SUPERADMIN' | 'USER';
  profession: {
    poste: string;
  };
  entreprise: {
    id: number;
    nom: string;
  };
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  login: (userData: { token: string; user: User }) => void;
  logout: () => void;
}

// Valeur par défaut (pour TypeScript)
const defaultAuthContext: AuthContextType = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  login: () => {},
  logout: () => {},
};

const AuthContext = createContext<AuthContextType>(defaultAuthContext);

// Hook personnalisé (plus simple à utiliser)
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé à l’intérieur de AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });

  const navigate = useNavigate();

  // Vérifie si l'utilisateur est déjà connecté au chargement
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      try {
        const parsedUser: User = JSON.parse(storedUser);
        setState({
          token: storedToken,
          user: parsedUser,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch (err) {
        console.error('Erreur lors du parsing de user depuis localStorage', err);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    } else {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  const login = (userData: { token: string; user: User }) => {
    localStorage.setItem('token', userData.token);
    localStorage.setItem('user', JSON.stringify(userData.user));

    setState({
      token: userData.token,
      user: userData.user,
      isAuthenticated: true,
      isLoading: false,
    });

    // Redirection après login réussi
    navigate('/dashboard');
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    setState({
      token: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });

    navigate('/', { replace: true });
  };

  const value: AuthContextType = {
    ...state,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
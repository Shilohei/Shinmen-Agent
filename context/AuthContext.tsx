import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { User, AuthState, LoginCredentials, RegisterCredentials } from '../types';
import { apiService } from '../services/api';
import { socketService } from '../services/socket';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: { user: User; token: string } }
  | { type: 'UPDATE_USER'; payload: User }
  | { type: 'LOGOUT' }
  | { type: 'SET_ERROR'; payload: string };

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_USER':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
      };
    
    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload,
      };
    
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      };
    
    case 'SET_ERROR':
      return {
        ...state,
        isLoading: false,
      };
    
    default:
      return state;
  }
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check for existing token on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = apiService.getAuthToken();
      
      if (token) {
        try {
          const response = await apiService.getProfile();
          if (response.success && response.data) {
            dispatch({
              type: 'SET_USER',
              payload: { user: response.data.user, token },
            });
            
            // Connect to socket
            socketService.connect(response.data.user.id);
          } else {
            apiService.removeAuthToken();
            dispatch({ type: 'LOGOUT' });
          }
        } catch (error) {
          console.error('Auth check failed:', error);
          apiService.removeAuthToken();
          dispatch({ type: 'LOGOUT' });
        }
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    checkAuth();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await apiService.login(credentials);
      
      if (response.success && response.data) {
        const { user, token } = response.data;
        
        apiService.setAuthToken(token);
        dispatch({ type: 'SET_USER', payload: { user, token } });
        
        // Connect to socket
        socketService.connect(user.id);
      } else {
        throw new Error(response.error || 'Login failed');
      }
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  const register = async (credentials: RegisterCredentials) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await apiService.register(credentials);
      
      if (response.success && response.data) {
        const { user, token } = response.data;
        
        apiService.setAuthToken(token);
        dispatch({ type: 'SET_USER', payload: { user, token } });
        
        // Connect to socket
        socketService.connect(user.id);
      } else {
        throw new Error(response.error || 'Registration failed');
      }
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  const logout = () => {
    apiService.removeAuthToken();
    socketService.disconnect();
    dispatch({ type: 'LOGOUT' });
    
    // Call logout endpoint (fire and forget)
    apiService.logout().catch(console.error);
  };

  const updateUser = async (updates: Partial<User>) => {
    try {
      const response = await apiService.updateProfile(updates);
      
      if (response.success && response.data) {
        dispatch({ type: 'UPDATE_USER', payload: response.data.user });
      } else {
        throw new Error(response.error || 'Update failed');
      }
    } catch (error: any) {
      throw error;
    }
  };

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

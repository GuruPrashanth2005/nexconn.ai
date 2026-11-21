/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import axios from 'axios';
import { googleLogout } from '@react-oauth/google';

type UserRole = 'STUDENT' | 'FACULTY';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (googleToken: string, requestedRole: UserRole) => Promise<void>;
  loginAsGuest: (requestedRole: UserRole) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = () => {
    googleLogout();
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  useEffect(() => {
    // Check for saved token and user
    const savedToken = sessionStorage.getItem('token');
    const savedUser = sessionStorage.getItem('user');
    
    if (savedToken && savedUser) {
      try {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
      } catch {
        logout();
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (googleToken: string, requestedRole: UserRole) => {
    try {
      const response = await axios.post('/api/v1/auth/google', {
        token: googleToken,
        requestedRole
      });

      const { token: jwtToken, data } = response.data;
      
      sessionStorage.setItem('token', jwtToken);
      sessionStorage.setItem('user', JSON.stringify(data.user));
      
      setToken(jwtToken);
      setUser(data.user);
      axios.defaults.headers.common['Authorization'] = `Bearer ${jwtToken}`;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || 'Login failed';
        throw new Error(message, { cause: error });
      }
      throw new Error('Login failed', { cause: error });
    }
  };

  const loginAsGuest = (requestedRole: UserRole) => {
    const guestUser: User = {
      id: requestedRole === 'FACULTY' ? 'faculty_judge_01' : 'student_guru_2026',
      name: requestedRole === 'FACULTY' ? 'Prof. Faculty (Judge)' : 'Guru Prashanth (Student)',
      email: requestedRole === 'FACULTY' ? 'judge.faculty@hydrolab3d.edu' : 'student.guru@hydrolab3d.edu',
      role: requestedRole,
    };
    const guestToken = 'guest_jwt_token_' + Date.now();
    sessionStorage.setItem('token', guestToken);
    sessionStorage.setItem('user', JSON.stringify(guestUser));
    setToken(guestToken);
    setUser(guestUser);
    axios.defaults.headers.common['Authorization'] = `Bearer ${guestToken}`;
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, loginAsGuest, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

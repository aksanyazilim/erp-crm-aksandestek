// contexts/AuthContext.tsx - DEBUG EKLİ
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { authAPI } from '../services/api';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
  hasPermission: (requiredRole: string | string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        console.log('🔄 Checking authentication...');
        const response = await authAPI.verify();
        console.log('✅ Auth check successful:', response.data.user);
        setUser(response.data.user);
      }
    } catch (error) {
      console.error('❌ Auth check failed:', error);
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log('🔐 Attempting login...', email);
      const response = await authAPI.login(email, password);
      const { token, user } = response.data;
      
      console.log('🎉 Login successful! User:', user);
      console.log('🔑 User role:', user.role);
      
      localStorage.setItem('token', token);
      setUser(user);
      return true;
    } catch (error: any) {
      console.error('❌ Login error:', error.response?.data || error.message);
      return false;
    }
  };

  const logout = () => {
    console.log('🚪 Logging out...');
    localStorage.removeItem('token');
    setUser(null);
  };

  const hasPermission = (requiredRole: string | string[]) => {
    if (!user) {
      console.log('🔐 No user for permission check');
      return false;
    }
    
    console.log('🔐 Permission check:', {
      userRole: user.role,
      requiredRole: requiredRole,
      userDetails: user
    });

    // Admin her şeyi yapabilir
    if (user.role === 'admin') {
      console.log('✅ Admin access granted');
      return true;
    }

    // Array destek
    if (Array.isArray(requiredRole)) {
      const hasAccess = requiredRole.includes(user.role);
      console.log('🔐 Array check result:', hasAccess);
      return hasAccess;
    }
    
    // Single role destek
    const hasAccess = user.role === requiredRole;
    console.log('🔐 Single role check result:', hasAccess);
    return hasAccess;
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      isAuthenticated, 
      loading,
      hasPermission 
    }}>
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
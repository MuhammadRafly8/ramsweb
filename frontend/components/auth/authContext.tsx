"use client";

import { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { authService } from '../../services/api';

// Update the interface to allow null for isAuthenticated
interface AuthContextType {
  isAuthenticated: boolean | null;
  userRole: string | null;
  userId: string | null;
  login: (username: string, password: string) => Promise<unknown>;
  logout: () => Promise<void>;
  isAdmin: () => boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // Change the initial state of isAuthenticated to null to represent "unknown" state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Function to check authentication status
  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      console.log('Checking auth status...');
      
      // Check token in localStorage
      const token = localStorage.getItem('authToken');
      
      if (token) {
        // Set Authorization header
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        try {
          // Verify token with backend
          const userData = await authService.getCurrentUser();
          console.log('Auth status response:', userData);
          
          if (userData) {
            setIsAuthenticated(true);
            setUserRole(userData.role);
            setUserId(userData.id);
          }
        } catch (tokenError) {
          console.error('Token validation failed:', tokenError);
          // Clear invalid token
          localStorage.removeItem('authToken');
          delete axios.defaults.headers.common['Authorization'];
          setIsAuthenticated(false);
          setUserRole(null);
          setUserId(null);
        }
      } else {
        // No token found
        setIsAuthenticated(false);
        setUserRole(null);
        setUserId(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setIsAuthenticated(false);
      setUserRole(null);
      setUserId(null);
    } finally {
      console.log('Setting isLoading to false');
      setIsLoading(false);
    }
  };

  // Check auth status on initial load and when window gains focus
  useEffect(() => {
    checkAuthStatus();
    
    // Re-check auth when window gains focus (user might have logged out in another tab)
    const handleFocus = () => {
      checkAuthStatus();
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const response = await authService.login(username, password);
      
      // Store token in localStorage
      localStorage.setItem('authToken', response.token);
      
      // Set authorization header for future requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${response.token}`;
      
      setIsAuthenticated(true);
      setUserRole(response.user.role);
      setUserId(response.user.id);
      
      return response;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Call logout endpoint
      await authService.logout();
      
      // Remove token from localStorage
      localStorage.removeItem('authToken');
      
      // Remove token from axios headers
      delete axios.defaults.headers.common['Authorization'];
      
      setIsAuthenticated(false);
      setUserRole(null);
      setUserId(null);
      router.push('/auth/login');
    } catch (error) {
      console.error('Logout failed:', error);
      // Still clear token even if logout API fails
      localStorage.removeItem('authToken');
      delete axios.defaults.headers.common['Authorization'];
    }
  };

  const isAdmin = () => {
    return userRole === 'admin';
  };

  // Then in the provider, pass the actual value without the nullish coalescing
  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      userRole, 
      userId, 
      login, 
      logout, 
      isAdmin,
      isLoading
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

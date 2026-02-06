import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  role: string;
  department?: string;
  position?: string;
  isActive: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, expectedRole?: string) => Promise<{ success: boolean; redirectUrl: string; user: User }> ;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Configure axios defaults globally
    const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
    axios.defaults.baseURL = baseURL;
    
    console.log('Setting axios baseURL to:', baseURL);
    
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        
        // Set authorization header
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // CRITICAL: Set user immediately from localStorage
        setUser(parsedUser);
        
        // Verify token in background
        axios.get('/auth/verify')
          .then(() => {
            console.log('Token verified successfully');
          })
          .catch((error) => {
            console.error('Token verification failed:', error);
            // Only clear auth if token is actually invalid (401)
            if (error.response?.status === 401) {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              delete axios.defaults.headers.common['Authorization'];
              setUser(null);
            }
          })
          .finally(() => {
            setLoading(false);
          });
      } catch (error) {
        console.error('Failed to parse user data:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setLoading(false);
      }
    } else {
      delete axios.defaults.headers.common['Authorization'];
      setLoading(false);
    }
  }, []);

  const verifyToken = async () => {
    try {
      const response = await axios.get('/auth/profile');
      setUser(response.data);
    } catch (error) {
      console.error('Token verification failed:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string, expectedRole?: string) => {
    try {
      // Determine login endpoint based on expected role
      let loginEndpoint = '/auth/login';
      if (expectedRole === 'staff') {
        loginEndpoint = '/auth/login/staff';
      } else if (expectedRole === 'reception') {
        loginEndpoint = '/auth/login/reception';
      } else if (expectedRole === 'manager') {
        loginEndpoint = '/auth/login/manager';
      }

      const response = await axios.post(loginEndpoint, { email, password });
      
      const { token, user: userData, redirectUrl } = response.data;
      
      // Store token and user data
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Set axios default header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setUser(userData);
      
      return { success: true, redirectUrl, user: userData };
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Handle different error scenarios
      if (error.response?.data?.code === 'WRONG_ROLE') {
        throw new Error(error.response.data.message);
      } else if (error.response?.data?.code === 'ACCOUNT_INACTIVE') {
        throw new Error('Your account is inactive. Please contact administrator.');
      } else if (error.response?.data?.code === 'INVALID_CREDENTIALS') {
        throw new Error('Invalid email or password');
      } else if (error.response?.status === 404) {
        throw new Error('Route not found. Please contact support.');
      } else {
        throw new Error(error.response?.data?.message || 'Login failed. Please try again.');
      }
    }
  };

  const register = async (userData: any) => {
    try {
      const response = await axios.post('/auth/register', userData);
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      setUser(user);
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

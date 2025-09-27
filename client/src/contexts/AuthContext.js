import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await authAPI.getMe();
          setUser(response.data.user);
        } catch (error) {
          console.error('Auth initialization error:', error);
          localStorage.removeItem('token');
          // Don't show error toast on initial load
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      console.log('🔐 Frontend login attempt:', { email, passwordLength: password?.length });
      
      // Add a small delay to prevent rapid requests
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const response = await authAPI.login(email, password);
      console.log('✅ Login response received:', response.data);
      
      const { token, user: userData } = response.data;
      
      localStorage.setItem('token', token);
      setUser(userData);
      
      console.log('✅ User logged in successfully:', userData);
      toast.success('Login successful!');
      return { success: true };
    } catch (error) {
      console.log('❌ Login error:', error);
      console.log('❌ Error details:', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status
      });
      
      // If it's a 429 error, show a more helpful message
      if (error.response?.status === 429) {
        toast.error('Too many login attempts. Please wait a moment before trying again.');
        return { success: false, message: 'Rate limit exceeded. Please wait before trying again.' };
      }
      
      // If backend is not available, create a mock user for demo purposes
      if (error.code === 'ERR_NETWORK' || error.message.includes('ECONNREFUSED')) {
        console.log('🔄 Network error, using demo mode');
        const mockUser = {
          id: 'demo-user',
          name: 'Demo User',
          email: email,
          role: 'admin'
        };
        // Create a valid demo JWT token for demo user
        const demoToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MDdmMWY3N2JjZjg2Y2Q3OTk0MzkwMTEiLCJpYXQiOjE3NTgxODkzOTIsImV4cCI6MTc1ODI3NTc5Mn0.fcMHq1S48qX5exOuXnjw-HW-A7GhXsEpmHZlYLcCjwI';
        localStorage.setItem('token', demoToken);
        setUser(mockUser);
        toast.success('Demo mode - Login successful!');
        return { success: true };
      }
      
      const message = error.response?.data?.message || 'Login failed';
      console.log('❌ Login failed with message:', message);
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      const { token, user: newUser } = response.data;
      
      localStorage.setItem('token', token);
      setUser(newUser);
      
      toast.success('Registration successful!');
      return { success: true };
    } catch (error) {
      // If backend is not available, create a mock user for demo purposes
      if (error.code === 'ERR_NETWORK' || error.message.includes('ECONNREFUSED')) {
        const mockUser = {
          id: 'demo-user',
          name: userData.name || 'Demo User',
          email: userData.email,
          role: 'admin'
        };
        // Create a valid demo JWT token for demo user
        const demoToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MDdmMWY3N2JjZjg2Y2Q3OTk0MzkwMTEiLCJpYXQiOjE3NTgxODkzOTIsImV4cCI6MTc1ODI3NTc5Mn0.fcMHq1S48qX5exOuXnjw-HW-A7GhXsEpmHZlYLcCjwI';
        localStorage.setItem('token', demoToken);
        setUser(mockUser);
        toast.success('Demo mode - Registration successful!');
        return { success: true };
      }
      
      const message = error.response?.data?.message || 'Registration failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    toast.success('Logged out successfully');
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await authAPI.updateProfile(profileData);
      setUser(response.data.user);
      toast.success('Profile updated successfully');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Profile update failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      await authAPI.changePassword(currentPassword, newPassword);
      toast.success('Password changed successfully');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Password change failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
    changePassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

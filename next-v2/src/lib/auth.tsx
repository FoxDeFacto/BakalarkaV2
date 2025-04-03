// src/lib/auth.tsx
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User } from './types';
import { authApi } from './api';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  register: (
    username: string,
    email: string,
    password: string,
    confirmPassword: string,
    role: 'student' | 'teacher' | 'admin'
  ) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isStudent: boolean;
  isTeacher: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Check if user is logged in on mount
  useEffect(() => {
    let isMounted = true;
    
    async function loadUser() {
      try {
        const currentUser = await authApi.getCurrentUser();
        if (isMounted) {
          setUser(currentUser);
        }
      } catch (err) {
        console.error('Failed to load user:', err);
        // Clear tokens if authentication fails
        if (isMounted) {
          authApi.logout();
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadUser();
    
    // Cleanup function to handle component unmount
    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (username: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      await authApi.login(username, password);
      const user = await authApi.getCurrentUser();
      setUser(user);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (
    username: string,
    email: string,
    password: string,
    confirmPassword: string,
    role: 'student' | 'teacher' | 'admin'
  ) => {
    setLoading(true);
    setError(null);

    try {
      await authApi.register({
        username,
        email,
        password,
        password_confirm: confirmPassword,
        role,
      });
      
      // Auto login after registration
      await login(username, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authApi.logout();
    setUser(null);
    router.push('/');
  };

  // Computed properties
  const isAuthenticated = !!user;
  const isStudent = !!user && user.role === 'student';
  const isTeacher = !!user && user.role === 'teacher';
  const isAdmin = !!user && user.role === 'admin';

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    isAuthenticated,
    isStudent,
    isTeacher,
    isAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Auth required higher-order component with improved loading state handling
export function withAuth(Component: React.ComponentType) {
  return function AuthComponent(props: any) {
    const { user, loading, isAuthenticated } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!loading && !isAuthenticated) {
        router.push('/login');
      }
    }, [loading, isAuthenticated, router]);

    if (loading) {
      return <div className="flex h-screen items-center justify-center">Loading...</div>;
    }

    if (!isAuthenticated) {
      return null;
    }

    return <Component {...props} />;
  };
}

// Route protection for role-based access with improved loading state handling
export function withRole(Component: React.ComponentType, allowedRoles: ('student' | 'teacher' | 'admin')[]) {
  return function RoleComponent(props: any) {
    const { user, loading, isAuthenticated } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!loading) {
        if (!isAuthenticated) {
          router.push('/login');
        } else if (user && !allowedRoles.includes(user.role)) {
          router.push('/dashboard');
        }
      }
    }, [loading, isAuthenticated, user, router]);

    if (loading) {
      return <div className="flex h-screen items-center justify-center">Loading...</div>;
    }

    if (!isAuthenticated || (user && !allowedRoles.includes(user.role))) {
      return null;
    }

    return <Component {...props} />;
  };
}
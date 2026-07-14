"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { authApi } from "./api";
import { User } from "../types";

// Setup QueryClient for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

interface AuthContextType {
  user: User | null;
  role: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, userRole: string, fullName: string, userId: number) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function Providers({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const profile = await authApi.getMe();
      setUser(profile);
      setRole(profile.role.name);
    } catch (error) {
      // Clear credentials if token expired/invalid
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedRole = localStorage.getItem("role");
    
    if (token) {
      setRole(savedRole);
      fetchProfile();
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = (token: string, userRole: string, fullName: string, userId: number) => {
    localStorage.setItem("token", token);
    localStorage.setItem("role", userRole);
    localStorage.setItem("userName", fullName);
    localStorage.setItem("userId", String(userId));
    setRole(userRole);
    setIsLoading(true);
    fetchProfile();
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("userName");
    localStorage.removeItem("userId");
    setUser(null);
    setRole(null);
    setIsLoading(false);
  };

  const refreshUser = async () => {
    if (localStorage.getItem("token")) {
      await fetchProfile();
    }
  };

  const isAuthenticated = !!user;

  return (
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider
        value={{
          user,
          role,
          isAuthenticated,
          isLoading,
          login,
          logout,
          refreshUser,
        }}
      >
        {children}
      </AuthContext.Provider>
    </QueryClientProvider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
export { queryClient };

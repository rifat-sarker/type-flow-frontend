"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { api, setAccessToken, tryRefresh } from "./api";
import { AuthUser } from "@/types";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (emailOrUsername: string, password: string) => Promise<AuthUser>;
  register: (username: string, email: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  verifyOtp: (email: string, code: string) => Promise<void>;
  resendOtp: (email: string, purpose: "verify" | "reset") => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (email: string, code: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const data = await api.get<{ user: AuthUser }>("/api/auth/me");
      setUser(data.user);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    (async () => {
      const ok = await tryRefresh();
      if (ok) await refreshUser();
      setLoading(false);
    })();
  }, [refreshUser]);

  const login = useCallback(async (emailOrUsername: string, password: string) => {
    const data = await api.post<{ accessToken: string; user: AuthUser }>("/api/auth/login", {
      emailOrUsername,
      password,
    });
    setAccessToken(data.accessToken);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (username: string, email: string, password: string) => {
    const data = await api.post<{ accessToken: string; user: AuthUser }>("/api/auth/register", {
      username,
      email,
      password,
    });
    setAccessToken(data.accessToken);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    await api.post("/api/auth/logout");
    setAccessToken(null);
    setUser(null);
  }, []);

  const verifyOtp = useCallback(async (email: string, code: string) => {
    const data = await api.post<{ user: AuthUser }>("/api/auth/verify-otp", { email, code });
    setUser(data.user);
  }, []);

  const resendOtp = useCallback(async (email: string, purpose: "verify" | "reset") => {
    await api.post("/api/auth/resend-otp", { email, purpose });
  }, []);

  const forgotPassword = useCallback(async (email: string) => {
    await api.post("/api/auth/forgot-password", { email });
  }, []);

  const resetPassword = useCallback(async (email: string, code: string, newPassword: string) => {
    await api.post("/api/auth/reset-password", { email, code, newPassword });
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, refreshUser, verifyOtp, resendOtp, forgotPassword, resetPassword }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}

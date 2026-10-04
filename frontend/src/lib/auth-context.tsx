"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, clearTokens, getTokens, setTokens } from "./api";
import type { User } from "./types";
import { clearOfflineData } from "@/components/pwa/ServiceWorker";

interface LoginResponse {
  access: string;
  refresh: string;
  user: User;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (phone: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const { access } = getTokens();
    const check = access
      ? apiFetch<User>("/auth/me/").then(setUser).catch(() => clearTokens())
      : Promise.resolve();
    check.finally(() => setLoading(false));
  }, []);

  const login = useCallback(
    async (phone: string, password: string) => {
      const data = await apiFetch<LoginResponse>("/auth/token/", {
        method: "POST",
        auth: false,
        body: JSON.stringify({ phone, password }),
      });
      setTokens(data.access, data.refresh);
      setUser(data.user);
      router.push("/today");
    },
    [router]
  );

  const logout = useCallback(() => {
    clearTokens();
    clearOfflineData();
    setUser(null);
    router.push("/login");
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

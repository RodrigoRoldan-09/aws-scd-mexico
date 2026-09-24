"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "admin" | "organizer" | "volunteer" | "badges";
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string, captchaToken?: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
  refresh: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

const SESSION_CHECK_INTERVAL = 10_000;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const wasAuthenticated = useRef(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        wasAuthenticated.current = true;
      } else {
        const hadUser = wasAuthenticated.current;
        setUser(null);
        wasAuthenticated.current = false;

        // If the user WAS authenticated and now isn't, redirect to login
        if (hadUser) {
          const locale = pathname.startsWith("/en") ? "en" : "es";
          router.replace(`/${locale}/admin/login`);
        }
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [router, pathname]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Periodic session validation — detects when another device takes over
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) {
          setUser(null);
          wasAuthenticated.current = false;
          const locale = pathname.startsWith("/en") ? "en" : "es";
          router.replace(`/${locale}/admin/login`);
        }
      } catch {
        // Network error — don't log out, just skip
      }
    }, SESSION_CHECK_INTERVAL);

    return () => clearInterval(interval);
  }, [user, router, pathname]);

  const login = async (email: string, password: string, captchaToken?: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, captchaToken }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    setUser(data.user);
    wasAuthenticated.current = true;
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    wasAuthenticated.current = false;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

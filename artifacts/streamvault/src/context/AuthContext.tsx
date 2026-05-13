import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export interface AuthUser {
  id: number;
  email: string;
  name: string | null;
  avatarUrl?: string | null;
  role: string;
  plan?: string;
  isActive?: boolean;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  updateUser: (fields: { name?: string; avatarUrl?: string | null }) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<{ resetToken?: string }>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = "fiirso_user_token";
const USER_KEY = "fiirso_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
  });

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    const userStr = localStorage.getItem(USER_KEY);
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr) as AuthUser;
        setState({ user, token, isLoading: false });
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setState({ user: null, token: null, isLoading: false });
      }
    } else {
      setState(s => ({ ...s, isLoading: false }));
    }
  }, []);

  // Poll /api/auth/me to pick up real-time plan/role/ban changes
  useEffect(() => {
    const poll = async () => {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) return;
      try {
        const res = await fetch("/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 401 || res.status === 403) {
          // Token invalid or user banned — force logout
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
          setState({ user: null, token: null, isLoading: false });
          return;
        }
        if (!res.ok) return;
        const data = await res.json() as { user: AuthUser };
        const fresh = data.user;
        // If banned, force logout immediately
        if (fresh.isActive === false) {
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
          setState({ user: null, token: null, isLoading: false });
          return;
        }
        // Sync plan/role/name changes without re-login
        setState(prev => {
          if (!prev.user) return prev;
          const changed =
            prev.user.plan !== fresh.plan ||
            prev.user.role !== fresh.role ||
            prev.user.name !== fresh.name ||
            prev.user.avatarUrl !== fresh.avatarUrl ||
            prev.user.isActive !== fresh.isActive;
          if (!changed) return prev;
          const updated = { ...prev.user, ...fresh };
          localStorage.setItem(USER_KEY, JSON.stringify(updated));
          return { ...prev, user: updated };
        });
      } catch {
        // Network error — ignore silently
      }
    };

    // Poll every 4 seconds for near-instant ban/role/plan propagation
    const id = setInterval(poll, 4000);

    // Also poll immediately when the tab regains focus or becomes visible
    const onVisible = () => {
      if (document.visibilityState === "visible") poll();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", poll);

    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", poll);
    };
  }, []);

  const login = async (email: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json() as { error?: string };
      throw new Error(err.error || "Login failed");
    }
    const data = await res.json() as { token: string; user: AuthUser };
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    setState({ user: data.user, token: data.token, isLoading: false });
  };

  const register = async (email: string, password: string, name: string) => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name }),
    });
    if (!res.ok) {
      const err = await res.json() as { error?: string };
      throw new Error(err.error || "Registration failed");
    }
    const data = await res.json() as { token: string; user: AuthUser };
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    setState({ user: data.user, token: data.token, isLoading: false });
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setState({ user: null, token: null, isLoading: false });
  };

  const updateUser = async (fields: { name?: string; avatarUrl?: string | null }) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) throw new Error("Not logged in");
    const res = await fetch("/api/auth/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(fields),
    });
    if (!res.ok) {
      const err = await res.json() as { error?: string };
      throw new Error(err.error || "Failed to update profile");
    }
    const data = await res.json() as { user: AuthUser };
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    setState(s => ({ ...s, user: data.user }));
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) throw new Error("Not logged in");
    const res = await fetch("/api/auth/change-password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    if (!res.ok) {
      const err = await res.json() as { error?: string };
      throw new Error(err.error || "Failed to change password");
    }
  };

  const forgotPassword = async (email: string): Promise<{ resetToken?: string }> => {
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) {
      const err = await res.json() as { error?: string };
      throw new Error(err.error || "Failed to send reset link");
    }
    return res.json() as Promise<{ resetToken?: string }>;
  };

  const resetPassword = async (token: string, newPassword: string) => {
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, newPassword }),
    });
    if (!res.ok) {
      const err = await res.json() as { error?: string };
      throw new Error(err.error || "Failed to reset password");
    }
  };

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, updateUser, changePassword, forgotPassword, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { API_URL } from "@/lib/api-url";

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

async function safeJson(res: Response): Promise<Record<string, unknown>> {
  try {
    return await res.json() as Record<string, unknown>;
  } catch {
    return {};
  }
}

async function extractError(res: Response, fallback: string): Promise<string> {
  const body = await safeJson(res);
  if (typeof body.error === "string" && body.error) return body.error;
  if (res.status === 404) return "API server not found. Check that VITE_API_URL is set correctly in Vercel.";
  if (res.status === 503 || res.status === 502) return "API server is unavailable. Check your environment variables in Vercel.";
  return fallback;
}

async function apiFetch(url: string, options?: RequestInit): Promise<Response> {
  try {
    return await fetch(url, options);
  } catch {
    throw new Error("Cannot reach the server. Make sure the API is deployed and environment variables are set in Vercel.");
  }
}

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
        const res = await fetch(`${API_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
          setState({ user: null, token: null, isLoading: false });
          return;
        }
        if (!res.ok) return;
        const data = await safeJson(res);
        const fresh = data.user as AuthUser | undefined;
        if (!fresh) return;
        if (fresh.isActive === false) {
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
          setState({ user: null, token: null, isLoading: false });
          return;
        }
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

    const id = setInterval(poll, 4000);
    const onVisible = () => { if (document.visibilityState === "visible") poll(); };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", poll);

    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", poll);
    };
  }, []);

  const login = async (email: string, password: string) => {
    const res = await apiFetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const msg = await extractError(res, "Login failed");
      throw new Error(msg);
    }
    const data = await safeJson(res) as { token?: string; user?: AuthUser };
    if (!data.token || !data.user) throw new Error("Unexpected server response. Please try again.");
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    setState({ user: data.user, token: data.token, isLoading: false });
  };

  const register = async (email: string, password: string, name: string) => {
    const res = await apiFetch(`${API_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name }),
    });
    if (!res.ok) {
      const msg = await extractError(res, "Registration failed");
      throw new Error(msg);
    }
    const data = await safeJson(res) as { token?: string; user?: AuthUser };
    if (!data.token || !data.user) throw new Error("Unexpected server response. Please try again.");
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
    const res = await apiFetch(`${API_URL}/api/auth/profile`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(fields),
    });
    if (!res.ok) {
      const msg = await extractError(res, "Failed to update profile");
      throw new Error(msg);
    }
    const data = await safeJson(res) as { user?: AuthUser };
    if (data.user) {
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      setState(s => ({ ...s, user: data.user! }));
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) throw new Error("Not logged in");
    const res = await apiFetch(`${API_URL}/api/auth/change-password`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    if (!res.ok) {
      const msg = await extractError(res, "Failed to change password");
      throw new Error(msg);
    }
  };

  const forgotPassword = async (email: string): Promise<{ resetToken?: string }> => {
    const res = await apiFetch(`${API_URL}/api/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) {
      const msg = await extractError(res, "Failed to send reset link");
      throw new Error(msg);
    }
    return safeJson(res) as Promise<{ resetToken?: string }>;
  };

  const resetPassword = async (token: string, newPassword: string) => {
    const res = await apiFetch(`${API_URL}/api/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, newPassword }),
    });
    if (!res.ok) {
      const msg = await extractError(res, "Failed to reset password");
      throw new Error(msg);
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

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import { API_URL } from "@/lib/api-url";

interface AdminUser {
  id: number;
  email: string;
  name: string | null;
  role: string;
}

interface AuthState {
  user: AdminUser | null;
  token: string | null;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = "fiirso_admin_token";
const USER_KEY = "fiirso_admin_user";

setAuthTokenGetter(() => localStorage.getItem(TOKEN_KEY));

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

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
  });

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setState({ user: null, token: null, isLoading: false });
      return;
    }

    fetch(`${API_URL}/api/auth/admin/verify`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("Invalid session");
        const data = await safeJson(res);
        const user = data.user as AdminUser | undefined;
        if (!user || user.role !== "admin") throw new Error("Not admin");
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        setState({ user, token, isLoading: false });
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setState({ user: null, token: null, isLoading: false });
      });
  }, []);

  const login = async (email: string, password: string) => {
    let res: Response;
    try {
      res = await fetch(`${API_URL}/api/auth/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
    } catch {
      throw new Error("Cannot reach the server. Make sure the API is deployed and VITE_API_URL is set in Vercel.");
    }

    if (!res.ok) {
      const msg = await extractError(res, "Login failed");
      throw new Error(msg);
    }

    const data = await safeJson(res) as { token?: string; user?: AdminUser };
    if (!data.token || !data.user) throw new Error("Unexpected server response. Please try again.");
    if (data.user.role !== "admin") throw new Error("Access denied. Admin privileges required.");

    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    setState({ user: data.user, token: data.token, isLoading: false });
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setState({ user: null, token: null, isLoading: false });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used inside AdminAuthProvider");
  return ctx;
}

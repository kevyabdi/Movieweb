import { useState, useEffect } from "react";
import { useAdminAuth } from "@/context/AuthContext";
import { API_URL } from "@/lib/api-url";
import { Clapperboard, Loader2, Eye, EyeOff, AlertCircle, Info, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type ApiStatus = "checking" | "ok" | "degraded" | "unreachable";

interface HealthData {
  status: "ok" | "degraded";
  latencyMs: number;
  checks: {
    database: { status: "ok" | "error"; latencyMs: number | null; error?: string };
  };
}

function useApiStatus() {
  const [status, setStatus] = useState<ApiStatus>("checking");
  const [health, setHealth] = useState<HealthData | null>(null);
  const [checking, setChecking] = useState(false);

  const check = async () => {
    setChecking(true);
    try {
      const res = await fetch(`${API_URL}/api/health`, { signal: AbortSignal.timeout(8000) });
      const data: HealthData = await res.json();
      setHealth(data);
      setStatus(data.status === "ok" ? "ok" : "degraded");
    } catch {
      setHealth(null);
      setStatus("unreachable");
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    check();
  }, []);

  return { status, health, checking, recheck: check };
}

const STATUS_CONFIG: Record<ApiStatus, { dot: string; label: string; text: string }> = {
  checking: { dot: "bg-muted-foreground animate-pulse", label: "Checking…", text: "text-muted-foreground" },
  ok:        { dot: "bg-emerald-500",                  label: "API online", text: "text-emerald-500" },
  degraded:  { dot: "bg-amber-500 animate-pulse",      label: "DB issue",   text: "text-amber-500" },
  unreachable:{ dot: "bg-destructive animate-pulse",   label: "Unreachable",text: "text-destructive" },
};

export default function LoginPage() {
  const { login } = useAdminAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { status, health, checking, recheck } = useApiStatus();

  const isAccessDenied = error.toLowerCase().includes("access denied") || error.toLowerCase().includes("admin privileges");
  const cfg = STATUS_CONFIG[status];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 shadow-lg shadow-violet-900/40 mb-4">
            <Clapperboard className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Fiirso <span className="text-violet-400">Admin</span></h1>
          <p className="text-sm text-muted-foreground mt-1">Sign in to manage content</p>
        </div>

        {/* API Status Badge */}
        <div className="mb-5 flex items-center justify-between rounded-xl border border-border/50 bg-muted/20 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full shrink-0 ${cfg.dot}`} />
            <span className={`text-xs font-medium ${cfg.text}`}>{cfg.label}</span>
            {health && status === "ok" && (
              <span className="text-[10px] text-muted-foreground/50">
                {health.latencyMs}ms · DB {health.checks.database.latencyMs}ms
              </span>
            )}
            {status === "degraded" && health?.checks.database.error && (
              <span className="text-[10px] text-amber-500/70 truncate max-w-[120px]" title={health.checks.database.error}>
                {health.checks.database.error}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={recheck}
            disabled={checking}
            className="text-muted-foreground/40 hover:text-muted-foreground transition-colors disabled:opacity-40"
            title="Recheck API status"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${checking ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@example.com"
              autoComplete="email"
              required
              className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
                className="w-full rounded-xl border border-border bg-card px-4 py-3 pr-11 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
              >
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className={`flex gap-3 rounded-xl px-4 py-3 border text-xs ${
                  isAccessDenied
                    ? "text-amber-600 bg-amber-500/10 border-amber-500/25 dark:text-amber-400"
                    : "text-destructive bg-destructive/10 border-destructive/20"
                }`}
              >
                {isAccessDenied
                  ? <Info className="h-4 w-4 mt-0.5 shrink-0" />
                  : <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />}
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={isLoading || !email || !password}
            className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] mt-2 flex items-center justify-center gap-2"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {isLoading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <div className="mt-6 rounded-xl border border-border/50 bg-muted/30 px-4 py-3">
          <p className="text-[11px] text-muted-foreground/60 text-center leading-relaxed">
            Sign in with your admin email and password.
            <br />
            Only accounts with <span className="font-mono font-semibold text-foreground/70">role: admin</span> can access this panel.
          </p>
        </div>

        <p className="text-center text-xs text-muted-foreground/40 mt-6">
          Fiirso Content Management System
        </p>
      </motion.div>
    </div>
  );
}

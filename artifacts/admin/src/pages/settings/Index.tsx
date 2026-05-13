import { useState, useEffect } from "react";
import { Shield, Settings, Loader2, CheckCircle2, AlertCircle, Key } from "lucide-react";
import SecurityPage from "./Security";
import { useAdminAuth } from "@/context/AuthContext";

type Tab = "general" | "security";

const tabs: { id: Tab; label: string; icon: typeof Shield }[] = [
  { id: "general",  label: "General",  icon: Settings },
  { id: "security", label: "Security", icon: Shield },
];

function GeneralSettings() {
  const { token, user } = useAdminAuth();
  const [tmdbStatus, setTmdbStatus] = useState<"idle" | "checking" | "ok" | "error">("idle");
  const [tmdbError, setTmdbError] = useState("");
  const [apiStatus, setApiStatus] = useState<null | { status: string; uptime?: number }>(null);

  useEffect(() => {
    fetch("/api/health")
      .then(r => r.json() as Promise<{ status: string; uptime?: number }>)
      .then(d => setApiStatus(d))
      .catch(() => setApiStatus({ status: "error" }));
  }, []);

  const checkTmdb = async () => {
    setTmdbStatus("checking");
    setTmdbError("");
    try {
      const res = await fetch("/api/tmdb/search?q=test&type=movie", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setTmdbStatus("ok");
      } else {
        const data = await res.json() as { error?: string };
        setTmdbError(data.error ?? "TMDB request failed");
        setTmdbStatus("error");
      }
    } catch {
      setTmdbError("Network error");
      setTmdbStatus("error");
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Admin Account */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-xs font-bold text-primary">
              {(user?.name ?? user?.email ?? "A")[0].toUpperCase()}
            </span>
          </div>
          Admin Account
        </h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Name</p>
            <p className="font-medium">{user?.name ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Email</p>
            <p className="font-medium truncate">{user?.email ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Role</p>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20 capitalize">
              {user?.role ?? "admin"}
            </span>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Status</p>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-green-500/10 text-green-400 border border-green-500/20">
              Active
            </span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">To change your password, go to the Security tab.</p>
      </div>

      {/* API Server Status */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <h2 className="text-sm font-semibold">System Status</h2>
        <div className="space-y-2.5">
          <div className="flex items-center justify-between py-2 border-b border-border/50">
            <span className="text-sm">API Server</span>
            {apiStatus === null
              ? <span className="text-xs text-muted-foreground">Checking…</span>
              : apiStatus.status === "ok"
              ? <span className="flex items-center gap-1.5 text-xs text-green-400"><CheckCircle2 className="h-3.5 w-3.5" /> Operational</span>
              : <span className="flex items-center gap-1.5 text-xs text-destructive"><AlertCircle className="h-3.5 w-3.5" /> Error</span>
            }
          </div>
          {apiStatus?.uptime !== undefined && (
            <div className="flex items-center justify-between py-2 border-b border-border/50">
              <span className="text-sm text-muted-foreground">Server Uptime</span>
              <span className="text-xs text-muted-foreground">{Math.floor(apiStatus.uptime / 60)}m {Math.floor(apiStatus.uptime % 60)}s</span>
            </div>
          )}
        </div>
      </div>

      {/* TMDB Settings */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <Key className="h-4 w-4 text-muted-foreground" />
          TMDB Integration
        </h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          The TMDB API key must be set as the <code className="bg-muted px-1 rounded font-mono">TMDB_API_KEY</code> environment secret on the server.
          Use the button below to verify it is configured and working.
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={checkTmdb}
            disabled={tmdbStatus === "checking"}
            className="flex items-center gap-2 rounded-xl border border-border bg-muted/30 px-4 py-2 text-sm font-medium hover:bg-muted/60 transition-colors disabled:opacity-50"
          >
            {tmdbStatus === "checking" && <Loader2 className="h-4 w-4 animate-spin" />}
            {tmdbStatus !== "checking" && <Key className="h-4 w-4 text-muted-foreground" />}
            Test TMDB Connection
          </button>
          {tmdbStatus === "ok" && (
            <span className="flex items-center gap-1.5 text-xs text-green-400">
              <CheckCircle2 className="h-3.5 w-3.5" /> Connected
            </span>
          )}
          {tmdbStatus === "error" && (
            <span className="flex items-center gap-1.5 text-xs text-destructive">
              <AlertCircle className="h-3.5 w-3.5" /> {tmdbError || "Not configured"}
            </span>
          )}
        </div>
        <div className="rounded-xl border border-border/50 bg-muted/20 px-4 py-3 text-[11px] text-muted-foreground leading-relaxed">
          <strong className="text-foreground/60">How to set TMDB_API_KEY:</strong> Go to your Replit project → Secrets → add <code className="font-mono">TMDB_API_KEY</code> with your key from{" "}
          <a href="https://www.themoviedb.org/settings/api" target="_blank" rel="noreferrer" className="text-blue-400 underline hover:text-blue-300">
            themoviedb.org/settings/api
          </a>. Restart the API server after adding it.
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [active, setActive] = useState<Tab>("general");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage your admin account, integrations, and content categories</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-border">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              active === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {active === "general"  && <GeneralSettings />}
        {active === "security" && <SecurityPage />}
      </div>
    </div>
  );
}

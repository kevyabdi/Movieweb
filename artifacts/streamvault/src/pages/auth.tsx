import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Eye, EyeOff, ChevronLeft, Check, KeyRound } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

type Tab = "login" | "register";
type View = "auth" | "forgot" | "reset";

export default function AuthPage() {
  const { login, register, forgotPassword, resetPassword } = useAuth();
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<Tab>("login");
  const [view, setView] = useState<View>("auth");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotToken, setForgotToken] = useState("");

  const [resetToken, setResetToken] = useState("");
  const [resetPass, setResetPass] = useState("");
  const [resetConfirm, setResetConfirm] = useState("");
  const [resetDone, setResetDone] = useState(false);
  const [showResetPass, setShowResetPass] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      if (tab === "login") {
        await login(email, password);
      } else {
        await register(email, password, name);
      }
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const result = await forgotPassword(forgotEmail);
      setForgotSent(true);
      if (result.resetToken) {
        setForgotToken(result.resetToken);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (resetPass.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (resetPass !== resetConfirm) { setError("Passwords do not match"); return; }
    setIsLoading(true);
    try {
      await resetPassword(resetToken, resetPass);
      setResetDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="px-5 pt-12">
        <button
          onClick={() => {
            if (view !== "auth") { setView("auth"); setError(""); setForgotSent(false); }
            else window.history.back();
          }}
          className="flex items-center gap-1 text-foreground/40 hover:text-foreground/70 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="text-sm">Back</span>
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center px-5 py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="w-full max-w-sm"
        >
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <img src="/logo.png" alt="Fiirso" className="h-10 w-auto mb-4 dark:invert" />
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {view === "forgot" ? "Reset Password" : view === "reset" ? "Set New Password" : tab === "login" ? "Welcome back" : "Create account"}
            </h1>
            <p className="text-sm text-foreground/40 mt-1">
              {view === "forgot" ? "Enter your email to receive a reset link" :
               view === "reset" ? "Enter your new password below" :
               tab === "login" ? "Sign in to your Fiirso account" : "Start watching today"}
            </p>
          </div>

          {/* ── Forgot Password View ── */}
          <AnimatePresence mode="wait">
            {view === "forgot" && (
              <motion.div
                key="forgot"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
              >
                {!forgotSent ? (
                  <form onSubmit={handleForgotSubmit} className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-foreground/50 mb-1.5">Email address</label>
                      <input
                        type="email"
                        value={forgotEmail}
                        onChange={e => setForgotEmail(e.target.value)}
                        placeholder="you@example.com"
                        required
                        className="w-full rounded-2xl border border-foreground/[0.1] bg-foreground/[0.04] px-4 py-3 text-sm text-foreground placeholder:text-foreground/25 focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-all"
                      />
                    </div>
                    {error && (
                      <p className="text-xs text-red-400 bg-red-500/10 rounded-xl px-4 py-3 border border-red-500/20">{error}</p>
                    )}
                    <button
                      type="submit"
                      disabled={isLoading || !forgotEmail}
                      className="w-full mt-2 rounded-2xl bg-foreground py-3.5 text-sm font-semibold text-background hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                      {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                      {isLoading ? "Sending…" : "Send Reset Link"}
                    </button>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-4 text-center">
                      <Check className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-foreground">Reset link sent!</p>
                      <p className="text-xs text-foreground/45 mt-1">Check your email for the reset link.</p>
                    </div>
                    {forgotToken && (
                      <div className="rounded-2xl border border-amber-400/20 bg-amber-400/[0.06] px-4 py-4">
                        <p className="text-[11px] font-semibold uppercase tracking-widest text-amber-400/70 mb-2">Your Reset Token</p>
                        <p className="text-xs font-mono text-foreground/60 break-all leading-relaxed">{forgotToken}</p>
                        <button
                          onClick={() => { setView("reset"); setResetToken(forgotToken); setError(""); }}
                          className="mt-3 w-full rounded-xl bg-amber-400/20 text-amber-400 text-[12px] font-semibold py-2.5 hover:bg-amber-400/30 transition-colors flex items-center justify-center gap-2"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                          Use this token to reset
                        </button>
                      </div>
                    )}
                    <button
                      onClick={() => { setView("reset"); setError(""); }}
                      className="w-full rounded-2xl border border-foreground/[0.1] bg-foreground/[0.04] py-3 text-sm font-medium text-foreground hover:bg-foreground/[0.08] transition-colors"
                    >
                      I have a reset token
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* ── Reset Password View ── */}
            {view === "reset" && (
              <motion.div
                key="reset"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
              >
                {!resetDone ? (
                  <form onSubmit={handleResetSubmit} className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-foreground/50 mb-1.5">Reset Token</label>
                      <input
                        type="text"
                        value={resetToken}
                        onChange={e => setResetToken(e.target.value)}
                        placeholder="Paste your reset token"
                        required
                        className="w-full rounded-2xl border border-foreground/[0.1] bg-foreground/[0.04] px-4 py-3 text-sm text-foreground font-mono placeholder:text-foreground/25 focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-foreground/50 mb-1.5">New Password</label>
                      <div className="relative">
                        <input
                          type={showResetPass ? "text" : "password"}
                          value={resetPass}
                          onChange={e => setResetPass(e.target.value)}
                          placeholder="Min. 6 characters"
                          required
                          className="w-full rounded-2xl border border-foreground/[0.1] bg-foreground/[0.04] px-4 py-3 pr-11 text-sm text-foreground placeholder:text-foreground/25 focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowResetPass(v => !v)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/30 hover:text-foreground/60 transition-colors"
                        >
                          {showResetPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-foreground/50 mb-1.5">Confirm New Password</label>
                      <input
                        type="password"
                        value={resetConfirm}
                        onChange={e => setResetConfirm(e.target.value)}
                        placeholder="Repeat new password"
                        required
                        className="w-full rounded-2xl border border-foreground/[0.1] bg-foreground/[0.04] px-4 py-3 text-sm text-foreground placeholder:text-foreground/25 focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-all"
                      />
                    </div>
                    {error && (
                      <p className="text-xs text-red-400 bg-red-500/10 rounded-xl px-4 py-3 border border-red-500/20">{error}</p>
                    )}
                    <button
                      type="submit"
                      disabled={isLoading || !resetToken || !resetPass || !resetConfirm}
                      className="w-full mt-2 rounded-2xl bg-foreground py-3.5 text-sm font-semibold text-background hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                      {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                      {isLoading ? "Resetting…" : "Reset Password"}
                    </button>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-5 text-center">
                      <Check className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-foreground">Password reset!</p>
                      <p className="text-xs text-foreground/45 mt-1">You can now sign in with your new password.</p>
                    </div>
                    <button
                      onClick={() => { setView("auth"); setTab("login"); setError(""); setResetDone(false); }}
                      className="w-full rounded-2xl bg-foreground py-3.5 text-sm font-semibold text-background hover:opacity-90 transition-all"
                    >
                      Sign In
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* ── Auth View ── */}
            {view === "auth" && (
              <motion.div
                key="auth"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.25 }}
              >
                {/* Tab switcher */}
                <div className="flex rounded-2xl border border-foreground/[0.08] overflow-hidden mb-6">
                  {(["login", "register"] as Tab[]).map(t => (
                    <button
                      key={t}
                      onClick={() => { setTab(t); setError(""); }}
                      className={`flex-1 py-2.5 text-sm font-medium transition-all duration-200 ${
                        tab === t
                          ? "bg-foreground/[0.08] text-foreground"
                          : "text-foreground/35 hover:text-foreground/55"
                      }`}
                    >
                      {t === "login" ? "Sign In" : "Register"}
                    </button>
                  ))}
                </div>

                <form onSubmit={handleSubmit} className="space-y-3">
                  <AnimatePresence>
                    {tab === "register" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <label className="block text-xs font-medium text-foreground/50 mb-1.5">Name</label>
                        <input
                          type="text"
                          value={name}
                          onChange={e => setName(e.target.value)}
                          placeholder="Your name"
                          className="w-full rounded-2xl border border-foreground/[0.1] bg-foreground/[0.04] px-4 py-3 text-sm text-foreground placeholder:text-foreground/25 focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-all"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div>
                    <label className="block text-xs font-medium text-foreground/50 mb-1.5">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      autoComplete="email"
                      required
                      className="w-full rounded-2xl border border-foreground/[0.1] bg-foreground/[0.04] px-4 py-3 text-sm text-foreground placeholder:text-foreground/25 focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-all"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-medium text-foreground/50">Password</label>
                      {tab === "login" && (
                        <button
                          type="button"
                          onClick={() => { setView("forgot"); setForgotEmail(email); setError(""); setForgotSent(false); }}
                          className="text-xs text-foreground/40 hover:text-foreground/70 transition-colors"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type={showPass ? "text" : "password"}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder={tab === "register" ? "Min. 6 characters" : "••••••••"}
                        autoComplete={tab === "login" ? "current-password" : "new-password"}
                        required
                        className="w-full rounded-2xl border border-foreground/[0.1] bg-foreground/[0.04] px-4 py-3 pr-11 text-sm text-foreground placeholder:text-foreground/25 focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass(v => !v)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/30 hover:text-foreground/60 transition-colors"
                      >
                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs text-red-400 bg-red-500/10 rounded-xl px-4 py-3 border border-red-500/20"
                    >
                      {error}
                    </motion.p>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading || !email || !password}
                    className="w-full mt-2 rounded-2xl bg-foreground py-3.5 text-sm font-semibold text-background hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                    {isLoading
                      ? (tab === "login" ? "Signing in…" : "Creating account…")
                      : (tab === "login" ? "Sign In" : "Create Account")}
                  </button>
                </form>

                <p className="text-center text-xs text-foreground/25 mt-6">
                  By continuing you agree to our Terms of Service
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}

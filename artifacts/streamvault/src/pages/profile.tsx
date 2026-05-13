import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { ChevronLeft, Camera, Check, Loader2, Crown, Shield, Zap, Lock, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const PLAN_META: Record<string, { label: string; color: string; Icon: typeof Crown }> = {
  free:    { label: "Free",    color: "text-foreground/50",  Icon: Zap },
  basic:   { label: "Basic",   color: "text-sky-400",        Icon: Shield },
  premium: { label: "Premium", color: "text-amber-400",      Icon: Crown },
};

export default function Profile() {
  const [, navigate] = useLocation();
  const { user, updateUser, changePassword } = useAuth();

  const [name, setName] = useState(user?.name ?? "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? "");
  const [avatarInput, setAvatarInput] = useState("");
  const [showAvatarInput, setShowAvatarInput] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [changingPass, setChangingPass] = useState(false);
  const [passChanged, setPassChanged] = useState(false);
  const [passError, setPassError] = useState<string | null>(null);

  if (!user) {
    navigate("/auth");
    return null;
  }

  const isAdmin = user.role === "admin";
  const planKey = user.plan ?? "free";
  const planMeta = PLAN_META[planKey] ?? PLAN_META.free;
  const PlanIcon = isAdmin ? ShieldCheck : planMeta.Icon;

  const initials = (user.name ?? user.email).slice(0, 2).toUpperCase();

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await updateUser({ name: name.trim() || undefined, avatarUrl: avatarUrl || null });
      setSaved(true);
      setTimeout(() => setSaved(false), 2200);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleApplyAvatar = () => {
    setAvatarUrl(avatarInput.trim());
    setShowAvatarInput(false);
    setAvatarInput("");
  };

  const handleChangePassword = async () => {
    setPassError(null);
    if (!currentPass || !newPass || !confirmPass) {
      setPassError("All fields are required");
      return;
    }
    if (newPass.length < 6) {
      setPassError("New password must be at least 6 characters");
      return;
    }
    if (newPass !== confirmPass) {
      setPassError("New passwords do not match");
      return;
    }
    setChangingPass(true);
    try {
      await changePassword(currentPass, newPass);
      setPassChanged(true);
      setCurrentPass("");
      setNewPass("");
      setConfirmPass("");
      setTimeout(() => {
        setPassChanged(false);
        setShowChangePassword(false);
      }, 2500);
    } catch (e) {
      setPassError(e instanceof Error ? e.message : "Failed to change password");
    } finally {
      setChangingPass(false);
    }
  };

  const isDirty = name !== (user.name ?? "") || avatarUrl !== (user.avatarUrl ?? "");

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto px-5 pt-14 pb-28">

        {/* Back */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => navigate("/settings")}
          className="flex items-center gap-1 text-foreground/40 hover:text-foreground/70 transition-colors mb-10 -ml-1 self-start"
        >
          <ChevronLeft className="w-4 h-4" strokeWidth={1.75} />
          <span className="text-[13px]">Back</span>
        </motion.button>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22 }}
          className="text-[26px] font-bold text-foreground tracking-tight mb-8"
        >
          My Profile
        </motion.h1>

        {/* Avatar */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, delay: 0.05 }}
          className="flex flex-col items-center mb-8"
        >
          <div className="relative">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover border-2 border-foreground/10"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-foreground/10 flex items-center justify-center border-2 border-foreground/10">
                <span className="text-3xl font-bold text-foreground/60">{initials}</span>
              </div>
            )}
            <button
              onClick={() => setShowAvatarInput(v => !v)}
              className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center shadow-md hover:opacity-90 transition-all active:scale-95"
            >
              <Camera className="w-3.5 h-3.5" strokeWidth={2} />
            </button>
          </div>

          {showAvatarInput && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 w-full flex gap-2"
            >
              <input
                type="url"
                placeholder="Paste image URL..."
                value={avatarInput}
                onChange={e => setAvatarInput(e.target.value)}
                className="flex-1 h-10 px-3 rounded-xl bg-foreground/[0.06] border border-foreground/10 text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-foreground/25 transition-all"
                autoFocus
              />
              <button
                onClick={handleApplyAvatar}
                disabled={!avatarInput.trim()}
                className="h-10 px-4 rounded-xl bg-foreground text-background text-sm font-medium disabled:opacity-40 hover:opacity-90 transition-all active:scale-95"
              >
                Apply
              </button>
            </motion.div>
          )}
          {avatarUrl && (
            <button
              onClick={() => { setAvatarUrl(""); setAvatarInput(""); setShowAvatarInput(false); }}
              className="mt-2 text-[12px] text-foreground/30 hover:text-foreground/60 transition-colors"
            >
              Remove photo
            </button>
          )}
        </motion.div>

        {/* Fields */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, delay: 0.1 }}
          className="space-y-5 mb-8"
        >
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-widest text-foreground/35 mb-2">
              Display Name
            </label>
            <input
              ref={nameRef}
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Your name"
              className="w-full h-12 px-4 rounded-2xl bg-foreground/[0.05] border border-foreground/[0.08] text-[15px] text-foreground placeholder:text-foreground/25 focus:outline-none focus:border-foreground/20 focus:bg-foreground/[0.08] transition-all"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-widest text-foreground/35 mb-2">
              Email
            </label>
            <div className="w-full h-12 px-4 rounded-2xl bg-foreground/[0.03] border border-foreground/[0.06] text-[15px] text-foreground/40 flex items-center select-none">
              {user.email}
            </div>
          </div>
        </motion.div>

        {/* Plan / Admin badge */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, delay: 0.15 }}
          className={`rounded-2xl border px-4 py-4 mb-6 flex items-center gap-3 ${
            isAdmin
              ? "border-violet-500/25 bg-violet-500/[0.06]"
              : "border-foreground/[0.08] bg-foreground/[0.03]"
          }`}
        >
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
            isAdmin ? "bg-violet-500/15" : "bg-foreground/[0.06]"
          }`}>
            <PlanIcon className={`w-4 h-4 ${isAdmin ? "text-violet-400" : planMeta.color}`} strokeWidth={1.6} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-foreground/35">
              {isAdmin ? "Access Level" : "Current Plan"}
            </p>
            <p className={`text-[15px] font-semibold mt-0.5 ${isAdmin ? "text-violet-400" : planMeta.color}`}>
              {isAdmin ? "Administrator" : planMeta.label}
            </p>
          </div>
          {!isAdmin && (
            <button
              onClick={() => navigate("/subscribe")}
              className="text-[12px] font-semibold text-foreground/40 hover:text-foreground/70 transition-colors px-3 py-1.5 rounded-lg hover:bg-foreground/[0.05]"
            >
              {planKey === "free" ? "Upgrade" : "Change"}
            </button>
          )}
          {isAdmin && (
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-violet-500/15 text-violet-400 border border-violet-500/20">
              Full Access
            </span>
          )}
        </motion.div>

        {/* Change Password section */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, delay: 0.18 }}
          className="mb-6"
        >
          <button
            onClick={() => { setShowChangePassword(v => !v); setPassError(null); }}
            className="w-full flex items-center gap-3 rounded-2xl border border-foreground/[0.08] bg-foreground/[0.03] px-4 py-4 hover:bg-foreground/[0.06] transition-colors text-left"
          >
            <div className="w-9 h-9 rounded-xl bg-foreground/[0.06] flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4 text-foreground/50" strokeWidth={1.6} />
            </div>
            <div className="flex-1">
              <p className="text-[15px] font-medium text-foreground">Change Password</p>
              <p className="text-[11px] text-foreground/35 mt-0.5">Update your account password</p>
            </div>
            <motion.div
              animate={{ rotate: showChangePassword ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="text-foreground/20"
            >
              <ChevronLeft className="w-4 h-4 rotate-[-90deg]" />
            </motion.div>
          </button>

          <AnimatePresence>
            {showChangePassword && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="pt-4 space-y-3">
                  {/* Current password */}
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-widest text-foreground/35 mb-2">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPass ? "text" : "password"}
                        value={currentPass}
                        onChange={e => setCurrentPass(e.target.value)}
                        placeholder="Enter current password"
                        className="w-full h-12 px-4 pr-11 rounded-2xl bg-foreground/[0.05] border border-foreground/[0.08] text-[15px] text-foreground placeholder:text-foreground/25 focus:outline-none focus:border-foreground/20 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPass(v => !v)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/30 hover:text-foreground/60 transition-colors"
                      >
                        {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* New password */}
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-widest text-foreground/35 mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPass ? "text" : "password"}
                        value={newPass}
                        onChange={e => setNewPass(e.target.value)}
                        placeholder="Min. 6 characters"
                        className="w-full h-12 px-4 pr-11 rounded-2xl bg-foreground/[0.05] border border-foreground/[0.08] text-[15px] text-foreground placeholder:text-foreground/25 focus:outline-none focus:border-foreground/20 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPass(v => !v)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/30 hover:text-foreground/60 transition-colors"
                      >
                        {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm new password */}
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-widest text-foreground/35 mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={confirmPass}
                      onChange={e => setConfirmPass(e.target.value)}
                      placeholder="Repeat new password"
                      className="w-full h-12 px-4 rounded-2xl bg-foreground/[0.05] border border-foreground/[0.08] text-[15px] text-foreground placeholder:text-foreground/25 focus:outline-none focus:border-foreground/20 transition-all"
                    />
                  </div>

                  {passError && (
                    <p className="text-[13px] text-red-400 bg-red-500/10 rounded-xl px-4 py-3 border border-red-500/20">
                      {passError}
                    </p>
                  )}

                  <button
                    onClick={handleChangePassword}
                    disabled={changingPass || passChanged}
                    className="w-full py-3.5 rounded-2xl bg-foreground text-background text-[15px] font-semibold hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-40 flex items-center justify-center gap-2"
                  >
                    {changingPass ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : passChanged ? (
                      <><Check className="w-4 h-4" strokeWidth={2.5} /> Password Changed</>
                    ) : (
                      "Update Password"
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Error */}
        {error && (
          <p className="text-[13px] text-red-400 text-center mb-4">{error}</p>
        )}

        {/* Save button */}
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, delay: 0.2 }}
          onClick={handleSave}
          disabled={saving || !isDirty}
          className="w-full py-4 rounded-2xl bg-foreground text-background text-[15px] font-semibold hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-35 flex items-center justify-center gap-2"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : saved ? (
            <>
              <Check className="w-4 h-4" strokeWidth={2.5} />
              Saved
            </>
          ) : (
            "Save Changes"
          )}
        </motion.button>

      </div>
    </div>
  );
}

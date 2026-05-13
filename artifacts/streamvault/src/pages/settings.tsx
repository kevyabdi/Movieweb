import { motion } from "framer-motion";
import {
  ChevronRight, Home, Film, Tv, Users,
  Bookmark, Flame, LayoutGrid, Calendar,
  Send, LogOut, Crown, LogIn, UserPlus, Tag, ShieldCheck
} from "lucide-react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useCategories } from "@/context/CategoriesContext";

const NAV_ITEMS = [
  { label: "Home",        Icon: Home,        path: "/" },
  { label: "Movies",      Icon: Film,        path: "/movies" },
  { label: "TV Series",   Icon: Tv,          path: "/tv-series" },
  { label: "Actors",      Icon: Users,       path: "/actors" },
  { label: "My List",     Icon: Bookmark,    path: "/my-list" },
  { label: "Most Viewed", Icon: Flame,       path: "/category/top-rated" },
  { label: "Genres",      Icon: LayoutGrid,  path: "/search" },
  { label: "Year",        Icon: Calendar,    path: "/year" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
};

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.055, delayChildren: 0.05 } },
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-widest text-foreground/30 mb-3">
      {children}
    </p>
  );
}

function Row({ children, last }: { children: React.ReactNode; last?: boolean }) {
  return (
    <div className={cn("flex items-center gap-4 py-3.5", !last && "border-b border-foreground/[0.06]")}>
      {children}
    </div>
  );
}

export default function Settings() {
  const [, navigate] = useLocation();
  const { user, logout } = useAuth();
  const { categories } = useCategories();
  const isAdmin = user?.role === "admin";

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-background">

      {/* ── MOBILE layout (< lg) ── */}
      <div className="lg:hidden max-w-md mx-auto px-6 pt-6 pb-32">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="text-[28px] font-bold text-foreground tracking-tight mb-6"
        >
          More
        </motion.h1>

        {/* User card */}
        {user ? (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.04, ease: [0.22, 1, 0.36, 1] }}
            onClick={() => navigate("/profile")}
            className="w-full flex items-center gap-3 rounded-2xl border border-foreground/[0.08] bg-foreground/[0.03] px-4 py-3.5 mb-5 hover:bg-foreground/[0.06] transition-colors text-left"
          >
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-foreground/10 flex items-center justify-center shrink-0">
                <span className="text-sm font-bold text-foreground/70">
                  {(user.name ?? user.email)[0].toUpperCase()}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-foreground truncate">{user.name ?? user.email}</p>
              <p className="text-[11px] text-foreground/40 truncate">{user.plan ? `${user.plan.charAt(0).toUpperCase()}${user.plan.slice(1)} Plan · ` : ""}{user.email}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-foreground/20 shrink-0" />
          </motion.button>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.04, ease: [0.22, 1, 0.36, 1] }}
            className="flex gap-2 mb-5"
          >
            <button
              onClick={() => navigate("/auth")}
              className="flex-1 flex items-center justify-center gap-2 rounded-2xl border border-foreground/[0.1] bg-foreground/[0.04] py-3 text-sm font-medium text-foreground hover:bg-foreground/[0.08] transition-colors"
            >
              <LogIn className="w-4 h-4" />
              Sign In
            </button>
            <button
              onClick={() => navigate("/auth")}
              className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-foreground py-3 text-sm font-medium text-background hover:opacity-90 transition-all"
            >
              <UserPlus className="w-4 h-4" />
              Register
            </button>
          </motion.div>
        )}

        {isAdmin ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-2 mb-5"
          >
            <div className="w-full rounded-3xl relative border border-violet-500/[0.2] bg-gradient-to-r from-violet-500/[0.08] to-violet-400/[0.03]">
              <div className="absolute -top-3 -right-3 w-20 h-20 rounded-full bg-violet-400/10 blur-2xl pointer-events-none" />
              <div className="relative flex items-center gap-3 px-3.5 py-3">
                <div className="w-7 h-7 rounded-xl bg-violet-500/20 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-3.5 h-3.5 text-violet-400" strokeWidth={1.6} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-foreground leading-none">Admin Access</p>
                  <p className="text-[10px] text-foreground/45 mt-0.5">Full premium access · All content</p>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-violet-500/20 text-violet-400 border border-violet-500/20 shrink-0">
                  Active
                </span>
              </div>
            </div>
            <button
              onClick={() => { window.location.href = "/admin/"; }}
              className="w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl border border-violet-500/30 bg-violet-500/10 hover:bg-violet-500/15 transition-colors"
            >
              <div className="w-7 h-7 rounded-xl bg-violet-500/20 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-3.5 h-3.5 text-violet-400" strokeWidth={1.6} />
              </div>
              <span className="flex-1 text-[13px] font-semibold text-violet-300 text-left">Admin Panel</span>
              <ChevronRight className="w-4 h-4 text-violet-400/50 shrink-0" />
            </button>
          </motion.div>
        ) : (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
            onClick={() => navigate("/subscribe")}
            whileHover={{ scale: 1.012 }}
            whileTap={{ scale: 0.97 }}
            className="w-full text-left rounded-3xl overflow-hidden mb-5 relative border border-amber-400/[0.15] bg-gradient-to-r from-amber-500/[0.08] to-amber-400/[0.04]"
          >
            <div className="absolute -top-3 -right-3 w-20 h-20 rounded-full bg-amber-400/10 blur-2xl pointer-events-none" />
            <div className="relative flex items-center gap-3 px-3.5 py-3">
              <div className="w-7 h-7 rounded-xl bg-amber-400/20 flex items-center justify-center shrink-0">
                <Crown className="w-3.5 h-3.5 text-amber-500" strokeWidth={1.6} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-foreground leading-none">Subscribe Now</p>
                <p className="text-[10px] text-foreground/45 mt-0.5">Movies, series &amp; more — ad free</p>
              </div>
              <div className="inline-flex items-center gap-0.5 bg-amber-400 rounded-full px-2.5 py-1 shrink-0">
                <span className="text-[10px] font-bold text-black">Plans</span>
                <ChevronRight className="w-2.5 h-2.5 text-black/60" strokeWidth={2.5} />
              </div>
            </div>
          </motion.button>
        )}

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
        >
          <SectionLabel>Browse</SectionLabel>
          <motion.div variants={container} initial="hidden" animate="show">
            {NAV_ITEMS.map((item, i) => (
              <motion.button
                key={item.label}
                variants={fadeUp}
                onClick={() => navigate(item.path)}
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
                className="w-full text-left"
              >
                <Row last={i === NAV_ITEMS.length - 1 && categories.length === 0}>
                  <item.Icon className="w-5 h-5 text-foreground/50 shrink-0" strokeWidth={1.6} />
                  <span className="flex-1 text-[15px] text-foreground">{item.label}</span>
                  <ChevronRight className="w-4 h-4 text-foreground/20 shrink-0" />
                </Row>
              </motion.button>
            ))}
            {isAdmin && categories.map((cat, i) => (
              <motion.button
                key={cat.id}
                variants={fadeUp}
                onClick={() => navigate(`/category/${cat.slug}`)}
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
                className="w-full text-left"
              >
                <Row last={i === categories.length - 1}>
                  <Tag className="w-5 h-5 text-foreground/50 shrink-0" strokeWidth={1.6} />
                  <span className="flex-1 text-[15px] text-foreground">{cat.name}</span>
                  <ChevronRight className="w-4 h-4 text-foreground/20 shrink-0" />
                </Row>
              </motion.button>
            ))}
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.33, ease: [0.22, 1, 0.36, 1] }}
          className="mt-8"
        >
          <motion.a
            href="https://t.me/fpflims"
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ x: 2 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-4 py-3 border-b border-foreground/[0.06]"
          >
            <Send className="w-5 h-5 text-foreground/50 shrink-0" strokeWidth={1.6} />
            <span className="flex-1 text-[15px] text-foreground">Join Telegram</span>
            <span className="text-[12px] text-foreground/30">@fpflims</span>
            <ChevronRight className="w-4 h-4 text-foreground/20 shrink-0" />
          </motion.a>
        </motion.div>

        {user && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.36, ease: [0.22, 1, 0.36, 1] }}
            className="mt-8"
          >
            <motion.button
              onClick={handleLogout}
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-4 w-full py-3.5"
            >
              <LogOut className="w-5 h-5 text-red-400/80 shrink-0" strokeWidth={1.6} />
              <span className="flex-1 text-[15px] text-red-400 text-left">Sign Out</span>
            </motion.button>
          </motion.div>
        )}
      </div>

      {/* ── DESKTOP layout (≥ lg) ── */}
      <div className="hidden lg:block max-w-5xl mx-auto px-10 pt-10 pb-20">

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="text-3xl font-bold text-foreground tracking-tight mb-8"
        >
          More
        </motion.h1>

        {/* User card desktop */}
        {user ? (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.04 }}
            onClick={() => navigate("/profile")}
            className="w-full flex items-center gap-4 rounded-2xl border border-foreground/[0.08] bg-foreground/[0.03] px-6 py-4 mb-8 hover:bg-foreground/[0.06] transition-colors text-left"
          >
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="w-11 h-11 rounded-full object-cover shrink-0" />
            ) : (
              <div className="w-11 h-11 rounded-full bg-foreground/10 flex items-center justify-center shrink-0">
                <span className="text-base font-bold text-foreground/70">
                  {(user.name ?? user.email)[0].toUpperCase()}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">{user.name ?? user.email}</p>
              <p className="text-xs text-foreground/40">{user.plan ? `${user.plan.charAt(0).toUpperCase()}${user.plan.slice(1)} Plan · ` : ""}{user.email}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-foreground/20 shrink-0" />
          </motion.button>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.04 }}
            className="flex gap-3 mb-8"
          >
            <button
              onClick={() => navigate("/auth")}
              className="flex items-center gap-2 rounded-2xl border border-foreground/[0.1] bg-foreground/[0.04] px-6 py-3 text-sm font-medium text-foreground hover:bg-foreground/[0.08] transition-colors"
            >
              <LogIn className="w-4 h-4" />
              Sign In
            </button>
            <button
              onClick={() => navigate("/auth")}
              className="flex items-center gap-2 rounded-2xl bg-foreground px-6 py-3 text-sm font-medium text-background hover:opacity-90 transition-all"
            >
              <UserPlus className="w-4 h-4" />
              Create Account
            </button>
          </motion.div>
        )}

        {isAdmin ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
            className="flex gap-4 mb-10"
          >
            <div className="flex-1 rounded-2xl relative border border-violet-500/20 bg-gradient-to-r from-violet-500/10 via-violet-400/5 to-transparent">
              <div className="absolute -top-6 -right-6 w-48 h-48 rounded-full bg-violet-400/10 blur-3xl pointer-events-none" />
              <div className="relative flex items-center gap-5 px-6 py-5">
                <div className="w-12 h-12 rounded-2xl bg-violet-500/20 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-6 h-6 text-violet-400" strokeWidth={1.6} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-lg font-semibold text-foreground leading-none">Admin Access</p>
                  <p className="text-sm text-foreground/50 mt-1">Full premium access to all content — no restrictions</p>
                </div>
                <span className="text-sm font-bold uppercase tracking-wider px-5 py-2 rounded-full bg-violet-500/20 text-violet-400 border border-violet-500/20 shrink-0">
                  Active
                </span>
              </div>
            </div>
            <button
              onClick={() => { window.location.href = "/admin/"; }}
              className="flex items-center gap-3 px-6 py-5 rounded-2xl border border-violet-500/30 bg-violet-500/10 hover:bg-violet-500/15 transition-colors shrink-0"
            >
              <ShieldCheck className="w-5 h-5 text-violet-400" strokeWidth={1.6} />
              <span className="text-sm font-semibold text-violet-300 whitespace-nowrap">Admin Panel</span>
              <ChevronRight className="w-4 h-4 text-violet-400/50" />
            </button>
          </motion.div>
        ) : (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
            onClick={() => navigate("/subscribe")}
            whileHover={{ scale: 1.008 }}
            whileTap={{ scale: 0.98 }}
            className="w-full text-left rounded-2xl overflow-hidden mb-10 relative border border-amber-400/20 bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-transparent"
          >
            <div className="absolute -top-6 -right-6 w-48 h-48 rounded-full bg-amber-400/10 blur-3xl pointer-events-none" />
            <div className="relative flex items-center gap-5 px-6 py-5">
              <div className="w-12 h-12 rounded-2xl bg-amber-400/20 flex items-center justify-center shrink-0">
                <Crown className="w-6 h-6 text-amber-400" strokeWidth={1.6} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-lg font-semibold text-foreground leading-none">Subscribe Now</p>
                <p className="text-sm text-foreground/50 mt-1">Unlock all movies, series &amp; more — completely ad free</p>
              </div>
              <div className="inline-flex items-center gap-1 bg-amber-400 rounded-full px-5 py-2 shrink-0">
                <span className="text-sm font-bold text-black">View Plans</span>
                <ChevronRight className="w-4 h-4 text-black/60" strokeWidth={2.5} />
              </div>
            </div>
          </motion.button>
        )}

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.14, ease: [0.22, 1, 0.36, 1] }}
          className="mb-10"
        >
          <SectionLabel>Browse</SectionLabel>
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-4 gap-4"
          >
            {NAV_ITEMS.map((item) => (
              <motion.button
                key={item.label}
                variants={fadeUp}
                onClick={() => navigate(item.path)}
                whileHover={{ y: -3, scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="flex flex-col items-center gap-3 rounded-2xl border border-foreground/[0.07] bg-foreground/[0.03] hover:bg-foreground/[0.06] hover:border-foreground/[0.12] transition-colors duration-200 py-8 px-4"
              >
                <div className="w-12 h-12 rounded-xl bg-foreground/[0.07] flex items-center justify-center">
                  <item.Icon className="w-6 h-6 text-foreground/60" strokeWidth={1.5} />
                </div>
                <span className="text-sm font-medium text-foreground/80">{item.label}</span>
              </motion.button>
            ))}
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center gap-4"
        >
          <motion.a
            href="https://t.me/fpflims"
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ y: -2, scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-3 rounded-2xl border border-foreground/[0.07] bg-foreground/[0.03] hover:bg-foreground/[0.06] hover:border-foreground/[0.12] transition-colors duration-200 px-6 py-4"
          >
            <Send className="w-5 h-5 text-foreground/50 shrink-0" strokeWidth={1.6} />
            <span className="text-sm font-medium text-foreground">Join Telegram</span>
            <span className="text-xs text-foreground/35 ml-1">@fpflims</span>
          </motion.a>

          {user && (
            <motion.button
              onClick={handleLogout}
              whileHover={{ y: -2, scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-3 rounded-2xl border border-red-400/20 bg-red-400/[0.04] hover:bg-red-400/[0.08] hover:border-red-400/30 transition-colors duration-200 px-6 py-4"
            >
              <LogOut className="w-5 h-5 text-red-400/80 shrink-0" strokeWidth={1.6} />
              <span className="text-sm font-medium text-red-400">Sign Out</span>
            </motion.button>
          )}
        </motion.div>

      </div>
    </div>
  );
}

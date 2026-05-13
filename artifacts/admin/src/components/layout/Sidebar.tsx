import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, Film, Tv, Tags, X, Clapperboard, LogOut,
  Users, ImageIcon, Crown, Download, BarChart3, Shield
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAdminAuth } from "@/context/AuthContext";

const sections = [
  {
    label: "Overview",
    items: [
      { name: "Dashboard",   href: "/",           icon: LayoutDashboard },
      { name: "Analytics",   href: "/analytics",  icon: BarChart3 },
    ],
  },
  {
    label: "Content",
    items: [
      { name: "Movies",      href: "/movies",      icon: Film },
      { name: "TV Series",   href: "/series",      icon: Tv },
      { name: "Categories",  href: "/categories",  icon: Tags },
    ],
  },
  {
    label: "Website",
    items: [
      { name: "Banners",     href: "/banners",     icon: ImageIcon },
      { name: "Plans",       href: "/plans",       icon: Crown },
    ],
  },
  {
    label: "Tools",
    items: [
      { name: "TMDB Import", href: "/import",      icon: Download },
      { name: "Users",       href: "/users",       icon: Users },
    ],
  },
  {
    label: "Settings",
    items: [
      { name: "Settings",    href: "/settings", icon: Shield },
    ],
  },
];

interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const [location] = useLocation();
  const { user, logout } = useAdminAuth();

  return (
    <div className="flex h-full w-60 flex-col bg-sidebar border-r border-sidebar-border">
      {/* Logo */}
      <div className="flex h-16 flex-shrink-0 items-center justify-between px-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-700 shadow-sm shadow-violet-900/40">
            <Clapperboard className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-semibold tracking-tight text-sidebar-foreground">
            Fiirso <span className="text-violet-400">Admin</span>
          </span>
        </div>
        <button
          onClick={onClose}
          className="flex items-center justify-center rounded-lg p-1.5 text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors md:hidden"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 pb-4 overflow-y-auto space-y-5">
        {sections.map(section => (
          <div key={section.label}>
            <p className="px-1 mb-1 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/30">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map(item => {
                const isActive =
                  location === item.href ||
                  (item.href !== "/" && location.startsWith(item.href));
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
                      isActive
                        ? "bg-primary/15 text-primary"
                        : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                    )}
                  >
                    <item.icon className={cn("h-4 w-4 flex-shrink-0", isActive && "text-primary")} />
                    {item.name}
                    {isActive && (
                      <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="flex-shrink-0 border-t border-sidebar-border px-4 py-4 space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-xs font-bold text-primary">
              {(user?.name ?? user?.email ?? "A")[0].toUpperCase()}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-sidebar-foreground/80 truncate capitalize">
              {user?.name ?? user?.email ?? "Admin"}
            </p>
            <p className="text-[10px] text-sidebar-foreground/35 truncate">Content Manager</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-sidebar-foreground/50 hover:bg-red-500/10 hover:text-red-400 transition-all duration-150"
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          Sign Out
        </button>
      </div>
    </div>
  );
}

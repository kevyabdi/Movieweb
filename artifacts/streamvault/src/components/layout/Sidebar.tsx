import { Link, useLocation } from "wouter";
import { Search, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { path: "/",           label: "Home",      kind: "img" as const, src: "/home-icon.png" },
  { path: "/movies",    label: "Movies",    kind: "img" as const, src: "/movie-icon.png" },
  { path: "/tv-series", label: "TV Series", kind: "img" as const, src: "/tvseries-icon.png" },
  { path: "/search",    label: "Search",    kind: "svg" as const, Icon: Search },
  { path: "/settings",  label: "Settings",  kind: "svg" as const, Icon: Settings },
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 w-56 xl:w-64 bg-background border-r border-border z-50">

      {/* Logo */}
      <div className="px-6 pt-7 pb-6 shrink-0">
        <img src="/logo.png" alt="Fiirso" className="h-9 w-auto object-contain" />
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location === item.path;
          return (
            <Link key={item.path} href={item.path}>
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 cursor-pointer group",
                  isActive
                    ? "bg-foreground text-background"
                    : "text-foreground/50 hover:bg-foreground/[0.06] hover:text-foreground/80"
                )}
              >
                <div className="w-[18px] h-[18px] flex items-center justify-center shrink-0">
                  {item.kind === "img" ? (
                    <img
                      src={item.src}
                      alt={item.label}
                      className={cn(
                        "w-full h-full object-contain dark:invert",
                        isActive ? "brightness-0 invert" : ""
                      )}
                    />
                  ) : (
                    <item.Icon className="w-full h-full" />
                  )}
                </div>
                <span className="text-sm font-semibold">{item.label}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-background/60" />
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom: mini user card */}
      <div className="px-3 pb-6 shrink-0">
        <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-foreground/[0.04] border border-border">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
            A
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-foreground truncate">Alex Mercer</p>
            <p className="text-[10px] text-foreground/35 truncate">Premium · 4K</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

import { useLocation } from "wouter";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { path: "/",          label: "Home",      kind: "img" as const, src: "/home-icon.png" },
  { path: "/movies",   label: "Movies",    kind: "img" as const, src: "/movie-icon.png" },
  { path: "/tv-series",label: "TV Series", kind: "img" as const, src: "/tvseries-icon.png" },
  { path: "/search",   label: "Search",    kind: "svg" as const, Icon: Search },
  { path: "/settings", label: "More",      kind: "img" as const, src: "/more-icon.png" },
];

export function Navbar() {
  const [location, navigate] = useLocation();
  const isDetailPage = location.startsWith("/movie/");
  if (isDetailPage) return null;

  const handleTabClick = (path: string) => {
    if (location === path) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      navigate(path);
    }
  };

  return (
    <nav
      data-testid="bottom-nav"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/85 backdrop-blur-2xl border-t border-border"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-center justify-around px-2" style={{ height: 62 }}>
        {navItems.map((item) => {
          const isActive = location === item.path;
          return (
            <div
              key={item.path}
              onClick={() => handleTabClick(item.path)}
            >
              <div
                data-testid={`nav-${item.label.toLowerCase().replace(" ", "-")}`}
                className={cn(
                  "relative flex flex-col items-center gap-1 px-4 py-2 transition-all duration-200 cursor-pointer select-none",
                  isActive ? "text-foreground" : "text-foreground/55 hover:text-foreground/75"
                )}
              >
                {isActive && (
                  <div className="absolute -top-px left-1/2 -translate-x-1/2 w-5 h-0.5 bg-foreground rounded-full" />
                )}

                <div className="w-6 h-6 flex items-center justify-center">
                  {item.kind === "img" ? (
                    <img
                      src={item.src}
                      alt={item.label}
                      className={cn(
                        "w-6 h-6 object-contain transition-all duration-200 dark:invert",
                        isActive ? "opacity-100" : "opacity-40"
                      )}
                    />
                  ) : (
                    <item.Icon
                      className="w-6 h-6 transition-all duration-200"
                      strokeWidth={1.75}
                    />
                  )}
                </div>

                <span className={cn(
                  "text-[10px] font-medium tracking-wide transition-all",
                  isActive ? "text-foreground" : "text-foreground/40"
                )}>
                  {item.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </nav>
  );
}

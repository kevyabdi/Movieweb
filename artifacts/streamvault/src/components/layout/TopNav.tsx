import { useEffect, useState, useRef } from "react";
import { Link, useLocation } from "wouter";
import { Send, Search as SearchIcon, X, ChevronDown, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCategories } from "@/context/CategoriesContext";
import { useAuth } from "@/context/AuthContext";

const baseNavItems = [
  { path: "/",           label: "Home" },
  { path: "/movies",    label: "Movies" },
  { path: "/tv-series", label: "TV Series" },
];

const HIDE_NAV_PATHS = ["/actors", "/my-list", "/search", "/year"];

export function TopNav() {
  const [location, navigate] = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [query, setQuery] = useState("");
  const [catOpen, setCatOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const catRef = useRef<HTMLDivElement>(null);

  const { categories } = useCategories();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (catRef.current && !catRef.current.contains(e.target as Node)) {
        setCatOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (HIDE_NAV_PATHS.includes(location)) return null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/search");
    setQuery("");
    inputRef.current?.blur();
  };

  return (
    <header
      className={cn(
        "flex fixed top-0 left-0 right-0 z-50 h-14 lg:h-16 items-center px-4 lg:px-8 xl:px-14 border-b transition-all duration-300 ease-in-out",
        scrolled
          ? "translate-y-0 opacity-100 bg-background/90 backdrop-blur-xl border-border"
          : cn(
              "-translate-y-full opacity-0 bg-transparent border-transparent pointer-events-none",
              "lg:translate-y-0 lg:opacity-100 lg:bg-background/90 lg:backdrop-blur-xl lg:border-border lg:pointer-events-auto"
            )
      )}
    >
      {/* Logo */}
      <div className="shrink-0 lg:mr-8">
        <img
          src="/logo.png"
          alt="Fiirso"
          className="h-11 lg:h-11 w-auto object-contain dark:invert-0 invert"
        />
      </div>

      {/* Desktop nav */}
      <nav className="hidden lg:flex items-center gap-0.5">
        {baseNavItems.map((item) => {
          const isActive = location === item.path;
          return (
            <Link key={item.path} href={item.path}>
              <span
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150 cursor-pointer select-none",
                  isActive
                    ? "text-foreground bg-foreground/10"
                    : "text-foreground/50 hover:text-foreground/85 hover:bg-foreground/[0.05]"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* Categories dropdown — only shown if there are categories */}
        {categories.length > 0 && (
          <div className="relative" ref={catRef}>
            <button
              onClick={() => setCatOpen(o => !o)}
              className={cn(
                "flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150 select-none",
                catOpen
                  ? "text-foreground bg-foreground/10"
                  : "text-foreground/50 hover:text-foreground/85 hover:bg-foreground/[0.05]"
              )}
            >
              Browse
              <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-200", catOpen && "rotate-180")} />
            </button>
            {catOpen && (
              <div className="absolute top-full left-0 mt-1.5 min-w-[180px] bg-background/95 backdrop-blur-xl border border-border rounded-xl shadow-xl py-1.5 z-50">
                {categories.map(cat => (
                  <Link
                    key={cat.id}
                    href={`/category/${cat.slug}`}
                    onClick={() => setCatOpen(false)}
                  >
                    <span className={cn(
                      "block px-3.5 py-2 text-sm transition-colors cursor-pointer",
                      location === `/category/${cat.slug}`
                        ? "text-foreground font-semibold bg-foreground/[0.06]"
                        : "text-foreground/60 hover:text-foreground hover:bg-foreground/[0.04]"
                    )}>
                      {cat.name}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        <Link href="/settings">
          <span
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150 cursor-pointer select-none",
              location === "/settings"
                ? "text-foreground bg-foreground/10"
                : "text-foreground/50 hover:text-foreground/85 hover:bg-foreground/[0.05]"
            )}
          >
            More
          </span>
        </Link>
      </nav>

      {/* Right side */}
      <div className="ml-auto flex items-center gap-2">
        {/* Desktop Search Bar */}
        <form onSubmit={handleSearch} className="hidden lg:flex items-center">
          <div className="relative flex items-center group">
            <SearchIcon className="absolute left-3 w-[15px] h-[15px] text-foreground/40 pointer-events-none z-10" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search movies, series..."
              className="h-9 pl-9 pr-4 rounded-full bg-foreground/[0.07] border border-foreground/10 text-sm text-foreground placeholder:text-foreground/35 focus:outline-none focus:bg-foreground/[0.10] focus:border-foreground/20 transition-all duration-200 w-48 focus:w-60"
            />
            {query && (
              <button
                type="button"
                onClick={() => { setQuery(""); inputRef.current?.focus(); }}
                className="absolute right-3 text-foreground/40 hover:text-foreground/70 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </form>

        {/* Admin Panel button — only for admins */}
        {isAdmin && (
          <a
            href="/admin/"
            className="hidden lg:flex items-center gap-1.5 h-9 px-3.5 rounded-full bg-violet-500/15 border border-violet-500/25 text-violet-400 hover:bg-violet-500/25 transition-all text-sm font-semibold"
          >
            <ShieldCheck className="w-3.5 h-3.5" strokeWidth={1.75} />
            Admin
          </a>
        )}

        {/* Telegram */}
        <a
          href="https://t.me/fpflims"
          target="_blank"
          rel="noopener noreferrer"
          className="w-10 h-10 rounded-full flex items-center justify-center text-foreground/60 hover:text-foreground hover:bg-foreground/[0.08] transition-all"
          aria-label="Join Telegram"
        >
          <Send className="w-[18px] h-[18px]" strokeWidth={1.75} />
        </a>
      </div>
    </header>
  );
}

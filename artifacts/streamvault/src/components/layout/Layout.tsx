import { useEffect, useLayoutEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Navbar } from "./Navbar";
import { TopNav } from "./TopNav";
import { useTheme } from "@/context/ThemeContext";
import { ChevronUp, Twitter, Instagram, Youtube, Send } from "lucide-react";

const HIDE_NAV_PATHS = ["/category/", "/movie/"];
const HIDE_FOOTER_PATHS = ["/settings"];

const FOOTER_LINKS = [
  {
    heading: "Browse",
    links: [
      { label: "Home",      href: "/" },
      { label: "Movies",    href: "/movies" },
      { label: "TV Series", href: "/tv-series" },
    ],
  },
  {
    heading: "Genres",
    links: [
      { label: "Action & Thriller", href: "/category/action-thriller" },
      { label: "Drama",             href: "/category/drama" },
    ],
  },
  {
    heading: "Help",
    links: [
      { label: "FAQ",        href: "/settings" },
      { label: "Contact Us", href: "https://t.me/fpflims", external: true },
    ],
  },
];

function Footer() {
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <footer className="mt-8 border-t border-foreground/[0.07] bg-background select-none">

      {/* ── Main grid ── */}
      <div className="max-w-6xl mx-auto px-5 lg:px-12 pt-10 pb-6">

        {/* Brand row */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <p className="text-[20px] font-black text-foreground tracking-tight mb-1">FiirsoTV</p>
            <p className="text-[12px] text-foreground/35 font-medium">Your premium streaming destination</p>
          </div>
          <button
            onClick={scrollToTop}
            aria-label="Scroll to top"
            className="w-9 h-9 rounded-full bg-foreground/[0.07] hover:bg-foreground/[0.13] flex items-center justify-center transition-colors active:scale-95 shrink-0"
          >
            <ChevronUp className="w-4 h-4 text-foreground/50" />
          </button>
        </div>

        {/* Link columns */}
        <div className="grid grid-cols-3 gap-6 mb-10">
          {FOOTER_LINKS.map(col => (
            <div key={col.heading}>
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-foreground/30 mb-3">
                {col.heading}
              </p>
              <ul className="flex flex-col gap-2.5">
                {col.links.map(link => (
                  <li key={link.label}>
                    {"external" in link && link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[12px] text-foreground/50 hover:text-foreground transition-colors leading-none"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <a
                        href={link.href}
                        className="text-[12px] text-foreground/50 hover:text-foreground transition-colors leading-none"
                      >
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Social icons */}
        <div className="flex items-center gap-3 mb-6">
          <a
            href="https://t.me/fpflims"
            target="_blank"
            rel="noopener noreferrer"
            className="w-8 h-8 rounded-full bg-foreground/[0.07] hover:bg-foreground/[0.14] flex items-center justify-center transition-colors"
            aria-label="Telegram"
          >
            <Send className="w-3.5 h-3.5 text-foreground/50" />
          </a>
          <a
            href="#"
            className="w-8 h-8 rounded-full bg-foreground/[0.07] hover:bg-foreground/[0.14] flex items-center justify-center transition-colors"
            aria-label="Twitter"
          >
            <Twitter className="w-3.5 h-3.5 text-foreground/50" />
          </a>
          <a
            href="#"
            className="w-8 h-8 rounded-full bg-foreground/[0.07] hover:bg-foreground/[0.14] flex items-center justify-center transition-colors"
            aria-label="Instagram"
          >
            <Instagram className="w-3.5 h-3.5 text-foreground/50" />
          </a>
          <a
            href="#"
            className="w-8 h-8 rounded-full bg-foreground/[0.07] hover:bg-foreground/[0.14] flex items-center justify-center transition-colors"
            aria-label="YouTube"
          >
            <Youtube className="w-3.5 h-3.5 text-foreground/50" />
          </a>
        </div>

        {/* Divider */}
        <div className="border-t border-foreground/[0.07] mb-4" />

        {/* Bottom row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <p className="text-[11px] text-foreground/25 leading-relaxed">
            © {new Date().getFullYear()} FiirsoTV · All rights reserved · Made with{" "}
            <span className="text-red-400/70">♥</span> by{" "}
            <a
              href="https://t.me/fpflims"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground/40 hover:text-foreground/65 transition-colors underline underline-offset-2"
            >
              Viizet
            </a>
          </p>
          <p className="text-[10px] text-foreground/18 leading-relaxed max-w-xs sm:max-w-sm sm:text-right">
            This site does not store any files on its servers. All content is provided by non-affiliated third parties.
          </p>
        </div>
      </div>
    </footer>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const hideNav = HIDE_NAV_PATHS.some(prefix => location.startsWith(prefix));
  const hideFooter = HIDE_FOOTER_PATHS.some(prefix => location.startsWith(prefix));
  const { theme } = useTheme();

  const prevLocation = useRef(location);
  const scrollPositions = useRef<Record<string, number>>({});
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
  }, [theme]);

  // Disable browser-native scroll restoration so it doesn't fight our manual logic
  useEffect(() => {
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }
  }, []);

  useLayoutEffect(() => {
    if (prevLocation.current === location) return;

    // Save current scroll before leaving
    scrollPositions.current[prevLocation.current] = window.scrollY;
    prevLocation.current = location;

    const saved = location === "/" ? 0 : (scrollPositions.current[location] ?? 0);

    // Immediate scroll (before paint) — snaps position synchronously
    window.scrollTo({ top: saved, left: 0, behavior: "instant" });

    // Post-paint guard — overrides any browser restore or focus-jump that fires after render
    if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
    scrollTimerRef.current = setTimeout(() => {
      window.scrollTo({ top: saved, left: 0, behavior: "instant" });
    }, 0);

    return () => {
      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
    };
  }, [location]);

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      {!hideNav && <TopNav />}

      <main className={[
        !hideNav ? "pb-24 lg:pb-10 lg:pt-16" : "",
      ].join(" ")}>
        {children}
        {!hideNav && !hideFooter && <Footer />}
      </main>

      {!hideNav && <Navbar />}
    </div>
  );
}

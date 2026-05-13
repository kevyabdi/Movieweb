import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { Search, ArrowLeft } from "lucide-react";
import { allContent } from "@/data/content";
import { cn } from "@/lib/utils";

interface ActorEntry {
  name: string;
  avatarUrl: string;
  movieCount: number;
}

function buildActors(): ActorEntry[] {
  const map = new Map<string, { avatarUrl: string; count: number }>();
  for (const item of allContent) {
    for (const member of item.cast ?? []) {
      const existing = map.get(member.name);
      if (existing) {
        existing.count++;
      } else {
        map.set(member.name, { avatarUrl: member.avatarUrl, count: 1 });
      }
    }
  }
  return Array.from(map.entries())
    .map(([name, { avatarUrl, count }]) => ({ name, avatarUrl, movieCount: count }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export default function ActorsPage() {
  const [query, setQuery] = useState("");
  const [, navigate] = useLocation();
  const actors = useMemo(() => buildActors(), []);

  const filtered = query.trim()
    ? actors.filter(a => a.name.toLowerCase().includes(query.toLowerCase()))
    : actors;

  return (
    <div className="min-h-screen bg-background">

      {/* Sticky header */}
      <div className="sticky top-0 z-30 bg-background/90 backdrop-blur-md border-b border-border">
        <div className="flex items-center gap-3 px-5 lg:px-10 py-4 lg:py-5 max-w-screen-2xl mx-auto">
          <button
            onClick={() => window.history.back()}
            className="w-9 h-9 rounded-full bg-foreground/[0.07] hover:bg-foreground/[0.13] flex items-center justify-center transition-colors active:scale-90 shrink-0"
          >
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </button>
          <div>
            <h1 className="text-base lg:text-xl font-bold text-foreground leading-tight">Actors</h1>
          </div>
        </div>
      </div>

      <div className="max-w-md lg:max-w-5xl mx-auto px-5 lg:px-10 pt-6 lg:pt-8 pb-28">

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.05 }}
          className="relative mb-6 lg:max-w-md"
        >
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/35" strokeWidth={1.75} />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search actors..."
            className="w-full h-11 pl-10 pr-4 rounded-full bg-foreground/[0.08] text-[14px] text-foreground placeholder:text-foreground/35 outline-none focus:ring-1 focus:ring-foreground/20 transition-all"
          />
        </motion.div>

        {/* Actor list — single column on mobile, two columns on desktop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="lg:grid lg:grid-cols-2 lg:gap-x-8"
        >
          {filtered.map((actor, i) => (
            <motion.button
              key={actor.name}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: Math.min(i * 0.03, 0.4) }}
              onClick={() => navigate(`/actor/${encodeURIComponent(actor.name)}`)}
              className={cn(
                "w-full flex items-center gap-4 py-3.5 text-left transition-colors hover:bg-foreground/[0.04] rounded-xl px-2 -mx-2 border-b border-foreground/[0.06]"
              )}
            >
              {/* Avatar */}
              <div className="w-11 h-11 lg:w-12 lg:h-12 rounded-full overflow-hidden bg-foreground/10 shrink-0">
                <img
                  src={actor.avatarUrl}
                  alt={actor.name}
                  className="w-full h-full object-cover"
                  onError={e => {
                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(actor.name)}&background=555&color=fff&size=88`;
                  }}
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-medium text-foreground truncate">{actor.name}</p>
                <p className="text-[12px] text-foreground/40 mt-0.5">
                  {actor.movieCount} title{actor.movieCount !== 1 ? "s" : ""}
                </p>
              </div>

              {/* Chevron */}
              <svg className="w-4 h-4 text-foreground/20 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
              </svg>
            </motion.button>
          ))}

          {filtered.length === 0 && (
            <p className="text-center text-foreground/30 text-[14px] py-12 lg:col-span-2">No actors found</p>
          )}
        </motion.div>
      </div>
    </div>
  );
}

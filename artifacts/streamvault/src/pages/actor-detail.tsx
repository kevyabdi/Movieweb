import { useMemo } from "react";
import { motion } from "framer-motion";
import { useParams, useLocation } from "wouter";
import { ChevronLeft } from "lucide-react";
import { allContent } from "@/data/content";
import { MediaCard } from "@/components/ui/media-card";

export default function ActorDetail() {
  const { name: encodedName } = useParams<{ name: string }>();
  const [, navigate] = useLocation();
  const actorName = decodeURIComponent(encodedName ?? "");

  const goBack = () => {
    if (window.history.length > 1) window.history.back();
    else navigate("/");
  };

  const { titles, avatarUrl, roles } = useMemo(() => {
    const titles = allContent.filter(item =>
      item.cast?.some(c => c.name === actorName)
    );
    const member = allContent
      .flatMap(i => i.cast ?? [])
      .find(c => c.name === actorName);
    const roles = Object.fromEntries(
      titles.map(t => [t.id, t.cast?.find(c => c.name === actorName)?.role ?? ""])
    );
    return { titles, avatarUrl: member?.avatarUrl ?? "", roles };
  }, [actorName]);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl lg:max-w-5xl mx-auto px-5 lg:px-10 pt-6 lg:pt-8 pb-28">

        {/* Back */}
        <motion.button
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
          onClick={goBack}
          className="flex items-center gap-1 text-foreground/50 hover:text-foreground transition-colors mb-6 -ml-1"
        >
          <ChevronLeft className="w-5 h-5" strokeWidth={1.75} />
          <span className="text-[14px] font-medium">Actors</span>
        </motion.button>

        {/* Actor profile */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="flex items-center gap-5 mb-8"
        >
          <div className="w-20 h-20 rounded-full overflow-hidden bg-foreground/10 shrink-0 ring-2 ring-foreground/[0.08]">
            <img
              src={avatarUrl}
              alt={actorName}
              className="w-full h-full object-cover"
              onError={e => {
                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(actorName)}&background=555&color=fff&size=160`;
              }}
            />
          </div>
          <div>
            <h1 className="text-[24px] font-bold text-foreground tracking-tight">{actorName}</h1>
            <p className="text-[13px] text-foreground/40 mt-1">
              {titles.length} title{titles.length !== 1 ? "s" : ""} on Fiirso
            </p>
          </div>
        </motion.div>

        {/* Section label */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25, delay: 0.1 }}
          className="text-[11px] font-semibold uppercase tracking-widest text-foreground/30 mb-4"
        >
          Appearances
        </motion.p>

        {titles.length === 0 ? (
          <p className="text-foreground/30 text-[14px]">No titles found.</p>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.12 }}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
          >
            {titles.map((item, i) => (
              <div key={item.id}>
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: 0.12 + i * 0.04 }}
                >
                  <MediaCard item={item} />
                  <p className="text-[11px] text-foreground/40 mt-1.5 px-0.5 truncate">
                    as {roles[item.id]}
                  </p>
                </motion.div>
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}

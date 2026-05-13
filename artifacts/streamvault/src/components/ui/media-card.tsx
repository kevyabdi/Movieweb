import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { Play } from "lucide-react";
import { MediaItem } from "@/data/content";
import { cn } from "@/lib/utils";

interface MediaCardProps {
  item: MediaItem;
  showQuality?: boolean;
  onClick?: () => void;
}

const qualityColors: Record<string, string> = {
  "4K": "bg-white text-black",
  "HD": "bg-white/15 text-white/90 border border-white/25",
  "CAM": "bg-red-500/90 text-white",
};

export function MediaCard({ item, showQuality = false, onClick }: MediaCardProps) {
  const [, navigate] = useLocation();

  const showHD = showQuality && item.quality && !item.isNew;
  const showNew = item.isNew;

  return (
    <motion.div
      whileHover={{ scale: 1.06, y: -6 }}
      whileTap={{ scale: 0.96 }}
      transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
      onClick={() => onClick ? onClick() : navigate(`/movie/${item.id}`)}
      data-testid={`card-media-${item.id}`}
      className="group cursor-pointer w-full"
      style={{ transformOrigin: "bottom center" }}
    >
      <div className="relative w-full aspect-[2/3] rounded-2xl overflow-hidden bg-foreground/[0.06] shadow-md group-hover:shadow-[0_20px_60px_-10px_rgba(0,0,0,0.8)] transition-shadow duration-500">
        <img
          src={item.posterUrl}
          alt={item.title}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
          loading="lazy"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-[400ms] ease-out" />

        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-11 h-11 rounded-full bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100 transition-all duration-[350ms] ease-out shadow-lg">
            <Play className="w-4 h-4 text-white fill-white ml-0.5" />
          </div>
        </div>

        {/* Badge — top-left: NEW takes priority over HD */}
        {showNew && (
          <div className="absolute top-2 left-2">
            <span className="text-[8px] font-black tracking-widest uppercase px-1.5 py-0.5 rounded-md bg-emerald-500 text-white shadow-sm">
              NEW
            </span>
          </div>
        )}

        {showHD && item.quality && (
          <div className="absolute top-2 left-2">
            <span className={cn(
              "text-[8px] font-bold tracking-wide px-1.5 py-0.5 rounded-md backdrop-blur-sm",
              qualityColors[item.quality]
            )}>
              {item.quality}
            </span>
          </div>
        )}

        <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10 group-hover:ring-white/30 transition-all duration-[400ms] pointer-events-none" />
      </div>

      <div className="mt-2.5 px-0.5">
        <p className="text-xs font-semibold text-foreground/90 leading-tight line-clamp-1 group-hover:text-foreground transition-colors duration-200">{item.title}</p>
        <p className="text-[10px] text-foreground/40 mt-0.5 font-medium">{item.genre} · {item.year}</p>
      </div>
    </motion.div>
  );
}

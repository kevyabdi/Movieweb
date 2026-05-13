import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { Play } from "lucide-react";
import { MediaItem } from "@/data/content";

interface LandscapeCardProps {
  item: MediaItem;
  progress?: number;
}

export function LandscapeCard({ item, progress }: LandscapeCardProps) {
  const [, navigate] = useLocation();

  return (
    <motion.div
      whileHover={{ scale: 1.04, y: -4 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      onClick={() => navigate(`/movie/${item.id}`)}
      className="cursor-pointer shrink-0 w-[200px] md:w-[230px]"
    >
      <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-foreground/5 group shadow-md group-hover:shadow-[0_16px_40px_-8px_rgba(0,0,0,0.7)] transition-shadow duration-500">
        <img
          src={item.backdropUrl}
          alt={item.title}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-[400ms]" />

        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-9 h-9 rounded-full bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100 transition-all duration-[350ms] ease-out shadow-lg">
            <Play className="w-3.5 h-3.5 text-white fill-white ml-0.5" />
          </div>
        </div>

        {progress !== undefined && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10">
            <motion.div
              className="h-full bg-white/70 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            />
          </div>
        )}

        <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/8 group-hover:ring-white/25 transition-all duration-[400ms] pointer-events-none" />
      </div>

      <div className="mt-1.5 px-0.5">
        <p className="text-xs font-medium text-foreground/85 line-clamp-1 leading-tight group-hover:text-foreground transition-colors duration-200">{item.title}</p>
        <p className="text-[10px] text-foreground/35 mt-0.5">
          {progress !== undefined ? `${progress}% watched · ` : ""}{item.year}
        </p>
      </div>
    </motion.div>
  );
}

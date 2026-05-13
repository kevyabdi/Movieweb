import { motion, AnimatePresence } from "framer-motion";
import { Bookmark, Trash2, Film, Tv, Search, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { useMyList } from "@/context/MyListContext";
import { MediaCard } from "@/components/ui/media-card";

export default function MyListPage() {
  const { myList, removeFromList } = useMyList();
  const [, navigate] = useLocation();

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
      className="bg-background pb-28"
    >
      {/* Sticky header */}
      <div className="sticky top-0 z-30 bg-background/90 backdrop-blur-md border-b border-border">
        <div className="flex items-center gap-3 px-5 md:px-10 lg:px-12 py-4 lg:py-5 max-w-screen-2xl mx-auto">
          <button
            onClick={() => window.history.back()}
            className="w-9 h-9 rounded-full bg-foreground/[0.07] hover:bg-foreground/[0.13] flex items-center justify-center transition-colors active:scale-90 shrink-0"
          >
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </button>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Bookmark className="w-5 h-5 text-foreground/60 fill-foreground/10 shrink-0" />
            <div>
              <h1 className="text-base lg:text-xl font-bold text-foreground leading-tight">My List</h1>
              <p className="text-[10px] text-foreground/35 font-medium mt-0.5">
                {myList.length === 0
                  ? "Nothing saved yet"
                  : `${myList.length} title${myList.length !== 1 ? "s" : ""} saved`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Empty state */}
      {myList.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 px-8 text-center">
          <div className="w-20 h-20 rounded-full bg-foreground/[0.06] border border-border flex items-center justify-center mb-5">
            <Bookmark className="w-9 h-9 text-foreground/20" />
          </div>
          <p className="text-lg font-semibold text-foreground/40 mb-2">Your list is empty</p>
          <p className="text-sm text-foreground/25 mb-7 max-w-xs">
            Tap the <strong className="text-foreground/40">+</strong> button on any movie or series to save it here
          </p>
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 h-11 px-6 rounded-full bg-foreground text-background font-semibold text-sm transition-all hover:opacity-85 active:scale-95"
          >
            <Search className="w-4 h-4" />
            Browse titles
          </button>
        </div>
      )}

      {/* Grid */}
      {myList.length > 0 && (
        <div className="px-5 md:px-10 lg:px-12 pt-6">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-x-3.5 gap-y-7">
            <AnimatePresence initial={false}>
              {myList.map(item => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.88 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.88 }}
                  transition={{ duration: 0.22 }}
                  className="relative group"
                >
                  <MediaCard item={item} showQuality />

                  {/* Type pill */}
                  <div className="flex items-center gap-1 mt-1.5 px-0.5">
                    {item.type === "movie"
                      ? <Film className="w-2.5 h-2.5 text-foreground/30 shrink-0" />
                      : <Tv className="w-2.5 h-2.5 text-foreground/30 shrink-0" />
                    }
                    <span className="text-[10px] text-foreground/30 font-medium">
                      {item.type === "movie" ? "Movie" : "Series"}
                    </span>
                  </div>

                  {/* Remove button */}
                  <motion.button
                    whileTap={{ scale: 0.85 }}
                    onClick={e => { e.stopPropagation(); removeFromList(item.id); }}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  >
                    <Trash2 className="w-3 h-3 text-white/80" />
                  </motion.button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </motion.div>
  );
}

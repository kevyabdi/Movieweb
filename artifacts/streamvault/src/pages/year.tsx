import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { ArrowLeft, Calendar } from "lucide-react";
import { allContent } from "@/data/content";
import { MediaCard } from "@/components/ui/media-card";
import { cn } from "@/lib/utils";

const allYears = Array.from(new Set(allContent.map(m => m.year)))
  .sort((a, b) => parseInt(b) - parseInt(a));

export default function YearPage() {
  const [, navigate] = useLocation();
  const [selectedYear, setSelectedYear] = useState<string>(allYears[0]);

  const items = allContent
    .filter(m => m.year === selectedYear)
    .sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating));

  return (
    <div className="min-h-screen bg-background pb-28">

      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/90 backdrop-blur-md border-b border-border">
        <div className="px-5 lg:px-10 pt-4 pb-3 max-w-screen-2xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={() => window.history.back()}
              className="w-9 h-9 rounded-full bg-foreground/[0.07] hover:bg-foreground/[0.13] flex items-center justify-center transition-colors active:scale-90 shrink-0"
            >
              <ArrowLeft className="w-4 h-4 text-foreground" />
            </button>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-foreground/50" strokeWidth={1.6} />
              <h1 className="text-base lg:text-xl font-bold text-foreground leading-tight">Browse by Year</h1>
            </div>
          </div>

          {/* Year chips */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none -mx-5 px-5">
            {allYears.map(year => (
              <button
                key={year}
                onClick={() => setSelectedYear(year)}
                className={cn(
                  "shrink-0 h-8 px-4 rounded-full text-[13px] font-semibold transition-all duration-200",
                  selectedYear === year
                    ? "bg-foreground text-background"
                    : "bg-foreground/[0.07] text-foreground/55 hover:bg-foreground/[0.13] hover:text-foreground"
                )}
              >
                {year}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Count label */}
      <div className="px-5 lg:px-10 pt-4 pb-2 max-w-screen-2xl mx-auto">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-foreground/30">
          {items.length} title{items.length !== 1 ? "s" : ""} from {selectedYear}
        </p>
      </div>

      {/* Grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedYear}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          className="px-5 lg:px-10 max-w-screen-2xl mx-auto"
        >
          {items.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-x-3 lg:gap-x-4 gap-y-6 lg:gap-y-8">
              {items.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.03 }}
                >
                  <MediaCard item={item} showQuality />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <Calendar className="w-10 h-10 text-foreground/12 mb-3" strokeWidth={1.4} />
              <p className="text-sm text-foreground/35">No titles found for {selectedYear}</p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

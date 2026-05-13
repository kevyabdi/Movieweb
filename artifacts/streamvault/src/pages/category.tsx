import { useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useParams, useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
import { useContentLibrary } from "@/context/ContentLibraryContext";
import { MediaCard } from "@/components/ui/media-card";
import type { MediaItem } from "@/data/content";
import { useCategories } from "@/context/CategoriesContext";

interface CategoryDef {
  label: string;
  filter: (movies: MediaItem[], tvSeries: MediaItem[], allContent: MediaItem[]) => MediaItem[];
}

const STATIC_CATEGORY_DEFS: Record<string, CategoryDef> = {
  "featured-tonight": {
    label: "Featured Tonight",
    filter: (movies) => movies.slice(0, 12),
  },
  "top-rated": {
    label: "Top Rated",
    filter: (_, __, all) => [...all].sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating)),
  },
  "new-series": {
    label: "New Series",
    filter: (_, tvSeries) => tvSeries,
  },
  "action-thriller": {
    label: "Action & Thriller",
    filter: (_, __, all) => all.filter(m => m.genre === "Action" || m.genre === "Thriller"),
  },
  "action": {
    label: "Action",
    filter: (_, __, all) => all.filter(m => m.genre === "Action"),
  },
  "thriller": {
    label: "Thriller",
    filter: (_, __, all) => all.filter(m => m.genre === "Thriller"),
  },
  "drama": {
    label: "Drama",
    filter: (_, __, all) => all.filter(m => m.genre === "Drama"),
  },
  "american": {
    label: "American Movies",
    filter: (movies) => movies.filter(m => !["Korean", "Hindi", "Bollywood", "Indian", "British"].some(t => m.tags?.includes(t)) && m.director !== "Bong Joon-ho"),
  },
  "korean": {
    label: "Korean Movies & Series",
    filter: (movies, tvSeries) => [
      ...movies.filter(m => m.tags?.includes("Korean") || m.director === "Bong Joon-ho"),
      ...tvSeries.filter(s => s.tags?.includes("Korean")),
    ],
  },
  "hindi": {
    label: "Hindi Movies & Series",
    filter: (movies, tvSeries) => [
      ...movies.filter(m => m.tags?.some(t => ["Hindi", "Bollywood", "Indian"].includes(t))),
      ...tvSeries.filter(s => s.tags?.some(t => ["Hindi", "Bollywood", "Indian"].includes(t))),
    ],
  },
  "comedy": {
    label: "Comedy",
    filter: (_, __, all) => all.filter(m => m.genre === "Comedy"),
  },
  "sci-fi": {
    label: "Sci-Fi",
    filter: (_, __, all) => all.filter(m => m.genre === "Sci-Fi" || m.genre === "Science Fiction"),
  },
  "horror": {
    label: "Horror",
    filter: (_, __, all) => all.filter(m => m.genre === "Horror"),
  },
  "romance": {
    label: "Romance",
    filter: (_, __, all) => all.filter(m => m.genre === "Romance"),
  },
  "animation": {
    label: "Animation",
    filter: (_, __, all) => all.filter(m => m.genre === "Animation"),
  },
  "documentary": {
    label: "Documentary",
    filter: (_, __, all) => all.filter(m => m.genre === "Documentary"),
  },
  "crime": {
    label: "Crime",
    filter: (_, __, all) => all.filter(m => m.genre === "Crime"),
  },
  "fantasy": {
    label: "Fantasy",
    filter: (_, __, all) => all.filter(m => m.genre === "Fantasy"),
  },
  "adventure": {
    label: "Adventure",
    filter: (_, __, all) => all.filter(m => m.genre === "Adventure"),
  },
};

function slugToLabel(slug: string): string {
  return slug
    .split("-")
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function makeGenreFilter(genreLabel: string, slug: string): CategoryDef["filter"] {
  return (_, __, all) => {
    const normalizedLabel = genreLabel.toLowerCase();
    const normalizedSlug = slug.toLowerCase().replace(/-/g, " ");
    return all.filter(m => {
      const genre = (m.genre ?? "").toLowerCase();
      const tags = (m.tags ?? []).map(t => t.toLowerCase());
      return (
        genre === normalizedLabel ||
        genre.includes(normalizedLabel) ||
        genre === normalizedSlug ||
        genre.includes(normalizedSlug) ||
        tags.includes(normalizedLabel) ||
        tags.includes(normalizedSlug)
      );
    });
  };
}

export default function CategoryPage() {
  const params = useParams<{ slug: string }>();
  const [, navigate] = useLocation();
  const { movies, tvSeries, allContent } = useContentLibrary();
  const { categories } = useCategories();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [params.slug]);

  const slug = params.slug ?? "";

  const def = useMemo<CategoryDef | null>(() => {
    if (STATIC_CATEGORY_DEFS[slug]) return STATIC_CATEGORY_DEFS[slug];

    const dbCategory = categories.find(c => c.slug === slug);
    if (dbCategory) {
      return {
        label: dbCategory.name,
        filter: makeGenreFilter(dbCategory.name, slug),
      };
    }

    return null;
  }, [slug, categories]);

  const items = useMemo(() => {
    if (!def) return [];
    return def.filter(movies, tvSeries, allContent);
  }, [def, movies, tvSeries, allContent]);

  if (!def) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-foreground/40">Category not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-28 lg:pb-12">
      {/* Header */}
      <div className="sticky top-0 lg:top-16 z-30 bg-background/90 backdrop-blur-md border-b border-border">
        <div className="flex items-center gap-3 px-5 lg:px-12 py-4 lg:py-5 max-w-screen-2xl mx-auto">
          <button
            onClick={() => navigate("/")}
            className="w-9 h-9 rounded-full bg-foreground/[0.07] hover:bg-foreground/[0.13] flex items-center justify-center transition-colors active:scale-90 shrink-0"
          >
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </button>
          <div>
            <h1 className="text-base lg:text-xl font-bold text-foreground leading-tight">{def.label}</h1>
            <p className="text-[11px] text-foreground/35 font-medium mt-0.5">{items.length} titles</p>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="px-5 lg:px-12 pt-6">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-sm font-semibold text-foreground/35">No titles in this category yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-3 gap-y-6">
            {items.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: Math.min(i * 0.03, 0.45), ease: "easeOut" }}
              >
                <MediaCard item={item} showQuality />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

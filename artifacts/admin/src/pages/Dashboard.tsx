import { useGetStats, getGetStatsQueryKey, useListMovies, useListSeries } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Film, Tv, PlaySquare, Tags, TrendingUp, Star, Eye, Plus, ArrowRight, Users, ImageIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function Dashboard() {
  const { data: stats, isLoading } = useGetStats({
    query: { queryKey: getGetStatsQueryKey() }
  });

  const { data: recentMovies } = useListMovies({}, {
    query: { queryKey: ["movies-recent"] }
  });

  const { data: recentSeries } = useListSeries({}, {
    query: { queryKey: ["series-recent"] }
  });

  const latestMovies = recentMovies?.slice(0, 4) ?? [];
  const latestSeries = recentSeries?.slice(0, 3) ?? [];

  const statCards = [
    {
      title: "Total Movies",
      value: stats?.totalMovies ?? 0,
      subtitle: `${stats?.publishedMovies ?? 0} published`,
      icon: Film,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      title: "Total Series",
      value: stats?.totalSeries ?? 0,
      subtitle: `${stats?.publishedSeries ?? 0} published`,
      icon: Tv,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
    },
    {
      title: "Episodes",
      value: stats?.totalEpisodes ?? 0,
      subtitle: "Across all seasons",
      icon: PlaySquare,
      color: "text-green-400",
      bg: "bg-green-500/10",
    },
    {
      title: "Categories",
      value: stats?.totalCategories ?? 0,
      subtitle: "Content genres",
      icon: Tags,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
    },
    {
      title: "Users",
      value: (stats as (typeof stats & { totalUsers?: number }))?.totalUsers ?? 0,
      subtitle: "Registered viewers",
      icon: Users,
      color: "text-rose-400",
      bg: "bg-rose-500/10",
    },
  ];

  const publishRate = stats
    ? stats.totalMovies + stats.totalSeries > 0
      ? Math.round(((stats.publishedMovies + stats.publishedSeries) / (stats.totalMovies + stats.totalSeries)) * 100)
      : 0
    : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
        <p className="text-sm text-muted-foreground mt-1">Your content library at a glance</p>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="rounded-2xl border-card-border">
                <CardContent className="p-5">
                  <Skeleton className="h-8 w-8 rounded-xl mb-3" />
                  <Skeleton className="h-7 w-16 mb-1" />
                  <Skeleton className="h-3.5 w-24" />
                </CardContent>
              </Card>
            ))
          : statCards.map((stat, i) => (
              <Card key={i} className="rounded-2xl border-card-border" data-testid={`stat-card-${i}`}>
                <CardContent className="p-5">
                  <div className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${stat.bg} mb-3`}>
                    <stat.icon className={`h-4.5 w-4.5 ${stat.color}`} />
                  </div>
                  <div className="text-2xl font-bold tracking-tight">{stat.value}</div>
                  <p className="text-xs text-muted-foreground mt-0.5">{stat.subtitle}</p>
                  <p className="text-[11px] font-medium text-muted-foreground/60 mt-0.5">{stat.title}</p>
                </CardContent>
              </Card>
            ))}
      </div>

      {/* Secondary row */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Publish rate */}
        <Card className="rounded-2xl border-card-border">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium">Publish Rate</p>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-3xl font-bold">
              {isLoading ? <Skeleton className="h-9 w-16" /> : `${publishRate}%`}
            </div>
            <p className="text-xs text-muted-foreground mt-1">of all content is live</p>
            <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-700"
                style={{ width: `${publishRate}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Featured */}
        <Card className="rounded-2xl border-card-border">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium">Featured</p>
              <Star className="h-4 w-4 text-muted-foreground" />
            </div>
            {isLoading ? (
              <Skeleton className="h-9 w-16" />
            ) : (
              <div className="text-3xl font-bold">
                {(recentMovies?.filter(m => m.isFeatured).length ?? 0) +
                 (recentSeries?.filter(s => s.isFeatured).length ?? 0)}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">items on homepage hero</p>
          </CardContent>
        </Card>

        {/* Trending */}
        <Card className="rounded-2xl border-card-border">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium">Trending</p>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </div>
            {isLoading ? (
              <Skeleton className="h-9 w-16" />
            ) : (
              <div className="text-3xl font-bold">
                {(recentMovies?.filter(m => m.isTrending).length ?? 0) +
                 (recentSeries?.filter(s => s.isTrending).length ?? 0)}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">items in trending row</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-widest text-[11px]">
          Quick Actions
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Add Movie",         href: "/movies/new",  icon: Film,      color: "text-blue-400" },
            { label: "Add Series",        href: "/series/new",  icon: Tv,        color: "text-purple-400" },
            { label: "Manage Banners",    href: "/banners",     icon: ImageIcon,  color: "text-amber-400" },
            { label: "Manage Users",      href: "/users",       icon: Users,     color: "text-rose-400" },
          ].map((action) => (
            <Link key={action.href} href={action.href}>
              <button className="w-full flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3.5 text-sm font-medium hover:bg-accent hover:border-border/80 transition-all duration-150 text-left group">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted group-hover:bg-accent">
                  <action.icon className={`h-3.5 w-3.5 ${action.color}`} />
                </div>
                {action.label}
                <ArrowRight className="ml-auto h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
              </button>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent content */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Movies */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold">Recent Movies</h2>
            <Link href="/movies">
              <Button variant="ghost" size="sm" className="text-xs h-7 rounded-lg">
                View all <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </div>
          <Card className="rounded-2xl border-card-border overflow-hidden">
            {latestMovies.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Film className="h-8 w-8 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">No movies yet</p>
                <Link href="/movies/new">
                  <Button size="sm" className="mt-3 rounded-xl">
                    <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Movie
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {latestMovies.map((movie) => (
                  <div key={movie.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="h-10 w-7 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                      {movie.posterUrl ? (
                        <img src={movie.posterUrl} alt={movie.title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <Film className="h-3 w-3 text-muted-foreground/40" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{movie.title}</p>
                      <p className="text-xs text-muted-foreground">{movie.year} · {movie.genre}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {movie.isFeatured && (
                        <span className="text-[9px] font-bold uppercase tracking-widest text-amber-400 bg-amber-400/10 border border-amber-400/20 px-1.5 py-0.5 rounded-full">
                          ★ Featured
                        </span>
                      )}
                      {movie.isTrending && (
                        <span className="text-[9px] font-bold uppercase tracking-widest text-orange-400 bg-orange-400/10 border border-orange-400/20 px-1.5 py-0.5 rounded-full">
                          🔥 Trending
                        </span>
                      )}
                      <Badge
                        variant={movie.status === "published" ? "default" : "secondary"}
                        className="text-[10px] rounded-full px-2"
                      >
                        {movie.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Recent Series */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold">Recent Series</h2>
            <Link href="/series">
              <Button variant="ghost" size="sm" className="text-xs h-7 rounded-lg">
                View all <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </div>
          <Card className="rounded-2xl border-card-border overflow-hidden">
            {latestSeries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Tv className="h-8 w-8 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">No series yet</p>
                <Link href="/series/new">
                  <Button size="sm" className="mt-3 rounded-xl">
                    <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Series
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {latestSeries.map((series) => (
                  <div key={series.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="h-10 w-7 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                      {series.posterUrl ? (
                        <img src={series.posterUrl} alt={series.title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <Tv className="h-3 w-3 text-muted-foreground/40" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{series.title}</p>
                      <p className="text-xs text-muted-foreground">{series.year} · {series.genre}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {series.isFeatured && (
                        <span className="text-[9px] font-bold uppercase tracking-widest text-amber-400 bg-amber-400/10 border border-amber-400/20 px-1.5 py-0.5 rounded-full">
                          ★ Featured
                        </span>
                      )}
                      <Badge
                        variant={series.status === "published" ? "default" : "secondary"}
                        className="text-[10px] rounded-full px-2"
                      >
                        {series.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

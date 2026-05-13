import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";
import { Users, Film, Tv, TrendingUp, UserCheck, UserX, Crown } from "lucide-react";

interface OverviewData {
  users: {
    total: number;
    newThisWeek: number;
    active: number;
    banned: number;
    planBreakdown: Array<{ plan: string; count: number }>;
  };
  content: {
    totalMovies: number;
    publishedMovies: number;
    draftMovies: number;
    totalSeries: number;
    publishedSeries: number;
    draftSeries: number;
  };
}

interface SignupRow { date: string; count: number }
interface TimelineRow { date: string; movies: number; series: number }

const PLAN_COLORS: Record<string, string> = {
  free: "#6b7280",
  basic: "#3b82f6",
  premium: "#f59e0b",
};

const PIE_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

async function fetchOverview(): Promise<OverviewData> {
  const res = await fetch("/api/analytics/overview");
  if (!res.ok) throw new Error("Failed");
  return res.json() as Promise<OverviewData>;
}
async function fetchSignups(): Promise<SignupRow[]> {
  const res = await fetch("/api/analytics/signups");
  if (!res.ok) throw new Error("Failed");
  return res.json() as Promise<SignupRow[]>;
}
async function fetchTimeline(): Promise<TimelineRow[]> {
  const res = await fetch("/api/analytics/content-timeline");
  if (!res.ok) throw new Error("Failed");
  return res.json() as Promise<TimelineRow[]>;
}

function StatCard({ label, value, sub, icon: Icon, color, bg, isLoading }: {
  label: string; value: number | string; sub?: string;
  icon: React.ElementType; color: string; bg: string; isLoading: boolean;
}) {
  return (
    <Card className="rounded-2xl border-card-border">
      <CardContent className="p-5">
        <div className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${bg} mb-3`}>
          <Icon className={`h-4 w-4 ${color}`} />
        </div>
        {isLoading ? <Skeleton className="h-7 w-16 mb-1" /> : <div className="text-2xl font-bold">{value}</div>}
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
        <p className="text-[11px] font-medium text-muted-foreground/60 mt-0.5">{label}</p>
      </CardContent>
    </Card>
  );
}

const CustomTooltip = ({ active, payload, label }: {
  active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-popover p-3 shadow-xl text-xs">
      <p className="font-semibold text-foreground mb-1.5">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-muted-foreground capitalize">{p.name}:</span>
          <span className="font-semibold text-foreground">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function Analytics() {
  const { data: overview, isLoading: loadingOverview } = useQuery({ queryKey: ["analytics-overview"], queryFn: fetchOverview, refetchInterval: 30_000 });
  const { data: signups, isLoading: loadingSignups } = useQuery({ queryKey: ["analytics-signups"], queryFn: fetchSignups });
  const { data: timeline, isLoading: loadingTimeline } = useQuery({ queryKey: ["analytics-timeline"], queryFn: fetchTimeline });

  const publishRate = overview
    ? Math.round(
        ((overview.content.publishedMovies + overview.content.publishedSeries) /
          Math.max(1, overview.content.totalMovies + overview.content.totalSeries)) * 100
      )
    : 0;

  const contentPieData = overview
    ? [
        { name: "Movies Live",   value: overview.content.publishedMovies },
        { name: "Movies Draft",  value: overview.content.draftMovies },
        { name: "Series Live",   value: overview.content.publishedSeries },
        { name: "Series Draft",  value: overview.content.draftSeries },
      ].filter(d => d.value > 0)
    : [];

  const planPieData = (overview?.users.planBreakdown ?? []).map(p => ({
    name: p.plan.charAt(0).toUpperCase() + p.plan.slice(1),
    value: p.count,
    color: PLAN_COLORS[p.plan] ?? "#6b7280",
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">Platform performance at a glance</p>
      </div>

      {/* Top stat cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Users"     value={overview?.users.total ?? 0}       sub={`+${overview?.users.newThisWeek ?? 0} this week`} icon={Users}     color="text-blue-400"   bg="bg-blue-500/10"   isLoading={loadingOverview} />
        <StatCard label="Active Users"    value={overview?.users.active ?? 0}       sub={`${overview?.users.banned ?? 0} banned`}          icon={UserCheck} color="text-green-400"  bg="bg-green-500/10"  isLoading={loadingOverview} />
        <StatCard label="Published Content" value={(overview?.content.publishedMovies ?? 0) + (overview?.content.publishedSeries ?? 0)} sub={`${publishRate}% of library live`} icon={TrendingUp} color="text-purple-400" bg="bg-purple-500/10" isLoading={loadingOverview} />
        <StatCard label="Total Content"   value={(overview?.content.totalMovies ?? 0) + (overview?.content.totalSeries ?? 0)} sub={`${overview?.content.totalMovies ?? 0}M · ${overview?.content.totalSeries ?? 0}S`} icon={Film} color="text-amber-400" bg="bg-amber-500/10" isLoading={loadingOverview} />
      </div>

      {/* Charts row 1 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Signup trend */}
        <Card className="rounded-2xl border-card-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-400" /> User Signups Over Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingSignups ? (
              <Skeleton className="h-48 w-full rounded-xl" />
            ) : !signups?.length ? (
              <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
                No signup data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={signups}>
                  <defs>
                    <linearGradient id="signupGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.35)" }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "rgba(255,255,255,0.35)" }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="count" name="Signups" stroke="#3b82f6" strokeWidth={2} fill="url(#signupGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Content added over time */}
        <Card className="rounded-2xl border-card-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Film className="h-4 w-4 text-purple-400" /> Content Added Over Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingTimeline ? (
              <Skeleton className="h-48 w-full rounded-xl" />
            ) : !timeline?.length ? (
              <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
                No content data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={timeline}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.35)" }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "rgba(255,255,255,0.35)" }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }} />
                  <Bar dataKey="movies" name="Movies" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="series" name="Series" fill="#06b6d4" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts row 2 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Content status breakdown */}
        <Card className="rounded-2xl border-card-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Tv className="h-4 w-4 text-amber-400" /> Content Status Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingOverview ? (
              <Skeleton className="h-48 w-full rounded-xl" />
            ) : !contentPieData.length ? (
              <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">No content yet</div>
            ) : (
              <div className="flex items-center gap-6">
                <ResponsiveContainer width="55%" height={180}>
                  <PieChart>
                    <Pie data={contentPieData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value" paddingAngle={3}>
                      {contentPieData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {contentPieData.map((d, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                        <span className="text-muted-foreground">{d.name}</span>
                      </div>
                      <span className="font-semibold">{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Plan distribution */}
        <Card className="rounded-2xl border-card-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Crown className="h-4 w-4 text-amber-400" /> User Plan Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingOverview ? (
              <Skeleton className="h-48 w-full rounded-xl" />
            ) : !planPieData.length ? (
              <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">No users yet</div>
            ) : (
              <div className="flex items-center gap-6">
                <ResponsiveContainer width="55%" height={180}>
                  <PieChart>
                    <Pie data={planPieData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value" paddingAngle={3}>
                      {planPieData.map((d, i) => (
                        <Cell key={i} fill={d.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {planPieData.map((d, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
                        <span className="text-muted-foreground capitalize">{d.name}</span>
                      </div>
                      <span className="font-semibold">{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Status bars */}
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Movies Published", val: overview?.content.publishedMovies ?? 0, total: overview?.content.totalMovies ?? 0, color: "bg-blue-500" },
          { label: "Series Published", val: overview?.content.publishedSeries ?? 0, total: overview?.content.totalSeries ?? 0, color: "bg-purple-500" },
          { label: "Users Active", val: overview?.users.active ?? 0, total: overview?.users.total ?? 0, color: "bg-green-500" },
        ].map((item, i) => (
          <Card key={i} className="rounded-2xl border-card-border">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-sm font-bold">{item.total > 0 ? Math.round((item.val / item.total) * 100) : 0}%</p>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className={`h-full rounded-full ${item.color} transition-all duration-700`}
                  style={{ width: `${item.total > 0 ? (item.val / item.total) * 100 : 0}%` }} />
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">{item.val} of {item.total}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

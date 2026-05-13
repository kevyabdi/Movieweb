import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Eye, EyeOff, ImageIcon, Film, Tv } from "lucide-react";
import { TmdbSearch } from "@/components/TmdbSearch";
import { API_URL } from "@/lib/api-url";

const TOKEN_KEY = "fiirso_admin_token";

function adminFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = localStorage.getItem(TOKEN_KEY);
  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string> | undefined),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}

interface Banner {
  id: number;
  title: string;
  subtitle: string | null;
  imageUrl: string;
  linkUrl: string | null;
  buttonLabel: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
}

const emptyForm = { title: "", subtitle: "", imageUrl: "", linkUrl: "", buttonLabel: "Watch Now", sortOrder: 0 };

async function fetchBanners(): Promise<Banner[]> {
  const res = await fetch(`${API_URL}/api/banners`);
  if (!res.ok) throw new Error("Failed");
  return res.json() as Promise<Banner[]>;
}

export default function BannersList() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [tmdbType, setTmdbType] = useState<"movie" | "tv">("movie");

  const { data: banners, isLoading } = useQuery({ queryKey: ["banners"], queryFn: fetchBanners });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof form & { id?: number }) => {
      const { id, ...body } = data;
      const url = id ? `/api/banners/${id}` : "/api/banners";
      const method = id ? "PUT" : "POST";
      const res = await adminFetch(url, { method, body: JSON.stringify(body) });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(err.error || "Failed to save");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banners"] });
      toast({ title: editing ? "Banner updated" : "Banner created" });
      setOpen(false);
      setEditing(null);
      setForm(emptyForm);
    },
    onError: (err: Error) => toast({ title: err.message || "Failed to save banner", variant: "destructive" }),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: number) =>
      adminFetch(`/api/banners/${id}/toggle`, { method: "PATCH" }).then(r => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["banners"] }),
    onError: () => toast({ title: "Failed to toggle banner", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminFetch(`/api/banners/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banners"] });
      toast({ title: "Banner deleted" });
    },
    onError: () => toast({ title: "Failed to delete banner", variant: "destructive" }),
  });

  const openCreate = () => { setEditing(null); setForm(emptyForm); setTmdbType("movie"); setOpen(true); };
  const openEdit = (b: Banner) => {
    setEditing(b);
    setForm({ title: b.title, subtitle: b.subtitle ?? "", imageUrl: b.imageUrl, linkUrl: b.linkUrl ?? "", buttonLabel: b.buttonLabel ?? "Watch Now", sortOrder: b.sortOrder });
    setOpen(true);
  };

  const handleSave = () => {
    if (!form.title || !form.imageUrl) {
      toast({ title: "Title and Image URL are required", variant: "destructive" });
      return;
    }
    saveMutation.mutate({ ...form, id: editing?.id });
  };

  const handleTmdbSelect = (data: Partial<{
    title: string; year: string; genre: string; description: string;
    longDescription: string; posterUrl: string; backdropUrl: string;
    trailerUrl: string; director: string; rating: string;
  }>) => {
    setForm(f => ({
      ...f,
      title: data.title || f.title,
      subtitle: data.description ? data.description.slice(0, 120) : f.subtitle,
      imageUrl: data.backdropUrl || data.posterUrl || f.imageUrl,
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Banners</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage homepage hero banners</p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="mr-1.5 h-4 w-4" /> Add Banner
        </Button>
      </div>

      {/* List */}
      <div className="space-y-3">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="rounded-2xl border-card-border">
                <CardContent className="p-4 flex gap-4">
                  <Skeleton className="h-16 w-28 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </CardContent>
              </Card>
            ))
          : banners?.length === 0
          ? (
            <Card className="rounded-2xl border-card-border">
              <CardContent className="py-14 flex flex-col items-center text-center">
                <ImageIcon className="h-8 w-8 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">No banners yet</p>
                <Button size="sm" className="mt-3 rounded-xl" onClick={openCreate}>
                  <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Banner
                </Button>
              </CardContent>
            </Card>
          )
          : banners?.map(banner => (
            <Card key={banner.id} className="rounded-2xl border-card-border overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-28 rounded-xl overflow-hidden bg-muted shrink-0">
                    {banner.imageUrl
                      ? <img src={banner.imageUrl} alt={banner.title} className="h-full w-full object-cover" />
                      : <div className="h-full w-full flex items-center justify-center"><ImageIcon className="h-5 w-5 text-muted-foreground/30" /></div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-semibold text-sm truncate">{banner.title}</p>
                      <Badge className={`text-[10px] rounded-full shrink-0 ${banner.isActive ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-muted text-muted-foreground"}`}>
                        {banner.isActive ? "Active" : "Hidden"}
                      </Badge>
                    </div>
                    {banner.subtitle && <p className="text-xs text-muted-foreground truncate">{banner.subtitle}</p>}
                    {banner.linkUrl && <p className="text-[10px] text-muted-foreground/50 truncate mt-0.5">{banner.linkUrl}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="outline" size="icon" title={banner.isActive ? "Hide" : "Show"}
                      onClick={() => toggleMutation.mutate(banner.id)}>
                      {banner.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => openEdit(banner)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="icon"><Trash2 className="h-4 w-4" /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete banner?</AlertDialogTitle>
                          <AlertDialogDescription>This will remove "{banner.title}" permanently.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteMutation.mutate(banner.id)}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Banner" : "Add Banner"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* TMDB auto-fill */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-medium">Search type:</span>
                <button
                  type="button"
                  onClick={() => setTmdbType("movie")}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${tmdbType === "movie" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"}`}
                >
                  <Film className="h-3 w-3" /> Movie
                </button>
                <button
                  type="button"
                  onClick={() => setTmdbType("tv")}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${tmdbType === "tv" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"}`}
                >
                  <Tv className="h-3 w-3" /> TV Series
                </button>
              </div>
              <TmdbSearch type={tmdbType} onSelect={handleTmdbSelect} />
            </div>

            <div className="space-y-1.5">
              <Label>Title *</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="rounded-xl" placeholder="e.g. New Release" />
            </div>
            <div className="space-y-1.5">
              <Label>Subtitle</Label>
              <Input value={form.subtitle} onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))} className="rounded-xl" placeholder="Short tagline" />
            </div>
            <div className="space-y-1.5">
              <Label>Image URL * <span className="text-muted-foreground font-normal">(auto-filled from TMDB search above)</span></Label>
              <Input value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))} className="rounded-xl" placeholder="https://..." />
              {form.imageUrl && (
                <div className="h-28 w-full rounded-xl overflow-hidden bg-muted mt-1">
                  <img src={form.imageUrl} alt="preview" className="h-full w-full object-cover" />
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Link URL</Label>
                <Input value={form.linkUrl} onChange={e => setForm(f => ({ ...f, linkUrl: e.target.value }))} className="rounded-xl" placeholder="/movie/123" />
              </div>
              <div className="space-y-1.5">
                <Label>Button Label</Label>
                <Input value={form.buttonLabel} onChange={e => setForm(f => ({ ...f, buttonLabel: e.target.value }))} className="rounded-xl" placeholder="Watch Now" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Sort Order</Label>
              <Input type="number" value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))} className="rounded-xl w-24" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending} className="rounded-xl">
              {saveMutation.isPending ? "Saving…" : editing ? "Save Changes" : "Create Banner"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

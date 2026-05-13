import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, XCircle, Loader2, Search, Download, ExternalLink, Info, Film, Tv, Zap } from "lucide-react";

interface PreviewItem {
  tmdbId: number;
  type: string;
  title: string;
  year: string;
  genre: string;
  posterUrl: string | null;
  overview: string;
}

interface ImportResult {
  id: number;
  title: string;
  mediaType: string;
  success: boolean;
  error?: string;
}

interface ImportResponse {
  succeeded: number;
  failed: number;
  results: ImportResult[];
}

const TOKEN_KEY = "fiirso_admin_token";

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem(TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function ImportPage() {
  const { toast } = useToast();
  const [type, setType] = useState<"movie" | "tv" | "auto">("auto");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [rawIds, setRawIds] = useState("");
  const [previewId, setPreviewId] = useState("");
  const [previewType, setPreviewType] = useState<"movie" | "tv" | "auto">("auto");
  const [previews, setPreviews] = useState<PreviewItem[]>([]);
  const [results, setResults] = useState<ImportResponse | null>(null);

  const parsedIds = rawIds
    .split(/[\n,\s]+/)
    .map(s => parseInt(s.trim()))
    .filter(n => !isNaN(n) && n > 0);

  const previewMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/tmdb/preview/${previewType}/${id}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const err = await res.json() as { error: string };
        throw new Error(err.error ?? "Failed");
      }
      return res.json() as Promise<PreviewItem>;
    },
    onSuccess: (data) => {
      setPreviews(prev => {
        if (prev.find(p => p.tmdbId === data.tmdbId)) return prev;
        return [...prev, data];
      });
      setPreviewId("");
    },
    onError: (err) => toast({ title: `Preview failed: ${err.message}`, variant: "destructive" }),
  });

  const importMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/tmdb/bulk-import", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ ids: parsedIds, type, status }),
      });
      if (!res.ok) {
        const err = await res.json() as { error: string };
        throw new Error(err.error ?? "Import failed");
      }
      return res.json() as Promise<ImportResponse>;
    },
    onSuccess: (data) => {
      setResults(data);
      toast({
        title: `Import complete: ${data.succeeded} succeeded, ${data.failed} failed`,
        variant: data.failed > 0 ? "destructive" : "default",
      });
    },
    onError: (err) => toast({ title: `Import failed: ${err.message}`, variant: "destructive" }),
  });

  const handlePreview = () => {
    const id = parseInt(previewId.trim());
    if (isNaN(id)) return;
    previewMutation.mutate(id);
  };

  const quickImportMutation = useMutation({
    mutationFn: async (item: PreviewItem) => {
      const res = await fetch("/api/tmdb/bulk-import", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ ids: [item.tmdbId], type: item.type === "movie" ? "movie" : "tv", status }),
      });
      if (!res.ok) {
        const err = await res.json() as { error: string };
        throw new Error(err.error ?? "Import failed");
      }
      return res.json() as Promise<ImportResponse>;
    },
    onSuccess: (data, item) => {
      setPreviews(p => p.filter(i => i.tmdbId !== item.tmdbId));
      setResults(data);
      toast({
        title: data.succeeded > 0 ? `"${item.title}" imported` : `Failed to import "${item.title}"`,
        variant: data.failed > 0 ? "destructive" : "default",
      });
    },
    onError: (err) => toast({ title: `Import failed: ${err.message}`, variant: "destructive" }),
  });

  const removePreview = (tmdbId: number) => {
    setPreviews(p => p.filter(i => i.tmdbId !== tmdbId));
    const newIds = rawIds
      .split(/[\n,\s]+/)
      .filter(s => parseInt(s) !== tmdbId)
      .join("\n");
    setRawIds(newIds);
  };

  const typeLabel = type === "auto" ? "Items" : type === "movie" ? "Movie" : "Series";

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">TMDB Bulk Import</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Import movies or TV series directly from TMDB by ID</p>
      </div>

      {/* Info */}
      <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 px-4 py-3 text-xs text-blue-300/80 flex items-start gap-2.5">
        <Info className="h-3.5 w-3.5 mt-0.5 shrink-0 text-blue-400" />
        <span>
          Find TMDB IDs at{" "}
          <a href="https://www.themoviedb.org" target="_blank" rel="noreferrer" className="underline text-blue-400 hover:text-blue-300">
            themoviedb.org
          </a>
          . The ID is in the URL: <code className="bg-white/10 px-1 rounded">/movie/550</code> → ID is <strong>550</strong>.
          Use <strong>Auto-Detect</strong> to automatically classify each ID as movie or TV series.
        </span>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Left — input */}
        <div className="space-y-4">
          <Card className="rounded-2xl border-card-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Import Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Content Type</Label>
                  <Select value={type} onValueChange={v => setType(v as "movie" | "tv" | "auto")}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">
                        <div className="flex items-center gap-1.5">
                          <Zap className="h-3.5 w-3.5 text-amber-400" />
                          Auto-Detect
                        </div>
                      </SelectItem>
                      <SelectItem value="movie">
                        <div className="flex items-center gap-1.5">
                          <Film className="h-3.5 w-3.5" />
                          Movies Only
                        </div>
                      </SelectItem>
                      <SelectItem value="tv">
                        <div className="flex items-center gap-1.5">
                          <Tv className="h-3.5 w-3.5" />
                          TV Series Only
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {type === "auto" && (
                    <p className="text-[10px] text-amber-400/80">Each ID auto-classified as movie or TV</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Import As</Label>
                  <Select value={status} onValueChange={v => setStatus(v as "draft" | "published")}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">TMDB IDs (one per line or comma-separated)</Label>
                <Textarea
                  value={rawIds}
                  onChange={e => setRawIds(e.target.value)}
                  placeholder={"550\n680\n13\n27205"}
                  rows={6}
                  className="rounded-xl resize-none font-mono text-sm"
                />
                <p className="text-[10px] text-muted-foreground">
                  {parsedIds.length} valid ID{parsedIds.length !== 1 ? "s" : ""} entered · max 50 per batch
                </p>
              </div>

              <Button
                className="w-full rounded-xl"
                disabled={parsedIds.length === 0 || importMutation.isPending}
                onClick={() => { setResults(null); importMutation.mutate(); }}
              >
                {importMutation.isPending
                  ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Importing {parsedIds.length} {typeLabel}{parsedIds.length !== 1 ? "s" : ""}…</>
                  : <><Download className="mr-2 h-4 w-4" /> Import {parsedIds.length} {typeLabel}{parsedIds.length !== 1 && type !== "auto" ? "s" : ""}</>}
              </Button>
            </CardContent>
          </Card>

          {/* Preview lookup */}
          <Card className="rounded-2xl border-card-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Preview a TMDB ID</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Select value={previewType} onValueChange={v => setPreviewType(v as "movie" | "tv" | "auto")}>
                    <SelectTrigger className="w-36 rounded-xl text-xs shrink-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto" className="text-xs">
                        <div className="flex items-center gap-1.5">
                          <Zap className="h-3 w-3 text-amber-400" />
                          Auto
                        </div>
                      </SelectItem>
                      <SelectItem value="movie" className="text-xs">
                        <div className="flex items-center gap-1.5">
                          <Film className="h-3 w-3" />
                          Movie
                        </div>
                      </SelectItem>
                      <SelectItem value="tv" className="text-xs">
                        <div className="flex items-center gap-1.5">
                          <Tv className="h-3 w-3" />
                          TV
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    value={previewId}
                    onChange={e => setPreviewId(e.target.value)}
                    placeholder="e.g. 550"
                    className="rounded-xl"
                    onKeyDown={e => e.key === "Enter" && handlePreview()}
                  />
                  <Button variant="outline" onClick={handlePreview} disabled={previewMutation.isPending || !previewId.trim()} className="rounded-xl shrink-0">
                    {previewMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground">Preview before adding to import list</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right — results / previews */}
        <div className="space-y-4">
          {/* Import results */}
          {results && (
            <Card className="rounded-2xl border-card-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  Import Results
                  <Badge className="bg-green-500/10 text-green-400 border-green-500/20 text-[10px]">
                    {results.succeeded} succeeded
                  </Badge>
                  {results.failed > 0 && (
                    <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-[10px]">
                      {results.failed} failed
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5 max-h-60 overflow-y-auto">
                  {results.results.map((r, i) => (
                    <div key={i} className="flex items-center gap-2.5 text-xs py-1.5 border-b border-border/30 last:border-0">
                      {r.success
                        ? <CheckCircle2 className="h-3.5 w-3.5 text-green-400 shrink-0" />
                        : <XCircle className="h-3.5 w-3.5 text-destructive shrink-0" />}
                      <span className="font-medium truncate">{r.title || `ID ${r.id}`}</span>
                      {r.success && (
                        <Badge className={`ml-auto text-[9px] px-1.5 py-0 shrink-0 ${r.mediaType === "movie" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : "bg-purple-500/10 text-purple-400 border-purple-500/20"}`}>
                          {r.mediaType === "movie" ? <><Film className="h-2.5 w-2.5 mr-1" />Movie</> : <><Tv className="h-2.5 w-2.5 mr-1" />TV</>}
                        </Badge>
                      )}
                      {r.error && <span className="text-destructive/70 truncate ml-auto">{r.error}</span>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Previewed items */}
          {previews.length > 0 && (
            <Card className="rounded-2xl border-card-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Previewed Items</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {previews.map(item => (
                  <div key={item.tmdbId} className="flex items-start gap-3 p-2 rounded-xl bg-muted/30 border border-border/30">
                    {item.posterUrl
                      ? <img src={item.posterUrl} alt={item.title} className="h-16 w-11 object-cover rounded-lg shrink-0" />
                      : <div className="h-16 w-11 rounded-lg bg-muted shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold truncate">{item.title}</p>
                        <Badge className={`text-[9px] px-1.5 py-0 shrink-0 ${item.type === "movie" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : "bg-purple-500/10 text-purple-400 border-purple-500/20"}`}>
                          {item.type === "movie" ? "Movie" : "TV"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{item.year} · {item.genre || "—"}</p>
                      <p className="text-[10px] text-muted-foreground/60 line-clamp-2 mt-0.5">{item.overview}</p>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span className="text-[10px] text-muted-foreground/50">ID: {item.tmdbId}</span>
                        <a
                          href={`https://www.themoviedb.org/${item.type}/${item.tmdbId}`}
                          target="_blank" rel="noreferrer"
                          className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-0.5"
                        >
                          TMDB <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 shrink-0">
                      <Button
                        size="sm"
                        className="h-6 text-[10px] rounded-lg px-2"
                        disabled={quickImportMutation.isPending}
                        onClick={() => quickImportMutation.mutate(item)}
                      >
                        {quickImportMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Import"}
                      </Button>
                      <Button size="sm" variant="ghost" className="h-6 text-[10px] rounded-lg px-2 text-muted-foreground"
                        onClick={() => removePreview(item.tmdbId)}>
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {!results && previews.length === 0 && (
            <Card className="rounded-2xl border-card-border border-dashed">
              <CardContent className="py-12 flex flex-col items-center text-center">
                <Download className="h-8 w-8 text-muted-foreground/20 mb-2" />
                <p className="text-sm text-muted-foreground">Enter TMDB IDs and click Import</p>
                <p className="text-xs text-muted-foreground/50 mt-1">Auto-Detect classifies each ID correctly</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

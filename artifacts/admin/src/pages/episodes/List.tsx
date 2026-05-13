import { useState } from "react";
import { Link, useParams } from "wouter";
import {
  useListEpisodes,
  getListEpisodesQueryKey,
  useCreateEpisode,
  useUpdateEpisode,
  useDeleteEpisode,
  useGetSeason,
  getGetSeasonQueryKey,
  Episode
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Trash2, ArrowLeft, Plus, Image as ImageIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export default function EpisodesList() {
  const { id } = useParams();
  const seasonId = parseInt(id!);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEpisode, setEditingEpisode] = useState<Episode | null>(null);
  const [episodeNumber, setEpisodeNumber] = useState<string>("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("");
  const [embedUrl, setEmbedUrl] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [status, setStatus] = useState("published");

  const { data: season } = useGetSeason(seasonId, {
    query: { enabled: !!seasonId, queryKey: getGetSeasonQueryKey(seasonId) }
  });

  const { data: episodes, isLoading } = useListEpisodes(seasonId, {
    query: { enabled: !!seasonId, queryKey: getListEpisodesQueryKey(seasonId) }
  });

  const createMutation = useCreateEpisode();
  const updateMutation = useUpdateEpisode();
  const deleteMutation = useDeleteEpisode();

  const handleOpenDialog = (episode?: Episode) => {
    if (episode) {
      setEditingEpisode(episode);
      setEpisodeNumber(episode.episodeNumber.toString());
      setTitle(episode.title);
      setDescription(episode.description || "");
      setDuration(episode.duration || "");
      setEmbedUrl(episode.embedUrl || "");
      setThumbnailUrl(episode.thumbnailUrl || "");
      setStatus(episode.status);
    } else {
      setEditingEpisode(null);
      setEpisodeNumber((episodes?.length ? Math.max(...episodes.map(e => e.episodeNumber)) + 1 : 1).toString());
      setTitle(""); setDescription(""); setDuration("");
      setEmbedUrl(""); setThumbnailUrl(""); setStatus("published");
    }
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!season) return;
    const payload = {
      seriesId: season.seriesId,
      episodeNumber: parseInt(episodeNumber),
      title,
      description: description || undefined,
      duration: duration || undefined,
      embedUrl: embedUrl || undefined,
      thumbnailUrl: thumbnailUrl || undefined,
      status,
    };
    if (editingEpisode) {
      updateMutation.mutate({ id: editingEpisode.id, data: payload }, {
        onSuccess: () => {
          toast({ title: "Episode updated" });
          queryClient.invalidateQueries({ queryKey: getListEpisodesQueryKey(seasonId) });
          setIsDialogOpen(false);
        },
        onError: () => toast({ title: "Failed to update episode", variant: "destructive" })
      });
    } else {
      createMutation.mutate({ id: seasonId, data: payload }, {
        onSuccess: () => {
          toast({ title: "Episode created" });
          queryClient.invalidateQueries({ queryKey: getListEpisodesQueryKey(seasonId) });
          setIsDialogOpen(false);
        },
        onError: () => toast({ title: "Failed to create episode", variant: "destructive" })
      });
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Delete this episode?")) {
      deleteMutation.mutate({ id }, {
        onSuccess: () => {
          toast({ title: "Episode deleted" });
          queryClient.invalidateQueries({ queryKey: getListEpisodesQueryKey(seasonId) });
        },
        onError: () => toast({ title: "Failed to delete episode", variant: "destructive" })
      });
    }
  };

  const Thumbnail = ({ ep }: { ep: Episode }) =>
    ep.thumbnailUrl ? (
      <img src={ep.thumbnailUrl} alt="" className="h-9 w-14 object-cover rounded bg-muted flex-shrink-0" />
    ) : (
      <div className="h-9 w-14 bg-muted rounded flex items-center justify-center text-muted-foreground flex-shrink-0">
        <ImageIcon className="h-3.5 w-3.5" />
      </div>
    );

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        {season ? (
          <Link href={`/series/${season.seriesId}/seasons`}>
            <Button variant="outline" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
        ) : (
          <Button variant="outline" size="icon" disabled><ArrowLeft className="h-4 w-4" /></Button>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Episodes</h1>
          {season && <p className="text-sm text-muted-foreground">Season {season.seasonNumber}</p>}
        </div>
        <Button size="sm" onClick={() => handleOpenDialog()} data-testid="button-add-episode">
          <Plus className="mr-1.5 h-4 w-4" /> Add Episode
        </Button>
      </div>

      {/* Mobile card list */}
      <div className="md:hidden space-y-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardContent className="p-4 space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent></Card>
          ))
        ) : episodes?.length === 0 ? (
          <p className="text-center text-muted-foreground py-10">No episodes yet.</p>
        ) : (
          episodes?.map((ep) => (
            <Card key={ep.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Thumbnail ep={ep} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-muted-foreground">Ep {ep.episodeNumber}</p>
                    <p className="font-semibold text-sm truncate">{ep.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {ep.duration && <span className="text-xs text-muted-foreground">{ep.duration}</span>}
                      <Badge variant={ep.status === "published" ? "default" : "secondary"} className="text-xs">{ep.status}</Badge>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Button variant="outline" size="icon" onClick={() => handleOpenDialog(ep)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="destructive" size="icon" onClick={() => handleDelete(ep.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block rounded-md border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Ep #</TableHead>
              <TableHead className="w-20">Thumb</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-8" /></TableCell>
                  <TableCell><Skeleton className="h-9 w-14 rounded" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : episodes?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No episodes yet.</TableCell>
              </TableRow>
            ) : (
              episodes?.map((ep) => (
                <TableRow key={ep.id}>
                  <TableCell className="font-medium">{ep.episodeNumber}</TableCell>
                  <TableCell><Thumbnail ep={ep} /></TableCell>
                  <TableCell>{ep.title}</TableCell>
                  <TableCell>{ep.duration || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={ep.status === "published" ? "default" : "secondary"}>{ep.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="icon" onClick={() => handleOpenDialog(ep)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="icon" onClick={() => handleDelete(ep.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingEpisode ? "Edit Episode" : "Add Episode"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="episodeNumber">Episode Number</Label>
                <Input id="episodeNumber" type="number" value={episodeNumber} onChange={(e) => setEpisodeNumber(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="duration">Duration</Label>
                <Input id="duration" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="e.g. 45 min" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="embedUrl">Video Embed URL</Label>
              <Input id="embedUrl" value={embedUrl} onChange={(e) => setEmbedUrl(e.target.value)} placeholder="https://…" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="thumbnailUrl">Thumbnail URL <span className="text-xs text-muted-foreground font-normal">(optional — auto-filled from series image)</span></Label>
              <Input id="thumbnailUrl" value={thumbnailUrl} onChange={(e) => setThumbnailUrl(e.target.value)} placeholder="Leave blank to use series backdrop automatically" />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="w-full sm:w-auto">Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={!episodeNumber || !title || createMutation.isPending || updateMutation.isPending}
              className="w-full sm:w-auto"
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useState } from "react";
import { Link, useParams } from "wouter";
import {
  useListSeasons,
  getListSeasonsQueryKey,
  useCreateSeason,
  useUpdateSeason,
  useDeleteSeason,
  useGetOneSeries,
  getGetOneSeriesQueryKey,
  Season
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Trash2, ArrowLeft, Plus, PlaySquare } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function SeasonsList() {
  const { id } = useParams();
  const seriesId = parseInt(id!);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSeason, setEditingSeason] = useState<Season | null>(null);
  const [seasonNumber, setSeasonNumber] = useState<string>("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const { data: series } = useGetOneSeries(seriesId, {
    query: { enabled: !!seriesId, queryKey: getGetOneSeriesQueryKey(seriesId) }
  });

  const { data: seasons, isLoading } = useListSeasons(seriesId, {
    query: { enabled: !!seriesId, queryKey: getListSeasonsQueryKey(seriesId) }
  });

  const createMutation = useCreateSeason();
  const updateMutation = useUpdateSeason();
  const deleteMutation = useDeleteSeason();

  const handleOpenDialog = (season?: Season) => {
    if (season) {
      setEditingSeason(season);
      setSeasonNumber(season.seasonNumber.toString());
      setTitle(season.title || "");
      setDescription(season.description || "");
    } else {
      setEditingSeason(null);
      setSeasonNumber((seasons?.length ? Math.max(...seasons.map(s => s.seasonNumber)) + 1 : 1).toString());
      setTitle("");
      setDescription("");
    }
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    const payload = {
      seasonNumber: parseInt(seasonNumber),
      title: title || undefined,
      description: description || undefined,
    };
    if (editingSeason) {
      updateMutation.mutate({ id: editingSeason.id, data: payload }, {
        onSuccess: () => {
          toast({ title: "Season updated" });
          queryClient.invalidateQueries({ queryKey: getListSeasonsQueryKey(seriesId) });
          setIsDialogOpen(false);
        },
        onError: () => toast({ title: "Failed to update season", variant: "destructive" })
      });
    } else {
      createMutation.mutate({ id: seriesId, data: payload }, {
        onSuccess: () => {
          toast({ title: "Season created" });
          queryClient.invalidateQueries({ queryKey: getListSeasonsQueryKey(seriesId) });
          setIsDialogOpen(false);
        },
        onError: () => toast({ title: "Failed to create season", variant: "destructive" })
      });
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this season?")) {
      deleteMutation.mutate({ id }, {
        onSuccess: () => {
          toast({ title: "Season deleted" });
          queryClient.invalidateQueries({ queryKey: getListSeasonsQueryKey(seriesId) });
        },
        onError: () => toast({ title: "Failed to delete season", variant: "destructive" })
      });
    }
  };

  const ActionButtons = ({ season }: { season: Season }) => (
    <div className="flex items-center gap-2">
      <Link href={`/seasons/${season.id}/episodes`}>
        <Button variant="outline" size="icon" title="Manage Episodes">
          <PlaySquare className="h-4 w-4" />
        </Button>
      </Link>
      <Button variant="outline" size="icon" onClick={() => handleOpenDialog(season)}>
        <Pencil className="h-4 w-4" />
      </Button>
      <Button variant="destructive" size="icon" onClick={() => handleDelete(season.id)}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/series">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Seasons</h1>
          {series && <p className="text-sm text-muted-foreground truncate">{series.title}</p>}
        </div>
        <Button size="sm" onClick={() => handleOpenDialog()} data-testid="button-add-season">
          <Plus className="mr-1.5 h-4 w-4" /> Add Season
        </Button>
      </div>

      {/* Mobile card list */}
      <div className="md:hidden space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}><CardContent className="p-4 space-y-2">
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent></Card>
          ))
        ) : seasons?.length === 0 ? (
          <p className="text-center text-muted-foreground py-10">No seasons yet.</p>
        ) : (
          seasons?.map((season) => (
            <Card key={season.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm">Season {season.seasonNumber}</p>
                    {season.title && <p className="text-xs text-muted-foreground truncate">{season.title}</p>}
                    <p className="text-xs text-muted-foreground mt-0.5">{season.episodesCount} episode{season.episodesCount !== 1 ? "s" : ""}</p>
                  </div>
                  <ActionButtons season={season} />
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
              <TableHead className="w-28">Season #</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Episodes</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-8" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-32 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : seasons?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">No seasons yet.</TableCell>
              </TableRow>
            ) : (
              seasons?.map((season) => (
                <TableRow key={season.id}>
                  <TableCell className="font-medium">{season.seasonNumber}</TableCell>
                  <TableCell>{season.title || `Season ${season.seasonNumber}`}</TableCell>
                  <TableCell>{season.episodesCount}</TableCell>
                  <TableCell className="text-right"><ActionButtons season={season} /></TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-md">
          <DialogHeader>
            <DialogTitle>{editingSeason ? "Edit Season" : "Add Season"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="seasonNumber">Season Number</Label>
              <Input id="seasonNumber" type="number" value={seasonNumber} onChange={(e) => setSeasonNumber(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="title">Title (Optional)</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. The Beginning" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="w-full sm:w-auto">Cancel</Button>
            <Button onClick={handleSave} disabled={!seasonNumber || createMutation.isPending || updateMutation.isPending} className="w-full sm:w-auto">
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

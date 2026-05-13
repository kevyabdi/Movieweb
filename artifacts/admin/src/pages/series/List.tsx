import { useState } from "react";
import { Link } from "wouter";
import {
  useListSeries,
  getListSeriesQueryKey,
  usePublishSeries,
  useDraftSeries,
  useDeleteSeries,
  Series
} from "@workspace/api-client-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Trash2, CheckCircle, XCircle, Search, Plus, ListTree, CheckCheck, XSquare, Trash } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { API_URL } from "@/lib/api-url";

async function bulkAction(ids: number[], action: "publish" | "draft" | "delete") {
  const res = await fetch(`${API_URL}/api/bulk-action`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids, action, type: "series" }),
  });
  if (!res.ok) throw new Error("Bulk action failed");
  return res.json();
}

export default function SeriesList() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const queryParams = statusFilter !== "all" ? { status: statusFilter } : {};

  const { data: seriesList, isLoading } = useListSeries(queryParams, {
    query: { queryKey: getListSeriesQueryKey(queryParams) }
  });

  const publishMutation = usePublishSeries();
  const draftMutation = useDraftSeries();
  const deleteMutation = useDeleteSeries();

  const bulkMutation = useMutation({
    mutationFn: ({ ids, action }: { ids: number[]; action: "publish" | "draft" | "delete" }) =>
      bulkAction(ids, action),
    onSuccess: (_, vars) => {
      toast({ title: `${vars.ids.length} series ${vars.action === "delete" ? "deleted" : vars.action === "publish" ? "published" : "set to draft"}` });
      queryClient.invalidateQueries({ queryKey: getListSeriesQueryKey(queryParams) });
      setSelected(new Set());
    },
    onError: () => toast({ title: "Bulk action failed", variant: "destructive" }),
  });

  const handleToggleStatus = (series: Series) => {
    const isPublished = series.status === "published";
    const mutation = isPublished ? draftMutation : publishMutation;
    mutation.mutate({ id: series.id }, {
      onSuccess: () => {
        toast({ title: `Series ${isPublished ? "drafted" : "published"} successfully` });
        queryClient.invalidateQueries({ queryKey: getListSeriesQueryKey(queryParams) });
      },
      onError: () => toast({ title: "Failed to update status", variant: "destructive" })
    });
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Series deleted" });
        queryClient.invalidateQueries({ queryKey: getListSeriesQueryKey(queryParams) });
      },
      onError: () => toast({ title: "Failed to delete series", variant: "destructive" })
    });
  };

  const filteredSeries = seriesList?.filter(s =>
    s.title.toLowerCase().includes(search.toLowerCase()) ||
    s.genre.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  const allIds = filteredSeries.map(s => s.id);
  const allSelected = allIds.length > 0 && allIds.every(id => selected.has(id));
  const someSelected = allIds.some(id => selected.has(id));

  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(allIds));
  };

  const toggleOne = (id: number) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const selectedArr = Array.from(selected);

  const ActionButtons = ({ series }: { series: Series }) => (
    <div className="flex items-center gap-2">
      <Link href={`/series/${series.id}/seasons`}>
        <Button variant="outline" size="icon" title="Manage Seasons">
          <ListTree className="h-4 w-4" />
        </Button>
      </Link>
      <Button variant="outline" size="icon" onClick={() => handleToggleStatus(series)}
        title={series.status === "published" ? "Move to Draft" : "Publish"}>
        {series.status === "published"
          ? <XCircle className="h-4 w-4 text-destructive" />
          : <CheckCircle className="h-4 w-4 text-green-500" />}
      </Button>
      <Link href={`/series/${series.id}/edit`}>
        <Button variant="outline" size="icon"><Pencil className="h-4 w-4" /></Button>
      </Link>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" size="icon"><Trash2 className="h-4 w-4" /></Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete series?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete "{series.title}".</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleDelete(series.id)}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">TV Series</h1>
        <Link href="/series/new">
          <Button size="sm"><Plus className="mr-1.5 h-4 w-4" /> Add Series</Button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search series..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bulk action bar */}
      {selectedArr.length > 0 && (
        <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-2.5 text-sm">
          <span className="font-semibold text-primary mr-2">{selectedArr.length} selected</span>
          <Button size="sm" variant="outline" className="h-7 text-xs rounded-lg gap-1.5"
            onClick={() => bulkMutation.mutate({ ids: selectedArr, action: "publish" })}
            disabled={bulkMutation.isPending}>
            <CheckCheck className="h-3.5 w-3.5 text-green-500" /> Publish All
          </Button>
          <Button size="sm" variant="outline" className="h-7 text-xs rounded-lg gap-1.5"
            onClick={() => bulkMutation.mutate({ ids: selectedArr, action: "draft" })}
            disabled={bulkMutation.isPending}>
            <XSquare className="h-3.5 w-3.5 text-amber-500" /> Draft All
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="destructive" className="h-7 text-xs rounded-lg gap-1.5 ml-auto">
                <Trash className="h-3.5 w-3.5" /> Delete All
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete {selectedArr.length} series?</AlertDialogTitle>
                <AlertDialogDescription>This will permanently delete the selected series.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => bulkMutation.mutate({ ids: selectedArr, action: "delete" })}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button size="sm" variant="ghost" className="h-7 text-xs rounded-lg text-muted-foreground"
            onClick={() => setSelected(new Set())}>Clear</Button>
        </div>
      )}

      {/* Mobile */}
      <div className="md:hidden space-y-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardContent className="p-4 space-y-2">
              <Skeleton className="h-5 w-3/4" /><Skeleton className="h-4 w-1/2" />
            </CardContent></Card>
          ))
        ) : filteredSeries.length === 0 ? (
          <p className="text-center text-muted-foreground py-10">No series found.</p>
        ) : (
          filteredSeries.map(series => (
            <Card key={series.id} className={selected.has(series.id) ? "ring-1 ring-primary" : ""}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Checkbox checked={selected.has(series.id)} onCheckedChange={() => toggleOne(series.id)} className="mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm truncate">{series.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{series.year} · {series.genre} · {series.seasonsCount} season{series.seasonsCount !== 1 ? "s" : ""}</p>
                    <Badge variant={series.status === "published" ? "default" : "secondary"} className="text-xs mt-2">{series.status}</Badge>
                  </div>
                  <ActionButtons series={series} />
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
              <TableHead className="w-10">
                <Checkbox checked={allSelected} onCheckedChange={toggleAll}
                  className={someSelected && !allSelected ? "opacity-50" : ""} />
              </TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Year</TableHead>
              <TableHead>Genre</TableHead>
              <TableHead>Seasons</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : filteredSeries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">No series found.</TableCell>
              </TableRow>
            ) : (
              filteredSeries.map(series => (
                <TableRow key={series.id} className={selected.has(series.id) ? "bg-primary/5" : ""}>
                  <TableCell>
                    <Checkbox checked={selected.has(series.id)} onCheckedChange={() => toggleOne(series.id)} />
                  </TableCell>
                  <TableCell className="font-medium">{series.title}</TableCell>
                  <TableCell>{series.year}</TableCell>
                  <TableCell>{series.genre}</TableCell>
                  <TableCell>{series.seasonsCount}</TableCell>
                  <TableCell>
                    <Badge variant={series.status === "published" ? "default" : "secondary"}>{series.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right"><ActionButtons series={series} /></TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

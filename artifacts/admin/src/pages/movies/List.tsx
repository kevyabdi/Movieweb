import { useState } from "react";
import { Link } from "wouter";
import {
  useListMovies,
  getListMoviesQueryKey,
  usePublishMovie,
  useDraftMovie,
  useDeleteMovie,
  Movie
} from "@workspace/api-client-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Trash2, CheckCircle, XCircle, Search, Plus, CheckCheck, XSquare, Trash } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { API_URL } from "@/lib/api-url";

const TOKEN_KEY = "fiirso_admin_token";

async function bulkAction(ids: number[], action: "publish" | "draft" | "delete") {
  const token = localStorage.getItem(TOKEN_KEY);
  const res = await fetch(`${API_URL}/api/bulk-action`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ ids, action, type: "movie" }),
  });
  if (!res.ok) throw new Error("Bulk action failed");
  return res.json();
}

export default function MoviesList() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const queryParams = statusFilter !== "all" ? { status: statusFilter } : {};

  const { data: movies, isLoading } = useListMovies(queryParams, {
    query: { queryKey: getListMoviesQueryKey(queryParams) }
  });

  const publishMutation = usePublishMovie();
  const draftMutation = useDraftMovie();
  const deleteMutation = useDeleteMovie();

  const bulkMutation = useMutation({
    mutationFn: ({ ids, action }: { ids: number[]; action: "publish" | "draft" | "delete" }) =>
      bulkAction(ids, action),
    onSuccess: (_, vars) => {
      toast({ title: `${vars.ids.length} movie${vars.ids.length !== 1 ? "s" : ""} ${vars.action === "delete" ? "deleted" : vars.action === "publish" ? "published" : "set to draft"}` });
      queryClient.invalidateQueries({ queryKey: getListMoviesQueryKey(queryParams) });
      setSelected(new Set());
    },
    onError: () => toast({ title: "Bulk action failed", variant: "destructive" }),
  });

  const handleToggleStatus = (movie: Movie) => {
    const isPublished = movie.status === "published";
    const mutation = isPublished ? draftMutation : publishMutation;
    mutation.mutate({ id: movie.id }, {
      onSuccess: () => {
        toast({ title: `Movie ${isPublished ? "drafted" : "published"} successfully` });
        queryClient.invalidateQueries({ queryKey: getListMoviesQueryKey(queryParams) });
      },
      onError: () => toast({ title: "Failed to update status", variant: "destructive" })
    });
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Movie deleted" });
        queryClient.invalidateQueries({ queryKey: getListMoviesQueryKey(queryParams) });
      },
      onError: () => toast({ title: "Failed to delete movie", variant: "destructive" })
    });
  };

  const filteredMovies = movies?.filter(m =>
    m.title.toLowerCase().includes(search.toLowerCase()) ||
    m.genre.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  const allIds = filteredMovies.map(m => m.id);
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

  const ActionButtons = ({ movie }: { movie: Movie }) => (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="icon" onClick={() => handleToggleStatus(movie)}
        title={movie.status === "published" ? "Move to Draft" : "Publish"}>
        {movie.status === "published"
          ? <XCircle className="h-4 w-4 text-destructive" />
          : <CheckCircle className="h-4 w-4 text-green-500" />}
      </Button>
      <Link href={`/movies/${movie.id}/edit`}>
        <Button variant="outline" size="icon"><Pencil className="h-4 w-4" /></Button>
      </Link>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" size="icon"><Trash2 className="h-4 w-4" /></Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete movie?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete "{movie.title}".</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleDelete(movie.id)}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Movies</h1>
        <Link href="/movies/new">
          <Button size="sm"><Plus className="mr-1.5 h-4 w-4" /> Add Movie</Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search movies..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8" />
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
                <AlertDialogTitle>Delete {selectedArr.length} movies?</AlertDialogTitle>
                <AlertDialogDescription>This will permanently delete the selected movies. This cannot be undone.</AlertDialogDescription>
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

      {/* Mobile card list */}
      <div className="md:hidden space-y-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardContent className="p-4 space-y-2">
              <Skeleton className="h-5 w-3/4" /><Skeleton className="h-4 w-1/2" />
            </CardContent></Card>
          ))
        ) : filteredMovies.length === 0 ? (
          <p className="text-center text-muted-foreground py-10">No movies found.</p>
        ) : (
          filteredMovies.map(movie => (
            <Card key={movie.id} className={selected.has(movie.id) ? "ring-1 ring-primary" : ""}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Checkbox checked={selected.has(movie.id)} onCheckedChange={() => toggleOne(movie.id)} className="mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm truncate">{movie.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{movie.year} · {movie.genre}</p>
                    <Badge variant={movie.status === "published" ? "default" : "secondary"} className="text-xs mt-2">{movie.status}</Badge>
                  </div>
                  <ActionButtons movie={movie} />
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
                  aria-label="Select all" className={someSelected && !allSelected ? "opacity-50" : ""} />
              </TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Year</TableHead>
              <TableHead>Genre</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : filteredMovies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No movies found.</TableCell>
              </TableRow>
            ) : (
              filteredMovies.map(movie => (
                <TableRow key={movie.id} className={selected.has(movie.id) ? "bg-primary/5" : ""}>
                  <TableCell>
                    <Checkbox checked={selected.has(movie.id)} onCheckedChange={() => toggleOne(movie.id)} />
                  </TableCell>
                  <TableCell className="font-medium">{movie.title}</TableCell>
                  <TableCell>{movie.year}</TableCell>
                  <TableCell>{movie.genre}</TableCell>
                  <TableCell>
                    <Badge variant={movie.status === "published" ? "default" : "secondary"}>{movie.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right"><ActionButtons movie={movie} /></TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

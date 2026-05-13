import { useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  useCreateSeries,
  useUpdateSeries,
  useGetOneSeries,
  getGetOneSeriesQueryKey,
  getListSeriesQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2, ExternalLink, ListTree } from "lucide-react";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { TmdbSearch } from "@/components/TmdbSearch";

const seriesSchema = z.object({
  title: z.string().min(1, "Title is required"),
  year: z.string().min(4, "Year is required"),
  genre: z.string().min(1, "Genre is required"),
  rating: z.string().optional(),
  description: z.string().optional(),
  longDescription: z.string().optional(),
  posterUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  backdropUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  trailerUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  quality: z.string().optional(),
  director: z.string().optional(),
  tags: z.string().optional(),
  status: z.enum(["draft", "published"]).default("draft"),
  isFeatured: z.boolean().default(false),
  isTrending: z.boolean().default(false),
  isMostLiked: z.boolean().default(false),
});

type SeriesFormValues = z.infer<typeof seriesSchema>;

export default function SeriesForm() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const isEditing = !!params.id;
  const seriesId = params.id ? parseInt(params.id) : 0;

  const { data: series, isLoading: isLoadingSeries } = useGetOneSeries(seriesId, {
    query: { enabled: isEditing, queryKey: getGetOneSeriesQueryKey(seriesId) }
  });

  const createMutation = useCreateSeries();
  const updateMutation = useUpdateSeries();

  const form = useForm<SeriesFormValues>({
    resolver: zodResolver(seriesSchema),
    defaultValues: {
      title: "", year: new Date().getFullYear().toString(), genre: "",
      rating: "", description: "", longDescription: "",
      posterUrl: "", backdropUrl: "", trailerUrl: "",
      quality: "HD", director: "", tags: "", status: "draft",
      isFeatured: false, isTrending: false, isMostLiked: false,
    },
  });

  useEffect(() => {
    if (series && isEditing) {
      form.reset({
        title: series.title, year: series.year, genre: series.genre,
        rating: series.rating || "", description: series.description || "",
        longDescription: series.longDescription || "",
        posterUrl: series.posterUrl || "", backdropUrl: series.backdropUrl || "",
        trailerUrl: series.trailerUrl || "", quality: series.quality || "HD",
        director: series.director || "", tags: series.tags?.join(", ") || "",
        status: series.status as "draft" | "published",
        isFeatured: series.isFeatured, isTrending: series.isTrending, isMostLiked: series.isMostLiked,
      });
    }
  }, [series, isEditing, form]);

  const handleTmdbSelect = (data: Partial<SeriesFormValues>) => {
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        form.setValue(key as keyof SeriesFormValues, value as never, { shouldDirty: true });
      }
    });
    toast({ title: "Fields populated from TMDB" });
  };

  const onSubmit = (data: SeriesFormValues) => {
    const payload = {
      ...data,
      tags: data.tags ? data.tags.split(",").map(t => t.trim()).filter(Boolean) : [],
    };
    if (isEditing) {
      updateMutation.mutate({ id: seriesId, data: payload }, {
        onSuccess: () => {
          toast({ title: "Series updated successfully" });
          queryClient.invalidateQueries({ queryKey: getGetOneSeriesQueryKey(seriesId) });
          queryClient.invalidateQueries({ queryKey: getListSeriesQueryKey() });
          setLocation("/series");
        },
        onError: () => toast({ title: "Failed to update series", variant: "destructive" })
      });
    } else {
      createMutation.mutate({ data: payload }, {
        onSuccess: (created) => {
          toast({ title: "Series created — now add seasons & episodes" });
          queryClient.invalidateQueries({ queryKey: getListSeriesQueryKey() });
          if (created?.id) {
            setLocation(`/series/${created.id}/seasons`);
          } else {
            setLocation("/series");
          }
        },
        onError: () => toast({ title: "Failed to create series", variant: "destructive" })
      });
    }
  };

  if (isEditing && isLoadingSeries) {
    return (
      <div className="space-y-5 max-w-3xl mx-auto">
        <Skeleton className="h-9 w-48 rounded-xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  const isPending = createMutation.isPending || updateMutation.isPending;
  const posterUrl = form.watch("posterUrl");

  return (
    <div className="space-y-5 max-w-3xl mx-auto pb-10">
      <div className="flex items-center gap-3">
        <Link href="/series">
          <Button variant="outline" size="icon" className="rounded-xl h-9 w-9">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold tracking-tight">
            {isEditing ? "Edit Series" : "Add Series"}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isEditing ? "Update series details" : "Create a new TV series entry — you'll add seasons & episodes next"}
          </p>
        </div>
        {isEditing && (
          <Link href={`/series/${seriesId}/seasons`}>
            <Button variant="outline" size="sm" className="rounded-xl gap-1.5 shrink-0">
              <ListTree className="h-3.5 w-3.5" />
              Seasons & Episodes
            </Button>
          </Link>
        )}
      </div>

      {/* TMDB Search */}
      {!isEditing && (
        <TmdbSearch type="tv" onSelect={handleTmdbSelect} />
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

          {/* Basic Info */}
          <Card className="rounded-2xl border-card-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {posterUrl && (
                  <div className="sm:col-span-1 flex justify-center">
                    <div className="h-36 w-24 overflow-hidden rounded-xl bg-muted ring-1 ring-border">
                      <img src={posterUrl} alt="Poster" className="h-full w-full object-cover" />
                    </div>
                  </div>
                )}
                <div className={`space-y-4 ${posterUrl ? "sm:col-span-2" : "sm:col-span-3"}`}>
                  <FormField control={form.control} name="title" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl><Input {...field} className="rounded-xl" data-testid="input-title" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <div className="grid grid-cols-2 gap-3">
                    <FormField control={form.control} name="year" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Year</FormLabel>
                        <FormControl><Input {...field} className="rounded-xl" data-testid="input-year" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="quality" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quality</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                          </FormControl>
                          <SelectContent className="rounded-xl">
                            <SelectItem value="HD">HD</SelectItem>
                            <SelectItem value="4K">4K</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField control={form.control} name="genre" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Genre</FormLabel>
                    <FormControl><Input {...field} className="rounded-xl" data-testid="input-genre" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="director" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Creator / Director</FormLabel>
                    <FormControl><Input {...field} className="rounded-xl" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="rating" render={({ field }) => (
                <FormItem>
                  <FormLabel>Age Rating</FormLabel>
                  <FormControl><Input {...field} className="rounded-xl w-32" placeholder="TV-MA, TV-14…" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Short Description</FormLabel>
                  <FormControl><Textarea {...field} rows={3} className="rounded-xl resize-none" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="longDescription" render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Description</FormLabel>
                  <FormControl><Textarea {...field} rows={4} className="rounded-xl resize-none" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="tags" render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags</FormLabel>
                  <FormControl><Input {...field} className="rounded-xl" placeholder="drama, thriller, crime" /></FormControl>
                  <FormDescription className="text-xs">Comma separated</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
            </CardContent>
          </Card>

          {/* Media */}
          <Card className="rounded-2xl border-card-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Media & Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField control={form.control} name="posterUrl" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Poster URL</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input {...field} className="rounded-xl pr-8" placeholder="https://…" />
                        {field.value && (
                          <a href={field.value} target="_blank" rel="noreferrer" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="backdropUrl" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Backdrop URL</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input {...field} className="rounded-xl pr-8" placeholder="https://…" />
                        {field.value && (
                          <a href={field.value} target="_blank" rel="noreferrer" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="trailerUrl" render={({ field }) => (
                <FormItem>
                  <FormLabel>Trailer URL</FormLabel>
                  <FormControl><Input {...field} className="rounded-xl" placeholder="https://youtube.com/…" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </CardContent>
          </Card>

          {/* Publishing */}
          <Card className="rounded-2xl border-card-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Publishing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="rounded-xl w-full sm:w-44">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { name: "isFeatured" as const, label: "Featured", desc: "Homepage hero" },
                  { name: "isTrending" as const, label: "Trending", desc: "Trending section" },
                  { name: "isMostLiked" as const, label: "Most Liked", desc: "Most liked section" },
                ].map(({ name, label, desc }) => (
                  <FormField key={name} control={form.control} name={name} render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-xl border border-border p-3.5">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} className="rounded-md" />
                      </FormControl>
                      <div className="space-y-0.5 leading-none">
                        <FormLabel className="font-medium">{label}</FormLabel>
                        <FormDescription className="text-xs">{desc}</FormDescription>
                      </div>
                    </FormItem>
                  )} />
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center gap-3 pt-1">
            <Button
              type="submit"
              disabled={isPending}
              className="rounded-xl px-6"
              data-testid="button-submit-series"
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Save Changes" : "Create Series"}
            </Button>
            <Link href="/series">
              <Button type="button" variant="ghost" className="rounded-xl">
                Cancel
              </Button>
            </Link>
          </div>
        </form>
      </Form>
    </div>
  );
}

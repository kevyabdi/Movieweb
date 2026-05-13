import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Crown, Loader2, RotateCcw } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { API_URL } from "@/lib/api-url";

interface Plan {
  id: string;
  name: string;
  maxQuality: "HD" | "4K" | "CAM";
  canDownload: boolean;
  adsEnabled: boolean;
  maxStreams: number;
  price: number;
  description: string;
}

async function fetchPlans(): Promise<Plan[]> {
  const res = await fetch(`${API_URL}/api/plans`);
  if (!res.ok) throw new Error("Failed");
  return res.json() as Promise<Plan[]>;
}

async function updatePlan(id: string, data: Omit<Plan, "id">): Promise<Plan> {
  const res = await fetch(`/api/plans/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed");
  return res.json() as Promise<Plan>;
}

const PLAN_ICONS: Record<string, string> = { free: "🆓", basic: "⚡", premium: "👑" };
const PLAN_COLORS: Record<string, string> = {
  free: "text-muted-foreground",
  basic: "text-blue-400",
  premium: "text-amber-400",
};
const PLAN_BG: Record<string, string> = {
  free: "border-border",
  basic: "border-blue-500/20",
  premium: "border-amber-500/20",
};

export default function PlansPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, Omit<Plan, "id">>>({});

  const { data: plans, isLoading } = useQuery({ queryKey: ["plans"], queryFn: fetchPlans });

  const saveMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Omit<Plan, "id"> }) => updatePlan(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans"] });
      toast({ title: "Plan saved" });
      setEditing(null);
    },
    onError: () => toast({ title: "Failed to save plan", variant: "destructive" }),
  });

  const resetMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API_URL}/api/plans/reset`, { method: "POST" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans"] });
      toast({ title: "Plans reset to defaults" });
    },
  });

  const startEdit = (plan: Plan) => {
    setEditing(plan.id);
    setDrafts(d => ({ ...d, [plan.id]: { name: plan.name, maxQuality: plan.maxQuality, canDownload: plan.canDownload, adsEnabled: plan.adsEnabled, maxStreams: plan.maxStreams, price: plan.price, description: plan.description } }));
  };

  const setField = (id: string, field: string, value: unknown) => {
    setDrafts(d => ({ ...d, [id]: { ...d[id], [field]: value } }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Subscription Plans</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Define what each plan allows on your platform</p>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" className="rounded-xl">
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Reset Defaults
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reset all plans?</AlertDialogTitle>
              <AlertDialogDescription>This will restore all plan settings to their default values.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => resetMutation.mutate()}>Reset</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Info banner */}
      <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 px-4 py-3 text-xs text-blue-300/80 flex items-start gap-2.5">
        <Crown className="h-3.5 w-3.5 mt-0.5 shrink-0 text-blue-400" />
        <span>Plan limits are enforced on the website. Users on the Free plan see ads; Basic gets HD; Premium gets 4K + downloads. User plans are set in the Users page.</span>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="rounded-2xl border-card-border">
                <CardContent className="p-5 space-y-3">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-9 w-full" />
                </CardContent>
              </Card>
            ))
          : plans?.map(plan => {
              const isEditing = editing === plan.id;
              const draft = drafts[plan.id] ?? plan;

              return (
                <Card key={plan.id} className={`rounded-2xl border-2 ${PLAN_BG[plan.id]} transition-colors`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{PLAN_ICONS[plan.id]}</span>
                        <CardTitle className={`text-base font-bold ${PLAN_COLORS[plan.id]}`}>
                          {isEditing ? draft.name : plan.name}
                        </CardTitle>
                      </div>
                      <Badge variant="outline" className="text-[10px] rounded-full">
                        ${isEditing ? draft.price : plan.price}/mo
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{isEditing ? draft.description : plan.description}</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isEditing ? (
                      <>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs">Plan Name</Label>
                            <Input value={draft.name} onChange={e => setField(plan.id, "name", e.target.value)} className="rounded-xl h-8 text-xs" />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Price ($/mo)</Label>
                            <Input type="number" min="0" step="0.01" value={draft.price} onChange={e => setField(plan.id, "price", parseFloat(e.target.value) || 0)} className="rounded-xl h-8 text-xs" />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs">Max Quality</Label>
                          <Select value={draft.maxQuality} onValueChange={v => setField(plan.id, "maxQuality", v)}>
                            <SelectTrigger className="rounded-xl h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="CAM">CAM</SelectItem>
                              <SelectItem value="HD">HD</SelectItem>
                              <SelectItem value="4K">4K</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs">Max Simultaneous Streams</Label>
                          <Input type="number" min="1" max="10" value={draft.maxStreams} onChange={e => setField(plan.id, "maxStreams", parseInt(e.target.value) || 1)} className="rounded-xl h-8 text-xs" />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs">Description</Label>
                          <Input value={draft.description} onChange={e => setField(plan.id, "description", e.target.value)} className="rounded-xl h-8 text-xs" />
                        </div>

                        <div className="space-y-2.5 pt-1">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs text-muted-foreground">Allow Downloads</Label>
                            <Switch checked={draft.canDownload} onCheckedChange={v => setField(plan.id, "canDownload", v)} />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label className="text-xs text-muted-foreground">Show Ads</Label>
                            <Switch checked={draft.adsEnabled} onCheckedChange={v => setField(plan.id, "adsEnabled", v)} />
                          </div>
                        </div>

                        <div className="flex gap-2 pt-1">
                          <Button size="sm" className="flex-1 rounded-xl h-8 text-xs"
                            disabled={saveMutation.isPending}
                            onClick={() => saveMutation.mutate({ id: plan.id, data: draft })}>
                            {saveMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Save"}
                          </Button>
                          <Button size="sm" variant="ghost" className="rounded-xl h-8 text-xs"
                            onClick={() => setEditing(null)}>Cancel</Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="space-y-2 text-xs">
                          {[
                            { label: "Max Quality", value: plan.maxQuality },
                            { label: "Streams", value: `${plan.maxStreams} simultaneous` },
                            { label: "Downloads", value: plan.canDownload ? "✓ Allowed" : "✗ Not allowed" },
                            { label: "Ads", value: plan.adsEnabled ? "✓ Shown" : "✗ Ad-free" },
                          ].map((row, i) => (
                            <div key={i} className="flex items-center justify-between py-1.5 border-b border-border/40 last:border-0">
                              <span className="text-muted-foreground">{row.label}</span>
                              <span className="font-medium">{row.value}</span>
                            </div>
                          ))}
                        </div>
                        <Button size="sm" variant="outline" className="w-full rounded-xl h-8 text-xs mt-2"
                          onClick={() => startEdit(plan)}>
                          Edit Plan
                        </Button>
                      </>
                    )}
                  </CardContent>
                </Card>
              );
            })}
      </div>
    </div>
  );
}

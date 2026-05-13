import { useState } from "react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { ChevronLeft, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { API_URL } from "@/lib/api-url";

interface ApiPlan {
  id: string;
  name: string;
  maxQuality: "HD" | "4K" | "CAM";
  canDownload: boolean;
  adsEnabled: boolean;
  maxStreams: number;
  price: number;
  description: string;
}

function buildFeatures(plan: ApiPlan): string[] {
  const features: string[] = [];
  features.push(`${plan.maxQuality} · ${plan.maxStreams} screen${plan.maxStreams !== 1 ? "s" : ""}`);
  if (plan.adsEnabled) {
    features.push("Ads included");
  } else {
    features.push("No ads");
  }
  if (plan.canDownload) features.push("Downloads");
  if (plan.description) features.push(plan.description);
  return features;
}

function formatPrice(price: number): string {
  if (price === 0) return "Free";
  return `$${price.toFixed(2)}`;
}

const FALLBACK_PLANS: ApiPlan[] = [
  { id: "basic", name: "Basic", maxQuality: "HD", canDownload: false, adsEnabled: false, maxStreams: 1, price: 4.99, description: "Ad-free streaming in HD" },
  { id: "premium", name: "Premium", maxQuality: "4K", canDownload: true, adsEnabled: false, maxStreams: 4, price: 9.99, description: "4K streaming, downloads, 4 screens" },
];

export default function Subscribe() {
  const [, navigate] = useLocation();

  const { data: allPlans, isLoading } = useQuery<ApiPlan[]>({
    queryKey: ["/api/plans"],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/plans`);
      if (!res.ok) throw new Error("Failed to fetch plans");
      return res.json() as Promise<ApiPlan[]>;
    },
    staleTime: 60_000,
  });

  const plans = allPlans ?? FALLBACK_PLANS;
  const defaultPlan = plans.find(p => p.id === "premium") ?? plans[plans.length - 1];
  const [selected, setSelected] = useState<string | null>(null);
  const selectedId = selected ?? defaultPlan?.id ?? "";
  const plan = plans.find(p => p.id === selectedId) ?? plans[0];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-sm mx-auto px-5 pt-14 pb-28 flex flex-col">

        {/* Back */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          onClick={() => navigate("/settings")}
          className="flex items-center gap-1 text-foreground/40 hover:text-foreground/70 transition-colors mb-10 -ml-1 self-start"
        >
          <ChevronLeft className="w-4 h-4" strokeWidth={1.75} />
          <span className="text-[13px]">Back</span>
        </motion.button>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22 }}
          className="mb-8"
        >
          <h1 className="text-[26px] font-bold text-foreground tracking-tight">Choose a Plan</h1>
          <p className="text-[13px] text-foreground/35 mt-1">Unlock full access to Fiirso</p>
        </motion.div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-foreground/30" />
          </div>
        ) : (
          <>
            {/* Plan toggle */}
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, delay: 0.06 }}
              className="flex rounded-xl overflow-hidden border border-foreground/[0.08] divide-x divide-foreground/[0.08] mb-8"
            >
              {plans.map(p => (
                <button
                  key={p.id}
                  onClick={() => setSelected(p.id)}
                  className={cn(
                    "flex-1 flex flex-col items-center py-3 transition-all duration-200",
                    selectedId === p.id
                      ? "bg-foreground/[0.07] text-foreground"
                      : "text-foreground/35 hover:text-foreground/55"
                  )}
                >
                  <span className="text-[14px] font-semibold">{p.name}</span>
                  <span className={cn("text-[12px] mt-0.5", selectedId === p.id ? "text-foreground/50" : "text-foreground/25")}>
                    {formatPrice(p.price)}/mo
                  </span>
                </button>
              ))}
            </motion.div>

            {/* Selected plan detail */}
            {plan && (
              <motion.div
                key={selectedId}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="flex-1"
              >
                {/* Price */}
                <div className="mb-8">
                  <div className="flex items-end gap-2">
                    <span className="text-[42px] font-bold text-foreground leading-none">{formatPrice(plan.price)}</span>
                    {plan.price > 0 && <span className="text-[14px] text-foreground/35 mb-1.5">/mo</span>}
                  </div>
                  {plan.id === "premium" && (
                    <span className="inline-block mt-2 text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400">
                      Popular
                    </span>
                  )}
                </div>

                {/* Features */}
                <div className="space-y-4 mb-10">
                  {buildFeatures(plan).map(f => (
                    <div key={f} className="flex items-center gap-3">
                      <Check className="w-4 h-4 text-foreground/50 shrink-0" strokeWidth={2} />
                      <span className="text-[15px] text-foreground/70">{f}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, delay: 0.14 }}
            >
              <button className="w-full py-4 rounded-2xl bg-foreground text-background text-[15px] font-semibold hover:opacity-90 transition-all active:scale-[0.98]">
                Continue with {plan?.name}
              </button>
              <p className="text-center text-[12px] text-foreground/25 mt-3">
                Cancel anytime · No hidden fees
              </p>
            </motion.div>
          </>
        )}

      </div>
    </div>
  );
}

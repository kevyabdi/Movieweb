import { Router, type IRouter, type Request, type Response } from "express";
import { z } from "zod";

const router: IRouter = Router();

const DEFAULT_PLANS = [
  {
    id: "free",
    name: "Free",
    maxQuality: "HD",
    canDownload: false,
    adsEnabled: true,
    maxStreams: 1,
    price: 0,
    description: "Basic access with ads, HD quality",
  },
  {
    id: "basic",
    name: "Basic",
    maxQuality: "HD",
    canDownload: false,
    adsEnabled: false,
    maxStreams: 1,
    price: 4.99,
    description: "Ad-free streaming in HD",
  },
  {
    id: "premium",
    name: "Premium",
    maxQuality: "4K",
    canDownload: true,
    adsEnabled: false,
    maxStreams: 4,
    price: 9.99,
    description: "4K streaming, downloads, 4 screens",
  },
];

let plansStore = [...DEFAULT_PLANS];

router.get("/plans", (_req: Request, res: Response): void => {
  res.json(plansStore);
});

const PlanBody = z.object({
  name: z.string().min(1),
  maxQuality: z.enum(["HD", "4K", "CAM"]),
  canDownload: z.boolean(),
  adsEnabled: z.boolean(),
  maxStreams: z.number().int().min(1),
  price: z.number().min(0),
  description: z.string().optional(),
});

router.put("/plans/:id", (req: Request, res: Response): void => {
  const { id } = req.params;
  const parsed = PlanBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const idx = plansStore.findIndex(p => p.id === id);
  if (idx === -1) {
    res.status(404).json({ error: "Plan not found" });
    return;
  }

  plansStore[idx] = { ...plansStore[idx], ...parsed.data };
  res.json(plansStore[idx]);
});

router.post("/plans/reset", (_req: Request, res: Response): void => {
  plansStore = [...DEFAULT_PLANS];
  res.json(plansStore);
});

export default router;

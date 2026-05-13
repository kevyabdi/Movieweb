import { createContext, useContext } from "react";
import { useQuery } from "@tanstack/react-query";

export interface Banner {
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

interface BannersContextValue {
  banners: Banner[];
  isLoading: boolean;
}

const BannersContext = createContext<BannersContextValue>({ banners: [], isLoading: false });

export function BannersProvider({ children }: { children: React.ReactNode }) {
  const { data: banners = [], isLoading } = useQuery<Banner[]>({
    queryKey: ["/api/banners/active"],
    queryFn: async () => {
      const res = await fetch("/api/banners/active");
      if (!res.ok) return [];
      return res.json() as Promise<Banner[]>;
    },
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  const sorted = [...banners].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <BannersContext.Provider value={{ banners: sorted, isLoading }}>
      {children}
    </BannersContext.Provider>
  );
}

export function useBanners(): BannersContextValue {
  return useContext(BannersContext);
}

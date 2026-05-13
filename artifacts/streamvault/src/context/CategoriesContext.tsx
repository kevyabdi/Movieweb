import { createContext, useContext } from "react";
import { useListCategories } from "@workspace/api-client-react";

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface CategoriesContextValue {
  categories: Category[];
  isLoading: boolean;
}

const CategoriesContext = createContext<CategoriesContextValue>({
  categories: [],
  isLoading: false,
});

export function CategoriesProvider({ children }: { children: React.ReactNode }) {
  const { data, isLoading } = useListCategories({
    query: { queryKey: ["/api/categories"], staleTime: 30_000, refetchOnWindowFocus: true },
  });

  const categories: Category[] = (data ?? []).map(c => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
  }));

  return (
    <CategoriesContext.Provider value={{ categories, isLoading }}>
      {children}
    </CategoriesContext.Provider>
  );
}

export function useCategories() {
  return useContext(CategoriesContext);
}

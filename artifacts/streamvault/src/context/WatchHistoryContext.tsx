import { createContext, useContext, useState, useEffect } from "react";
import { MediaItem } from "@/data/content";

interface WatchEntry {
  item: MediaItem;
  progress: number;
  watchedAt: number;
}

interface WatchHistoryContextValue {
  history: WatchEntry[];
  addToHistory: (item: MediaItem) => void;
  updateProgress: (id: string, progress: number) => void;
  removeFromHistory: (id: string) => void;
}

const WatchHistoryContext = createContext<WatchHistoryContextValue>({
  history: [],
  addToHistory: () => {},
  updateProgress: () => {},
  removeFromHistory: () => {},
});

const STORAGE_KEY = "fiirso-watch-history";

function loadHistory(): WatchEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveHistory(history: WatchEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch {}
}

export function WatchHistoryProvider({ children }: { children: React.ReactNode }) {
  const [history, setHistory] = useState<WatchEntry[]>(loadHistory);

  useEffect(() => {
    saveHistory(history);
  }, [history]);

  const addToHistory = (item: MediaItem) => {
    setHistory(prev => {
      const existing = prev.find(e => e.item.id === item.id);
      if (existing) {
        return [
          { ...existing, watchedAt: Date.now() },
          ...prev.filter(e => e.item.id !== item.id),
        ];
      }
      const randomProgress = Math.floor(Math.random() * 55) + 8;
      return [{ item, progress: randomProgress, watchedAt: Date.now() }, ...prev];
    });
  };

  const updateProgress = (id: string, progress: number) => {
    setHistory(prev =>
      prev.map(e => e.item.id === id ? { ...e, progress, watchedAt: Date.now() } : e)
    );
  };

  const removeFromHistory = (id: string) => {
    setHistory(prev => prev.filter(e => e.item.id !== id));
  };

  return (
    <WatchHistoryContext.Provider value={{ history, addToHistory, updateProgress, removeFromHistory }}>
      {children}
    </WatchHistoryContext.Provider>
  );
}

export function useWatchHistory() {
  return useContext(WatchHistoryContext);
}

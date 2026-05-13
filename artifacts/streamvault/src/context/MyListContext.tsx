import { createContext, useContext, useState, useEffect } from "react";
import { MediaItem } from "@/data/content";

interface MyListContextValue {
  myList: MediaItem[];
  addToList: (item: MediaItem) => void;
  removeFromList: (id: string) => void;
  isInList: (id: string) => boolean;
  toggleList: (item: MediaItem) => void;
}

const MyListContext = createContext<MyListContextValue>({
  myList: [],
  addToList: () => {},
  removeFromList: () => {},
  isInList: () => false,
  toggleList: () => {},
});

const STORAGE_KEY = "fiirso-my-list";

function loadList(): MediaItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function MyListProvider({ children }: { children: React.ReactNode }) {
  const [myList, setMyList] = useState<MediaItem[]>(loadList);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(myList));
    } catch {}
  }, [myList]);

  const addToList = (item: MediaItem) => {
    setMyList(prev => prev.find(i => i.id === item.id) ? prev : [item, ...prev]);
  };

  const removeFromList = (id: string) => {
    setMyList(prev => prev.filter(i => i.id !== id));
  };

  const isInList = (id: string) => myList.some(i => i.id === id);

  const toggleList = (item: MediaItem) => {
    if (isInList(item.id)) removeFromList(item.id);
    else addToList(item);
  };

  return (
    <MyListContext.Provider value={{ myList, addToList, removeFromList, isInList, toggleList }}>
      {children}
    </MyListContext.Provider>
  );
}

export function useMyList() {
  return useContext(MyListContext);
}

import { SearchQuery } from "@/types/search";

export interface SearchHistoryEntry {
  id: string;
  state: SearchQuery;
  createdAt: string;
}


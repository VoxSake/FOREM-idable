import { LocationEntry } from "@/services/location/locationCache";

export type BooleanMode = "AND" | "OR";

export interface SearchQuery {
  keywords: string[];
  locations: LocationEntry[];
  booleanMode: BooleanMode;
}


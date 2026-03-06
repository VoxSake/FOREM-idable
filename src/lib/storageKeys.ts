export const STORAGE_KEYS = {
  favorites: "forem_idable_favorites",
  settings: "forem_idable_settings",
  searchHistory: "forem_idable_search_history_v1",
  analyticsConsent: "forem_idable_analytics_consent_v1",
  locationsCache: "forem_idable_locations_cache_v1",
} as const;

export const ALL_STORAGE_KEYS = Object.values(STORAGE_KEYS);

export const runtimeConfig = {
  adzuna: {
    enabled: process.env.ADZUNA_ENABLED === "true",
    appId: process.env.ADZUNA_APP_ID?.trim() || "",
    appKey: process.env.ADZUNA_APP_KEY?.trim() || "",
    country: process.env.ADZUNA_COUNTRY?.trim() || "be",
  },
};


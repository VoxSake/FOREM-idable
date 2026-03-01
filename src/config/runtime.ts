export const runtimeConfig = {
  adzuna: {
    enabled: process.env.ADZUNA_ENABLED === "true",
    appId: process.env.ADZUNA_APP_ID?.trim() || "",
    appKey: process.env.ADZUNA_APP_KEY?.trim() || "",
    country: process.env.ADZUNA_COUNTRY?.trim() || "be",
  },
  umami: {
    enabled: process.env.UMAMI_ENABLED === "true",
    websiteId: process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID?.trim() || "",
    scriptUrl:
      process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL?.trim() ||
      "https://cloud.umami.is/script.js",
  },
};

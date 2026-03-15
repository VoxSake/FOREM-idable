import { sanitizeUmamiScriptUrl } from "@/lib/analytics";

export const runtimeConfig = {
  brand: {
    copyrightName:
      process.env.COPYRIGHT_NAME?.trim() ||
      process.env.PRIVACY_CONTROLLER_NAME?.trim() ||
      "Jordi Brisbois",
  },
  adzuna: {
    enabled: process.env.ADZUNA_ENABLED === "true",
    appId: process.env.ADZUNA_APP_ID?.trim() || "",
    appKey: process.env.ADZUNA_APP_KEY?.trim() || "",
    country: process.env.ADZUNA_COUNTRY?.trim() || "be",
  },
  umami: {
    enabled: process.env.UMAMI_ENABLED === "true",
    websiteId: process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID?.trim() || "",
    scriptUrl: sanitizeUmamiScriptUrl(process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL),
  },
  privacy: {
    controllerName: process.env.PRIVACY_CONTROLLER_NAME?.trim() || "Jordi Brisbois",
    contactEmail: process.env.PRIVACY_CONTACT_EMAIL?.trim() || "RGPD@brisbois.dev",
    projectLabel: process.env.PRIVACY_PROJECT_LABEL?.trim() || "FOREM-idable",
    sourceUrl:
      process.env.PRIVACY_SOURCE_URL?.trim() || "https://github.com/VoxSake/FOREM-idable",
  },
};

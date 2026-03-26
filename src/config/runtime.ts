import { sanitizeUmamiScriptUrl } from "@/lib/analytics";

function sanitizeHyphenSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function sanitizeUnderscoreSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_{2,}/g, "_");
}

const projectLabel = process.env.PRIVACY_PROJECT_LABEL?.trim() || "FOREM-idable";
const exportFilenamePrefix =
  process.env.APP_EXPORT_FILENAME_PREFIX?.trim() || sanitizeHyphenSlug(projectLabel) || "app";
const storageNamespace =
  process.env.APP_STORAGE_NAMESPACE?.trim() ||
  sanitizeUnderscoreSlug(exportFilenamePrefix) ||
  "app";
const currentYear = new Date().getFullYear();

export const runtimeConfig = {
  app: {
    baseUrl: process.env.APP_BASE_URL?.trim() || process.env.COOLIFY_URL?.trim() || "",
    titleSuffix: process.env.APP_TITLE_SUFFIX?.trim() || "Indexeur d'offres",
    metaDescription:
      process.env.APP_META_DESCRIPTION?.trim() ||
      "Recherche d'offres d'emploi du Forem, simplifiée et décomplexée.",
    tagline: process.env.APP_TAGLINE?.trim() || "L'indexeur d'offres décomplexé",
    sourceLinkLabel: process.env.APP_SOURCE_LINK_LABEL?.trim() || "Code source AGPLv3",
    exportFilenamePrefix,
    storageNamespace,
    sessionCookieName:
      process.env.APP_SESSION_COOKIE_NAME?.trim() || `${storageNamespace}_session`,
    calendarUidDomain:
      process.env.APP_CALENDAR_UID_DOMAIN?.trim() || exportFilenamePrefix || "app",
    currentYear,
  },
  brand: {
    copyrightName:
      process.env.COPYRIGHT_NAME?.trim() ||
      process.env.PRIVACY_CONTROLLER_NAME?.trim() ||
      "Jordi Brisbois",
  },
  auth: {
    passwordResetEnabled: process.env.NEXT_PUBLIC_PASSWORD_RESET_ENABLED === "true",
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
    projectLabel,
    sourceUrl:
      process.env.PRIVACY_SOURCE_URL?.trim() || "https://github.com/VoxSake/FOREM-idable",
    lastUpdatedLabel: process.env.PRIVACY_LAST_UPDATED_LABEL?.trim() || "25 mars 2026",
  },
};

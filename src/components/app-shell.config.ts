import {
  Briefcase,
  CircleHelp,
  Send,
  ShieldCheck,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import { UserRole } from "@/types/auth";

export interface AppSidebarNavItem {
  title: string;
  url: string;
  icon: LucideIcon;
  accent?: boolean;
  children?: Array<{
    title: string;
    url: string;
  }>;
}

const BASE_NAV_ITEMS: AppSidebarNavItem[] = [
  { title: "Recherche", url: "/", icon: Briefcase },
  { title: "Candidatures", url: "/applications", icon: Send },
  { title: "Mon compte", url: "/account", icon: UserRound },
  { title: "À propos", url: "/about", icon: CircleHelp },
];

const COACH_NAV_ITEM: AppSidebarNavItem = {
  title: "Suivi bénéficiaires",
  url: "/coach",
  icon: Users,
  accent: true,
  children: [
    { title: "À traiter", url: "/coach#a-traiter" },
    { title: "Activité récente", url: "/coach#activite-recente" },
    { title: "Groupes", url: "/coach#groupes" },
  ],
};

const ADMIN_NAV_ITEM: AppSidebarNavItem = {
  title: "Administration",
  url: "/admin",
  icon: ShieldCheck,
  accent: true,
  children: [
    { title: "Coachs", url: "/admin#coachs" },
    { title: "Clés API", url: "/admin#cles-api" },
  ],
};

export const FOOTER_NAV_ITEMS: AppSidebarNavItem[] = [
  { title: "Confidentialité", url: "/privacy", icon: ShieldCheck },
];

export function getSidebarNavItems(role?: UserRole): AppSidebarNavItem[] {
  if (role === "admin") {
    return [ADMIN_NAV_ITEM, COACH_NAV_ITEM, ...BASE_NAV_ITEMS];
  }

  if (role === "coach") {
    return [COACH_NAV_ITEM, ...BASE_NAV_ITEMS];
  }

  return BASE_NAV_ITEMS;
}

export function isSidebarItemActive(pathname: string, itemUrl: string) {
  return pathname === itemUrl;
}

export function isSidebarSubItemVisible(pathname: string, item: AppSidebarNavItem) {
  return pathname === item.url && Boolean(item.children?.length);
}

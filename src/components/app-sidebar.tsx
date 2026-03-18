"use client";

import { Briefcase, Moon, Sun, CircleHelp, Send, Users, UserRound, ShieldCheck } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ForemIdableLogo } from "@/components/branding/ForemIdableLogo";
import { AuthSidebarPanel } from "@/components/auth/AuthSidebarPanel";
import { useAuth } from "@/components/auth/AuthProvider";
import { runtimeConfig } from "@/config/runtime";

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const baseNavItems = [
    { title: "Recherche", url: "/", icon: Briefcase },
    { title: "Candidatures", url: "/applications", icon: Send },
    { title: "Mon compte", url: "/account", icon: UserRound },
    { title: "À propos", url: "/about", icon: CircleHelp },
];

export function AppSidebar() {
    const pathname = usePathname();
    const { theme, setTheme } = useTheme();
    const { user } = useAuth();
    const isCoachPage = pathname === "/coach";
    const navItems =
        user?.role === "coach" || user?.role === "admin"
            ? [{ title: "Suivi bénéficiaires", url: "/coach", icon: Users }, ...baseNavItems]
            : baseNavItems;
    const coachSubNavItems = [
        { title: "À traiter", url: "/coach#a-traiter" },
        { title: "Activité récente", url: "/coach#activite-recente" },
        { title: "Groupes", url: "/coach#groupes" },
    ];

    return (
        <Sidebar>
            <SidebarHeader className="p-4 border-b">
                <div className="flex items-center">
                    <ForemIdableLogo className="h-8" />
                </div>
                <p className="text-xs text-muted-foreground font-medium italic mt-1">L&apos;indexeur d&apos;offres décomplexé</p>
            </SidebarHeader>

            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Compte</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <AuthSidebarPanel />
                    </SidebarGroupContent>
                </SidebarGroup>

                <SidebarGroup>
                    <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {navItems.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={pathname === item.url}
                                        className={
                                            item.url === "/coach"
                                                ? "border-transparent bg-primary/5 font-medium text-foreground shadow-none hover:bg-primary/10 dark:bg-primary/10 dark:text-sky-50 dark:shadow-none dark:hover:bg-primary/16"
                                                : undefined
                                        }
                                    >
                                        <Link href={item.url}>
                                            <item.icon className="w-4 h-4" />
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                    {item.url === "/coach" && isCoachPage ? (
                                        <div className="ml-6 mt-2 space-y-1 border-l border-border/70 pl-3">
                                            {coachSubNavItems.map((subItem) => (
                                                <Link
                                                    key={subItem.title}
                                                    href={subItem.url}
                                                    className="block text-sm text-muted-foreground transition hover:text-foreground"
                                                >
                                                    {subItem.title}
                                                </Link>
                                            ))}
                                        </div>
                                    ) : null}
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="border-t p-3">
                <div className="flex items-center gap-2">
                    <SidebarMenu className="flex-1">
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild isActive={pathname === "/privacy"} tooltip="Confidentialité">
                                <Link href="/privacy">
                                    <ShieldCheck className="w-4 h-4" />
                                    <span>Confidentialité</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                            setTheme(theme === "dark" ? "light" : "dark");
                        }}
                        className="rounded-full"
                    >
                        <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                        <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                        <span className="sr-only">Changer le thème</span>
                    </Button>
                </div>
                <p className="mt-2 px-2 text-[11px] leading-4 text-muted-foreground">
                    {runtimeConfig.brand.copyrightName} · FOREM-idable · 2026 · Licence MIT
                </p>
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    );
}

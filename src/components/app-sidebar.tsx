"use client";

import { useEffect, useState } from "react";
import { Briefcase, Heart, Settings, Moon, Sun, CircleHelp } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ForemIdableLogo } from "@/components/branding/ForemIdableLogo";
import { FOOTER_QUOTES } from "@/data/footerQuotes";
import { pickRandomItem } from "@/lib/random";

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
import { Separator } from "@/components/ui/separator";

const navItems = [
    { title: "Recherche", url: "/", icon: Briefcase },
    { title: "Favoris", url: "/favorites", icon: Heart },
    { title: "À propos", url: "/about", icon: CircleHelp },
];

export function AppSidebar() {
    const pathname = usePathname();
    const { theme, setTheme } = useTheme();
    const [currentQuote, setCurrentQuote] = useState(() => FOOTER_QUOTES[0]);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            setCurrentQuote(pickRandomItem(FOOTER_QUOTES));
        }, 0);

        return () => window.clearTimeout(timeoutId);
    }, []);

    return (
        <Sidebar>
            <SidebarHeader className="p-4 border-b">
                <div className="flex items-center">
                    <ForemIdableLogo className="h-7" />
                </div>
                <p className="text-xs text-muted-foreground font-medium italic mt-1">L&apos;indexeur d&apos;offres décomplexé</p>
            </SidebarHeader>

            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {navItems.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild isActive={pathname === item.url}>
                                        <Link href={item.url}>
                                            <item.icon className="w-4 h-4" />
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="border-t p-4 flex flex-col gap-4">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={pathname === "/settings"}>
                            <Link href="/settings">
                                <Settings className="w-4 h-4" />
                                <span>Paramètres</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>

                <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground ml-2">Thème</span>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                        className="rounded-full"
                    >
                        <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                        <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                        <span className="sr-only">Toggle theme</span>
                    </Button>
                </div>

                <Separator />
                <blockquote className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
                    <p className="text-[11px] leading-4 text-foreground/90 italic">
                        « {currentQuote.text} »
                    </p>
                    {currentQuote.author && (
                        <p className="mt-1 text-[10px] leading-4 text-muted-foreground">
                            — {currentQuote.author}
                        </p>
                    )}
                </blockquote>

                <div className="rounded-lg border border-border/60 bg-muted/40 px-3 py-2">
                    <p className="text-[11px] leading-4 text-muted-foreground">
                        Copyright (c) 2026 Jordi Brisbois
                    </p>
                    <p className="text-[11px] leading-4 font-medium text-foreground/80">
                        Licensed under MIT
                    </p>
                </div>
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    );
}

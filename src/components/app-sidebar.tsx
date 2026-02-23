"use client";

import { Briefcase, Heart, Settings, BarChart3, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { usePathname } from "next/navigation";

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

const navItems = [
    { title: "Recherche", url: "/", icon: Briefcase },
    { title: "Favoris", url: "/favorites", icon: Heart },
    { title: "Statistiques", url: "/stats", icon: BarChart3 },
];

export function AppSidebar() {
    const pathname = usePathname();
    const { theme, setTheme } = useTheme();

    return (
        <Sidebar>
            <SidebarHeader className="p-4 border-b">
                <div className="flex items-center gap-2 font-black text-xl text-rose-600">
                    <Briefcase className="w-6 h-6" />
                    <span>FOREM<span className="text-foreground">-idable</span></span>
                </div>
                <p className="text-xs text-muted-foreground font-medium italic mt-1">L'indexeur d'offres décomplexé</p>
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
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    );
}

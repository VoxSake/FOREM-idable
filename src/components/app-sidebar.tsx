"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ForemIdableLogo } from "@/components/branding/ForemIdableLogo";
import {
  FOOTER_NAV_ITEMS,
  type AppSidebarNavItem,
  getSidebarNavItems,
  isSidebarItemActive,
  isSidebarSubItemVisible,
} from "@/components/app-shell.config";
import { AuthSidebarPanel } from "@/components/auth/AuthSidebarPanel";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/button";
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
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

function AppSidebarBrand() {
  return (
    <SidebarHeader className="border-b px-4 py-4">
      <div className="flex items-center">
        <ForemIdableLogo className="h-8" />
      </div>
      <p className="mt-1 text-xs font-medium italic text-muted-foreground">
        L&apos;indexeur d&apos;offres décomplexé
      </p>
    </SidebarHeader>
  );
}

function AppSidebarNavigation({
  pathname,
  items,
}: {
  pathname: string;
  items: AppSidebarNavItem[];
}) {
  return (
    <SidebarMenu>
      {items.map((item) => (
        <SidebarMenuItem key={item.title}>
          <SidebarMenuButton
            asChild
            isActive={isSidebarItemActive(pathname, item.url)}
            className={cn(
              item.accent &&
                "border-transparent bg-primary/5 font-medium text-foreground shadow-none hover:bg-primary/10 dark:bg-primary/10 dark:text-sky-50 dark:hover:bg-primary/15"
            )}
          >
            <Link href={item.url}>
              <item.icon />
              <span>{item.title}</span>
            </Link>
          </SidebarMenuButton>

          {isSidebarSubItemVisible(pathname, item) ? (
            <div className="ml-6 mt-2 flex flex-col gap-1 border-l border-border/70 pl-3">
              {item.children?.map((subItem) => (
                <Link
                  key={subItem.title}
                  href={subItem.url}
                  className="text-sm text-muted-foreground transition hover:text-foreground"
                >
                  {subItem.title}
                </Link>
              ))}
            </div>
          ) : null}
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}

function AppSidebarFooterLinks({ pathname }: { pathname: string }) {
  return (
    <SidebarMenu className="flex-1">
      {FOOTER_NAV_ITEMS.map((item) => (
        <SidebarMenuItem key={item.title}>
          <SidebarMenuButton
            asChild
            isActive={isSidebarItemActive(pathname, item.url)}
            tooltip={item.title}
          >
            <Link href={item.url}>
              <item.icon />
              <span>{item.title}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}

function ThemeToggleButton() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => {
        setTheme(resolvedTheme === "dark" ? "light" : "dark");
      }}
      className="rounded-full"
    >
      <Sun className="rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Changer le thème</span>
    </Button>
  );
}

export function AppSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const navItems = getSidebarNavItems(user?.role);

  return (
    <Sidebar>
      <AppSidebarBrand />

      <SidebarContent className="overflow-x-hidden">
        <SidebarGroup>
          <SidebarGroupLabel>Compte</SidebarGroupLabel>
          <SidebarGroupContent>
            <AuthSidebarPanel />
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <AppSidebarNavigation pathname={pathname} items={navItems} />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-3">
        <div className="flex items-center gap-2">
          <AppSidebarFooterLinks pathname={pathname} />
          <ThemeToggleButton />
        </div>
        <p className="mt-2 px-2 text-[11px] leading-4 text-muted-foreground">
          {runtimeConfig.brand.copyrightName} · FOREM-idable · 2026
        </p>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}

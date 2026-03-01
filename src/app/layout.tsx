import type { Metadata } from "next";
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
import Script from "next/script";
import { ThemeProvider } from "@/components/theme-provider";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ForemIdableLogo } from "@/components/branding/ForemIdableLogo";
import { runtimeConfig } from "@/config/runtime";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const brandFont = Space_Grotesk({
  variable: "--font-brand",
  subsets: ["latin"],
  weight: ["600", "700"],
});

export const metadata: Metadata = {
  title: "FOREM-idable - Indexeur d'offres",
  description: "Recherche d'offres d'emploi du Forem, simplifiée et décomplexée.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const umamiEnabled =
    runtimeConfig.umami.enabled &&
    runtimeConfig.umami.websiteId.length > 0 &&
    runtimeConfig.umami.scriptUrl.length > 0;

  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${brandFont.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <SidebarProvider>
            <AppSidebar />
            <main className="flex-1 overflow-x-hidden flex flex-col w-full min-h-screen">
              <header className="h-14 flex items-center border-b px-4 lg:hidden">
                <SidebarTrigger />
                <ForemIdableLogo className="ml-4 h-7" />
              </header>
              <div className="flex-1 p-4 lg:p-8 bg-muted/10">
                {children}
              </div>
            </main>
          </SidebarProvider>
        </ThemeProvider>
        {umamiEnabled ? (
          <Script
            src={runtimeConfig.umami.scriptUrl}
            data-website-id={runtimeConfig.umami.websiteId}
            strategy="afterInteractive"
          />
        ) : null}
      </body>
    </html>
  );
}

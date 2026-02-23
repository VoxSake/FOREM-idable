import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ForemIdableLogo } from "@/components/branding/ForemIdableLogo";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
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
                <ForemIdableLogo className="ml-4 h-6" />
              </header>
              <div className="flex-1 p-4 lg:p-8 bg-muted/10">
                {children}
              </div>
            </main>
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

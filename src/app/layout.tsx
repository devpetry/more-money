import type { Metadata } from "next";
import localFont from "next/font/local";
import "../styles/globals.css";
import SessionProviderWrapper from "@/components/SessionProviderWrapper";
import { Toaster } from "@/components/feedback/toast";
import { ConfirmProvider } from "@/components/feedback/ConfirmProvider";
import { themeInitScript } from "@/lib/theme";

// Fontes versionadas em src/fonts (OFL): o build não depende de internet
const inter = localFont({
  src: "../fonts/inter/inter-latin-wght.woff2",
  weight: "100 900",
  style: "normal",
  variable: "--font-sans",
  display: "swap",
});

const manrope = localFont({
  src: "../fonts/manrope/manrope-latin-wght.woff2",
  weight: "200 800",
  style: "normal",
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "More Money",
    template: "%s · More Money",
  },
  description: "Gerenciador financeiro",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="pt-BR"
      className={`dark ${inter.variable} ${manrope.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <SessionProviderWrapper>
          <ConfirmProvider>
            {children}
            <Toaster />
          </ConfirmProvider>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}

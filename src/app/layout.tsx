import type { Metadata } from "next";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: "More Money",
  description: "Gerenciador financeiro",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="antialiased bg-[#0D1117] text-[#E0E0E0]">
        {children}
      </body>
    </html>
  );
}
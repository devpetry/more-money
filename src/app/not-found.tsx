import type { Metadata } from "next";
import Link from "next/link";
import { Compass } from "lucide-react";
import PublicShell, { AuthCard } from "@/components/layout/PublicShell";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Página não encontrada" };

export default function NotFound() {
  return (
    <PublicShell>
      <AuthCard
        title="Página não encontrada"
        description="O endereço acessado não existe ou foi movido."
        icon={
          <span className="grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
            <Compass aria-hidden className="size-6" />
          </span>
        }
      >
        <Button asChild size="lg" className="w-full">
          <Link href="/">Ir para o início</Link>
        </Button>
      </AuthCard>
    </PublicShell>
  );
}
